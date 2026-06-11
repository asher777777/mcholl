import fs from 'fs';
import path from 'path';
import admin from 'firebase-admin';

// Parse .env.local manually
const envPath = path.resolve('.env.local');
const envConfig = {};
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf8');
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      envConfig[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, '');
    }
  });
}

const privateKeyBase64 = envConfig.FIREBASE_ADMIN_PRIVATE_KEY_B64;
if (!privateKeyBase64) {
  console.error("No FIREBASE_ADMIN_PRIVATE_KEY_B64 found in .env.local");
  process.exit(1);
}

const privateKey = Buffer.from(privateKeyBase64, 'base64').toString('utf8');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: envConfig.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: envConfig.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: privateKey,
    }),
  });
}

const db = admin.firestore();

// Form template used across pages
const leadForm = {
  enabled: true,
  title: "השאירו פרטים ונחזור אליכם",
  submit_button_text: "אני מעוניין/ת בפרטים נוספים",
  submit_button_bg_color: "#4f46e5",
  submit_button_text_color: "#ffffff",
  fields: [
    { id: "name", type: "text", label: "שם מלא", required: true },
    { id: "phone", type: "tel", label: "טלפון", required: true },
    { id: "email", type: "email", label: "אימייל", required: false }
  ]
};

const pages = [
  {
    id: "landing-page-editor",
    seo: { title: "עורך דפי נחיתה חכם | מחולל הקהילות", description: "מערכת פשוטה וחכמה ליצירת דפי נחיתה ומיני-סייטים להמרות גבוהות." },
    hero: {
      enabled: true,
      title: "עורך דפי נחיתה שמוכר בשבילך",
      subtitle: "להקים עמודי מכירה ב-5 דקות, ללא צורך בידע בקוד.",
      primaryCtaText: "התחל עכשיו בחינם",
      primaryCtaLink: "#landing",
      secondaryCtaText: "צפה בדוגמאות",
      secondaryCtaLink: "#services",
      theme: "charcoal",
      imageSrc: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2015&auto=format&fit=crop"
    },
    landingSection: {
      enabled: true,
      title: "הגיע הזמן לייצר יותר לידים",
      subtitle: "נסה את עורך דפי הנחיתה של מחולל הקהילות",
      description: "הצטרף לאלפי עסקים שכבר משתמשים במערכת כדי לייצר עמודי נחיתה מדהימים ולהכפיל את המכירות.",
      imageSrc: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop",
      form: leadForm,
      theme: "navy",
      layout: "split-left",
      formMode: "visible"
    }
  },
  {
    id: "smart-crm",
    seo: { title: "מערכת CRM חכמה | מחולל הקהילות", description: "ניהול לידים, קשר עם תורמים ולקוחות עם לוגיקה מותאמת אישית." },
    hero: {
      enabled: true,
      title: "כל הלידים שלך, מנוהלים במקום אחד חכם",
      subtitle: "מערכת CRM חכמה שמבינה את העסק שלך ועוזרת לך לסגור יותר עסקאות.",
      primaryCtaText: "קבל הדגמה אישית",
      primaryCtaLink: "#landing",
      theme: "emerald",
      imageSrc: "https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=2070&auto=format&fit=crop"
    },
    landingSection: {
      enabled: true,
      title: "אל תפספס אף לקוח פוטנציאלי",
      subtitle: "CRM חכם שמגדיל מכירות",
      description: "השאר פרטים ונראה לך איך המערכת החכמה שלנו תשנה את דרך העבודה של הצוות שלך.",
      imageSrc: "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?q=80&w=2076&auto=format&fit=crop",
      form: leadForm,
      theme: "violet",
      layout: "split-right",
      formMode: "visible"
    }
  },
  {
    id: "seo-promotion",
    seo: { title: "קידום אורגני (SEO) | מחולל הקהילות", description: "מערכת מאמרים ותוכן לייצור לידים ולקוחות חדשים ממנוע החיפוש של גוגל." },
    hero: {
      enabled: true,
      title: "לכבוש את גוגל עם מערכת SEO מתקדמת",
      subtitle: "בנה בלוג ומערכת תוכן שמביאה לקוחות משלמים היישר מתוצאות החיפוש.",
      primaryCtaText: "התחל לייצר תנועה אורגנית",
      primaryCtaLink: "#landing",
      theme: "rose",
      imageSrc: "https://images.unsplash.com/photo-1432821596592-e2c18b78144f?q=80&w=2070&auto=format&fit=crop"
    },
    landingSection: {
      enabled: true,
      title: "גלה את כוחו של ה-SEO",
      subtitle: "תנועה חינמית שמייצרת כסף",
      description: "קבל ייעוץ אסטרטגי חינם על מערכת התוכן והבלוג שלנו וכיצד היא תזרים אלפי לקוחות לאתר שלך.",
      imageSrc: "https://images.unsplash.com/photo-1562577309-4932fdd64cd1?q=80&w=1974&auto=format&fit=crop",
      form: leadForm,
      theme: "charcoal",
      layout: "split-left",
      formMode: "visible"
    }
  },
  {
    id: "timers-promotions",
    seo: { title: "טיימרים ומבצעים | מחולל הקהילות", description: "מנגנון שיווקי מתקדם להגברת מכירות עם טיימרים סופרים לאחור." },
    hero: {
      enabled: true,
      title: "לייצר תחושת דחיפות שמגדילה המרות",
      subtitle: "מערכת מבצעים חכמה עם טיימרים שמשדרגת כל עמוד נחיתה.",
      primaryCtaText: "גלה כיצד",
      primaryCtaLink: "#landing",
      theme: "violet",
      imageSrc: "https://images.unsplash.com/photo-1495364141860-b0d03eccd065?q=80&w=2076&auto=format&fit=crop"
    },
    timer: {
      enabled: true,
      title: "המבצע המיוחד שלנו מסתיים בקרוב!",
      subtitle: "אל תפספסו את ההזדמנות להגדיל את המכירות שלכם ב-300%",
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      theme: "rose"
    },
    landingSection: {
      enabled: true,
      title: "השעון מתקתק, הלקוחות קונים",
      subtitle: "מערכת המבצעים של מחולל הקהילות",
      description: "הירשמו עכשיו כדי לשלב טיימרים חכמים באסטרטגיית המכירות שלכם.",
      imageSrc: "https://images.unsplash.com/photo-1506784951206-a8fdfc73ab8e?q=80&w=1968&auto=format&fit=crop",
      form: leadForm,
      theme: "navy",
      layout: "split-right",
      formMode: "visible"
    }
  },
  {
    id: "pricing-system",
    seo: { title: "מערכת מחירונים | מחולל הקהילות", description: "הצגת מחירונים חכמים וטבלאות תמחור שניתן להתאים אישית לכל לקוח." },
    hero: {
      enabled: true,
      title: "תמחור חכם שמותאם לקהל שלך",
      subtitle: "טבלאות מחירון וקטלוגים מותאמים אישית לשיפור חווית הלקוח.",
      primaryCtaText: "צפה במערכת התמחור",
      primaryCtaLink: "#landing",
      theme: "emerald",
      imageSrc: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=2070&auto=format&fit=crop"
    },
    landingSection: {
      enabled: true,
      title: "הצג מחירים בצורה שעושה חשק לקנות",
      subtitle: "מערכת תמחור מתקדמת",
      description: "צור מחירונים חכמים שיובילו את הלקוחות שלך לבחור בחבילה שאתה רוצה למכור להם.",
      imageSrc: "https://images.unsplash.com/photo-1580519542036-ed47f3e42d1d?q=80&w=2070&auto=format&fit=crop",
      form: leadForm,
      theme: "charcoal",
      layout: "split-left",
      formMode: "visible"
    }
  },
  {
    id: "news-updates",
    seo: { title: "חדשות ועדכונים | מחולל הקהילות", description: "אזור תצוגה דינמי לשתף את הקהילה בחדשות האחרונות ובאירועים קרובים." },
    hero: {
      enabled: true,
      title: "לשמור את הקהילה תמיד בעניינים",
      subtitle: "מערכת חדשות, עדכונים, ואירועים ששומרת על הלקוחות שלך מחוברים ומעורבים.",
      primaryCtaText: "הקם את בלוג החדשות שלך",
      primaryCtaLink: "#landing",
      theme: "navy",
      imageSrc: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=2070&auto=format&fit=crop"
    },
    landingSection: {
      enabled: true,
      title: "מי שמעורב - קונה יותר",
      subtitle: "בנה קהילה דרך חדשות ועדכונים",
      description: "השאר פרטים ונקים לך מערכת עדכונים שתגביר את המעורבות והמכירות בעסק שלך.",
      imageSrc: "https://images.unsplash.com/photo-1495020689067-958852a7765e?q=80&w=2069&auto=format&fit=crop",
      form: leadForm,
      theme: "emerald",
      layout: "split-right",
      formMode: "visible"
    }
  },
  {
    id: "whatsapp-integrations",
    seo: { title: "אינטגרציות ווצאפ | מחולל הקהילות", description: "חיבור מהיר וחכם למערכות דיוור ורשתות חברתיות להגדלת מעורבות." },
    hero: {
      enabled: true,
      title: "למכור דרך הוואטסאפ כמו מקצוען",
      subtitle: "אינטגרציה מלאה לווצאפ, בוטים ומערכות דיוור כדי להיות איפה שהלקוחות שלך נמצאים.",
      primaryCtaText: "חבר אותי לווצאפ",
      primaryCtaLink: "#landing",
      theme: "charcoal",
      imageSrc: "https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?q=80&w=1974&auto=format&fit=crop"
    },
    landingSection: {
      enabled: true,
      title: "אוטומציה בוואטסאפ שסוגרת עסקאות",
      subtitle: "חיבור חכם וחלק ל-CRM וללקוחות",
      description: "השאר פרטים עכשיו והתחל לדבר עם הלקוחות שלך בצורה אוטומטית וחכמה ישירות לווצאפ.",
      imageSrc: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?q=80&w=1974&auto=format&fit=crop",
      form: leadForm,
      theme: "violet",
      layout: "split-left",
      formMode: "visible"
    }
  },
  {
    id: "campaign-management",
    seo: { title: "ניהול קמפיינים | מחולל הקהילות", description: "בנייה וניהול קמפיינים לגיוס המונים עם מסלולים ומעקבים בזמן אמת." },
    hero: {
      enabled: true,
      title: "לנהל קמפיינים ששוברים יעדים",
      subtitle: "מערכת גיוס המונים וניהול קמפיינים חכמה שקופה בזמן אמת.",
      primaryCtaText: "התחל קמפיין מוצלח",
      primaryCtaLink: "#landing",
      theme: "rose",
      imageSrc: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2015&auto=format&fit=crop"
    },
    landingSection: {
      enabled: true,
      title: "יעדים נועדו כדי לשבור אותם",
      subtitle: "המערכת לניהול קמפיינים לגיוס המונים",
      description: "השאר פרטים ונראה לך איך עמותות ועסקים משתמשים במערכת שלנו כדי לגייס מיליונים.",
      imageSrc: "https://images.unsplash.com/photo-1533750516457-a7f992034fec?q=80&w=2070&auto=format&fit=crop",
      form: leadForm,
      theme: "navy",
      layout: "split-right",
      formMode: "visible"
    }
  }
];

async function seed() {
  const batch = db.batch();
  for (const page of pages) {
    const docRef = db.collection("landing").doc(page.id);
    batch.set(docRef, page);
  }
  await batch.commit();
  console.log("Successfully seeded 8 highly-converting landing pages!");
}

seed().catch(console.error);
