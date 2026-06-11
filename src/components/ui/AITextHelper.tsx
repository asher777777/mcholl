"use client";

import { useState } from "react";
import { Sparkles, Loader2, Check, RefreshCw, MessageSquare } from "lucide-react";
import { rephraseTextWithAI } from "@/features/ai/actions";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/utils";

interface AITextHelperProps {
  value: string;
  onChange: (newValue: string) => void;
  className?: string;
}

export function AITextHelper({ value, onChange, className = "" }: AITextHelperProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tone, setTone] = useState<"warm" | "elegant" | "punchy" | "storytelling">("warm");
  const [customInstruction, setCustomInstruction] = useState("");
  const [suggestion, setSuggestion] = useState("");
  const [loading, setLoading] = useState(false);

  const handleOpen = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSuggestion(value || "");
    setIsOpen(true);
  };

  const handleImprove = async () => {
    setLoading(true);
    try {
      const res = await rephraseTextWithAI(value || suggestion, tone, customInstruction);
      if (res.success && res.text) {
        setSuggestion(res.text);
      } else {
        alert(res.error || "שגיאה בשיפור הטקסט");
      }
    } catch (err) {
      console.error(err);
      alert("שגיאה בתקשורת עם השרת");
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    onChange(suggestion);
    setIsOpen(false);
  };

  const tones = [
    { id: "warm", label: "חם ומקרב", desc: "סגנון משפחתי ומזמין" },
    { id: "elegant", label: "רשמי ומכובד", desc: "עברית גבוהה ורשמית" },
    { id: "punchy", label: "קצר וקולע", desc: "שיווקי ומניע לפעולה" },
    { id: "storytelling", label: "רוחני ומרגש", desc: "מעורר השראה מהלב" },
  ];

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        disabled={loading}
        className={`absolute left-2 top-2 p-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 disabled:bg-slate-200/50 disabled:text-slate-400 disabled:cursor-not-allowed text-white shadow-md transition-all flex items-center justify-center cursor-pointer z-[80] ${className}`}
        title="שפר או שנה סגנון כתיבה עם AI"
      >
        <span className="flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 animate-pulse text-yellow-300" />
          <span className="text-[10px] font-bold">שפר עם AI</span>
        </span>
      </button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <Modal.Content className="max-w-xl p-0 bg-slate-900 border border-slate-800 rounded-[2rem] text-slate-100 overflow-hidden shadow-2xl relative">
          <div dir="rtl" className="w-full">
            <Modal.Close className="top-4 right-4 text-slate-400 hover:text-white" />
          
          {/* Header */}
          <div className="p-6 border-b border-slate-800 bg-slate-950/50 flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">עוזר כתיבה מבוסס AI</h3>
              <p className="text-xs text-slate-400">שפר, נסח מחדש או שנה את סגנון הטקסט שלך בקלות</p>
            </div>
          </div>

          <div className="p-6 space-y-6 text-right">
            {/* Tone Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-400">בחר סגנון כתיבה (טון):</label>
              <div className="grid grid-cols-2 gap-2">
                {tones.map((t) => {
                  const active = tone === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTone(t.id as any)}
                      className={cn(
                        "p-3 rounded-xl border text-right transition-all flex flex-col gap-0.5 cursor-pointer",
                        active
                          ? "bg-indigo-600/15 border-indigo-500 text-white shadow-md shadow-indigo-950/20"
                          : "bg-slate-950/30 border-slate-800 text-slate-400 hover:bg-slate-950/50 hover:text-slate-200"
                      )}
                    >
                      <span className="text-xs font-black flex items-center gap-1.5">
                        <span className={cn("w-1.5 h-1.5 rounded-full", active ? "bg-indigo-400" : "bg-slate-600")} />
                        {t.label}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">{t.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom instruction input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-400 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                דגשים נוספים והוראות אישיות ל-AI (אופציונלי):
              </label>
              <input
                type="text"
                value={customInstruction}
                onChange={(e) => setCustomInstruction(e.target.value)}
                placeholder="למשל: תזכיר את זמני השבת, פנה בלשון רבים, הוסף אימוג'ים..."
                className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 h-11 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Draft / Result preview */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-400">הנוסח המשופר והטיוטה המוכנה:</label>
              <textarea
                value={suggestion}
                onChange={(e) => setSuggestion(e.target.value)}
                placeholder="הטקסט המשופר יופיע כאן. תוכל גם לערוך אותו ישירות..."
                rows={4}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs leading-relaxed text-white focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 bg-slate-950/60 border-t border-slate-800/80 flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              ביטול
            </button>
            <button
              type="button"
              onClick={handleImprove}
              disabled={loading || (!value?.trim() && !suggestion.trim())}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5" />
              )}
              {loading ? "מנסח מחדש..." : "ייצר / שפר עם AI"}
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={loading || !suggestion.trim()}
              className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-md"
            >
              <Check className="w-3.5 h-3.5" />
              החל נוסח זה
            </button>
          </div>
          </div>
        </Modal.Content>
      </Modal>
    </>
  );
}
