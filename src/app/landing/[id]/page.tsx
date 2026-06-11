import { adminDb } from "@/lib/firebase-admin";
import { notFound } from "next/navigation";
import { Hero } from "@/components/sections/Hero";
import { ServicesGrid } from "@/components/sections/ServicesGrid";
import { LandingSection } from "@/components/sections/LandingSection";
import { RichContentSection } from "@/components/sections/RichContentSection";
import { PricingSection } from "@/components/sections/PricingSection";
import { TimerSection } from "@/components/sections/TimerSection";
import { CommunitySection } from "@/components/sections/CommunitySection";
import { ContactSection } from "@/components/sections/ContactSection";
import { getGlobalSettings } from "@/features/settings/actions";
import { Metadata } from "next";
import { HomeClient } from "@/app/HomeClient";

export const revalidate = 60; // Revalidate every 60 seconds

import { staticLandingPages } from "@/data/landing-pages";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  try {
    const docSnap = await adminDb.collection("landing").doc(id).get();
    if (docSnap.exists) {
      const data = docSnap.data();
      return {
        title: data?.seo?.title || data?.hero?.title || "עמוד נחיתה",
        description: data?.seo?.description || data?.hero?.subtitle || "",
      };
    }
  } catch (e) {}
  
  const fallback = staticLandingPages.find(p => p.id === id);
  if (fallback) {
    return {
      title: fallback.seo.title,
      description: fallback.seo.description,
    };
  }
  
  return { title: "עמוד נחיתה" };
}

export default async function LandingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const globalSettings = await getGlobalSettings();
  
  let pageConfig: any = null;

  try {
    const docSnap = await adminDb.collection("landing").doc(id).get();
    if (docSnap.exists) {
      pageConfig = docSnap.data();
    }
  } catch (error) {
    console.warn("Could not fetch landing page from DB:", error);
  }

  if (!pageConfig) {
    const fallback = staticLandingPages.find(p => p.id === id);
    console.log("DEBUG: ID=", id, "FALLBACK FOUND=", !!fallback, "ALL PAGES=", staticLandingPages?.length);
    if (fallback) {
      pageConfig = fallback;
    } else {
      console.log("DEBUG: Returning notFound() because pageConfig is null and fallback is null");
      return notFound();
    }
  }

  // Set defaults for page configuration
  const config = {
    hero: { enabled: false, ...pageConfig.hero },
    services: { enabled: false, ...pageConfig.services },
    richContent: { enabled: false, ...pageConfig.richContent },
    landingSection: { enabled: false, ...pageConfig.landingSection },
    pricing: { enabled: false, ...pageConfig.pricing },
    timer: { enabled: false, ...pageConfig.timer },
    community: { enabled: false, ...pageConfig.community },
    contact: { enabled: false, ...pageConfig.contact }
  };

  const mappedConfig = {
    ...config,
    timer: {
      ...config.timer,
      targetDate: config.timer.endDate || config.timer.targetDate || config.timer.date
    },
    richContent: {
      ...config.richContent,
      heading: config.richContent.heading || config.richContent.title,
      body: config.richContent.body || config.richContent.content,
      layout: config.richContent.layout || config.richContent.theme || "split"
    },
    services: {
      ...config.services,
      description: config.services.description || config.services.subtitle,
      layout: config.services.layout || "grid",
      columns: config.services.columns || 3,
      effect: config.services.effect || "glow",
      items: config.services.items || []
    },
    hero: {
      ...config.hero,
      layout: config.hero.layout || "bento",
    },
    community: {
      ...config.community,
      layout: config.community.layout || "split",
      badgeVisible: config.community.badgeVisible !== false,
      buttonVisible: config.community.buttonVisible !== false
    }
  };

  return <HomeClient initialConfig={mappedConfig as any} initialGlobalSettings={globalSettings} pageId={id} collectionName="landing" />;
}
