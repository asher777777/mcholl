"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Send, ArrowRight, Users, Loader2, Filter } from "lucide-react";
import Link from "next/link";
import { HebrewEmailEditor } from "@/features/emails/components/HebrewEmailEditor";
import { sendCampaign, getContactsForEmailing } from "@/features/emails/actions";
import { Contact } from "@/features/crm/types";

export function CreateCampaignForm() {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("<p>הקלד כאן את תוכן המייל...</p>");
  const [contacts, setContacts] = useState<Contact[]>([]);
  
  // Filtering state
  const [filterKey, setFilterKey] = useState<string>("all");
  const [filterValue, setFilterValue] = useState<string>("");

  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadContacts() {
      setIsLoading(true);
      try {
        const data = await getContactsForEmailing();
        setContacts(data);
      } catch (err) {
        console.error(err);
        setError("שגיאה בטעינת אנשי קשר");
      } finally {
        setIsLoading(false);
      }
    }
    loadContacts();
  }, []);

  // Determine available keys from contacts for the filter dropdown
  const availableKeys = useMemo(() => {
    const keys = new Set<string>();
    contacts.forEach(contact => {
      Object.keys(contact).forEach(key => {
        if (key !== "id" && key !== "ownerId" && key !== "createdAt" && key !== "updatedAt" && typeof contact[key] === "string") {
          keys.add(key);
        }
      });
    });
    return Array.from(keys).sort();
  }, [contacts]);

  // Translate common keys for better UX
  const keyTranslations: Record<string, string> = {
    conta_name: "שם איש קשר",
    email: "כתובת אימייל",
    conta_phone: "מספר טלפון",
    mh_crm_city: "עיר",
    gender: "מגזר / מין",
    company_name: "שם חברה",
    lead_source: "מקור הגעה",
    status: "סטטוס"
  };

  const filteredContacts = useMemo(() => {
    if (filterKey === "all" || !filterValue.trim()) {
      return contacts;
    }
    return contacts.filter(contact => {
      const val = contact[filterKey];
      if (!val) return false;
      return String(val).toLowerCase().includes(filterValue.toLowerCase());
    });
  }, [contacts, filterKey, filterValue]);

  const handleSend = async () => {
    if (!subject.trim()) {
      setError("נא להזין נושא לקמפיין");
      return;
    }
    if (filteredContacts.length === 0) {
      setError("אין נמענים לשליחה (בדוק את הסינון)");
      return;
    }

    setIsSending(true);
    setError("");

    const recipients = filteredContacts.map(c => c.email as string).filter(Boolean);

    try {
      const res = await sendCampaign(subject, content, recipients);
      if (res.success) {
        router.push("/dashboard/emails");
        router.refresh();
      } else {
        setError(res.error || "שגיאה בשליחת הקמפיין");
      }
    } catch (err: any) {
      setError(err.message || "שגיאה בשליחת הקמפיין");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/emails"
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <ArrowRight className="w-5 h-5 text-slate-600" />
          </Link>
          <h2 className="text-2xl font-bold text-slate-800">יצירת קמפיין חדש</h2>
        </div>
        <button
          onClick={handleSend}
          disabled={isSending || isLoading}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-medium transition-colors shadow-sm"
        >
          {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {isSending ? "שולח..." : "שלח קמפיין"}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm font-medium">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Subject */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <label className="block text-sm font-semibold text-slate-700">נושא המייל</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="לדוגמה: עדכונים חשובים לחודש הקרוב..."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              dir="rtl"
            />
          </div>

          {/* Editor */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <label className="block text-sm font-semibold text-slate-700">תוכן המייל</label>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <HebrewEmailEditor value={content} onChange={setContent} />
            </div>
          </div>
        </div>

        {/* Sidebar - Recipients */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center gap-2 text-slate-800 font-bold border-b pb-4">
              <Users className="w-5 h-5 text-indigo-500" />
              <h3>בחירת נמענים</h3>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
              </div>
            ) : (
              <div className="space-y-4">
                {/* Filter */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-slate-600 flex items-center gap-1.5">
                    <Filter className="w-4 h-4" /> סינון נמענים
                  </label>
                  <select
                    value={filterKey}
                    onChange={(e) => setFilterKey(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="all">כל אנשי הקשר (בעלי אימייל)</option>
                    {availableKeys.map(key => (
                      <option key={key} value={key}>
                        {keyTranslations[key] || key}
                      </option>
                    ))}
                  </select>

                  {filterKey !== "all" && (
                    <input
                      type="text"
                      value={filterValue}
                      onChange={(e) => setFilterValue(e.target.value)}
                      placeholder="הזן ערך לסינון..."
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  )}
                </div>

                <div className="p-4 bg-indigo-50 rounded-xl flex items-center justify-between">
                  <span className="text-sm font-medium text-indigo-900">סה"כ נמענים:</span>
                  <span className="text-xl font-bold text-indigo-700">{filteredContacts.length}</span>
                </div>
                
                <p className="text-xs text-slate-500 text-center">
                  מיילים יישלחו רק לאנשי קשר שהוזנה להם כתובת אימייל תקינה במערכת.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
