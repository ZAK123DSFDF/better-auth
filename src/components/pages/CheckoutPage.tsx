"use client";

import { useEffect, useState } from "react";
import {
  createCheckoutSession,
  getPriceDiscounts,
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
  const [useTrial, setUseTrial] = useState(false);
  const [trialInput, setTrialInput] = useState("14");

  // New States for Dynamic Promos
  const [availablePromos, setAvailablePromos] = useState<any[]>([]);
  const [selectedPromoString, setSelectedPromoString] = useState<string | null>(
    null,
  );

  const PLAN_20_ID = "price_1RZXfw4gdP9i8VnsO225oxSK";
  const PLAN_40_ID = "price_1Raa5s4gdP9i8VnsUkSoqWsX";

  // Fetch promos on load
  useEffect(() => {
    getPriceDiscounts("").then(setAvailablePromos);
  }, []);

  async function handleCheckout(priceId?: string) {
    setLoadingPrice(priceId || "one-time");
    try {
      const days = parseInt(trialInput);
      const dynamicTrial =
        useTrial && priceId && !isNaN(days) ? Math.max(1, days) : undefined;

      // ✅ We pass selectedPromoString (e.g., "ACME-10") to the server
      const { url } = await createCheckoutSession(
        userEmail,
        priceId,
        dynamicTrial,
        selectedPromoString || undefined,
      );

      if (url) window.location.href = url;
    } finally {
      setLoadingPrice(null);
    }
  }

  async function handleUpdatePlan(priceId: string, label: string) {
    if (priceId === currentPriceId) return;
    setLoadingPrice(`update-${priceId}`);
    try {
      const res = await upgradeSubscriptionSession(userEmail, priceId);
      if (res.success) alert(`Successfully switched to ${label}!`);
    } catch (err) {
      alert("Update failed. Make sure you have an active subscription.");
    } finally {
      setLoadingPrice(null);
    }
  }

  return (
    <div className="flex flex-col gap-8 p-8 max-w-md mx-auto">
      {/* 🎟️ New Promotion Selection Section */}
      {!isSubscribed && availablePromos.length > 0 && (
        <section className="bg-white border-2 border-dashed border-gray-200 rounded-xl p-4">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
            Available Deals
          </h3>
          <div className="flex flex-col gap-2">
            {/* Option to use no pre-selected code (manual entry) */}
            <label
              className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-all ${!selectedPromoString ? "border-blue-500 bg-blue-50" : "border-gray-100 hover:bg-gray-50"}`}
            >
              <span className="text-sm font-medium">None / Manual Entry</span>
              <input
                type="radio"
                name="promo"
                className="hidden"
                checked={!selectedPromoString}
                onChange={() => setSelectedPromoString(null)}
              />
            </label>

            {/* Map through Stripe Promo Codes */}
            {availablePromos.map((promo) => (
              <label
                key={promo.id}
                className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-all ${selectedPromoString === promo.code ? "border-green-500 bg-green-50" : "border-gray-100 hover:bg-gray-50"}`}
              >
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-green-700">
                    {promo.code}
                  </span>
                  <span className="text-xs text-gray-500">
                    {promo.percentOff}% Discount
                  </span>
                </div>
                <input
                  type="radio"
                  name="promo"
                  className="hidden"
                  checked={selectedPromoString === promo.code}
                  onChange={() => setSelectedPromoString(promo.code)}
                />
              </label>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-4">
        {/* Trial Toggle */}
        {!isSubscribed && (
          <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <input
              type="checkbox"
              id="trial-toggle"
              checked={useTrial}
              onChange={(e) => setUseTrial(e.target.checked)}
              className="w-5 h-5 cursor-pointer"
            />
            <label
              htmlFor="trial-toggle"
              className="text-sm font-medium text-blue-800 cursor-pointer"
            >
              Add {trialInput || "0"}-day free trial
            </label>
          </div>
        )}

        {/* One-Time Payment */}
        <div className="border p-4 rounded-lg shadow-sm">
          <p className="font-semibold text-gray-700">Lifetime Access</p>
          <button
            onClick={() => handleCheckout()}
            disabled={!!loadingPrice}
            className="w-full mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400 font-medium"
          >
            {loadingPrice === "one-time" ? "Processing..." : "Buy Once"}
          </button>
        </div>

        <h2 className="text-xl font-bold border-b pb-2 text-gray-800">
          New Customers
        </h2>

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

      {/* Management Section */}
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
