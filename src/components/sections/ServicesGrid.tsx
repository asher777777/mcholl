"use client";

import { BrandIcon } from "@/components/ui/BrandIcon";
import * as LucideIcons from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import dynamic from "next/dynamic";
import Image from "next/image";
import { ServiceItem } from "@/features/home/actions";

import { useState } from "react";
import { AITextHelper } from "@/components/ui/AITextHelper";
import { RichTextEditor } from "@/components/ui/RichTextEditor";

const ServicesGridEditor = dynamic(() => import("./ServicesGridEditor").then(m => m.ServicesGridEditor), { ssr: false });

interface ServicesGridProps {
  id?: string;
  title?: string;
  description?: string;
  layout?: "grid" | "carousel" | "image-card" | "hover-card";
  effect?: "none" | "zoom" | "lift" | "glow";
  columns?: number;
  items?: ServiceItem[];
  isEditing?: boolean;
  onUpdate?: (newItems: ServiceItem[]) => void;
  onHeaderUpdate?: (field: string, value: string) => void;
}

const EditableText = ({ 
  tag: Tag = "p", 
  value, 
  onChange, 
  isEditing, 
  className = "",
  richText = false
}: any) => {
  const [isFocused, setIsFocused] = useState(false);
  
  if (!isEditing) {
    if (richText) return <div className={cn("rich-content", className)} dangerouslySetInnerHTML={{ __html: value || "" }} />;
    return <Tag className={className}>{value}</Tag>;
  }

  if (richText) {
    return (
      <div className={cn("relative group/text rounded-xl outline-none hover:bg-slate-50 transition-colors cursor-text min-h-[50px] focus-within:ring-2 focus-within:ring-primary focus-within:bg-white", className)}>
        <RichTextEditor value={value} onChange={onChange} />
        <AITextHelper className="absolute -top-3 -right-3" value={value} onChange={(val) => onChange(val)} />
      </div>
    );
  }

  return (
    <div className={cn("relative group/text w-full max-w-full", isFocused ? "z-20" : "")}>
      <Tag
        contentEditable
        suppressContentEditableWarning
        onFocus={() => setIsFocused(true)}
        onBlur={(e: any) => {
          setIsFocused(false);
          onChange(e.currentTarget.textContent || "");
        }}
        className={cn(
          "w-full outline-none hover:bg-slate-100 focus:bg-slate-100 focus:ring-2 focus:ring-primary/50 transition-all cursor-text rounded break-words p-1 -mx-1 block",
          className
        )}
      >
        {value}
      </Tag>
      <div className="absolute top-0 right-0 h-full flex items-center pr-2 -mr-12 opacity-0 group-hover/text:opacity-100 transition-opacity pointer-events-none">
        <LucideIcons.Edit2 className="w-4 h-4 text-slate-400" />
      </div>
      <AITextHelper className="absolute -top-3 -right-3" value={value} onChange={(val) => onChange(val)} />
    </div>
  );
};

// Helper to get Icon component safely
const getIcon = (iconName: string) => {
  const Icon = (LucideIcons as any)[iconName];
  return Icon || LucideIcons.FileQuestion;
};

