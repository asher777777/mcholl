"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { generatePageWithAI } from "@/features/services/actions";
import { Loader2, Wand2, Plus, Layout, Sparkles, FileText, X } from "lucide-react";
import { useRouter } from "next/navigation";

const PAGE_TYPES = [
  { 
    id: 'service' as const, 
    label: 'עמוד פיצ\'ר / שירות', 
    desc: 'להצגת יכולות המערכת, פיצ\'רים חדשים או שירותים למכירה ללקוחות',
    icon: Layout,
    color: 'from-blue-500 to-indigo-600',
    bg: 'hover:border-blue-500/50 hover:bg-blue-50/20'
  },
  { 
    id: 'landing' as const, 
    label: 'דף נחיתה / הצעת מכר', 
    desc: 'דף נחיתה לפיצ\'ר מתוך המערכת ללקוח קיים או הצעת חבילה ללקוח פוטנציאלי',
    icon: Sparkles,
    color: 'from-purple-500 to-pink-600',
    bg: 'hover:border-purple-500/50 hover:bg-purple-50/20'
  },
  { 
    id: 'post' as const, 
    label: 'פוסט / מקרה בוחן', 
    desc: 'סיפורי הצלחה (Case Studies), בלוג מקצועי, מאמרים ועדכוני גרסה',
    icon: FileText,
    color: 'from-amber-500 to-orange-600',
    bg: 'hover:border-amber-500/50 hover:bg-amber-50/20'
  }
];

