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
        price: "price_1RezKx4gdP9i8VnsEXGX8C3n", // your default plan
        quantity: 1,
      },
    ],
    // subscription_data: {
    //   trial_period_days: 7,
    // },
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
export async function upgradeSubscriptionSession(priceId: string) {
  // 1. Get current subscription
  const subscriptions = await stripe.subscriptions.list({
    customer: "cus_SZ17krZ3LGAZaj",
    status: "active", // Only get active subscriptions
    limit: 1, // Assuming one active subscription per customer for simplicity
  });
  if (!subscriptions.data.length) {
    throw new Error("No active subscription found for this customer.");
  }

  const subscription = subscriptions.data[0];
  const subscriptionId = subscription.id; // Get the actual ID

  // 2. Get the current item to replace
  const currentItemId = subscription.items.data[0]?.id;
  if (!currentItemId) throw new Error("No subscription item found");

  // 3. Update the subscription to use the new price
  const updated = await stripe.subscriptions.update(subscriptionId, {
    items: [
      {
        id: currentItemId,
        price: priceId,
      },
    ],
    proration_behavior: "always_invoice",
  });
  return {
    success: true,
    subscriptionId: updated.id,
    status: updated.status,
  };
}
