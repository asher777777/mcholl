"use server";

import { adminDb } from "@/lib/firebase-admin";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";

import type { FormConfig } from "@/features/crm/components/CRMFormBuilder";

export interface ButtonConfig {
  text: string;
  link: string;
}

export interface ServiceItem {
  id: string;
  title: string;
  description: string;
  url: string;
  icon: string;
  imageSrc?: string;
  isVisible: boolean;
}

export interface PricingPackage {
  id: string;
  title: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  buttonText: string;
  buttonLink: string;
  isPopular?: boolean;
}

export interface HomePageConfig {
  hero: {
    title: string;
    subtitle: string;
    description: string;
    imageSrc: string;
    layout: "fz" | "bento" | "modular" | "progressive" | "spatial" | "thumb";
    buttonsVisible?: boolean;
    primaryButton?: ButtonConfig;
    secondaryButton?: ButtonConfig;
    anchorId?: string;
    backgroundColor?: string;
    hoverColor?: string;
  };
  mainContent: {
    visible: boolean;
    title: string;
    subtitle: string;
    description: string;
    imageSrc: string;
    layout: "fz" | "bento" | "modular" | "progressive" | "spatial" | "thumb";
    buttonsVisible?: boolean;
    primaryButton?: ButtonConfig;
    secondaryButton?: ButtonConfig;
    anchorId?: string;
    backgroundColor?: string;
    hoverColor?: string;
  };
  services: {
    title?: string;
    description?: string;
    layout: "grid" | "carousel" | "image-card" | "hover-card";
    effect?: "none" | "zoom" | "lift" | "glow";
    columns?: number;
    visible: boolean;
    items?: ServiceItem[];
    anchorId?: string;
    backgroundColor?: string;
    hoverColor?: string;
  };
  community: {
    visible: boolean;
    title: string;
    subtitle: string;
    description: string;
    quote: string;
    imageSrc: string;
    badgeTitle: string;
    badgeSubtitle: string;
    buttonText: string;
    whatsappNumber: string;
    layout: "split-left" | "split-right" | "centered";
    badgeVisible: boolean;
    buttonVisible: boolean;
    anchorId?: string;
    backgroundColor?: string;
    hoverColor?: string;
  };
  livePosts: {
    visible: boolean;
    layout?: "grid" | "carousel" | "list" | "bento";
    customPages?: string[];
    anchorId?: string;
    backgroundColor?: string;
    hoverColor?: string;
  };
  contact: {
    visible: boolean;
    title?: string;
    subtitle?: string;
    addressLabel?: string;
    addressVal?: string;
    phoneLabel?: string;
    phoneVal?: string;
    hoursLabel?: string;
    hoursVal?: string;
    form?: FormConfig;
    anchorId?: string;
    backgroundColor?: string;
    hoverColor?: string;
  };
  landingSection?: {
    visible: boolean;
    title: string;
    subtitle: string;
    description: string;
    imageSrc: string;
    form: FormConfig;
    layout?: "split-left" | "split-right";
    formMode?: "visible" | "modal";
    buttonText?: string;
    anchorId?: string;
    backgroundColor?: string;
    hoverColor?: string;
  };
  richContent?: {
    visible: boolean;
    heading: string;
    body: string;
    layout: "center" | "two-column" | "grid";
    anchorId?: string;
    backgroundColor?: string;
    hoverColor?: string;
  };
  timer?: {
    visible: boolean;
    title: string;
    subtitle: string;
    targetDate: string;
    layout: "classic" | "modern" | "compact";
    anchorId?: string;
    backgroundColor?: string;
    hoverColor?: string;
  };
  pricing?: {
    visible: boolean;
    title: string;
    subtitle: string;
    description?: string;
    anchorId?: string;
    backgroundColor?: string;
    hoverColor?: string;
    packages?: PricingPackage[];
  };
  mobileHiddenSections?: string[];
  sectionOrder: string[];
  seo?: {
    title: string;
    description: string;
    keywords?: string;
    image?: string;
  };
}

