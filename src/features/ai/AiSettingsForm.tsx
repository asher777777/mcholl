"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { getAiSettings, saveAiSettings } from "./actions";

export function AiSettingsForm() {
  const [settings, setSettings] = useState({ googleAiKey: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    getAiSettings().then((data) => {
      if (data) setSettings(data as any);
      setIsLoading(false);
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await saveAiSettings(settings);
      if (res.success) {
        alert("הגדרות AI נשמרו בהצלחה!");
      } else {
        alert("שגיאה בשמירת הגדרות AI: " + res.error);
      }
    } catch (e) {
      alert("שגיאה בתקשורת עם השרת");
    }
    setIsSaving(false);
  };

  if (isLoading) return <div>טוען...</div>;

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-xl bg-card border rounded-2xl p-6 shadow-sm" dir="rtl">
      <div>
        <label className="block text-sm font-medium mb-2">מפתח API של Google AI (Gemini)</label>
        <input 
          type="password" 
          value={settings.googleAiKey} 
          onChange={(e) => setSettings({...settings, googleAiKey: e.target.value})} 
          placeholder="הזן את מפתח ה-API של Google AI"
          className="w-full h-12 px-4 rounded-xl border bg-muted/30 focus:ring-2 focus:ring-primary/20 outline-none"
          required
        />
        <p className="text-xs text-muted-foreground mt-2">
          מפתח זה משמש ליצירת דפי שירותים ותוכן באמצעות בינה מלאכותית (Gemini 3.1 Pro).
        </p>
      </div>
      <Button type="submit" disabled={isSaving} className="w-full h-12">
        {isSaving ? "שומר..." : "שמור הגדרות AI"}
      </Button>
    </form>
  );
}
