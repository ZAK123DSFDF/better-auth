// app/checkout/page.tsx
"use client";
import { createCheckoutSession } from "./actions";

export default function CheckoutPage() {
  async function handleCheckout() {
    const { url } = await createCheckoutSession();
    window.location.href = url!;
  }

  return (
    <button
      onClick={handleCheckout}
      className="bg-blue-500 text-white px-4 py-2 rounded"
    >
      Buy Now
    </button>
  );
}
