"use server";

import Stripe from "stripe";
import { cookies } from "next/headers";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-04-30.basil",
});

const isProduction = process.env.NODE_ENV === "production";
const productionBaseUrl = "https://better-auth-pi.vercel.app";
const localBaseUrl =
  process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
const baseUrl = isProduction ? productionBaseUrl : localBaseUrl;
async function getStripeCustomerByEmail(email: string) {
  const customers = await stripe.customers.list({
    email: email,
    limit: 1,
  });

  if (customers.data.length === 0) {
    return null;
  }
  return customers.data[0];
}
export async function getUserSubscription(email: string) {
  const customer = await getStripeCustomerByEmail(email);

  if (!customer) return { subscribed: false, currentPriceId: null };

  const subscriptions = await stripe.subscriptions.list({
    customer: customer.id,
    status: "active",
    limit: 1,
  });

  if (subscriptions.data.length > 0) {
    return {
      subscribed: true,
      currentPriceId: subscriptions.data[0].items.data[0].price.id,
    };
  }

  return { subscribed: false, currentPriceId: null };
}
// 🟦 Buy New Subscription
export async function createCheckoutSession(
  userEmail: string,
  priceId?: string,
  trialDays?: number,
) {
  const cookieStore = await cookies();
  const affiliateCookie = cookieStore.get("refearnapp_affiliate_cookie");

  const mode = priceId ? "subscription" : "payment";
  const price = priceId || "price_1RZyPg4gdP9i8VnsQGLV99nS";

  // 1. Prepare the affiliate code
  const affiliateCode = affiliateCookie
    ? decodeURIComponent(affiliateCookie.value)
    : null;

  const session = await stripe.checkout.sessions.create({
    customer_email: userEmail,
    payment_method_types: ["card"],
    mode: mode,
    line_items: [{ price: price, quantity: 1 }],
    success_url: `${baseUrl}/success`,
    cancel_url: `${baseUrl}/cancel`,

    // ✅ Top-level metadata (This is what checkout.session.completed looks at)
    metadata: {
      refearnapp_affiliate_code: affiliateCode,
    },
    discounts: [{ coupon: "68OZLVWo" }],
    // ✅ Subscription specific settings (Trial)
    subscription_data:
      mode === "subscription"
        ? {
            trial_period_days:
              trialDays && trialDays > 0 ? trialDays : undefined,
            // Optional: Also put it here if you want it on the Subscription object in Stripe Dashboard
            metadata: {
              refearnapp_affiliate_code: affiliateCode,
            },
          }
        : undefined,
  });

  return { url: session.url };
}

// 🟩 Upgrade Subscription
export async function upgradeSubscriptionSession(
  email: string,
  newPriceId: string,
) {
  const customer = await getStripeCustomerByEmail(email);

  if (!customer) throw new Error("Customer not found in Stripe");

  const subscriptions = await stripe.subscriptions.list({
    customer: customer.id,
    status: "active",
    limit: 1,
  });

  if (!subscriptions.data.length) throw new Error("No active subscription");

  const subscription = subscriptions.data[0];
  const currentItemId = subscription.items.data[0].id;

  const updated = await stripe.subscriptions.update(subscription.id, {
    items: [{ id: currentItemId, price: newPriceId }],
    proration_behavior: "always_invoice",
  });

  return { success: true, subscriptionId: updated.id, status: updated.status };
}
