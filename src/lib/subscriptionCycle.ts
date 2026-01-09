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
 * Now dynamically calculates the price from the actual subscription items.
 */
async function createSimulation(fullSubscriptionPayload: any, cycles: number) {
  // 1. Calculate the total recurring price from the subscription items
  // Paddle unit_price.amount is in the lowest denomination (e.g., cents)
  const totalAmountCents = fullSubscriptionPayload.items.reduce(
    (sum: number, item: any) => {
      const amount = parseInt(item.price.unit_price.amount || "0");
      const quantity = item.quantity || 1;
      return sum + amount * quantity;
    },
    0,
  );

  // 2. Prepare the mock transaction.completed payload
  const mockTransactionPayload = {
    id: `txn_sim_${Date.now()}`,
    status: "completed",
    customer_id: fullSubscriptionPayload.customer_id,
    subscription_id: fullSubscriptionPayload.id,
    created_at: new Date().toISOString(),
    details: {
      totals: {
        currency_code: fullSubscriptionPayload.currency_code || "USD",
        // Pass the calculated total as a string (e.g., "2900" for $29.00)
        total: totalAmountCents.toString(),
      },
    },
    // IMPORTANT: Your webhook relies on this to find the affiliate!
    custom_data: fullSubscriptionPayload.custom_data || {},
  };

  const payload = {
    notification_setting_id: NOTIFICATION_SETTING_ID,
    name: `Simulate Renewal ($${(totalAmountCents / 100).toFixed(2)}) - ${Date.now()}`,
    type: "transaction.completed", // Now matches your webhook switch case
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

async function runSimulation(simulationId: string) {
  // 1. Start the run
  const res = await fetch(`${PADDLE_API}/simulations/${simulationId}/runs`, {
    method: "POST",
    headers: { Authorization: `Bearer ${API_KEY}` },
  });
  const json = await res.json();
  const runId = json.data.id;

  console.log(`⏳ Run ${runId} started. Waiting for delivery...`);

  // 2. Poll for completion
  let status = "pending";
  let attempts = 0;

  while ((status === "pending" || status === "in_progress") && attempts < 10) {
    await new Promise((r) => setTimeout(r, 2000)); // Wait 2 seconds

    const checkRes = await fetch(
      `${PADDLE_API}/simulations/${simulationId}/runs/${runId}`,
      {
        headers: { Authorization: `Bearer ${API_KEY}` },
      },
    );
    const checkJson = await checkRes.json();
    status = checkJson.data.status;
    attempts++;

    console.log(`... Current Status: ${status}`);
  }

  // 3. Fetch the delivery logs for this specific run
  const logRes = await fetch(
    `${PADDLE_API}/simulations/${simulationId}/runs/${runId}/events`,
    {
      headers: { Authorization: `Bearer ${API_KEY}` },
    },
  );
  const logJson = await logRes.json();
  const delivery = logJson.data[0];

  if (delivery?.response) {
    console.log(`\n📡 Webhook Target: ${delivery.request.url}`);
    console.log(`📥 Server Response Code: ${delivery.response.status_code}`);
    console.log(`💬 Server Response Body: ${delivery.response.body}`);
  }

  return status;
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
  console.log(`\n🎉 Simulation complete! Status: ${result}`);
}

main().catch((err) => console.error("\n❌ Error:", err.message));
