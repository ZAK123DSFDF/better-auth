import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const payload = await request.text(); // Get raw text first
    const signature = request.headers.get("Paddle-Signature");

    if (!process.env.PADDLE_WEBHOOK_PUBLIC_KEY || !signature) {
      return NextResponse.json(
        { error: "Missing webhook configuration" },
        { status: 400 },
      );
    }

    // 1. Properly format the public key
    const publicKey = process.env.PADDLE_WEBHOOK_PUBLIC_KEY.replace(
      /-----BEGIN PUBLIC KEY-----/,
      "",
    )
      .replace(/-----END PUBLIC KEY-----/, "")
      .replace(/\n/g, "")
      .trim();

    const key = `-----BEGIN PUBLIC KEY-----\n${publicKey}\n-----END PUBLIC KEY-----`;

    // 2. Verify using the raw payload text (not parsed JSON)
    const verifier = crypto.createVerify("sha1");
    verifier.update(payload);

    const isValid = verifier.verify(key, signature, "base64");

    if (!isValid) {
      console.error("⚠️ Invalid Paddle signature!");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // 3. Now parse the JSON payload
    const jsonPayload = JSON.parse(payload);

    // Process events...
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
