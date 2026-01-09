// app/api/paddle/subscriptions/route.ts
import {
  Paddle,
  Environment,
  ProrationBillingMode,
} from "@paddle/paddle-node-sdk";
import { NextResponse } from "next/server";

const paddle = new Paddle(process.env.PADDLE_API_KEY!, {
  environment: Environment.sandbox, // or .production
});

export async function PATCH(req: Request) {
  const { subscriptionId, newPriceId } = await req.json();

  if (!subscriptionId || !newPriceId) {
    return NextResponse.json(
      { error: "Missing subscriptionId or newPriceId" },
      { status: 400 },
    );
  }

  try {
    // 1. Verify the new price exists
    try {
      await paddle.prices.get(newPriceId);
    } catch {
      return NextResponse.json({ error: "Invalid price ID" }, { status: 400 });
    }

    // 2. Get current subscription
    const subscription = await paddle.subscriptions.get(subscriptionId);
    const currentItems = subscription.items;

    if (!currentItems || currentItems.length === 0) {
      return NextResponse.json(
        { error: "No subscription items found" },
        { status: 400 },
      );
    }

    // 3. Prepare update - assumes single item subscription
    const updatePayload = {
      items: [
        {
          priceId: newPriceId,
          quantity: 1,
        },
      ],
      prorationBillingMode: "prorated_immediately" as ProrationBillingMode,
    };
    // 5. Apply the actual update
    const updatedSubscription = await paddle.subscriptions.update(
      subscriptionId,
      updatePayload,
    );

    return NextResponse.json({
      success: true,
      subscription: updatedSubscription,
    });
  } catch (err: any) {
    console.error("Paddle update error:", err);
    // Extract Paddle API error details if available
    const errorDetails = err.response?.data?.error || err.message;
    return NextResponse.json(
      { error: "Update failed", details: errorDetails },
      { status: 500 },
    );
  }
}
