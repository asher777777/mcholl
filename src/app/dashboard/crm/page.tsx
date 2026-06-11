"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  getContacts, 
  getCRMStats, 
  getCRMFilters, 
  handleBulkAction, 
  importContacts 
} from "@/features/crm/actions";
import { Contact } from "@/features/crm/types";
import { ContactModal } from "./ContactModal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { 
  Plus, 
  Download, 
  Upload, 
  RefreshCw, 
  Search, 
  Users, 
  CheckSquare, 
  Square, 
  ChevronRight, 
  ChevronLeft, 
  ArrowUpDown,
  Trash2,
  MessageCircle,
  Mail,
  Clock,
  MoreVertical
} from "lucide-react";
import * as XLSX from "xlsx";
import { MessageModal } from "./MessageModal";

const getInitials = (name: string, fm?: string) => {
  const first = name ? name.trim().charAt(0) : "";
  const last = fm ? fm.trim().charAt(0) : "";
  return `${first}${last}`.toUpperCase();
};

const getAvatarBg = (name: string) => {
  const colors = [
    "bg-red-500",
    "bg-pink-500",
    "bg-purple-500",
    "bg-indigo-500",
    "bg-blue-500",
    "bg-sky-500",
    "bg-teal-500",
    "bg-emerald-500",
    "bg-amber-500",
    "bg-orange-500",
  ];
  let sum = 0;
  for (let i = 0; i < name.length; i++) {
    sum += name.charCodeAt(i);
  }
  return colors[sum % colors.length];
};

