"use client";

import { useState } from "react";
import { createCheckoutSession, upgradeSubscriptionSession } from "./actions";

export default function CheckoutPage() {
  const [isUpdating, setIsUpdating] = useState(false);

  // Example price_ids
  const UPGRADE_PRICE_ID = "price_1Raa5s4gdP9i8VnsUkSoqWsX";
  const DOWNGRADE_PRICE_ID = "price_1Rbb5t4gdP9i8VnsXYZabc12";

  async function handleCheckout() {
    const { url } = await createCheckoutSession();
    if (url) window.location.href = url;
  }

  async function handleUpdate(priceId: string) {
    setIsUpdating(true);
    try {
      const res = await upgradeSubscriptionSession(priceId);
      if (res.success) {
        alert(`Subscription updated! New status: ${res.status}`);
      } else {
        alert("Update failed.");
      }
    } catch (err) {
      console.error("Update error:", err);
      alert("An unexpected error occurred.");
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <div className="space-y-4 p-4">
      <button
        onClick={handleCheckout}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Buy Now
      </button>

      <button
        onClick={() => handleUpdate(UPGRADE_PRICE_ID)}
        disabled={isUpdating}
        className={`${
          isUpdating ? "opacity-60 cursor-not-allowed" : "bg-green-600"
        } text-white px-4 py-2 rounded`}
      >
        {isUpdating ? "Updating..." : "Upgrade Plan"}
      </button>

      <button
        onClick={() => handleUpdate(DOWNGRADE_PRICE_ID)}
        disabled={isUpdating}
        className={`${
          isUpdating ? "opacity-60 cursor-not-allowed" : "bg-yellow-600"
        } text-white px-4 py-2 rounded`}
      >
        {isUpdating ? "Updating..." : "Downgrade Plan"}
      </button>
    </div>
  );
}
