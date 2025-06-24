"use client";

import { initializePaddle, Paddle } from "@paddle/paddle-js";
import { useEffect, useState } from "react";

export default function Payment() {
  const [paddle, setPaddle] = useState<Paddle>();
  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    initializePaddle({
      environment: "sandbox",
      token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN!,
    }).then((paddle) => setPaddle(paddle));
  }, []);

  const handleCheckout = () => {
    if (!paddle) return alert("Paddle not initialized");

    const successUrl =
      process.env.NODE_ENV === "production"
        ? "https://better-auth-pi.vercel.app/success"
        : `${process.env.NEXT_PUBLIC_BASE_URL}/success`;

    const priceId = "pri_01jye2b5ynwxg3ne9j3dr2zs7a"; // <--- your main subscription price ID

    paddle.Checkout.open({
      items: [{ priceId, quantity: 1 }],
      customData: {
        email: "zakFront@gmail.com",
        name: "zak123",
      },
      settings: {
        displayMode: "overlay",
        theme: "light",
        successUrl,
      },
    });
  };

  const handleCheckoutServer = async () => {
    const successUrl =
      process.env.NODE_ENV === "production"
        ? "https://better-auth-pi.vercel.app/success"
        : `${process.env.NEXT_PUBLIC_BASE_URL}/success`;

    if (!paddle) return alert("Paddle not initialized");

    const response = await fetch("/api/paddle");
    const data = await response.json();

    paddle.Checkout.open({
      transactionId: data.txn.id,
      customData: {
        email: "zakFront@gmail.com",
        name: "zak123",
      },
      settings: {
        displayMode: "inline",
        theme: "light",
        successUrl,
      },
    });
  };

  const changePlan = async (newPriceId: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/paddle/subscriptions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscriptionId: "sub_01jxxd8sbpg4pjzz7radr6tmb6",
          newPriceId,
        }),
      });
      const json = await res.json();
      if (json.success) alert("Subscription changed!");
      else alert("Error: " + json.error);
    } catch {
      alert("Request failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        className="bg-blue-500 text-white px-4 py-2 rounded-md"
        onClick={handleCheckout}
      >
        Checkout
      </button>

      <button
        onClick={handleCheckout}
        className="bg-purple-500 text-white px-4 py-2 rounded-md"
      >
        One-Time Payment
      </button>

      <button
        onClick={handleCheckoutServer}
        className="bg-blue-500 text-white px-4 py-2 rounded"
        disabled={isLoading}
      >
        Buy Now (Server Checkout)
      </button>

      <div className="flex flex-col gap-3">
        <button
          onClick={() => changePlan("pri_01jxskax9ehjnvqh35dhm58b7g")}
          disabled={loading}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          {loading ? "Processing..." : "Upgrade Plan"}
        </button>

        <button
          onClick={() => changePlan("pri_01jxsasw3hby3ncb1tff4wc0n8")}
          disabled={loading}
          className="bg-yellow-600 text-white px-4 py-2 rounded"
        >
          {loading ? "Processing..." : "Downgrade Plan"}
        </button>
      </div>
    </>
  );
}
