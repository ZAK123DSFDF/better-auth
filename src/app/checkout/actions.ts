"use server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function createCheckoutSession() {
  // Determine environment
  const isProduction = process.env.NODE_ENV === "production";

  // Set base URLs
  const productionBaseUrl = "https://better-auth-pi.vercel.app";
  const localBaseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  const baseUrl = isProduction ? productionBaseUrl : localBaseUrl;

  const session = await stripe.checkout.sessions.create(
    {
      payment_method_types: ["card"],
      line_items: [
        {
          price: "price_1RMUAhReh9FhC0f7jHIMczA2",
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${baseUrl}/success`,
      cancel_url: `${baseUrl}/cancel`,
      metadata: {
        email: "zakStripe@gmail.com",
        name: "zakStripe",
      },
    },
    {
      stripeAccount: "acct_1RMSPjReh9FhC0f7",
    },
  );

  return { url: session.url };
}