const DEFAULT_FORM_CONFIG: FormConfig = {
  enabled: true,
  form_type: "standard",
  submit_button_text: "שלח פנייה",
  submit_button_bg_color: "#25D366",
  submit_button_text_color: "#ffffff",
  fields: [
    {
      label: "שם מלא",
      type: "text",
      map_to: "conta_name",
      required: true,
      default_value: "",
      options: "",
      url_param_enable: false,
      url_param_name: "",
      cond_enable: false,
      cond_field_index: 0,
      cond_operator: "is",
      cond_value: ""
    },
    {
      label: "מספר טלפון נייד",
      type: "tel",
      map_to: "conta_phone",
      required: true,
      default_value: "",
      options: "",
      url_param_enable: false,
      url_param_name: "",
      cond_enable: false,
      cond_field_index: 0,
      cond_operator: "is",
      cond_value: ""
    },
    {
      label: "כתובת אימייל",
      type: "email",
      map_to: "email",
      required: false,
      default_value: "",
      options: "",
      url_param_enable: false,
      url_param_name: "",
      cond_enable: false,
      cond_field_index: 0,
      cond_operator: "is",
      cond_value: ""
    }
  ],
  save_to_crm: true,
  crm_owner_id: "1",
  standard_success_message: "הבקשה התקבלה בהצלחה! תודה רבה לך.",
  standard_redirect_url: "",
  standard_whatsapp_message: "שלום {שם מלא}, תודה על פנייתך. פרטייך התקבלו במערכת.",
  standard_whatsapp_image_url: "",
  payment_amount: 180,
  payment_amount_crm_map: "tg2",
  payment_pending_message: "שלום {שם מלא}, ההזמנה שלך ל{עמוד} בסך {סכום} ש\"ח נוצרה וממתינה לתשלום.",
  payment_pending_image_url: "",
  payment_success_message: "שלום {שם מלא}, תודה רבה! התשלום בסך {סכום} ש\"ח עבור {עמוד} התקבל בהצלחה.",
  payment_success_image_url: "",
  payment_group: "",
  payment_zeut_kupa: "",
  payment_receipt_type: "",
  payment_frequency: "one-time"
};


const DEFAULT_CONTACT_FORM_CONFIG: FormConfig = {
  enabled: true,
  form_type: "standard",
  submit_button_text: "שליחת הודעה",
  submit_button_bg_color: "#e28743",
  submit_button_text_color: "#ffffff",
  fields: [
    {
      label: "שם מלא",
      type: "text",
      map_to: "conta_name",
      required: true,
      default_value: "",
      options: "",
      url_param_enable: false,
      url_param_name: "",
      cond_enable: false,
      cond_field_index: 0,
      cond_operator: "is",
      cond_value: ""
    },
    {
      label: "טלפון",
      type: "tel",
      map_to: "conta_phone",
      required: true,
      default_value: "",
      options: "",
      url_param_enable: false,
      url_param_name: "",
      cond_enable: false,
      cond_field_index: 0,
      cond_operator: "is",
      cond_value: ""
    },
    {
      label: "דוא\"ל",
      type: "email",
      map_to: "email",
      required: false,
      default_value: "",
      options: "",
      url_param_enable: false,
      url_param_name: "",
      cond_enable: false,
      cond_field_index: 0,
      cond_operator: "is",
      cond_value: ""
    },
    {
      label: "איך נוכל לעזור?",
      type: "textarea",
      map_to: "notes",
      required: false,
      default_value: "",
      options: "",
      url_param_enable: false,
      url_param_name: "",
      cond_enable: false,
      cond_field_index: 0,
      cond_operator: "is",
      cond_value: ""
    }
  ],
  save_to_crm: true,
  crm_owner_id: "1",
  standard_success_message: "ההודעה התקבלה בהצלחה! נחזור אליכם בהקדם.",
  standard_redirect_url: "",
  standard_whatsapp_message: "שלום {שם מלא}, תודה על פנייתך. ההודעה התקבלה במערכת בית חב\"ד.",
  standard_whatsapp_image_url: "",
  payment_amount: 180,
  payment_amount_crm_map: "tg2",
  payment_pending_message: "",
  payment_pending_image_url: "",
  payment_success_message: "",
  payment_success_image_url: "",
  payment_group: "",
  payment_zeut_kupa: "",
  payment_receipt_type: "",
  payment_frequency: "one-time"
};

