"use server";

import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { auth } from "@/lib/auth";
import { Contact } from "./types";
import { revalidatePath } from "next/cache";

// Helper to get authenticated user ID
async function getUserId(): Promise<string> {
  try {
    const session = await auth();
    if (session?.user?.id) {
      return session.user.id;
    }
  } catch (error) {
    // Ignore and fallback
  }
  // Fallback to mock user ID "1" from LoginModal
  return "1";
}

// 1. Get filtered, sorted, paginated contacts
export async function getContacts(params: {
  status?: "active" | "trashed";
  search?: string;
  tag_filter?: string;
  city_filter?: string;
  lead_source_filter?: string;
  orderby?: string;
  order?: "asc" | "desc";
  page?: number;
  per_page?: number;
}) {
  try {
    const ownerId = await getUserId();
    const status = params.status || "active";
    const search = params.search ? params.search.trim().toLowerCase() : "";
    const tagFilter = params.tag_filter || "";
    const cityFilter = params.city_filter || "";
    const leadSourceFilter = params.lead_source_filter || "";
    const orderby = params.orderby || "createdAt";
    const order = params.order || "desc";
    const page = params.page || 1;
    const perPage = params.per_page || 10;

    // Fetch all contacts for this owner and status from Firestore
    const contactsRef = adminDb.collection("contacts");
    const snapshot = await contactsRef
      .where("ownerId", "==", ownerId)
      .where("status", "==", status)
      .get();

    let contacts: Contact[] = snapshot.docs.map((doc: any) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
      } as Contact;
    });

    try {
      require("fs").appendFileSync("debug-crm.log", JSON.stringify({
        time: new Date().toISOString(),
        ownerId,
        status,
        snapshotSize: snapshot.size,
        contactsCount: contacts.length,
      }) + "\n");
    } catch (e) {}

    // In-memory filtering
    if (search) {
      contacts = contacts.filter((c) => {
        const matchesField = (val?: string) => val?.toLowerCase().includes(search);
        
        // Search core contact info
        if (matchesField(c.conta_name)) return true;
        if (matchesField(c.f_m)) return true;
        if (matchesField(c.conta_phone)) return true;
        if (matchesField(c.email)) return true;
        if (matchesField(c.mh_crm_city)) return true;
        if (matchesField(c.mh_crm_street)) return true;
        if (matchesField(c.tg1)) return true;
        if (matchesField(c.tg2)) return true;
        if (matchesField(c.tg3)) return true;
        if (matchesField(c.company_name)) return true;
        if (matchesField(c.job_title)) return true;
        if (matchesField(c.lead_source)) return true;
        if (matchesField(c.notes)) return true;

        // Search events
        if (c.events && c.events.some((e) => matchesField(e.title) || matchesField(e.text))) {
          return true;
        }

        // Search form submissions
        if (c.form_submissions && c.form_submissions.some((fs) => matchesField(fs.name) || matchesField(fs.page))) {
          return true;
        }

        return false;
      });
    }

    if (tagFilter) {
      contacts = contacts.filter(
        (c) => c.tg1 === tagFilter || c.tg2 === tagFilter || c.tg3 === tagFilter
      );
    }

    if (cityFilter) {
      contacts = contacts.filter((c) => c.mh_crm_city === cityFilter);
    }

    if (leadSourceFilter) {
      contacts = contacts.filter((c) => c.lead_source === leadSourceFilter);
    }

    // In-memory sorting
    contacts.sort((a: any, b: any) => {
      let valA = a[orderby];
      let valB = b[orderby];

      // Handle missing values
      if (valA === undefined || valA === null) valA = "";
      if (valB === undefined || valB === null) valB = "";

      // Case insensitive string comparison
      if (typeof valA === "string" && typeof valB === "string") {
        return order === "asc"
          ? valA.localeCompare(valB, "he")
          : valB.localeCompare(valA, "he");
      }

      // Numeric comparison
      if (typeof valA === "number" && typeof valB === "number") {
        return order === "asc" ? valA - valB : valB - valA;
      }

      // Default string fallback
      return order === "asc"
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });

    const totalContacts = contacts.length;
    
    // Pagination
    let paginatedContacts = contacts;
    if (perPage > 0) {
      const offset = (page - 1) * perPage;
      paginatedContacts = contacts.slice(offset, offset + perPage);
    }

    return {
      contacts: JSON.parse(JSON.stringify(paginatedContacts)),
      total: totalContacts,
      totalPages: perPage > 0 ? Math.ceil(totalContacts / perPage) : 1,
    };
  } catch (error: any) {
    console.error("Error in getContacts server action:", error);
    return {
      contacts: [],
      total: 0,
      totalPages: 1,
      error: error.message || String(error)
    };
  }
}

