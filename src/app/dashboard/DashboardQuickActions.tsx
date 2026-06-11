"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Wand2, Settings, MessageSquarePlus, Sparkles, Layout, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ContactModal } from "./crm/ContactModal";
import { generatePageWithAI } from "@/features/services/actions";

const PAGE_TYPES = [
  { 
    id: 'service' as const, 
    label: 'עמוד שירות', 
    desc: 'להצגת שירותים בארגון (מוצרים, ייעוץ וכד\')',
    icon: Layout,
    color: 'from-blue-500 to-indigo-600',
    bg: 'hover:border-blue-500/50 hover:bg-blue-50/20'
  },
  { 
    id: 'landing' as const, 
    label: 'דף נחיתה שיווקי', 
    desc: 'דף הרשמה לאירועים, חגים או קמפיינים',
    icon: Sparkles,
    color: 'from-purple-500 to-pink-600',
    bg: 'hover:border-purple-500/50 hover:bg-purple-50/20'
  },
  { 
    id: 'post' as const, 
    label: 'פוסט / דף תוכן', 
    desc: 'מאמרים, דברי תורה או עדכוני קהילה',
    icon: FileText,
    color: 'from-amber-500 to-orange-600',
    bg: 'hover:border-amber-500/50 hover:bg-amber-50/20'
  }
];