const DEFAULT_HOME_CONFIG: HomePageConfig = {
  hero: {
    title: "מחולל הקהילות",
    subtitle: "המערכת המובילה לניהול ושיווק",
    description: "כל הכלים הדיגיטליים שאתה צריך כדי לנהל את הקהילה שלך, לגייס משאבים, ולצמוח בצורה חכמה ויעילה.",
    imageSrc: "/placeholder.png",
    layout: "fz",
    buttonsVisible: true,
    primaryButton: { text: "צפה בשירותים", link: "/services" },
    secondaryButton: { text: "צור קשר", link: "/contact" },
  },
  mainContent: {
    visible: true,
    title: "הפעילות שלנו במרכז",
    subtitle: "כלים חכמים לעמותות וארגונים",
    description: "מערכת מקיפה הכוללת עמודי נחיתה, ניהול CRM מתקדם, קמפיינים חכמים, וכל מה שדרוש לניהול ארגון מודרני.",
    imageSrc: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?q=80&w=1200&auto=format&fit=crop",
    layout: "bento",
    buttonsVisible: true,
    primaryButton: { text: "קרא עוד", link: "/services" },
    secondaryButton: { text: "הצטרף עכשיו", link: "/contact" },
  },
  services: {
    title: "השירותים והכלים שלנו",
    description: "פלטפורמה אחת חכמה המאגדת את כל צרכי הניהול שלכם.",
    layout: "grid",
    visible: true,
    items: [
      { id: "1", title: "עורך דפי נחיתה", description: "מערכת פשוטה וחכמה ליצירת דפי נחיתה ומיני-סייטים להמרות גבוהות.", icon: "LayoutTemplate", url: "/service/landing-pages", isVisible: true },
      { id: "2", title: "מערכת CRM חכמה", description: "ניהול לידים, קשר עם תורמים, בניית טפסים חכמים ולוגיקה מותאמת אישית.", icon: "Users", url: "/service/crm", isVisible: true },
      { id: "3", title: "קידום אורגני (SEO)", description: "מערכת מאמרים ותוכן לייצור לידים ולקוחות חדשים ממנוע החיפוש של גוגל.", icon: "Search", url: "/service/seo", isVisible: true },
      { id: "4", title: "טיימרים ומבצעים", description: "מנגנון שיווקי מתקדם להגברת מכירות עם טיימרים סופרים לאחור.", icon: "Clock", url: "/service/timers", isVisible: true },
      { id: "5", title: "מערכת מחירונים", description: "הצגת מחירונים חכמים וטבלאות תמחור שניתן להתאים אישית לכל לקוח.", icon: "CreditCard", url: "/service/pricing", isVisible: true },
      { id: "6", title: "חדשות ועדכונים", description: "אזור תצוגה דינמי לשתף את הקהילה בחדשות האחרונות ובאירועים קרובים.", icon: "Newspaper", url: "/service/updates", isVisible: true },
      { id: "7", title: "אינטגרציות ווצאפ", description: "חיבור מהיר וחכם למערכות דיוור ורשתות חברתיות להגדלת מעורבות.", icon: "MessageCircle", url: "/service/integrations", isVisible: true },
      { id: "8", title: "ניהול קמפיינים", description: "בנייה וניהול קמפיינים לגיוס המונים עם מסלולים ומעקבים בזמן אמת.", icon: "TrendingUp", url: "/service/campaigns", isVisible: true },
    ]
  },
  community: {
    visible: true,
    title: "הקהילה שלך <span class=\"text-secondary\">במרכז</span>",
    subtitle: "",
    description: "אנחנו מספקים את התשתית הדיגיטלית, אתם בונים קהילה משגשגת ופעילה. אלפי מנהלים כבר נעזרים בכלים שלנו כדי להגיע לתוצאות טובות יותר.",
    quote: "\"המעבר למערכת חכמה חסך לנו שעות של עבודה ידנית והכפיל את המעורבות בקהילה.\"",
    imageSrc: "/images/shaliach-family.png",
    badgeTitle: "תמיכה צמודה",
    badgeSubtitle: "הצוות שלנו תמיד כאן",
    buttonText: "דברו איתנו ב-WhatsApp",
    whatsappNumber: "972545947701",
    layout: "split-left",
    badgeVisible: true,
    buttonVisible: true,
  },
  livePosts: {
    visible: true,
    layout: "grid",
    customPages: [],
  },
  contact: {
    visible: true,
    title: "נשמח לשמוע ממך",
    subtitle: "יש לכם שאלה? צריכים עזרה עם המערכת? השאירו פרטים ונחזור אליכם בהקדם.",
    addressLabel: "כתובתנו",
    addressVal: "רחוב החדשנות 1, אזור ההייטק",
    phoneLabel: "טלפון",
    phoneVal: "054-000-0000",
    hoursLabel: "שעות פעילות",
    hoursVal: "א'-ה' 09:00-18:00",
    form: DEFAULT_CONTACT_FORM_CONFIG,
  },
  landingSection: {
    visible: true,
    title: "קמפיין גיוס והתרמה חכם",
    subtitle: "גיוס המונים ומכירות עם טופס תשלום חכם ומאובטח.",
    description: "צרו דפי נחיתה אינטראקטיביים שיעזרו לכם להגיע ליעדי הגיוס שלכם ביעילות, עם מעקב המרות וניהול תורמים מובנה.",
    imageSrc: "/placeholder.png",
    form: DEFAULT_FORM_CONFIG,
    layout: "split-left",
    formMode: "visible",
    buttonText: "לפרטים והרשמה",
  },
  richContent: {
    visible: true,
    heading: "פלטפורמה המותאמת לצרכים שלכם",
    body: "כל ארגון הוא שונה, ולכן בנינו מערכת מודולרית שניתן להתאים בדיוק למידותיכם. העורך המתקדם שלנו מאפשר לכם לבחור אילו כלים להציג, לשנות את סדר האזורים ולהתאים את העיצוב למותג שלכם. בעזרת הפתרונות שלנו, הקהילה שלכם מקבלת את החוויה הדיגיטלית הטובה ביותר, בזמן שאתם מתפנים להתמקד במה שבאמת חשוב - העשייה עצמה.",
    layout: "center",
  },
  timer: {
    visible: false,
    title: "הזמן אוזל!",
    subtitle: "מהרו להירשם לפני סיום ההרשמה",
    targetDate: new Date(Date.now() + 86400000).toISOString(),
    layout: "classic",
  },
  pricing: {
    visible: true,
    title: "חבילות ומחירים",
    subtitle: "בחר את החבילה המתאימה לך",
    description: "כל החבילות כוללות תמיכה מלאה וגישה לכלים המתקדמים שלנו.",
    packages: [
      {
        id: "basic",
        title: "בסיסי",
        price: "₪199",
        period: "/חודש",
        description: "מעולה לקהילות מתחילות.",
        features: ["עד 500 חברי קהילה", "CRM בסיסי", "5 עמודי נחיתה"],
        buttonText: "בחר בחבילה זו",
        buttonLink: "/checkout?plan=basic",
      },
      {
        id: "pro",
        title: "מקצועי",
        price: "₪399",
        period: "/חודש",
        description: "לקהילות צומחות שרוצות יותר.",
        features: ["עד 2000 חברי קהילה", "CRM מתקדם + אוטומציות", "עמודי נחיתה ללא הגבלה", "מודול שיווק תוכן מלא"],
        buttonText: "בחר בחבילה זו",
        buttonLink: "/checkout?plan=pro",
        isPopular: true,
      },
      {
        id: "enterprise",
        title: "ארגוני",
        price: "₪799",
        period: "/חודש",
        description: "לרשתות קהילתיות גדולות.",
        features: ["ללא הגבלת משתמשים", "התאמה אישית מלאה", "אינטגרציית API מלאה", "מנהל לקוח אישי"],
        buttonText: "צור קשר למכירות",
        buttonLink: "/checkout?plan=enterprise",
      }
    ]
  },
  mobileHiddenSections: [],
  sectionOrder: ["hero", "mainContent", "services", "community", "pricing", "livePosts", "timer", "richContent", "contact", "landingSection"],
};

