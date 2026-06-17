"use server";

import { adminDb } from "@/lib/firebase-admin";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getAiSettings } from "@/features/ai/actions";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// Helper to get Gemini API client
async function getGeminiModel() {
  let apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
  if (!apiKey) {
    const aiSettings = await getAiSettings();
    apiKey = aiSettings?.googleAiKey || "";
  }
  
  if (!apiKey) {
    throw new Error("מפתח API של Google AI לא הוגדר. אנא הגדר אותו בהגדרות המערכת.");
  }
  
  const genAI = new GoogleGenerativeAI(apiKey);
  // Using the environment-supported gemini-3.1-pro-preview model
  return genAI.getGenerativeModel({ model: "gemini-3.1-pro-preview" });
}

export async function startBrainstormSessionWithAI(generalIdea: string) {
  try {
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    const model = await getGeminiModel();

    const systemPrompt = `אתה יועץ אסטרטגי מומחה להקמת קהילות וארגונים.
המשתמש רוצה להקים קהילה חדשה. הרעיון הראשוני שלו הוא: "${generalIdea}"

מטרתך:
1. לפתוח את שיחת סיור המוחות בברכה חמה ומזמינה בעברית.
2. לשאול 1-2 שאלות מנחות וקצרות כדי לחדד את מהות הקהילה (למשל: מי קהל היעד העיקרי? מה הערך המרכזי של החברים? כיצד ימומן הפרויקט?).
3. להציע 3-4 אפשרויות לתשובה מהירה (Quick Replies) שהמשתמש יוכל ללחוץ עליהן במובייל כדי לענות בקלות.

החזר אך ורק אובייקט JSON תקין בפורמט הבא (ללא תגיות Markdown או הסברים):
{
  "message": "הודעת הפתיחה והשאלות המנחות שלך...",
  "quickReplies": ["תשובה מהירה 1", "תשובה מהירה 2", "תשובה מהירה 3", "תשובה מהירה 4"]
}
`;

    const result = await model.generateContent(systemPrompt);
    let responseText = result.response.text().trim();
    
    if (responseText.startsWith("```")) {
      const lines = responseText.split("\n");
      if (lines.length > 2) responseText = lines.slice(1, -1).join("\n");
    }
    if (responseText.startsWith("json")) {
      responseText = responseText.substring(4).trim();
    }

    return { success: true, data: JSON.parse(responseText) };
  } catch (error: any) {
    console.error("Error starting brainstorm session:", error);
    return { success: false, error: error.message };
  }
}

export async function continueBrainstormWithAI(chatHistory: { role: string; content: string }[], userMessage: string) {
  try {
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    const model = await getGeminiModel();

    const formattedHistory = chatHistory.map(h => `${h.role === 'user' ? 'המשתמש' : 'היועץ (AI)'}: ${h.content}`).join("\n");

    const systemPrompt = `אתה יועץ אסטרטגי מומחה להקמת קהילות וארגונים.
הנה היסטוריית השיחה עד כה:
${formattedHistory}

המשתמש ענה כעת: "${userMessage}"

מטרתך:
1. לנתח את התשובה שלו ולתת פידבק קצר ומעצים.
2. לשאול שאלה מנחה נוספת (עד 2 שאלות לכל היותר) כדי להשלים את הפאזל האסטרטגי (למשל: תפקידים בקהילה, מודל גבייה/תרומות, אירוע פתיחה רצוי).
3. להציע 3-4 אפשרויות לתשובה מהירה (Quick Replies) מתאימות.

אם אתה מרגיש שיש לך מספיק מידע כדי להגדיר אסטרטגיה שלמה (בדרך כלל אחרי 3-4 חילופי דברים), הוסף שדה ב-JSON בשם "readyToFinalize" שערכו true, וכתוב הודעה מסכמת שמזמינה את המשתמש לייצר את האסטרטגיה ולוח הגנט.

החזר אך ורק אובייקט JSON תקין בפורמט הבא (ללא תגיות Markdown או הסברים):
{
  "message": "הודעת התגובה והשאלות הבאות שלך...",
  "quickReplies": ["תשובה מהירה 1", "תשובה מהירה 2", "תשובה מהירה 3"],
  "readyToFinalize": false
}
`;

    const result = await model.generateContent(systemPrompt);
    let responseText = result.response.text().trim();
    
    if (responseText.startsWith("```")) {
      const lines = responseText.split("\n");
      if (lines.length > 2) responseText = lines.slice(1, -1).join("\n");
    }
    if (responseText.startsWith("json")) {
      responseText = responseText.substring(4).trim();
    }

    return { success: true, data: JSON.parse(responseText) };
  } catch (error: any) {
    console.error("Error continuing brainstorm session:", error);
    return { success: false, error: error.message };
  }
}

