"use client";

import { useState } from "react";
import { UserDoc, updateUser, deleteUser, createUser } from "../actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Edit2, Trash2, Plus, Calendar } from "lucide-react";
import { format } from "date-fns";

export function UsersTable({ initialUsers }: { initialUsers: UserDoc[] }) {
  const [users, setUsers] = useState<UserDoc[]>(initialUsers);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Partial<UserDoc> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEdit = (user: UserDoc) => {
    setEditingUser(user);
    setIsEditModalOpen(true);
  };

  const handleNew = () => {
    setEditingUser({ role: "TRIAL", username: "", password: "", email: "", name: "" });
    setIsEditModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("האם אתה בטוח שברצונך למחוק משתמש זה?")) return;
    try {
      await deleteUser(id);
      setUsers(users.filter((u) => u.id !== id));
    } catch (err: any) {
      alert("שגיאה במחיקת המשתמש: " + err.message);
    }
  };

  const handleSave = async () => {
    if (!editingUser) return;
    setIsSubmitting(true);
    try {
      if (editingUser.id) {
        await updateUser(editingUser.id, editingUser);
        setUsers(users.map((u) => (u.id === editingUser.id ? { ...u, ...editingUser } as UserDoc : u)));
      } else {
        const res = await createUser(editingUser);
        if (res.success && res.id) {
          setUsers([...users, { ...editingUser, id: res.id, createdAt: new Date().toISOString() } as UserDoc]);
        }
      }
      setIsEditModalOpen(false);
    } catch (err: any) {
      alert("שגיאה בשמירה: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const roleLabels: Record<string, string> = {
    ADMIN: "מנהל ראשי",
    PRO: "משתמש פרו",
    DEVELOPING: "משתמש מתפתח",
    TRIAL: "משתמש ניסיון (14 יום)"
  };

  return (
    <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
      <div className="p-4 border-b flex justify-between items-center bg-slate-50">
        <h2 className="font-bold text-slate-700">רשימת משתמשים במערכת</h2>
        <Button onClick={handleNew} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl">
          <Plus className="w-4 h-4 ml-1" /> משתמש חדש
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-right text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-4 py-3 font-semibold text-slate-600">שם משתמש / אימייל</th>
              <th className="px-4 py-3 font-semibold text-slate-600">שם מלא</th>
              <th className="px-4 py-3 font-semibold text-slate-600">הרשאה (תפקיד)</th>
              <th className="px-4 py-3 font-semibold text-slate-600">תאריך יצירה</th>
              <th className="px-4 py-3 font-semibold text-slate-600">פעולות</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50/50">
                <td className="px-4 py-3 font-medium text-slate-800">{u.username}</td>
                <td className="px-4 py-3 text-slate-600">{u.name}</td>
                <td className="px-4 py-3">
                  <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                    u.role === 'ADMIN' ? 'bg-red-100 text-red-700' :
                    u.role === 'PRO' ? 'bg-indigo-100 text-indigo-700' :
                    u.role === 'DEVELOPING' ? 'bg-amber-100 text-amber-700' :
                    'bg-emerald-100 text-emerald-700'
                  }`}>
                    {roleLabels[u.role] || u.role}
                  </span>
                  {u.role === 'TRIAL' && u.trialExpiresAt && (
                    <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      תפוגה: {format(new Date(u.trialExpiresAt), 'dd/MM/yyyy')}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-500">
                  {u.createdAt ? format(new Date(u.createdAt), 'dd/MM/yyyy HH:mm') : '-'}
                </td>
                <td className="px-4 py-3 flex items-center gap-2">
                  <button onClick={() => handleEdit(u)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(u.id!)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)}>
        <Modal.Content className="max-w-md rounded-[2rem] p-6 text-right">
          <Modal.Header title={editingUser?.id ? "עריכת משתמש" : "יצירת משתמש חדש"} />
          
          <div className="space-y-4 my-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">שם משתמש (חובה)</label>
              <Input
                value={editingUser?.username || ""}
                onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                disabled={!!editingUser?.id} // לא מאפשרים שינוי שם משתמש לאחר יצירה בדרך כלל
                className="rounded-xl bg-slate-50"
              />
            </div>
            
            {!editingUser?.id && (
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">סיסמה (חובה)</label>
                <Input
                  type="password"
                  value={editingUser?.password || ""}
                  onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })}
                  className="rounded-xl"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">שם מלא</label>
              <Input
                value={editingUser?.name || ""}
                onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                className="rounded-xl"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">תפקיד</label>
              <select
                value={editingUser?.role || "TRIAL"}
                onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as any })}
                className="w-full bg-white border rounded-xl p-3 outline-none"
              >
                <option value="ADMIN">מנהל ראשי (Admin)</option>
                <option value="PRO">משתמש פרו (Pro)</option>
                <option value="DEVELOPING">משתמש מתפתח (Developing)</option>
                <option value="TRIAL">משתמש ניסיון (Trial)</option>
              </select>
            </div>

            {editingUser?.role === "TRIAL" && (
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">תאריך פקיעת Trial</label>
                <Input
                  type="date"
                  value={editingUser?.trialExpiresAt ? editingUser.trialExpiresAt.split("T")[0] : ""}
                  onChange={(e) => setEditingUser({ ...editingUser, trialExpiresAt: new Date(e.target.value).toISOString() })}
                  className="rounded-xl"
                />
              </div>
            )}
            
            {editingUser?.id && (
              <div className="pt-4 border-t border-slate-100">
                <label className="block text-sm font-bold text-slate-700 mb-1">שנה סיסמה (אופציונלי)</label>
                <Input
                  type="password"
                  value={editingUser?.password || ""}
                  onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })}
                  className="rounded-xl"
                  placeholder="הזן סיסמה חדשה כדי לשנות"
                />
              </div>
            )}
          </div>

          <Modal.Footer>
            <div className="flex justify-end gap-3 w-full">
              <Button onClick={() => setIsEditModalOpen(false)} variant="outline" className="rounded-xl">ביטול</Button>
              <Button onClick={handleSave} disabled={isSubmitting} className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white">
                {isSubmitting ? "שומר..." : "שמור משתמש"}
              </Button>
            </div>
          </Modal.Footer>
        </Modal.Content>
      </Modal>
    </div>
  );
}