const DEFAULT_SERVICES_LANDING_CONFIG: HomePageConfig = {
  ...DEFAULT_HOME_CONFIG,
  hero: {
    ...DEFAULT_HOME_CONFIG.hero,
    title: "כלים חכמים לניהול חכם",
    subtitle: "שירותים דיגיטליים",
    description: "מחולל הקהילות מציע מגוון רחב של כלים טכנולוגיים שנועדו להקל עליכם בניהול היומיומי של הארגון.",
  },
  services: {
    title: "השירותים שלנו",
    description: "",
    layout: "grid",
    columns: 3,
    visible: true,
    items: []
  },
  mainContent: { ...DEFAULT_HOME_CONFIG.mainContent, visible: false },
  community: { ...DEFAULT_HOME_CONFIG.community, visible: false },
  livePosts: { ...DEFAULT_HOME_CONFIG.livePosts, visible: false },
  timer: { ...DEFAULT_HOME_CONFIG.timer!, visible: false },
  richContent: { ...DEFAULT_HOME_CONFIG.richContent!, visible: false },
  contact: { ...DEFAULT_HOME_CONFIG.contact, visible: false },
  landingSection: { 
    ...DEFAULT_HOME_CONFIG.landingSection!, 
    visible: true,
    title: "לא מצאתם את השירות שחיפשתם?",
    subtitle: "",
    description: "אנחנו כאן לכל עניין - גדול כקטן. נשמח לסייע לכם בכל בקשה, שאלה או צורך אישי או הלכתי שעולה. פנו אלינו ישירות ונשמח לעמוד לשירותכם.",
    buttonText: "יצירת קשר מהירה"
  },
  sectionOrder: ["hero", "services", "mainContent", "community", "livePosts", "timer", "richContent", "contact", "landingSection"],
};