// 2. Get a single contact
export async function getContactById(id: string) {
  try {
    const ownerId = await getUserId();
    const docRef = adminDb.collection("contacts").doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      throw new Error("איש הקשר לא נמצא");
    }

    const data = docSnap.data();
    if (data?.ownerId !== ownerId) {
      throw new Error("אין הרשאה לצפות באיש קשר זה");
    }

    const contact = {
      id: docSnap.id,
      ...data,
    };
    return JSON.parse(JSON.stringify(contact)) as Contact;
  } catch (error) {
    console.error("Error in getContactById:", error);
    throw error;
  }
}

// 3. Create contact
export async function createContact(contactData: Partial<Contact>) {
  try {
    const ownerId = await getUserId();
    
    if (!contactData.conta_name || !contactData.conta_phone) {
      throw new Error("שם וטלפון הם שדות חובה");
    }

    const { checkFeatureLimit } = await import("@/features/users/actions");
    const limitCheck = await checkFeatureLimit(ownerId, "contacts");
    if (!limitCheck.allowed) {
      throw new Error("LIMIT_REACHED:" + ('message' in limitCheck ? limitCheck.message : ""));
    }

    const newContact: Omit<Contact, "id"> = {
      ownerId,
      status: contactData.status || "active",
      conta_name: contactData.conta_name,
      f_m: contactData.f_m || "",
      conta_phone: contactData.conta_phone,
      email: contactData.email || "",
      gender: contactData.gender || "",
      mh_crm_city: contactData.mh_crm_city || "",
      mh_crm_street: contactData.mh_crm_street || "",
      tg1: contactData.tg1 || "",
      tg2: contactData.tg2 || "",
      tg3: contactData.tg3 || "",
      company_name: contactData.company_name || "",
      job_title: contactData.job_title || "",
      lead_source: contactData.lead_source || "",
      work_phone: contactData.work_phone || "",
      website: contactData.website || "",
      birth_date: contactData.birth_date || "",
      notes: contactData.notes || "",
      events: contactData.events || [],
      form_submissions: contactData.form_submissions || [],
      child_first_name: contactData.child_first_name || "",
      child_last_name: contactData.child_last_name || "",
      child_grade: contactData.child_grade || "",
      child_id_number: contactData.child_id_number || "",
      allergies_has: contactData.allergies_has || "",
      allergies_details: contactData.allergies_details || "",
      father_name: contactData.father_name || "",
      mother_name: contactData.mother_name || "",
      father_phone: contactData.father_phone || "",
      mother_phone: contactData.mother_phone || "",
      last_form_name: contactData.last_form_name || "",
      last_form_page: contactData.last_form_page || "",
      last_form_submission_date: contactData.last_form_submission_date || "",
      last_message_read_status: contactData.last_message_read_status || "unknown",
      total_spent: contactData.total_spent || 0,
      order_count: contactData.order_count || 0,
      last_order_date: contactData.last_order_date || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const docRef = await adminDb.collection("contacts").add(newContact);
    revalidatePath("/dashboard/crm");
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error in createContact:", error);
    throw error;
  }
}

// 4. Update contact
export async function updateContact(id: string, contactData: Partial<Contact>) {
  try {
    const ownerId = await getUserId();
    const docRef = adminDb.collection("contacts").doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      throw new Error("איש הקשר לא נמצא");
    }

    if (docSnap.data()?.ownerId !== ownerId) {
      throw new Error("אין הרשאה לערוך איש קשר זה");
    }

    const updatedFields: Partial<Contact> = {
      ...contactData,
      updatedAt: new Date().toISOString(),
    };
    
    // Safety check: Never overwrite ownerId
    delete updatedFields.ownerId;
    delete updatedFields.id;

    await docRef.update(updatedFields);
    revalidatePath("/dashboard/crm");
    return { success: true };
  } catch (error) {
    console.error("Error in updateContact:", error);
    throw error;
  }
}

