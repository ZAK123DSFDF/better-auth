"use client";

import { useState } from "react";
import { createCheckoutSession, upgradeSubscriptionSession } from "./actions";

export default function CheckoutPage() {
  const [isUpgrading, setIsUpgrading] = useState(false);

  async function handleCheckout() {
    const { url } = await createCheckoutSession();
    if (url) window.location.href = url;
  }

  async function handleUpgrade() {
    setIsUpgrading(true);
    try {
      const res = await upgradeSubscriptionSession();
      if (res.success) {
        alert("Upgrade successful!");
      } else {
        alert("Upgrade failed.");
      }
    } catch (err) {
      console.error("Upgrade error:", err);
      alert("An unexpected error occurred.");
    } finally {
      setIsUpgrading(false);
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
        onClick={handleUpgrade}
        disabled={isUpgrading}
        className={`${
          isUpgrading ? "opacity-60 cursor-not-allowed" : "bg-green-600"
        } text-white px-4 py-2 rounded`}
      >
        {isUpgrading ? "Upgrading..." : "Upgrade Plan"}
      </button>
    </div>
  );
}
