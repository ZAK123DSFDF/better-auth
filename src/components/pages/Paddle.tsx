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

  const handleCheckout = () => {
    if (!paddle) return alert("Paddle not initialized");

    paddle.Checkout.open({
      items: [{ priceId: "pri_01jvacqbrzfrps2mm91sxdraf5", quantity: 1 }],
      settings: {
        displayMode: "overlay",
        theme: "light",
        successUrl: "http://localhost:3000/success",
      },
    });
  };
  const handleCheckoutServer = async () => {
    if (!paddle) return alert("Paddle not initialized");

    const response = await fetch("/api/paddle");
    const data = await response.json();
    paddle.Checkout.open({
      transactionId: data.txn.id,
      settings: {
        displayMode: "inline",
        theme: "light",
        successUrl: "http://localhost:3000/success",
      },
    });
  };
  return (
    <>
      <button
        className="bg-blue-500 text-white px-4 py-2 rounded-md"
        onClick={handleCheckout}
      >
        Proceed to payment
      </button>
      <button
        onClick={() => handleCheckoutServer()}
        className="bg-blue-500 text-white px-4 py-2 rounded"
        disabled={isLoading}
      >
        Buy Now
      </button>
    </>
  );
}
