import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { amount, clientName, phone, email, details, transactionId } = body;

    // Get Kesher Settings from Firebase
    const settingsDoc = await adminDb.collection("settings").doc("kesher").get();
    const settings = settingsDoc.exists ? settingsDoc.data() : null;

    if (!settings || !settings.userName || !settings.apiKey || !settings.paymentPageId) {
      return NextResponse.json({ success: false, error: "הגדרות קשר (שם משתמש, סיסמה או מספר דף תשלום) חסרות במערכת." }, { status: 400 });
    }

    const payload = {
      Json: {
        userName: settings.userName,
        password: settings.apiKey, // The plugin uses password
        func: "GetLinkToken",
        format: "json",
        request: {
          PaymentPageId: settings.paymentPageId,
          Currency: "1", // ILS
          Total: String(amount),
          Name: clientName || "",
          FirstName: clientName ? clientName.split(" ")[0] : "",
          LastName: clientName ? clientName.split(" ").slice(1).join(" ") : "",
          Tel: phone || "",
          Mail: email || "",
          CreditType: "1", // Regular payment
          Date: new Date().toISOString().split("T")[0],
          Comment: details || "תשלום / תרומה",
          AddData: transactionId || `TXN_${Date.now()}`,
          NumPayment: 1,
          MaxPayments: 1,
          Moked: "CommunityGenerator"
        }
      },
      format: "json"
    };

    const response = await fetch("https://kesherhk.info/ConnectToKesher/ConnectToKesher", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const resultText = await response.text();
    let result;
    try {
      result = JSON.parse(resultText);
    } catch (e) {
      console.error("Kesher Parse Error:", resultText);
      return NextResponse.json({ success: false, error: "שגיאה בפיענוח תשובת קשר" }, { status: 500 });
    }

    const token = result.Token;
    const status = result.RequestResult?.Status;
    const code = result.RequestResult?.Code;

    // Based on plugin logic
    if (!token || !status || code != 944) {
      console.error("Kesher Token Error:", result);
      return NextResponse.json({ success: false, error: "שגיאה בהפקת טוקן לתשלום. " + (result.RequestResult?.Description || "") }, { status: 500 });
    }

    // Return the token and the iframe URL
    return NextResponse.json({
      success: true,
      token: token,
      iframeUrl: `https://ultra.kesherhk.info/external/paymentPage/${settings.paymentPageId}?token=${token}`
    });

  } catch (error: any) {
    console.error("Kesher GetToken Error:", error);
    return NextResponse.json({ success: false, error: error.message || "שגיאת שרת פנימית" }, { status: 500 });
  }
}