export default function CRMDashboardPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [status, setStatus] = useState<"active" | "trashed">("active");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [leadSourceFilter, setLeadSourceFilter] = useState("");
  
  // Sorting
  const [orderby, setOrderby] = useState("createdAt");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  
  // Pagination
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  
  // Stats & Filters
  const [stats, setStats] = useState({ active: 0, trashed: 0 });
  const [filtersConfig, setFiltersConfig] = useState<{
    tags: string[];
    cities: string[];
    lead_sources: string[];
  }>({ tags: [], cities: [], lead_sources: [] });

  // Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState("");

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  // Message Modal States
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [messageTargetContacts, setMessageTargetContacts] = useState<Contact[]>([]);
  const [messageModalType, setMessageModalType] = useState<"whatsapp" | "email" | "reminder" | null>(null);

  const openMessageModal = (contacts: Contact[], type: "whatsapp" | "email" | "reminder") => {
    setMessageTargetContacts(contacts);
    setMessageModalType(type);
    setMessageModalOpen(true);
  };

  const [activeDropdownContactId, setActiveDropdownContactId] = useState<string | null>(null);

  // Loading States
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // reset to page 1 on search
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  // Load Data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [res, statsRes, filtersRes] = await Promise.all([
        getContacts({
          status,
          search: debouncedSearch,
          tag_filter: tagFilter,
          city_filter: cityFilter,
          lead_source_filter: leadSourceFilter,
          orderby,
          order,
          page,
          per_page: perPage
        }),
        getCRMStats(),
        getCRMFilters()
      ]);

      if ((res as any).error) {
        alert("שגיאה בטעינת אנשי קשר: " + (res as any).error);
      }

      setContacts(res.contacts);
      setTotal(res.total);
      setTotalPages(res.totalPages);
      setStats(statsRes);
      setFiltersConfig(filtersRes);
      setSelectedIds([]); // clear selection on load
    } catch (error) {
      console.error("Failed to load CRM data:", error);
    } finally {
      setLoading(false);
    }
  }, [status, debouncedSearch, tagFilter, cityFilter, leadSourceFilter, orderby, order, page, perPage]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Sorting Handler
  const handleSort = (field: string) => {
    if (orderby === field) {
      setOrder(order === "asc" ? "desc" : "asc");
    } else {
      setOrderby(field);
      setOrder("desc");
    }
    setPage(1);
  };

  // Selection Handlers
  const handleSelectAll = () => {
    if (selectedIds.length === contacts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(contacts.map(c => c.id || ""));
    }
  };

  const handleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(x => x !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // Bulk Action Handler
  const handleExecuteBulkAction = async () => {
    if (selectedIds.length === 0 || !bulkAction) return;

    if (bulkAction === "whatsapp" || bulkAction === "email") {
      const selectedContacts = contacts.filter(c => selectedIds.includes(c.id || ""));
      openMessageModal(selectedContacts, bulkAction);
      setBulkAction("");
      return;
    }
    
    let confirmMsg = "";
    let actionType: "trash" | "restore" | "delete_permanent";

    if (bulkAction === "trash") {
      confirmMsg = `האם אתה בטוח שברצונך להעביר ${selectedIds.length} אנשי קשר לסל האשפה?`;
      actionType = "trash";
    } else if (bulkAction === "restore") {
      confirmMsg = `האם אתה בטוח שברצונך לשחזר ${selectedIds.length} אנשי קשר?`;
      actionType = "restore";
    } else if (bulkAction === "delete_permanent") {
      confirmMsg = `אזהרה! האם אתה בטוח שברצונך למחוק לצמיתות ${selectedIds.length} אנשי קשר? פעולה זו אינה הפיכה!`;
      actionType = "delete_permanent";
    } else {
      return;
    }

    if (!window.confirm(confirmMsg)) return;

    setActionLoading(true);
    try {
      await handleBulkAction(selectedIds, actionType);
      alert("הפעולה הושלמה בהצלחה");
      setSelectedIds([]); // clear selection
      setBulkAction("");
      loadData();
    } catch (err) {
      console.error(err);
      alert("שגיאה בביצוע הפעולה");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteContact = async (id: string) => {
    const actionType = status === "active" ? "trash" : "delete_permanent";
    const confirmMsg = status === "active" 
      ? "האם אתה בטוח שברצונך להעביר איש קשר זה לסל האשפה?" 
      : "אזהרה! האם אתה בטוח שברצונך למחוק לצמיתות איש קשר זה? פעולה זו אינה הפיכה!";
    
    if (!window.confirm(confirmMsg)) return;

    setActionLoading(true);
    try {
      await handleBulkAction([id], actionType);
      alert("הפעולה הושלמה בהצלחה");
      loadData();
    } catch (err) {
      console.error(err);
      alert("שגיאה בביצוע הפעולה");
    } finally {
      setActionLoading(false);
    }
  };

  // Export to Excel
  const handleExportExcel = () => {
    if (contacts.length === 0) {
      alert("אין נתונים לייצוא");
      return;
    }

    // Map contacts to flat spreadsheet structure
    const exportData = contacts.map(c => ({
      "מזהה (ID)": c.id || "",
      "שם פרטי": c.conta_name,
      "שם משפחה": c.f_m || "",
      "טלפון נייד": c.conta_phone,
      "דוא\"ל": c.email || "",
      "מגדר": c.gender || "",
      "עיר": c.mh_crm_city || "",
      "רחוב": c.mh_crm_street || "",
      "תג 1": c.tg1 || "",
      "תג 2": c.tg2 || "",
      "תג 3": c.tg3 || "",
      "שם חברה": c.company_name || "",
      "תפקיד": c.job_title || "",
      "מקור הליד": c.lead_source || "",
      "טלפון עבודה": c.work_phone || "",
      "אתר": c.website || "",
      "תאריך לידה": c.birth_date || "",
      "הערות": c.notes || "",
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "אנשי קשר");
    XLSX.writeFile(wb, `crm_contacts_${status}_${Date.now()}.xlsx`);
  };

  // Helper to safely get value from spreadsheet row keys
  const getValue = (row: any, keys: string[]): string => {
    for (const key of keys) {
      if (row[key] !== undefined && row[key] !== null) {
        return String(row[key]).trim();
      }
    }
    return "";
  };

  // Helper to normalize phone numbers and restore leading zeros
  const sanitizePhone = (val: any): string => {
    let phone = String(val || "").trim();
    if (!phone) return "";
    // Remove dashes, spaces, and other separators
    phone = phone.replace(/[-\s]/g, "");
    // If it's a 9-digit Israeli mobile number (starts with 5/7), prepend '0'
    if (/^[57]\d{8}$/.test(phone)) {
      phone = "0" + phone;
    }
    // If it's an 8-digit Israeli landline number (starts with 2/3/4/8/9), prepend '0'
    if (/^[23489]\d{7}$/.test(phone)) {
      phone = "0" + phone;
    }
    return phone;
  };

  // Import from Excel/CSV
  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        setActionLoading(true);
        const data = evt.target?.result;
        const wb = XLSX.read(data, { type: "array" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawRows = XLSX.utils.sheet_to_json(ws, { raw: false }) as any[];

        if (rawRows.length === 0) {
          alert("קובץ ריק או לא תקין");
          return;
        }

        // Map spreadsheet columns to CRM field keys
        const mappedContacts: Partial<Contact>[] = rawRows.map(row => {
          return {
            id: getValue(row, ["מזהה (ID)", "מזהה", "ID", "id"]),
            conta_name: getValue(row, ["שם פרטי", "שם", "Name", "First Name"]),
            f_m: getValue(row, ["שם משפחה", "Last Name"]),
            conta_phone: sanitizePhone(getValue(row, ["טלפון נייד", "טלפון", "נייד", "Phone", "Mobile"])),
            email: getValue(row, ["דוא\"ל", "דואל", "דואר אלקטרוני", "אימייל", "Email"]),
            gender: getValue(row, ["מגדר", "Gender"]),
            mh_crm_city: getValue(row, ["עיר", "City"]),
            mh_crm_street: getValue(row, ["רחוב", "Street"]),
            tg1: getValue(row, ["תג 1", "תג1", "Tag 1"]),
            tg2: getValue(row, ["תג 2", "תג2", "Tag 2"]),
            tg3: getValue(row, ["תג 3", "תג3", "Tag 3"]),
            company_name: getValue(row, ["שם חברה", "חברה", "Company", "Company Name"]),
            job_title: getValue(row, ["תפקיד", "Job Title", "Role"]),
            lead_source: getValue(row, ["מקור הליד", "מקור", "Lead Source"]),
            work_phone: sanitizePhone(getValue(row, ["טלפון עבודה", "Work Phone"])),
            website: getValue(row, ["אתר", "Website"]),
            birth_date: getValue(row, ["תאריך לידה", "Birth Date", "Date of Birth"]),
            notes: getValue(row, ["הערות", "Notes"]),
          };
        });

        const importResult = await importContacts(mappedContacts);
        alert(`ייבוא אקסל הושלם בהצלחה!\nנוצרו: ${importResult.created}\nעודכנו: ${importResult.updated}\nדולגו: ${importResult.skipped}`);
        loadData();
      } catch (err: any) {
        console.error(err);
        alert("שגיאה בפענוח קובץ האקסל: " + err.message);
      } finally {
        setActionLoading(false);
        // Reset file input
        e.target.value = "";
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const openEditModal = (contact: Contact) => {
    setSelectedContact(contact);
    setModalOpen(true);
  };

  const openAddModal = () => {
    setSelectedContact(null);
    setModalOpen(true);
  };

  return (
    <div className="space-y-8 text-right" dir="rtl">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 flex items-center gap-2">
            <Users className="w-8 h-8 text-indigo-600" />
            מערכת ניהול לקוחות ואנשי קשר (CRM)
          </h2>
          <p className="text-slate-500 mt-2">
            נהל, סנן ותעד את נתוני חברי הקהילה של הארגון בצורה נוחה ומאובטחת.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap gap-2.5">
          <Button 
            onClick={openAddModal} 
            className="rounded-2xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 h-11 px-5"
          >
            <Plus className="w-4 h-4" />
            הוסף איש קשר
          </Button>

          <label className="flex items-center justify-center rounded-2xl border border-slate-200 hover:border-slate-300 bg-white shadow-sm hover:shadow-md cursor-pointer font-bold text-slate-700 text-sm h-11 px-5 transition-all gap-1.5">
            <Upload className="w-4 h-4 text-slate-500" />
            <span>ייבוא מאקסל</span>
            <input 
              type="file" 
              accept=".xlsx, .xls, .csv" 
              onChange={handleImportExcel} 
              className="hidden" 
              disabled={actionLoading}
            />
          </label>

          <Button 
            onClick={handleExportExcel} 
            variant="outline"
            className="rounded-2xl border-slate-200 hover:bg-slate-50 shadow-sm font-bold text-slate-700 flex items-center gap-1.5 h-11 px-5"
          >
            <Download className="w-4 h-4 text-slate-500" />
            ייצוא לאקסל
          </Button>

          <Button 
            onClick={loadData} 
            variant="outline"
            className="rounded-2xl border-slate-200 hover:bg-slate-50 shadow-sm p-0 w-11 h-11 flex items-center justify-center"
            title="טען מחדש"
          >
            <RefreshCw className={`w-4 h-4 text-slate-500 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Tabs Layout */}
      <div className="flex border-b border-slate-200 gap-4">
        <button
          onClick={() => { setStatus("active"); setPage(1); }}
          className={`flex items-center gap-2 py-3 px-4 font-black text-sm border-b-2 transition-all ${
            status === "active" 
              ? "border-indigo-600 text-indigo-600" 
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          פעילים
          <span className={`px-2 py-0.5 text-xs rounded-full font-bold ${status === "active" ? "bg-indigo-50 text-indigo-600" : "bg-slate-100 text-slate-600"}`}>
            {stats.active}
          </span>
        </button>

        <button
          onClick={() => { setStatus("trashed"); setPage(1); }}
          className={`flex items-center gap-2 py-3 px-4 font-black text-sm border-b-2 transition-all ${
            status === "trashed" 
              ? "border-indigo-600 text-indigo-600" 
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          סל אשפה
          <span className={`px-2 py-0.5 text-xs rounded-full font-bold ${status === "trashed" ? "bg-indigo-50 text-indigo-600" : "bg-slate-100 text-slate-600"}`}>
            {stats.trashed}
          </span>
        </button>
      </div>

      {/* Filters Area */}
      <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
        {/* Search */}
        <div className="lg:col-span-4 relative">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <Input 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="חפש לפי שם, טלפון, אימייל, עיר, תגים..."
            className="pr-10 rounded-xl"
          />
        </div>

        {/* Filters */}
        <div className="lg:col-span-5 flex flex-wrap md:flex-nowrap gap-3">
          {/* Tag Filter */}
          <select
            value={tagFilter}
            onChange={(e) => { setTagFilter(e.target.value); setPage(1); }}
            className="flex h-10 w-full rounded-xl border border-slate-200 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">כל התוויות</option>
            {filtersConfig.tags.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          {/* City Filter */}
          <select
            value={cityFilter}
            onChange={(e) => { setCityFilter(e.target.value); setPage(1); }}
            className="flex h-10 w-full rounded-xl border border-slate-200 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">כל הערים</option>
            {filtersConfig.cities.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Lead Source Filter */}
          <select
            value={leadSourceFilter}
            onChange={(e) => { setLeadSourceFilter(e.target.value); setPage(1); }}
            className="flex h-10 w-full rounded-xl border border-slate-200 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">כל המקורות</option>
            {filtersConfig.lead_sources.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Bulk Actions */}
        <div className="lg:col-span-3 flex gap-2">
          <select
            value={bulkAction}
            onChange={(e) => setBulkAction(e.target.value)}
            className="flex h-10 w-full rounded-xl border border-slate-200 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">פעולות על נבחרים...</option>
            {status === "active" ? (
              <option value="trash">העבר לסל אשפה</option>
            ) : (
              <>
                <option value="restore">שחזר</option>
                <option value="delete_permanent">מחק לצמיתות</option>
              </>
            )}
            <option value="whatsapp">שלח הודעת וואטסאפ מרוכזת</option>
            <option value="email">שלח מייל מרוכז</option>
          </select>
          <Button 
            onClick={handleExecuteBulkAction}
            disabled={!bulkAction || selectedIds.length === 0 || actionLoading}
            className="rounded-xl font-bold bg-slate-800 hover:bg-slate-900 text-white shrink-0"
          >
            ביצוע
          </Button>
        </div>
      </div>

      {/* Main WhatsApp-style List Container */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden relative">
        {loading && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
            <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
          </div>
        )}

        {/* List Header */}
        <div className="bg-slate-50/50 p-4 border-b border-slate-100 flex flex-wrap gap-4 items-center justify-between text-xs text-slate-500 font-bold px-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={handleSelectAll} 
              className="text-slate-400 hover:text-slate-600 transition-colors flex items-center gap-2"
              type="button"
            >
              {selectedIds.length === contacts.length && contacts.length > 0 ? (
                <CheckSquare className="w-5 h-5 text-indigo-600" />
              ) : (
                <Square className="w-5 h-5" />
              )}
              <span>בחר הכל ({selectedIds.length} מסומנים)</span>
            </button>

            <span className="text-slate-300">|</span>

            <div className="flex items-center gap-1.5 text-slate-500">
              <span>הצג:</span>
              <select
                value={perPage}
                onChange={(e) => {
                  setPerPage(Number(e.target.value));
                  setPage(1);
                }}
                className="bg-transparent border border-slate-200 rounded-lg px-2 py-1 text-slate-600 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
              >
                <option value={10}>10 שורות</option>
                <option value={25}>25 שורות</option>
                <option value={50}>50 שורות</option>
                <option value={100}>100 שורות</option>
                <option value={250}>250 שורות</option>
                <option value={0}>הצג הכל</option>
              </select>
            </div>
          </div>
          
          <div className="flex gap-4">
            <button 
              onClick={() => handleSort("conta_name")}
              className={`hover:text-slate-800 transition-colors flex items-center gap-1 ${orderby === 'conta_name' ? 'text-indigo-600' : ''}`}
              type="button"
            >
              מיין לפי שם
              <ArrowUpDown className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={() => handleSort("total_spent")}
              className={`hover:text-slate-800 transition-colors flex items-center gap-1 ${orderby === 'total_spent' ? 'text-indigo-600' : ''}`}
              type="button"
            >
              מיין לפי תרומות
              <ArrowUpDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* List Items */}
        <div className="divide-y divide-slate-100">
          {contacts.map((c) => (
            <div 
              key={c.id}
              onClick={() => openEditModal(c)}
              className="flex items-center justify-between p-4 px-6 hover:bg-slate-50/50 active:bg-slate-100/30 cursor-pointer transition-all duration-200 group select-none"
            >
              {/* Right Side (Checkbox + Avatar + Info) */}
              <div className="flex items-center gap-4 flex-1 min-w-0">
                {/* Checkbox (Stop propagation!) */}
                <div 
                  onClick={(e) => { e.stopPropagation(); handleSelectOne(c.id || ""); }}
                  className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer shrink-0"
                >
                  {selectedIds.includes(c.id || "") ? (
                    <CheckSquare className="w-5 h-5 text-indigo-600" />
                  ) : (
                    <Square className="w-5 h-5" />
                  )}
                </div>

                {/* Avatar */}
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-extrabold text-sm shrink-0 shadow-sm transition-transform duration-300 group-hover:scale-105 ${getAvatarBg(c.conta_name)}`}>
                  {getInitials(c.conta_name, c.f_m)}
                </div>

                {/* Info details */}
                <div className="flex-grow min-w-0 text-right space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-extrabold text-slate-800 text-sm md:text-base group-hover:text-indigo-600 transition-colors">
                      {c.conta_name} {c.f_m}
                    </h4>
                    {c.gender && (
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold border ${
                        c.gender === "זכר" ? "bg-blue-50/50 border-blue-100 text-blue-600" : "bg-pink-50/50 border-pink-100 text-pink-600"
                      }`}>
                        {c.gender}
                      </span>
                    )}

                    {/* Quick Actions - Desktop View */}
                    <div className="hidden md:flex items-center gap-1.5 mr-3 opacity-0 group-hover:opacity-100 transition-all duration-200" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => openMessageModal([c], "whatsapp")}
                        title="שלח הודעת וואטסאפ"
                        className="p-1 rounded-lg hover:bg-emerald-50 text-emerald-600 hover:text-emerald-700 transition-colors"
                        type="button"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                      </button>
                      {c.email && (
                        <button
                          onClick={() => openMessageModal([c], "email")}
                          title="שלח מייל"
                          className="p-1 rounded-lg hover:bg-indigo-50 text-indigo-600 hover:text-indigo-700 transition-colors"
                          type="button"
                        >
                          <Mail className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => openMessageModal([c], "reminder")}
                        title="כתוב תזכורת/פעילות"
                        className="p-1 rounded-lg hover:bg-amber-50 text-amber-600 hover:text-amber-700 transition-colors"
                        type="button"
                      >
                        <Clock className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteContact(c.id || "")}
                        title={status === "active" ? "העבר לאשפה" : "מחק לצמיתות"}
                        className="p-1 rounded-lg hover:bg-rose-50 text-rose-500 hover:text-rose-600 transition-colors"
                        type="button"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Quick Actions - Mobile View (Dropdown) */}
                    <div className="md:hidden block relative mr-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setActiveDropdownContactId(activeDropdownContactId === c.id ? null : c.id || null)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-all flex items-center justify-center"
                        type="button"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      {activeDropdownContactId === c.id && (
                        <>
                          <div 
                            className="fixed inset-0 z-10 bg-transparent" 
                            onClick={() => setActiveDropdownContactId(null)}
                          />
                          <div className="absolute left-0 mt-1 bg-white border border-slate-200 shadow-xl rounded-2xl py-1.5 z-20 min-w-[130px] divide-y divide-slate-50/80">
                            <button
                              onClick={() => { openMessageModal([c], "whatsapp"); setActiveDropdownContactId(null); }}
                              className="w-full text-right px-3 py-2 text-xs font-bold hover:bg-emerald-50 text-slate-700 flex items-center gap-2 transition-colors"
                              type="button"
                            >
                              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                              <span>וואטסאפ</span>
                            </button>
                            {c.email && (
                              <button
                                onClick={() => { openMessageModal([c], "email"); setActiveDropdownContactId(null); }}
                                className="w-full text-right px-3 py-2 text-xs font-bold hover:bg-indigo-50 text-slate-700 flex items-center gap-2 transition-colors"
                                type="button"
                              >
                                <Mail className="w-3.5 h-3.5 text-indigo-600" />
                                <span>שליחת מייל</span>
                              </button>
                            )}
                            <button
                              onClick={() => { openMessageModal([c], "reminder"); setActiveDropdownContactId(null); }}
                              className="w-full text-right px-3 py-2 text-xs font-bold hover:bg-amber-50 text-slate-700 flex items-center gap-2 transition-colors"
                              type="button"
                            >
                              <Clock className="w-3.5 h-3.5 text-amber-500" />
                              <span>תזכורת</span>
                            </button>
                            <button
                              onClick={() => { handleDeleteContact(c.id || ""); setActiveDropdownContactId(null); }}
                              className="w-full text-right px-3 py-2 text-xs font-bold hover:bg-rose-50 text-rose-600 flex items-center gap-2 transition-colors"
                              type="button"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                              <span>מחיקה</span>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-600" dir="ltr">{c.conta_phone}</span>
                    {c.mh_crm_city && (
                      <>
                        <span className="text-slate-300">•</span>
                        <span>{c.mh_crm_city}</span>
                      </>
                    )}
                    {c.company_name && (
                      <>
                        <span className="text-slate-300">•</span>
                        <span className="text-slate-400 italic">{c.company_name}</span>
                      </>
                    )}
                  </div>
                  {c.notes && (
                    <p className="text-slate-400 text-xs truncate max-w-sm md:max-w-md pt-0.5 leading-normal">
                      {c.notes}
                    </p>
                  )}
                </div>
              </div>

              {/* Left Side (Tags + Spent & Date) */}
              <div className="flex items-center gap-4 shrink-0 pl-1 text-left">
                {/* Tags (Hidden on mobile) */}
                <div className="hidden sm:flex items-center gap-1.5 flex-wrap max-w-xs justify-end">
                  {c.tg1 && <span className="px-2 py-0.5 bg-slate-50 text-slate-500 border border-slate-200/50 rounded-lg text-[9px] font-bold">{c.tg1}</span>}
                  {c.tg2 && <span className="px-2 py-0.5 bg-slate-50 text-slate-500 border border-slate-200/50 rounded-lg text-[9px] font-bold">{c.tg2}</span>}
                  {c.tg3 && <span className="px-2 py-0.5 bg-slate-50 text-slate-500 border border-slate-200/50 rounded-lg text-[9px] font-bold">{c.tg3}</span>}
                </div>

                {/* Spent & Time */}
                <div className="flex flex-col items-end gap-1 text-left justify-center">
                  <span className="text-[10px] text-slate-400 font-medium">
                    {c.updatedAt ? new Date(c.updatedAt).toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit" }) : "-"}
                  </span>
                  <span className="text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-full">
                    ₪{(c.total_spent || 0).toFixed(0)}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {contacts.length === 0 && !loading && (
            <div className="p-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2 bg-slate-50/20">
              <Users className="w-12 h-12 text-slate-300" />
              <span className="text-sm font-semibold">לא נמצאו אנשי קשר התואמים את הסינון.</span>
            </div>
          )}
        </div>

        {/* Pagination Section */}
        {(totalPages > 1 || perPage === 0) && (
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-4">
            <span className="text-xs text-slate-500 font-bold">
              {perPage > 0 ? (
                `מציג ${(page - 1) * perPage + 1} עד ${Math.min(page * perPage, total)} מתוך ${total} אנשי קשר`
              ) : (
                `מציג את כל ${total} אנשי קשר`
              )}
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                onClick={() => setPage(p => Math.max(p - 1, 1))}
                disabled={page === 1}
                className="p-2 h-9 w-9 flex items-center justify-center rounded-xl"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
              <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p: any) => (
                  <Button
                    key={p}
                    variant={p === page ? "primary" : "outline"}
                    onClick={() => setPage(p)}
                    className={`h-9 w-9 flex items-center justify-center rounded-xl p-0 font-bold ${
                      p === page ? "bg-indigo-600 text-white" : ""
                    }`}
                  >
                    {p}
                  </Button>
                ))}
              </div>
              <Button
                variant="outline"
                onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                disabled={page === totalPages}
                className="p-2 h-9 w-9 flex items-center justify-center rounded-xl"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Dialog */}
      <ContactModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        contact={selectedContact}
        onSuccess={loadData}
      />

      {/* Message Modal */}
      <MessageModal
        isOpen={messageModalOpen}
        onClose={() => setMessageModalOpen(false)}
        contacts={messageTargetContacts}
        type={messageModalType}
        onSuccess={loadData}
      />
    </div>
  );
}