export async function finalizeCommunityStrategyWithAI(chatHistory: { role: string; content: string }[]) {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");
    const ownerId = session.user.id;

    const model = await getGeminiModel();
    const formattedHistory = chatHistory.map(h => `${h.role === 'user' ? 'המשתמש' : 'היועץ (AI)'}: ${h.content}`).join("\n");

    const todayStr = new Date().toISOString().split('T')[0];

    const systemPrompt = `אתה יועץ אסטרטגי ובונה מערכות לניהול קהילות.
על בסיס סיור המוחות הבא, עליך לייצר אסטרטגיה שלמה, לוח גנט (רשימת משימות עם תאריכים), תפקידים, הגדרות גבייה, דף נחיתה ואוטומציות.

הנה סיור המוחות המלא:
${formattedHistory}

התאריך היום הוא: ${todayStr}

עליך להחזיר אובייקט JSON המכיל את כל הנתונים הדרושים להקמת הקהילה מ-0.
הנחיות קריטיות לייצור משימות גנט (Tasks):
1. הגדר 5-7 משימות עיקריות בלוח הגנט המייצגות את שלבי ההקמה של הקהילה.
2. לכל משימה הגדר תאריך התחלה (startDate) ותאריך סיום (dueDate) בפורמט YYYY-MM-DD.
3. המשימה הראשונה צריכה להתחיל היום (${todayStr}). המשימות הבאות צריכות להתפרס על פני השבועות הקרובים באופן הגיוני וכרונולוגי (למשל, משימה 1 מתחילה היום ומסתיימת בעוד שבוע; משימה 2 מתחילה בעוד שבוע ומסתיימת בעוד שבועיים וכך הלאה).
4. שייך כל משימה לאחד מבעלי התפקידים שאתה מציע (assignedRole).

הנחיות לייצור אוטומציות (Automations):
1. שייך לפחות 2 אוטומציות למשימות הגנט.
2. הגדר לכל אוטומציה שם (name), טריגר (trigger) מסוג "specific_date" (למשל, יומיים לפני תאריך ההתחלה של משימה מסוימת), וצעדי ביצוע (steps) כמו שליחת וואטסאפ (whatsapp_send) לבעל התפקיד.

הנחיות לייצור דף נחיתה (landingPage):
ייצר אובייקט הגדרות מלא התואם למבנה ה-HomePageConfig הקיים במערכת (כולל hero, mainContent, services, contact, richContent, sectionOrder). כתוב תוכן עשיר ומזמין בעברית המתאים לקהילה שסוכמה.

החזר אך ורק אובייקט JSON תקין בפורמט הבא (ללא תגיות Markdown או הסברים):
{
  "name": "שם הקהילה המוצעת",
  "vision": "חזון הקהילה ומטרתה המרכזית",
  "goals": [
    { "id": "g1", "title": "הגדרת מטרה 1", "timeframe": "טווח קצר / בינוני / ארוך" }
  ],
  "roles": [
    { "name": "שם התפקיד (למשל: מנהל קהילה)", "responsibilities": "תיאור תחומי האחריות" }
  ],
  "tasks": [
    {
      "id": "t1",
      "title": "כותרת המשימה בגנט",
      "description": "תיאור מפורט של המשימה",
      "startDate": "YYYY-MM-DD",
      "dueDate": "YYYY-MM-DD",
      "assignedRole": "שם התפקיד האחראי",
      "status": "pending"
    }
  ],
  "automations": [
    {
      "name": "תזכורת להתחלת משימה X",
      "trigger": { "type": "specific_date", "dateIso": "YYYY-MM-DDTHH:MM:SSZ (תאריך ושעה מדויקים יומיים לפני תחילת המשימה)" },
      "steps": [
        {
          "type": "whatsapp_send",
          "config": {
            "phoneField": "0540000000 (מספר מדומה או שדה דינמי)",
            "messageTemplate": "שלום {{שם_תפקיד}}, משימת הגנט '{{שם_משימה}}' מתחילה בעוד יומיים. אנא היערך בהתאם."
          }
        }
      ]
    }
  ],
  "landingPage": {
    "hero": {
      "title": "כותרת ראשית לעמוד",
      "subtitle": "כותרת משנה",
      "description": "תיאור ארוך ומזמין",
      "layout": "fz"
    },
    "services": {
      "visible": true,
      "title": "השירותים והפעילויות שלנו",
      "layout": "grid",
      "items": [
        { "id": "s1", "title": "פעילות 1", "description": "תיאור קצר", "icon": "Users", "isVisible": true }
      ]
    },
    "contact": {
      "visible": true,
      "title": "הצטרפו אלינו",
      "form": {
        "enabled": true,
        "submit_button_text": "שליחה",
        "fields": [
          { "label": "שם מלא", "type": "text", "map_to": "conta_name", "required": true }
        ]
      }
    },
    "sectionOrder": ["hero", "services", "contact"]
  }
}
`;

    const result = await model.generateContent(systemPrompt);
    let responseText = result.response.text().trim();
    
    if (responseText.startsWith("```")) {
      const lines = responseText.split("\n");
      if (lines.length > 2) responseText = lines.slice(1, -1).join("\n");
    }
    if (responseText.startsWith("json")) {
      responseText = responseText.substring(4).trim();
    }

    const data = JSON.parse(responseText);
    return { success: true, data };
  } catch (error: any) {
    console.error("Error finalizing community strategy:", error);
    return { success: false, error: error.message };
  }
}

