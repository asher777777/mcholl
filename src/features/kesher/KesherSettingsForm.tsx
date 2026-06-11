"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { getKesherSettings, saveKesherSettings } from "./actions";
import { Loader2, CheckCircle2 } from "lucide-react";

export function KesherSettingsForm() {
  const [settings, setSettings] = useState({ terminalNumber: "", apiKey: "", userName: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    getKesherSettings().then((data) => {
      if (data) setSettings(data as any);
      setIsLoading(false);
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveMessage("");
    try {
      const res = await saveKesherSettings(settings);
      if (res.success) {
        setSaveMessage("ההגדרות נשמרו בהצלחה!");
      } else {
        setSaveMessage("שגיאה בשמירת ההגדרות: " + res.error);
      }
    } catch (e) {
      setSaveMessage("שגיאה בתקשורת עם השרת");
    }
    setIsSaving(false);
    
    setTimeout(() => {
      setSaveMessage("");
    }, 3000);
  };

  if (isLoading) {
    return <div className="flex items-center gap-2 p-4 text-slate-500"><Loader2 className="w-4 h-4 animate-spin" /> טוען הגדרות...</div>;
  }

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-xl bg-white border border-slate-100 rounded-2xl p-6 shadow-sm relative overflow-hidden" dir="rtl">
      {saveMessage && (
        <div className="absolute top-0 left-0 right-0 bg-emerald-50 text-emerald-700 text-sm font-bold text-center py-2 flex items-center justify-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> {saveMessage}
        </div>
      )}
      
      <div className={saveMessage ? "pt-4" : ""}>
        <label className="block text-sm font-bold text-slate-700 mb-2">שם משתמש (Username)</label>
        <input 
          type="text" 
          value={settings.userName || ""} 
          onChange={(e) => setSettings({...settings, userName: e.target.value})} 
          className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-left"
          placeholder="לדוגמה: yossi123"
          dir="ltr"
          required
        />
        <p className="text-[11px] text-slate-500 mt-1.5 font-medium">שם המשתמש לחשבון ב-Kesher.</p>
      </div>

      <div>
        <label className="block text-sm font-bold text-slate-700 mb-2">מספר מסוף בקשר (Terminal Number)</label>
        <input 
          type="text" 
          value={settings.terminalNumber} 
          onChange={(e) => setSettings({...settings, terminalNumber: e.target.value})} 
          className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-left"
          placeholder="לדוגמה: 12345"
          dir="ltr"
          required
        />
        <p className="text-[11px] text-slate-500 mt-1.5 font-medium">מספר המסוף כפי שהתקבל מחברת קשר למטרות סליקה.</p>
      </div>

      <div>
        <label className="block text-sm font-bold text-slate-700 mb-2">מפתח API (API Key)</label>
        <input 
          type="password" 
          value={settings.apiKey} 
          onChange={(e) => setSettings({...settings, apiKey: e.target.value})} 
          className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-left font-mono"
          placeholder="הכנס את המפתח הסודי"
          dir="ltr"
          required
        />
        <p className="text-[11px] text-slate-500 mt-1.5 font-medium">המפתח משמש להזדהות מול השרתים של קשר לאימות תשלומים.</p>
      </div>

      <Button type="submit" disabled={isSaving} className="w-full h-12 font-bold rounded-xl shadow-md hover:scale-[1.01] transition-transform">
        {isSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> שומר...</> : "שמור הגדרות סליקה"}
      </Button>
    </form>
  );
}
