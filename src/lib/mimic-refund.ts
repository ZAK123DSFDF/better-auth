import readline from "readline";
import {
  generatePaddleId,
  getTransaction,
  runSimulation,
} from "@/lib/paddle-test-utils";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
const PADDLE_API = "https://sandbox-api.paddle.com";
const API_KEY = process.env.PADDLE_API_KEY!;
const NOTIFICATION_SETTING_ID = process.env.PADDLE_NOTIFICATION_SETTING_ID!;

/**
 * 2. Create the Refund Simulation
 */
async function simulateRefund(tx: any, refundAmountCents: number) {
  const isFull = refundAmountCents === parseInt(tx.details.totals.total);

  const mockAdjustmentPayload = {
    // ✅ Generate a valid 26-character ID
    id: generatePaddleId("adj"),
    action: "refund",
    status: "approved",
    transaction_id: tx.id,
    subscription_id: tx.subscription_id,
    customer_id: tx.customer_id,
    currency_code: tx.details.totals.currency_code,
    totals: {
      total: refundAmountCents.toString(),
      currency_code: tx.details.totals.currency_code,
    },
    type: isFull ? "full" : "partial",
  };

  const payload = {
    notification_setting_id: NOTIFICATION_SETTING_ID,
    name: `Simulate ${isFull ? "Full" : "Partial"} Refund ($${(refundAmountCents / 100).toFixed(2)})`,
    type: "adjustment.updated",
    payload: mockAdjustmentPayload,
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

  // ✅ ERROR CHECK: This will tell you EXACTLY why Paddle is failing
  if (!res.ok || !json.data) {
    console.error("❌ Paddle API Error Detail:", JSON.stringify(json, null, 2));
    throw new Error(`Simulation creation failed with status ${res.status}`);
  }

  return json.data.id;
}

async function main() {
  rl.question("🆔 Enter Transaction ID to refund: ", async (txId) => {
    try {
      const tx = await getTransaction(txId);
      const maxAmountCents = parseInt(tx.details.totals.total);
      const currency = tx.details.totals.currency_code;

      console.log(
        `\n💰 Original Transaction Total: $${(maxAmountCents / 100).toFixed(2)} ${currency}`,
      );

      rl.question(
        `💸 Enter refund amount in ${currency} (Max: ${(maxAmountCents / 100).toFixed(2)}): `,
        async (inputAmount) => {
          const refundCents = Math.round(parseFloat(inputAmount) * 100);

          // ❌ Validation: Throw error if refund > total
          if (refundCents > maxAmountCents) {
            console.error(
              `\n❌ ERROR: You cannot refund more than the original transaction!`,
            );
            console.error(
              `Attempted: $${(refundCents / 100).toFixed(2)} | Max: $${(maxAmountCents / 100).toFixed(2)}`,
            );
            process.exit(1);
          }

          console.log(
            `🚀 Creating simulation for $${(refundCents / 100).toFixed(2)}...`,
          );
          const simId = await simulateRefund(tx, refundCents);
          const status = await runSimulation(simId); // Reuse your existing runSimulation function

          console.log(`\n✅ Refund Mimic Complete: ${status}`);
          process.exit(0);
        },
      );
    } catch (err: any) {
      console.error("\n❌ Error:", err.message);
      process.exit(1);
    }
  });
}

main().then(() => console.log("refunded"));
