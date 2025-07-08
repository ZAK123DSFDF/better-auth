import { Environment, Paddle } from "@paddle/paddle-node-sdk";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
const paddle = new Paddle(process.env.NEXT_PUBLIC_PADDLE_VENDOR_ID!, {
  environment: Environment.sandbox,
});

export async function GET(req: Request) {
  // 30 usd txn
  const cookieStore = await cookies();
  const affiliateCookie = cookieStore.get("affiliate_data");
  const txn = await paddle.transactions.create({
    items: [
      {
        quantity: 1,
        priceId: "pri_01jxsasw3hby3ncb1tff4wc0n8",
      },
    ],
    customData: {
      refearnapp_affiliate_code: affiliateCookie
        ? decodeURIComponent(affiliateCookie.value)
        : null,
    },
  });

  console.log(txn);

  return NextResponse.json({ txn });
}
