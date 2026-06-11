"use client";

import { Button } from "@/components/ui/Button";

interface KesherCheckoutProps {
  amount?: number;
  description?: string;
  onSuccess?: () => void;
  className?: string;
}

export function KesherCheckout({ amount, description, onSuccess, className }: KesherCheckoutProps) {
  return (
    <div className={`p-6 border rounded-xl bg-slate-50 flex flex-col items-center justify-center space-y-4 ${className || ""}`}>
      <p className="text-slate-600 text-center text-sm">
        מעבר לתשלום / תרומה דרך מערכת קשר.
        {amount ? ` סכום לתשלום: ₪${amount}` : ""}
      </p>
      <Button 
        onClick={() => {
          window.open("https://kesherhk.co.il", "_blank");
          if (onSuccess) onSuccess();
        }}
        className="w-full"
      >
        לתשלום מאובטח
      </Button>
    </div>
  );
}
