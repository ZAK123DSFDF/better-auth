import "dotenv/config";

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
async function createSimulation(fullSubscriptionPayload: any, cycles: number) {
  const payload = {
    notification_setting_id: NOTIFICATION_SETTING_ID,
    name: `Simulate ${cycles} cycle(s) - ${Date.now()}`,
    type: "subscription.updated", // This triggers your webhook
    payload: fullSubscriptionPayload,
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
  if (!json.data)
    throw new Error("Failed to create simulation: " + JSON.stringify(json));
  return json.data.id;
}

async function runSimulation(simulationId: string) {
  const res = await fetch(`${PADDLE_API}/simulations/${simulationId}/runs`, {
    method: "POST",
    headers: { Authorization: `Bearer ${API_KEY}` },
  });
  const json = await res.json();
  return json.data;
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
  const simId = await createSimulation(simulationPayload, cycles);
  console.log(`🚀 Simulation created: ${simId}`);

  const result = await runSimulation(simId);
  console.log(`\n🎉 Simulation complete! Status: ${result.status}`);
}

main().catch((err) => console.error("\n❌ Error:", err.message));
