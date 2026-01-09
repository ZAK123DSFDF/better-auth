// lib/paddle.ts
import { Environment, Paddle } from "@paddle/paddle-node-sdk";

const paddle = new Paddle(process.env.PADDLE_API_KEY!, {
  environment: Environment.sandbox,
});

// lib/paddle.ts
export async function getSubscriptionByEmail(email: string) {
  try {
    const customerCollection = paddle.customers.list({ email: [email] });
    const customers = await customerCollection.next();
    if (!customers || customers.length === 0) return null;

    const subCollection = paddle.subscriptions.list({
      customerId: [customers[0].id],
      status: ["active", "trialing"],
    });
    const subscriptions = await subCollection.next();

    if (subscriptions.length > 0) {
      const sub = subscriptions[0];
      return {
        id: sub.id,
        // Grab the priceId from the first item in the subscription
        priceId: sub.items[0].price.id,
      };
    }
    return null;
  } catch (error) {
    return null;
  }
}
