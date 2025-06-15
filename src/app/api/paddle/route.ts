import { Environment, Paddle } from "@paddle/paddle-node-sdk";
import { NextResponse } from "next/server";
const paddle = new Paddle(process.env.NEXT_PUBLIC_PADDLE_VENDOR_ID!, {
  environment: Environment.sandbox,
});

export async function GET(req: Request) {
  // 30 usd txn

  const txn = await paddle.transactions.create({
    items: [
      {
        quantity: 1,
        priceId: "pri_01jxsasw3hby3ncb1tff4wc0n8",
      },
    ],
    customData: {
      name: "zak",
      email: "zakFront@gmail.com",
    },
  });

  console.log(txn);

  return NextResponse.json({ txn });
}
