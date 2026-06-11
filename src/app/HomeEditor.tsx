"use client";

import { useState, useEffect, Suspense } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/sections/Hero";
import { ServicesGrid } from "@/components/sections/ServicesGrid";
import { CommunitySection } from "@/components/sections/CommunitySection";
import { LivePostsGrid } from "@/components/sections/LivePostsGrid";
import { ContactSection } from "@/components/sections/ContactSection";
import { LandingSection } from "@/components/sections/LandingSection";
import { RichContentSection } from "@/components/sections/RichContentSection";
import { TimerSection } from "@/components/sections/TimerSection";
import { PricingSection } from "@/components/sections/PricingSection";
import { HomePageConfig, savePageConfig, getAllSitePages } from "@/features/home/actions";
import { GlobalSettings, saveGlobalSettings } from "@/features/settings/actions";
import { generateSeoTagsWithAI, generateSeoImageWithAI } from "@/features/ai/actions";
import { 
  Save, 
  X, 
  LayoutTemplate, 
  Settings2, 
  Image as ImageIcon, 
  Palette, 
  GripVertical,
  AlignRight,
  AlignCenter,
  AlignLeft,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Loader2,
  ArrowUp,
  ArrowDown,
  Check,
  Layers,
  Phone,
  Smartphone,
  Search,
  Sparkles,
  Globe
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { Reorder } from "framer-motion";
import { cn } from "@/lib/utils";

interface HomeEditorProps {
  initialConfig: HomePageConfig;
  initialGlobalSettings?: GlobalSettings;
  config: HomePageConfig;
  setConfig: React.Dispatch<React.SetStateAction<HomePageConfig>>;
  globalSettings: GlobalSettings;
  setGlobalSettings: React.Dispatch<React.SetStateAction<GlobalSettings>>;
  setIsEditing: (val: boolean) => void;
  pageId?: string;
  collectionName?: string;
}

export function HomeEditor({
  initialConfig,
  initialGlobalSettings,
  config,
  setConfig,
  globalSettings,
  setGlobalSettings,
  setIsEditing,
  pageId,
  collectionName
}: HomeEditorProps) {
  const [saving, setSaving] = useState(false);
  
  // SEO Panel State
  const [isSeoPanelOpen, setIsSeoPanelOpen] = useState(false);
  const [isGeneratingSeo, setIsGeneratingSeo] = useState(false);
  const [isGeneratingSeoImage, setIsGeneratingSeoImage] = useState(false);
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [customImagePrompt, setCustomImagePrompt] = useState("");
  
  // Side Drawer & Dyn Loading States
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [sitePages, setSitePages] = useState<any[]>([]);
  const [isLoadingPages, setIsLoadingPages] = useState(false);
  const [activeAccordion, setActiveAccordion] = useState<string | null>("logo");

  const availableAnchors = [
    { id: config.hero?.anchorId || "hero", label: "אזור ראשי" },
    { id: config.mainContent?.anchorId || "mainContent", label: "אזור תוכן מרכזי" },
    { id: config.services?.anchorId || "services", label: "שירותים" },
    { id: config.community?.anchorId || "community", label: "קהילה" },
    { id: config.livePosts?.anchorId || "livePosts", label: "עדכונים ואירועים" },
    { id: config.contact?.anchorId || "contact", label: "צור קשר" },
    ...(config.richContent ? [{ id: config.richContent.anchorId || "richContent", label: "תוכן מעוצב" }] : []),
    ...(config.timer ? [{ id: config.timer.anchorId || "timer", label: "אזור טיימר" }] : []),
    ...(config.landingSection ? [{ id: config.landingSection.anchorId || "landingSection", label: "דף נחיתה" }] : [])
  ];

  // Load site pages and restore scroll on mount
  useEffect(() => {
    async function loadPages() {
      setIsLoadingPages(true);
      try {
        const pages = await getAllSitePages();
        const fixedPages = [
          { id: "home", title: 'עמוד הבית', url: '/' },
          { id: "lessons", title: 'שיעורי תורה', url: '/lessons' },
          { id: "services", title: 'שירותי דת', url: '/services' },
          { id: "community", title: 'עמוד קהילה', url: '/community' },
          { id: "contact", title: 'צור קשר', url: '/contact' },
        ];
        const combined = [...fixedPages];
        if (pages) {
          pages.forEach((p: any) => {
            if (!combined.some(existing => existing.url === p.url)) {
              combined.push(p);
            }
          });
        }
        setSitePages(combined);
      } catch (e) {
        console.error("Failed to load site pages", e);
      } finally {
        setIsLoadingPages(false);
      }
    }
    loadPages();

    // Restore scroll position
    const savedScroll = sessionStorage.getItem("home_editor_scroll");
    if (savedScroll) {
      window.scrollTo(0, parseInt(savedScroll));
      sessionStorage.removeItem("home_editor_scroll");
    }
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const cleanConfig = JSON.parse(JSON.stringify(config));
      if (collectionName && pageId) {
        await savePageConfig(collectionName, pageId, cleanConfig);
      } else {
        await savePageConfig("pages", "home", cleanConfig);
      }
      await saveGlobalSettings(globalSettings);
      sessionStorage.setItem("home_editor_scroll", window.scrollY.toString());
      setIsEditing(false);
    } catch (e) {
      console.error("Failed to save home page config", e);
      alert("שגיאה בשמירה ל-Firebase.");
    } finally {
      setSaving(false);
    }
  };

  const handleOpenDrawer = () => {
    setIsDrawerOpen(true);
  };

  const handleGenerateSeo = async () => {
    setIsGeneratingSeo(true);
    try {
      const contentParts = [
        config.hero?.title, config.hero?.subtitle, config.hero?.description,
        config.mainContent?.title, config.mainContent?.description,
        config.services?.title, config.services?.description,
        config.community?.title, config.community?.description
      ].filter(Boolean).join(" | ");

      const result = await generateSeoTagsWithAI(contentParts);
      if (result.success) {
        setConfig((prev) => ({
          ...prev,
          seo: {
            ...prev.seo,
            title: result.title || prev.seo?.title || "",
            description: result.description || prev.seo?.description || "",
            keywords: result.keywords || prev.seo?.keywords || ""
          }
        }));
      } else {
        alert("שגיאה בייצור תוכן: " + result.error);
      }
    } catch (error) {
      console.error(error);
      alert("אירעה שגיאה בייצור תגיות SEO");
    } finally {
      setIsGeneratingSeo(false);
    }
  };

  const handleOpenPromptModal = () => {
    setCustomImagePrompt(`A highly engaging, professional, and visually striking cover image representing a community organization. 
Keywords: ${config.seo?.keywords || "community, organization, warmth, welcoming, events"}. 
It should be photorealistic, high quality, optimistic, and welcoming. Do not write text/letters inside the image.`);
    setIsPromptModalOpen(true);
  };

  const handleGenerateSeoImage = async () => {
    if (!customImagePrompt.trim()) return;
    setIsGeneratingSeoImage(true);
    setIsPromptModalOpen(false);
    try {
      const result = await generateSeoImageWithAI(customImagePrompt);
      if (result.success && result.imageUrl) {
        setConfig((prev) => ({
          ...prev,
          seo: {
            ...prev.seo,
            title: prev.seo?.title || "",
            description: prev.seo?.description || "",
            image: result.imageUrl
          }
        }));
      } else {
        alert("שגיאה בייצור תמונה: " + result.error);
      }
    } catch (error) {
      console.error(error);
      alert("אירעה שגיאה בייצור תמונת SEO");
    } finally {
      setIsGeneratingSeoImage(false);
    }
  };

  const updateHero = (field: keyof HomePageConfig["hero"], value: string) => {
    setConfig({ ...config, hero: { ...config.hero, [field]: value } });
  };

  const updateMainContent = (field: keyof HomePageConfig["mainContent"], value: string) => {
    setConfig({ ...config, mainContent: { ...config.mainContent, [field]: value } });
  };

  const updateSectionVisibility = (section: keyof Omit<HomePageConfig, "hero" | "sectionOrder">, visible: boolean) => {
    setConfig({ ...config, [section]: { ...config[section as keyof HomePageConfig] as any, visible } });
  };

  // Nav Links manipulations
  const handleAddLink = () => {
    const newLinks = [...(globalSettings.navLinks || []), { name: "קישור חדש", href: "/" }];
    setGlobalSettings({ ...globalSettings, navLinks: newLinks });
  };

  const handleUpdateLinkName = (index: number, val: string) => {
    const newLinks = [...(globalSettings.navLinks || [])];
    newLinks[index] = { ...newLinks[index], name: val };
    setGlobalSettings({ ...globalSettings, navLinks: newLinks });
  };

  const handleUpdateLinkHref = (index: number, val: string) => {
    const newLinks = [...(globalSettings.navLinks || [])];
    newLinks[index] = { ...newLinks[index], href: val };
    setGlobalSettings({ ...globalSettings, navLinks: newLinks });
  };

  const handleDeleteLink = (index: number) => {
    const newLinks = (globalSettings.navLinks || []).filter((_, i) => i !== index);
    setGlobalSettings({ ...globalSettings, navLinks: newLinks });
  };

  const handleMoveLink = (index: number, direction: 'up' | 'down') => {
    const links = [...(globalSettings.navLinks || [])];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= links.length) return;
    const temp = links[index];
    links[index] = links[targetIndex];
    links[targetIndex] = temp;
    setGlobalSettings({ ...globalSettings, navLinks: links });
  };

  const SectionToggle = ({ 
    label, 
    sectionKey 
  }: { 
    label: string, 
    sectionKey: keyof Omit<HomePageConfig, "hero" | "sectionOrder" | "seo" | "mobileHiddenSections"> 
  }) => {
    return (
      <div className="absolute top-4 right-4 z-50 bg-white/95 backdrop-blur-md px-6 py-2 rounded-2xl border shadow-lg flex items-center gap-4">
        <span className="text-sm font-bold text-slate-800">{label}</span>
        
        <div className="flex items-center gap-2 border-r pr-4 mr-2">
          <label className="text-[10px] text-slate-500 font-medium">מזהה עוגן (ID)</label>
          <input 
            type="text" 
            value={(config[sectionKey as keyof typeof config] as any)?.anchorId || ""}
            onChange={(e) => setConfig({ ...config, [sectionKey]: { ...(config[sectionKey as keyof typeof config] as any), anchorId: e.target.value }})}
            className="w-24 text-xs border rounded p-1"
            placeholder={sectionKey}
            dir="ltr"
          />
        </div>

        <div className="flex items-center gap-2 border-r pr-4 mr-2">
          <label className="text-[10px] text-slate-500 font-medium">צבע רקע</label>
          <input 
            type="color" 
            value={(config[sectionKey as keyof typeof config] as any)?.backgroundColor || "#ffffff"}
            onChange={(e) => setConfig({ ...config, [sectionKey]: { ...(config[sectionKey as keyof typeof config] as any), backgroundColor: e.target.value }})}
            className="w-8 h-6 p-0 border-0 cursor-pointer"
          />
        </div>
        
        <div className="flex items-center gap-2 border-r pr-4 mr-2">
          <label className="text-[10px] text-slate-500 font-medium">צבע הובר</label>
          <input 
            type="color" 
            value={(config[sectionKey as keyof typeof config] as any)?.hoverColor || "#f8fafc"}
            onChange={(e) => setConfig({ ...config, [sectionKey]: { ...(config[sectionKey as keyof typeof config] as any), hoverColor: e.target.value }})}
            className="w-8 h-6 p-0 border-0 cursor-pointer"
          />
        </div>

        <label className="relative inline-flex items-center cursor-pointer mr-4">
          <input 
            type="checkbox" 
            className="sr-only peer"
            checked={(config[sectionKey as keyof typeof config] as any)?.visible ?? true}
            onChange={(e) => updateSectionVisibility(sectionKey, e.target.checked)}
          />
          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
        </label>
      </div>
    );
  };

  const renderSection = (sectionId: string) => {
    switch (sectionId) {
      case "hero":
        if (!config.hero) return null;
        return (
          <div className="relative">
            <div className="absolute top-4 right-4 z-50 bg-white/95 backdrop-blur-md px-6 py-2 rounded-2xl border shadow-lg flex items-center gap-4">
              <span className="text-sm font-bold text-slate-800">הגדרות אזור ראשי</span>
              <div className="flex items-center gap-2 border-r pr-4 mr-2">
                <label className="text-[10px] text-slate-500 font-medium">מזהה עוגן (ID)</label>
                <input 
                  type="text" 
                  value={config.hero.anchorId || ""}
                  onChange={(e) => setConfig({ ...config, hero: { ...config.hero, anchorId: e.target.value }})}
                  className="w-24 text-xs border rounded p-1"
                  placeholder="hero"
                  dir="ltr"
                />
              </div>
              <div className="flex items-center gap-2 border-r pr-4 mr-2">
                <label className="text-[10px] text-slate-500 font-medium">צבע רקע</label>
                <input 
                  type="color" 
                  value={config.hero.backgroundColor || "#ffffff"}
                  onChange={(e) => setConfig({ ...config, hero: { ...config.hero, backgroundColor: e.target.value }})}
                  className="w-8 h-6 p-0 border-0 cursor-pointer"
                />
              </div>
              <div className="flex items-center gap-2 border-r pr-4 mr-2">
                <label className="text-[10px] text-slate-500 font-medium">צבע הובר</label>
                <input 
                  type="color" 
                  value={config.hero.hoverColor || "#f8fafc"}
                  onChange={(e) => setConfig({ ...config, hero: { ...config.hero, hoverColor: e.target.value }})}
                  className="w-8 h-6 p-0 border-0 cursor-pointer"
                />
              </div>
            </div>
            <div className="absolute top-4 left-4 z-50 bg-white/95 backdrop-blur-md px-6 py-2 rounded-2xl border shadow-lg flex items-center gap-4">
              <span className="text-sm font-bold text-slate-800">מבנה אזור ראשי</span>
              <select 
                value={config.hero.layout || "fz"}
                onChange={(e) => updateHero("layout", e.target.value)}
                className="p-1 border rounded bg-slate-50 text-sm outline-none font-medium cursor-pointer"
              >
                <option value="fz">המסלול הטבעי (F/Z)</option>
                <option value="bento">קופסת הבנטו (Bento Grid)</option>
                <option value="modular">שולחן עבודה (Modular)</option>
                <option value="progressive">הלובי השקט (Progressive)</option>
                <option value="spatial">הגלריה היוקרתית (Spatial)</option>
                <option value="thumb">אזור האגודל (Mobile Thumb)</option>
              </select>
            </div>
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
              availableAnchors={availableAnchors}
              backgroundColor={config.hero.backgroundColor}
              isEditing={true}
              onUpdateHero={updateHero}
            />
          </div>
        );
      case "mainContent":
        if (!config.mainContent) return null;
        return (
          <div className={`relative ${!config.mainContent.visible ? 'opacity-40 grayscale' : ''}`}>
            <SectionToggle label="אזור תוכן מרכזי" sectionKey="mainContent" />
            <div className="absolute top-4 left-4 z-50 bg-white/95 backdrop-blur-md px-6 py-2 rounded-2xl border shadow-lg flex items-center gap-4">
              <span className="text-sm font-bold text-slate-800">מבנה תוכן מרכזי</span>
              <select 
                value={config.mainContent.layout || "bento"}
                onChange={(e) => updateMainContent("layout", e.target.value)}
                className="p-1 border rounded bg-slate-50 text-sm outline-none font-medium cursor-pointer"
              >
                <option value="fz">המסלול הטבעי (F/Z)</option>
                <option value="bento">קופסת הבנטו (Bento Grid)</option>
                <option value="modular">שולחן עבודה (Modular)</option>
                <option value="progressive">הלובי השקט (Progressive)</option>
                <option value="spatial">הגלריה היוקרתית (Spatial)</option>
                <option value="thumb">אזור האגודל (Mobile Thumb)</option>
              </select>
            </div>
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
              availableAnchors={availableAnchors}
              backgroundColor={config.mainContent.backgroundColor}
              isEditing={true}
              onUpdateHero={(field, val) => updateMainContent(field, val)}
            />
          </div>
        );
      case "services":
        if (!config.services) return null;
        return (
          <div className={`relative ${!config.services.visible ? 'opacity-40 grayscale' : ''}`}>
            <SectionToggle label="אזור שירותים" sectionKey="services" />
            <div className="absolute top-6 left-6 z-50 flex items-center gap-2 bg-white/90 backdrop-blur p-2 rounded-lg shadow-lg border">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">פריסה:</span>
              <select 
                value={config.services.layout || "grid"}
                onChange={(e) => setConfig({ ...config, services: { ...config.services, layout: e.target.value as any }})}
                className="p-1 border rounded bg-slate-50 text-sm outline-none font-medium cursor-pointer"
              >
                <option value="grid">גריד רגיל (Grid)</option>
                <option value="carousel">קרוסלה (Carousel)</option>
                <option value="image-card">תמונה, כותרת ותיאור</option>
                <option value="hover-card">הובר להצגת תיאור</option>
              </select>
              {config.services.layout === "grid" && (
                <>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-2 border-r pr-2">עמודות (מחשב):</span>
                  <select 
                    value={config.services.columns || 4}
                    onChange={(e) => setConfig({ ...config, services: { ...config.services, columns: Number(e.target.value) }})}
                    className="p-1 border rounded bg-slate-50 text-sm outline-none font-medium cursor-pointer"
                  >
                    <option value={2}>2</option>
                    <option value={3}>3</option>
                    <option value={4}>4</option>
                    <option value={5}>5</option>
                    <option value={6}>6</option>
                  </select>
                </>
              )}
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-2 border-r pr-2">אפקט:</span>
              <select 
                value={config.services.effect || "none"}
                onChange={(e) => setConfig({ ...config, services: { ...config.services, effect: e.target.value as any }})}
                className="p-1 border rounded bg-slate-50 text-sm outline-none font-medium cursor-pointer"
              >
                <option value="none">ללא אפקט</option>
                <option value="zoom">זום (Zoom In)</option>
                <option value="lift">הרמה (Lift Up)</option>
                <option value="glow">זוהר (Glow)</option>
              </select>
            </div>
            <ServicesGrid 
              id={config.services.anchorId || "services"}
              title={config.services.title}
              description={config.services.description}
              layout={config.services.layout} 
              columns={config.services.columns}
              effect={config.services.effect}
              items={config.services.items} 
              isEditing={true} 
              onUpdate={(items) => setConfig({ ...config, services: { ...config.services, items } })}
              onHeaderUpdate={(field, val) => setConfig({ ...config, services: { ...config.services, [field]: val } })}
            />
          </div>
        );
      case "community":
        if (!config.community) return null;
        return (
          <div className={`relative ${!config.community.visible ? 'opacity-40 grayscale' : ''}`}>
            <SectionToggle label="קהילה שזורמת" sectionKey="community" />
            <div className="absolute top-6 left-6 z-50 flex items-center gap-4 bg-white/90 backdrop-blur p-2 rounded-lg shadow-lg border">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">פריסה:</span>
                <select 
                  value={config.community.layout || "split-left"}
                  onChange={(e) => setConfig({ ...config, community: { ...config.community, layout: e.target.value as any }})}
                  className="p-1 border rounded bg-slate-50 text-sm outline-none font-medium cursor-pointer"
                >
                  <option value="split-left">תמונה משמאל (Split Left)</option>
                  <option value="split-right">תמונה מימין (Split Right)</option>
                  <option value="centered">ממורכז (Centered)</option>
                </select>
              </div>
              <label className="flex items-center gap-1 text-xs font-bold cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={config.community.badgeVisible ?? true}
                  onChange={(e) => setConfig({ ...config, community: { ...config.community, badgeVisible: e.target.checked }})}
                />
                תווית על התמונה
              </label>
              <label className="flex items-center gap-1 text-xs font-bold cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={config.community.buttonVisible ?? true}
                  onChange={(e) => setConfig({ ...config, community: { ...config.community, buttonVisible: e.target.checked }})}
                />
                כפתור וואטסאפ
              </label>
            </div>
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
              isEditing={true}
              onUpdate={(field, value) => setConfig({ ...config, community: { ...config.community, [field]: value }})}
            />
          </div>
        );
      case "livePosts":
        if (!config.livePosts) return null;
        return (
          <div className={`relative ${!config.livePosts.visible ? 'opacity-40 grayscale' : ''}`}>
            <SectionToggle label="עדכונים ואירועים" sectionKey="livePosts" />
            <div className="absolute top-6 left-6 z-50 flex items-center gap-4 bg-white/90 backdrop-blur p-2 rounded-lg shadow-lg border">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">פריסה:</span>
                <select 
                  value={config.livePosts.layout || "grid"}
                  onChange={(e) => setConfig({ ...config, livePosts: { ...config.livePosts, layout: e.target.value as any }})}
                  className="p-1 border rounded bg-slate-50 text-sm outline-none font-medium cursor-pointer"
                >
                  <option value="grid">גריד (Grid)</option>
                  <option value="list">רשימה (List)</option>
                  <option value="bento">בנטו (Bento)</option>
                  <option value="carousel">קרוסלה (Carousel)</option>
                </select>
              </div>
            </div>

            {/* Custom listing editor block when editing */}
            <div className="bg-slate-50 p-6 border-b border-t text-right" dir="rtl">
              <div className="max-w-4xl mx-auto space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <h3 className="font-bold text-sm text-slate-700 flex items-center gap-2">
                    <Layers className="h-4 w-4 text-primary" />
                    בחירת דפים מותאמים אישית לליסטינג (אם ריק - יציג את 3 הפוסטים האחרונים)
                  </h3>
                  <Button
                    onClick={() => {
                      const defaultUrl = sitePages[0]?.url || "/";
                      const currentCustom = config.livePosts.customPages || [];
                      setConfig({
                        ...config,
                        livePosts: {
                          ...config.livePosts,
                          customPages: [...currentCustom, defaultUrl]
                        }
                      });
                    }}
                    variant="outline"
                    className="py-1 px-3 border-secondary/20 hover:border-secondary/50 text-secondary text-xs font-bold rounded-lg cursor-pointer"
                  >
                    הוסף דף לליסטינג +
                  </Button>
                </div>

                {config.livePosts.customPages && config.livePosts.customPages.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {config.livePosts.customPages.map((selectedUrl, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-white p-2.5 rounded-xl border">
                        <select
                          value={selectedUrl}
                          onChange={(e) => {
                            const updated = [...(config.livePosts.customPages || [])];
                            updated[idx] = e.target.value;
                            setConfig({
                              ...config,
                              livePosts: { ...config.livePosts, customPages: updated }
                            });
                          }}
                          className="flex-grow text-xs p-1 border rounded bg-slate-50 cursor-pointer font-medium"
                        >
                          {sitePages.map((page, idx) => (
                            <option key={`${page.id}-${idx}`} value={page.url}>{page.title}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => {
                            const updated = (config.livePosts.customPages || []).filter((_, i) => i !== idx);
                            setConfig({
                              ...config,
                              livePosts: { ...config.livePosts, customPages: updated }
                            });
                          }}
                          className="p-1 rounded text-red-500 hover:bg-red-50 cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 font-medium">כעת מוצגים 3 הפוסטים האחרונים באופן אוטומטי.</p>
                )}
              </div>
            </div>

            <LivePostsGrid id={config.livePosts.anchorId || "livePosts"} layout={config.livePosts.layout} customPages={config.livePosts.customPages} />
          </div>
        );
      case "contact":
        if (!config.contact) return null;
        return (
          <div className={`relative ${!config.contact.visible ? 'opacity-40 grayscale' : ''}`}>
            <SectionToggle label="צור קשר" sectionKey="contact" />
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
              isEditing={true}
              onUpdate={(field, val) => {
                setConfig({
                  ...config,
                  contact: {
                    ...config.contact,
                    [field]: val
                  }
                });
              }}
            />
          </div>
        );
      case "timer":
        return (
          <div className={`relative ${!config.timer?.visible ? 'opacity-40 grayscale' : ''}`}>
            <SectionToggle label="אזור טיימר" sectionKey="timer" />
            <TimerSection
              id={config.timer?.anchorId || "timer"}
              title={config.timer?.title}
              subtitle={config.timer?.subtitle}
              targetDate={config.timer?.targetDate}
              layout={config.timer?.layout}
              isEditing={true}
              onUpdate={(field, val) => {
                setConfig({
                  ...config,
                  timer: {
                    ...config.timer!,
                    [field]: val
                  }
                });
              }}
            />
          </div>
        );
      case "pricing":
        return (
          <div className={`relative ${!config.pricing?.visible ? 'opacity-40 grayscale' : ''}`}>
            <SectionToggle label="אזור מחירון" sectionKey="pricing" />
            <PricingSection
              id={config.pricing?.anchorId || "pricing"}
              title={config.pricing?.title}
              subtitle={config.pricing?.subtitle}
              description={config.pricing?.description}
              packages={config.pricing?.packages}
              isEditing={true}
              onUpdate={(field, val) => {
                setConfig({
                  ...config,
                  pricing: {
                    ...config.pricing!,
                    [field]: val
                  }
                });
              }}
            />
          </div>
        );
      case "richContent":
        return (
          <div className={`relative ${!config.richContent?.visible ? 'opacity-40 grayscale' : ''}`}>
            <SectionToggle label="אזור תוכן מעוצב (Rich Content)" sectionKey="richContent" />
            <RichContentSection 
              id={config.richContent?.anchorId || "richContent"}
              heading={config.richContent?.heading}
              body={config.richContent?.body}
              layout={config.richContent?.layout}
              isEditing={true}
              onUpdate={(field, val) => {
                setConfig({
                  ...config,
                  richContent: {
                    ...config.richContent!,
                    [field]: val
                  }
                });
              }}
            />
          </div>
        );
      case "landingSection":
        if (!config.landingSection) return null;
        return (
          <div className={`relative ${!config.landingSection.visible ? 'opacity-40 grayscale' : ''}`}>
            <SectionToggle label="אזור דף נחיתה וטפסים" sectionKey="landingSection" />
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
                isEditing={true}
                onUpdate={(field, val) => {
                  setConfig({
                    ...config,
                    landingSection: {
                      ...config.landingSection!,
                      [field]: val
                    }
                  });
                }}
              />
            </Suspense>
          </div>
        );
      default:
        return null;
    }
  };

  const colorThemes = [
    { value: "navy", label: "כחול נייבי", class: "bg-[#0f172a]" },
    { value: "emerald", label: "ירוק ברקת", class: "bg-[#047857]" },
    { value: "rose", label: "אדום ורד", class: "bg-[#be123c]" },
    { value: "violet", label: "סגול מלכותי", class: "bg-[#6d28d9]" },
    { value: "charcoal", label: "פחם אלגנטי", class: "bg-[#374151]" },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar layout={globalSettings.headerLayout} logoUrl={globalSettings.siteLogoUrl} navLinks={globalSettings.navLinks} />
      
      {/* SEO Editor Panel at Top */}
      {isSeoPanelOpen && (
        <div className="bg-slate-50 border-b shadow-inner p-6 animate-in slide-in-from-top-4 duration-300 relative z-[200]" dir="rtl">
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Search className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">הגדרות קידום אתרים (SEO)</h2>
                  <p className="text-xs text-slate-500">עריכת התגיות שמופיעות בגוגל וברשתות חברתיות</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button 
                  onClick={handleGenerateSeo} 
                  disabled={isGeneratingSeo}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 cursor-pointer"
                >
                  {isGeneratingSeo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  צור בעזרת AI
                </Button>
                <button 
                  onClick={() => setIsSeoPanelOpen(false)}
                  className="p-2 rounded-full hover:bg-slate-200 text-slate-500 cursor-pointer transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Fields Form */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">כותרת מטא (Title)</label>
                  <input
                    type="text"
                    value={config.seo?.title || ""}
                    onChange={(e) => setConfig({ ...config, seo: { ...config.seo, description: config.seo?.description || "", title: e.target.value } })}
                    className="w-full px-3 py-2 border rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder='לדוגמה: מחולל הקהילות | המקום שלך באהבה'
                  />
                  <p className="text-[10px] text-slate-400">מומלץ עד 60 תווים</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">תיאור מטא (Description)</label>
                  <textarea
                    value={config.seo?.description || ""}
                    onChange={(e) => setConfig({ ...config, seo: { ...config.seo, title: config.seo?.title || "", description: e.target.value } })}
                    className="w-full px-3 py-2 border rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[80px]"
                    placeholder="תיאור קצר ומושך שיופיע מתחת לכותרת בתוצאות החיפוש..."
                  />
                  <p className="text-[10px] text-slate-400">מומלץ 150-160 תווים</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">מילות מפתח (Keywords)</label>
                  <input
                    type="text"
                    value={config.seo?.keywords || ""}
                    onChange={(e) => setConfig({ ...config, seo: { ...config.seo, title: config.seo?.title || "", description: config.seo?.description || "", keywords: e.target.value } })}
                    className="w-full px-3 py-2 border rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder='הפרד בפסיקים (למשל: קהילה, ייעוץ, פעילות חברתית)'
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">תמונת שיתוף (Open Graph Image)</label>
                  <p className="text-xs text-slate-500 mb-2">תמונה זו תופיע בשיתוף העמוד בווצאפ וברשתות החברתיות</p>
                  <div className="p-2 border rounded-xl bg-white">
                    <ImageUpload 
                      currentImage={config.seo?.image || ""}
                      onSelect={(url) => setConfig({ ...config, seo: { ...config.seo, title: config.seo?.title || "", description: config.seo?.description || "", image: url } })}
                      preserveFormat={true}
                    />
                    <Button 
                      onClick={handleOpenPromptModal} 
                      disabled={isGeneratingSeoImage}
                      variant="outline"
                      className="w-full mt-2 flex items-center justify-center gap-2 border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                    >
                      {isGeneratingSeoImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      צור תמונת שיתוף בעזרת בינה מלאכותית
                    </Button>
                  </div>
                </div>
              </div>

              {/* SERP Preview */}
              <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-800 border-b pb-2">תצוגה מקדימה בגוגל (SERP)</h3>
                <div className="max-w-[600px] text-right" dir="rtl">
                  <div className="flex items-center gap-2 text-sm text-slate-700 mb-1">
                    <div className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center overflow-hidden border">
                      {globalSettings.siteLogoUrl ? (
                        <img src={globalSettings.siteLogoUrl} className="w-full h-full object-cover" />
                      ) : (
                        <Globe className="w-3 h-3 text-slate-400" />
                      )}
                    </div>
                    <div>
                      <span className="block text-xs leading-none">yoursite.com</span>
                      <span className="text-[10px] text-slate-500">https://www.yoursite.com</span>
                    </div>
                  </div>
                  <h4 className="text-xl text-[#1a0dab] hover:underline cursor-pointer font-medium leading-tight truncate">
                    {config.seo?.title || "כותרת העמוד תופיע כאן"}
                  </h4>
                  <p className="text-sm text-[#4d5156] mt-1 line-clamp-2">
                    {config.seo?.description || "תיאור העמוד יופיע כאן. תיאור זה חשוב כדי לשכנע גולשים להיכנס לאתר שלך מתוך תוצאות החיפוש."}
                  </p>
                </div>
                
                {config.seo?.image && (
                  <div className="mt-6 pt-4 border-t">
                    <h3 className="text-xs font-bold text-slate-500 mb-2">תצוגה מקדימה לשיתוף בוואטסאפ:</h3>
                    <div className="max-w-[300px] border rounded-xl overflow-hidden bg-[#f0f2f5]">
                      <img src={config.seo.image} className="w-full h-32 object-cover" />
                      <div className="p-3 bg-white">
                        <h4 className="text-sm font-bold truncate">{config.seo?.title || "כותרת"}</h4>
                        <p className="text-xs text-slate-500 truncate mt-1">{config.seo?.description || "תיאור"}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Admin Floating Control Dashboard */}
      <div className="fixed bottom-24 right-6 z-[100] flex flex-col gap-2.5">
        <Button 
          variant="primary" 
          size="lg" 
          className="rounded-full shadow-2xl bg-green-600 hover:bg-green-700 h-14 w-14 p-0 text-white flex items-center justify-center transition-all duration-300 scale-110 cursor-pointer"
          onClick={handleSave}
          disabled={saving}
          title="שמור שינויים"
        >
          <Save className="w-6 h-6" />
        </Button>
        
        <Button 
          variant="outline" 
          size="lg" 
          className="rounded-full shadow-2xl bg-white hover:bg-slate-100 text-indigo-600 border border-indigo-100 h-14 w-14 p-0 flex items-center justify-center transition-all duration-300 hover:scale-105 cursor-pointer"
          onClick={handleOpenDrawer}
          title="הגדרות עיצוב גלובליות"
        >
          <Settings2 className="w-6 h-6" />
        </Button>

        <Button 
          variant="outline" 
          size="lg" 
          className="rounded-full shadow-2xl bg-white hover:bg-slate-100 text-slate-700 h-14 w-14 p-0 border flex items-center justify-center transition-all duration-300 cursor-pointer"
          onClick={() => {
            sessionStorage.setItem("home_editor_scroll", window.scrollY.toString());
            setConfig(initialConfig);
            if (initialGlobalSettings) setGlobalSettings(initialGlobalSettings);
            setIsEditing(false);
          }}
          title="ביטול שינויים"
        >
          <X className="w-6 h-6" />
        </Button>
      </div>

      {/* Side Settings Drawer Modal */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-[240] bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => setIsDrawerOpen(false)} />
      )}
      
      <div 
        className={cn(
          "fixed inset-y-0 left-0 z-[250] w-full max-w-lg bg-white border-r shadow-2xl transition-transform duration-300 transform flex flex-col text-right",
          isDrawerOpen ? "translate-x-0" : "-translate-x-full"
        )}
        dir="rtl"
      >
        {/* Drawer Header */}
        <div className="p-6 border-b flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-indigo-600" />
            <h3 className="text-lg font-bold text-slate-800">עריכת עיצוב ותפריטים</h3>
          </div>
          <button 
            onClick={() => setIsDrawerOpen(false)} 
            className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-grow p-6 overflow-y-auto space-y-4">
          
          {/* Accordion Group 1: Logo & Alignment */}
          <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
            <button
              onClick={() => setActiveAccordion(activeAccordion === "logo" ? null : "logo")}
              className="w-full p-4 bg-slate-50 hover:bg-slate-100/80 flex items-center justify-between font-bold text-slate-700 text-sm cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-indigo-600" />
                לוגו ומיקום הלוגו (הדר)
              </span>
              {activeAccordion === "logo" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            {activeAccordion === "logo" && (
              <div className="p-5 bg-white space-y-5 animate-in fade-in duration-200">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600 block">קובץ לוגו האתר</label>
                  {/* Container ensures enough spacing for ImageUpload popup and displays fully */}
                  <div className="p-2 border border-slate-100 rounded-xl bg-slate-50/30">
                    <ImageUpload 
                      currentImage={globalSettings.siteLogoUrl}
                      onSelect={(url) => setGlobalSettings({ ...globalSettings, siteLogoUrl: url })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600 block">מיקום הלוגו בתפריט העליון</label>
                  {/* Toggle button icons right, center, left */}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setGlobalSettings({ ...globalSettings, headerLayout: "classic" })}
                      className={cn(
                        "flex-1 py-3 px-3 border rounded-xl flex flex-col items-center gap-1.5 text-xs font-bold transition-all cursor-pointer",
                        globalSettings.headerLayout === "classic" 
                          ? "border-secondary bg-secondary/5 text-secondary shadow-sm" 
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      )}
                    >
                      <AlignRight className="h-5 w-5" />
                      <span>ימין (קלאסי)</span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setGlobalSettings({ ...globalSettings, headerLayout: "center" })}
                      className={cn(
                        "flex-1 py-3 px-3 border rounded-xl flex flex-col items-center gap-1.5 text-xs font-bold transition-all cursor-pointer",
                        globalSettings.headerLayout === "center" 
                          ? "border-secondary bg-secondary/5 text-secondary shadow-sm" 
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      )}
                    >
                      <AlignCenter className="h-5 w-5" />
                      <span>מרכז</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setGlobalSettings({ ...globalSettings, headerLayout: "left" })}
                      className={cn(
                        "flex-1 py-3 px-3 border rounded-xl flex flex-col items-center gap-1.5 text-xs font-bold transition-all cursor-pointer",
                        globalSettings.headerLayout === "left" 
                          ? "border-secondary bg-secondary/5 text-secondary shadow-sm" 
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      )}
                    >
                      <AlignLeft className="h-5 w-5" />
                      <span>שמאל</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Accordion Group 2: Color Palette */}
          <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
            <button
              onClick={() => setActiveAccordion(activeAccordion === "theme" ? null : "theme")}
              className="w-full p-4 bg-slate-50 hover:bg-slate-100/80 flex items-center justify-between font-bold text-slate-700 text-sm cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Palette className="h-4 w-4 text-indigo-600" />
                צבעי עיצוב (פלטה)
              </span>
              {activeAccordion === "theme" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            {activeAccordion === "theme" && (
              <div className="p-5 bg-white space-y-3 animate-in fade-in duration-200">
                <label className="text-xs font-bold text-slate-600 block">בחר פלטת צבעים גלובלית</label>
                <div className="flex flex-col gap-2">
                  {colorThemes.map((t) => {
                    const isSelected = globalSettings.theme === t.value;
                    return (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setGlobalSettings({ ...globalSettings, theme: t.value as any })}
                        className={cn(
                          "w-full p-3 rounded-xl border flex items-center justify-between text-sm font-semibold transition-all cursor-pointer",
                          isSelected 
                            ? "border-secondary bg-secondary/5 text-secondary shadow-sm" 
                            : "border-slate-100 bg-white text-slate-600 hover:bg-slate-50"
                        )}
                      >
                        <span className="flex items-center gap-3">
                          <span className={cn("h-4 w-4 rounded-full shadow-inner", t.class)} />
                          {t.label}
                        </span>
                        {isSelected && <Check className="h-4 w-4 text-secondary" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Accordion Group 3: Main Menu Editor */}
          <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
            <button
              onClick={() => setActiveAccordion(activeAccordion === "navigation" ? null : "navigation")}
              className="w-full p-4 bg-slate-50 hover:bg-slate-100/80 flex items-center justify-between font-bold text-slate-700 text-sm cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <LayoutTemplate className="h-4 w-4 text-indigo-600" />
                עורך תפריט ניווט ראשי
              </span>
              {activeAccordion === "navigation" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            {activeAccordion === "navigation" && (
              <div className="p-5 bg-white space-y-4 animate-in fade-in duration-200">
                {isLoadingPages ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-secondary" />
                    <p className="text-xs font-bold text-slate-400">טוען את עמודי האתר לעריכה...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500">פריטי תפריט ({globalSettings.navLinks?.length || 0})</span>
                      <Button
                        type="button"
                        onClick={handleAddLink}
                        variant="outline"
                        className="py-1 px-3 border border-secondary/20 hover:border-secondary/50 text-secondary rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="h-3 w-3" />
                        הוסף קישור
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {(globalSettings.navLinks || []).map((link, idx) => (
                        <div key={idx} className="p-3 border rounded-xl bg-slate-50/50 space-y-2 relative group/link">
                          {/* Arrange controls */}
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                            <span className="text-xs font-bold text-indigo-600">פריט #{idx + 1}</span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => handleMoveLink(idx, 'up')}
                                className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 text-slate-500 cursor-pointer"
                                title="הזז למעלה"
                              >
                                <ArrowUp className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={idx === (globalSettings.navLinks || []).length - 1}
                                onClick={() => handleMoveLink(idx, 'down')}
                                className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 text-slate-500 cursor-pointer"
                                title="הזז למטה"
                              >
                                <ArrowDown className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteLink(idx)}
                                className="p-1 rounded hover:bg-red-50 text-red-500 hover:text-red-700 cursor-pointer"
                                title="מחק קישור"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Form fields */}
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-500">כותרת הקישור</label>
                              <input
                                type="text"
                                value={link.name}
                                onChange={(e) => handleUpdateLinkName(idx, e.target.value)}
                                className="w-full px-2 py-1.5 border rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-secondary/50 focus:border-secondary"
                                placeholder="לדוגמה: שיעורים"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-500">עמוד יעד</label>
                              <select
                                value={link.href}
                                onChange={(e) => handleUpdateLinkHref(idx, e.target.value)}
                                className="w-full px-2 py-1.5 border rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-secondary/50 focus:border-secondary font-medium cursor-pointer"
                              >
                                <optgroup label="עמודים">
                                  <option value="/">עמוד הבית (בית)</option>
                                  {sitePages.map((page: any) => (
                                    <option key={page.id} value={page.url}>
                                      {page.title} ({page.url})
                                    </option>
                                  ))}
                                </optgroup>
                                <optgroup label="עוגנים בעמוד הבית">
                                  {availableAnchors.map(anchor => (
                                    <option key={anchor.id} value={`/#${anchor.id}`}>
                                      {anchor.label} (/#{anchor.id})
                                    </option>
                                  ))}
                                </optgroup>
                                <optgroup label="אחר">
                                  {/* Allow typing custom link path by matching option value */}
                                  {!sitePages.some(p => p.url === link.href) && !availableAnchors.some(a => `/#${a.id}` === link.href) && link.href !== "/" && (
                                    <option value={link.href}>קישור מותאם: {link.href}</option>
                                  )}
                                  <option value="/custom">-- הגדר קישור ידנית --</option>
                                </optgroup>
                              </select>
                            </div>
                          </div>

                          {/* Fallback to text input if manually entering custom path */}
                          {(link.href === "/custom" || (!sitePages.some(p => p.url === link.href) && !availableAnchors.some(a => `/#${a.id}` === link.href) && link.href !== "/")) && (
                            <div className="space-y-1 animate-in slide-in-from-top-1 duration-150">
                              <label className="text-[10px] font-bold text-slate-500">נתיב קישור ידני (URL/Path)</label>
                              <input
                                type="text"
                                value={link.href === "/custom" ? "" : link.href}
                                onChange={(e) => handleUpdateLinkHref(idx, e.target.value)}
                                className="w-full px-2 py-1.5 border rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-secondary/50"
                                placeholder="לדוגמה: /custom-path או http://..."
                              />
                            </div>
                          )}
                        </div>
                      ))}

                      {(globalSettings.navLinks || []).length === 0 && (
                        <p className="text-center py-6 text-xs text-slate-400 font-medium">אין קישורים בתפריט. הוסף קישור חדש!</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Accordion Group 4: Contact Widget Editor */}
          <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
            <button
              onClick={() => setActiveAccordion(activeAccordion === "contactWidget" ? null : "contactWidget")}
              className="w-full p-4 bg-slate-55 hover:bg-slate-100/80 flex items-center justify-between font-bold text-slate-700 text-sm cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-indigo-650" />
                פרטי קשר של כפתור 'אנחנו כאן'
              </span>
              {activeAccordion === "contactWidget" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            {activeAccordion === "contactWidget" && (
              <div className="p-5 bg-white space-y-4 animate-in fade-in duration-200 text-right">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 block">מספר טלפון לקשר / וואטסאפ</label>
                  <input
                    type="text"
                    value={globalSettings.contactPhone || ""}
                    onChange={(e) => setGlobalSettings({ ...globalSettings, contactPhone: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-secondary"
                    placeholder="למשל: 0545947701"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 block">כתובת אימייל</label>
                  <input
                    type="email"
                    value={globalSettings.contactEmail || ""}
                    onChange={(e) => setGlobalSettings({ ...globalSettings, contactEmail: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-secondary"
                    placeholder="למשל: email@example.com"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 block">קישור לפייסבוק</label>
                  <input
                    type="text"
                    value={globalSettings.contactFacebook || ""}
                    onChange={(e) => setGlobalSettings({ ...globalSettings, contactFacebook: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-secondary"
                    placeholder="קישור מלא לפרופיל / דף פייסבוק"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 block">כתובת פיזית (עבור וויז)</label>
                  <input
                    type="text"
                    value={globalSettings.contactAddress || ""}
                    onChange={(e) => setGlobalSettings({ ...globalSettings, contactAddress: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-secondary"
                    placeholder="למשל: יצחק שדה 2, אזור"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Accordion Group 5: SEO Button */}
          <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
            <button
              onClick={() => {
                setIsDrawerOpen(false);
                setIsSeoPanelOpen(true);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="w-full p-4 bg-indigo-50 hover:bg-indigo-100 flex items-center justify-between font-bold text-indigo-700 text-sm cursor-pointer transition-colors"
            >
              <span className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                הגדרות קידום אתרים (SEO)
              </span>
            </button>
          </div>

        </div>

        {/* Drawer Footer Actions */}
        <div className="p-6 border-t bg-slate-50 flex gap-2">
          <Button
            onClick={() => setIsDrawerOpen(false)}
            variant="primary"
            className="flex-grow py-3 rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md"
          >
            <Check className="h-5 w-5" />
            אישור וסגירה
          </Button>
        </div>
      </div>

      <main className="flex-grow pt-24">
        <Reorder.Group 
          axis="y" 
          values={config.sectionOrder || ["hero", "mainContent", "services", "community", "livePosts", "timer", "richContent", "contact"]} 
          onReorder={(newOrder) => setConfig({ ...config, sectionOrder: newOrder })}
          className="flex flex-col w-full"
        >
          {(config.sectionOrder || ["hero", "mainContent", "services", "community", "livePosts", "timer", "richContent", "contact"]).map((sectionId) => {
            const isMobileHidden = config.mobileHiddenSections?.includes(sectionId) || false;
            const sectionData = config[sectionId as keyof HomePageConfig] as any;
            const styleProps = {} as React.CSSProperties;
            let hasCustomBg = false;
            let hasCustomHover = false;
            
            if (sectionData?.backgroundColor && sectionData.backgroundColor !== "#ffffff" && sectionData.backgroundColor !== "") {
              (styleProps as any)['--custom-bg'] = sectionData.backgroundColor;
              hasCustomBg = true;
            }
            if (sectionData?.hoverColor && sectionData.hoverColor !== "#f8fafc" && sectionData.hoverColor !== "") {
              (styleProps as any)['--hover-color'] = sectionData.hoverColor;
              hasCustomHover = true;
            }

            let cssRules = "";
            if (hasCustomBg) {
              cssRules = `#wrapper-${sectionId} section { background-color: transparent !important; }`;
            } else if (hasCustomHover) {
              cssRules = `#wrapper-${sectionId}:hover section { background-color: transparent !important; }`;
            }

            return (
              <Reorder.Item 
                key={sectionId} 
                value={sectionId} 
                id={`wrapper-${sectionId}`}
                className={`relative group/reorder transition-colors duration-300 ${hasCustomBg ? 'bg-[var(--custom-bg)]' : ''} ${hasCustomHover ? 'hover:!bg-[var(--hover-color)]' : ''}`}
                style={styleProps}
              >
                {cssRules ? <style dangerouslySetInnerHTML={{__html: cssRules}} /> : null}
                {/* Drag Handle & Mobile Switch */}
                <div className="absolute top-4 right-4 z-[100] opacity-0 group-hover/reorder:opacity-100 transition-opacity bg-white/95 shadow-lg backdrop-blur-sm rounded-xl p-1.5 border flex items-center gap-2" dir="rtl">
                  <div className="cursor-grab active:cursor-grabbing p-1.5 hover:bg-slate-100 rounded-lg text-slate-500" title="גרור לשינוי סדר">
                    <GripVertical className="w-4 h-4" />
                  </div>
                  <div className="w-[1px] h-4 bg-slate-200" />
                  <button
                    type="button"
                    onClick={() => {
                      const current = config.mobileHiddenSections || [];
                      const updated = current.includes(sectionId)
                        ? current.filter(id => id !== sectionId)
                        : [...current, sectionId];
                      setConfig({ ...config, mobileHiddenSections: updated });
                    }}
                    className={cn(
                      "flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer select-none",
                      isMobileHidden 
                        ? "bg-red-50 text-red-600 hover:bg-red-100/80" 
                        : "bg-green-50 text-green-600 hover:bg-green-100/80"
                    )}
                    title={isMobileHidden ? "מוסתר בנייד - לחץ להצגה" : "מוצג בנייד - לחץ להסתרה"}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>{isMobileHidden ? "מוסתר בנייד" : "מוצג בנייד"}</span>
                  </button>
                </div>
                {renderSection(sectionId)}
              </Reorder.Item>
            );
          })}
        </Reorder.Group>
      </main>

      <Footer />

      {/* Image Prompt Modal */}
      {isPromptModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl" dir="rtl">
            <h3 className="text-xl font-bold text-slate-800 mb-2">ערוך פרומפט ליצירת תמונה</h3>
            <p className="text-sm text-slate-500 mb-4">
              ערוך את הטקסט כדי לתאר במדויק את התמונה שתרצה לקבל.
            </p>
            <textarea
              value={customImagePrompt}
              onChange={(e) => setCustomImagePrompt(e.target.value)}
              className="w-full h-32 px-3 py-2 border rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4"
              dir="ltr"
            />
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsPromptModalOpen(false)}>ביטול</Button>
              <Button onClick={handleGenerateSeoImage} disabled={isGeneratingSeoImage}>
                {isGeneratingSeoImage ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Sparkles className="w-4 h-4 ml-2" />}
                צור תמונה
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
