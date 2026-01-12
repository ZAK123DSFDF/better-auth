import { runSimulation } from "@/lib/paddle-test-utils";

const PADDLE_API = "https://sandbox-api.paddle.com";
const API_KEY = process.env.PADDLE_API_KEY!;
const NOTIFICATION_SETTING_ID = process.env.PADDLE_NOTIFICATION_SETTING_ID!;
const TEST_EMAIL = "zak@gmail.com";

/**
 * 1. Find the Subscription ID by Email (No DB needed)
 */
async function getSubscriptionIdByEmail(email: string) {
  console.log(`🔍 Searching for customer: ${email}...`);

  // Find Customer
  const customerRes = await fetch(`${PADDLE_API}/customers?email=${email}`, {
    headers: { Authorization: `Bearer ${API_KEY}` },
  });
  const customerJson = await customerRes.json();

  if (!customerJson.data || customerJson.data.length === 0) {
    throw new Error(`❌ No customer found for email: ${email}`);
  }

  const customerId = customerJson.data[0].id;

  // Find Active Subscription
  const subRes = await fetch(
    `${PADDLE_API}/subscriptions?customer_id=${customerId}&status=active`,
    {
      headers: { Authorization: `Bearer ${API_KEY}` },
    },
  );
  const subJson = await subRes.json();

  if (!subJson.data || subJson.data.length === 0) {
    throw new Error(
      `❌ No active subscription found for customer ID: ${customerId}`,
    );
  }

  return subJson.data[0].id;
}

/**
 * 2. Fetch the full live payload from Paddle
 */
async function getPaddleSubscription(subscriptionId: string) {
  const res = await fetch(`${PADDLE_API}/subscriptions/${subscriptionId}`, {
    headers: { Authorization: `Bearer ${API_KEY}` },
  });
  const json = await res.json();
  return json.data;
}

// ... helper addCycles remains the same ...
function addCycles(date: Date, type: "MONTHLY" | "YEARLY", cycles: number) {
  const newDate = new Date(date);
  if (type === "YEARLY") newDate.setFullYear(newDate.getFullYear() + cycles);
  else newDate.setMonth(newDate.getMonth() + cycles);
  return newDate;
}

/**
 * 3. Create Simulation (The Webhook "Mock")
 */
async function createSimulation(fullSubscriptionPayload: any) {
  const totalAmountCents = fullSubscriptionPayload.items.reduce(
    (sum: number, item: any) => {
      const amount = parseInt(item.price.unit_price.amount || "0");
      const quantity = item.quantity || 1;
      return sum + amount * quantity;
    },
    0,
  );

  // ✅ Generate a valid 26-char hex string for Paddle validation
  const validId =
    "txn_" +
    [...Array(26)]
      .map(() => Math.floor(Math.random() * 16).toString(16))
      .join("");

  const mockTransactionPayload = {
    id: validId, // Use the regex-compliant ID
    status: "completed",
    customer_id: fullSubscriptionPayload.customer_id,
    subscription_id: fullSubscriptionPayload.id,
    created_at: new Date().toISOString(),
    details: {
      totals: {
        currency_code: fullSubscriptionPayload.currency_code || "USD",
        total: totalAmountCents.toString(),
      },
    },
    custom_data: fullSubscriptionPayload.custom_data || {},
  };

  const payload = {
    notification_setting_id: NOTIFICATION_SETTING_ID,
    name: `Simulate Renewal ($${(totalAmountCents / 100).toFixed(2)}) - ${Date.now()}`,
    type: "transaction.completed",
    payload: mockTransactionPayload,
  };

  const res = await fetch(`${PADDLE_API}/simulations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  const json = await res.json();
  if (!json.data) throw new Error("Simulation failed: " + JSON.stringify(json));

  console.log(
    `💰 Calculated Subscription Total: $${(totalAmountCents / 100).toFixed(2)}`,
  );
  return json.data.id;
}
async function main() {
  const cycles = Number(process.argv[2]) || 1;

  // Step 1: Get ID from Email
  const subId = await getSubscriptionIdByEmail(TEST_EMAIL);
  console.log(`✅ Found Subscription ID: ${subId}`);

  // Step 2: Get Live Data
  const livePaddleSub = await getPaddleSubscription(subId);
  const currentNextBill = new Date(livePaddleSub.next_billed_at);
  const interval = livePaddleSub.billing_cycle.interval;

  const newNextBill = addCycles(
    currentNextBill,
    interval === "year" ? "YEARLY" : "MONTHLY",
    cycles,
  );

  const periodStart = currentNextBill.toISOString();
  const periodEnd = newNextBill.toISOString();

  // Step 3: Prepare Payload
  const simulationPayload = {
    ...livePaddleSub,
    next_billed_at: periodEnd,
    current_billing_period: {
      starts_at: periodStart,
      ends_at: periodEnd,
    },
  };

  // Step 4: Run
  const simId = await createSimulation(simulationPayload);
  console.log(`🚀 Simulation created: ${simId}`);

  const result = await runSimulation(simId);
  console.log(`\n🎉 Simulation complete! Status: ${result}`);
}

main().catch((err) => console.error("\n❌ Error:", err.message));
