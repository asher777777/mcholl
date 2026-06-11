"use server";

import { adminDb } from "@/lib/firebase-admin";

export async function getKesherSettings() {
  try {
    const docRef = adminDb.collection("settings").doc("kesher");
    const docSnap = await docRef.get();
    
    if (docSnap.exists) {
      return docSnap.data();
    }
  } catch (err) {
    console.error("Error getting Kesher settings:", err);
  }
  return null;
}

export async function saveKesherSettings(settings: any) {
  try {
    const docRef = adminDb.collection("settings").doc("kesher");
    await docRef.set(settings, { merge: true });
    return { success: true };
  } catch (error) {
    console.error("Error saving Kesher settings:", error);
    return { success: false, error: (error as Error).message };
  }
}

export async function createManualInvoice(data: any) {
  try {
    const { auth } = await import("@/lib/auth");
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    const settings = await getKesherSettings();
    if (!settings?.userName || !settings?.apiKey || !settings?.terminalNumber) {
      return { success: false, error: "לא הוגדרו פרטי קשר (שם משתמש, סיסמה/API ומסוף) בלוח הבקרה." };
    }

    // Attempting to send to Kesher API
    const payload = {
      func: "SendTransaction", 
      tran: {
        userName: settings.userName,
        password: settings.apiKey,
        TerminalNumber: settings.terminalNumber,
        
        ChargeOptionType: data.paymentType,
        Total: Math.round(data.amount * 100),
        ProjectNumber: data.receiptType || "405",
        TransactionType: "debit",
        
        ClientName: data.clientName,
        Details: data.details,
        Phone: data.phone,
        Zeout: data.zeout,
        CheckNumber: data.checkNumber,
        Bank: data.bankName,
        Branch: data.branchNumber,
        Account: data.accountNumber,
      },
      format: "json"
    };

    try {
      const response = await fetch("https://kesherhk.info/ConnectToKesher/ConnectToKesher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      const responseText = await response.text();
      let result;
      try {
        result = JSON.parse(responseText);
      } catch {
        result = responseText; // In case Kesher returns non-JSON ok message
      }
      
      // Save to CRM contacts so it appears in the dashboard
      await adminDb.collection("contacts").add({
        ownerId: session.user.id || "1",
        name: data.clientName,
        phone: data.phone || "",
        email: "",
        status: "Customer",
        source: "Manual Receipt",
        amount: data.amount,
        createdAt: new Date().toISOString(),
        paymentType: data.paymentType,
        kesherStatus: typeof result === 'string' ? result : "Success"
      });
      
      return { success: true, message: "הקבלה נשמרה ב-CRM ונשלחה לקשר בהצלחה!" };

    } catch (apiError) {
      // Fallback to local save if API structure mismatches
      await adminDb.collection("contacts").add({
        ownerId: session.user.id || "1",
        name: data.clientName,
        phone: data.phone || "",
        email: "",
        status: "Customer",
        source: "Manual Receipt (Failed Kesher)",
        amount: data.amount,
        createdAt: new Date().toISOString(),
        paymentType: data.paymentType,
        kesherStatus: "Failed",
        error: (apiError as Error).message
      });
      
      return { success: true, message: "הקבלה נשמרה ב-CRM המקומי (שגיאה בשליחה למערכת קשר, הנתונים תועדו)." };
    }

  } catch (error: any) {
    console.error("Error creating manual invoice:", error);
    return { success: false, error: error.message };
  }
}
