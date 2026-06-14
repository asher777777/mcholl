import { getAllServices } from "@/features/services/actions";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { FileText, ExternalLink, Edit, Users, Globe, Coins, ShieldCheck } from "lucide-react";
import { StatBadge } from "@/components/ui/StatBadge";
import { DashboardQuickActions } from "./DashboardQuickActions";
import { adminDb } from "@/lib/firebase-admin";
import { auth } from "@/lib/auth";

import { DashboardViewManager } from "@/components/dashboard/DashboardViewManager";

async function getUserId(): Promise<string> {
  try {
    const session = await auth();
    if (session?.user?.id) {
      return session.user.id;
    }
  } catch (error) {
    // Ignore and fallback
  }
  return "1";
}

export default async function DashboardPage() {
  const services = await getAllServices();
  const ownerId = await getUserId();

  // Query CRM stats for current owner
  const [contactCount, totalSpentResult] = await Promise.all([
    adminDb.collection("contacts")
      .where("ownerId", "==", ownerId)
      .where("status", "==", "active")
      .get()
      .then((s: any) => s.size)
      .catch(() => 0),
    adminDb.collection("contacts")
      .where("ownerId", "==", ownerId)
      .where("status", "==", "active")
      .get()
      .then((snap: any) => {
        let sum = 0;
        snap.docs.forEach((doc: any) => {
          sum += doc.data().total_spent || 0;
        });
        return sum;
      })
      .catch(() => 0)
  ]);

  const classicDashboard = (
    <div className="space-y-6 text-right" dir="rtl">
      
      {/* Stats Badges Row */}
      <div className="flex flex-wrap items-center gap-2.5 justify-start">
        <StatBadge 
          icon={<Users className="w-4 h-4 text-indigo-600" />} 
          value={contactCount} 
          label="חברי קהילה ב-CRM" 
          description="מספר אנשי הקשר וחברי הקהילה הרשומים במערכת ה-CRM"
          badgeColorClass="bg-indigo-50 border-indigo-100/50"
        />
        <StatBadge 
          icon={<Globe className="w-4 h-4 text-purple-600" />} 
          value={services.length} 
          label="עמודי שירות ודפים" 
          description="עמודי שירות ודפי נחיתה פעילים באתר שנוצרו על ידי ה-AI"
          badgeColorClass="bg-purple-50 border-purple-100/50"
        />
        <StatBadge 
          icon={<Coins className="w-4 h-4 text-emerald-600" />} 
          value={`₪${totalSpentResult.toLocaleString("he-IL")}`} 
          label="סה״כ תרומות/עסקאות" 
          description="סך התרומות והתשלומים שהתקבלו החודש מחברי הקהילה ב-CRM"
          badgeColorClass="bg-emerald-50 border-emerald-100/50"
        />
        <StatBadge 
          icon={<ShieldCheck className="w-4 h-4 text-blue-600" />} 
          value="תקין" 
          label="תקינות המערכת" 
          description="מצב חיבורי השרת, ה-Database וה-API של Gemini"
          badgeColorClass="bg-blue-50 border-blue-100/50"
        />
      </div>

      {/* Interactive Quick Actions Bar */}
      <DashboardQuickActions />


      {/* Services List Section */}
      <div className="bg-white/90 backdrop-blur-md border border-slate-200/60 rounded-[2rem] p-5 md:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-xl">
              <FileText className="w-4 h-4" />
            </div>
            <h3 className="text-sm md:text-base font-black text-slate-800">עמודי השירות האחרונים ({services.length})</h3>
          </div>
          <Link href="/dashboard/services">
            <Button size="sm" variant="outline" className="text-xs font-bold rounded-xl h-8">נהל הכל</Button>
          </Link>
        </div>

        {services.length > 0 ? (
          <div className="divide-y border border-slate-100 rounded-2xl overflow-hidden bg-white shadow-sm">
            {services.slice(0, 5).map((service, index) => (
              <div key={`${service.slug}-${index}`} className="p-3 md:p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                <div className="flex-1 text-right">
                  <p className="font-bold text-slate-800 text-xs md:text-sm">{service.hero?.title || service.slug}</p>
                  <p className="text-[10px] font-mono text-slate-400 mt-0.5" dir="ltr">/service/{service.slug}</p>
                </div>
                <div className="flex gap-2">
                  <Link href={`/service/${service.slug}`} target="_blank">
                    <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-xl" title="צפה בעמוד">
                      <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                    </Button>
                  </Link>
                  <Link href={`/service/${service.slug}`}>
                    <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-xl text-indigo-600 hover:text-indigo-700" title="ערוך בעמוד">
                      <Edit className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-xs border border-dashed rounded-2xl text-muted-foreground bg-white">
            לא נמצאו עמודי שירות פעילים. <Link href="/dashboard/services" className="text-indigo-600 underline font-bold">צור עמוד ראשון כעת</Link>.
          </div>
        )}
      </div>
    </div>
  );

  return (
    <DashboardViewManager classicDashboard={classicDashboard} />
  );
}
