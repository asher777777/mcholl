"use client";

import { useState, useEffect } from "react";
import { createManualInvoice } from "./actions";
import { getContacts } from "@/features/crm/actions";
import { Button } from "@/components/ui/Button";
import { CheckCircle2, AlertCircle, FileText, Banknote, Landmark, CreditCard as CreditCardIcon } from "lucide-react";
import { KesherCheckout } from "./KesherCheckout";
import { Contact } from "@/features/crm/types";

export function KesherManualReceiptsForm() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  
  useEffect(() => {
    // Fetch contacts from CRM to populate the datalist
    getContacts({ per_page: 1000 }).then((res) => {
      if (res && res.contacts) {
        setContacts(res.contacts);
      }
    });
  }, []);

  const [formData, setFormData] = useState({
    clientName: "",
    amount: "",
    paymentType: "Cash" as "Cash" | "Check" | "BankTransfer" | "CreditCard",
    receiptType: "000",
    zeout: "",
    phone: "",
    details: "",
    date: new Date().toLocaleDateString("he-IL").replace(/\./g, '/'), // Kesher format: dd/mm/yyyy
    
    // Extra fields for check / transfer
    checkNumber: "",
    bankName: "",
    branchNumber: "",
    accountNumber: "",
    transferRef: "",
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess("");
    setError("");

    if (!formData.clientName || !formData.amount) {
      setError("נא למלא שם לקוח וסכום.");
      setLoading(false);
      return;
    }

    try {
      const res = await createManualInvoice({
        ...formData,
        amount: Number(formData.amount),
      });

      if (res.success) {
        console.log("תוצאת השליחה לקשר (Kesher API Result):", res.kesherResult);
        if (res.payloadSent) {
          console.log("%cבקשה שנשלחה לקשר (מוכנה להעתקה):", "color: #0284c7; font-weight: bold; font-size: 14px;");
          console.log(JSON.stringify(res.payloadSent, null, 2));
        }
        setSuccess(res.message || "הקבלה הופקה בהצלחה ונשמרה בקשר!");
        // Reset form
        setFormData({
          clientName: "",
          amount: "",
          paymentType: "Cash",
          receiptType: "405",
          zeout: "",
          phone: "",
          details: "",
          date: new Date().toLocaleDateString("he-IL").replace(/\./g, '/'),
          checkNumber: "",
          bankName: "",
          branchNumber: "",
          accountNumber: "",
          transferRef: "",
        });
      } else {
        console.log("%cשגיאה מקשר:", "color: #dc2626; font-weight: bold; font-size: 14px;", res.error);
        if (res.payloadSent) {
          console.log("%cבקשה שנשלחה לקשר (מוכנה להעתקה):", "color: #0284c7; font-weight: bold; font-size: 14px;");
          console.log(JSON.stringify(res.payloadSent, null, 2));
        }
        if (res.rawResponse) {
          console.log("%cתשובה גולמית מקשר:", "color: #dc2626; font-weight: bold; font-size: 14px;");
          console.log(res.rawResponse);
        }
        setError(res.error || "שגיאה לא ידועה בהפקת הקבלה.");
      }
    } catch (err: any) {
      console.error("Exception:", err);
      setError("שגיאת תקשורת: " + err.message);
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white border rounded-2xl shadow-sm p-6 md:p-8 max-w-3xl space-y-8" dir="rtl">
      
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <p className="font-medium text-sm">{success}</p>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <p className="font-medium text-sm">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold mb-2 text-slate-700">שם התורם / הלקוח *</label>
          <input
            type="text"
            list="crm-contacts-list"
            value={formData.clientName}
            onChange={(e) => {
              const selectedName = e.target.value;
              const contact = contacts.find(c => c.conta_name === selectedName);
              if (contact) {
                setFormData({
                  ...formData, 
                  clientName: selectedName,
                  phone: contact.conta_phone || formData.phone,
                });
              } else {
                setFormData({ ...formData, clientName: selectedName });
              }
            }}
            className="w-full h-12 px-4 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="בחר מרשימה או הקלד שם חדש"
            required
            autoComplete="off"
          />
          <datalist id="crm-contacts-list">
            {contacts.map((c) => (
              <option key={c.id} value={c.conta_name}>
                {c.conta_phone ? `${c.conta_phone}` : ""}
              </option>
            ))}
          </datalist>
        </div>
        
        <div>
          <label className="block text-sm font-semibold mb-2 text-slate-700">סכום לתשלום (₪) *</label>
          <input
            type="number"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            className="w-full h-12 px-4 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 font-bold text-lg"
            placeholder="0.00"
            required
            min="1"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2 text-slate-700">מספר פרויקט</label>
          <input
            type="text"
            value={formData.receiptType}
            onChange={(e) => setFormData({ ...formData, receiptType: e.target.value })}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-700"
            placeholder="000"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2 text-slate-700">אמצעי תשלום</label>
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, paymentType: "Cash" })}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold rounded-lg transition-colors ${
                formData.paymentType === "Cash" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <Banknote className="w-4 h-4" /> מזומן
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, paymentType: "Check" })}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold rounded-lg transition-colors ${
                formData.paymentType === "Check" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <FileText className="w-4 h-4" /> צ'ק
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, paymentType: "BankTransfer" })}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold rounded-lg transition-colors ${
                formData.paymentType === "BankTransfer" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <Landmark className="w-4 h-4" /> העברה
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, paymentType: "CreditCard" })}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold rounded-lg transition-colors ${
                formData.paymentType === "CreditCard" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <CreditCardIcon className="w-4 h-4" /> אשראי
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2 text-slate-700">תעודת זהות / ח.פ (אופציונלי)</label>
          <input
            type="text"
            value={formData.zeout}
            onChange={(e) => setFormData({ ...formData, zeout: e.target.value })}
            className="w-full h-12 px-4 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2 text-slate-700">טלפון לקוח (למשלוח SMS אופציונלי)</label>
          <input
            type="text"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full h-12 px-4 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
            dir="ltr"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-semibold mb-2 text-slate-700">הערות ותיאור כללי</label>
          <input
            type="text"
            value={formData.details}
            onChange={(e) => setFormData({ ...formData, details: e.target.value })}
            className="w-full h-12 px-4 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="יופיע בשורת ההערות בקבלה"
          />
        </div>

      </div>

      {/* Conditional Fields for Check */}
      {formData.paymentType === "Check" && (
        <div className="bg-slate-50 border rounded-2xl p-6 space-y-4">
          <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-indigo-600" />
            פרטי צ'ק
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2 text-slate-700">מספר צ'ק *</label>
              <input
                type="text"
                value={formData.checkNumber}
                onChange={(e) => setFormData({ ...formData, checkNumber: e.target.value })}
                className="w-full h-11 px-4 bg-white border rounded-lg outline-none focus:ring-2 focus:ring-primary/20"
                required={formData.paymentType === "Check"}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-slate-700">בנק *</label>
              <input
                type="text"
                value={formData.bankName}
                onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                className="w-full h-11 px-4 bg-white border rounded-lg outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="מספר בנק (לדוגמה 12)"
                required={formData.paymentType === "Check"}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-slate-700">סניף *</label>
              <input
                type="text"
                value={formData.branchNumber}
                onChange={(e) => setFormData({ ...formData, branchNumber: e.target.value })}
                className="w-full h-11 px-4 bg-white border rounded-lg outline-none focus:ring-2 focus:ring-primary/20"
                required={formData.paymentType === "Check"}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-slate-700">מספר חשבון *</label>
              <input
                type="text"
                value={formData.accountNumber}
                onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                className="w-full h-11 px-4 bg-white border rounded-lg outline-none focus:ring-2 focus:ring-primary/20"
                required={formData.paymentType === "Check"}
              />
            </div>
          </div>
        </div>
      )}

      {/* Conditional Fields for Bank Transfer */}
      {formData.paymentType === "BankTransfer" && (
        <div className="bg-slate-50 border rounded-2xl p-6 space-y-4">
          <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2 mb-4">
            <Landmark className="w-5 h-5 text-indigo-600" />
            פרטי העברה בנקאית
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2 text-slate-700">מספר אסמכתא *</label>
              <input
                type="text"
                value={formData.transferRef}
                onChange={(e) => setFormData({ ...formData, transferRef: e.target.value })}
                className="w-full h-11 px-4 bg-white border rounded-lg outline-none focus:ring-2 focus:ring-primary/20"
                required={formData.paymentType === "BankTransfer"}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-slate-700">בנק מעביר *</label>
              <input
                type="text"
                value={formData.bankName}
                onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                className="w-full h-11 px-4 bg-white border rounded-lg outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="מספר בנק (לדוגמה 12)"
                required={formData.paymentType === "BankTransfer"}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-slate-700">סניף מעביר *</label>
              <input
                type="text"
                value={formData.branchNumber}
                onChange={(e) => setFormData({ ...formData, branchNumber: e.target.value })}
                className="w-full h-11 px-4 bg-white border rounded-lg outline-none focus:ring-2 focus:ring-primary/20"
                required={formData.paymentType === "BankTransfer"}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-slate-700">מספר חשבון מעביר *</label>
              <input
                type="text"
                value={formData.accountNumber}
                onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                className="w-full h-11 px-4 bg-white border rounded-lg outline-none focus:ring-2 focus:ring-primary/20"
                required={formData.paymentType === "BankTransfer"}
              />
            </div>
          </div>
        </div>
      )}

      <div className="pt-4 border-t">
        {formData.paymentType === "CreditCard" ? (
          <div className="space-y-4">
            {!formData.clientName || !formData.amount ? (
              <div className="p-4 bg-amber-50 text-amber-800 rounded-xl text-sm border border-amber-200">
                נא להזין שם לקוח וסכום לפני המעבר לסליקה באשראי.
              </div>
            ) : (
              <KesherCheckout 
                amount={Number(formData.amount)} 
                clientName={formData.clientName} 
                phone={formData.phone} 
                description={formData.details || `סליקה מלוח הבקרה עבור ${formData.clientName}`} 
                onSuccess={() => setSuccess("הסליקה בוצעה בהצלחה!")}
              />
            )}
          </div>
        ) : (
          <Button type="submit" disabled={loading} className="w-full md:w-auto h-12 px-8 font-bold text-lg">
            {loading ? "מפיק קבלה..." : "הפק קבלה בקשר"}
          </Button>
        )}
      </div>

    </form>
  );
}
