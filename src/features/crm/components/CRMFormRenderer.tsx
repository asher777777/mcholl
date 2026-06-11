"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Send, CheckCircle2, Loader2, Coins, CreditCard, ShieldAlert, RefreshCw, ChevronLeft, ChevronRight, User, Phone, Mail, MapPin, Building, Briefcase, Calendar, FileText, Heart, Smile, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { FormConfig, FormField, LogicAction } from "./CRMFormBuilder";
import { submitCRMForm } from "@/features/crm/actions";
import { KesherCheckout } from "@/features/kesher/KesherCheckout";
import { cn } from "@/lib/utils";

const IconMap: Record<string, any> = {
  "user": User,
  "phone": Phone,
  "mail": Mail,
  "map-pin": MapPin,
  "building": Building,
  "briefcase": Briefcase,
  "calendar": Calendar,
  "file-text": FileText,
  "heart": Heart,
  "smile": Smile,
  "alert-circle": AlertCircle,
  "credit-card": CreditCard,
  "coins": Coins,
};

const evaluateFormula = (formula: string, data: Record<string, string>) => {
  if (!formula) return 0;
  
  // Replace [Field Name] with its numeric value. Supports swapped brackets e.g. ]Field[
  let evaluatedFormula = formula.replace(/[\[\]]([^\[\]]+)[\[\]]/g, (_match, fieldName) => {
    const cleanFieldName = fieldName.trim();
    // Find matching key even if there are trailing/leading spaces in the actual label
    const actualKey = Object.keys(data).find(k => k.trim() === cleanFieldName);
    const rawVal = actualKey ? data[actualKey] : "0";
    
    // Extract first number (handles "980 - מסלול" => 980)
    const numMatch = String(rawVal).match(/-?\d+(\.\d+)?/);
    return numMatch ? numMatch[0] : "0";
  });

  // Strip anything that is not a digit, operator, parenthesis, or decimal point to prevent JS injection
  evaluatedFormula = evaluatedFormula.replace(/[^0-9\+\-\*\/\(\)\.\s]/g, "");

  try {
    const result = new Function(`return ${evaluatedFormula || 0}`)();
    return Number.isFinite(result) ? result : 0;
  } catch (e) {
    return 0;
  }
};

interface CRMFormRendererProps {
  config: FormConfig;
  formId: string; // usually slug
  formTitle: string; // page title
}

