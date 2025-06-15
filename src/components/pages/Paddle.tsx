"use client";

import { initializePaddle, Paddle } from "@paddle/paddle-js";
import { useEffect, useState } from "react";

export default function Payment() {
  const [paddle, setPaddle] = useState<Paddle>();
  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    initializePaddle({
      environment: "sandbox",
      token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN!,
    }).then((paddle) => setPaddle(paddle));
  }, []);

  const handleCheckout = (
    data: "withExpiration" | "withoutExpiration" | "one-time",
  ) => {
    if (!paddle) return alert("Paddle not initialized");

    const successUrl =
      process.env.NODE_ENV === "production"
        ? "https://better-auth-pi.vercel.app/success"
        : `${process.env.NEXT_PUBLIC_BASE_URL}/success`;

    let priceId = "";
    let customData: Record<string, any> = {
      email: "zakFront@gmail.com",
      name: "zak123",
    };

    if (data === "withExpiration") {
      priceId = "pri_01jxtqtvy1cdetz560tbvbk2ds"; // replace with actual with-expiration price ID
      customData.expiration = true;
    } else if (data === "withoutExpiration") {
      priceId = "pri_01jxsasw3hby3ncb1tff4wc0n8"; // replace with without-expiration price ID
      customData.expiration = false;
    } else if (data === "one-time") {
      priceId = "pri_01jvacqbrzfrps2mm91sxdraf5"; // replace with actual one-time price ID
    }

    paddle.Checkout.open({
      items: [{ priceId, quantity: 1 }],
      customData,
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

  return (
    <>
      <button
        className="bg-blue-500 text-white px-4 py-2 rounded-md"
        onClick={() => handleCheckout("withoutExpiration")}
      >
        Subscription (No Expiration)
      </button>

      <button
        onClick={() => handleCheckout("withExpiration")}
        className="bg-green-500 text-white px-4 py-2 rounded-md"
      >
        Subscription (With Expiration)
      </button>

      <button
        onClick={() => handleCheckout("one-time")}
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
    </>
  );
}
