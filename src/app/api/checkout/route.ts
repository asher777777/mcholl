import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { plan, amount, name, email, phone } = body;

    const kesherApiUrl = process.env.KESHER_API_URL || "https://api.kesherhk.co.il";
    const kesherApiKey = process.env.KESHER_API_KEY;

    if (!kesherApiKey) {
      console.warn("KESHER_API_KEY is not defined. Using mock successful response.");
      // Mock successful response for development
      return NextResponse.json({
        success: true,
        transactionId: "MOCK-" + Math.random().toString(36).substring(2, 9).toUpperCase(),
        message: "תשלום מדומה התקבל בהצלחה"
      });
    }

    // Call actual Kesher API
    // Note: The exact endpoint (/v1/payments) and payload structure should be adjusted 
    // according to the official Kesher API documentation at https://api.kesherhk.co.il/
    const response = await fetch(`${kesherApiUrl}/api/v1/payments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${kesherApiKey}`
      },
      body: JSON.stringify({
        amount: amount,
        currency: "ILS",
        customer: {
          name: name,
          email: email,
          phone: phone
        },
        description: `תשלום עבור תוכנית ${plan} במחולל הקהילות`
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Kesher API Error:", errorText);
      return NextResponse.json({ success: false, error: "שגיאה בתהליך התשלום מול קשר" }, { status: 500 });
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      transactionId: data.transaction_id || data.id,
      message: "התשלום בוצע בהצלחה"
    });

  } catch (error) {
    console.error("Checkout API Error:", error);
    return NextResponse.json(
      { success: false, error: "שגיאה בתהליך התשלום" },
      { status: 500 }
    );
  }
}
