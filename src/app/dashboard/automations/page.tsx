import { Suspense } from "react";
import { getAutomations } from "@/features/automations/actions";
import AutomationsClient from "./AutomationsClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "אוטומציות ו-Webhooks",
};

export default async function AutomationsPage() {
  const automations = await getAutomations();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">מערכת אוטומציות</h2>
          <p className="text-muted-foreground">נהל Webhooks, חיבורי טפסים ורצפי פעולות (Make פנימי)</p>
        </div>
      </div>

      <Suspense fallback={<div className="h-96 animate-pulse bg-muted rounded-xl" />}>
        <AutomationsClient initialAutomations={automations} />
      </Suspense>
    </div>
  );
}
