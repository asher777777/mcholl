import { getHomePageConfig } from "@/features/home/actions";
import { getGlobalSettings } from "@/features/settings/actions";
import { HomeClient } from "./HomeClient";
import { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const config = await getHomePageConfig();
  return {
    title: config.seo?.title || "מחולל הקהילות | הפלטפורמה המקיפה ליצירת קהילות",
    description: config.seo?.description || "מערכת מחולל הקהילות מאפשרת לך לנהל לקוחות, לשווק תוכן ולבנות עמודי נחיתה מרהיבים בקלות.",
    keywords: config.seo?.keywords,
    openGraph: config.seo?.image ? { images: [config.seo.image] } : undefined,
  };
}

export default async function Home() {
  const config = await getHomePageConfig();
  const globalSettings = await getGlobalSettings();

  return <HomeClient initialConfig={config} initialGlobalSettings={globalSettings} />;
}
