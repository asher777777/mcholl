"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ExternalLink, Edit, Layout, Sparkles, Trash2, List as ListIcon, Grid, Eye, MousePointerClick, ShoppingCart, Loader2, FileText } from "lucide-react";
import { deleteServicePage } from "@/features/services/actions";

interface ServiceListClientProps {
  initialServices: any[];
}

export function ServiceListClient({ initialServices }: ServiceListClientProps) {
  const [services, setServices] = useState(initialServices);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleDelete = async (slug: string, type: string) => {
    if (!confirm("האם אתה בטוח שברצונך למחוק עמוד זה? פעולה זו אינה הפיכה.")) return;
    
    setIsDeleting(slug);
    try {
      await deleteServicePage(slug, type);
      setServices(prev => prev.filter(s => s.slug !== slug));
    } catch (e: any) {
      alert("שגיאה במחיקת העמוד: " + e.message);
    } finally {
      setIsDeleting(null);
    }
  };

  if (services.length === 0) {
    return (
      <div className="col-span-full py-16 mt-8 text-center border-2 border-dashed border-slate-200 rounded-[2.5rem] text-muted-foreground bg-white">
        <Layout className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        עדיין לא נוצרו עמודי שירות או דפי נחיתה. השתמש במחולל ה-AI שלמעלה כדי להתחיל בקלות!
      </div>
    );
  }

  return (
    <div className="mt-8">
      {/* View Toggle */}
      <div className="flex justify-end mb-4">
        <div className="bg-white border rounded-xl flex items-center p-1 shadow-sm">
          <button 
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
            title="תצוגת גריד"
          >
            <Grid className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
            title="תצוגת רשימה"
          >
            <ListIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, index) => {
            const isLanding = service.type === "landing";
            const isShabbat = service.type === "shabbat";
            const isPost = service.type === "post";
            const pagePath = isShabbat 
              ? "/shabbat" 
              : (isLanding 
                ? `/landing/${service.slug}` 
                : (isPost ? `/post/${service.slug}` : `/service/${service.slug}`));
            
            return (
              <div key={`${service.slug}-${index}`} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all duration-300 flex flex-col justify-between group">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 ${
                      isShabbat ? "bg-amber-50 text-amber-600 border border-amber-100" : (isLanding 
                        ? "bg-purple-50 text-purple-600 border border-purple-100" 
                        : (isPost ? "bg-orange-50 text-orange-600 border border-orange-100" : "bg-blue-50 text-blue-600 border border-blue-100"))
                    }`}>
                      {isShabbat ? (
                        <><Sparkles className="w-3 h-3" />עמוד מיוחד</>
                      ) : isLanding ? (
                        <><Sparkles className="w-3 h-3" />דף נחיתה</>
                      ) : isPost ? (
                        <><FileText className="w-3 h-3" />פוסט / תוכן</>
                      ) : (
                        <><Layout className="w-3 h-3" />עמוד שירות</>
                      )}
                    </span>
                    <button 
                      onClick={() => handleDelete(service.slug, service.type)}
                      disabled={isDeleting === service.slug}
                      className="text-slate-300 hover:text-red-500 transition-colors p-1"
                      title="מחק עמוד"
                      >
                        {isDeleting === service.slug ? <Loader2 className="w-4 h-4 animate-spin text-red-500" /> : <Trash2 className="w-4 h-4" />}
                      </button>
                  </div>

                  <h3 className="font-bold text-lg text-slate-800 group-hover:text-indigo-600 transition-colors mb-2">
                    {service.hero?.title || service.title || service.slug}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {service.hero?.description || service.summary || "ללא תיאור מוגדר לעמוד."}
                  </p>
                </div>
                
                <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                  <span className="text-[11px] font-mono text-slate-400 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-xl truncate max-w-[140px]" title={pagePath}>
                    {pagePath}
                  </span>
                  <div className="flex gap-2">
                    <Link href={pagePath} target="_blank">
                      <Button variant="outline" size="sm" className="h-9 w-9 p-0 rounded-xl" title="צפה בעמוד הציבורי">
                        <ExternalLink className="w-4 h-4 text-slate-500" />
                      </Button>
                    </Link>
                    <Link href={pagePath}>
                      <Button variant="primary" size="sm" className="h-9 w-9 p-0 rounded-xl bg-indigo-600 hover:bg-indigo-700" title="ערוך תוכן בדף">
                        <Edit className="w-4 h-4 text-white" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="bg-slate-50 text-slate-500 font-medium">
                <tr>
                  <th className="px-6 py-4">שם העמוד</th>
                  <th className="px-6 py-4">סוג</th>
                  <th className="px-6 py-4">נתיב</th>
                  <th className="px-6 py-4 text-center">צפיות</th>
                  <th className="px-6 py-4 text-center">לידים</th>
                  <th className="px-6 py-4 text-center">רכישות</th>
                  <th className="px-6 py-4 text-center">פעולות</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {services.map((service, index) => {
                  const isLanding = service.type === "landing";
                  const isShabbat = service.type === "shabbat";
                  const isPost = service.type === "post";
                  const pagePath = isShabbat 
                    ? "/shabbat" 
                    : (isLanding 
                      ? `/landing/${service.slug}` 
                      : (isPost ? `/post/${service.slug}` : `/service/${service.slug}`));
                  
                  return (
                    <tr key={`${service.slug}-${index}`} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4 font-bold text-slate-800">
                        {service.hero?.title || service.title || service.slug}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                          isShabbat ? "bg-amber-50 text-amber-600" : (isLanding ? "bg-purple-50 text-purple-600" : (isPost ? "bg-orange-50 text-orange-600" : "bg-blue-50 text-blue-600"))
                        }`}>
                          {isShabbat ? "עמוד מיוחד" : (isLanding ? "דף נחיתה" : (isPost ? "פוסט / תוכן" : "עמוד שירות"))}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-400 font-mono text-[11px] truncate max-w-[120px]">
                        {pagePath}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-1.5 text-slate-600">
                          <Eye className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-semibold">{service.views || 0}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-1.5 text-slate-600">
                          <MousePointerClick className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-semibold">{service.leads || 0}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-1.5 text-slate-600">
                          <ShoppingCart className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-semibold">{service.purchases || 0}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <Link href={pagePath} target="_blank">
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-lg" title="צפה">
                              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                            </Button>
                          </Link>
                          <Link href={pagePath}>
                            <Button variant="primary" size="sm" className="h-8 w-8 p-0 rounded-lg bg-indigo-600 hover:bg-indigo-700" title="ערוך">
                              <Edit className="w-3.5 h-3.5 text-white" />
                            </Button>
                          </Link>
                          <button 
                            onClick={() => handleDelete(service.slug, service.type)}
                            disabled={isDeleting === service.slug}
                            className="h-8 w-8 rounded-lg flex items-center justify-center border border-red-100 text-red-500 hover:bg-red-50 hover:border-red-200 transition-colors disabled:opacity-50"
                            title="מחק עמוד"
                          >
                            {isDeleting === service.slug ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
