"use client";

import { useState, useEffect } from "react";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { generateHeroImageWithAI } from "@/features/services/actions";
import { Button } from "@/components/ui/Button";
import { Sparkles, Wand2, Loader2, Image as ImageIcon } from "lucide-react";
import { getAllSitePages } from "@/features/home/actions";

interface HeroEditorProps {
  imageSrc?: string;
  buttonsVisible?: boolean;
  primaryButton?: { text: string; link: string };
  secondaryButton?: { text: string; link: string };
  availableAnchors?: { id: string, label: string }[];
  onUpdateHero: (field: "title" | "subtitle" | "description" | "imageSrc" | "buttonsVisible" | "primaryButton" | "secondaryButton", value: any) => void;
}

export function HeroEditor({
  imageSrc,
  buttonsVisible = true,
  primaryButton = { text: "בדיקת תפילין ומזוזות", link: "/services" },
  secondaryButton = { text: "זמני שבת וחגים", link: "/shabbat" },
  availableAnchors = [],
  onUpdateHero
}: HeroEditorProps) {
  const [sitePages, setSitePages] = useState<any[]>([]);

  useEffect(() => {
    getAllSitePages().then(setSitePages);
  }, []);
  const [aiPrompt, setAiPrompt] = useState("");
  const [generatingImage, setGeneratingImage] = useState(false);
  const [aiError, setAiError] = useState("");

  const handleUpdate = (field: any, val: any) => {
    onUpdateHero(field, val);
  };

  const handleGenerateImage = async () => {
    if (!aiPrompt) return;
    setGeneratingImage(true);
    setAiError("");
    try {
      const res = await generateHeroImageWithAI(aiPrompt);
      if (res.success && res.url) {
        handleUpdate("imageSrc", res.url);
      } else {
        setAiError(res.error || "שגיאה ביצירת התמונה.");
      }
    } catch (e: any) {
      setAiError(e.message || "שגיאה בתקשורת עם השרת.");
    } finally {
      setGeneratingImage(false);
    }
  };

  return (
    <div className="relative z-50 w-full max-w-6xl mx-auto px-4 pb-8 mt-12">
      <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 border border-slate-200 shadow-2xl space-y-4 text-right" dir="rtl">
        <div className="flex items-center justify-between border-b pb-2">
          <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-primary" />
            הגדרות אזור התוכן
          </h4>
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-xs font-medium text-slate-600">הצג כפתורים</span>
            <div className="relative inline-flex items-center">
              <input 
                type="checkbox" 
                className="sr-only peer"
                checked={buttonsVisible}
                onChange={(e) => handleUpdate("buttonsVisible", e.target.checked)}
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
            </div>
          </label>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          <div className="flex flex-col items-center gap-2">
            <h5 className="text-xs font-bold text-slate-700 w-full text-right">תמונת רקע</h5>
            <ImageUpload 
              currentImage={imageSrc}
              onSelect={(url) => handleUpdate("imageSrc", url)}
            />
          </div>
          
          <div className="border-t md:border-t-0 md:border-r border-slate-200 pt-4 md:pt-0 md:pr-6 space-y-3">
            <h5 className="text-xs font-bold text-slate-700 flex items-center gap-2">
              <Sparkles className="w-3 h-3 text-purple-600 animate-pulse" />
              מחולל תמונות AI
            </h5>
            <div className="space-y-2">
              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="תאר את התמונה שברצונך ליצור..."
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 outline-none text-slate-800 focus:border-purple-400 min-h-[60px] resize-none"
              />
              {aiError && (
                <p className="text-[10px] font-medium text-red-600 bg-red-50 p-1.5 rounded border border-red-200">
                  {aiError}
                </p>
              )}
              <Button
                type="button"
                onClick={handleGenerateImage}
                disabled={generatingImage || !aiPrompt}
                className="w-full h-8 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg gap-2 font-bold text-xs shadow-md"
              >
                {generatingImage ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" /> מייצר...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-3 h-3" /> ייצר תמונה
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="border-t md:border-t-0 md:border-r border-slate-200 pt-4 md:pt-0 md:pr-6 space-y-3">
            <h5 className="text-xs font-bold text-slate-700">עריכת כפתורים</h5>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-medium">כפתור ראשי (טקסט וקישור)</label>
                <div className="flex flex-col gap-2">
                  <input type="text" value={primaryButton.text} onChange={(e) => handleUpdate("primaryButton", { ...primaryButton, text: e.target.value })} className="w-full text-xs border rounded p-1" placeholder="טקסט הלחצן" />
                  
                  <select
                    value={primaryButton.link}
                    onChange={(e) => handleUpdate("primaryButton", { ...primaryButton, link: e.target.value })}
                    className="w-full text-xs border rounded p-1 bg-white focus:outline-none focus:border-purple-400 font-medium cursor-pointer"
                  >
                    <optgroup label="עמודים">
                      <option value="/">עמוד הבית (בית)</option>
                      {sitePages.map((page, idx) => (
                        <option key={`${page.id}-${idx}`} value={page.url}>{page.title}</option>
                      ))}
                    </optgroup>
                    <optgroup label="עוגנים בעמוד הבית">
                      {availableAnchors.map(anchor => (
                        <option key={anchor.id} value={`/#${anchor.id}`}>{anchor.label}</option>
                      ))}
                    </optgroup>
                    <optgroup label="אחר">
                      {!sitePages.some(p => p.url === primaryButton.link) && !availableAnchors.some(a => `/#${a.id}` === primaryButton.link) && primaryButton.link !== "/" && (
                        <option value={primaryButton.link}>קישור מותאם: {primaryButton.link}</option>
                      )}
                      <option value="/custom">-- הגדר קישור ידנית --</option>
                    </optgroup>
                  </select>
                  
                  {(primaryButton.link === "/custom" || (!sitePages.some(p => p.url === primaryButton.link) && !availableAnchors.some(a => `/#${a.id}` === primaryButton.link) && primaryButton.link !== "/")) && (
                    <input type="text" value={primaryButton.link === "/custom" ? "" : primaryButton.link} onChange={(e) => handleUpdate("primaryButton", { ...primaryButton, link: e.target.value })} className="w-full text-xs border rounded p-1 text-left" dir="ltr" placeholder="/link" />
                  )}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-medium">כפתור משני (טקסט וקישור)</label>
                <div className="flex flex-col gap-2">
                  <input type="text" value={secondaryButton.text} onChange={(e) => handleUpdate("secondaryButton", { ...secondaryButton, text: e.target.value })} className="w-full text-xs border rounded p-1" placeholder="טקסט הלחצן" />
                  
                  <select
                    value={secondaryButton.link}
                    onChange={(e) => handleUpdate("secondaryButton", { ...secondaryButton, link: e.target.value })}
                    className="w-full text-xs border rounded p-1 bg-white focus:outline-none focus:border-purple-400 font-medium cursor-pointer"
                  >
                    <optgroup label="עמודים">
                      <option value="/">עמוד הבית (בית)</option>
                      {sitePages.map((page, idx) => (
                        <option key={`${page.id}-${idx}`} value={page.url}>{page.title}</option>
                      ))}
                    </optgroup>
                    <optgroup label="עוגנים בעמוד הבית">
                      {availableAnchors.map(anchor => (
                        <option key={anchor.id} value={`/#${anchor.id}`}>{anchor.label}</option>
                      ))}
                    </optgroup>
                    <optgroup label="אחר">
                      {!sitePages.some(p => p.url === secondaryButton.link) && !availableAnchors.some(a => `/#${a.id}` === secondaryButton.link) && secondaryButton.link !== "/" && (
                        <option value={secondaryButton.link}>קישור מותאם: {secondaryButton.link}</option>
                      )}
                      <option value="/custom">-- הגדר קישור ידנית --</option>
                    </optgroup>
                  </select>
                  
                  {(secondaryButton.link === "/custom" || (!sitePages.some(p => p.url === secondaryButton.link) && !availableAnchors.some(a => `/#${a.id}` === secondaryButton.link) && secondaryButton.link !== "/")) && (
                    <input type="text" value={secondaryButton.link === "/custom" ? "" : secondaryButton.link} onChange={(e) => handleUpdate("secondaryButton", { ...secondaryButton, link: e.target.value })} className="w-full text-xs border rounded p-1 text-left" dir="ltr" placeholder="/link" />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
