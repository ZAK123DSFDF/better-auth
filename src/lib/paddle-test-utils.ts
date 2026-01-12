// src/lib/paddle-test-utils.ts

export const PADDLE_API = "https://sandbox-api.paddle.com";
export const API_KEY = process.env.PADDLE_API_KEY!;

/**
 * Shared logic to run a simulation and poll for its completion/delivery
 */
export async function runSimulation(simulationId: string) {
  // 1. Start the run
  const res = await fetch(`${PADDLE_API}/simulations/${simulationId}/runs`, {
    method: "POST",
    headers: { Authorization: `Bearer ${API_KEY}` },
  });
  const json = await res.json();
  const runId = json.data.id;

  console.log(`⏳ Run ${runId} started. Waiting for delivery...`);

  // 2. Poll for completion (max 10 attempts, 20 seconds total)
  let status = "pending";
  let attempts = 0;

  while ((status === "pending" || status === "in_progress") && attempts < 10) {
    await new Promise((r) => setTimeout(r, 2000));

    const checkRes = await fetch(
      `${PADDLE_API}/simulations/${simulationId}/runs/${runId}`,
      { headers: { Authorization: `Bearer ${API_KEY}` } },
    );
    const checkJson = await checkRes.json();
    status = checkJson.data.status;
    attempts++;
    console.log(`... Current Status: ${status}`);
  }

  // 3. Fetch delivery logs
  const logRes = await fetch(
    `${PADDLE_API}/simulations/${simulationId}/runs/${runId}/events`,
    { headers: { Authorization: `Bearer ${API_KEY}` } },
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

/**
 * Helper to generate valid 26-char IDs
 */
export function generatePaddleId(prefix: string) {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 26; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}_${result}`;
}
/**
 * 1. Smart Fetch: Paddle API -> Your Proxy API
 */
export async function getTransaction(transactionId: string) {
  // Try Paddle Sandbox first
  const paddleRes = await fetch(`${PADDLE_API}/transactions/${transactionId}`, {
    headers: { Authorization: `Bearer ${API_KEY}` },
  });

  const paddleJson = await paddleRes.json();
  if (paddleRes.ok && paddleJson.data) {
    return paddleJson.data;
  }

  console.log("🔍 Not in Paddle Sandbox. Checking RefearnApp API...");

  // Fallback: Your new Proxy API
  const proxyRes = await fetch(
    `https://origin.refearnapp.com/api/debug/transaction/${transactionId}`,
    {
      headers: { "x-refearn-debug-secret": process.env.DEBUG_SECRET! },
    },
  );

  const proxyJson = await proxyRes.json();

  if (!proxyRes.ok) {
    throw new Error(`Transaction ${transactionId} not found in any source.`);
  }

  // Map Proxy data to match the Paddle transaction structure
  return {
    id: proxyJson.id,
    customer_id: proxyJson.customer_id,
    subscription_id: proxyJson.subscription_id,
    details: {
      totals: {
        total: (parseFloat(proxyJson.amount) * 100).toString(),
        currency_code: proxyJson.currency,
      },
    },
  };
}
