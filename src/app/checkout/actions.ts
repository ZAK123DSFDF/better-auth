// app/checkout/actions.ts
"use server";

// @ts-ignore
import Stripe from "stripe";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function createCheckoutSession() {
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
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/cancel`,
      metadata: {
        email: "zakStripe@gmail.com",
        name: "zakStripe",
      },
    },
    {
      stripeAccount: "acct_1RMSPjReh9FhC0f7", // Critical addition
    },
  );

  return { url: session.url };
}
