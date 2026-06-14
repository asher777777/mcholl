"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { getKesherSettings, saveKesherSettings, connectEasyCount } from "./actions";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

export function KesherSettingsForm() {
  const [settings, setSettings] = useState({ paymentPageId: "", apiKey: "", userName: "", ezCountToken: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  
  const [isConnecting, setIsConnecting] = useState(false);
  const [ezMessage, setEzMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    getKesherSettings().then((data) => {
      if (data) {
        setSettings({
          paymentPageId: data.paymentPageId || data.terminalNumber || "", // fallback to old key
          apiKey: data.apiKey || "",
          userName: data.userName || "",
          ezCountToken: data.ezCountToken || ""
        });
      }
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

  const handleConnectEzCount = async () => {
    if (!settings.ezCountToken) {
      setEzMessage({ type: "error", text: "נא להזין טוקן של איזיקאונט." });
      return;
    }
    setIsConnecting(true);
    setEzMessage({ type: "", text: "" });
    try {
      // First save current settings just in case
      await saveKesherSettings(settings);
      const res = await connectEasyCount(settings.ezCountToken);
      if (res.success) {
        setEzMessage({ type: "success", text: res.message || "חובר בהצלחה!" });
      } else {
        setEzMessage({ type: "error", text: res.error || "שגיאה בחיבור לאיזיקאונט." });
      }
    } catch (err: any) {
      setEzMessage({ type: "error", text: "שגיאת תקשורת." });
    }
    setIsConnecting(false);
  };

  if (isLoading) {
    return <div className="flex items-center gap-2 p-4 text-slate-500"><Loader2 className="w-4 h-4 animate-spin" /> טוען הגדרות...</div>;
  }

  return (
    <div className="space-y-8 max-w-xl bg-white border border-slate-100 rounded-2xl p-6 shadow-sm relative overflow-hidden" dir="rtl">
      {saveMessage && (
        <div className="absolute top-0 left-0 right-0 bg-emerald-50 text-emerald-700 text-sm font-bold text-center py-2 flex items-center justify-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> {saveMessage}
        </div>
      )}
      
      <form onSubmit={handleSave} className={`space-y-6 ${saveMessage ? "pt-4" : ""}`}>
        <div>
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
          <label className="block text-sm font-bold text-slate-700 mb-2">מספר דף תשלום (Payment Page ID)</label>
          <input 
            type="text" 
            value={settings.paymentPageId} 
            onChange={(e) => setSettings({...settings, paymentPageId: e.target.value})} 
            className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-left"
            placeholder="לדוגמה: 12345"
            dir="ltr"
            required
          />
          <p className="text-[11px] text-slate-500 mt-1.5 font-medium">מספר הדף (Payment Page ID) כפי שמופיע בלוח הבקרה של קשר.</p>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">מפתח API (API Key / Password)</label>
          <input 
            type="password" 
            value={settings.apiKey} 
            onChange={(e) => setSettings({...settings, apiKey: e.target.value})} 
            className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-left font-mono"
            placeholder="הכנס את המפתח הסודי"
            dir="ltr"
            required
          />
          <p className="text-[11px] text-slate-500 mt-1.5 font-medium">המפתח (או הסיסמה) משמש להזדהות מול השרתים של קשר לאימות תשלומים.</p>
        </div>

        <Button type="submit" disabled={isSaving} className="w-full h-12 font-bold rounded-xl shadow-md hover:scale-[1.01] transition-transform">
          {isSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> שומר...</> : "שמור הגדרות סליקה"}
        </Button>
      </form>

      <div className="pt-6 border-t space-y-4">
        <h3 className="font-bold text-slate-800">חיבור להפקת מסמכים באיזיקאונט (EasyCount)</h3>
        
        {ezMessage.text && (
          <div className={`p-3 rounded-xl flex items-center gap-2 text-sm font-medium ${ezMessage.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
            {ezMessage.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {ezMessage.text}
          </div>
        )}

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">טוקן איזיקאונט (EasyCount Token)</label>
          <div className="flex gap-2">
            <input 
              type="text" 
              value={settings.ezCountToken || ""} 
              onChange={(e) => setSettings({...settings, ezCountToken: e.target.value})} 
              className="flex-1 h-12 px-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-left font-mono"
              placeholder="טוקן חיבור..."
              dir="ltr"
            />
            <Button onClick={handleConnectEzCount} disabled={isConnecting} variant="outline" className="h-12 px-6 rounded-xl border-indigo-200 text-indigo-700 hover:bg-indigo-50">
              {isConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : "חבר לאיזיקאונט"}
            </Button>
          </div>
          <p className="text-[11px] text-slate-500 mt-1.5 font-medium">הטוקן שהתקבל משירות התמיכה של קשר לטובת חיבור מסמכים.</p>
        </div>
      </div>
    </div>
  );
}