// 5. Delete contact
export async function deleteContact(id: string) {
  try {
    const ownerId = await getUserId();
    const docRef = adminDb.collection("contacts").doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      throw new Error("איש הקשר לא נמצא");
    }

    if (docSnap.data()?.ownerId !== ownerId) {
      throw new Error("אין הרשאה למחוק איש קשר זה");
    }

    await docRef.delete();
    revalidatePath("/dashboard/crm");
    return { success: true };
  } catch (error) {
    console.error("Error in deleteContact:", error);
    throw error;
  }
}

// 6. Bulk Action
export async function handleBulkAction(ids: string[], action: "trash" | "restore" | "delete_permanent") {
  try {
    const ownerId = await getUserId();
    const contactsRef = adminDb.collection("contacts");
    
    // Process in batches
    const batch = adminDb.batch();
    
    for (const id of ids) {
      const docRef = contactsRef.doc(id);
      const docSnap = await docRef.get();
      
      if (docSnap.exists && docSnap.data()?.ownerId === ownerId) {
        if (action === "trash") {
          batch.update(docRef, { status: "trashed", updatedAt: new Date().toISOString() });
        } else if (action === "restore") {
          batch.update(docRef, { status: "active", updatedAt: new Date().toISOString() });
        } else if (action === "delete_permanent") {
          batch.delete(docRef);
        }
      }
    }
    
    await batch.commit();
    revalidatePath("/dashboard/crm");
    return { success: true, processed: ids.length };
  } catch (error) {
    console.error("Error in handleBulkAction:", error);
    throw error;
  }
}

// 7. Get stats (active and trashed counters)
export async function getCRMStats() {
  try {
    const ownerId = await getUserId();
    const contactsRef = adminDb.collection("contacts");

    const [activeSnap, trashedSnap] = await Promise.all([
      contactsRef.where("ownerId", "==", ownerId).where("status", "==", "active").get(),
      contactsRef.where("ownerId", "==", ownerId).where("status", "==", "trashed").get(),
    ]);

    return {
      active: activeSnap.size,
      trashed: trashedSnap.size,
    };
  } catch (error) {
    console.error("Error in getCRMStats:", error);
    return { active: 0, trashed: 0 };
  }
}

// 8. Get unique filter options for selector dropdowns
export async function getCRMFilters() {
  try {
    const ownerId = await getUserId();
    const snapshot = await adminDb
      .collection("contacts")
      .where("ownerId", "==", ownerId)
      .get();

    const tags = new Set<string>();
    const cities = new Set<string>();
    const sources = new Set<string>();

    snapshot.docs.forEach((doc: any) => {
      const c = doc.data() as Contact;
      if (c.tg1) tags.add(c.tg1);
      if (c.tg2) tags.add(c.tg2);
      if (c.tg3) tags.add(c.tg3);
      if (c.mh_crm_city) cities.add(c.mh_crm_city);
      if (c.lead_source) sources.add(c.lead_source);
    });

    return {
      tags: Array.from(tags).sort(),
      cities: Array.from(cities).sort(),
      lead_sources: Array.from(sources).sort(),
    };
  } catch (error) {
    console.error("Error in getCRMFilters:", error);
    return { tags: [], cities: [], lead_sources: [] };
  }
}

