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
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Metadata } from "next";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  try {
    const docSnap = await adminDb.collection("posts").doc(slug).get();
    if (docSnap.exists) {
      const data = docSnap.data();
      return {
        title: data?.seo?.title || data?.hero?.title || "פוסט",
        description: data?.seo?.description || data?.hero?.subtitle || "",
      };
    }
  } catch (e) {}
  
  return { title: "פוסט" };
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const globalSettings = await getGlobalSettings();
  
  let pageConfig: any = null;

  try {
    const docSnap = await adminDb.collection("posts").doc(slug).get();
    if (docSnap.exists) {
      pageConfig = docSnap.data();
    }
  } catch (error) {
    console.warn("Could not fetch post from DB:", error);
  }

  if (!pageConfig) {
    return notFound();
  }

  const config = {
    hero: { ...pageConfig.hero },
    services: { ...pageConfig.services },
    richContent: { ...pageConfig.richContent },
    landingSection: { ...pageConfig.landingSection },
    pricing: { ...pageConfig.pricing },
    timer: { ...pageConfig.timer },
    community: { ...pageConfig.community },
    contact: { ...pageConfig.contact }
  };

  const isVisible = (section: any) => section?.enabled || section?.visible;

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-900">
      <Navbar layout={globalSettings.headerLayout} logoUrl={globalSettings.siteLogoUrl} navLinks={globalSettings.navLinks} />
      
      <main className="flex-grow">
        {isVisible(config.hero) && (
          <Hero
            id={config.hero.anchorId || "hero"}
            title={config.hero.title}
            subtitle={config.hero.subtitle}
            primaryButton={config.hero.primaryButton}
            secondaryButton={config.hero.secondaryButton}
            imageSrc={config.hero.imageSrc}
            layout={config.hero.layout || "bento"}
            backgroundColor={config.hero.backgroundColor}
            isEditing={false}
          />
        )}

        {isVisible(config.timer) && (
          <TimerSection
            id={config.timer.anchorId || "timer"}
            title={config.timer.title}
            subtitle={config.timer.subtitle}
            targetDate={config.timer.endDate || config.timer.targetDate}
            layout={config.timer.theme || config.timer.layout || "classic"}
            isEditing={false}
          />
        )}

        {isVisible(config.landingSection) && (
          <LandingSection
            id={config.landingSection.anchorId || "landing"}
            title={config.landingSection.title}
            subtitle={config.landingSection.subtitle}
            description={config.landingSection.description}
            imageSrc={config.landingSection.imageSrc}
            form={config.landingSection.form}
            theme={config.landingSection.theme}
            layout={config.landingSection.layout}
            formMode={config.landingSection.formMode}
            buttonText={config.landingSection.buttonText}
            isEditing={false}
          />
        )}

        {isVisible(config.richContent) && (
          <RichContentSection
            id={config.richContent.anchorId || "rich-content"}
            heading={config.richContent.heading || config.richContent.title}
            body={config.richContent.body || config.richContent.content}
            layout={config.richContent.layout || config.richContent.theme || "split"}
            isEditing={false}
          />
        )}

        {isVisible(config.services) && (
          <ServicesGrid
            id={config.services.anchorId || "services"}
            title={config.services.title}
            description={config.services.description || config.services.subtitle}
            layout={config.services.layout || "grid"}
            columns={config.services.columns || 3}
            effect={config.services.effect || "glow"}
            items={config.services.items || []}
            isEditing={false}
          />
        )}

        {isVisible(config.pricing) && (
          <PricingSection
            id={config.pricing.anchorId || "pricing"}
            title={config.pricing.title}
            subtitle={config.pricing.subtitle}
            description={config.pricing.description}
            isEditing={false}
          />
        )}

        {isVisible(config.community) && (
          <CommunitySection
            id={config.community.anchorId || "community"}
            title={config.community.title}
            subtitle={config.community.subtitle}
            description={config.community.description}
            quote={config.community.quote}
            imageSrc={config.community.imageSrc}
            badgeTitle={config.community.badgeTitle}
            badgeSubtitle={config.community.badgeSubtitle}
            buttonText={config.community.buttonText}
            whatsappNumber={config.community.whatsappNumber}
            layout={config.community.layout || "split"}
            badgeVisible={config.community.badgeVisible !== false}
            buttonVisible={config.community.buttonVisible !== false}
            isEditing={false}
          />
        )}

        {isVisible(config.contact) && (
          <ContactSection
            id={config.contact.anchorId || "contact"}
            title={config.contact.title}
            subtitle={config.contact.subtitle}
            addressLabel={config.contact.addressLabel}
            addressVal={config.contact.addressVal}
            phoneLabel={config.contact.phoneLabel}
            phoneVal={config.contact.phoneVal}
            hoursLabel={config.contact.hoursLabel}
            hoursVal={config.contact.hoursVal}
            form={config.contact.form}
          />
        )}
      </main>

      <Footer />
    </div>
  );
}
