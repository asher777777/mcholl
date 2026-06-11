import { auth } from "@/lib/auth";
import { SettingsTabs } from "./SettingsTabs";

export default async function SettingsPage() {
  const session = await auth();
  const isGoogleConnected = !!(session as any)?.accessToken;

  return (
    <div className="space-y-8" dir="rtl">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">מרכז בקרה ותפעול</h1>
        <p className="text-gray-400">ניהול אינטגרציות, חיבורים למערכות חיצוניות והגדרות מתקדמות.</p>
      </div>

      <SettingsTabs isGoogleConnected={isGoogleConnected} />
    </div>
  );
}