// 9. Import Contacts from Excel/CSV (Bulk Create/Upsert)
export async function importContacts(importedContacts: Partial<Contact>[]) {
  try {
    const ownerId = await getUserId();
    const contactsRef = adminDb.collection("contacts");
    
    let created = 0;
    let updated = 0;
    let skipped = 0;

    const { checkFeatureLimit } = await import("@/features/users/actions");
    const limitCheck = await checkFeatureLimit(ownerId, "contacts");

    for (const cData of importedContacts) {
      if (!cData.conta_name) {
        skipped++;
        continue;
      }

      let existingDocId = "";

      // 1. Try finding by ID if provided
      if (cData.id) {
        const idSnap = await contactsRef.doc(cData.id).get();
        if (idSnap.exists && idSnap.data()?.ownerId === ownerId) {
          existingDocId = cData.id;
        }
      }

      // 2. Try finding by phone number if ID not found/provided
      if (!existingDocId && cData.conta_phone) {
        const phoneSnap = await contactsRef
          .where("ownerId", "==", ownerId)
          .where("conta_phone", "==", cData.conta_phone)
          .limit(1)
          .get();
        if (!phoneSnap.empty) {
          existingDocId = phoneSnap.docs[0].id;
        }
      }

      if (!existingDocId && !limitCheck.allowed) {
        // Can't create new if limit reached
        skipped++;
        continue;
      }

      const dbData: Omit<Contact, "id"> = {
        ownerId,
        status: cData.status || "active",
        conta_name: cData.conta_name,
        f_m: cData.f_m || "",
        conta_phone: cData.conta_phone || "",
        email: cData.email || "",
        gender: cData.gender || "",
        mh_crm_city: cData.mh_crm_city || "",
        mh_crm_street: cData.mh_crm_street || "",
        tg1: cData.tg1 || "",
        tg2: cData.tg2 || "",
        tg3: cData.tg3 || "",
        company_name: cData.company_name || "",
        job_title: cData.job_title || "",
        lead_source: cData.lead_source || "",
        work_phone: cData.work_phone || "",
        website: cData.website || "",
        birth_date: cData.birth_date || "",
        notes: cData.notes || "",
        events: cData.events || [],
        form_submissions: cData.form_submissions || [],
        child_first_name: cData.child_first_name || "",
        child_last_name: cData.child_last_name || "",
        child_grade: cData.child_grade || "",
        child_id_number: cData.child_id_number || "",
        allergies_has: cData.allergies_has || "",
        allergies_details: cData.allergies_details || "",
        father_name: cData.father_name || "",
        mother_name: cData.mother_name || "",
        father_phone: cData.father_phone || "",
        mother_phone: cData.mother_phone || "",
        last_form_name: cData.last_form_name || "",
        last_form_page: cData.last_form_page || "",
        last_form_submission_date: cData.last_form_submission_date || "",
        last_message_read_status: cData.last_message_read_status || "unknown",
        total_spent: cData.total_spent || 0,
        order_count: cData.order_count || 0,
        last_order_date: cData.last_order_date || "",
        createdAt: cData.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (existingDocId) {
        // Exclude immutable parameters
        delete dbData.createdAt;
        await contactsRef.doc(existingDocId).update(dbData);
        updated++;
      } else {
        await contactsRef.add(dbData);
        created++;
      }
    }

    revalidatePath("/dashboard/crm");
    return { success: true, created, updated, skipped };
  } catch (error) {
    console.error("Error in importContacts:", error);
    throw error;
  }
}

// 10. Submit custom CRM-synced Form
export async function submitCRMForm(params: {
  formId: string;
  formTitle: string;
  formType: "standard" | "payment" | "register";
  formData: Record<string, string>;
  embeddingPostId?: string;
  embeddingPostTitle?: string;
  formConfig: any;
  status?: string;
  amountPaid?: number;
}) {
  try {
    const ownerId = await getUserId();
    const { formData, formConfig, formTitle, embeddingPostTitle, status, amountPaid, formType } = params;

    const contactData: Record<string, any> = {};

    formConfig.fields.forEach((field: any) => {
      const value = formData[field.label];
      if (value !== undefined) {
        if (field.map_to) {
          contactData[field.map_to] = value;
        }
        if (field.map_to_2) {
          contactData[field.map_to_2] = value;
        }
      }
    });

    if (amountPaid && formConfig.payment_amount_crm_map) {
      contactData[formConfig.payment_amount_crm_map] = amountPaid;
    }

    const rawPhone = contactData.conta_phone;
    if (!rawPhone) {
      throw new Error("מספר טלפון נייד הוא שדה חובה לשמירה ב-CRM");
    }

    // Normalize phone number
    const normalizePhone = (phone: string) => {
      let clean = phone.replace(/\D/g, "");
      if (clean.startsWith("972") && clean.length > 9) {
        return "0" + clean.slice(3);
      }
      if (!clean.startsWith("0") && clean.length === 9) {
        return "0" + clean;
      }
      return clean;
    };
    const phone = normalizePhone(rawPhone);
    contactData.conta_phone = phone;

    // --- REGISTRATION LOGIC ---
    if (formType === "register") {
      const email = contactData.email;
      if (!email) {
        throw new Error("חובה למפות שדה לדוא״ל עבור טופס הרשמה.");
      }

      const usersRef = adminDb.collection("users");
      const existingUser = await usersRef.where("username", "==", email.toLowerCase()).get();
      if (existingUser.empty) {
        const role = formConfig.register_role || "TRIAL";
        const newUser: any = {
          username: email.toLowerCase(),
          email: email,
          name: contactData.conta_name || "",
          password: phone, // phone as temporary password
          role: role,
          createdAt: new Date().toISOString()
        };

        if (role === "TRIAL") {
          const expires = new Date();
          expires.setDate(expires.getDate() + 14);
          newUser.trialExpiresAt = expires.toISOString();
        }

        await usersRef.add(newUser);
      }
    }
    // -------------------------

    const finalOwnerId = formConfig.crm_owner_id || ownerId;
    const contactsRef = adminDb.collection("contacts");
    const querySnapshot = await contactsRef
      .where("ownerId", "==", finalOwnerId)
      .where("conta_phone", "==", phone)
      .limit(1)
      .get();

    let contactId = "";
    let existingData: any = null;

    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      contactId = doc.id;
      existingData = doc.data();
    }

    const finalStatus = status || (formConfig.form_type === "payment" ? "ממתין לתשלום" : "פנייה חדשה");
    
    const dbData: any = {
      ownerId: finalOwnerId,
      status: "active",
      conta_name: contactData.conta_name || existingData?.conta_name || "",
      f_m: contactData.f_m || existingData?.f_m || "",
      email: contactData.email || existingData?.email || "",
      conta_phone: phone,
      tg1: finalStatus,
      updatedAt: new Date().toISOString(),
    };

    // Append any field that was mapped, including custom dynamic fields
    Object.keys(contactData).forEach((key) => {
      if (
        contactData[key] !== undefined && 
        key !== "conta_name" && 
        key !== "f_m" && 
        key !== "email" && 
        key !== "conta_phone"
      ) {
        dbData[key] = contactData[key];
      }
    });

    if (embeddingPostTitle) {
      dbData.lead_source = embeddingPostTitle;
    }
    dbData.last_form_name = formTitle;
    dbData.last_form_page = params.embeddingPostId || "";
    dbData.last_form_submission_date = new Date().toISOString();

    const newEvent = {
      time: new Date().toISOString(),
      title: `טופס: ${formTitle}`,
      text: `${amountPaid ? `סכום: ${amountPaid} ש"ח. ` : ""}סטטוס: ${finalStatus}. ערכי שדות: ${JSON.stringify(formData)}`
    };

    if (contactId) {
      const updatedEvents = [...(existingData?.events || []), newEvent];
      await contactsRef.doc(contactId).update({
        ...dbData,
        events: updatedEvents
      });
    } else {
      await contactsRef.add({
        ...dbData,
        createdAt: new Date().toISOString(),
        events: [newEvent]
      });
    }

    let whatsappSent = false;
    let finalWhatsAppMessage = "";

    const whatsappTemplate = formConfig.form_type === "payment" 
      ? (amountPaid ? formConfig.payment_success_message : formConfig.payment_pending_message)
      : formConfig.standard_whatsapp_message;

    const whatsappImageUrl = formConfig.form_type === "payment"
      ? (amountPaid ? formConfig.payment_success_image_url : formConfig.payment_pending_image_url)
      : formConfig.standard_whatsapp_image_url;

    if (whatsappTemplate) {
      let resolvedMsg = whatsappTemplate;
      Object.keys(formData).forEach((key) => {
        resolvedMsg = resolvedMsg.replace(new RegExp(`{${key}}`, "g"), formData[key]);
      });
      resolvedMsg = resolvedMsg.replace(/{סכום}/g, String(amountPaid || formConfig.payment_amount || 0));
      resolvedMsg = resolvedMsg.replace(/{עמוד}/g, embeddingPostTitle || "");
      resolvedMsg = resolvedMsg.replace(/{link_kabala}/g, "https://hakel.club/receipt/mock");

      finalWhatsAppMessage = resolvedMsg;
      whatsappSent = true;

      const updatedSnapshot = await contactsRef
        .where("ownerId", "==", finalOwnerId)
        .where("conta_phone", "==", phone)
        .limit(1)
        .get();

      if (!updatedSnapshot.empty) {
        const contactDoc = updatedSnapshot.docs[0];
        const contactDataCurrent = contactDoc.data();
        const whatsappEvent = {
          time: new Date().toISOString(),
          title: "מערכת WhatsApp אוטומטית",
          text: `נשלחה הודעה לנייד ${phone}: "${finalWhatsAppMessage}" ${whatsappImageUrl ? `(תמונה: ${whatsappImageUrl})` : ""}`
        };
        await contactsRef.doc(contactDoc.id).update({
          events: [...(contactDataCurrent.events || []), whatsappEvent]
        });
      }
    }

    // Increment analytics on the service/landing page if it exists
    if (params.embeddingPostId) {
      try {
        const serviceRef = adminDb.collection("services").doc(params.embeddingPostId);
        const incrementField = amountPaid ? "purchases" : "leads";
        await serviceRef.set({
          [incrementField]: FieldValue.increment(1)
        }, { merge: true });
      } catch (err) {
        console.error("Failed to increment analytics on service doc:", err);
      }
    }

    // TRIGGER AUTOMATIONS (form_submission)
    try {
      const automationsRef = adminDb.collection("automations");
      const autoSnap = await automationsRef
        .where("ownerId", "==", finalOwnerId)
        .where("isActive", "==", true)
        .get();
        
      const formPayload = {
        ...formData,
        ...contactData,
        formTitle,
        formId: params.formId,
        amountPaid
      };

      for (const doc of autoSnap.docs) {
        const auto = doc.data();
        if (auto.trigger && auto.trigger.type === "form_submission" && auto.trigger.formId === params.formId) {
          // Dynamic import to prevent circular dependencies
          const { runAutomation } = await import("@/lib/automations/engine");
          void runAutomation(doc.id, formPayload);
        }
      }
    } catch (err) {
      console.error("Error triggering form_submission automation:", err);
    }

    revalidatePath("/dashboard/crm");
    return {
      success: true,
      whatsappSent,
      whatsappMessage: finalWhatsAppMessage,
      whatsappImageUrl
    };
  } catch (error: any) {
    console.error("CRM Form Submission Error:", error);
    return { success: false, error: error.message };
  }
}

