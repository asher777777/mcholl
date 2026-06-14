"use client";

import { useState, useEffect } from "react";
import { 
  Plus, Trash2, Settings, Check, Sparkles, 
  Settings2, MoveUp, MoveDown, Clock, Coins, Save
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { getFormTemplates, saveFormTemplate, FormTemplate } from "../formTemplates";
import { getCustomFields, addCustomField } from "../actions";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";

export interface FormField {
  label: string;
  type: string; // text, tel, email, textarea, select, number, fixed_amount, hidden
  map_to: string;
  map_to_2?: string;
  required: boolean;
  default_value: string;
  options: string;
  url_param_enable: boolean;
  url_param_name: string;
  cond_enable: boolean;
  cond_field_index: number;
  cond_operator: string; // is, is_not
  cond_value: string;
  step?: number;
  calc_formula?: string;
  icon?: string;
  widthPercentage?: number;
}

export interface LogicAction {
  id: string;
  field_index: number;
  operator: "is" | "is_not";
  value: string;
  action_type: "redirect" | "modal" | "payment";
  action_value: string; // URL for redirect, HTML/text for modal
}

export interface FormConfig {
  enabled: boolean;
  form_type: "standard" | "payment" | "register";
  submit_button_text: string;
  submit_button_bg_color: string;
  submit_button_text_color: string;
  form_bg_color?: string;
  field_bg_color?: string;
  fields: FormField[];
  save_to_crm: boolean;
  crm_owner_id: string;
  standard_success_message: string;
  standard_redirect_url: string;
  standard_whatsapp_message: string;
  standard_whatsapp_image_url: string;
  payment_amount: number;
  payment_amount_crm_map: string;
  payment_pending_message: string;
  payment_pending_image_url: string;
  payment_success_message: string;
  payment_success_image_url: string;
  payment_group: string;
  payment_zeut_kupa: string;
  payment_receipt_type: string;
  payment_frequency: "one-time" | "recurring" | "user-choice";
  action_rules?: LogicAction[];
  custom_success_modal_enable?: boolean;
  custom_success_modal_content?: string;
  custom_success_modal_image_url?: string;
  crm_save_step?: number;
  register_role?: "DEVELOPING" | "TRIAL";
}

interface CRMFormBuilderProps {
  value: FormConfig;
  onChange: (config: FormConfig) => void;
}

const CRM_DB_FIELDS = {
  "": "-- ללא מיפוי --",
  "conta_name": "שם / שם מלא",
  "f_m": "שם משפחה",
  "gender": "מגדר",
  "birth_date": "תאריך לידה",
  "email": "דוא\"ל ראשי",
  "conta_phone": "טלפון נייד (וואטסאפ)",
  "work_phone": "טלפון (עבודה)",
  "website": "אתר אינטרנט",
  "mh_crm_city": "עיר",
  "mh_crm_street": "רחוב",
  "company_name": "שם החברה",
  "job_title": "תפקיד",
  "lead_source": "מקור הליד (אוטומטי)",
  "notes": "הערות",
  "tg1": "תג 1 (סטטוס פנייה)",
  "tg2": "תג 2",
  "tg3": "תג 3",
  "payment_amount": "סכום לתשלום (עבור טופס תשלום)",
  "child_first_name": "שם הילד (פרטי)",
  "child_last_name": "שם הילד (משפחה)",
  "child_grade": "כיתה / גן",
  "child_id_number": "תעודת זהות ילד",
  "allergies_has": "יש אלרגיות? (כן/לא)",
  "allergies_details": "פירוט אלרגיות",
  "father_name": "שם האב",
  "father_phone": "טלפון האב",
  "mother_name": "שם האם",
  "mother_phone": "טלפון האם",
  "total_spent": "סך הכל תרומות/רכישות",
  "order_count": "מספר תרומות/רכישות"
};

const ICON_OPTIONS = [
  { id: "", label: "-- ללא אייקון --" },
  { id: "user", label: "איש קשר" },
  { id: "phone", label: "טלפון" },
  { id: "mail", label: "מייל" },
  { id: "map-pin", label: "מיקום / כתובת" },
  { id: "building", label: "חברה / מוסד" },
  { id: "briefcase", label: "תפקיד / עבודה" },
  { id: "calendar", label: "תאריך" },
  { id: "file-text", label: "הערות / טקסט" },
  { id: "heart", label: "תרומה / לב" },
  { id: "smile", label: "ילד / חיוך" },
  { id: "alert-circle", label: "חשוב / אלרגיה" },
  { id: "credit-card", label: "תשלום / אשראי" },
  { id: "coins", label: "מטבעות" }
];

const WIDTH_OPTIONS = [
  { id: 100, label: "100% (שורה מלאה)" },
  { id: 75, label: "75% (שלושה רבעים)" },
  { id: 66, label: "66% (שני שליש)" },
  { id: 50, label: "50% (חצי שורה)" },
  { id: 33, label: "33% (שליש שורה)" },
  { id: 25, label: "25% (רבע שורה)" }
];

const FIELD_TYPES = [
  { id: "text", label: "טקסט חופשי" },
  { id: "tel", label: "טלפון נייד" },
  { id: "email", label: "כתובת אימייל" },
  { id: "textarea", label: "אזור טקסט ארוך" },
  { id: "select", label: "בחירה מרשימה (Dropdown)" },
  { id: "number", label: "מספר (סכום להזנה)" },
  { id: "fixed_amount", label: "סכום קבוע" },
  { id: "hidden", label: "שדה מוסתר" },
  { id: "calculated", label: "שדה חישוב (נוסחה)" }
];

export function CRMFormBuilder({ value: rawValue, onChange }: CRMFormBuilderProps) {
  const value = { ...rawValue, fields: rawValue.fields || [] };
  const [activeTab, setActiveTab] = useState<"fields" | "whatsapp" | "settings">("fields");
  const [expandedField, setExpandedField] = useState<number | null>(null);
  const [templates, setTemplates] = useState<FormTemplate[]>([]);
  const [customFields, setCustomFields] = useState<any[]>([]);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [showAddCustomFieldModal, setShowAddCustomFieldModal] = useState(false);
  const [newCustomFieldCategory, setNewCustomFieldCategory] = useState("details");
  const [newCustomFieldType, setNewCustomFieldType] = useState("text");
  const [newCustomFieldLabel, setNewCustomFieldLabel] = useState("");
  const [isAddingCustomField, setIsAddingCustomField] = useState(false);
  
  useEffect(() => {
    getFormTemplates().then(setTemplates);
    getCustomFields().then(setCustomFields);
  }, []);

  const handleAddCustomField = async () => {
    if (!newCustomFieldLabel.trim()) return alert("נא להזין שם שדה");
    setIsAddingCustomField(true);
    const res = await addCustomField({
      category: newCustomFieldCategory,
      type: newCustomFieldType,
      label: newCustomFieldLabel
    });
    if (res.success) {
      setCustomFields([...customFields, res.field]);
      setShowAddCustomFieldModal(false);
      setNewCustomFieldLabel("");
    } else {
      alert("שגיאה ביצירת השדה: " + res.error);
    }
    setIsAddingCustomField(false);
  };

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) return alert("נא להזין שם לתבנית");
    setIsSavingTemplate(true);
    const res = await saveFormTemplate(templateName, value);
    if (res.success) {
      alert("התבנית נשמרה בהצלחה!");
      setTemplateName("");
      getFormTemplates().then(setTemplates);
    } else {
      alert("שגיאה בשמירת התבנית: " + res.error);
    }
    setIsSavingTemplate(false);
  };

  const handleLoadTemplate = (templateConfig: FormConfig) => {
    if (confirm("האם אתה בטוח? פעולה זו תדרוס את הטופס הנוכחי.")) {
      onChange(templateConfig);
    }
  };
  
  const updateConfig = (updates: Partial<FormConfig>) => {
    onChange({ ...value, ...updates });
  };

  const handleFieldChange = (index: number, updates: Partial<FormField>) => {
    const newFields = [...value.fields];
    newFields[index] = { ...newFields[index], ...updates };
    updateConfig({ fields: newFields });
  };

  const addField = () => {
    const newField: FormField = {
      label: `שדה חדש ${value.fields.length + 1}`,
      type: "text",
      map_to: "",
      required: false,
      default_value: "",
      options: "",
      url_param_enable: false,
      url_param_name: "",
      cond_enable: false,
      cond_field_index: 0,
      cond_operator: "is",
      cond_value: ""
    };
    updateConfig({ fields: [...value.fields, newField] });
    setExpandedField(value.fields.length);
  };

  const deleteField = (index: number) => {
    const newFields = value.fields.filter((_, i) => i !== index);
    updateConfig({ fields: newFields });
    if (expandedField === index) setExpandedField(null);
  };

  const moveField = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === value.fields.length - 1) return;

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    const newFields = [...value.fields];
    const temp = newFields[index];
    newFields[index] = newFields[targetIndex];
    newFields[targetIndex] = temp;

    updateConfig({ fields: newFields });
    if (expandedField === index) setExpandedField(targetIndex);
    else if (expandedField === targetIndex) setExpandedField(index);
  };

  const handlePlaceholderClick = (placeholder: string, targetField: keyof FormConfig) => {
    const textarea = document.getElementById(targetField) as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const text = textarea.value;
    const resolvedText = text.substring(0, start) + placeholder + text.substring(textarea.selectionEnd);
    
    updateConfig({ [targetField]: resolvedText });
    
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + placeholder.length;
    }, 50);
  };

  // Get options for conditional selection (only select fields)
  const selectFields = (value.fields || [])
    .map((f, i) => ({ label: f.label, index: i, type: f.type }))
    .filter(f => f.type === "select");

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-[2rem] p-6 space-y-6 text-right text-slate-800" dir="rtl">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-4 gap-4">
        <div>
          <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-indigo-600 animate-spin-slow" />
            מחולל טפסים ומחבר CRM מובנה
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            עצב טפסים חכמים, סנכרן נתונים ל-CRM והגדר הודעות וואטסאפ אוטומטיות ללידים.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-full border shadow-sm">
            <label className="text-sm font-bold text-slate-700 cursor-pointer" htmlFor="form-enabled-toggle">
              הפעל טופס בעמוד:
            </label>
            <input
              id="form-enabled-toggle"
              type="checkbox"
              checked={value.enabled}
              onChange={(e) => updateConfig({ enabled: e.target.checked })}
              className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
            />
          </div>
          {value.enabled && (
            <>
              <div className={`flex items-center gap-2 px-4 py-2.5 rounded-full border shadow-sm transition-all ${value.form_type === 'payment' ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-200'}`}>
                <label className={`text-sm font-bold cursor-pointer flex items-center gap-1.5 ${value.form_type === 'payment' ? 'text-indigo-700' : 'text-slate-600'}`} htmlFor="form-payment-toggle">
                  <Coins className={`w-4 h-4 ${value.form_type === 'payment' ? 'text-indigo-600' : 'text-slate-400'}`} />
                  טופס תשלום:
                </label>
                <input
                  id="form-payment-toggle"
                  type="checkbox"
                  checked={value.form_type === "payment"}
                  onChange={(e) => updateConfig({ form_type: e.target.checked ? "payment" : "standard" })}
                  className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                />
              </div>
              <div className={`flex items-center gap-2 px-4 py-2.5 rounded-full border shadow-sm transition-all ${value.form_type === 'register' ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-200'}`}>
                <label className={`text-sm font-bold cursor-pointer flex items-center gap-1.5 ${value.form_type === 'register' ? 'text-indigo-700' : 'text-slate-600'}`} htmlFor="form-register-toggle">
                  <Sparkles className={`w-4 h-4 ${value.form_type === 'register' ? 'text-indigo-600' : 'text-slate-400'}`} />
                  הרשמת משתמש:
                </label>
                <input
                  id="form-register-toggle"
                  type="checkbox"
                  checked={value.form_type === "register"}
                  onChange={(e) => updateConfig({ form_type: e.target.checked ? "register" : "standard" })}
                  className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {value.enabled && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-200 bg-white p-1 rounded-2xl border shadow-sm max-w-md">
            {[
              { id: "fields", label: "שדות ולוגיקה" },
              { id: "whatsapp", label: "הודעות WhatsApp" },
              { id: "settings", label: "הגדרות ועיצוב" }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all text-center ${
                  activeTab === tab.id
                    ? "bg-slate-900 text-white shadow-md"
                    : "text-slate-500 hover:text-slate-850 hover:bg-slate-50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* TAB 1: FIELDS & LOGIC */}
          {activeTab === "fields" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-white p-4 rounded-2xl border">
                <span className="text-xs font-bold text-slate-500">
                  סה"כ שדות בטופס: {value.fields.length}
                </span>
                <Button
                  type="button"
                  onClick={addField}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1 text-xs font-bold py-2 rounded-xl"
                >
                  <Plus className="w-4 h-4" /> הוסף שדה חדש
                </Button>
              </div>

              <div className="space-y-3">
                {value.fields.map((field, idx) => {
                  const isExpanded = expandedField === idx;
                  return (
                    <div 
                      key={idx}
                      className={`bg-white rounded-2xl border transition-all shadow-sm ${
                        isExpanded ? "ring-2 ring-indigo-500/20 border-indigo-200" : "border-slate-100"
                      }`}
                    >
                      {/* Accordion Trigger */}
                      <div className="p-4 flex justify-between items-center gap-4">
                        <div className="flex items-center gap-2 flex-1">
                          <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-black text-slate-600">
                            {idx + 1}
                          </span>
                          <input
                            type="text"
                            value={field.label}
                            onChange={(e) => handleFieldChange(idx, { label: e.target.value })}
                            className="font-bold text-slate-850 bg-transparent hover:bg-slate-50 border-0 outline-none rounded px-2 py-0.5 max-w-[200px]"
                            placeholder="תווית השדה"
                            onClick={(e) => e.stopPropagation()}
                            required
                          />
                          <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md font-semibold">
                            {FIELD_TYPES.find(t => t.id === field.type)?.label || field.type}
                          </span>
                          {field.map_to && (
                            <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-md font-bold">
                              ממופה ל-{Object.entries(CRM_DB_FIELDS).find(([k]) => k === field.map_to)?.[1] || field.map_to}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => moveField(idx, "up")}
                            disabled={idx === 0}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50 disabled:opacity-30 transition-colors"
                            title="הזז למעלה"
                          >
                            <MoveUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveField(idx, "down")}
                            disabled={idx === value.fields.length - 1}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50 disabled:opacity-30 transition-colors"
                            title="הזז למטה"
                          >
                            <MoveDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setExpandedField(isExpanded ? null : idx)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors"
                          >
                            <Settings className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteField(idx)}
                            className="p-1.5 rounded-lg text-red-400 hover:text-red-650 hover:bg-red-50 transition-colors"
                            title="מחק שדה"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Expandable options details */}
                      {isExpanded && (
                        <div className="p-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl space-y-4 text-xs">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                              <label className="block font-semibold mb-1 text-slate-650">סוג שדה</label>
                              <select
                                value={field.type}
                                onChange={(e) => handleFieldChange(idx, { type: e.target.value })}
                                className="w-full bg-white text-slate-800 border rounded-xl p-2.5 outline-none"
                              >
                                {FIELD_TYPES.map(t => (
                                  <option key={t.id} value={t.id}>{t.label}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block font-semibold mb-1 text-slate-650">מיפוי לשדה CRM</label>
                              <select
                                value={field.map_to}
                                onChange={(e) => {
                                  if (e.target.value === "__other__") {
                                    setShowAddCustomFieldModal(true);
                                  } else {
                                    handleFieldChange(idx, { map_to: e.target.value });
                                  }
                                }}
                                className="w-full bg-white text-slate-800 border rounded-xl p-2.5 outline-none"
                              >
                                {Object.entries(CRM_DB_FIELDS).map(([k, v]) => (
                                  <option key={k} value={k}>{v}</option>
                                ))}
                                {customFields.length > 0 && <optgroup label="שדות מותאמים אישית">
                                  {customFields.map(cf => (
                                    <option key={cf.id} value={cf.id}>{cf.label}</option>
                                  ))}
                                </optgroup>}
                                <option value="__other__" className="font-bold text-indigo-600">אחר (הוסף שדה חדש)...</option>
                              </select>
                            </div>
                            
                            <div className="col-span-full">
                              <div className="flex items-center gap-2 mb-2">
                                <input
                                  id={`field-map-2-${idx}`}
                                  type="checkbox"
                                  checked={!!field.map_to_2}
                                  onChange={(e) => handleFieldChange(idx, { map_to_2: e.target.checked ? "notes" : undefined })}
                                  className="w-4 h-4 text-indigo-650 rounded border-slate-350"
                                />
                                <label htmlFor={`field-map-2-${idx}`} className="font-bold text-slate-700 cursor-pointer">
                                  מפה לשדה נוסף ב-CRM (מיפוי כפול)
                                </label>
                              </div>
                              {field.map_to_2 && (
                                <div>
                                  <label className="block font-semibold mb-1 text-slate-650">מיפוי לשדה שני</label>
                                  <select
                                    value={field.map_to_2}
                                    onChange={(e) => {
                                      if (e.target.value === "__other__") {
                                        setShowAddCustomFieldModal(true);
                                      } else {
                                        handleFieldChange(idx, { map_to_2: e.target.value });
                                      }
                                    }}
                                    className="w-full bg-white text-slate-800 border rounded-xl p-2.5 outline-none"
                                  >
                                    {Object.entries(CRM_DB_FIELDS).map(([k, v]) => (
                                      <option key={k} value={k}>{v}</option>
                                    ))}
                                    {customFields.length > 0 && <optgroup label="שדות מותאמים אישית">
                                      {customFields.map(cf => (
                                        <option key={cf.id} value={cf.id}>{cf.label}</option>
                                      ))}
                                    </optgroup>}
                                    <option value="__other__" className="font-bold text-indigo-600">אחר (הוסף שדה חדש)...</option>
                                  </select>
                                </div>
                              )}
                            </div>
                            <div>
                              <label className="block font-semibold mb-1 text-slate-650">רוחב השדה בשורה</label>
                              <select
                                value={field.widthPercentage || 100}
                                onChange={(e) => handleFieldChange(idx, { widthPercentage: Number(e.target.value) })}
                                className="w-full bg-white text-slate-800 border rounded-xl p-2.5 outline-none"
                              >
                                {WIDTH_OPTIONS.map(w => (
                                  <option key={w.id} value={w.id}>{w.label}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block font-semibold mb-1 text-slate-650">אייקון תצוגה</label>
                              <select
                                value={field.icon || ""}
                                onChange={(e) => handleFieldChange(idx, { icon: e.target.value })}
                                className="w-full bg-white text-slate-800 border rounded-xl p-2.5 outline-none"
                              >
                                {ICON_OPTIONS.map(i => (
                                  <option key={i.id} value={i.id}>{i.label}</option>
                                ))}
                              </select>
                            </div>
                            <div className="flex items-center gap-2 pt-6">
                              <input
                                id={`field-required-${idx}`}
                                type="checkbox"
                                checked={field.required}
                                onChange={(e) => handleFieldChange(idx, { required: e.target.checked })}
                                className="w-4 h-4 text-indigo-650 rounded border-slate-350"
                              />
                              <label htmlFor={`field-required-${idx}`} className="font-bold text-slate-700 cursor-pointer">
                                שדה חובה למילוי?
                              </label>
                            </div>
                            <div>
                              <label className="block font-semibold mb-1 text-slate-650">שלב בטופס (עבור טופס רב-שלבי)</label>
                              <input
                                type="number"
                                min="1"
                                max="10"
                                value={field.step || 1}
                                onChange={(e) => handleFieldChange(idx, { step: parseInt(e.target.value) || 1 })}
                                className="w-full bg-white text-slate-800 border rounded-xl p-2.5 outline-none"
                              />
                            </div>
                          </div>

                          {field.type === "select" && (
                            <div>
                              <label className="block font-semibold mb-1 text-slate-650">אפשרויות לבחירה (כל אפשרות בשורה חדשה)</label>
                              <textarea
                                value={field.options}
                                onChange={(e) => handleFieldChange(idx, { options: e.target.value })}
                                rows={3}
                                className="w-full bg-white text-slate-800 border rounded-xl p-3 outline-none resize-none font-mono"
                                placeholder="אפשרות א'&#10;אפשרות ב'&#10;אפשרות ג'"
                              />
                            </div>
                          )}

                          {["hidden", "fixed_amount"].includes(field.type) && (
                            <div>
                              <label className="block font-semibold mb-1 text-slate-650">ערך קבוע / ברירת מחדל</label>
                              <input
                                type="text"
                                value={field.default_value}
                                onChange={(e) => handleFieldChange(idx, { default_value: e.target.value })}
                                className="w-full bg-white text-slate-800 border rounded-xl p-2.5 outline-none"
                                placeholder="הזן ערך מוגדר מראש"
                              />
                            </div>
                          )}

                          {field.type === "calculated" && (
                            <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                              <label className="block font-semibold mb-1 text-indigo-900">נוסחת חישוב חשבונית</label>
                              <p className="text-indigo-600 mb-2 text-xs">
                                כתוב נוסחה חשבונית (כפל <code>*</code>, חילוק <code>/</code>, חיבור <code>+</code>, חיסור <code>-</code>).<br/>
                                כדי להשתמש בערך של שדה אחר, הקלד את שם השדה בתוך סוגריים מרובעים. לדוגמה: <code>[כמות משתתפים] * 50 + 10</code>
                              </p>
                              <input
                                type="text"
                                value={field.calc_formula || ""}
                                onChange={(e) => handleFieldChange(idx, { calc_formula: e.target.value })}
                                className="w-full bg-white text-slate-800 border border-indigo-200 rounded-xl p-3 outline-none font-mono text-left"
                                placeholder="e.g. [amount] * 0.17"
                                dir="ltr"
                              />
                            </div>
                          )}

                          {/* URL params */}
                          <div className="border-t pt-3 flex flex-wrap gap-4 items-center">
                            <div className="flex items-center gap-2">
                              <input
                                id={`field-url-${idx}`}
                                type="checkbox"
                                checked={field.url_param_enable}
                                onChange={(e) => handleFieldChange(idx, { url_param_enable: e.target.checked })}
                                className="w-4 h-4 text-indigo-650 rounded border-slate-350"
                              />
                              <label htmlFor={`field-url-${idx}`} className="font-bold text-slate-650 cursor-pointer">
                                משיכת ערך מפרמטר בכתובת URL?
                              </label>
                            </div>
                            {field.url_param_enable && (
                              <div className="flex items-center gap-1.5">
                                <span className="text-slate-400">שם הפרמטר ב-URL:</span>
                                <input
                                  type="text"
                                  value={field.url_param_name}
                                  onChange={(e) => handleFieldChange(idx, { url_param_name: e.target.value })}
                                  className="bg-white text-slate-800 border rounded-xl p-2 outline-none w-32"
                                  placeholder="e.g. promo"
                                />
                              </div>
                            )}
                          </div>

                          {/* Conditional Logic */}
                          <div className="border-t pt-3 space-y-3">
                            <div className="flex items-center gap-2">
                              <input
                                id={`field-cond-${idx}`}
                                type="checkbox"
                                checked={field.cond_enable}
                                onChange={(e) => handleFieldChange(idx, { cond_enable: e.target.checked })}
                                className="w-4 h-4 text-indigo-650 rounded border-slate-350"
                              />
                              <label htmlFor={`field-cond-${idx}`} className="font-bold text-slate-650 cursor-pointer">
                                הפעל לוגיקה תנאית (Conditional Logic)?
                              </label>
                            </div>
                            
                            {field.cond_enable && (
                              <div className="bg-indigo-50/30 border border-indigo-100 p-3.5 rounded-2xl flex flex-wrap gap-3 items-center">
                                <span>הצג שדה זה רק אם שדה:</span>
                                <select
                                  value={field.cond_field_index}
                                  onChange={(e) => handleFieldChange(idx, { cond_field_index: parseInt(e.target.value) })}
                                  className="bg-white text-slate-800 border rounded-xl p-2 outline-none min-w-[120px]"
                                >
                                  <option value="">בחר שדה...</option>
                                  {selectFields
                                    .filter(f => f.index !== idx)
                                    .map(f => (
                                      <option key={f.index} value={f.index}>{f.label}</option>
                                    ))
                                  }
                                </select>
                                <select
                                  value={field.cond_operator}
                                  onChange={(e) => handleFieldChange(idx, { cond_operator: e.target.value })}
                                  className="bg-white text-slate-800 border rounded-xl p-2 outline-none"
                                >
                                  <option value="is">שווה ל-</option>
                                  <option value="is_not">שונה מ-</option>
                                </select>
                                <input
                                  type="text"
                                  value={field.cond_value}
                                  onChange={(e) => handleFieldChange(idx, { cond_value: e.target.value })}
                                  placeholder="הזן ערך"
                                  className="bg-white text-slate-800 border rounded-xl p-2 outline-none w-32"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: WHATSAPP AUTOMATION */}
          {activeTab === "whatsapp" && (
            <div className="space-y-6">
              <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl text-xs space-y-2">
                <h4 className="font-bold text-indigo-850 flex items-center gap-1.5">
                  <Sparkles className="w-4.5 h-4.5 text-indigo-650" />
                  הסבר על מנגנון הוואטסאפ האוטומטי
                </h4>
                <p className="text-indigo-700 leading-relaxed">
                  הודעות וואטסאפ יישלחו אוטומטית למספר הטלפון שיוזן בשדה הממופה ל-<strong>"טלפון נייד"</strong> בטופס.
                  תוכלו להשתמש בפלייסהולדרים המייצגים את שדות הטופס על ידי לחיצה על כפתורי השדות למטה, והמערכת תחלץ את התוכן של המשתמש.
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1.5">
                  {value.fields.map((f, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handlePlaceholderClick(`{${f.label}}`, 
                        value.form_type === "payment" ? "payment_success_message" : "standard_whatsapp_message"
                      )}
                      className="px-2.5 py-1 rounded bg-indigo-100 hover:bg-indigo-200 border border-indigo-200 text-indigo-800 text-[10px] font-bold"
                    >
                      {`{${f.label}}`}
                    </button>
                  ))}
                  {value.form_type === "payment" && (
                    <>
                      <button
                        type="button"
                        onClick={() => handlePlaceholderClick("{סכום}", "payment_success_message")}
                        className="px-2.5 py-1 rounded bg-purple-100 hover:bg-purple-250 border border-purple-200 text-purple-800 text-[10px] font-bold"
                      >
                        {`{סכום}`}
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePlaceholderClick("{link_kabala}", "payment_success_message")}
                        className="px-2.5 py-1 rounded bg-purple-100 hover:bg-purple-250 border border-purple-200 text-purple-800 text-[10px] font-bold"
                      >
                        {`{link_kabala}`}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {value.form_type === "standard" ? (
                /* Standard Lead Form WhatsApp Settings */
                <div className="space-y-4">
                  <div className="bg-white p-5 rounded-3xl border space-y-4">
                    <h4 className="font-bold text-slate-800 text-sm border-b pb-2">
                      וואטסאפ לאחר שליחת ליד מוצלחת
                    </h4>
                    <div>
                      <label className="block text-xs font-semibold text-slate-650 mb-1">נוסח ההודעה</label>
                      <textarea
                        id="standard_whatsapp_message"
                        value={value.standard_whatsapp_message}
                        onChange={(e) => updateConfig({ standard_whatsapp_message: e.target.value })}
                        rows={4}
                        className="w-full bg-slate-50 text-slate-800 border rounded-xl p-3 outline-none resize-none text-xs"
                        placeholder="שלום {שם מלא}, קיבלנו את פרטיך..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-650 mb-2">תמונה מצורפת להודעה</label>
                      <ImageUpload
                        currentImage={value.standard_whatsapp_image_url}
                        onSelect={(url) => updateConfig({ standard_whatsapp_image_url: url })}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* Payment Form WhatsApp Settings (Pending & Success) */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Pending Form message */}
                  <div className="bg-white p-5 rounded-3xl border space-y-4 flex flex-col justify-between">
                    <div className="space-y-3">
                      <h4 className="font-bold text-amber-600 text-sm border-b pb-2 flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        הודעה בעת יצירת הזמנה (ממתין לתשלום)
                      </h4>
                      <div>
                        <label className="block text-xs font-semibold text-slate-650 mb-1">נוסח ההודעה</label>
                        <textarea
                          id="payment_pending_message"
                          value={value.payment_pending_message}
                          onChange={(e) => updateConfig({ payment_pending_message: e.target.value })}
                          rows={4}
                          className="w-full bg-slate-50 text-slate-800 border rounded-xl p-3 outline-none resize-none text-xs"
                          placeholder="שלום {שם מלא}, ההזמנה שלך נוצרה וממתינה לתשלום..."
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-650 mb-2">תמונה מצורפת</label>
                      <ImageUpload
                        currentImage={value.payment_pending_image_url}
                        onSelect={(url) => updateConfig({ payment_pending_image_url: url })}
                      />
                    </div>
                  </div>

                  {/* Success Form message */}
                  <div className="bg-white p-5 rounded-3xl border space-y-4 flex flex-col justify-between">
                    <div className="space-y-3">
                      <h4 className="font-bold text-green-600 text-sm border-b pb-2 flex items-center gap-1.5">
                        <Check className="w-4 h-4" />
                        הודעה לאחר ביצוע תשלום מוצלח
                      </h4>
                      <div>
                        <label className="block text-xs font-semibold text-slate-650 mb-1">נוסח ההודעה</label>
                        <textarea
                          id="payment_success_message"
                          value={value.payment_success_message}
                          onChange={(e) => updateConfig({ payment_success_message: e.target.value })}
                          rows={4}
                          className="w-full bg-slate-50 text-slate-800 border rounded-xl p-3 outline-none resize-none text-xs"
                          placeholder="שלום {שם מלא}, התשלום בסך {סכום} שח בוצע בהצלחה..."
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-650 mb-2">תמונה מצורפת</label>
                      <ImageUpload
                        currentImage={value.payment_success_image_url}
                        onSelect={(url) => updateConfig({ payment_success_image_url: url })}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: GENERAL SETTINGS & DESIGN */}
          {activeTab === "settings" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column: Settings */}
              <div className="bg-white p-6 rounded-3xl border space-y-4 text-xs">
                <h4 className="font-bold text-slate-800 text-sm border-b pb-2">
                  תבניות טפסים
                </h4>
                <div className="bg-slate-50 p-4 rounded-2xl border space-y-4">
                  <div>
                    <label className="block font-semibold mb-1 text-slate-650">טען מתבנית שמורה</label>
                    <select
                      onChange={(e) => {
                        const t = templates.find(t => t.id === e.target.value);
                        if (t) handleLoadTemplate(t.config);
                        e.target.value = "";
                      }}
                      className="w-full bg-white text-slate-800 border rounded-xl p-2.5 outline-none font-bold"
                    >
                      <option value="">-- בחר תבנית לטעינה --</option>
                      {templates.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="border-t pt-3">
                    <label className="block font-semibold mb-1 text-slate-650">שמור טופס זה כתבנית</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={templateName}
                        onChange={(e) => setTemplateName(e.target.value)}
                        placeholder="שם התבנית (למשל: טופס הרשמה לקייטנה)"
                        className="flex-1 bg-white text-slate-800 border rounded-xl p-2.5 outline-none text-xs"
                      />
                      <Button type="button" onClick={handleSaveTemplate} disabled={isSavingTemplate} size="sm" className="rounded-xl h-auto flex gap-1 bg-indigo-600 hover:bg-indigo-700 text-white">
                        <Save className="w-4 h-4" /> שמור
                      </Button>
                    </div>
                  </div>
                </div>

                <h4 className="font-bold text-slate-800 text-sm border-b pb-2 mt-6">
                  הגדרות סנכרון וניהול
                </h4>

                <div>
                  <label className="block font-semibold mb-1 text-slate-650">סוג הטופס</label>
                  <select
                    value={value.form_type}
                    onChange={(e) => updateConfig({ form_type: e.target.value as any })}
                    className="w-full bg-slate-50 text-slate-800 border rounded-xl p-2.5 outline-none font-bold"
                  >
                    <option value="standard">טופס לידים / יצירת קשר רגיל</option>
                    <option value="payment">טופס תרומות ותשלום (Nedarim API)</option>
                    <option value="register">טופס הרשמת משתמש למערכת</option>
                  </select>
                </div>

                {value.form_type === "register" && (
                  <div className="animate-in slide-in-from-top-2 duration-300">
                    <label className="block font-semibold mb-1 text-slate-650">תפקיד המשתמש החדש שייווצר</label>
                    <select
                      value={value.register_role || "TRIAL"}
                      onChange={(e) => updateConfig({ register_role: e.target.value as "DEVELOPING" | "TRIAL" })}
                      className="w-full bg-slate-50 text-slate-800 border rounded-xl p-2.5 outline-none font-bold"
                    >
                      <option value="TRIAL">משתמש ניסיון ל-14 יום (Trial)</option>
                      <option value="DEVELOPING">משתמש מתפתח (Developing)</option>
                    </select>
                    <p className="text-[10px] text-slate-400 mt-1">
                      * המערכת תיצור משתמש חדש לאחר שליחת הטופס ותעניק לו את ההרשאה הנבחרת. חובה למפות שדות 'דוא"ל' ו-'טלפון' (טלפון ישמש כסיסמה זמנית במידה ולא יוגדר אחרת).
                    </p>
                  </div>
                )}

                {value.form_type === "payment" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-300">
                    <div>
                      <label className="block font-semibold mb-1 text-slate-650">סכום ברירת מחדל לתשלום (ש"ח)</label>
                      <input
                        type="number"
                        value={value.payment_amount}
                        onChange={(e) => updateConfig({ payment_amount: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-slate-50 text-slate-800 border rounded-xl p-2.5 outline-none font-mono"
                        placeholder="180"
                        min="1"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1 text-slate-650">סוג קבלה להנפקה (TamalType)</label>
                      <select
                        value={value.payment_receipt_type || "405"}
                        onChange={(e) => updateConfig({ payment_receipt_type: e.target.value })}
                        className="w-full bg-slate-50 text-slate-800 border rounded-xl p-2.5 outline-none font-bold"
                      >
                        <option value="405">קבלת תרומה (למלכ"ר / עמותה)</option>
                        <option value="400">קבלה רגילה (עוסק פטור / מורשה / בע"מ)</option>
                        <option value="320">חשבונית מס קבלה (עוסק מורשה / בע"מ)</option>
                        <option value="">-- ברירת מחדל של המסוף --</option>
                      </select>
                      <p className="text-[10px] text-slate-400 mt-1">
                        * בחר את סוג המסמך שיופק לאחר סליקה מוצלחת בטופס זה.
                      </p>
                    </div>
                    <div>
                      <label className="block font-semibold mb-1 text-slate-650">תדירות התרומה (הוראת קבע)</label>
                      <select
                        value={value.payment_frequency || "one-time"}
                        onChange={(e) => updateConfig({ payment_frequency: e.target.value as any })}
                        className="w-full bg-slate-50 text-slate-800 border rounded-xl p-2.5 outline-none font-bold"
                      >
                        <option value="one-time">רק תרומה חד פעמית</option>
                        <option value="user-choice">בחירת תורם (הצג מתג "תרומה חודשית קבועה")</option>
                        <option value="recurring">רק הוראת קבע (תרומה חודשית קבועה תמיד)</option>
                      </select>
                      <p className="text-[10px] text-slate-400 mt-1">
                        * ניתן לאפשר לתורם לבחור אם להפוך את התרומה להוראת קבע, או להכריח פעולה מסוימת.
                      </p>
                    </div>
                    <div>
                      <label className="block font-semibold mb-1 text-slate-650">שמור את סכום התרומה בשדה CRM</label>
                      <select
                        value={value.payment_amount_crm_map}
                        onChange={(e) => updateConfig({ payment_amount_crm_map: e.target.value })}
                        className="w-full bg-slate-50 text-slate-800 border rounded-xl p-2.5 outline-none"
                      >
                        {Object.entries(CRM_DB_FIELDS).map(([k, v]) => (
                          <option key={k} value={k}>{v}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-2">
                  <input
                    id="save-to-crm-check"
                    type="checkbox"
                    checked={value.save_to_crm}
                    onChange={(e) => updateConfig({ save_to_crm: e.target.checked })}
                    className="w-4 h-4 text-indigo-650 rounded border-slate-300"
                  />
                  <label htmlFor="save-to-crm-check" className="font-bold text-slate-700 cursor-pointer">
                    סנכרן ועדכן איש קשר ב-CRM של הארגון באופן אוטומטי
                  </label>
                </div>

                {value.save_to_crm && (
                  <div className="animate-in slide-in-from-top-2 duration-300">
                    <label className="block font-semibold mb-1 text-slate-650">שמור ל-CRM בשלב (הזן מספר שלב, או השאר ריק לשמירה בסוף הטופס)</label>
                    <input
                      type="number"
                      min="1"
                      value={value.crm_save_step || ""}
                      onChange={(e) => updateConfig({ crm_save_step: parseInt(e.target.value) || undefined })}
                      className="w-full bg-slate-50 text-slate-800 border rounded-xl p-2.5 outline-none"
                      placeholder="לדוגמה: 1"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      * ניתן להגדיר שמירת ליד בשלב מוקדם (למשל שלב 1) גם בטופס רב-שלבי, למניעת נטישת לידים.
                    </p>
                  </div>
                )}

                <div>
                  <label className="block font-semibold mb-1 text-slate-650">משתמש בעלים ב-CRM (בעלי הליד)</label>
                  <select
                    value={value.crm_owner_id}
                    onChange={(e) => updateConfig({ crm_owner_id: e.target.value })}
                    className="w-full bg-slate-50 text-slate-800 border rounded-xl p-2.5 outline-none"
                  >
                    <option value="1">מנהל ראשי (Admin)</option>
                    <option value="2">מזכירות הארגון</option>
                    <option value="3">שליח ראשי</option>
                  </select>
                </div>

                {value.form_type === "standard" && (
                  <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                    <div>
                      <label className="block font-semibold mb-1 text-slate-650">הודעת הצלחה לאחר שליחה</label>
                      <input
                        type="text"
                        value={value.standard_success_message}
                        onChange={(e) => updateConfig({ standard_success_message: e.target.value })}
                        className="w-full bg-slate-50 text-slate-800 border rounded-xl p-2.5 outline-none"
                        placeholder="הטופס נשלח בהצלחה."
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1 text-slate-650">העברה לכתובת URL חיצונית (Redirect - אופציונלי)</label>
                      <input
                        type="url"
                        value={value.standard_redirect_url}
                        onChange={(e) => updateConfig({ standard_redirect_url: e.target.value })}
                        className="w-full bg-slate-50 text-slate-800 border rounded-xl p-2.5 outline-none font-mono"
                        placeholder="https://example.com/thank-you"
                      />
                    </div>
                  </div>
                )}

                <h4 className="font-bold text-slate-800 text-sm border-b pb-2 mt-6">
                  הודעת תודה / פעולות מותנות
                </h4>

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <input
                      id="custom-modal-check"
                      type="checkbox"
                      checked={value.custom_success_modal_enable}
                      onChange={(e) => updateConfig({ custom_success_modal_enable: e.target.checked })}
                      className="w-4 h-4 text-indigo-650 rounded border-slate-300"
                    />
                    <label htmlFor="custom-modal-check" className="font-bold text-slate-700 cursor-pointer">
                      הצג מודל תודה מעוצב מותאם אישית (מחליף הודעת תודה רגילה)
                    </label>
                  </div>

                  {value.custom_success_modal_enable && (
                    <div className="space-y-4 animate-in slide-in-from-top-2 duration-300 border p-4 rounded-xl bg-slate-50/50">
                      <div>
                        <label className="block font-semibold mb-2 text-slate-700">תמונה למודל התודה (אופציונלי)</label>
                        <ImageUpload
                          currentImage={value.custom_success_modal_image_url || ""}
                          onSelect={(url) => updateConfig({ custom_success_modal_image_url: url })}
                        />
                      </div>
                      <div>
                        <label className="block font-semibold mb-2 text-slate-700">טקסט להודעת התודה</label>
                        <textarea
                          value={value.custom_success_modal_content || ""}
                          onChange={(e) => updateConfig({ custom_success_modal_content: e.target.value })}
                          className="w-full bg-white text-slate-800 border rounded-xl p-3 outline-none min-h-[100px] resize-y"
                          placeholder="תודה רבה! נציג יחזור אליך בהקדם."
                        />
                      </div>
                    </div>
                  )}

                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center mb-2">
                      <label className="block font-semibold text-slate-650">פעולות לוגיות מותנות בעת שליחה</label>
                      <Button
                        type="button"
                        onClick={() => {
                          const newRule = { id: Math.random().toString(36).substr(2, 9), field_index: 0, operator: "is" as const, value: "", action_type: "redirect" as const, action_value: "" };
                          updateConfig({ action_rules: [...(value.action_rules || []), newRule] });
                        }}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] px-2 py-1 h-auto rounded-lg"
                      >
                        <Plus className="w-3 h-3 mr-1" /> הוסף פעולה מותנית
                      </Button>
                    </div>

                    {(value.action_rules || []).map((rule, rIdx) => (
                      <div key={rule.id} className="bg-slate-50 p-3 rounded-xl border mb-3 space-y-3 relative">
                        <button
                          type="button"
                          onClick={() => {
                            const newRules = [...(value.action_rules || [])];
                            newRules.splice(rIdx, 1);
                            updateConfig({ action_rules: newRules });
                          }}
                          className="absolute top-2 left-2 text-red-400 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        
                        <div className="flex flex-wrap gap-2 items-center">
                          <span className="text-slate-500 font-bold">אם</span>
                          <select
                            value={rule.field_index}
                            onChange={(e) => {
                              const newRules = [...(value.action_rules || [])];
                              newRules[rIdx].field_index = parseInt(e.target.value);
                              updateConfig({ action_rules: newRules });
                            }}
                            className="bg-white border rounded px-2 py-1"
                          >
                            {selectFields.map(f => (
                              <option key={f.index} value={f.index}>{f.label}</option>
                            ))}
                          </select>
                          <select
                            value={rule.operator}
                            onChange={(e) => {
                              const newRules = [...(value.action_rules || [])];
                              newRules[rIdx].operator = e.target.value as "is" | "is_not";
                              updateConfig({ action_rules: newRules });
                            }}
                            className="bg-white border rounded px-2 py-1"
                          >
                            <option value="is">שווה ל-</option>
                            <option value="is_not">שונה מ-</option>
                          </select>
                          <input
                            type="text"
                            value={rule.value}
                            onChange={(e) => {
                              const newRules = [...(value.action_rules || [])];
                              newRules[rIdx].value = e.target.value;
                              updateConfig({ action_rules: newRules });
                            }}
                            placeholder="ערך"
                            className="bg-white border rounded px-2 py-1 w-24"
                          />
                        </div>

                        <div className="flex flex-wrap gap-2 items-center pt-2 border-t border-slate-200">
                          <span className="text-slate-500 font-bold">אז</span>
                          <select
                            value={rule.action_type}
                            onChange={(e) => {
                              const newRules = [...(value.action_rules || [])];
                              newRules[rIdx].action_type = e.target.value as any;
                              updateConfig({ action_rules: newRules });
                            }}
                            className="bg-white border rounded px-2 py-1"
                          >
                            <option value="redirect">העבר לקישור (Redirect)</option>
                            <option value="modal">הצג מודל תודה אישי (HTML)</option>
                            <option value="payment">העבר לתשלום (קשר)</option>
                          </select>
                          {rule.action_type !== "payment" && (
                            <input
                              type="text"
                              value={rule.action_value}
                              onChange={(e) => {
                                const newRules = [...(value.action_rules || [])];
                                newRules[rIdx].action_value = e.target.value;
                                updateConfig({ action_rules: newRules });
                              }}
                              placeholder={rule.action_type === "redirect" ? "https://..." : "<h1>תודה</h1>"}
                              className="bg-white border rounded px-2 py-1 flex-1"
                              dir="ltr"
                            />
                          )}
                        </div>
                      </div>
                    ))}
                    {(value.action_rules || []).length === 0 && (
                      <p className="text-[10px] text-slate-400 text-center py-2">לא הוגדרו פעולות מותנות. ברירת המחדל תבוצע.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Submit Button Customizer & Preview */}
              <div className="bg-white p-6 rounded-3xl border space-y-4 text-xs flex flex-col justify-between">
                <div className="space-y-4">
                  <h4 className="font-bold text-slate-800 text-sm border-b pb-2">
                    עיצוב כפתור השליחה
                  </h4>
                  <div>
                    <label className="block font-semibold mb-1 text-slate-650">טקסט כפתור שליחה</label>
                    <input
                      type="text"
                      value={value.submit_button_text}
                      onChange={(e) => updateConfig({ submit_button_text: e.target.value })}
                      className="w-full bg-slate-50 text-slate-800 border rounded-xl p-2.5 outline-none font-bold"
                      placeholder="המשך לתשלום מאובטח"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold mb-1 text-slate-650">צבע רקע כפתור</label>
                      <div className="flex gap-2 items-center">
                        <input
                          type="color"
                          value={value.submit_button_bg_color}
                          onChange={(e) => updateConfig({ submit_button_bg_color: e.target.value })}
                          className="w-10 h-10 border rounded-xl cursor-pointer p-0.5"
                        />
                        <span className="font-mono">{value.submit_button_bg_color}</span>
                      </div>
                    </div>
                    <div>
                      <label className="block font-semibold mb-1 text-slate-650">צבע טקסט כפתור</label>
                      <div className="flex gap-2 items-center">
                        <input
                          type="color"
                          value={value.submit_button_text_color}
                          onChange={(e) => updateConfig({ submit_button_text_color: e.target.value })}
                          className="w-10 h-10 border rounded-xl cursor-pointer p-0.5"
                        />
                        <span className="font-mono">{value.submit_button_text_color}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Form & Field background color settings */}
                  <div className="grid grid-cols-2 gap-4 border-t pt-4">
                    <div>
                      <label className="block font-semibold mb-1 text-slate-650">צבע רקע הטופס</label>
                      <div className="flex gap-2 items-center">
                        <input
                          type="color"
                          value={value.form_bg_color || "#ffffff"}
                          onChange={(e) => updateConfig({ form_bg_color: e.target.value })}
                          className="w-10 h-10 border rounded-xl cursor-pointer p-0.5"
                        />
                        <span className="font-mono text-[10px]">{value.form_bg_color || "#ffffff"}</span>
                      </div>
                    </div>
                    <div>
                      <label className="block font-semibold mb-1 text-slate-650">צבע רקע השדות</label>
                      <div className="flex gap-2 items-center">
                        <input
                          type="color"
                          value={value.field_bg_color || "#f8fafc"}
                          onChange={(e) => updateConfig({ field_bg_color: e.target.value })}
                          className="w-10 h-10 border rounded-xl cursor-pointer p-0.5"
                        />
                        <span className="font-mono text-[10px]">{value.field_bg_color || "#f8fafc"}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-6 rounded-2xl border text-center space-y-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">תצוגה מקדימה כפתור</span>
                  <button
                    type="button"
                    style={{
                      backgroundColor: value.submit_button_bg_color,
                      color: value.submit_button_text_color
                    }}
                    className="w-full py-3.5 px-6 rounded-xl font-bold text-sm shadow-md transition-all hover:scale-[1.02]"
                  >
                    {value.submit_button_text}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Add Custom Field Modal */}
      <Modal isOpen={showAddCustomFieldModal} onClose={() => setShowAddCustomFieldModal(false)}>
        <Modal.Content className="max-w-md rounded-[2rem] p-6 text-right">
          <Modal.Close className="left-4 right-auto" />
          <Modal.Header title="הוספת שדה חדש ל-CRM" description="צור שדה מותאם אישית שיוצג בכרטיס איש הקשר ויהיה זמין למיפוי בטפסים." />
          
          <div className="space-y-4 my-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">קטגוריה ב-CRM</label>
              <select 
                value={newCustomFieldCategory}
                onChange={(e) => setNewCustomFieldCategory(e.target.value)}
                className="w-full rounded-xl border p-2.5 bg-white outline-none"
              >
                <option value="details">פרטים כלליים</option>
                <option value="camp">משפחה וקייטנה</option>
                <option value="tags">תיוגים והערות</option>
                <option value="company">חברה ומקור</option>
                <option value="events">אירועים ומפגשים</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">סוג השדה</label>
              <select 
                value={newCustomFieldType}
                onChange={(e) => setNewCustomFieldType(e.target.value)}
                className="w-full rounded-xl border p-2.5 bg-white outline-none"
              >
                <option value="text">שדה טקסט</option>
                <option value="textarea">אזור טקסט ארוך</option>
                <option value="number">מספר</option>
                <option value="date">תאריך</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">שם השדה (תווית התצוגה)</label>
              <Input 
                value={newCustomFieldLabel}
                onChange={(e) => setNewCustomFieldLabel(e.target.value)}
                placeholder="למשל: שם החיה, מצב משפחתי..."
                className="rounded-xl"
              />
            </div>
          </div>
          
          <Modal.Footer>
            <div className="flex gap-3 justify-end w-full">
              <Button onClick={() => setShowAddCustomFieldModal(false)} className="bg-slate-100 text-slate-700 hover:bg-slate-200">ביטול</Button>
              <Button onClick={handleAddCustomField} disabled={isAddingCustomField} className="bg-indigo-600 text-white hover:bg-indigo-700">
                {isAddingCustomField ? "שומר..." : "הוסף שדה"}
              </Button>
            </div>
          </Modal.Footer>
        </Modal.Content>
      </Modal>
    </div>
  );
}
