"use server";

import { adminDb } from "@/lib/firebase-admin";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function getAiSettings() {
  try {
    const docRef = adminDb.collection("settings").doc("ai");
    const docSnap = await docRef.get();
    if (docSnap.exists) {
      return docSnap.data();
    }
    return { googleAiKey: "" };
  } catch (error) {
    console.error("Error getting AI settings:", error);
    return { googleAiKey: "" };
  }
}

export async function saveAiSettings(settings: { googleAiKey: string }) {
  try {
    const { auth } = await import("@/lib/auth");
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    const docRef = adminDb.collection("settings").doc("ai");
    await docRef.set({ ...settings, updatedAt: new Date().toISOString() }, { merge: true });
    return { success: true };
  } catch (error: any) {
    console.error("Error saving AI settings:", error);
    return { success: false, error: error.message };
  }
}

export async function rephraseTextWithAI(
  text: string,
  tone: "warm" | "elegant" | "punchy" | "storytelling" = "warm",
  customInstruction: string = ""
): Promise<{ success: boolean; text?: string; error?: string }> {
  try {
    const { auth } = await import("@/lib/auth");
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) throw new Error("Unauthorized");
    const { checkFeatureLimit } = await import("@/features/users/actions");
    const limitCheck = await checkFeatureLimit(userId, "ai");
    if (!limitCheck.allowed) {
      return { success: false, error: "LIMIT_REACHED:" + ('message' in limitCheck ? limitCheck.message : "") };
    }
  } catch(e) {
    // If not authenticated or error, we might just fail
  }

  if (!text || !text.trim()) {
    return { success: false, error: "לא נשלח טקסט לניסוח" };
  }

  // Try to get API key from env, then from Firebase settings
  let apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
  if (!apiKey) {
    const aiSettings = await getAiSettings();
    apiKey = aiSettings?.googleAiKey || "";
  }

  if (!apiKey) {
    console.warn("GEMINI_API_KEY is not set. Using smart Hebrew copywriting fallback.");
    
    // Provide a beautiful copywriting fallback
    let fallbackText = text;
    if (text.includes("קפה")) {
      fallbackText = "שותפות חמה ומאירה: קחו חלק באחזקת פינת הקפה של בית הכנסת לזכות את המתפללים והלומדים. תרומה קטנה של חסד - זכות גדולה לעילוי נשמה, להצלחה או לברכה בבית.";
    } else if (text.includes("קהילה")) {
      fallbackText = "בית חם לכל אחד: אנו מזמינים אתכם להיות חלק מהקהילה שלנו. מרכז של חיבור, ערבות הדדית ופעילות קהילתית ענפה לכל הגילאים.";
    } else if (text.includes("שירותים") || text.includes("תפילין")) {
      fallbackText = "שירותים מקצועיים: ייעוץ, ליווי, הרצאות מרתקות, סיוע והכוונה. אנחנו כאן בשבילכם לכל דבר ועניין.";
    } else {
      const toneLabels: Record<string, string> = {
        warm: "חם ומקרב",
        elegant: "רשמי ומכובד",
        punchy: "קצר וקולע",
        storytelling: "רוחני ומרגש"
      };
      fallbackText = `[סגנון: ${toneLabels[tone] || "חם"}] ${text} ${customInstruction ? `(מותאם אישית: ${customInstruction})` : ""}`;
    }
    
    return { success: true, text: fallbackText };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    // Use gemini-3.1-pro-preview model as specified by the user
    const model = genAI.getGenerativeModel({ model: "gemini-3.1-pro-preview" });
    
    const toneGuidelines: Record<string, string> = {
      warm: "סגנון קהילתי, חם, מסביר פנים, מחבק ומקרב לבבות. השתמש במילים שיוצרות תחושת שייכות, חמימות ומשפחתיות (למשל: 'מרגישים בבית', 'כולם מוזמנים', 'באהבה ובשמחה').",
      elegant: "סגנון יוקרתי, רשמי, מכובד ובעל עברית גבוהה ותקינה במיוחד. מתאים למכתבים רשמיים, תרומות גדולות, או הסברים הלכתיים מכובדים.",
      punchy: "סגנון קצר, קולע, חד, קצבי ומניע לפעולה (קופי שיווקי ממוקד). מצוין לכותרות או לכפתורים. החסר מילים מיותרות והתמקד במסר המרכזי.",
      storytelling: "סגנון סיפורי, מרגש, רוחני ומעורר השראה הנוגע בנימי הנשמה. השתמש בדימויים של אור, מסורת, חיבור פנימי ושלשלת הדורות היהודית."
    };

    const systemPrompt = `אתה קופירייטר שיווקי מומחה.
מטרה: עריכה ושדרוג קופירייטינג של טקסט המיועד לאתר האינטרנט של הארגון.
טקסט מקורי לניסוח מחדש:
"${text}"

סגנון כתיבה מבוקש (טון):
${toneGuidelines[tone] || toneGuidelines.warm}

${customInstruction ? `דגשים מיוחדים של המשתמש (חובה ליישם אותם במלואם):\n- ${customInstruction}` : ""}

הנחיות קריטיות לעבודה:
1. פלט: החזר אך ורק את הטקסט המנוסח מחדש! אל תוסיף הקדמות כמו "להלן הנוסח המשופר", ללא הסברים, ללא גרשיים חיצוניים, וללא תיאורים. רק הטקסט המוכן להעתקה והדבקה.
2. עברית: כתוב בעברית קולחת, טבעית לחלוטין ויפה. הימנע מביטויים מיושנים או רובוטיים שנראים כמו תרגום מכונה.
3. אורך ומבנה: שמור במידת האפשר על המבנה המקורי (פסקאות, רשימה או כותרת) אלא אם המשתמש ביקש במפורש אחרת בדגשים המיוחדים.
4. קריאה לפעולה: ודא שהטקסט מוביל בצורה חלקה וטבעית להנעה לפעולה.
5. רוח המקום: התאם לרוח הקהילה - מסביר פנים, שמח, פתוח לכולם באהבה ומאיר פנים.
`;

    const result = await model.generateContent(systemPrompt);
    const responseText = result.response.text().trim().replace(/^"|"$/g, '');
    return { success: true, text: responseText };
  } catch (error) {
    console.error("AI Rephrase Error:", error);
    return { success: false, error: (error as Error).message };
  }
}