// 11. Send Email and Log to Timeline
export async function sendEmailAction(contactId: string, email: string, subject: string, body: string) {
  try {
    const ownerId = await getUserId();
    const docRef = adminDb.collection("contacts").doc(contactId);
    const docSnap = await docRef.get();
    
    if (!docSnap.exists) {
      throw new Error("איש הקשר לא נמצא");
    }
    
    if (docSnap.data()?.ownerId !== ownerId) {
      throw new Error("אין הרשאה לערוך איש קשר זה");
    }
    
    const contactData = docSnap.data();
    const currentEvents = contactData?.events || [];
    
    const newEvent = {
      time: new Date().toISOString(),
      title: "מייל יוצא מהמערכת",
      text: `אל: ${email}\nנושא: ${subject}\nתוכן:\n${body}`,
    };
    
    await docRef.update({
      events: [newEvent, ...currentEvents],
      updatedAt: new Date().toISOString(),
    });
    
    return { success: true };
  } catch (error: any) {
    console.error("Error in sendEmailAction:", error);
    return { success: false, error: error.message || String(error) };
  }
}

// 12. Add Contact Reminder Event
export async function addContactReminder(contactId: string, title: string, text: string, time: string) {
  try {
    const ownerId = await getUserId();
    const docRef = adminDb.collection("contacts").doc(contactId);
    const docSnap = await docRef.get();
    
    if (!docSnap.exists) {
      throw new Error("איש הקשר לא נמצא");
    }
    
    if (docSnap.data()?.ownerId !== ownerId) {
      throw new Error("אין הרשאה לערוך איש קשר זה");
    }
    
    const contactData = docSnap.data();
    const currentEvents = contactData?.events || [];
    
    const newEvent = {
      time: time || new Date().toISOString(),
      title: title || "תזכורת",
      text: text || "",
    };
    
    await docRef.update({
      events: [newEvent, ...currentEvents],
      updatedAt: new Date().toISOString(),
    });
    
    return { success: true };
  } catch (error: any) {
    console.error("Error in addContactReminder:", error);
    return { success: false, error: error.message || String(error) };
  }
}

