"use server";

import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-04-30.basil",
});

const isProduction = process.env.NODE_ENV === "production";
const productionBaseUrl = "https://better-auth-pi.vercel.app";
const localBaseUrl =
  process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
const baseUrl = isProduction ? productionBaseUrl : localBaseUrl;

// 🟦 Buy New Subscription
export async function createCheckoutSession() {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "subscription",
    line_items: [
      {
        price: "price_1RZXfw4gdP9i8VnsO225oxSK", // your default plan
        quantity: 1,
      },
    ],
    success_url: `${baseUrl}/success`,
    cancel_url: `${baseUrl}/cancel`,
    metadata: {
      name: "Zak",
      email: "zakStripe@gmail.com",
    },
  });

  return { url: session.url };
}

// 🟩 Upgrade Subscription
export async function upgradeSubscriptionSession() {
  // 1. Get current subscription
  const subscription = await stripe.subscriptions.retrieve(
    "sub_1RadUo4gdP9i8VnssB7sAU1j",
  );

  // 2. Get the current item to replace
  const currentItemId = subscription.items.data[0]?.id;
  if (!currentItemId) throw new Error("No subscription item found");

  // 3. Update the subscription to use the new price
  const updated = await stripe.subscriptions.update(
    "sub_1RadUo4gdP9i8VnssB7sAU1j",
    {
      items: [
        {
          id: currentItemId,
          price: "price_1Raa5s4gdP9i8VnsUkSoqWsX",
        },
      ],
      proration_behavior: "create_prorations",
    },
  );
  return {
    success: true,
    subscriptionId: updated.id,
    status: updated.status,
  };
}
