"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";

interface KesherCheckoutProps {
  amount?: number;
  description?: string;
  clientName?: string;
  phone?: string;
  email?: string;
  transactionId?: string;
  onSuccess?: () => void;
  className?: string;
}

export function KesherCheckout({ amount, description, clientName, phone, email, transactionId, onSuccess, className }: KesherCheckoutProps) {
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePayment = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/kesher/get-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          details: description,
          clientName,
          phone,
          email,
          transactionId
        })
      });
      const data = await response.json();
      if (data.success && data.iframeUrl) {
        setIframeUrl(data.iframeUrl);
      } else {
        setError(data.error || "שגיאה ביצירת דף התשלום");
      }
    } catch (err: any) {
      setError(err.message || "שגיאת תקשורת");
    } finally {
      setIsLoading(false);
    }
  };

  if (iframeUrl) {
    return (
      <div className={`w-full h-[600px] border rounded-xl overflow-hidden ${className || ""}`}>
        <iframe src={iframeUrl} width="100%" height="100%" frameBorder="0" allow="payment" />
      </div>
    );
  }

  return (
    <div className={`p-6 border rounded-xl bg-slate-50 flex flex-col items-center justify-center space-y-4 ${className || ""}`}>
      <p className="text-slate-600 text-center text-sm">
        מעבר לתשלום / תרומה דרך מערכת קשר.
        {amount ? ` סכום לתשלום: ₪${amount}` : ""}
      </p>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <Button 
        onClick={handlePayment}
        className="w-full"
        disabled={isLoading}
      >
        {isLoading ? "טוען..." : "לתשלום מאובטח"}
      </Button>
    </div>
  );
}