export function DashboardQuickActions() {
  const router = useRouter();
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isServiceOpen, setIsServiceOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [serviceType, setServiceType] = useState<'service' | 'landing' | 'post'>("service");
  const [serviceSlug, setServiceSlug] = useState("");
  const [servicePrompt, setServicePrompt] = useState("");
  const [serviceTone, setServiceTone] = useState("חם, מקרב ומזמין");
  const [serviceAudience, setServiceAudience] = useState("כל הקהילה (חילונים ומסורתיים)");
  const [selectedSections, setSelectedSections] = useState<string[]>(['hero', 'services', 'contact']);
  const [serviceLoading, setServiceLoading] = useState(false);
  const [serviceError, setServiceError] = useState("");

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceSlug || !servicePrompt) {
      setServiceError("נא למלא את כל השדות");
      return;
    }

    setServiceLoading(true);
    setServiceError("");

    try {
      const result = await generatePageWithAI(servicePrompt, serviceSlug, serviceType, serviceTone, serviceAudience, selectedSections);
      if (result.success) {
        setIsServiceOpen(false);
        setWizardStep(1);
        setServiceSlug("");
        setServicePrompt("");
        setSelectedSections(['hero', 'services', 'contact']);
        
        // Redirect to new page
        if (serviceType === 'post') {
          router.push(`/post/${result.slug}`);
        } else if (serviceType === 'landing') {
          router.push(`/landing/${result.slug}`);
        } else {
          router.push(`/service/${result.slug}`);
        }
      } else {
        setServiceError(result.error || "שגיאה ביצירת העמוד. ודא שהגדרות Gemini מוגדרות.");
      }
    } catch (e: any) {
      setServiceError(e.message || "שגיאה לא ידועה");
    } finally {
      setServiceLoading(false);
    }
  };

  const handleQuickPostTrigger = () => {
    // 1. Dispatch tab switch event to shell
    window.dispatchEvent(new CustomEvent("switch-dashboard-tab", { detail: "activity" }));
    // 2. Dispatch focus event to AI writer
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent("focus-ai-post-writer"));
    }, 200);
  };

  const selectedTypeObj = PAGE_TYPES.find(t => t.id === serviceType);
  const IconComponent = selectedTypeObj?.icon || Layout;

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsQuickActionsOpen(true)}
        className="fixed bottom-6 left-6 md:bottom-10 md:left-10 z-40 w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgb(79,70,229,0.3)] transition-all duration-300 hover:scale-105"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Quick Actions Modal */}
      <Modal isOpen={isQuickActionsOpen} onClose={() => setIsQuickActionsOpen(false)}>
        <Modal.Content className="max-w-md rounded-[2rem] p-6 md:p-8">
          <div dir="rtl" className="w-full relative">
            <Modal.Close className="left-4 right-auto" />
            <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
              פעולות מהירות
            </h3>
            
            <div className="grid grid-cols-2 gap-3">
              {/* Action 1: Add Contact */}
              <button
                onClick={() => { setIsQuickActionsOpen(false); setIsContactOpen(true); }}
                className="flex flex-col items-center justify-center gap-3 p-4 rounded-2xl border border-slate-100 hover:border-indigo-500/30 bg-slate-50/50 hover:bg-indigo-50/20 text-slate-700 hover:text-indigo-600 font-bold text-sm transition-all duration-300 shadow-sm hover:shadow"
              >
                <div className="p-3 bg-indigo-100 rounded-xl text-indigo-600">
                  <Plus className="w-6 h-6" />
                </div>
                הוסף איש קשר
              </button>

              {/* Action 2: Create Dynamic Page */}
              <button
                onClick={() => { setIsQuickActionsOpen(false); setIsServiceOpen(true); }}
                className="flex flex-col items-center justify-center gap-3 p-4 rounded-2xl border border-slate-100 hover:border-purple-500/30 bg-slate-50/50 hover:bg-purple-50/20 text-slate-700 hover:text-purple-600 font-bold text-sm transition-all duration-300 shadow-sm hover:shadow"
              >
                <div className="p-3 bg-purple-100 rounded-xl text-purple-600">
                  <Wand2 className="w-6 h-6" />
                </div>
                צור דף ב-AI
              </button>

              {/* Action 3: Trigger Quick Post */}
              <button
                onClick={() => { setIsQuickActionsOpen(false); handleQuickPostTrigger(); }}
                className="flex flex-col items-center justify-center gap-3 p-4 rounded-2xl border border-slate-100 hover:border-amber-500/30 bg-slate-50/50 hover:bg-amber-50/20 text-slate-700 hover:text-amber-600 font-bold text-sm transition-all duration-300 shadow-sm hover:shadow"
              >
                <div className="p-3 bg-amber-100 rounded-xl text-amber-600">
                  <MessageSquarePlus className="w-6 h-6" />
                </div>
                פוסט מהיר ב-AI
              </button>

              {/* Action 4: Settings */}
              <button
                onClick={() => { setIsQuickActionsOpen(false); router.push("/dashboard/settings"); }}
                className="flex flex-col items-center justify-center gap-3 p-4 rounded-2xl border border-slate-100 hover:border-slate-400 bg-slate-50/50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 font-bold text-sm transition-all duration-300 shadow-sm hover:shadow"
              >
                <div className="p-3 bg-slate-200 rounded-xl text-slate-600">
                  <Settings className="w-6 h-6" />
                </div>
                הגדרות מערכת
              </button>
            </div>
          </div>
        </Modal.Content>
      </Modal>

      {/* CRM Contact Creation Modal */}
      <ContactModal
        isOpen={isContactOpen}
        onClose={() => setIsContactOpen(false)}
        contact={null}
        onSuccess={() => {
          // Revalidate current page or show success alert
          alert("איש הקשר התווסף בהצלחה!");
          router.refresh();
        }}
      />

      {/* Dynamic AI Page Creator Modal */}
      <Modal isOpen={isServiceOpen} onClose={() => setIsServiceOpen(false)}>
        <Modal.Content className="max-w-2xl rounded-[2rem] p-6 md:p-8">
          <div dir="rtl" className="w-full relative">
            <Modal.Close className="left-4 right-auto" />
            
            <div className="space-y-2 text-right mb-6" dir="rtl">
              <h3 className="text-xl md:text-2xl font-black flex items-center gap-2.5 text-slate-800">
                <div className={`p-2 rounded-2xl bg-gradient-to-br ${selectedTypeObj?.color} text-white shadow-md`}>
                  <IconComponent className="w-5 h-5" />
                </div>
                מחולל עמודים ותכנים ב-AI
              </h3>
              <p className="text-muted-foreground text-xs leading-relaxed">
                צור עמודי שירות, דפי נחיתה ופוסטים מותאמי SEO תוך שניות בעזרת בינה מלאכותית.
              </p>
            </div>

            <form onSubmit={handleCreateService} className="space-y-5 text-right" dir="rtl">
              {/* Step 1: Type & Goal */}
              {wizardStep === 1 && (
                <div className="space-y-5 animate-in fade-in zoom-in-95 duration-300">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-600">1. בחירת סוג העמוד</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {PAGE_TYPES.map((t) => {
                        const isSelected = serviceType === t.id;
                        const TIcon = t.icon;
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => setServiceType(t.id)}
                            className={`p-3 rounded-2xl border-2 text-right transition-all duration-300 flex flex-col gap-2 relative overflow-hidden ${
                              isSelected 
                                ? 'border-indigo-600 bg-indigo-50/10 shadow-sm' 
                                : `border-slate-100 bg-white ${t.bg}`
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br ${
                              isSelected ? t.color : 'from-slate-100 to-slate-200 text-slate-500'
                            } text-white transition-all`}>
                              <TIcon className="w-4 h-4" />
                            </div>
                            <div>
                              <h4 className="font-bold text-slate-800 text-xs">{t.label}</h4>
                              <p className="text-[10px] text-slate-500 mt-1">{t.desc}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-600">2. הגדר כתובת אינטרנט (Slug)</label>
                    <div className="flex items-center gap-2" dir="ltr">
                      <span className="text-slate-400 font-mono text-xs bg-slate-50 border px-3 py-2 rounded-xl">
                        /{serviceType === 'post' ? 'post' : serviceType === 'landing' ? 'landing' : 'service'}/
                      </span>
                      <input
                        type="text"
                        value={serviceSlug}
                        onChange={(e) => setServiceSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                        placeholder="e.g. shabbat-dinner"
                        className="flex-1 p-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-xs transition-all"
                        dir="ltr"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Tone & Audience */}
              {wizardStep === 2 && (
                <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-600">3. קהל יעד מרכזי</label>
                    <select
                      value={serviceAudience}
                      onChange={(e) => setServiceAudience(e.target.value)}
                      className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-xs transition-all bg-white"
                    >
                      <option value="כל הקהילה (חילונים ומסורתיים)">כל הקהילה (חילונים ומסורתיים)</option>
                      <option value="סטודנטים וצעירים">סטודנטים וצעירים</option>
                      <option value="משפחות צעירות">משפחות צעירות</option>
                      <option value="קהל דתי/חרדי">קהל דתי/חרדי</option>
                      <option value="גיל הזהב">גיל הזהב</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-600">4. טון וסגנון כתיבה</label>
                    <select
                      value={serviceTone}
                      onChange={(e) => setServiceTone(e.target.value)}
                      className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-xs transition-all bg-white"
                    >
                      <option value="חם, מקרב ומזמין">חם, מקרב ומזמין (ברירת מחדל)</option>
                      <option value="מרגש ורוחני">מרגש ורוחני</option>
                      <option value="צעיר, קליל ודינמי">צעיר, קליל ודינמי</option>
                      <option value="רשמי, ענייני ומכובד">רשמי, ענייני ומכובד</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Step 3: Sections Selection */}
              {wizardStep === 3 && (
                <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-600">5. בחירת אזורים להצגה</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { id: 'hero', label: 'פתיח (Hero)' },
                        { id: 'services', label: 'שירותים / פריטים' },
                        { id: 'contact', label: 'טופס יצירת קשר' },
                        { id: 'richContent', label: 'תוכן טקסטואלי' },
                        { id: 'mainContent', label: 'תוכן מרכזי (בנטו)' },
                        { id: 'community', label: 'המלצות וקהילה' },
                        { id: 'landingSection', label: 'טופס הרשמה' },
                        { id: 'livePosts', label: 'עדכונים מהשטח' },
                      ].map((sec) => {
                        const isChecked = selectedSections.includes(sec.id);
                        return (
                          <label key={sec.id} className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${isChecked ? 'bg-indigo-50/50 border-indigo-500' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                            <input 
                              type="checkbox" 
                              className="rounded text-indigo-600 w-4 h-4 focus:ring-indigo-500"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedSections([...selectedSections, sec.id]);
                                } else {
                                  setSelectedSections(selectedSections.filter(id => id !== sec.id));
                                }
                              }}
                            />
                            <span className={`text-xs font-medium ${isChecked ? 'text-indigo-700' : 'text-slate-600'}`}>{sec.label}</span>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Prompt */}
              {wizardStep === 4 && (
                <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-600">6. על מה העמוד? (הנחיה ל-AI)</label>
                    <textarea
                      value={servicePrompt}
                      onChange={(e) => setServicePrompt(e.target.value)}
                      placeholder={
                        serviceType === 'service' 
                          ? "לדוגמה: עמוד שירות לבדיקת מזוזות ותפילין עם הדגשת השירות בבית הלקוח."
                          : serviceType === 'landing'
                          ? "לדוגמה: דף נחיתה למסיבת פורים קהילתית, כולל טופס רישום למשפחות."
                          : "לדוגמה: פוסט חיזוק קצר לפרשת השבוע על חשיבות השמחה."
                      }
                      className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-xs min-h-[120px] transition-all resize-none"
                      required
                    />
                    <p className="text-[10px] text-slate-400">ה-AI ייצר עבורך באופן אוטומטי מבנה מלא עם טפסים מתאימים ומיקום נכון לכל אזור לפי בחירתך.</p>
                  </div>
                </div>
              )}

              {serviceError && (
                <p className="text-red-500 text-xs font-bold bg-red-50 p-2.5 rounded-xl border border-red-100">
                  {serviceError}
                </p>
              )}

              <Modal.Footer>
                <div className="flex gap-2.5 justify-between w-full">
                  <div>
                    {wizardStep > 1 && (
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setWizardStep(wizardStep - 1)}
                        className="rounded-xl px-4 h-10 text-xs font-bold"
                      >
                        חזור
                      </Button>
                    )}
                  </div>
                  <div className="flex gap-2.5">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => { setIsServiceOpen(false); setWizardStep(1); }}
                      className="rounded-xl px-4 h-10 text-xs font-bold"
                    >
                      ביטול
                    </Button>
                    
                    {wizardStep < 4 ? (
                      <Button 
                        type="button" 
                        onClick={() => {
                          if (wizardStep === 1 && (!serviceSlug)) {
                            setServiceError("נא למלא את כתובת ה-Slug");
                            return;
                          }
                          setServiceError("");
                          setWizardStep(wizardStep + 1);
                        }}
                        className={`gap-2 text-white font-bold bg-gradient-to-r ${selectedTypeObj?.color} rounded-xl px-5 h-10 text-xs shadow-md hover:shadow-lg transition-all`}
                      >
                        המשך לשלב הבא
                      </Button>
                    ) : (
                      <Button 
                        type="submit" 
                        disabled={serviceLoading} 
                        className={`gap-2 text-white font-bold bg-gradient-to-r ${selectedTypeObj?.color} rounded-xl px-5 h-10 text-xs shadow-md hover:shadow-lg transition-all`}
                      >
                        {serviceLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
                        {serviceLoading ? "מייצר תוכן ובונה דף..." : "חולל עמוד ב-AI"}
                      </Button>
                    )}
                  </div>
                </div>
              </Modal.Footer>
            </form>
          </div>
        </Modal.Content>
      </Modal>
    </>
  );
}