function mergeWithDefaultConfig(data: any): HomePageConfig {
  if (!data) return DEFAULT_HOME_CONFIG;
  
  const rawSectionOrder = data.sectionOrder || DEFAULT_HOME_CONFIG.sectionOrder;
  let sectionOrder = rawSectionOrder.includes("landingSection") 
    ? rawSectionOrder 
    : [...rawSectionOrder, "landingSection"];
  if (!sectionOrder.includes("richContent")) {
    const contactIdx = sectionOrder.indexOf("contact");
    if (contactIdx !== -1) {
      sectionOrder = [
        ...sectionOrder.slice(0, contactIdx),
        "richContent",
        ...sectionOrder.slice(contactIdx)
      ];
    } else {
      sectionOrder = [...sectionOrder, "richContent"];
    }
  }

  if (!sectionOrder.includes("timer")) {
    const richContentIdx = sectionOrder.indexOf("richContent");
    if (richContentIdx !== -1) {
      sectionOrder = [
        ...sectionOrder.slice(0, richContentIdx),
        "timer",
        ...sectionOrder.slice(richContentIdx)
      ];
    } else {
      sectionOrder = [...sectionOrder, "timer"];
    }
  }

  return {
    hero: { ...DEFAULT_HOME_CONFIG.hero, ...data.hero },
    mainContent: { ...DEFAULT_HOME_CONFIG.mainContent, ...data.mainContent },
    services: { ...DEFAULT_HOME_CONFIG.services, ...data.services },
    community: { ...DEFAULT_HOME_CONFIG.community, ...data.community },
    livePosts: { ...DEFAULT_HOME_CONFIG.livePosts, ...data.livePosts },
    contact: { ...DEFAULT_HOME_CONFIG.contact, ...data.contact },
    landingSection: { ...DEFAULT_HOME_CONFIG.landingSection, ...data.landingSection },
    richContent: { ...DEFAULT_HOME_CONFIG.richContent, ...data.richContent },
    timer: { ...DEFAULT_HOME_CONFIG.timer, ...data.timer },
    pricing: { ...DEFAULT_HOME_CONFIG.pricing, ...data.pricing },
    mobileHiddenSections: data.mobileHiddenSections || DEFAULT_HOME_CONFIG.mobileHiddenSections || [],
    sectionOrder,
    seo: data.seo,
  } as HomePageConfig;
}

export async function getHomePageConfig(): Promise<HomePageConfig> {
  return getPageConfigWithDefault("pages", "home", DEFAULT_HOME_CONFIG);
}

export async function getServicesLandingConfig(): Promise<HomePageConfig> {
  return getPageConfigWithDefault("pages", "services-landing", DEFAULT_SERVICES_LANDING_CONFIG);
}

