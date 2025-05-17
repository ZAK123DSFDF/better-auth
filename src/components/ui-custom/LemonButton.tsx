// app/components/CheckoutButton.tsx
"use client";

import { useState } from "react";

export default function LemonButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/lemon", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to initiate checkout");
      }

      const { checkoutUrl } = await response.json();

      // Redirect to Lemon Squeezy checkout
      window.location.href = checkoutUrl;
    } catch (err: any) {
      console.error("Checkout failed:", err);
      setError(err.message || "Checkout failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleCheckout}
        disabled={isLoading}
        className="bg-blue-600 text-white px-6 py-3 rounded-lg disabled:opacity-50"
      >
        {isLoading ? "Processing..." : "Proceed to Checkout"}
      </button>
      {error && <p className="mt-2 text-red-500">{error}</p>}
    </div>
  );
}
