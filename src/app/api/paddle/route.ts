import { Environment, Paddle } from "@paddle/paddle-node-sdk";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
const paddle = new Paddle(process.env.PADDLE_API_KEY!, {
  environment: Environment.sandbox,
});

export async function GET(req: Request) {
  // 30 usd txn
  const cookieStore = await cookies();
  const affiliateCookie = cookieStore.get("refearnapp_affiliate_cookie");
  const txn = await paddle.transactions.create({
    items: [
      {
        quantity: 1,
        priceId: "pri_01jyyfa12kfez7aacfxsg1sea0",
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
