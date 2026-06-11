"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Contact, ContactEvent } from "@/features/crm/types";
import { createContact, updateContact, getCustomFields } from "@/features/crm/actions";
import { syncContactMessages } from "@/features/whatsapp/actions";
import { Calendar, Tag, Building, Clock, CreditCard, User, Users, Plus, Trash2, MessageCircle, Phone, Mail, Edit, RefreshCw } from "lucide-react";

const getInitials = (name: string, fm?: string) => {
  const first = name ? name.trim().charAt(0) : "";
  const last = fm ? fm.trim().charAt(0) : "";
  return `${first}${last}`.toUpperCase();
};

const getAvatarBg = (name: string) => {
  const colors = [
    "bg-red-500",
    "bg-pink-500",
    "bg-purple-500",
    "bg-indigo-500",
    "bg-blue-500",
    "bg-sky-500",
    "bg-teal-500",
    "bg-emerald-500",
    "bg-amber-500",
    "bg-orange-500",
  ];
  let sum = 0;
  for (let i = 0; i < name.length; i++) {
    sum += name.charCodeAt(i);
  }
  return colors[sum % colors.length];
};

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  contact: Contact | null; // null if creating a new contact
  onSuccess: () => void;
}

type TabType = "details" | "camp" | "tags" | "company" | "events" | "timeline" | "payments";

