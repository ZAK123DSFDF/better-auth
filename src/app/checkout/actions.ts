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
export async function getPriceDiscounts(priceId: string) {
  if (!priceId) return [];

  // 1. Get the product ID for this specific price
  const price = await stripe.prices.retrieve(priceId);
  const productId = price.product as string;

  // 2. Fetch active promo codes and expand the coupon rules
  const promoCodes = await stripe.promotionCodes.list({
    active: true,
    expand: ["data.coupon.applies_to"],
    limit: 10,
  });

  // 3. Filter: Only return codes that apply to this product OR apply to everything
  return promoCodes.data
    .filter((p) => {
      const appliesTo = p.coupon.applies_to;
      // If applies_to is null, it works for all products
      if (!appliesTo || !appliesTo.products) return true;
      return appliesTo.products.includes(productId);
    })
    .map((p) => ({
      id: p.id,
      code: p.code,
      couponId: p.coupon.id,
      name: p.coupon.name || p.code,
      percentOff: p.coupon.percent_off,
    }));
}
// 🟦 Buy New Subscription
export async function createCheckoutSession(
  userEmail: string,
  priceId?: string,
  trialDays?: number,
  selectedPromoCode?: string,
) {
  const cookieStore = await cookies();
  const affiliateCookie = cookieStore.get("refearnapp_affiliate_cookie");

  const mode = priceId ? "subscription" : "payment";
  const price = priceId || "price_1RZyPg4gdP9i8VnsQGLV99nS";

  // 1. Resolve the Affiliate Code from Cookie
  const affiliateCode = affiliateCookie
    ? decodeURIComponent(affiliateCookie.value)
    : null;

  // 2. Try to find a matching promo code that is valid for this price
  let promoToApply: string | null = null;

  if (selectedPromoCode) {
    const validPromosForThisPrice = await getPriceDiscounts(price);
    const match = validPromosForThisPrice.find(
      (p) => p.code === selectedPromoCode,
    );
    if (match) {
      promoToApply = match.id; // Use the promo_... ID
    }
  }

  // 3. Create the Session
  const session = await stripe.checkout.sessions.create({
    customer_email: userEmail,
    payment_method_types: ["card"],
    mode: mode,
    line_items: [{ price: price, quantity: 1 }],
    success_url: `${baseUrl}/success`,
    cancel_url: `${baseUrl}/cancel`,
    metadata: {
      refearnapp_affiliate_code: affiliateCode,
    },

    // ✅ Switch: Apply specific code if valid, otherwise enable manual box
    ...(promoToApply
      ? { discounts: [{ promotion_code: promoToApply }] }
      : { allow_promotion_codes: true }),

    subscription_data:
      mode === "subscription"
        ? {
            trial_period_days:
              trialDays && trialDays > 0 ? trialDays : undefined,
            metadata: { refearnapp_affiliate_code: affiliateCode },
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