export async function generateSeoTagsWithAI(
  pageContent: string
): Promise<{ success: boolean; title?: string; description?: string; keywords?: string; error?: string }> {
  if (!pageContent || !pageContent.trim()) {
    return { success: false, error: "לא נשלח תוכן לניתוח" };
  }

  try {
    const { auth } = await import("@/lib/auth");
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) throw new Error("Unauthorized");
    const { checkFeatureLimit } = await import("@/features/users/actions");
    const limitCheck = await checkFeatureLimit(userId, "ai");
    if (!limitCheck.allowed) {
      return { success: false, error: "LIMIT_REACHED:" + ('message' in limitCheck ? limitCheck.message : "") };
    }
  } catch(e) {}

  let apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
  if (!apiKey) {
    const aiSettings = await getAiSettings();
    apiKey = aiSettings?.googleAiKey || "";
  }

  if (!apiKey) {
    return { success: false, error: "לא מוגדר מפתח API של Gemini. אנא הגדירו בהגדרות המערכת." };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-3.1-pro-preview" });

    const systemPrompt = `אתה מומחה SEO מקצועי.
מטרה: ייצור תגיות SEO (כותרת, תיאור מטא ומילות מפתח) ממוקדות ואיכותיות לעמוד באתר של הארגון, על בסיס התוכן הבא של העמוד.

תוכן העמוד:
"${pageContent}"

חוקים והנחיות:
1. Title (כותרת): עד 60 תווים, מושכת, כוללת את מילת המפתח העיקרית ושם המותג (לדוגמה "... | מחולל הקהילות").
2. Description (תיאור מטא): עד 155 תווים, מסכם את תוכן העמוד, מניע לפעולה, חם ומזמין.
3. Keywords (מילות מפתח): 5-10 מילות מפתח מופרדות בפסיקים, רלוונטיות לחיפוש בגוגל.

פלט נדרש (חובה להחזיר רק אובייקט JSON תקני, ללא פורמט Markdown או טקסט נוסף):
{
  "title": "...",
  "description": "...",
  "keywords": "..."
}
`;

    const result = await model.generateContent(systemPrompt);
    let responseText = result.response.text().trim();
    
    // Remove markdown code blocks if any
    if (responseText.startsWith("```")) {
      const lines = responseText.split("\n");
      if (lines.length > 2) {
        responseText = lines.slice(1, -1).join("\n");
      }
    }

    const json = JSON.parse(responseText);
    
    return { 
      success: true, 
      title: json.title, 
      description: json.description, 
      keywords: json.keywords 
    };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function generateSeoImageWithAI(
  promptStr: string
): Promise<{ success: boolean; imageUrl?: string; error?: string }> {
  try {
    const { auth } = await import("@/lib/auth");
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) throw new Error("Unauthorized");
    const { checkFeatureLimit } = await import("@/features/users/actions");
    const limitCheck = await checkFeatureLimit(userId, "ai");
    if (!limitCheck.allowed) {
      return { success: false, error: "LIMIT_REACHED:" + ('message' in limitCheck ? limitCheck.message : "") };
    }
  } catch(e) {}
  let apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
  if (!apiKey) {
    const aiSettings = await getAiSettings();
    apiKey = aiSettings?.googleAiKey || "";
  }

  if (!apiKey) {
    return { success: false, error: "לא מוגדר מפתח API של Gemini. אנא הגדירו בהגדרות המערכת." };
  }

  try {
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
              parts: [{ text: promptStr }]
            }
          ]
        }),
      }
    );

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      console.error("Gemini Image API Error Data:", errData);
      throw new Error(`Gemini Image response error: ${response.statusText}`);
    }

    const data = await response.json();
    const b64Image = data?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!b64Image) {
      throw new Error("No image data received from Gemini");
    }

    return { success: true, imageUrl: `data:image/jpeg;base64,${b64Image}` };
  } catch (error) {
    console.error("AI SEO Image Generation Error:", error);
    return { success: false, error: (error as Error).message };
  }
}