export function ContactModal({ isOpen, onClose, contact, onSuccess }: ContactModalProps) {
  const isEdit = !!contact;
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [activeTab, setActiveTab] = useState<TabType>("details");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [syncing, setSyncing] = useState(false);

  const handleSyncWhatsApp = async () => {
    if (!contact?.id || !contaPhone) return;
    setSyncing(true);
    try {
      const res = await syncContactMessages(contact.id, contaPhone);
      if (res.success) {
        alert(`סנכרון וואטסאפ הושלם! סונכרנו ${res.syncedCount} הודעות חדשות.`);
        onSuccess();
        onClose();
      } else {
        alert("שגיאה בסנכרון הודעות וואטסאפ.");
      }
    } catch (err: any) {
      alert("שגיאה בסנכרון: " + (err.message || err));
    } finally {
      setSyncing(false);
    }
  };

  // Form fields state
  const [contaName, setContaName] = useState("");
  const [fM, setFM] = useState("");
  const [contaPhone, setContaPhone] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [city, setCity] = useState("");
  const [street, setStreet] = useState("");
  
  const [tg1, setTg1] = useState("");
  const [tg2, setTg2] = useState("");
  const [tg3, setTg3] = useState("");
  const [notes, setNotes] = useState("");
  
  const [companyName, setCompanyName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [leadSource, setLeadSource] = useState("");
  const [lastFormName, setLastFormName] = useState("");

  const [workPhone, setWorkPhone] = useState("");
  const [website, setWebsite] = useState("");

  // Camp & Family States
  const [childFirstName, setChildFirstName] = useState("");
  const [childLastName, setChildLastName] = useState("");
  const [childGrade, setChildGrade] = useState("");
  const [childIdNumber, setChildIdNumber] = useState("");
  const [allergiesHas, setAllergiesHas] = useState("");
  const [allergiesDetails, setAllergiesDetails] = useState("");
  const [fatherName, setFatherName] = useState("");
  const [motherName, setMotherName] = useState("");
  const [fatherPhone, setFatherPhone] = useState("");
  const [motherPhone, setMotherPhone] = useState("");

  // Repeater states
  const [events, setEvents] = useState<ContactEvent[]>([]);
  const [customFieldsConfig, setCustomFieldsConfig] = useState<any[]>([]);
  const [customFieldsValues, setCustomFieldsValues] = useState<Record<string, any>>({});

  useEffect(() => {
    getCustomFields().then(setCustomFieldsConfig);
  }, []);

  // Initialize fields on open/contact change
  useEffect(() => {
    if (isOpen) {
      setError("");
      setActiveTab("details");
      if (contact) {
        setMode("view");
        setContaName(contact.conta_name || "");
        setFM(contact.f_m || "");
        setContaPhone(contact.conta_phone || "");
        setEmail(contact.email || "");
        setGender(contact.gender || "");
        setBirthDate(contact.birth_date || "");
        setCity(contact.mh_crm_city || "");
        setStreet(contact.mh_crm_street || "");
        setTg1(contact.tg1 || "");
        setTg2(contact.tg2 || "");
        setTg3(contact.tg3 || "");
        setNotes(contact.notes || "");
        setCompanyName(contact.company_name || "");
        setJobTitle(contact.job_title || "");
        setLeadSource(contact.lead_source || "");
        setLastFormName(contact.last_form_name || "");
        setWorkPhone(contact.work_phone || "");
        setWebsite(contact.website || "");
        
        setChildFirstName(contact.child_first_name || "");
        setChildLastName(contact.child_last_name || "");
        setChildGrade(contact.child_grade || "");
        setChildIdNumber(contact.child_id_number || "");
        setAllergiesHas(contact.allergies_has || "");
        setAllergiesDetails(contact.allergies_details || "");
        setFatherName(contact.father_name || "");
        setMotherName(contact.mother_name || "");
        setFatherPhone(contact.father_phone || "");
        setMotherPhone(contact.mother_phone || "");

        setEvents(contact.events || []);

        const dynamicValues: Record<string, any> = {};
        Object.keys(contact).forEach(k => {
          if (k.startsWith("custom_")) dynamicValues[k] = contact[k];
        });
        setCustomFieldsValues(dynamicValues);
      } else {
        setMode("edit");
        // Reset fields for new contact
        setContaName("");
        setFM("");
        setContaPhone("");
        setEmail("");
        setGender("");
        setBirthDate("");
        setCity("");
        setStreet("");
        setTg1("");
        setTg2("");
        setTg3("");
        setNotes("");
        setCompanyName("");
        setJobTitle("");
        setLeadSource("");
        setLastFormName("");
        setWorkPhone("");
        setWebsite("");

        setChildFirstName("");
        setChildLastName("");
        setChildGrade("");
        setChildIdNumber("");
        setAllergiesHas("");
        setAllergiesDetails("");
        setFatherName("");
        setMotherName("");
        setFatherPhone("");
        setMotherPhone("");

        setEvents([]);
        setCustomFieldsValues({});
      }
    }
  }, [isOpen, contact]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contaName || !contaPhone) {
      setError("שם פרטי וטלפון הם שדות חובה");
      return;
    }

    setLoading(true);
    setError("");

    const data: Partial<Contact> = {
      conta_name: contaName,
      f_m: fM,
      conta_phone: contaPhone,
      email,
      gender,
      birth_date: birthDate,
      mh_crm_city: city,
      mh_crm_street: street,
      tg1,
      tg2,
      tg3,
      notes,
      company_name: companyName,
      job_title: jobTitle,
      lead_source: leadSource,
      last_form_name: lastFormName,
      work_phone: workPhone,
      website: website,
      child_first_name: childFirstName,
      child_last_name: childLastName,
      child_grade: childGrade,
      child_id_number: childIdNumber,
      allergies_has: allergiesHas,
      allergies_details: allergiesDetails,
      father_name: fatherName,
      mother_name: motherName,
      father_phone: fatherPhone,
      mother_phone: motherPhone,
      events,
      ...customFieldsValues,
    };

    try {
      if (isEdit && contact?.id) {
        await updateContact(contact.id, data);
      } else {
        await createContact(data);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "שגיאה בשמירת איש הקשר");
    } finally {
      setLoading(false);
    }
  };

  // Event handlers for Events Repeater
  const handleAddEvent = () => {
    const newEvent: ContactEvent = {
      time: new Date().toISOString().slice(0, 16), // YYYY-MM-DDTHH:mm format
      title: "",
      text: "",
    };
    setEvents([...events, newEvent]);
  };

  const handleRemoveEvent = (index: number) => {
    setEvents(events.filter((_, i) => i !== index));
  };

  const handleUpdateEvent = (index: number, field: keyof ContactEvent, value: string) => {
    const updatedEvents = [...events];
    updatedEvents[index] = { ...updatedEvents[index], [field]: value };
    setEvents(updatedEvents);
  };

  const renderCustomFields = (category: string) => {
    const fields = customFieldsConfig.filter(f => f.category === category);
    if (fields.length === 0) return null;

    return (
      <div className="mt-6 pt-6 border-t border-slate-100 col-span-full">
        <h4 className="text-sm font-black text-slate-400 mb-3 uppercase tracking-wider">שדות מותאמים אישית</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fields.map(field => (
            <div key={field.id} className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600">{field.label}</label>
              {field.type === "textarea" ? (
                <textarea
                  value={customFieldsValues[field.id] || ""}
                  onChange={(e) => setCustomFieldsValues(prev => ({...prev, [field.id]: e.target.value}))}
                  rows={3}
                  className="flex w-full rounded-2xl border border-input bg-white px-3 py-2 text-sm focus-visible:outline-none"
                />
              ) : (
                <Input
                  type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
                  value={customFieldsValues[field.id] || ""}
                  onChange={(e) => setCustomFieldsValues(prev => ({...prev, [field.id]: e.target.value}))}
                  className="rounded-xl bg-white"
                />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (mode === "view" && contact) {
    return (
      <Modal isOpen={isOpen} onClose={onClose}>
        <Modal.Content className="max-w-2xl rounded-[2rem] p-6 md:p-8">
          <div dir="rtl" className="w-full space-y-6">
            <Modal.Close className="left-4 right-auto" />
            
            {/* Header: WhatsApp style profile card */}
            <div className="flex flex-col items-center text-center space-y-4 border-b pb-6">
              {/* Large Avatar */}
              <div className={`w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-black shadow-md ${getAvatarBg(contaName)}`}>
                {getInitials(contaName, fM)}
              </div>

              <div>
                <h3 className="text-xl md:text-2xl font-black text-slate-800">
                  {contaName} {fM}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5" dir="ltr">{contaPhone}</p>
                <div className="flex items-center justify-center gap-1.5 mt-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                    contact.status === 'active' 
                      ? 'bg-emerald-50 border-emerald-100 text-emerald-600' 
                      : 'bg-rose-50 border-rose-100 text-rose-600'
                  }`}>
                    {contact.status === 'active' ? 'איש קשר פעיל' : 'בסל אשפה'}
                  </span>
                  {gender && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-slate-50 border-slate-200 text-slate-600">
                      {gender}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-center gap-2.5 w-full max-w-sm pt-2">
                {/* WhatsApp */}
                <a
                  href={`https://wa.me/${contaPhone.replace(/[^0-9]/g, "")}`}
                  target="_blank"
                  className="flex-1 py-2 px-3 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                  וואטסאפ
                </a>

                {/* WhatsApp Sync */}
                <button
                  onClick={handleSyncWhatsApp}
                  disabled={syncing}
                  className="flex-1 py-2 px-3 rounded-xl border border-teal-200 bg-teal-50 hover:bg-teal-100 text-teal-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm hover:shadow"
                  type="button"
                >
                  <RefreshCw className={`w-4 h-4 text-teal-600 ${syncing ? "animate-spin" : ""}`} />
                  {syncing ? "מסנכרן" : "סנכרון"}
                </button>

                {/* Call */}
                <a
                  href={`tel:${contaPhone}`}
                  className="flex-1 py-2 px-3 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Phone className="w-4 h-4 text-indigo-600" />
                  התקשר
                </a>

                {/* Email */}
                {email ? (
                  <a
                    href={`mailto:${email}`}
                    className="flex-1 py-2 px-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Mail className="w-4 h-4 text-slate-500" />
                    דוא"ל
                  </a>
                ) : (
                  <button
                    disabled
                    className="flex-1 py-2 px-3 rounded-xl border border-slate-100 bg-slate-50 text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 cursor-not-allowed"
                  >
                    <Mail className="w-4 h-4 text-slate-300" />
                    דוא"ל
                  </button>
                )}

                {/* Edit details */}
                <button
                  onClick={() => setMode("edit")}
                  className="flex-1 py-2 px-3 rounded-xl border border-indigo-600 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm hover:shadow"
                  type="button"
                >
                  <Edit className="w-4 h-4" />
                  עריכה
                </button>
              </div>
            </div>

            {/* Profile Content Body */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[45vh] overflow-y-auto pr-1">
              
              {/* Section 1: Details */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">פרטי קשר ומיקום</h4>
                  <div className="bg-slate-50/50 p-4 border border-slate-100 rounded-2xl space-y-2.5 text-xs text-slate-700">
                    <div className="flex justify-between"><span className="text-slate-400 font-medium">מזהה (ID):</span><span className="font-mono font-bold text-slate-800 select-all">{contact.id || "-"}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400 font-medium">דוא"ל:</span><span className="font-bold text-slate-800">{email || "-"}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400 font-medium">מגדר:</span><span className="font-bold text-slate-800">{gender || "-"}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400 font-medium">עיר:</span><span className="font-bold text-slate-800">{city || "-"}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400 font-medium">רחוב:</span><span className="font-bold text-slate-800">{street || "-"}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400 font-medium">תאריך לידה:</span><span className="font-bold text-slate-800">{birthDate || "-"}</span></div>
                    {workPhone && <div className="flex justify-between"><span className="text-slate-400 font-medium">טלפון עבודה:</span><span className="font-bold text-slate-800" dir="ltr">{workPhone}</span></div>}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">מידע תעסוקתי ומקור</h4>
                  <div className="bg-slate-50/50 p-4 border border-slate-100 rounded-2xl space-y-2.5 text-xs text-slate-700">
                    <div className="flex justify-between"><span className="text-slate-400 font-medium">חברה:</span><span className="font-bold text-slate-800">{companyName || "-"}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400 font-medium">תפקיד:</span><span className="font-bold text-slate-800">{jobTitle || "-"}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400 font-medium">מקור הגעה:</span><span className="font-bold text-slate-800">{leadSource || "-"}</span></div>
                    {website && <div className="flex justify-between"><span className="text-slate-400 font-medium">אתר:</span><span className="font-bold text-indigo-600 truncate max-w-[150px]"><a href={website} target="_blank" className="hover:underline">{website}</a></span></div>}
                  </div>
                </div>
              </div>

              {/* Section 2: Payments & Notes */}
              <div className="space-y-4">
                {/* Payments */}
                <div>
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">נתוני תרומות ועסקאות</h4>
                  <div className="bg-emerald-50/20 p-4 border border-emerald-100/50 rounded-2xl space-y-2.5 text-xs text-slate-700">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-medium">סה"כ תרומות:</span>
                      <span className="font-black text-emerald-600 text-sm">₪{(contact.total_spent || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-medium">מספר עסקאות:</span>
                      <span className="font-bold text-slate-800">{contact.order_count || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-medium">עסקה אחרונה:</span>
                      <span className="font-bold text-slate-800">{contact.last_order_date ? new Date(contact.last_order_date).toLocaleDateString("he-IL") : "-"}</span>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">אודות / הערות</h4>
                  <div className="bg-amber-50/20 p-4 border border-amber-100/50 rounded-2xl text-xs text-slate-700 leading-relaxed min-h-[90px] text-right">
                    {notes ? notes : <span className="text-slate-300 italic">אין הערות מוגדרות...</span>}
                  </div>
                </div>
              </div>

              {/* Tags (Span Full Width) */}
              <div className="md:col-span-2">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">תוויות ותיוג</h4>
                <div className="flex flex-wrap gap-2">
                  {tg1 && <span className="px-3 py-1 bg-slate-100 text-slate-600 border border-slate-200/60 rounded-xl text-xs font-bold">{tg1}</span>}
                  {tg2 && <span className="px-3 py-1 bg-slate-100 text-slate-600 border border-slate-200/60 rounded-xl text-xs font-bold">{tg2}</span>}
                  {tg3 && <span className="px-3 py-1 bg-slate-100 text-slate-600 border border-slate-200/60 rounded-xl text-xs font-bold">{tg3}</span>}
                  {!tg1 && !tg2 && !tg3 && <span className="text-slate-400 text-xs italic">אין תוויות מוגדרות עבור איש קשר זה.</span>}
                </div>
              </div>

              {/* Unified Event & Form Submission Timeline (Span Full Width) */}
              <div className="md:col-span-2">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">היסטוריית פעילות ומפגשים</h4>
                
                {/* Build unified sorted timeline events */}
                {(() => {
                  const timelineItems: { date: Date; title: string; desc: string; type: "event" | "form" }[] = [];
                  
                  // Add crm events
                  events.forEach(e => {
                    timelineItems.push({
                      date: new Date(e.time),
                      title: e.title || "מפגש/שיחה",
                      desc: e.text || "",
                      type: "event"
                    });
                  });

                  // Add form submissions
                  if (contact.form_submissions) {
                    contact.form_submissions.forEach(fs => {
                      timelineItems.push({
                        date: new Date(fs.date),
                        title: `הגשת טופס: ${fs.name}`,
                        desc: `דף מקור: ${fs.page}`,
                        type: "form"
                      });
                    });
                  }

                  // Sort items by date descending
                  timelineItems.sort((a, b) => b.date.getTime() - a.date.getTime());

                  if (timelineItems.length === 0) {
                    return (
                      <div className="p-6 text-center border-2 border-dashed border-slate-100 rounded-2xl text-slate-400 text-xs bg-slate-50/30">
                        אין היסטוריית פעילות מתועדת.
                      </div>
                    );
                  }

                  return (
                    <div className="relative border-r-2 border-slate-100 mr-2 pr-5 space-y-4 py-2">
                      {timelineItems.map((item, idx) => (
                        <div key={idx} className="relative">
                          {/* Dot indicator */}
                          <span className={`absolute -right-[26px] top-1.5 rounded-full p-0.5 ring-4 ring-white text-white ${
                            item.type === 'form' ? 'bg-indigo-500' : 'bg-emerald-500'
                          }`}>
                            <div className="w-1.5 h-1.5 rounded-full" />
                          </span>
                          <div>
                            <span className="text-[10px] font-mono text-slate-400 block">
                              {item.date.toLocaleString("he-IL")}
                            </span>
                            <h5 className="text-xs font-bold text-slate-800">{item.title}</h5>
                            {item.desc && <p className="text-[11px] text-slate-500 mt-0.5">{item.desc}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

            </div>

            {/* Footer buttons */}
            <Modal.Footer>
              <div className="flex gap-2 justify-end w-full">
                <Button
                  onClick={onClose}
                  className="rounded-xl font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 h-10 px-5"
                  type="button"
                >
                  סגור
                </Button>
              </div>
            </Modal.Footer>

          </div>
        </Modal.Content>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <Modal.Content className="max-w-3xl rounded-[2rem] p-8">
        <div dir="rtl" className="w-full">
          <Modal.Close className="left-4 right-auto" />
          <Modal.Header 
            title={isEdit ? `עריכת איש קשר: ${contaName} ${fM}` : "הוספת איש קשר חדש"} 
          description={isEdit ? "עדכן את פרטי איש הקשר ונהל היסטוריית אינטראקציות" : "מלא את שדות החובה להוספת איש קשר חדש למערכת"}
        />

        {error && (
          <div className="p-4 mb-4 bg-red-50 text-red-600 rounded-2xl text-sm font-semibold border border-red-100 animate-in fade-in">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tab Navigation */}
          <div className="flex border-b overflow-x-auto py-1 gap-2 scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveTab("details")}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-t-xl transition-colors shrink-0 ${
                activeTab === "details"
                  ? "border-b-2 border-indigo-600 text-indigo-600"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <User className="w-4 h-4" />
              פרטים כלליים
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("camp")}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-t-xl transition-colors shrink-0 ${
                activeTab === "camp"
                  ? "border-b-2 border-indigo-600 text-indigo-600"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Users className="w-4 h-4" />
              משפחה וקייטנה
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("tags")}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-t-xl transition-colors shrink-0 ${
                activeTab === "tags"
                  ? "border-b-2 border-indigo-600 text-indigo-600"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Tag className="w-4 h-4" />
              תיוגים והערות
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("company")}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-t-xl transition-colors shrink-0 ${
                activeTab === "company"
                  ? "border-b-2 border-indigo-600 text-indigo-600"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Building className="w-4 h-4" />
              חברה ומקור
            </button>
            {isEdit && (
              <>
                <button
                  type="button"
                  onClick={() => setActiveTab("events")}
                  className={`flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-t-xl transition-colors shrink-0 ${
                    activeTab === "events"
                      ? "border-b-2 border-indigo-600 text-indigo-600"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  אירועים ומפגשים
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("timeline")}
                  className={`flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-t-xl transition-colors shrink-0 ${
                    activeTab === "timeline"
                      ? "border-b-2 border-indigo-600 text-indigo-600"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  ציר זמן
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("payments")}
                  className={`flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-t-xl transition-colors shrink-0 ${
                    activeTab === "payments"
                      ? "border-b-2 border-indigo-600 text-indigo-600"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  תשלומים
                </button>
              </>
            )}
          </div>

          {/* Tab Content: Details */}
          {activeTab === "details" && (
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-black text-slate-400 mb-3 uppercase tracking-wider">מידע בסיסי</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600">שם פרטי *</label>
                    <Input
                      value={contaName}
                      onChange={(e) => setContaName(e.target.value)}
                      required
                      placeholder="הקלד שם פרטי..."
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600">שם משפחה</label>
                    <Input
                      value={fM}
                      onChange={(e) => setFM(e.target.value)}
                      placeholder="הקלד שם משפחה..."
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600">מגדר</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="">בחר מגדר...</option>
                      <option value="זכר">זכר</option>
                      <option value="נקבה">נקבה</option>
                      <option value="אחר">אחר</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600">תאריך לידה</label>
                    <Input
                      type="date"
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                      className="rounded-xl"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-black text-slate-400 mb-3 uppercase tracking-wider">פרטי יצירת קשר וכתובת</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600">טלפון נייד *</label>
                    <Input
                      value={contaPhone}
                      onChange={(e) => setContaPhone(e.target.value)}
                      required
                      placeholder="05x-xxxxxxx"
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600">דואר אלקטרוני</label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="example@mail.com"
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600">עיר</label>
                    <Input
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="אזור מגורים..."
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600">רחוב</label>
                    <Input
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      placeholder="רחוב ומספר..."
                      className="rounded-xl"
                    />
                  </div>
                </div>
              </div>
              {renderCustomFields("details")}
            </div>
          )}

          {/* Tab Content: Tags & Notes */}
          {activeTab === "tags" && (
            <div className="space-y-6 animate-in fade-in">
              <div>
                <h4 className="text-sm font-black text-slate-400 mb-3 uppercase tracking-wider">תוויות ותיוג</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600">תג 1</label>
                    <Input
                      value={tg1}
                      onChange={(e) => setTg1(e.target.value)}
                      placeholder="הקלד תגית 1..."
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600">תג 2</label>
                    <Input
                      value={tg2}
                      onChange={(e) => setTg2(e.target.value)}
                      placeholder="הקלד תגית 2..."
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600">תג 3</label>
                    <Input
                      value={tg3}
                      onChange={(e) => setTg3(e.target.value)}
                      placeholder="הקלד תגית 3..."
                      className="rounded-xl"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600">הערות כלליות</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={6}
                  placeholder="רשום הערות, תזכורות או מידע חשוב על איש הקשר..."
                  className="flex w-full rounded-2xl border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>
              {renderCustomFields("tags")}
            </div>
          )}

          {/* Tab Content: Company & Lead Source */}
          {activeTab === "company" && (
            <div className="space-y-6 animate-in fade-in">
              <div>
                <h4 className="text-sm font-black text-slate-400 mb-3 uppercase tracking-wider">תעסוקה וארגון</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600">שם החברה</label>
                    <Input
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="שם מקום העבודה..."
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600">תפקיד</label>
                    <Input
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      placeholder="הגדרת התפקיד..."
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600">טלפון עבודה</label>
                    <Input
                      value={workPhone}
                      onChange={(e) => setWorkPhone(e.target.value)}
                      placeholder="טלפון משרדי..."
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600">אתר אינטרנט</label>
                    <Input
                      type="url"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="https://example.com"
                      className="rounded-xl"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-black text-slate-400 mb-3 uppercase tracking-wider">מקור לידים ומעקב</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600">מקור הליד</label>
                    <select
                      value={leadSource}
                      onChange={(e) => setLeadSource(e.target.value)}
                      className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="">בחר מקור...</option>
                      <option value="טופס מהאתר">טופס מהאתר</option>
                      <option value="פייסבוק">פייסבוק</option>
                      <option value="גוגל">גוגל</option>
                      <option value="המלצה">המלצה</option>
                      <option value="כנס">כנס</option>
                      <option value="אחר">אחר</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600">טופס אחרון שהוגש</label>
                    <Input
                      value={lastFormName}
                      onChange={(e) => setLastFormName(e.target.value)}
                      placeholder="שם הטופס..."
                      className="rounded-xl"
                      disabled
                    />
                  </div>
                </div>
              </div>
              {renderCustomFields("company")}
            </div>
          )}

          {/* Tab Content: Camp & Family */}
          {activeTab === "camp" && (
            <div className="space-y-6 animate-in fade-in">
              <div>
                <h4 className="text-sm font-black text-slate-400 mb-3 uppercase tracking-wider">פרטי הילד/ה (קייטנה)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600">שם הילד/ה</label>
                    <Input
                      value={childFirstName}
                      onChange={(e) => setChildFirstName(e.target.value)}
                      placeholder="שם פרטי..."
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600">שם משפחה</label>
                    <Input
                      value={childLastName}
                      onChange={(e) => setChildLastName(e.target.value)}
                      placeholder="שם משפחה..."
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600">ת.ז ילד</label>
                    <Input
                      value={childIdNumber}
                      onChange={(e) => setChildIdNumber(e.target.value)}
                      placeholder="מספר תעודת זהות..."
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600">כיתה</label>
                    <Input
                      value={childGrade}
                      onChange={(e) => setChildGrade(e.target.value)}
                      placeholder="לדוגמה: א'..."
                      className="rounded-xl"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-black text-slate-400 mb-3 uppercase tracking-wider">רגישויות ומגבלות</h4>
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600">האם קיימת רגישות?</label>
                    <select
                      value={allergiesHas}
                      onChange={(e) => setAllergiesHas(e.target.value)}
                      className="flex h-10 w-full md:w-1/2 rounded-xl border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="">בחר...</option>
                      <option value="כן">כן</option>
                      <option value="לא">לא</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600">פירוט הרגישות</label>
                    <textarea
                      value={allergiesDetails}
                      onChange={(e) => setAllergiesDetails(e.target.value)}
                      rows={3}
                      placeholder="אם כן, פרט כאן..."
                      className="flex w-full rounded-2xl border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-black text-slate-400 mb-3 uppercase tracking-wider">פרטי הורים</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600">שם האם</label>
                    <Input
                      value={motherName}
                      onChange={(e) => setMotherName(e.target.value)}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600">טלפון האם</label>
                    <Input
                      value={motherPhone}
                      onChange={(e) => setMotherPhone(e.target.value)}
                      className="rounded-xl"
                      dir="ltr"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600">שם האב</label>
                    <Input
                      value={fatherName}
                      onChange={(e) => setFatherName(e.target.value)}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600">טלפון האב</label>
                    <Input
                      value={fatherPhone}
                      onChange={(e) => setFatherPhone(e.target.value)}
                      className="rounded-xl"
                      dir="ltr"
                    />
                  </div>
                </div>
              </div>
              {renderCustomFields("camp")}
            </div>
          )}

          {/* Tab Content: Events Repeater */}
          {activeTab === "events" && isEdit && (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-black text-slate-400 uppercase tracking-wider">היסטוריית אירועים ומפגשים</h4>
                <Button
                  type="button"
                  onClick={handleAddEvent}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs py-1.5 px-3 flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  הוסף אירוע
                </Button>
              </div>

              {events.length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed rounded-2xl text-slate-400 text-sm">
                  לא תועדו אירועים או מפגשים מול איש קשר זה. לחץ על "הוסף אירוע" כדי לתעד מפגש/שיחה.
                </div>
              ) : (
                <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                  {events.map((event, index) => (
                    <div key={index} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-3 relative group">
                      <button
                        type="button"
                        onClick={() => handleRemoveEvent(index)}
                        className="absolute left-4 top-4 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="מחק אירוע"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500">תאריך ושעה</label>
                          <Input
                            type="datetime-local"
                            value={event.time}
                            onChange={(e) => handleUpdateEvent(index, "time", e.target.value)}
                            className="h-8 text-xs rounded-lg"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500">כותרת המפגש</label>
                          <Input
                            value={event.title}
                            onChange={(e) => handleUpdateEvent(index, "title", e.target.value)}
                            placeholder="לדוגמה: שיחת טלפון, פגישת ייעוץ..."
                            className="h-8 text-xs rounded-lg"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500">סיכום המפגש / הערות</label>
                        <textarea
                          value={event.text}
                          onChange={(e) => handleUpdateEvent(index, "text", e.target.value)}
                          rows={2}
                          placeholder="תקצר את מהלך המפגש או השיחה..."
                          className="w-full text-xs p-2 border rounded-lg focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-white"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {renderCustomFields("events")}
            </div>
          )}

          {/* Tab Content: Timeline */}
          {activeTab === "timeline" && isEdit && (
            <div className="space-y-4 animate-in fade-in">
              <h4 className="text-sm font-black text-slate-400 uppercase tracking-wider mb-2">ציר זמן אינטראקציות ופעולות</h4>
              
              <div className="relative border-r-2 border-slate-100 mr-3 pr-6 space-y-6 max-h-[350px] overflow-y-auto pl-1">
                {/* Contact Creation Event */}
                <div className="relative">
                  <span className="absolute -right-[31px] top-1 bg-green-500 text-white rounded-full p-1 ring-4 ring-white">
                    <User className="w-3.5 h-3.5" />
                  </span>
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 block">
                      {contact?.createdAt ? new Date(contact.createdAt).toLocaleString("he-IL") : ""}
                    </span>
                    <h5 className="text-xs font-bold text-slate-800">הקמת איש קשר</h5>
                    <p className="text-xs text-slate-500">איש הקשר נוצר במערכת.</p>
                  </div>
                </div>

                {/* Form Submissions Timeline */}
                {contact?.form_submissions && contact.form_submissions.length > 0 ? (
                  contact.form_submissions.map((fs, idx) => (
                    <div key={idx} className="relative">
                      <span className="absolute -right-[31px] top-1 bg-indigo-500 text-white rounded-full p-1 ring-4 ring-white">
                        <Clock className="w-3.5 h-3.5" />
                      </span>
                      <div>
                        <span className="text-[10px] font-mono text-slate-400 block">
                          {fs.date ? new Date(fs.date).toLocaleString("he-IL") : ""}
                        </span>
                        <h5 className="text-xs font-bold text-slate-800">הגשת טופס: {fs.name}</h5>
                        <p className="text-xs text-slate-500">עמוד: {fs.page}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="relative">
                    <span className="absolute -right-[31px] top-1 bg-slate-200 text-slate-500 rounded-full p-1 ring-4 ring-white">
                      <Clock className="w-3.5 h-3.5" />
                    </span>
                    <div>
                      <h5 className="text-xs font-bold text-slate-400">אין פניות או הגשות טפסים</h5>
                      <p className="text-xs text-slate-400">לא נרשמו הגשות טפסים אוטומטיות מהאתר.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab Content: Payments */}
          {activeTab === "payments" && isEdit && (
            <div className="space-y-6 animate-in fade-in">
              <h4 className="text-sm font-black text-slate-400 uppercase tracking-wider">סיכום רכישות והיסטוריית הזמנות</h4>

              {/* Stats Panel */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex flex-col justify-center">
                  <span className="text-[11px] font-bold text-emerald-600">סה"כ תרומות ותשלומים</span>
                  <span className="text-xl font-black text-emerald-800 mt-1">₪{(contact?.total_spent || 0).toFixed(2)}</span>
                </div>
                <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex flex-col justify-center">
                  <span className="text-[11px] font-bold text-indigo-600">מספר עסקאות</span>
                  <span className="text-xl font-black text-indigo-800 mt-1">{contact?.order_count || 0}</span>
                </div>
                <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex flex-col justify-center">
                  <span className="text-[11px] font-bold text-amber-600">עסקה אחרונה</span>
                  <span className="text-xs font-black text-amber-800 mt-2 truncate">
                    {contact?.last_order_date ? new Date(contact.last_order_date).toLocaleDateString("he-IL") : "אין עדיין"}
                  </span>
                </div>
              </div>

              {/* Order List */}
              <div className="space-y-3">
                <h5 className="text-xs font-bold text-slate-700">פירוט עסקאות אחרונות</h5>
                {(contact?.order_count || 0) === 0 ? (
                  <div className="p-6 text-center border rounded-2xl text-slate-400 text-xs bg-slate-50/50">
                    לא נמצאה היסטוריית תשלומים עבור איש קשר זה.
                  </div>
                ) : (
                  <div className="border rounded-2xl overflow-hidden bg-white shadow-sm max-h-[200px] overflow-y-auto">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-slate-50 border-b font-bold text-slate-600">
                        <tr>
                          <th className="p-3">סכום</th>
                          <th className="p-3">תאריך</th>
                          <th className="p-3">סטטוס</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y text-slate-700">
                        {/* Simulating orders based on summary fields */}
                        {contact?.last_order_date && (
                          <tr className="hover:bg-slate-50 transition-colors">
                            <td className="p-3 font-bold text-slate-900">₪{(contact.total_spent || 0).toFixed(2)}</td>
                            <td className="p-3">{new Date(contact.last_order_date).toLocaleDateString("he-IL")}</td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 bg-green-50 text-green-600 border border-green-100 rounded-full font-bold">
                                הושלם
                              </span>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer buttons */}
          <Modal.Footer>
            <div className="flex gap-3 justify-end w-full">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="rounded-xl font-bold h-11 px-6"
                disabled={loading}
              >
                ביטול
              </Button>
              <Button
                type="submit"
                variant="primary"
                className="rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white h-11 px-8 min-w-[120px]"
                disabled={loading}
              >
                {loading ? "שומר..." : "שמור שינויים"}
              </Button>
            </div>
          </Modal.Footer>
        </form>
        </div>
      </Modal.Content>
    </Modal>
  );
}
