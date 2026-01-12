import { runSimulation } from "@/lib/paddle-test-utils";

const PADDLE_API = "https://sandbox-api.paddle.com";
const API_KEY = process.env.PADDLE_API_KEY!;
const NOTIFICATION_SETTING_ID = process.env.PADDLE_NOTIFICATION_SETTING_ID!;
const TEST_EMAIL = "zak@gmail.com";

async function getSubscriptionIdByEmail(email: string) {
  const customerRes = await fetch(`${PADDLE_API}/customers?email=${email}`, {
    headers: { Authorization: `Bearer ${API_KEY}` },
  });
  const customerJson = await customerRes.json();
  if (!customerJson.data?.length) throw new Error(`❌ No customer: ${email}`);

  const customerId = customerJson.data[0].id;

  // ✅ Fix: Include trialing in the status filter
  const subRes = await fetch(
    `${PADDLE_API}/subscriptions?customer_id=${customerId}&status=active,trialing`,
    {
      headers: { Authorization: `Bearer ${API_KEY}` },
    },
  );

  const subJson = await subRes.json();

  // Update error message to be more accurate
  if (!subJson.data?.length)
    throw new Error(
      `❌ No active or trialing sub found for customer ID: ${customerId}`,
    );

  return subJson.data[0].id;
}

async function getPaddleSubscription(subscriptionId: string) {
  const res = await fetch(`${PADDLE_API}/subscriptions/${subscriptionId}`, {
    headers: { Authorization: `Bearer ${API_KEY}` },
  });
  const json = await res.json();
  return json.data;
}

/**
 * Logic to skip trial:
 * We take 'Today' as the start, and move the Next Bill 1 month from 'Today'
 */
function skipTrialDates(interval: "month" | "year") {
  const now = new Date();
  const nextBill = new Date(now);
  if (interval === "year") nextBill.setFullYear(now.getFullYear() + 1);
  else nextBill.setMonth(now.getMonth() + 1);

  return {
    startsAt: now.toISOString(),
    endsAt: nextBill.toISOString(),
  };
}

async function createSimulation(type: string, payload: any, name: string) {
  const res = await fetch(`${PADDLE_API}/simulations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      notification_setting_id: NOTIFICATION_SETTING_ID,
      name: `${name} - ${Date.now()}`,
      type,
      payload,
    }),
  });
  const json = await res.json();
  if (!json.data) throw new Error(`Simulation Failed: ${JSON.stringify(json)}`);
  return json.data.id;
}

async function main() {
  try {
    const subId = await getSubscriptionIdByEmail(TEST_EMAIL);
    const liveSub = await getPaddleSubscription(subId);

    // 1. Calculate dates as if trial ended RIGHT NOW
    const { startsAt, endsAt } = skipTrialDates(liveSub.billing_cycle.interval);

    console.log(
      `🚀 Skipping trial. New Billing Period: ${startsAt} to ${endsAt}`,
    );

    // 2. Prepare Transaction Payload (The "Charge")
    const totalAmount = liveSub.items.reduce(
      (sum: number, i: any) =>
        sum + parseInt(i.price.unit_price.amount) * (i.quantity || 1),
      0,
    );

    const transactionPayload = {
      id:
        "txn_" +
        [...Array(26)]
          .map(() => Math.floor(Math.random() * 16).toString(16))
          .join(""),
      status: "completed",
      customer_id: liveSub.customer_id,
      subscription_id: liveSub.id,
      created_at: startsAt, // Charged right now
      current_billing_period: { starts_at: startsAt, ends_at: endsAt },
      details: {
        totals: {
          currency_code: liveSub.currency_code,
          total: totalAmount.toString(),
        },
      },
      custom_data: liveSub.custom_data,
    };

    // 3. Prepare Subscription Update (The "Status Change")
    const subscriptionPayload = {
      ...liveSub,
      status: "active", // Change from 'trialing' to 'active'
      next_billed_at: endsAt,
      current_billing_period: { starts_at: startsAt, ends_at: endsAt },
    };

    console.log("📡 Sending Transaction (Charge)...");
    const txSimId = await createSimulation(
      "transaction.completed",
      transactionPayload,
      "Trial Skip - Charge",
    );
    await runSimulation(txSimId);

    console.log("📡 Sending Subscription Update (Dates)...");
    const subSimId = await createSimulation(
      "subscription.updated",
      subscriptionPayload,
      "Trial Skip - Date Update",
    );
    await runSimulation(subSimId);

    console.log("\n✅ Trial skipped and user 'charged' successfully!");
  } catch (err: any) {
    console.error("\n❌ Error:", err.message);
  }
}

main().then(() => console.log("done"));