export const ServicesGrid = ({ id, title, description, layout = "grid", columns, effect = "none", items = [], isEditing, onUpdate, onHeaderUpdate }: ServicesGridProps) => {
  const visibleItems = isEditing ? items : items.filter(item => item.isVisible !== false);

  const renderAdminPanel = () => {
    if (!isEditing || !onUpdate) return null;

    return (
      <ServicesGridEditor
        items={items}
        onUpdate={onUpdate}
      />
    );
  };

  const renderLayout = () => {
    const getGridColsClass = (cols?: number) => {
      switch(cols) {
        case 1: return "lg:grid-cols-1";
        case 2: return "lg:grid-cols-2";
        case 3: return "lg:grid-cols-3";
        case 4: return "lg:grid-cols-4";
        case 5: return "lg:grid-cols-5";
        case 6: return "lg:grid-cols-6";
        default: return "lg:grid-cols-4";
      }
    };

    const getEffectClass = () => {
      switch (effect) {
        case "zoom": return "hover:scale-105 transition-transform duration-500";
        case "lift": return "hover:-translate-y-2 hover:shadow-2xl transition-all duration-500";
        case "glow": return "hover:shadow-[0_0_30px_rgba(79,70,229,0.4)] transition-shadow duration-500 border border-transparent hover:border-indigo-500/30";
        default: return "transition-all duration-500";
      }
    };

    // ---- Layout: Grid or Carousel ----
    if (layout === "grid" || layout === "carousel") {
      return (
        <div className={cn(
          "w-full",
          layout === "grid" && `grid grid-cols-1 sm:grid-cols-2 ${getGridColsClass(columns)} gap-6`,
          layout === "carousel" && "flex overflow-x-auto pb-8 gap-6 no-scrollbar snap-x snap-mandatory"
        )}>
          {visibleItems.map((service, index) => (
            <Link
              key={index}
              href={service.url || "#"}
              className={cn(
                "bg-card border rounded-3xl group cursor-pointer overflow-hidden",
                layout === "grid" && "p-8 flex flex-col items-center text-center h-full min-w-0",
                layout === "carousel" && "min-w-[280px] p-8 flex flex-col items-center text-center snap-center",
                getEffectClass()
              )}
            >
              <div className={cn(
                "p-4 rounded-2xl transition-colors duration-500",
                "bg-primary/5 group-hover:bg-primary"
              )}>
                <BrandIcon icon={getIcon(service.icon)} size={40} iconClassName="group-hover:text-white" />
              </div>
              
              <div className="w-full min-w-0 mt-6">
                <h3 className="text-xl font-bold text-primary group-hover:text-primary transition-colors break-words w-full">{service.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed mt-2 break-words w-full">{service.description}</p>
              </div>

              <div className="pt-4">
                <span className="text-xs font-bold text-secondary uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-2 group-hover:translate-y-0 inline-block">לפרטים נוספים +</span>
              </div>
            </Link>
          ))}
        </div>
      );
    }

    // ---- Layout: Image Card ----
    if (layout === "image-card") {
      return (
        <div className={cn("w-full grid grid-cols-1 sm:grid-cols-2 gap-8", getGridColsClass(columns))}>
          {visibleItems.map((service, index) => {
            const Icon = getIcon(service.icon);
            return (
              <Link key={index} href={service.url || "#"} className={cn("group flex flex-col bg-white rounded-[2rem] overflow-hidden shadow-sm border border-slate-100", getEffectClass())}>
                <div className="w-full aspect-[4/3] bg-slate-100 relative overflow-hidden flex items-center justify-center">
                  {service.imageSrc ? (
                    <Image src={service.imageSrc} alt={service.title} fill className="object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy" />
                  ) : (
                    <div className="w-full h-full bg-indigo-50/50 flex items-center justify-center group-hover:bg-indigo-100/50 transition-colors">
                      <Icon className="w-16 h-16 text-indigo-200 group-hover:text-indigo-300 transition-colors" />
                    </div>
                  )}
                </div>
                <div className="p-8 flex flex-col flex-1">
                  <h3 className="text-2xl font-bold text-slate-900 mb-3">{service.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed mb-6 flex-1">{service.description}</p>
                  <div className="flex items-center text-primary font-bold group-hover:translate-x-[-8px] transition-transform">
                    למעבר לעמוד <LucideIcons.ArrowLeft className="w-5 h-5 mr-2" />
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      );
    }

    // ---- Layout: Hover Card ----
    if (layout === "hover-card") {
      return (
        <div className={cn("w-full grid grid-cols-1 sm:grid-cols-2 gap-6", getGridColsClass(columns))}>
          {visibleItems.map((service, index) => {
            const Icon = getIcon(service.icon);
            return (
              <Link key={index} href={service.url || "#"} className={cn("group relative bg-slate-900 rounded-[2rem] overflow-hidden aspect-square flex flex-col justify-end p-8", getEffectClass())}>
                {/* Background Image */}
                <div className="absolute inset-0 z-0">
                  {service.imageSrc ? (
                    <Image src={service.imageSrc} alt="" fill className="object-cover opacity-50 group-hover:opacity-30 group-hover:scale-110 transition-all duration-700" loading="lazy" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-indigo-900 to-slate-900 group-hover:scale-110 transition-transform duration-700" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                </div>
                
                <div className="relative z-10 flex flex-col h-full justify-end">
                  {!service.imageSrc && (
                    <Icon className="w-10 h-10 text-white/50 mb-auto" />
                  )}
                  <h3 className="text-3xl font-bold text-white mb-2 transform translate-y-8 group-hover:translate-y-0 transition-transform duration-500">{service.title}</h3>
                  
                  <div className="h-0 opacity-0 group-hover:h-auto group-hover:opacity-100 group-hover:mt-4 transition-all duration-500 overflow-hidden">
                    <p className="text-white/80 text-sm leading-relaxed mb-6">{service.description}</p>
                    <span className="inline-flex items-center text-white font-bold bg-white/20 px-4 py-2 rounded-full backdrop-blur-sm hover:bg-white hover:text-slate-900 transition-colors">
                      פרטים נוספים <LucideIcons.ArrowLeft className="w-4 h-4 mr-2" />
                    </span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      );
    }

    return null;
  };

  return (
    <section id={id} className="py-24 px-6 bg-background relative overflow-hidden">
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16 space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <EditableText tag="h2" value={title || "שירותי דת וקהילה"} onChange={(v: string) => onHeaderUpdate?.("title", v)} isEditing={isEditing} className="text-3xl md:text-5xl font-bold text-primary" />
          <EditableText tag="p" value={description || ""} onChange={(v: string) => onHeaderUpdate?.("description", v)} isEditing={isEditing} className="text-muted-foreground text-lg max-w-2xl mx-auto" />
        </div>

        {renderAdminPanel()}
        {renderLayout()}
      </div>
    </section>
  );
};
