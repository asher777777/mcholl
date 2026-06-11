import { getAllServices } from "@/features/services/actions";
import { ServiceForm } from "./ServiceForm";
import { ServiceListClient } from "./ServiceListClient";

export default async function ServicesDashboardPage() {
  const services = await getAllServices();

  // Add the hardcoded Shabbat page so it appears in the list
  services.unshift({
    id: "shabbat",
    slug: "shabbat",
    type: "shabbat",
    hero: {
      title: "זמני שבת ותפילות",
      description: "עמוד זמני כניסת ויציאת שבת, פרשת השבוע, ולוח תפילות."
    },
    views: 0,
    leads: 0,
    purchases: 0
  } as any);

  return (
    <div className="space-y-8 text-right" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-slate-800">ניהול עמודים ודפי נחיתה (CMS)</h2>
          <p className="text-muted-foreground text-sm mt-1">נהל וערוך באופן דינמי את עמודי השירות ודפי הנחיתה המנוהלים בינה מלאכותית באתר.</p>
        </div>
      </div>

      <ServiceForm />

      <ServiceListClient initialServices={services} />
    </div>
  );
}
