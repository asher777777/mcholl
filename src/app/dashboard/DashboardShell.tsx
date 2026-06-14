"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Server, Sparkles, CreditCard, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AgentSidebarChat } from "@/components/layout/AgentSidebarChat";
import { NavigationMenuPopup } from "@/components/layout/NavigationMenuPopup";

interface DashboardShellProps {
  children: React.ReactNode;
  modal: React.ReactNode;
  geminiActive: boolean;
  kesherActive: boolean;
  dbActive: boolean;
}

export function DashboardShell({
  children,
  modal,
  geminiActive,
  kesherActive,
  dbActive,
}: DashboardShellProps) {
  const pathname = usePathname();
  
  // If we are on the main dashboard page, we don't show the AgentSidebarChat
  // because the main page itself is now the Chat (in AI Mode).
  const isMainDashboard = pathname === "/dashboard";

  return (
    <div className="flex min-h-[100dvh] bg-slate-50/50 overflow-hidden" dir="rtl">
      
      {/* Navigation Popup Menu (Bottom Left) */}
      <NavigationMenuPopup />
      
      {/* Agent Sidebar (Right side / Start side in RTL) */}
      {!isMainDashboard && (
        <AgentSidebarChat className="hidden md:flex" />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 max-w-full h-[100dvh] overflow-y-auto">
        <div className="flex flex-col gap-6 p-4 md:p-8 w-full max-w-7xl mx-auto">
          
          {/* Header & Status Indicator Panel */}
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/60 pb-6">
            <div className="space-y-1 text-right">
              <h1 className="text-2xl md:text-3xl font-black tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                מרכז בקרה ותפעול
              </h1>
              <p className="text-muted-foreground text-sm">
                מערכת חכמה לניהול קהילות וניהול תוכן דינמי
              </p>
            </div>

            <div className="flex flex-wrap items-center self-start md:self-center gap-4">
              {/* Server & API Status Badges Container */}
              <div className="flex items-center gap-3 bg-white/70 backdrop-blur-md border border-slate-200/60 px-4 py-2 rounded-2xl shadow-sm text-xs font-semibold">
                {/* Database connection */}
                <div className="flex items-center gap-2" title={dbActive ? "בסיס הנתונים מחובר ותקין" : "שגיאה בחיבור לבסיס הנתונים"}>
                  <span className="relative flex h-2 w-2">
                    <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", dbActive ? 'bg-emerald-400' : 'bg-rose-400')}></span>
                    <span className={cn("relative inline-flex rounded-full h-2 w-2", dbActive ? 'bg-emerald-500' : 'bg-rose-500')}></span>
                  </span>
                  <span className="text-slate-600 flex items-center gap-1">
                    <Server className="w-3.5 h-3.5 text-slate-400" />
                    Database
                  </span>
                </div>

                <span className="w-px h-4 bg-slate-200" />

                {/* Gemini connection */}
                <div className="flex items-center gap-2" title={geminiActive ? "סוכן ה-AI (Gemini) מחובר ומפתח API מוגדר" : "מפתח API של Gemini AI לא הוגדר בהגדרות"}>
                  <span className="relative flex h-2 w-2">
                    {geminiActive && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
                    <span className={cn("relative inline-flex rounded-full h-2 w-2", geminiActive ? 'bg-emerald-500' : 'bg-amber-500')}></span>
                  </span>
                  <span className="text-slate-600 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-slate-400" />
                    Gemini AI
                  </span>
                </div>

                <span className="w-px h-4 bg-slate-200" />

                {/* Kesher connection */}
                <div className="flex items-center gap-2" title={kesherActive ? "מסוף קשר מוגדר ותקין" : "פרטי מסוף קשר חסרים (הכנסות לא יקלטו)"}>
                  <span className="relative flex h-2 w-2">
                    {kesherActive && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
                    <span className={cn("relative inline-flex rounded-full h-2 w-2", kesherActive ? 'bg-emerald-500' : 'bg-amber-500')}></span>
                  </span>
                  <span className="text-slate-600 flex items-center gap-1">
                    <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                    סליקה (קשר)
                  </span>
                </div>
              </div>

              {/* Settings Button */}
              <Link
                href="/dashboard/settings"
                className="p-2.5 bg-white border border-slate-200/60 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-100 rounded-xl shadow-sm transition-all duration-200 flex items-center justify-center shrink-0"
                title="הגדרות"
              >
                <Settings className="w-5 h-5" />
              </Link>
            </div>
          </header>

          {/* Main View */}
          <main className="w-full transition-all duration-300">
            <AnimatePresence mode="wait">
              <motion.div
                key="overview-content"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </main>

        </div>
      </div>

      {modal}
      {/* AIAssistant floating bubble is handled inside DashboardViewManager on the main page now, 
          and AgentSidebarChat handles it on other pages. */}
    </div>
  );
}
