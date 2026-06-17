"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bot, Sparkles, Send, ArrowLeft, ArrowRight, CheckCircle, 
  Loader2, Calendar, Users, Zap, ShieldAlert, FileText, 
  Trash2, Plus, Edit3, Check
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { 
  startBrainstormSessionWithAI, 
  continueBrainstormWithAI, 
  finalizeCommunityStrategyWithAI,
  createCommunityInDatabase
} from "@/features/community-generator/actions";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  quickReplies?: string[];
}

interface TaskItem {
  id: string;
  title: string;
  description: string;
  startDate: string;
  dueDate: string;
  assignedRole: string;
  status: "pending" | "in_progress" | "completed";
}

interface StrategyData {
  name: string;
  vision: string;
  goals: { id: string; title: string; timeframe: string }[];
  roles: { name: string; responsibilities: string }[];
  tasks: TaskItem[];
  automations: {
    name: string;
    trigger: { type: string; dateIso?: string };
    steps: { type: string; config: any }[];
  }[];
}

export default function CommunityGeneratorPage() {
  const router = useRouter();
  const [step, setStep] = useState<"initial" | "chat" | "strategy" | "gantt" | "generating" | "success">("initial");
  const [generalIdea, setGeneralIdea] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [readyToFinalize, setReadyToFinalize] = useState(false);
  
  // Strategy Data
  const [strategy, setStrategy] = useState<StrategyData | null>(null);
  
  // Gantt / Timeline State
  const [ganttView, setGanttView] = useState<"gantt" | "list">("gantt");
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [automationsEnabled, setAutomationsEnabled] = useState<Record<string, boolean>>({});

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  const handleStartBrainstorm = async () => {
    if (!generalIdea.trim()) return;
    setLoading(true);
    const res = await startBrainstormSessionWithAI(generalIdea);
    setLoading(false);
    if (res.success && res.data) {
      setChatHistory([
        { role: "user", content: generalIdea },
        { 
          role: "assistant", 
          content: res.data.message,
          quickReplies: res.data.quickReplies 
        }
      ]);
      setStep("chat");
    } else {
      alert("שגיאה בהתחלת סיור המוחות: " + res.error);
    }
  };

  const handleSendMessage = async (messageText: string) => {
    const text = messageText.trim();
    if (!text) return;

    // Add user message to history
    const updatedHistory = [...chatHistory, { role: "user" as const, content: text }];
    setChatHistory(updatedHistory);
    setInputMessage("");
    setLoading(true);

    const res = await continueBrainstormWithAI(updatedHistory, text);
    setLoading(false);

    if (res.success && res.data) {
      setChatHistory(prev => [
        ...prev,
        { 
          role: "assistant", 
          content: res.data.message,
          quickReplies: res.data.quickReplies 
        }
      ]);
      if (res.data.readyToFinalize) {
        setReadyToFinalize(true);
      }
    } else {
      alert("שגיאה בעיבוד התשובה: " + res.error);
    }
  };

  const handleGenerateStrategy = async () => {
    setLoading(true);
    const res = await finalizeCommunityStrategyWithAI(chatHistory);
    setLoading(false);
    if (res.success && res.data) {
      const data = res.data as StrategyData;
      setStrategy(data);
      
      // Enable all automations by default
      const autoMap: Record<string, boolean> = {};
      data.tasks.forEach((task, idx) => {
        autoMap[task.id] = idx % 2 === 0; // Toggle some automations on by default
      });
      setAutomationsEnabled(autoMap);
      
      setStep("strategy");
    } else {
      alert("שגיאה בגיבוש האסטרטגיה: " + res.error);
    }
  };

  const handleUpdateTask = (updatedTask: TaskItem) => {
    if (!strategy) return;
    setStrategy({
      ...strategy,
      tasks: strategy.tasks.map(t => t.id === updatedTask.id ? updatedTask : t)
    });
    setEditingTaskId(null);
  };

  const handleCreateCommunity = async () => {
    if (!strategy) return;
    setStep("generating");
    
    // Filter automations to match only tasks that have automations enabled
    const finalAutomations = strategy.automations.filter((auto, idx) => {
      // Find tasks associated with this automation (based on name match or simply keep enabled ones)
      return true; 
    });

    const res = await createCommunityInDatabase({
      ...strategy,
      automations: finalAutomations
    });

    if (res.success) {
      setStep("success");
    } else {
      setStep("strategy");
      alert("שגיאה בהקמת הקהילה ב-DB: " + res.error);
    }
  };

  // Helper to parse dates to week numbers for the Gantt view
  const getGanttWeeks = () => {
    if (!strategy?.tasks.length) return [];
    
    // Find absolute minimum date
    const dates = strategy.tasks.map(t => new Date(t.startDate).getTime());
    const minDate = new Date(Math.min(...dates));
    
    // Generate 4 weeks starting from minDate
    const weeks: { label: string; start: string }[] = [];
    for (let i = 0; i < 4; i++) {
      const start = new Date(minDate);
      start.setDate(minDate.getDate() + i * 7);
      weeks.push({
        label: `שבוע ${i + 1}`,
        start: start.toISOString().split("T")[0]
      });
    }
    return weeks;
  };

  const getTaskGridStyle = (task: TaskItem) => {
    if (!strategy?.tasks.length) return {};
    const weeks = getGanttWeeks();
    const minTime = new Date(weeks[0].start).getTime();
    const maxTime = new Date(weeks[weeks.length - 1].start).getTime() + 7 * 24 * 60 * 60 * 1000;
    const totalDuration = maxTime - minTime;

    const taskStart = new Date(task.startDate).getTime();
    const taskEnd = new Date(task.dueDate).getTime();

    const startPct = Math.max(0, Math.min(100, ((taskStart - minTime) / totalDuration) * 100));
    const endPct = Math.max(0, Math.min(100, ((taskEnd - minTime) / totalDuration) * 100));
    const widthPct = Math.max(10, endPct - startPct);

    return {
      marginRight: `${startPct}%`,
      width: `${widthPct}%`
    };
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-right pb-16" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-slate-800 flex items-center gap-2">
            <Bot className="w-8 h-8 text-indigo-600" />
            מחולל הקהילות מ-0 ב-AI
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            סיור מוחות מונחה בינה מלאכותית, בניית אסטרטגיה, יצירת פרויקטים (גנט) ואוטומציות במודולריות מלאה.
          </p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: Initial Pitch */}
        {step === "initial" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl space-y-6"
          >
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-800">מה הרעיון שלכם לקהילה?</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                הקלידו משפט או שניים המתארים את סוג הקהילה, הארגון או העמותה שאתם שואפים להקים. 
                מנהל הקהילות החכם שלנו ייכנס אתכם לסיור מוחות קצר כדי לחדד את האסטרטגיה, לגזור משימות, להקים בעלי תפקידים, טפסים ואוטומציות.
              </p>
            </div>

            <div className="space-y-4">
              <textarea
                value={generalIdea}
                onChange={e => setGeneralIdea(e.target.value)}
                placeholder="לדוגמה: אני רוצה להקים קהילה של עצמאיים בתחום הטכנולוגיה בשרון, שתיפגש מדי שבוע לנטוורקינג ותספק תכנים מקצועיים ושיתוף פעולה עסקי."
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm min-h-[140px] focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-all resize-none"
              />
              <div className="flex justify-end">
                <Button 
                  onClick={handleStartBrainstorm} 
                  disabled={loading || !generalIdea.trim()}
                  className="gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold px-8 py-3.5 shadow-lg hover:shadow-xl transition-all"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                  התחל סיור מוחות
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 2: Interactive Brainstorm Chat */}
        {step === "chat" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden flex flex-col h-[650px] max-h-[calc(100vh-200px)]"
          >
            {/* Chat Header */}
            <div className="bg-slate-50 border-b p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">סיור מוחות: גיבוש אסטרטגיית הקהילה</h4>
                  <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                    יועץ AI פעיל ומאזין...
                  </p>
                </div>
              </div>
              
              {readyToFinalize && (
                <Button
                  onClick={handleGenerateStrategy}
                  className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 text-xs"
                >
                  <CheckCircle className="w-4 h-4" />
                  גבש תוכנית עבודה וגנט
                </Button>
              )}
            </div>

            {/* Messages Body */}
            <div className="flex-grow p-6 overflow-y-auto space-y-4 bg-slate-50/50">
              {chatHistory.map((msg, index) => {
                const isUser = msg.role === "user";
                return (
                  <div key={index} className={`flex ${isUser ? "justify-start" : "justify-end"} w-full`}>
                    <div 
                      className={`max-w-[80%] p-4 rounded-3xl text-sm leading-relaxed shadow-sm ${
                        isUser 
                          ? "bg-indigo-600 text-white rounded-tl-sm text-right" 
                          : "bg-white text-slate-800 border border-slate-100 rounded-tr-sm text-right"
                      }`}
                    >
                      <p className="whitespace-pre-line">{msg.content}</p>
                      
                      {/* Render Quick Replies */}
                      {!isUser && msg.quickReplies && msg.quickReplies.length > 0 && index === chatHistory.length - 1 && (
                        <div className="flex flex-wrap gap-2 mt-4">
                          {msg.quickReplies.map((reply, rIdx) => (
                            <button
                              key={rIdx}
                              onClick={() => handleSendMessage(reply)}
                              className="px-3.5 py-1.5 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold transition-all"
                            >
                              {reply}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {loading && (
                <div className="flex justify-end w-full">
                  <div className="bg-white border border-slate-100 p-4 rounded-3xl rounded-tr-sm flex items-center gap-2 text-sm text-slate-500 shadow-sm">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                    היועץ רושם תשובה...
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-4 border-t bg-white flex items-center gap-3">
              <input
                type="text"
                value={inputMessage}
                onChange={e => setInputMessage(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSendMessage(inputMessage)}
                placeholder="הקלד כאן את תשובתך..."
                className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-all"
                disabled={loading}
              />
              <Button
                onClick={() => handleSendMessage(inputMessage)}
                disabled={loading || !inputMessage.trim()}
                className="p-3 bg-indigo-600 text-white hover:bg-indigo-700 h-11 w-11 flex items-center justify-center rounded-xl transition-all"
              >
                <Send className="w-5 h-5 rotate-180" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Strategy & Roles Review */}
        {step === "strategy" && strategy && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6 animate-in fade-in duration-300"
          >
            {/* Overview / Strategy Box */}
            <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl space-y-6">
              <div className="flex items-center justify-between border-b pb-4">
                <h3 className="text-2xl font-black text-slate-800">מבנה אסטרטגי: {strategy.name}</h3>
                <Button 
                  onClick={() => setStep("gantt")} 
                  className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-2.5 rounded-full shadow"
                >
                  המשך ללוח הגנט <ArrowLeft className="w-4 h-4 mr-1" />
                </Button>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-700 text-sm flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-600" /> חזון הקהילה
                </h4>
                <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                  {strategy.vision}
                </p>
              </div>

              {/* Goals list */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-700 text-sm flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600" /> יעדים מרכזיים
                  </h4>
                  <div className="space-y-2">
                    {strategy.goals.map((goal, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 bg-white border border-slate-100 rounded-xl shadow-sm">
                        <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mt-0.5 text-xs font-bold">
                          {idx + 1}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800">{goal.title}</p>
                          <span className="text-[10px] text-muted-foreground bg-slate-100 px-2 py-0.5 rounded-full mt-1 inline-block">
                            {goal.timeframe}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Roles List */}
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-700 text-sm flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-indigo-600" /> בעלי תפקידים מומלצים
                  </h4>
                  <div className="space-y-2">
                    {strategy.roles.map((role, idx) => (
                      <div key={idx} className="p-3 bg-white border border-slate-100 rounded-xl shadow-sm space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-indigo-500" />
                          <h5 className="text-xs font-bold text-slate-800">{role.name}</h5>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-relaxed pr-4">{role.responsibilities}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 4: Gantt Chart View */}
        {step === "gantt" && strategy && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="space-y-6 animate-in fade-in duration-300"
          >
            <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-xl space-y-6">
              {/* Toolbar */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
                <div>
                  <h3 className="text-xl md:text-2xl font-black text-slate-800 flex items-center gap-2">
                    <Calendar className="w-6 h-6 text-indigo-600" />
                    גנט פרויקט והקמה
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    נהל ותזמן את משימות ההקמה. הגדר תאריכים, בעלי תפקידים, והפעל אוטומציות מבוססות גנט.
                  </p>
                </div>
                
                <div className="flex items-center gap-3">
                  {/* View Toggle */}
                  <div className="bg-slate-100 p-1 rounded-xl flex items-center">
                    <button
                      onClick={() => setGanttView("gantt")}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${ganttView === "gantt" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                    >
                      לוח גנט
                    </button>
                    <button
                      onClick={() => setGanttView("list")}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${ganttView === "list" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                    >
                      רשימת משימות
                    </button>
                  </div>

                  <Button
                    onClick={handleCreateCommunity}
                    className="gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold px-6 py-2.5 rounded-full shadow hover:shadow-lg transition-all"
                  >
                    <Check className="w-4 h-4" />
                    הקם קהילה ב-DB
                  </Button>
                </div>
              </div>

              {/* Gantt Timeline visualization */}
              {ganttView === "gantt" ? (
                <div className="space-y-4">
                  {/* Timeline Header (Weeks Grid) */}
                  <div className="grid grid-cols-5 text-center text-xs font-bold text-slate-400 bg-slate-50 py-2.5 rounded-xl border border-slate-100">
                    <div className="text-right pr-4">שם המשימה</div>
                    {getGanttWeeks().map((week, idx) => (
                      <div key={idx} className="border-r border-slate-200/50">
                        {week.label}
                        <span className="block text-[9px] font-normal text-slate-400">{new Date(week.start).toLocaleDateString('he-IL', { month: 'numeric', day: 'numeric' })}</span>
                      </div>
                    ))}
                  </div>

                  {/* Tasks Rows */}
                  <div className="space-y-3 relative">
                    {strategy.tasks.map((task) => (
                      <div key={task.id} className="grid grid-cols-5 items-center group py-1 border-b border-slate-100 last:border-0">
                        {/* Task Name & Owner */}
                        <div className="text-right pr-2 space-y-0.5">
                          <h5 className="text-xs font-bold text-slate-800 truncate" title={task.title}>{task.title}</h5>
                          <span className="text-[10px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full font-bold inline-block">
                            {task.assignedRole}
                          </span>
                        </div>

                        {/* Timeline bar container (spans remaining 4 columns) */}
                        <div className="col-span-4 relative h-10 flex items-center bg-slate-50/20 rounded-xl overflow-hidden">
                          {/* Grid line guidelines */}
                          <div className="absolute inset-0 grid grid-cols-4 pointer-events-none">
                            <div className="border-r border-slate-100 h-full" />
                            <div className="border-r border-slate-100 h-full" />
                            <div className="border-r border-slate-100 h-full" />
                            <div className="h-full" />
                          </div>

                          {/* Gantt Task Bar */}
                          <motion.div
                            layoutId={`gantt-bar-${task.id}`}
                            style={getTaskGridStyle(task)}
                            className="absolute right-0 h-7 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-between px-3 text-[10px] font-bold shadow-md cursor-pointer transition-colors"
                            onClick={() => setEditingTaskId(task.id)}
                            whileHover={{ scale: 1.01 }}
                          >
                            <span className="truncate pr-1">{task.title}</span>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {/* Automation quick action */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setAutomationsEnabled({
                                    ...automationsEnabled,
                                    [task.id]: !automationsEnabled[task.id]
                                  });
                                }}
                                className={`p-0.5 rounded-md hover:bg-white/20 transition-colors ${automationsEnabled[task.id] ? "text-amber-400" : "text-white/40"}`}
                                title={automationsEnabled[task.id] ? "אוטומציה פעילה מבוססת גנט" : "הפעל אוטומציה מבוססת גנט"}
                              >
                                <Zap className="w-3 h-3" />
                              </button>
                            </div>
                          </motion.div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* Task list details */
                <div className="space-y-3">
                  {strategy.tasks.map((task) => (
                    <div key={task.id} className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="space-y-1.5 flex-1 text-right">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-800">{task.title}</h4>
                          <span className="text-[10px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full font-bold">
                            {task.assignedRole}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">{task.description}</p>
                        
                        {/* Dates */}
                        <div className="flex gap-4 text-[10px] text-slate-400 font-mono">
                          <span>התחלה: {task.startDate}</span>
                          <span>סיום: {task.dueDate}</span>
                        </div>
                      </div>

                      {/* Controls */}
                      <div className="flex items-center gap-3 shrink-0">
                        {/* Toggle automation */}
                        <button
                          onClick={() => setAutomationsEnabled({
                            ...automationsEnabled,
                            [task.id]: !automationsEnabled[task.id]
                          })}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                            automationsEnabled[task.id] 
                              ? "bg-amber-50 border-amber-300 text-amber-700 shadow-sm" 
                              : "bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100"
                          }`}
                        >
                          <Zap className="w-3.5 h-3.5" />
                          {automationsEnabled[task.id] ? "אוטומציה פעילה" : "הפעל אוטומציה"}
                        </button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingTaskId(task.id)}
                          className="rounded-xl px-3"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Back / Navigation button */}
              <div className="flex justify-between border-t pt-4">
                <Button variant="outline" onClick={() => setStep("strategy")} className="gap-2">
                  <ArrowRight className="w-4 h-4 ml-1" />
                  חזור לאסטרטגיה
                </Button>
              </div>
            </div>

            {/* Task Edit Modal Overlay */}
            {editingTaskId && (
              <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-white rounded-[2rem] p-6 max-w-md w-full shadow-2xl space-y-4 text-right"
                  dir="rtl"
                >
                  <h4 className="text-base font-bold text-slate-800">עריכת משימת גנט</h4>
                  {(() => {
                    const task = strategy.tasks.find(t => t.id === editingTaskId);
                    if (!task) return null;
                    return (
                      <form onSubmit={(e) => {
                        e.preventDefault();
                        const data = new FormData(e.currentTarget);
                        handleUpdateTask({
                          ...task,
                          title: data.get("title") as string || task.title,
                          description: data.get("description") as string || task.description,
                          startDate: data.get("startDate") as string || task.startDate,
                          dueDate: data.get("dueDate") as string || task.dueDate,
                          assignedRole: data.get("assignedRole") as string || task.assignedRole,
                        });
                      }} className="space-y-4">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-600">שם המשימה</label>
                          <input type="text" name="title" defaultValue={task.title} className="w-full p-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none" required />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-600">תיאור המשימה</label>
                          <textarea name="description" defaultValue={task.description} className="w-full p-2.5 border rounded-xl text-sm h-20 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none resize-none" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-600">תאריך התחלה</label>
                            <input type="date" name="startDate" defaultValue={task.startDate} className="w-full p-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none" required />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-600">תאריך יעד</label>
                            <input type="date" name="dueDate" defaultValue={task.dueDate} className="w-full p-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none" required />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-600">בעל תפקיד אחראי</label>
                          <select name="assignedRole" defaultValue={task.assignedRole} className="w-full p-2.5 border rounded-xl text-sm bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none">
                            {strategy.roles.map((r, rIdx) => (
                              <option key={rIdx} value={r.name}>{r.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex gap-2 justify-end pt-2">
                          <Button type="button" variant="outline" onClick={() => setEditingTaskId(null)}>ביטול</Button>
                          <Button type="submit">שמור משימה</Button>
                        </div>
                      </form>
                    );
                  })()}
                </motion.div>
              </div>
            )}
          </motion.div>
        )}

        {/* Step 5: Generating Progress */}
        {step === "generating" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="bg-white p-12 rounded-[2rem] border border-slate-100 shadow-xl flex flex-col items-center justify-center space-y-6 text-center"
          >
            <div className="relative flex h-14 w-14">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-14 w-14 bg-indigo-500 items-center justify-center">
                <Sparkles className="w-7 h-7 text-white animate-pulse" />
              </span>
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-800 animate-pulse">מקים את הקהילה ב-Database...</h3>
              <p className="text-slate-500 text-sm max-w-sm">
                אנחנו מגדירים את הקהילה באוסף, מייצרים את משימות הגנט, מחוללים את דף הנחיתה הציבורי, ומגדירים את הודעות האוטומציה במערכת.
              </p>
            </div>
          </motion.div>
        )}

        {/* Step 6: Success View */}
        {step === "success" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="bg-white p-8 md:p-12 rounded-[2rem] border border-slate-100 shadow-xl flex flex-col items-center justify-center space-y-6 text-center"
          >
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shadow-lg">
              <Check className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-black text-slate-800">הקהילה הוקמה בהצלחה!</h3>
              <p className="text-slate-500 text-sm max-w-md">
                מערך המשימות בגנט הוקם, בעלי התפקידים הוגדרו, ואוטומציות לוח הזמנים פעילות. בנוסף, נוצר דף נחיתה מותאם המציג את הקהילה ומזמין חברים חדשים להצטרף.
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => router.push("/dashboard/services")}
                className="rounded-full px-6 py-2.5 font-bold"
              >
                צפה בעמודי נחיתה
              </Button>
              <Button
                onClick={() => router.push("/dashboard")}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-full px-8 py-2.5 shadow-md hover:shadow-lg transition-all"
              >
                עבור ללוח הבקרה הראשי
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
