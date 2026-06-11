"use server";

import { adminDb, adminStorage } from "@/lib/firebase-admin";
import admin from "firebase-admin";
const { FieldValue } = admin.firestore;
import { GoogleGenerativeAI } from "@google/generative-ai";
import { revalidatePath } from "next/cache";
import { getAiSettings } from "@/features/ai/actions";
import { auth } from "@/lib/auth";
import { addMediaToLibrary } from "@/features/media/actions";


export async function getServicePage(slug: string) {
  try {
    const docRef = adminDb.collection("services").doc(slug);
    const docSnap = await docRef.get();
    
    if (docSnap.exists) {
      return { ...docSnap.data(), slug: docSnap.id } as any;
    }
    return null;
  } catch (error) {
    console.warn(`Error fetching service content for ${slug}:`, (error as Error).message);
    return null;
  }
}

export async function getAllServices() {
  try {
    const [servicesSnap, landingSnap, postsSnap] = await Promise.all([
      adminDb.collection("services").get(),
      adminDb.collection("landing").get(),
      adminDb.collection("posts").get()
    ]);
    
    const services = servicesSnap.docs.map((doc: any) => ({
      ...doc.data(),
      slug: doc.id,
      type: "service"
    })) as any[];
    
    const landingPages = landingSnap.docs.map((doc: any) => ({
      ...doc.data(),
      slug: doc.id,
      type: "landing"
    })) as any[];

    const posts = postsSnap.docs.map((doc: any) => ({
      ...doc.data(),
      slug: doc.id,
      type: "post"
    })) as any[];
    
    return [...services, ...landingPages, ...posts];
  } catch (error) {
    console.warn("Error fetching all services:", (error as Error).message);
    return [];
  }
}

export async function saveServicePage(slug: string, content: any) {
  try {
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");
    
    const cleanContent = JSON.parse(JSON.stringify(content));
    const docRef = adminDb.collection("services").doc(slug);
    await docRef.set({ ...cleanContent, updatedAt: new Date().toISOString() }, { merge: true });
    revalidatePath(`/service/${slug}`);
    revalidatePath(`/services/${slug}`);
    revalidatePath(`/landing/${slug}`);
    revalidatePath("/dashboard/services");
    return { success: true };
  } catch (error: any) {
    console.error(`Error saving service content for ${slug}:`, error);
    throw new Error(error.message || "Failed to save to Firebase");
  }
}

export async function incrementPageView(slug: string) {
  try {
    const serviceRef = adminDb.collection("services").doc(slug);
    await serviceRef.set({
      views: FieldValue.increment(1)
    }, { merge: true });
    return { success: true };
  } catch (error) {
    console.error(`Error incrementing views for ${slug}:`, error);
    return { success: false };
  }
}

export async function deleteServicePage(slug: string, type: string = 'service') {
  try {
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");
    
    const collectionName = type === 'landing' ? 'landing' : (type === 'post' ? 'posts' : 'services');
    await adminDb.collection(collectionName).doc(slug).delete();
    revalidatePath(`/dashboard/services`);
    return { success: true };
  } catch (error: any) {
    console.error(`Error deleting content for ${slug}:`, error);
    throw new Error(error.message || "Failed to delete from Firebase");
  }
}

