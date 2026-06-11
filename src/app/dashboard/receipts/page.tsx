import { KesherManualReceiptsForm } from "@/features/kesher/KesherManualReceiptsForm";

export default function ReceiptsPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2 text-right">
        <h1 className="text-3xl font-black tracking-tight text-slate-900">קבלות ידניות</h1>
        <p className="text-slate-500">
          הפקת קבלות וחשבוניות מס עבור תרומות שהתקבלו במזומן, צ'ק, או העברה בנקאית (ישירות למערכת קשר).
        </p>
      </div>
      <KesherManualReceiptsForm />
    </div>
  );
}
