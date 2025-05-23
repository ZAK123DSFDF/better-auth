// app/api/checkout/route.ts
import { NextResponse } from "next/server";

const LEMON_SQUEEZY_ENDPOINT = "https://api.lemonsqueezy.com/v1/";

export async function POST(req: Request) {
  try {
    // Create checkout with fetch
    const response = await fetch(`${LEMON_SQUEEZY_ENDPOINT}checkouts`, {
      method: "POST",
      headers: {
        Accept: "application/vnd.api+json",
        "Content-Type": "application/vnd.api+json",
        Authorization: `Bearer ${process.env.LEMON_SQUEEZY_API_KEY}`,
      },
      body: JSON.stringify({
        data: {
          type: "checkouts",
          attributes: {
            checkout_data: {
              custom: {
                email: "zakLemon@gmail.com",
                name: "zakLemon",
              },
            },
          },
          relationships: {
            store: {
              data: {
                type: "stores",
                id: process.env.LEMON_SQUEEZY_STORE_ID,
              },
            },
            variant: {
              data: {
                type: "variants",
                id: "806035",
              },
            },
          },
        },
      }),
    });

    // Handle non-OK responses
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to create checkout");
    }

    // Parse the successful response
    const responseData = await response.json();
    const checkoutUrl = responseData.data.attributes.url;

    return NextResponse.json({ checkoutUrl });
  } catch (error: any) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { message: error.message || "An error occurred" },
      { status: 500 },
    );
  }
}
