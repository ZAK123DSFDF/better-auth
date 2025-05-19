import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const payload = await request.text();
    const signature = request.headers.get("Paddle-Signature");

    if (!process.env.PADDLE_WEBHOOK_PUBLIC_KEY || !signature) {
      return NextResponse.json(
        { error: "Missing webhook configuration" },
        { status: 400 },
      );
    }

    const key = process.env.PADDLE_WEBHOOK_PUBLIC_KEY;

    const verifier = crypto.createVerify("sha1");
    verifier.update(payload);
    verifier.end();

    const isValid = verifier.verify(key, signature, "base64");

    if (!isValid) {
      console.error("⚠️ Invalid Paddle signature!");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const jsonPayload = JSON.parse(payload);
    console.log("🔔 Paddle event:", jsonPayload.event_type);

    switch (jsonPayload.event_type) {
      case "subscription.created":
        console.log("New subscription:", jsonPayload.data.id);
        break;
      case "transaction.completed":
        console.log("Payment completed:", jsonPayload.data.id);
        break;
      default:
        console.log("Unhandled event type:", jsonPayload.event_type);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err) {
    console.error("Error processing Paddle webhook:", err);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 400 },
    );
  }
}
