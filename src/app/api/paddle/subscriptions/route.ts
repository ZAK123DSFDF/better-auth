import { Paddle, Environment } from "@paddle/paddle-node-sdk";
import { NextResponse } from "next/server";

const paddle = new Paddle(process.env.PADDLE_VENDOR_ID!, {
  environment: Environment.sandbox, // or .production
});

// PATCH: /api/paddle/subscriptions
export async function PATCH(req: Request) {
  const { subscriptionId, newPriceId } = await req.json();

  if (!subscriptionId || !newPriceId) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  try {
    // 1️⃣ Fetch current subscription
    const subs = await paddle.subscriptions.get(subscriptionId);
    const existingItems = subs.items;
    if (!existingItems || existingItems.length === 0) {
      return NextResponse.json(
        { error: "No subscription items found" },
        { status: 400 },
      );
    }

    // 2️⃣ Replace the base item price
    const items = existingItems.map((item: any) => ({
      subscriptionItemId: item.id,
      priceId: item.isBase ? newPriceId : item.price.id,
      quantity: item.quantity,
    }));

    // 3️⃣ Apply update via SDK
    const updated = await paddle.subscriptions.update(subscriptionId, {
      items,
      prorationBillingMode: "prorated_immediately", // choose desired behavior
    });

    return NextResponse.json({ success: true, subscription: updated });
  } catch (err: any) {
    console.error("Paddle update error:", err);
    return NextResponse.json(
      { error: err.message || "Update failed" },
      { status: 500 },
    );
  }
}