export function ServiceForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [type, setType] = useState<'service' | 'landing' | 'post'>("service");
  const [slug, setSlug] = useState("");
  const [prompt, setPrompt] = useState("");
  const [tone, setTone] = useState("חם, מקרב ומזמין");
  const [audience, setAudience] = useState("תורמים ושותפים");
  const [selectedSections, setSelectedSections] = useState<string[]>(['hero', 'services', 'contact']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug || !prompt) {
      setError("נא למלא את כל השדות");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await generatePageWithAI(prompt, slug, type, tone, audience, selectedSections);
      if (result.success) {
        setIsOpen(false);
        setWizardStep(1);
        setSlug("");
        setPrompt("");
        setSelectedSections(['hero', 'services', 'contact']);
        
        // Dynamic routing based on generated page type
        if (type === 'post') {
          router.push(`/post/${result.slug}`);
        } else if (type === 'landing') {
          router.push(`/landing/${result.slug}`);
        } else {
          router.push(`/service/${result.slug}`);
        }
      } else {
        setError(result.error || "שגיאה ביצירת העמוד. ודא שהגדרת GEMINI_API_KEY בשרת.");
      }
    } catch (e: any) {
      setError(e.message || "שגיאה לא ידועה");
    } finally {
      setLoading(false);
    }
  };

  const [generatingSEO, setGeneratingSEO] = useState(false);
  const [isSEOModalOpen, setIsSEOModalOpen] = useState(false);
  const [seoInstructions, setSeoInstructions] = useState("");
  const [seoSlug, setSeoSlug] = useState("");

  const handleGenerateSEOPage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seoInstructions || !seoSlug) {
      alert("נא למלא מילות מפתח וכתובת");
      return;
    }

    setGeneratingSEO(true);
    try {
      const seoPrompt = `הוראות המשתמש ומילות מפתח: ${seoInstructions}. אנא צור עמוד תוכן מעוצב שהמילים אותם בחר המשתמש יהיו מילות המפתח. העמוד יכיל תוכן איכותי לפי הוראות המשתמש. חובה לכתוב יותר מ-500 מילים. השתמש בתבנית עורך הבית עבור עמוד זה.`;
      
      const result = await generatePageWithAI(seoPrompt, seoSlug, "post", "חם, מקרב ומזמין", "תורמים ושותפים", ['hero', 'richContent', 'contact']);
      
      if (result.success) {
        alert("עמוד ה-SEO נוצר בהצלחה!");
        setIsSEOModalOpen(false);
        setSeoInstructions("");
        setSeoSlug("");
        router.push(`/post/${result.slug}`);
      } else {
        alert("שגיאה ביצירת העמוד: " + result.error);
      }
    } catch (err: any) {
      alert("שגיאה: " + err.message);
    } finally {
      setGeneratingSEO(false);
    }
  };

  if (!isOpen && !isSEOModalOpen) {
    return (
      <div className="flex flex-wrap gap-4">
        <Button onClick={() => setIsOpen(true)} className="gap-2 bg-gradient-to-r from-primary to-secondary text-white font-bold px-6 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300">
          <Plus className="w-5 h-5" /> צור עמוד חדש ב-AI
        </Button>
        <Button onClick={() => setIsSEOModalOpen(true)} disabled={generatingSEO} className="gap-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold px-6 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300">
          <Sparkles className="w-5 h-5" /> צור עמוד SEO
        </Button>
      </div>
    );
  }

  if (isSEOModalOpen) {
    return (
      <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 space-y-6 relative animate-in fade-in slide-in-from-top-4 duration-300">
        <button 
          onClick={() => setIsSEOModalOpen(false)}
          className="absolute top-6 left-6 p-1.5 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="space-y-2 text-right" dir="rtl">
          <h3 className="text-2xl font-black flex items-center gap-2.5 text-slate-800">
            <div className="p-2 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            יצירת עמוד SEO
          </h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            הזן מילות מפתח, הוראות וכתובת רצויה כדי לייצר עמוד תוכן עשיר למנועי חיפוש.
          </p>
        </div>

        <form onSubmit={handleGenerateSEOPage} className="space-y-6 text-right" dir="rtl">
          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-700">מילות מפתח והוראות</label>
            <textarea
              value={seoInstructions}
              onChange={(e) => setSeoInstructions(e.target.value)}
              placeholder="לדוגמה: פיתוח תוכנה בהתאמה אישית, אוטומציה, קידום אתרים..."
              className="w-full p-4 border rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm min-h-[100px] transition-all resize-none"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-700">כתובת אינטרנט (Slug)</label>
            <div className="flex items-center gap-2.5" dir="ltr">
              <span className="text-slate-400 font-mono text-sm bg-slate-50 border px-3 py-2 rounded-xl">
                /post/
              </span>
              <input
                type="text"
                value={seoSlug}
                onChange={(e) => setSeoSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                placeholder="e.g. tefillin-check"
                className="flex-1 p-3 border rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm transition-all"
                dir="ltr"
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsSEOModalOpen(false)}
              className="rounded-xl px-5 h-11"
            >
              ביטול
            </Button>
            <Button 
              type="submit" 
              disabled={generatingSEO} 
              className="gap-2 text-white font-bold bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl px-6 h-11 shadow-md hover:shadow-lg transition-all"
            >
              {generatingSEO ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
              {generatingSEO ? "מייצר..." : "חולל עמוד SEO"}
            </Button>
          </div>
        </form>
      </div>
    );
  }

  const selectedTypeObj = PAGE_TYPES.find(t => t.id === type);
  const IconComponent = selectedTypeObj?.icon || Layout;

  return (
    <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 space-y-6 relative animate-in fade-in slide-in-from-top-4 duration-300">
      <button 
        onClick={() => setIsOpen(false)}
        className="absolute top-6 left-6 p-1.5 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="space-y-2 text-right" dir="rtl">
        <h3 className="text-2xl font-black flex items-center gap-2.5 text-slate-800">
          <div className={`p-2 rounded-2xl bg-gradient-to-br ${selectedTypeObj?.color} text-white shadow-md`}>
            <IconComponent className="w-5 h-5" />
          </div>
          מחולל עמודים ותכנים חכם ב-AI
        </h3>
        <p className="text-muted-foreground text-sm leading-relaxed">
          בחר את סוג העמוד הרצוי, הזן כתובת (Slug) ותיאור חופשי, והבינה המלאכותית תעצב ותייצר עמוד SEO עשיר ומוכן לשימוש.
        </p>
      </div>

      <form onSubmit={handleGenerate} className="space-y-6 text-right" dir="rtl">
        {wizardStep === 1 && (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700">1. בחר את סוג העמוד</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {PAGE_TYPES.map((t) => {
                  const IsSelected = type === t.id;
                  const TIcon = t.icon;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setType(t.id)}
                      className={`p-4 rounded-3xl border-2 text-right transition-all duration-300 flex flex-col gap-3 group relative overflow-hidden ${
                        IsSelected 
                          ? 'border-indigo-600 bg-indigo-50/10 shadow-md ring-2 ring-indigo-500/10' 
                          : `border-slate-100 bg-white ${t.bg}`
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${
                        IsSelected ? t.color : 'from-slate-100 to-slate-200 text-slate-500'
                      } text-white transition-all`}>
                        <TIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm group-hover:text-indigo-600 transition-colors">
                          {t.label}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                          {t.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700">2. הגדר כתובת אינטרנט (Slug)</label>
              <div className="flex items-center gap-2.5" dir="ltr">
                <span className="text-slate-400 font-mono text-sm bg-slate-50 border px-3 py-2 rounded-xl">
                  /{type === 'post' ? 'post' : type === 'landing' ? 'landing' : 'service'}/
                </span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                  placeholder="e.g. mezuzah-check"
                  className="flex-1 p-3 border rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm transition-all"
                  dir="ltr"
                  required
                />
              </div>
              <p className="text-[11px] text-muted-foreground">אותיות באנגלית קטנות, מספרים ומקפים בלבד (לדוגמה: shavuot-event).</p>
            </div>
          </div>
        )}

        {/* Step 2: Tone & Audience */}
        {wizardStep === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700">3. קהל יעד מרכזי</label>
              <select
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm transition-all bg-white"
              >
                <option value="תורמים ושותפים">תורמים ושותפים</option>
                <option value="מתנדבים ופעילים">מתנדבים ופעילים</option>
                <option value="חברות ותאגידים (B2B)">חברות ותאגידים (B2B)</option>
                <option value="משפחות וקהילה מקומית">משפחות וקהילה מקומית</option>
                <option value="מוסדות וארגוני מגזר שלישי">מוסדות וארגוני מגזר שלישי</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700">4. טון וסגנון כתיבה</label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm transition-all bg-white"
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
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700">5. בחירת אזורים להצגה</label>
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
                  { id: 'pricing', label: 'מחירון / תרומות' },
                  { id: 'timer', label: 'ספירה לאחור / יעד קמפיין' },
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

        {/* Step 4: Prompt description */}
        {wizardStep === 4 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700">6. על מה העמוד? (הנחיה ל-AI)</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={
                  type === 'service' 
                    ? "לדוגמה: עמוד המציג את מערכת סליקת התרומות המתקדמת שלנו, עם דגש על אבטחה, נוחות והתאמה לעמותות."
                    : type === 'landing'
                    ? "לדוגמה: צור עמוד נחיתה לפיצ'ר מתוך המערכת ללקוח קיים, או הצעת חבילה ללקוח פוטנציאלי."
                    : "לדוגמה: מקרה בוחן (Case Study) על איך המערכת שלנו עזרה לארגון להכפיל את מערך גיוס התרומות שלו."
                }
                className="w-full p-4 border rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm min-h-[120px] transition-all resize-none"
                required
              />
              <p className="text-[11px] text-slate-500">ה-AI ייצר עבורך באופן אוטומטי מבנה מלא עם טפסים מתאימים ומיקום נכון לכל אזור לפי בחירתך.</p>
            </div>
          </div>
        )}

        {error && (
          <p className="text-red-500 text-sm font-semibold bg-red-50 p-3 rounded-xl border border-red-100 animate-shake">
            {error}
          </p>
        )}

        <div className="flex gap-3 justify-between pt-3">
          <div>
            {wizardStep > 1 && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setWizardStep(wizardStep - 1)}
                className="rounded-xl px-5 h-11"
              >
                חזור
              </Button>
            )}
          </div>
          <div className="flex gap-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => { setIsOpen(false); setWizardStep(1); }}
              className="rounded-xl px-5 h-11"
            >
              ביטול
            </Button>
            {wizardStep < 4 ? (
              <Button 
                type="button" 
                onClick={() => {
                  if (wizardStep === 1 && !slug) {
                    setError("נא למלא את כתובת ה-Slug");
                    return;
                  }
                  setError("");
                  setWizardStep(wizardStep + 1);
                }}
                className={`gap-2 text-white font-bold bg-gradient-to-r ${selectedTypeObj?.color} rounded-xl px-6 h-11 shadow-md hover:shadow-lg transition-all`}
              >
                המשך לשלב הבא
              </Button>
            ) : (
              <Button 
                type="submit" 
                disabled={loading} 
                className={`gap-2 text-white font-bold bg-gradient-to-r ${selectedTypeObj?.color} rounded-xl px-6 h-11 shadow-md hover:shadow-lg transition-all`}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                {loading ? "מייצר תוכן חכם..." : "חולל עמוד ב-AI"}
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