export function CRMFormRenderer({ config, formId, formTitle }: CRMFormRendererProps) {
  const searchParams = useSearchParams();

  // Form State
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Submission Flow States
  const [submitting, setSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [submissionError, setSubmissionError] = useState("");
  const [isRecurring, setIsRecurring] = useState(config.payment_frequency === "recurring");

  // Multi-step logic state
  const [currentStep, setCurrentStep] = useState(1);

  // Payment states
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutData, setCheckoutData] = useState<{
    amount: number;
    clientName: string;
    phone: string;
    mail: string;
  } | null>(null);

  // Initialize form field values from default values and URL params
  useEffect(() => {
    const initialData: Record<string, string> = {};
    config.fields.forEach((field) => {
      let value = field.default_value || "";
      
      // Pull from URL parameter if enabled
      if (field.url_param_enable && field.url_param_name) {
        const urlVal = searchParams.get(field.url_param_name);
        if (urlVal !== null) {
          value = urlVal;
        }
      }
      initialData[field.label] = value;
    });
    setFormData(initialData);
  }, [config.fields, searchParams]);

  // Helper to check conditional logic for a field
  const isFieldVisible = (field: FormField) => {
    if (!field.cond_enable) return true;
    
    const triggerField = config.fields[field.cond_field_index];
    if (!triggerField) return true;

    const currentValue = formData[triggerField.label] || "";
    const operator = field.cond_operator || "is";

    if (operator === "is") {
      return currentValue === field.cond_value;
    } else if (operator === "is_not") {
      return currentValue !== field.cond_value;
    }

    return true;
  };

  const handleInputChange = (label: string, value: string) => {
    setFormData((prev) => ({ ...prev, [label]: value }));
    if (errors[label]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[label];
        return next;
      });
    }
  };

  // Get active step counts
  const visibleFields = config.fields.filter(isFieldVisible);
  const stepsList = Array.from(new Set(visibleFields.map((f) => f.step || 1))).sort((a, b) => a - b);
  const totalSteps = stepsList.length > 0 ? Math.max(...stepsList) : 1;

  // Extract payment amount from fields or default config
  const getPaymentAmount = () => {
    let amt = config.payment_amount || 0;
    
    config.fields.forEach((f) => {
      if (isFieldVisible(f)) {
        if (f.map_to === "payment_amount" || f.type === "fixed_amount") {
          let valStr = formData[f.label];
          if (f.type === "calculated") {
            valStr = String(evaluateFormula(f.calc_formula || "", formData));
          }
          const parsed = parseFloat(valStr);
          if (!isNaN(parsed) && parsed > 0) {
            amt = parsed;
          }
        }
      }
    });
    return amt;
  };

  // Validate only the current step fields
  const validateCurrentStep = () => {
    const newErrors: Record<string, string> = {};
    const currentStepFields = visibleFields.filter((f) => (f.step || 1) === currentStep);

    currentStepFields.forEach((f) => {
      const val = formData[f.label] || "";
      if (f.required && !val.trim() && f.type !== "calculated") {
        newErrors[f.label] = "שדה זה הוא חובה";
      }
      if (f.type === "email" && val.trim() && !/\S+@\S+\.\S+/.test(val)) {
        newErrors[f.label] = "כתובת אימייל לא תקינה";
      }
      if (f.type === "tel" && val.trim() && val.replace(/\D/g, "").length < 9) {
        newErrors[f.label] = "מספר טלפון קצר מדי";
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return false;
    }
    return true;
  };

  const handleNextStep = async () => {
    if (validateCurrentStep()) {
      const nextStepNum = Math.min(currentStep + 1, totalSteps);
      
      // Partial CRM Save Logic
      if (config.save_to_crm && config.crm_save_step && currentStep === config.crm_save_step) {
        setSubmitting(true);
        try {
          const cleanFormData: Record<string, string> = {};
          visibleFields.forEach((f) => {
            if (f.type === "calculated") {
              cleanFormData[f.label] = String(evaluateFormula(f.calc_formula || "", formData));
            } else {
              cleanFormData[f.label] = formData[f.label] || "";
            }
          });
          
          await submitCRMForm({
            formId,
            formTitle,
            formType: "standard",
            formData: cleanFormData,
            embeddingPostId: formId,
            embeddingPostTitle: formTitle,
            formConfig: config,
            status: "ליד חלקי (משלב " + currentStep + ")"
          });
        } catch(e) {
          console.error("Partial save failed", e);
        }
        setSubmitting(false);
      }

      setCurrentStep(nextStepNum);
    }
  };

  const handlePrevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmissionError("");
    setErrors({});

    // Final Validation of all visible fields
    const newErrors: Record<string, string> = {};
    visibleFields.forEach((f) => {
      const val = formData[f.label] || "";
      if (f.required && !val.trim() && f.type !== "calculated") {
        newErrors[f.label] = "שדה זה הוא חובה";
      }
      if (f.type === "email" && val.trim() && !/\S+@\S+\.\S+/.test(val)) {
        newErrors[f.label] = "כתובת אימייל לא תקינה";
      }
      if (f.type === "tel" && val.trim() && val.replace(/\D/g, "").length < 9) {
        newErrors[f.label] = "מספר טלפון קצר מדי";
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      // Fallback to first step containing an error
      const firstErrorField = visibleFields.find((f) => newErrors[f.label]);
      if (firstErrorField) {
        setCurrentStep(firstErrorField.step || 1);
      }
      return;
    }

    // Prepare data for submission
    const cleanFormData: Record<string, string> = {};
    visibleFields.forEach((f) => {
      if (f.type === "calculated") {
        cleanFormData[f.label] = String(evaluateFormula(f.calc_formula || "", formData));
      } else {
        cleanFormData[f.label] = formData[f.label] || "";
      }
    });

    setSubmitting(true);

    try {
      // Evaluate action rules
      let matchedRule: LogicAction | null = null;
      if (config.action_rules && config.action_rules.length > 0) {
        for (const rule of config.action_rules) {
          const triggerField = config.fields[rule.field_index];
          if (!triggerField) continue;
          
          const currentValue = formData[triggerField.label] || "";
          if (rule.operator === "is" && currentValue === rule.value) {
            matchedRule = rule;
            break;
          } else if (rule.operator === "is_not" && currentValue !== rule.value) {
            matchedRule = rule;
            break;
          }
        }
      }

      let effectiveFormType = config.form_type;
      let actionRedirectUrl = config.standard_redirect_url;
      let showCustomModal = config.custom_success_modal_enable;
      
      if (matchedRule) {
        if (matchedRule.action_type === "payment") {
          effectiveFormType = "payment";
        } else if (matchedRule.action_type === "redirect") {
          effectiveFormType = "standard";
          actionRedirectUrl = matchedRule.action_value;
          showCustomModal = false;
        } else if (matchedRule.action_type === "modal") {
          effectiveFormType = "standard";
          showCustomModal = true;
        }
      }

      if (effectiveFormType === "standard") {
        const res = await submitCRMForm({
          formId,
          formTitle,
          formType: "standard",
          formData: cleanFormData,
          embeddingPostId: formId,
          embeddingPostTitle: formTitle,
          formConfig: config
        });

        if (res.success) {
          if (matchedRule && matchedRule.action_type === "modal" && matchedRule.action_value) {
            setSuccessMsg(matchedRule.action_value);
          } else if (showCustomModal && config.custom_success_modal_content) {
            setSuccessMsg(config.custom_success_modal_content);
          } else {
            setSuccessMsg(config.standard_success_message || "הטופס נשלח בהצלחה.");
          }
          setIsSubmitted(true);
          
          // Clear form
          const cleanData: Record<string, string> = {};
          config.fields.forEach((f) => {
            cleanData[f.label] = f.default_value || "";
          });
          setFormData(cleanData);
          setCurrentStep(1);
          setCheckoutData(null);
          
          if (actionRedirectUrl) {
            setTimeout(() => {
              window.location.href = actionRedirectUrl;
            }, 1000);
          }
        } else {
          setSubmissionError(res.error || "שגיאה בשליחת הטופס. אנא נסה שנית.");
        }
      } else {
        let clientName = "";
        let phone = "";
        let mail = "";

        visibleFields.forEach((f) => {
          const val = formData[f.label] || "";
          if (f.map_to === "conta_name") clientName = val;
          if (f.map_to === "conta_phone" || f.type === "tel") phone = val;
          if (f.map_to === "email" || f.type === "email") mail = val;
        });

        const amount = getPaymentAmount();
        
        // Check if user selected cash/bank transfer to bypass credit card checkout
        const isCashPayment = Object.entries(formData).some(([key, val]) => 
           (key.includes("אמצעי תשלום") || key.includes("אופן תשלום")) && 
           typeof val === "string" && 
           (val.includes("מזומן") || val.includes("העברה"))
        );

        if (amount <= 0 && !isCashPayment) {
          throw new Error("סכום לתשלום חייב להיות גדול מ-0");
        }

        if (isCashPayment || amount === 0) {
          await submitCRMForm({
            formId,
            formTitle,
            formType: "payment",
            formData: cleanFormData,
            embeddingPostId: formId,
            embeddingPostTitle: formTitle,
            formConfig: config,
            status: "ממתין לתשלום (מזומן/העברה)"
          });
          
          setSuccessMsg("פרטי הרישום התקבלו בהצלחה! הרישום לקייטנה יושלם סופית רק לאחר הסדרת התשלום מול המשרד.");
          setIsSubmitted(true);
          return;
        }

        await submitCRMForm({
          formId,
          formTitle,
          formType: "payment",
          formData: cleanFormData,
          embeddingPostId: formId,
          embeddingPostTitle: formTitle,
          formConfig: config,
          status: "ממתין לתשלום (אשראי)"
        });

        setCheckoutData({ amount, clientName, phone, mail });
        setShowCheckout(true);
      }
    } catch (err: any) {
      setSubmissionError(err.message || "שגיאה לא צפויה בפנייה לשרת");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePaymentSuccess = async () => {
    if (!checkoutData) return;
    setSubmitting(true);
    setShowCheckout(false);
    setSubmissionError("");

    try {
      const cleanFormData: Record<string, string> = {};
      visibleFields.forEach((f) => {
        cleanFormData[f.label] = formData[f.label] || "";
      });

      const res = await submitCRMForm({
        formId,
        formTitle,
        formType: "payment",
        formData: cleanFormData,
        embeddingPostId: formId,
        embeddingPostTitle: formTitle,
        formConfig: config,
        status: "תשלום בוצע",
        amountPaid: checkoutData.amount
      });

      if (res.success) {
        setSuccessMsg(`התשלום בסך ₪${checkoutData.amount} בוצע והתקבל בהצלחה! קבלה והודעה נשלחו לוואטסאפ.`);
        setIsSubmitted(true);
      } else {
        setSuccessMsg(`התשלום עבר, אך אירעה שגיאה בעדכון ה-CRM: ${res.error}. הנהלת הארגון עודכנה.`);
        setIsSubmitted(true);
      }
    } catch (err: any) {
      setSubmissionError("שגיאה ברישום התשלום במערכת: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const btnStyle = {
    backgroundColor: config.submit_button_bg_color || "#25D366",
    color: config.submit_button_text_color || "#ffffff"
  };

  // Success UI is now a Modal rendered at the bottom

  const fieldBgStyle = config.field_bg_color ? { backgroundColor: config.field_bg_color } : undefined;

  return (
    <div 
      style={{ backgroundColor: config.form_bg_color || "#ffffff" }}
      className="w-full max-w-[480px] mx-auto border border-slate-100 rounded-[2.5rem] p-6 sm:p-8 shadow-2xl relative overflow-hidden transition-all duration-350 text-right" 
      dir="rtl"
    >
      <div className="absolute -top-10 -left-10 w-24 h-24 bg-indigo-50 rounded-full blur-3xl opacity-60 pointer-events-none" />
      <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-emerald-50 rounded-full blur-3xl opacity-60 pointer-events-none" />

      {showCheckout && checkoutData ? (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-4 relative z-10">
          <div className="flex items-center gap-2 text-indigo-900 border-b pb-3 mb-4">
            <Coins className="w-5 h-5 text-indigo-650" />
            <h4 className="font-bold text-base">תשלום מאובטח</h4>
          </div>
          
          <div className="bg-slate-50 p-4 rounded-2xl border text-xs space-y-1.5 mb-2">
            <div><strong className="text-slate-500">עבור:</strong> <span className="text-slate-800">{formTitle}</span></div>
            <div><strong className="text-slate-500">משלם:</strong> <span className="text-slate-800">{checkoutData.clientName || "-- ללא שם --"}</span></div>
            <div><strong className="text-slate-500">טלפון:</strong> <span className="text-slate-800">{checkoutData.phone}</span></div>
            <div><strong className="text-slate-500">סכום לחיוב:</strong> <span className="font-black text-indigo-700">₪{checkoutData.amount}</span></div>
          </div>

          <KesherCheckout
            amount={checkoutData.amount}
            description={formTitle}
            onSuccess={handlePaymentSuccess}
          />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          {submissionError && (
            <div className="p-3 bg-red-50 border border-red-100 text-red-700 text-xs font-bold rounded-2xl flex items-center gap-2 animate-shake">
              <ShieldAlert className="w-4 h-4 shrink-0 text-red-500" />
              <span>{submissionError}</span>
            </div>
          )}

          {/* Steps Progress Bar Indicator */}
          {totalSteps > 1 && (
            <div className="flex items-center justify-between mb-10 relative">
              <div className="absolute left-0 right-0 top-1/2 h-1 bg-slate-100 -z-10 -translate-y-1/2 rounded-full"></div>
              <div 
                className="absolute right-0 top-1/2 h-1 -z-10 -translate-y-1/2 rounded-full transition-all duration-300" 
                style={{ 
                  width: `${((currentStep - 1) / (totalSteps - 1 || 1)) * 100}%`,
                  backgroundColor: config.submit_button_bg_color || "#fb923c"
                }}
              ></div>
              
              {Array.from({ length: totalSteps }).map((_, i) => {
                const s = i + 1;
                const isActive = currentStep >= s;
                return (
                  <div 
                    key={s} 
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors",
                      isActive ? "text-white shadow-md" : "bg-white border-2 border-slate-200 text-slate-400"
                    )}
                    style={isActive ? { backgroundColor: config.submit_button_bg_color || "#fb923c" } : {}}
                  >
                    {s}
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex flex-wrap -mx-2 w-[calc(100%+1rem)]">
          {config.fields.map((field, idx) => {
            if (!isFieldVisible(field)) return null;

            // Step filter: only render the fields for the active step
            // Note: fixed_amount and hidden elements should be rendered at any step so their input elements are in DOM
            const isHiddenOrFixed = ["hidden", "fixed_amount", "calculated"].includes(field.type);
            if (!isHiddenOrFixed && (field.step || 1) !== currentStep) return null;

            const hasError = errors[field.label];
            const FieldIcon = field.icon ? IconMap[field.icon] : null;

            return (
              <div key={idx} className="space-y-1 px-2 mb-4" style={{ width: `${field.widthPercentage || 100}%` }}>
                {field.type === "hidden" ? (
                  <input type="hidden" name={field.label} value={formData[field.label] || ""} />
                ) : field.type === "fixed_amount" ? (
                  <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl flex justify-between items-center text-xs" style={fieldBgStyle}>
                    <span className="font-semibold text-slate-500">{field.label}:</span>
                    <span className="font-mono font-bold text-slate-800">₪{formData[field.label] || field.default_value}</span>
                  </div>
                ) : field.type === "calculated" ? (
                  <div className="bg-indigo-50/50 border border-indigo-100 p-3 rounded-xl flex justify-between items-center text-xs" style={fieldBgStyle}>
                    <span className="font-semibold text-indigo-900">{field.label}:</span>
                    <span className="font-mono font-bold text-indigo-700 text-sm">
                      ₪{evaluateFormula(field.calc_formula || "", formData)}
                    </span>
                  </div>
                ) : (
                  <>
                    <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                      {FieldIcon && <FieldIcon className="w-3.5 h-3.5 text-slate-400" />}
                      {field.label}
                      {field.required && <span className="text-red-500 mr-1">*</span>}
                    </label>

                    {field.type === "textarea" ? (
                      <textarea
                        value={formData[field.label] || ""}
                        onChange={(e) => handleInputChange(field.label, e.target.value)}
                        className={cn(
                          "w-full bg-slate-50/50 hover:bg-slate-50 focus:bg-white text-slate-800 border rounded-xl p-3 text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none min-h-[80px]",
                          hasError ? "border-red-500 bg-red-50/10 focus:ring-red-500/20" : "border-slate-200 focus:border-indigo-500"
                        )}
                        style={fieldBgStyle}
                        required={field.required}
                      />
                    ) : field.type === "select" ? (
                      (field.options || "").split("\n").filter(o => o.trim()).length <= 4 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                          {(field.options || "").split("\n").filter(o => o.trim()).map(opt => {
                            const clean = opt.trim();
                            const isSelected = formData[field.label] === clean;
                            return (
                              <label
                                key={clean}
                                className={cn(
                                  "relative flex items-center p-4 rounded-2xl border-2 cursor-pointer transition-all",
                                  isSelected 
                                    ? "border-orange-400 bg-orange-50/50" 
                                    : "border-slate-200 bg-white hover:border-orange-200"
                                )}
                                style={fieldBgStyle}
                              >
                                <input
                                  type="radio"
                                  name={field.label}
                                  value={clean}
                                  checked={isSelected}
                                  onChange={(e) => handleInputChange(field.label, e.target.value)}
                                  className="w-5 h-5 text-orange-500 border-slate-300 ml-3"
                                  required={field.required && !formData[field.label]}
                                />
                                <span className="font-bold text-slate-700 leading-tight">{clean}</span>
                              </label>
                            );
                          })}
                        </div>
                      ) : (
                        <select
                          value={formData[field.label] || ""}
                          onChange={(e) => handleInputChange(field.label, e.target.value)}
                          className={cn(
                            "w-full bg-slate-50/50 hover:bg-slate-50 focus:bg-white text-slate-800 border rounded-xl p-2.5 text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all",
                            hasError ? "border-red-500 bg-red-50/10 focus:ring-red-500/20" : "border-slate-200 focus:border-indigo-500"
                          )}
                          style={fieldBgStyle}
                          required={field.required}
                        >
                          <option value="">בחר...</option>
                          {(field.options || "").split("\n").map(opt => {
                            const clean = opt.trim();
                            if (!clean) return null;
                            return <option key={clean} value={clean}>{clean}</option>;
                          })}
                        </select>
                      )
                    ) : (
                      <input
                        type={field.type === "email" ? "email" : field.type === "tel" ? "tel" : field.type === "number" ? "number" : "text"}
                        value={formData[field.label] || ""}
                        onChange={(e) => handleInputChange(field.label, e.target.value)}
                        className={cn(
                          "w-full bg-slate-50/50 hover:bg-slate-50 focus:bg-white text-slate-800 border rounded-xl p-2.5 text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all",
                          hasError ? "border-red-500 bg-red-50/10" : "border-slate-200 focus:border-indigo-500"
                        )}
                        style={fieldBgStyle}
                        required={field.required}
                        placeholder={field.type === "tel" ? "למשל: 0501234567" : ""}
                      />
                    )}

                    {hasError && (
                      <p className="text-[10px] text-red-500 font-bold mt-0.5 animate-in slide-in-from-top-1">
                        {hasError}
                      </p>
                    )}
                  </>
                )}
              </div>
            );
          })}
          </div>

          {config.form_type === "payment" && config.payment_frequency === "user-choice" && currentStep === totalSteps && (
            <div className="flex items-center gap-3 p-3 bg-blue-50/50 border border-blue-100 rounded-xl mb-4">
              <button
                type="button"
                onClick={() => setIsRecurring(!isRecurring)}
                className={cn(
                  "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                  isRecurring ? 'bg-blue-600' : 'bg-slate-300'
                )}
              >
                <span
                  className={cn(
                    "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                    isRecurring ? 'translate-x-6' : 'translate-x-1'
                  )}
                />
              </button>
              <div className="flex items-center gap-2 text-sm text-blue-900 font-medium">
                <RefreshCw className="w-4 h-4 text-blue-600" />
                הפוך לתרומה חודשית קבועה
              </div>
            </div>
          )}

          {/* Stepper Buttons (Prev / Next / Submit) */}
          <div className="flex gap-3 pt-4">
            {currentStep > 1 && (
              <Button
                type="button"
                onClick={handlePrevStep}
                variant="outline"
                className="flex-1 py-3.5 px-6 rounded-xl font-bold text-sm flex items-center justify-center gap-1.5 border-slate-200 hover:bg-slate-50 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
                חזור
              </Button>
            )}
            
            {currentStep < totalSteps ? (
              <Button
                type="button"
                onClick={handleNextStep}
                style={btnStyle}
                className="flex-1 py-3.5 px-6 rounded-xl font-bold text-sm flex items-center justify-center gap-1.5 shadow-lg transition-all hover:scale-[1.01] cursor-pointer"
              >
                המשך
                <ChevronLeft className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={submitting}
                style={btnStyle}
                className="flex-1 py-3.5 px-6 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all hover:scale-[1.01] cursor-pointer"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : config.form_type === "payment" ? (
                  <CreditCard className="w-4 h-4" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {submitting ? "מעבד..." : config.submit_button_text || "שלח פנייה"}
              </Button>
            )}
          </div>
        </form>
      )}
      
      {/* Success Modal */}
      <Modal isOpen={isSubmitted} onClose={() => setIsSubmitted(false)}>
        <Modal.Content className="max-w-md rounded-[2rem] p-8 text-center bg-white border border-slate-100 shadow-2xl relative">
          <Modal.Close className="absolute left-4 top-4 right-auto" />
          
          <div className="w-20 h-20 rounded-full bg-emerald-500/10 text-emerald-600 border-2 border-emerald-500/20 flex items-center justify-center mx-auto shadow-inner animate-bounce mb-6">
            <CheckCircle2 className="w-12 h-12" />
          </div>
          
          {config.custom_success_modal_image_url && (
            <div className="mb-6 rounded-2xl overflow-hidden shadow-sm">
              <img src={config.custom_success_modal_image_url} alt="Success" className="w-full h-auto object-cover max-h-48" />
            </div>
          )}

          {/<[a-z][\s\S]*>/i.test(successMsg) ? (
            <div 
              className="text-slate-800 leading-relaxed text-right prose prose-sm max-w-none mx-auto"
              dangerouslySetInnerHTML={{ __html: successMsg }} 
            />
          ) : (
            <div className="space-y-3">
              <h3 className="text-2xl font-black text-slate-800 leading-tight">הפעולה בוצעה בהצלחה!</h3>
              <p className="text-slate-600 text-sm leading-relaxed px-4 whitespace-pre-line font-medium">
                {successMsg}
              </p>
            </div>
          )}
          
          <Button
            onClick={() => setIsSubmitted(false)}
            className="mt-8 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-8 py-3 rounded-xl border border-slate-200 w-full shadow-sm transition-all hover:shadow"
          >
            סגור והמשך
          </Button>
        </Modal.Content>
      </Modal>

    </div>
  );
}
