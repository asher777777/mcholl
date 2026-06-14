import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Kesher returns status via GET params
    const transactionId = searchParams.get("transactionId"); // or something else depending on their query string
    const status = searchParams.get("Status");
    const docNumber = searchParams.get("docNumber");
    const receiptLink = searchParams.get("receiptLink");
    const amount = searchParams.get("Amount");
    
    // In our GetLinkToken call, we passed AddData = transactionId
    const addData = searchParams.get("AddData");

    const recordId = addData || transactionId;

    if (!recordId) {
      return NextResponse.json({ success: false, error: "חסר מזהה עסקה" }, { status: 400 });
    }

    // Try to update the record in our DB
    // Assuming we store transactions in "orders" collection
    const orderRef = adminDb.collection("orders").doc(recordId);
    
    // Update the record with receipt data
    await orderRef.set({
      kesherStatus: status || "unknown",
      docNumber: docNumber || "",
      receiptLink: receiptLink || "",
      paidAmount: amount || 0,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    return NextResponse.json({ success: true, message: "Webhook התקבל בהצלחה" });
  } catch (error: any) {
    console.error("Kesher Webhook Error:", error);
    return NextResponse.json({ success: false, error: "שגיאת שרת פנימית" }, { status: 500 });
  }
}