async function getPageConfigWithDefault(collectionName: string, docId: string, defaultConfig: HomePageConfig): Promise<HomePageConfig> {
  try {
    const docRef = adminDb.collection(collectionName).doc(docId);
    const docSnap = await docRef.get();
    
    if (docSnap.exists) {
      const data = docSnap.data();
      const mergedConfig = mergeWithDefaultConfig(data);
      // If it's services-landing, ensure the sectionOrder remains customized if not overridden by the user
      if (docId === "services-landing" && !data?.sectionOrder) {
        mergedConfig.sectionOrder = defaultConfig.sectionOrder;
      }
      return mergedConfig;
    }
    return defaultConfig;
  } catch (error) {
    console.warn(`Error fetching config for ${docId}:`, (error as Error).message);
    return defaultConfig;
  }
}

export async function saveHomePageConfig(content: Partial<HomePageConfig>) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  return savePageConfig("pages", "home", content);
}

export async function savePageConfig(collectionName: string, docId: string, content: Partial<HomePageConfig>) {
  try {
    console.log("savePageConfig called:", {collectionName, docId});
    const session = await auth();
    console.log("session:", session?.user?.id || "NO_SESSION");
    if (!session?.user) {
      console.error("savePageConfig: Unauthorized");
      throw new Error("Unauthorized");
    }

    const docRef = adminDb.collection(collectionName).doc(docId);
    console.log("Saving to firestore...");
    await docRef.set({ ...content, updatedAt: new Date().toISOString() }, { merge: true });
    console.log("Saved successfully!");
    
    // Revalidate relevant paths
    if (collectionName === "pages" && docId === "home") revalidatePath("/");
    else if (collectionName === "services") revalidatePath(`/service/${docId}`);
    else if (collectionName === "landing") revalidatePath(`/landing/${docId}`);
    else if (collectionName === "posts") revalidatePath(`/post/${docId}`);
    
    return { success: true };
  } catch (error) {
    console.error(`Error saving page config for ${collectionName}/${docId}:`, (error as Error).message);
    throw new Error("Failed to save to Firebase: " + (error as Error).message);
  }
}

export async function getPageConfig(collectionName: string, docId: string): Promise<HomePageConfig | null> {
  try {
    const docRef = adminDb.collection(collectionName).doc(docId);
    const docSnap = await docRef.get();
    
    if (docSnap.exists) {
      return mergeWithDefaultConfig(docSnap.data());
    }
    return null;
  } catch (error) {
    console.warn(`Error fetching page config for ${collectionName}/${docId}:`, (error as Error).message);
    return null;
  }
}

export async function getAllSitePages() {
  try {
    const [servicesSnap, postsSnap, landingSnap] = await Promise.all([
      adminDb.collection("services").get(),
      adminDb.collection("posts").get(),
      adminDb.collection("landing").get()
    ]);

    const allPages: Array<{id: string, title: string, description: string, url: string, icon: string, imageSrc: string}> = [];
    
    servicesSnap.docs.forEach((doc: any) => {
      const data = doc.data();
      allPages.push({
        id: doc.id,
        title: data.hero?.title || data.seo?.title || doc.id,
        description: data.hero?.description || data.seo?.description || "",
        imageSrc: data.hero?.imageSrc || "",
        url: `/service/${doc.id}`,
        icon: "BookOpen"
      });
    });

    landingSnap.docs.forEach((doc: any) => {
      const data = doc.data();
      allPages.push({
        id: doc.id,
        title: data.hero?.title || data.seo?.title || doc.id,
        description: data.hero?.description || data.seo?.description || "",
        imageSrc: data.hero?.imageSrc || "",
        url: `/landing/${doc.id}`,
        icon: "Globe"
      });
    });

    postsSnap.docs.forEach((doc: any) => {
      const data = doc.data();
      allPages.push({
        id: doc.id,
        title: data.hero?.title || data.title || data.seo?.title || doc.id,
        description: data.hero?.description || data.summary || data.seo?.description || "",
        imageSrc: data.hero?.imageSrc || data.imageUrl || "",
        url: `/post/${doc.id}`,
        icon: "Newspaper"
      });
    });

    return JSON.parse(JSON.stringify(allPages));
  } catch (error) {
    console.error("Error fetching all site pages:", error);
    return [];
  }
}