// 13. Send WhatsApp and Log to Timeline
export async function sendWhatsAppAction(contactId: string, phone: string, message: string) {
  try {
    // Send message using Green API
    const { sendWhatsAppMessage } = await import("../whatsapp/actions");
    await sendWhatsAppMessage(phone, message);
    
    // Save to contact timeline
    const ownerId = await getUserId();
    const docRef = adminDb.collection("contacts").doc(contactId);
    const docSnap = await docRef.get();
    
    if (docSnap.exists && docSnap.data()?.ownerId === ownerId) {
      const contactData = docSnap.data();
      const currentEvents = contactData?.events || [];
      const newEvent = {
        time: new Date().toISOString(),
        title: "הודעה יוצאת מוואטסאפ",
        text: message,
      };
      await docRef.update({
        events: [newEvent, ...currentEvents],
        updatedAt: new Date().toISOString(),
      });
    }
    
    return { success: true };
  } catch (error: any) {
    console.error("Error in sendWhatsAppAction:", error);
    return { success: false, error: error.message || String(error) };
  }
}

// 14. Get custom CRM fields
export async function getCustomFields() {
  try {
    const ownerId = await getUserId();
    const docRef = adminDb.collection("crm_settings").doc(`custom_fields_${ownerId}`);
    const docSnap = await docRef.get();
    if (!docSnap.exists) {
      return [];
    }
    const data = docSnap.data();
    return (data?.fields || []) as Array<{
      id: string;
      category: string;
      type: string;
      label: string;
    }>;
  } catch (error) {
    console.error("Error in getCustomFields:", error);
    return [];
  }
}

// 15. Add custom CRM field
export async function addCustomField(field: Omit<{id: string; category: string; type: string; label: string;}, "id">) {
  try {
    const ownerId = await getUserId();
    const docRef = adminDb.collection("crm_settings").doc(`custom_fields_${ownerId}`);
    const docSnap = await docRef.get();
    
    const newField = {
      id: `custom_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      ...field,
    };

    if (!docSnap.exists) {
      await docRef.set({ fields: [newField] });
    } else {
      const data = docSnap.data();
      const fields = data?.fields || [];
      await docRef.update({ fields: [...fields, newField] });
    }
    
    return { success: true, field: newField };
  } catch (error: any) {
    console.error("Error in addCustomField:", error);
    return { success: false, error: error.message || String(error) };
  }
}
