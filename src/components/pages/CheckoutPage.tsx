"use client";

import { useState } from "react";
import {
  createCheckoutSession,
  upgradeSubscriptionSession,
} from "@/app/checkout/actions";

interface Props {
  userEmail: string;
  isSubscribed: boolean;
  currentPriceId: string | null;
}

export default function CheckoutPage({
  userEmail,
  isSubscribed,
  currentPriceId,
}: Props) {
  const [loadingPrice, setLoadingPrice] = useState<string | null>(null);

  const PLAN_20_ID = "price_1RZXfw4gdP9i8VnsO225oxSK";
  const PLAN_40_ID = "price_1Raa5s4gdP9i8VnsUkSoqWsX";

  async function handleCheckout(priceId?: string) {
    setLoadingPrice(priceId || "one-time");
    try {
      // Pass userEmail here so Stripe ties the purchase to the account
      const { url } = await createCheckoutSession(userEmail, priceId);
      if (url) window.location.href = url;
    } finally {
      setLoadingPrice(null);
    }
  }

  async function handleUpdatePlan(priceId: string, label: string) {
    if (priceId === currentPriceId) return;

    setLoadingPrice(`update-${priceId}`);
    try {
      // Pass userEmail here so the server knows which customer to upgrade
      const res = await upgradeSubscriptionSession(userEmail, priceId);
      if (res.success) {
        alert(`Successfully switched to ${label}!`);
      }
    } catch (err) {
      alert("Update failed. Make sure you have an active subscription.");
    } finally {
      setLoadingPrice(null);
    }
  }

  return (
    <div className="flex flex-col gap-8 p-8 max-w-md mx-auto">
      <section className="space-y-4">
        <h2 className="text-xl font-bold border-b pb-2">New Customers</h2>

        {/* $20 Subscription */}
        <div className="border p-4 rounded-lg shadow-sm border-green-200 bg-green-50">
          <p className="font-semibold text-green-800">Basic Plan - $20/mo</p>
          <button
            onClick={() => handleCheckout(PLAN_20_ID)}
            disabled={!!loadingPrice || isSubscribed}
            className="w-full mt-2 bg-green-600 text-white px-4 py-2 rounded disabled:bg-gray-400"
          >
            {isSubscribed ? "Already Subscribed" : "Subscribe for $20"}
          </button>
        </div>

        {/* $40 Subscription */}
        <div className="border p-4 rounded-lg shadow-sm border-purple-200 bg-purple-50">
          <p className="font-semibold text-purple-800">Pro Plan - $40/mo</p>
          <button
            onClick={() => handleCheckout(PLAN_40_ID)}
            disabled={!!loadingPrice || isSubscribed}
            className="w-full mt-2 bg-purple-600 text-white px-4 py-2 rounded disabled:bg-gray-400"
          >
            {isSubscribed ? "Already Subscribed" : "Subscribe for $40"}
          </button>
        </div>
      </section>

      {/* Only show Manage Plan if they are actually subscribed */}
      {isSubscribed && (
        <section className="space-y-4 bg-gray-100 p-4 rounded-xl">
          <h2 className="text-lg font-bold text-gray-700">
            Manage Existing Plan
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => handleUpdatePlan(PLAN_20_ID, "Basic")}
              disabled={!!loadingPrice || currentPriceId === PLAN_20_ID}
              className="flex-1 text-sm bg-white border border-green-600 px-2 py-2 rounded disabled:opacity-30"
            >
              {currentPriceId === PLAN_20_ID ? "Current Plan" : "Switch to $20"}
            </button>

            <button
              onClick={() => handleUpdatePlan(PLAN_40_ID, "Pro")}
              disabled={!!loadingPrice || currentPriceId === PLAN_40_ID}
              className="flex-1 text-sm bg-white border border-purple-600 px-2 py-2 rounded disabled:opacity-30"
            >
              {currentPriceId === PLAN_40_ID ? "Current Plan" : "Switch to $40"}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