export async function createCommunityInDatabase(communityData: any) {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");
    const ownerId = session.user.id;

    console.log("Creating community configuration in database for owner:", ownerId);

    // 1. Create Community strategy doc
    const communityRef = await adminDb.collection("communities").add({
      ownerId,
      name: communityData.name,
      vision: communityData.vision,
      goals: communityData.goals || [],
      roles: communityData.roles || [],
      createdAt: new Date().toISOString(),
      status: "active"
    });

    const communityId = communityRef.id;

    // 2. Create tasks/projects in Gantt
    const generatedTaskIdsMap: Record<string, string> = {};
    if (communityData.tasks && Array.isArray(communityData.tasks)) {
      for (const t of communityData.tasks) {
        const taskRef = await adminDb.collection("tasks").add({
          ownerId,
          communityId,
          title: t.title,
          description: t.description || "",
          startDate: t.startDate || new Date().toISOString().split('T')[0],
          dueDate: t.dueDate || new Date().toISOString().split('T')[0],
          assignedRole: t.assignedRole || "מנהל",
          status: t.status || "pending",
          createdAt: new Date().toISOString()
        });
        generatedTaskIdsMap[t.id] = taskRef.id;
      }
    }

    // 3. Create Automations
    if (communityData.automations && Array.isArray(communityData.automations)) {
      for (const auto of communityData.automations) {
        await adminDb.collection("automations").add({
          ownerId,
          communityId,
          name: auto.name,
          isActive: true,
          trigger: auto.trigger,
          steps: auto.steps || [],
          createdAt: new Date().toISOString()
        });
      }
    }

    // 4. Create Community Landing page
    if (communityData.landingPage) {
      // Slug is generated from community name
      const slug = communityData.name
        .toLowerCase()
        .replace(/[^a-z0-9א-ת-]/g, "")
        .replace(/\s+/g, "-");
      
      const { savePageConfig } = await import("@/features/home/actions");
      await savePageConfig("services", slug, {
        ...communityData.landingPage,
        communityId
      });
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/services");

    return { success: true, communityId };
  } catch (error: any) {
    console.error("Error creating community in database:", error);
    return { success: false, error: error.message };
  }
}
