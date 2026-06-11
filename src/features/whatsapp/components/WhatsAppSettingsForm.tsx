"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { getWhatsAppSettings, saveWhatsAppSettings } from "../actions";

export function WhatsAppSettingsForm() {
  const [settings, setSettings] = useState({ idInstance: "", apiToken: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    getWhatsAppSettings().then((data) => {
      if (data) setSettings(data);
      setIsLoading(false);
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);
    try {
      const res = await saveWhatsAppSettings(settings);
      if (res.success) {
        setMessage({ text: "הגדרות חיבור WhatsApp נשמרו בהצלחה!", type: "success" });
      } else {
        setMessage({ text: "שגיאה בשמירת ההגדרות: " + res.error, type: "error" });
      }
    } catch (e) {
      setMessage({ text: "שגיאה בתקשורת עם השרת", type: "error" });
    }
    setIsSaving(false);
  };

  if (isLoading) return <div className="text-slate-500 animate-pulse text-sm">טוען הגדרות...</div>;

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-xl bg-card border border-slate-200/60 rounded-[2rem] p-6 md:p-8 shadow-sm text-right" dir="rtl">
      {message && (
        <div className={`p-4 rounded-2xl text-xs font-bold border ${
          message.type === "success" ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-red-50 border-red-100 text-red-600"
        }`}>
          {message.text}
        </div>
      )}
      
      <div className="space-y-2">
        <label className="block text-xs font-black text-slate-500 uppercase tracking-wider">ID Instance (מזהה חיבור)</label>
        <input 
          type="text" 
          value={settings.idInstance} 
          onChange={(e) => setSettings({...settings, idInstance: e.target.value.trim()})} 
          className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-muted/10 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-left"
          dir="ltr"
          placeholder="1101xxxxxx"
          required
        />
      </div>
      
      <div className="space-y-2">
        <label className="block text-xs font-black text-slate-500 uppercase tracking-wider">API Token (מפתח אבטחה)</label>
        <input 
          type="text" 
          value={settings.apiToken} 
          onChange={(e) => setSettings({...settings, apiToken: e.target.value.trim()})} 
          className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-muted/10 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-left"
          dir="ltr"
          placeholder="abcdef1234567890..."
          required
        />
        <p className="text-[10px] text-muted-foreground pt-1">
          ניתן לקבל פרטים אלו מלוח הבקרה של Green API לאחר הרשמה ויצירת מופע (Instance).
        </p>
      </div>
      
      <Button type="submit" disabled={isSaving} className="w-full h-12 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white">
        {isSaving ? "שומר הגדרות..." : "שמור הגדרות וואטסאפ"}
      </Button>
    </form>
  );
}
