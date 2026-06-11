"use client";

import { useState, useEffect, Suspense } from "react";
import dynamic from "next/dynamic";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
const Hero = dynamic(() => import("@/components/sections/Hero").then(m => m.Hero), { ssr: true });
const ServicesGrid = dynamic(() => import("@/components/sections/ServicesGrid").then(m => m.ServicesGrid), { ssr: true });
const CommunitySection = dynamic(() => import("@/components/sections/CommunitySection").then(m => m.CommunitySection), { ssr: true });
const LivePostsGrid = dynamic(() => import("@/components/sections/LivePostsGrid").then(m => m.LivePostsGrid), { ssr: true });
const ContactSection = dynamic(() => import("@/components/sections/ContactSection").then(m => m.ContactSection), { ssr: true });
const LandingSection = dynamic(() => import("@/components/sections/LandingSection").then(m => m.LandingSection), { ssr: true });
const RichContentSection = dynamic(() => import("@/components/sections/RichContentSection").then(m => m.RichContentSection), { ssr: true });
const TimerSection = dynamic(() => import("@/components/sections/TimerSection").then(m => m.TimerSection), { ssr: true });
const PricingSection = dynamic(() => import("@/components/sections/PricingSection").then(m => m.PricingSection), { ssr: true });
import { HomePageConfig } from "@/features/home/actions";
import { GlobalSettings } from "@/features/settings/actions";
import { Edit3 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/store/useAuthStore";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";

// Dynamically import the heavy editing interface so normal visitors never download it
const HomeEditor = dynamic(() => import("./HomeEditor").then(m => m.HomeEditor), { ssr: false });

interface HomeClientProps {
  initialConfig: HomePageConfig;
  initialGlobalSettings?: GlobalSettings;
  pageId?: string;
  collectionName?: string;
}

export function HomeClient({ initialConfig, initialGlobalSettings, pageId, collectionName }: HomeClientProps) {
  const { isAuthenticated } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [config, setConfig] = useState<HomePageConfig>(initialConfig);
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings>(
    initialGlobalSettings || { siteLogoUrl: "", headerLayout: "classic", theme: "navy", navLinks: [] }
  );

  useEffect(() => {
    const savedScroll = sessionStorage.getItem("home_editor_scroll");
    if (savedScroll) {
      window.scrollTo(0, parseInt(savedScroll));
      sessionStorage.removeItem("home_editor_scroll");
    }
  }, [isEditing]);

  // If in editing mode, swap out for the dynamic editor component
  if (isAuthenticated && isEditing) {
    return (
      <HomeEditor
        initialConfig={initialConfig}
        initialGlobalSettings={initialGlobalSettings}
        config={config}
        setConfig={setConfig}
        globalSettings={globalSettings}
        setGlobalSettings={setGlobalSettings}
        setIsEditing={setIsEditing}
        pageId={pageId}
        collectionName={collectionName}
      />
    );
  }

  const renderSection = (sectionId: string) => {
    switch (sectionId) {
      case "hero":
        if (!config.hero) return null;
        return (
          <Hero 
            id={config.hero.anchorId || "hero"}
            title={config.hero.title}
            subtitle={config.hero.subtitle}
            description={config.hero.description}
            imageSrc={config.hero.imageSrc}
            layout={config.hero.layout}
            buttonsVisible={config.hero.buttonsVisible}
            primaryButton={config.hero.primaryButton}
            secondaryButton={config.hero.secondaryButton}
            isEditing={false}
          />
        );
      case "mainContent":
        if (!config.mainContent || !config.mainContent.visible) return null;
        return (
          <Hero 
            id={config.mainContent.anchorId || "mainContent"}
            title={config.mainContent.title}
            subtitle={config.mainContent.subtitle}
            description={config.mainContent.description}
            imageSrc={config.mainContent.imageSrc}
            layout={config.mainContent.layout}
            buttonsVisible={config.mainContent.buttonsVisible}
            primaryButton={config.mainContent.primaryButton}
            secondaryButton={config.mainContent.secondaryButton}
            isEditing={false}
          />
        );
      case "services":
        if (!config.services || !config.services.visible) return null;
        return (
          <ServicesGrid 
            id={config.services.anchorId || "services"}
            title={config.services.title}
            description={config.services.description}
            layout={config.services.layout} 
            columns={config.services.columns}
            effect={config.services.effect}
            items={config.services.items} 
            isEditing={false}
          />
        );
      case "community":
        if (!config.community || !config.community.visible) return null;
        return (
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
            layout={config.community.layout}
            badgeVisible={config.community.badgeVisible}
            buttonVisible={config.community.buttonVisible}
            isEditing={false}
          />
        );
      case "livePosts":
        if (!config.livePosts || !config.livePosts.visible) return null;
        return <LivePostsGrid id={config.livePosts.anchorId || "livePosts"} layout={config.livePosts.layout} customPages={config.livePosts.customPages} />;
      case "contact":
        if (!config.contact || !config.contact.visible) return null;
        return (
          <Suspense fallback={null}>
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
          </Suspense>
        );
      case "timer":
        if (!config.timer || !config.timer.visible) return null;
        return (
          <TimerSection
            id={config.timer.anchorId || "timer"}
            title={config.timer.title}
            subtitle={config.timer.subtitle}
            targetDate={config.timer.targetDate}
            layout={config.timer.layout}
            isEditing={false}
          />
        );
      case "pricing":
        if (!config.pricing || !config.pricing.visible) return null;
        return (
          <PricingSection
            id={config.pricing.anchorId || "pricing"}
            title={config.pricing.title}
            subtitle={config.pricing.subtitle}
            description={config.pricing.description}
            isEditing={false}
          />
        );
      case "richContent":
        if (!config.richContent || !config.richContent.visible) return null;
        return (
          <RichContentSection 
            id={config.richContent.anchorId || "richContent"}
            heading={config.richContent.heading}
            body={config.richContent.body}
            layout={config.richContent.layout}
            isEditing={false}
          />
        );
      case "landingSection":
        if (!config.landingSection || !config.landingSection.visible) return null;
        return (
          <Suspense fallback={null}>
            <LandingSection
              id={config.landingSection.anchorId || "landingSection"}
              title={config.landingSection.title}
              subtitle={config.landingSection.subtitle}
              description={config.landingSection.description}
              imageSrc={config.landingSection.imageSrc}
              form={config.landingSection.form}
              theme={globalSettings.theme}
              layout={config.landingSection.layout}
              formMode={config.landingSection.formMode}
              buttonText={config.landingSection.buttonText}
              isEditing={false}
            />
          </Suspense>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar layout={globalSettings.headerLayout} logoUrl={globalSettings.siteLogoUrl} navLinks={globalSettings.navLinks} />
      
      {/* Admin Floating Edit Button */}
      {isAuthenticated && (
        <div className="fixed bottom-24 right-6 z-[100] flex flex-col gap-2.5">
          <Button 
            variant="primary" 
            size="lg" 
            className="rounded-full shadow-2xl bg-indigo-600 hover:bg-indigo-700 text-white h-14 w-14 p-0 flex items-center justify-center transition-all duration-300 hover:scale-105"
            onClick={() => {
              sessionStorage.setItem("home_editor_scroll", window.scrollY.toString());
              setIsEditing(true);
            }}
            title="ערוך עמוד זה"
          >
            <Edit3 className="w-6 h-6" />
          </Button>
        </div>
      )}

      <main className="flex-grow">
        <div className="flex flex-col w-full">
          {(config.sectionOrder || ["hero", "mainContent", "services", "community", "livePosts", "timer", "richContent", "contact", "landingSection"]).map((sectionId) => {
            const isHiddenOnMobile = config.mobileHiddenSections?.includes(sectionId);
            return (
              <div key={sectionId} className={isHiddenOnMobile ? "max-sm:hidden" : undefined}>
                {renderSection(sectionId)}
              </div>
            );
          })}
        </div>
      </main>

      <Footer />
      <WhatsAppButton />
    </div>
  );
}
