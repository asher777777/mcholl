import { auth } from "@/lib/auth";
import { getUsers } from "@/features/users/actions";
import { UsersTable } from "@/features/users/components/UsersTable";
import { redirect } from "next/navigation";

export default async function UsersPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const users = await getUsers();

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-3xl font-bold text-slate-800 mb-2">ניהול משתמשים והרשאות</h1>
        <p className="text-slate-500">צפה, ערוך ונהל את משתמשי המערכת, כולל הגדרות תפקידים ותאריכי תפוגה.</p>
      </div>

      <UsersTable initialUsers={users} />
    </div>
  );
}
