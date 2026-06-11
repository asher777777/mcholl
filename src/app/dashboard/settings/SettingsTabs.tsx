"use client";

import { useState } from "react";
import { KesherSettingsForm } from "@/features/kesher/KesherSettingsForm";
import { AiSettingsForm } from "@/features/ai/AiSettingsForm";
import { WhatsAppSettingsForm } from "@/features/whatsapp/components/WhatsAppSettingsForm";
import { GoogleSettingsCard } from "./GoogleSettingsCard";
import { CreditCard, Bot, MessageCircle, CalendarDays } from "lucide-react";

interface SettingsTabsProps {
  isGoogleConnected: boolean;
}

type TabType = "kesher" | "google" | "whatsapp" | "ai";

export function SettingsTabs({ isGoogleConnected }: SettingsTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>("kesher");

  const tabs = [
    { id: "kesher" as const, label: "סליקה (קשר)", icon: CreditCard, colorClass: "text-blue-400" },
    { id: "google" as const, label: "יומן Google", icon: CalendarDays, colorClass: "text-indigo-400" },
    { id: "whatsapp" as const, label: "WhatsApp", icon: MessageCircle, colorClass: "text-emerald-400" },
    { id: "ai" as const, label: "Gemini AI", icon: Bot, colorClass: "text-amber-400" },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Tabs Header */}
      <div className="flex bg-[#111] p-1 rounded-xl border border-white/5 w-fit">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === tab.id 
                ? "bg-white/10 text-white shadow-sm" 
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? tab.colorClass : ""}`} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="max-w-3xl">
        {activeTab === "kesher" && (
          <div className="bg-[#111] border border-white/5 rounded-2xl p-6 shadow-xl relative overflow-hidden group animate-in fade-in slide-in-from-bottom-2">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
            <div className="flex items-center gap-3 mb-6 relative">
              <div className="p-2.5 bg-blue-500/10 rounded-lg text-blue-400">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">הגדרות סליקה (קשר)</h2>
                <p className="text-sm text-gray-400">חיבור למערכת קשר לטובת קבלות וסליקה.</p>
              </div>
            </div>
            <KesherSettingsForm />
          </div>
        )}

        {activeTab === "google" && (
          <div className="bg-[#111] border border-white/5 rounded-2xl p-6 shadow-xl relative overflow-hidden group animate-in fade-in slide-in-from-bottom-2">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
            <div className="flex items-center gap-3 mb-6 relative">
              <div className="p-2.5 bg-indigo-500/10 rounded-lg text-indigo-400">
                <CalendarDays className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">סנכרון יומן Google</h2>
                <p className="text-sm text-gray-400">חיבור לחשבון גוגל לניהול פגישות ומשימות.</p>
              </div>
            </div>
            <GoogleSettingsCard isConnected={isGoogleConnected} />
          </div>
        )}

        {activeTab === "whatsapp" && (
          <div className="bg-[#111] border border-white/5 rounded-2xl p-6 shadow-xl relative overflow-hidden group animate-in fade-in slide-in-from-bottom-2">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
            <div className="flex items-center gap-3 mb-6 relative">
              <div className="p-2.5 bg-emerald-500/10 rounded-lg text-emerald-400">
                <MessageCircle className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">הגדרות WhatsApp</h2>
                <p className="text-sm text-gray-400">הגדרת חיבור Green API לשליחת הודעות אוטומטיות.</p>
              </div>
            </div>
            <WhatsAppSettingsForm />
          </div>
        )}

        {activeTab === "ai" && (
          <div className="bg-[#111] border border-white/5 rounded-2xl p-6 shadow-xl relative overflow-hidden group animate-in fade-in slide-in-from-bottom-2">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
            <div className="flex items-center gap-3 mb-6 relative">
              <div className="p-2.5 bg-amber-500/10 rounded-lg text-amber-400">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">הגדרות Gemini AI</h2>
                <p className="text-sm text-gray-400">חיבור המערכת למנוע יצירת התוכן החכם של Google.</p>
              </div>
            </div>
            <AiSettingsForm />
          </div>
        )}
      </div>
    </div>
  );
}
