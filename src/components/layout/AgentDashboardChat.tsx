"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Send, Bot, User, Loader2, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import Link from "next/link";
import { chatWithAssistant, getAssistantContext } from "@/features/assistant/actions";
import { Button } from "@/components/ui/Button";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface AgentDashboardChatProps {
  initialGreeting?: string;
  onExit: () => void;
}

export function AgentDashboardChat({ initialGreeting, onExit }: AgentDashboardChatProps) {
  const pathname = usePathname();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize chat with greeting and load contextual suggestions
  useEffect(() => {
    if (initialGreeting && messages.length === 0) {
      setMessages([{ role: "assistant", content: initialGreeting }]);
    } else if (messages.length === 0) {
      setMessages([{ role: "assistant", content: "שלום! אני סוכן ה-AI שלך. במה אוכל לעזור לך היום?" }]);
    }

    const loadSuggestions = async () => {
      const res = await getAssistantContext();
      if (res.success && res.context) {
        const stats = res.context.stats;
        const newSuggestions: string[] = [];
        
        if (stats.totalContacts === 0) {
          newSuggestions.push("איך מעלים אנשי קשר מקובץ אקסל?");
        }
        if (stats.totalServices === 0) {
          newSuggestions.push("אני רוצה ליצור את דף הנחיתה הראשון שלי");
        }
        if (stats.activeAutomations === 0) {
          newSuggestions.push("איך אפשר לבנות אוטומציה לשליחת הודעות?");
        }
        if (stats.whatsappCampaigns === 0 && stats.totalContacts > 0) {
          newSuggestions.push("איך לשלוח קמפיין וואטסאפ לקהילה שלי?");
        }
        if (newSuggestions.length < 3) {
          newSuggestions.push("איך לחבר את יומן הפגישות שלי למערכת?");
        }
        if (newSuggestions.length < 4 && stats.totalContacts > 0) {
          newSuggestions.push("אני רוצה לשלוח ניוזלטר במייל");
        }

        setSuggestions(newSuggestions.slice(0, 4));
      }
    };
    loadSuggestions();
  }, [initialGreeting, messages.length]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = async (text: string = input) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: text };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    // Hide suggestions once the user starts chatting
    setSuggestions([]);
    setIsLoading(true);

    const res = await chatWithAssistant(updatedMessages, pathname);
    
    if (res.success && res.text) {
      setMessages([...updatedMessages, { role: "assistant", content: res.text }]);
    } else {
      setMessages([...updatedMessages, { role: "assistant", content: "אירעה שגיאה. " + (res.error || "") }]);
    }
    
    setIsLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] min-h-[500px] bg-white rounded-3xl shadow-xl border border-slate-200/60 overflow-hidden relative" dir="rtl">
      
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
        {messages.map((msg, idx) => (
          <div 
            key={idx} 
            className={cn(
              "flex items-start gap-4 max-w-[85%]",
              msg.role === "user" ? "mr-auto flex-row-reverse" : "ml-auto"
            )}
          >
            {/* Avatar */}
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm",
              msg.role === "user" ? "bg-indigo-100 text-indigo-600" : "bg-gradient-to-br from-indigo-600 to-purple-600 text-white"
            )}>
              {msg.role === "user" ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
            </div>

            {/* Bubble */}
            <div className={cn(
              "px-5 py-3.5 rounded-2xl text-[15px] leading-relaxed shadow-sm",
              msg.role === "user" 
                ? "bg-indigo-50 text-indigo-900 rounded-tr-sm border border-indigo-100/50" 
                : "bg-white text-slate-700 rounded-tl-sm border border-slate-100"
            )}>
              {msg.role === "assistant" ? (
                <div className="prose prose-sm md:prose-base prose-indigo max-w-none text-slate-700 prose-p:leading-relaxed prose-a:font-bold prose-a:text-indigo-600 hover:prose-a:text-indigo-500">
                  <ReactMarkdown
                    components={{
                      a: ({ node, ...props }) => {
                        // Check if it's a modal link
                        if (props.href?.startsWith("#modal:")) {
                          return (
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                const modalId = props.href?.replace("#modal:", "");
                                if (modalId === "create-service") {
                                  if (pathname !== "/dashboard/services") {
                                    window.location.href = "/dashboard/services?modal=create-service";
                                  } else {
                                    window.dispatchEvent(new CustomEvent("open-ai-modal", { detail: "create-service" }));
                                  }
                                } else {
                                  alert(`המודאל ${modalId} עדיין לא נתמך במערכת.`);
                                }
                              }}
                              className="inline-flex items-center gap-1 bg-indigo-50 px-2 py-0.5 rounded text-indigo-600 hover:bg-indigo-100 transition-colors"
                            >
                              {props.children}
                            </button>
                          );
                        }
                        return <Link href={props.href || "#"} {...props} className="text-indigo-600 underline hover:text-indigo-800 transition-colors" />
                      }
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>
              ) : (
                <p className="whitespace-pre-wrap">{msg.content}</p>
              )}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex items-start gap-4 max-w-[85%] ml-auto">
            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm bg-gradient-to-br from-indigo-600 to-purple-600 text-white">
              <Bot className="w-5 h-5" />
            </div>
            <div className="px-5 py-3.5 rounded-2xl rounded-tl-sm bg-white border border-slate-100 shadow-sm">
              <div className="flex items-center gap-1 text-slate-400">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "0ms" }}></span>
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "150ms" }}></span>
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "300ms" }}></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-slate-50/80 backdrop-blur-sm border-t border-slate-200/60">
        
        {/* Dynamic Suggested Prompts */}
        {suggestions.length > 0 && !isLoading && (
          <div className="flex flex-wrap gap-2 mb-3 max-w-4xl mx-auto">
            {suggestions.map((sug, i) => (
              <button
                key={i}
                onClick={() => handleSend(sug)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-indigo-200 text-indigo-700 text-[13px] rounded-full hover:bg-indigo-50 hover:border-indigo-300 transition-colors shadow-sm"
              >
                <Lightbulb className="w-3.5 h-3.5 text-indigo-500" />
                {sug}
              </button>
            ))}
          </div>
        )}

        <div className="relative max-w-4xl mx-auto flex items-end gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm focus-within:border-indigo-400 focus-within:ring-1 focus-within:ring-indigo-400 transition-all">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="איך אוכל לעזור לך היום?"
            className="flex-1 max-h-32 min-h-[44px] bg-transparent resize-none p-3 outline-none text-slate-700 placeholder:text-slate-400"
            rows={1}
            dir="auto"
          />
          <Button
            onClick={() => handleSend(input)}
            disabled={!input.trim() || isLoading}
            className="rounded-xl h-12 w-12 p-0 shrink-0 shadow-md"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 -ml-1 translate-x-0.5" />}
          </Button>
        </div>
        <div className="text-center mt-2">
          <span className="text-[11px] text-slate-400 font-medium">מופעל על ידי Gemini 3.1 Pro AI. המלצות הסוכן עשויות להשתנות.</span>
        </div>
      </div>
    </div>
  );
}
