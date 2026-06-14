"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, Users, Sparkles, Home, MessageSquare, 
  FileText, Mail, Network, Menu, X, Calendar
} from "lucide-react";

export function NavigationMenuPopup() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const navGroups = [
    {
      title: "ראשי",
      links: [
        { name: "לוח בקרה", href: "/dashboard", icon: LayoutDashboard },
        { name: "יומן מסונכרן", href: "/dashboard/calendar", icon: Calendar },
        { name: "ניהול CRM", href: "/dashboard/crm", icon: Users },
        { name: "קבלות ידניות", href: "/dashboard/receipts", icon: FileText },
        { name: "יצירת תוכן", href: "/dashboard/services", icon: Sparkles },
      ]
    },
    {
      title: "שיווק",
      links: [
        { name: "וואטסאפ", href: "/dashboard/whatsapp", icon: MessageSquare },
        { name: "מייל", href: "/dashboard/emails", icon: Mail },
        { name: "אוטומציות", href: "/dashboard/automations", icon: Network },
      ]
    }
  ];

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 left-6 z-50 p-4 bg-slate-900 text-white rounded-full shadow-2xl hover:bg-slate-800 transition-all flex items-center justify-center"
        title="תפריט ניווט"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Popup Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-slate-900/20 z-40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20, x: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20, x: -20 }}
              transition={{ duration: 0.2 }}
              className="fixed bottom-24 left-6 z-50 w-64 bg-white rounded-3xl shadow-xl border border-slate-200/60 overflow-hidden flex flex-col"
              dir="rtl"
            >
              <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
                <Menu className="w-5 h-5 text-slate-500" />
                <h3 className="font-bold text-slate-800">ניווט במערכת</h3>
              </div>
              
              <div className="overflow-y-auto max-h-[50vh] p-2 space-y-4">
                {navGroups.map((group, idx) => (
                  <div key={idx}>
                    <h4 className="text-[10px] font-bold text-slate-400 mb-1 px-3">
                      {group.title}
                    </h4>
                    <div className="space-y-0.5">
                      {group.links.map(link => {
                        const isActive = pathname === link.href;
                        return (
                          <Link
                            key={link.name}
                            href={link.href}
                            onClick={() => setIsOpen(false)}
                            className={cn(
                              "flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors",
                              isActive
                                ? "bg-indigo-50 text-indigo-700"
                                : "text-slate-600 hover:bg-slate-50"
                            )}
                          >
                            <link.icon className={cn("w-4 h-4", isActive ? "text-indigo-600" : "text-slate-400")} />
                            {link.name}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-2 border-t border-slate-100 bg-slate-50">
                <Link
                  href="/"
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-slate-500 hover:bg-slate-100 transition-colors"
                >
                  <Home className="w-4 h-4 text-slate-400" />
                  חזרה לאתר הראשי
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
