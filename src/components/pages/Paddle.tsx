"use client";

import { initializePaddle, Paddle } from "@paddle/paddle-js";
import { useEffect, useState } from "react";

// --- Price ID Constants ---
const PADDLE_PRICES = {
  PRO: "pri_01kegqmkdtxjqv8vvpm0x3t6f4",
  ULTIMATE: "pri_01kegqpdetba6y8nr7hzap7vgt",
  ONE_TIME: "pri_01kegqkgr62jesb08hex6x1t11",
};

interface PaymentProps {
  email: string;
  initialSubscriptionId: string | null;
  currentPriceId: string | null;
}

export default function Payment({
  email,
  initialSubscriptionId,
  currentPriceId,
}: PaymentProps) {
  const [currentSubId] = useState(initialSubscriptionId);
  const [paddle, setPaddle] = useState<Paddle>();
  const [loading, setLoading] = useState(false);

  function getCookie(name: string): string | null {
    const match = document.cookie.match(
      new RegExp("(^| )" + name + "=([^;]+)"),
    );
    return match ? decodeURIComponent(match[2]) : null;
  }

  useEffect(() => {
    initializePaddle({
      environment: "sandbox",
      token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN!,
    }).then((p) => setPaddle(p));
  }, []);

  const handleCheckout = (priceId: string) => {
    if (!paddle) return alert("Paddle not initialized");

    const successUrl =
      process.env.NODE_ENV === "production"
        ? "https://better-auth-pi.vercel.app/success"
        : `${process.env.NEXT_PUBLIC_BASE_URL}/success`;

    paddle.Checkout.open({
      items: [{ priceId, quantity: 1 }],
      customer: {
        email: email,
      },
      customData: {
        refearnapp_affiliate_code: getCookie("refearnapp_affiliate_cookie"),
      },
      settings: {
        displayMode: "overlay",
        theme: "light",
        successUrl,
        showAddDiscounts: true,
        allowDiscountRemoval: true,
      },
    });
  };

  const changePlan = async (newPriceId: string) => {
    if (newPriceId === currentPriceId) return; // Guard clause

    setLoading(true);
    try {
      const res = await fetch("/api/paddle/subscriptions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscriptionId: currentSubId,
          newPriceId,
        }),
      });
      const json = await res.json();
      if (json.success) alert("Subscription updated successfully!");
      else alert("Error: " + json.error);
    } catch {
      alert("Request failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 border rounded-xl max-w-sm">
      <button
        onClick={() => handleCheckout(PADDLE_PRICES.ONE_TIME)}
        className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-md transition"
      >
        One-Time Payment
      </button>

      <hr />

      {!currentSubId ? (
        <div className="flex flex-col gap-3">
          <button
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition"
            onClick={() => handleCheckout(PADDLE_PRICES.PRO)}
          >
            Subscribe to Pro
          </button>
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition"
            onClick={() => handleCheckout(PADDLE_PRICES.ULTIMATE)}
          >
            Subscribe to Ultimate
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-semibold text-gray-500 uppercase">
            Manage Plan
          </p>

          {/* ULTIMATE BUTTON */}
          <button
            onClick={() => changePlan(PADDLE_PRICES.ULTIMATE)}
            disabled={loading || currentPriceId === PADDLE_PRICES.ULTIMATE}
            className={`px-4 py-2 rounded transition font-medium ${
              currentPriceId === PADDLE_PRICES.ULTIMATE
                ? "bg-gray-100 text-gray-400 cursor-not-allowed border"
                : "bg-green-600 hover:bg-green-700 text-white"
            }`}
          >
            {loading
              ? "Processing..."
              : currentPriceId === PADDLE_PRICES.ULTIMATE
                ? "Current: Ultimate"
                : "Upgrade to Ultimate"}
          </button>

          {/* PRO BUTTON */}
          <button
            onClick={() => changePlan(PADDLE_PRICES.PRO)}
            disabled={loading || currentPriceId === PADDLE_PRICES.PRO}
            className={`px-4 py-2 rounded transition font-medium ${
              currentPriceId === PADDLE_PRICES.PRO
                ? "bg-gray-100 text-gray-400 cursor-not-allowed border"
                : "bg-yellow-500 hover:bg-yellow-600 text-white"
            }`}
          >
            {loading
              ? "Processing..."
              : currentPriceId === PADDLE_PRICES.PRO
                ? "Current: Pro"
                : "Downgrade to Pro"}
          </button>
        </div>
      )}
    </div>
  );
}