export async function generatePageWithAI(prompt: string, slug: string, type: 'service' | 'landing' | 'post', tone: string = 'רגיל', audience: string = 'כולם', selectedSections: string[] = ['hero', 'services', 'contact']) {
  try {
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    // Try to get API key from env, then from Firebase settings
    let apiKey = process.env.GEMINI_API_KEY || "";
    if (!apiKey) {
      const aiSettings = await getAiSettings();
      apiKey = aiSettings?.googleAiKey || "";
    }
    
    if (!apiKey) {
      throw new Error("מפתח API של Google AI לא הוגדר. אנא הגדר אותו בדף ההגדרות בלוח הבקרה או בקובץ ה-env.");
    }
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-3.1-pro" });

    const selectedSectionsList = selectedSections.join(", ");

    let systemPrompt = `You are an expert copywriter and web designer for the number one digital systems and software company. Your goal is to produce extremely high-quality, engaging, professional, and convincing Hebrew content.
Task: Generate the JSON content for a new page based on the user's prompt.
Target Audience: ${audience}
Tone of Voice: ${tone}
Page Type: ${type}
User Selected Sections: ${selectedSectionsList}

CRITICAL RULES FOR CONTENT QUALITY & PLACEHOLDERS:
1. Write compelling, human-like Hebrew text. Avoid robotic phrasing. Use rich vocabulary suited for the requested Tone of Voice.
2. If the user's prompt lacks specific details for a certain field, DO NOT leave it blank. Instead, use a generic placeholder sentence in Hebrew (e.g., "כאן יופיע תיאור קצר ומושך על הפעילות שלנו...", "טקסט מורחב על החוויה...", "כותרת ראשית מרשימה").
3. Ensure every section has enough text to look good visually. A paragraph should be at least 2-3 sentences.

CRITICAL RULES FOR REGIONS (SECTIONS) VISIBILITY:
1. ONLY the sections listed in "User Selected Sections" (${selectedSectionsList}) should have \`visible: true\`.
2. ALL other sections MUST have \`visible: false\`.
3. You must completely ignore the default layout rules if they contradict the user's selected sections. The user explicitly chose what to show!

SECTION ORDER RULE (CRITICAL):
You MUST provide a "sectionOrder" array containing exactly these section keys: "hero", "mainContent", "services", "community", "livePosts", "contact", "landingSection", "richContent", "pricing", "timer".
You MUST order this array so that ALL sections with visible=true appear first, and ALL sections with visible=false appear AT THE VERY BOTTOM of the array.

FORM CONFIG RULE:
For sections with forms (contact or landingSection) that are visible, provide a custom "form" object. Set submit_button_text, submit_button_bg_color, and fields (label, type, map_to, required).

JSON Structure Example:
{
  "seo": { "title": "SEO Title", "description": "SEO Description" },
  "hero": { "title": "...", "subtitle": "...", "description": "...", "layout": "spatial", "buttonsVisible": true, "primaryButton": { "text": "...", "link": "..." } },
  "mainContent": { "visible": true, "title": "...", "description": "...", "layout": "bento" },
  "services": { "visible": true, "title": "...", "layout": "grid", "items": [{"id":"1", "title":"...", "description":"...", "icon":"Star", "url":"#", "isVisible":true}] },
  "community": { "visible": true, "title": "...", "description": "...", "quote": "...", "layout": "centered", "badgeVisible": false, "buttonVisible": false },
  "livePosts": { "visible": true, "layout": "grid" },
  "contact": { "visible": true, "title": "...", "form": { "enabled": true, "submit_button_text": "שלח", "fields": [] } },
  "landingSection": { "visible": true, "title": "...", "description": "...", "layout": "split-left", "formMode": "visible", "form": { "enabled": true, "submit_button_text": "הירשם", "fields": [] } },
  "richContent": { "visible": true, "heading": "...", "body": "<p>...</p>", "layout": "center" },
  "pricing": { "visible": false, "title": "...", "layout": "grid" },
  "timer": { "visible": false, "title": "...", "date": "2024-12-31" },
  "sectionOrder": ["hero", "richContent", "services", "contact", "mainContent", "community", "landingSection", "livePosts", "pricing", "timer"],
  "imagePrompt": "English prompt for cover image."
}
Return ONLY the JSON. No markdown, no comments.`;

    const result = await model.generateContent([systemPrompt, prompt]);
    const responseText = result.response.text().trim().replace(/^```json/, '').replace(/```$/, '').trim();
    
    const generatedData = JSON.parse(responseText);
    
    let imageUrl = "/placeholder.png";
    let imagePrompt = generatedData.imagePrompt || `Professional high quality modern tech photograph of ${generatedData.hero?.title || slug} for a top digital systems company website, innovative atmosphere, sleek lighting, photorealistic, 16:9 aspect ratio`;

    if (imagePrompt) {
      try {
        const imageResult = await generateHeroImageWithAI(imagePrompt);
        if (imageResult.success && imageResult.url) {
          imageUrl = imageResult.url;
        }
      } catch (err) {
        console.warn("Failed to generate custom image, falling back to placeholder.", err);
      }
    }

    if (generatedData.hero) {
      generatedData.hero.imageSrc = imageUrl;
    }

    const collectionMap = {
      'service': 'services',
      'landing': 'landing',
      'post': 'posts'
    };
    
    const collectionName = collectionMap[type] || 'pages';

    const { savePageConfig } = await import("@/features/home/actions");
    await savePageConfig(collectionName, slug, generatedData);
    
    return { success: true, type, slug };
  } catch (error: any) {
    console.warn("AI Page Generation failed:", error.message);
    return { success: false, error: error.message };
  }
}

export async function generateServiceWithAI(prompt: string, slug: string) {
  return generatePageWithAI(prompt, slug, 'service');
}

export async function generateHeroImageWithAI(prompt: string) {
  try {
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    let apiKey = process.env.GEMINI_API_KEY || "";
    if (!apiKey) {
      const aiSettings = await getAiSettings();
      apiKey = aiSettings?.googleAiKey || "";
    }
    
    if (!apiKey) {
      throw new Error("מפתח API של Google AI לא הוגדר. אנא הגדר אותו בדף ההגדרות בלוח הבקרה.");
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-3.1-flash-image:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }]
            }
          ]
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMsg = errorData.error?.message || response.statusText;
      
      if (response.status === 429 || String(errorMsg).includes("Resource exhausted") || String(errorMsg).includes("quota")) {
        throw new Error("הגענו למגבלת השימוש (מכסה) של מחולל התמונות של גוגל. אנא נסה שוב מאוחר יותר או הגדל את מכסת ה-API (Quota) במסוף של גוגל קלאוד.");
      }

      throw new Error(`שגיאה ממחולל התמונות של גוגל: ${errorMsg}`);
    }

    const data = await response.json();
    const base64Image = data?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Image) {
      throw new Error("לא התקבלה תמונה תקינה מהשרת.");
    }

    const { adminStorage } = await import("@/lib/firebase-admin");

    // Save to firebase admin storage
    const bucket = adminStorage.bucket();
    console.log("USING BUCKET NAME:", bucket.name);
    const fileName = `generated_${Date.now()}.jpg`;
    const file = bucket.file(`media/${fileName}`);
    const buffer = Buffer.from(base64Image, "base64");

    await file.save(buffer, {
      metadata: {
        contentType: "image/jpeg",
      },
    });

    // Get signed URL with long expiration (essentially a permanent public download link)
    const urls = await file.getSignedUrl({
      action: 'read',
      expires: '03-09-2491', // far-future date
    });
    const imageUrl = urls[0];

    // Add to the media library so it is visible in the gallery
    await addMediaToLibrary(imageUrl, `AI Hero: ${prompt.slice(0, 30)}`);

    return { success: true, url: imageUrl };
  } catch (error: any) {
    console.error("Image generation action failed:", error);
    return { success: false, error: error.message || "שגיאה לא ידועה" };
  }
}
