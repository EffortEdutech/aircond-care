import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Payment gateway boundary. The rest of the app only knows these shapes, so choosing CHIP,
 * Billplz, Stripe or another gateway later means writing one more adapter here.
 */
export type PaymentEvent = {
  /** Unique per event at the gateway. Used to ignore duplicates. */
  eventId: string;
  /** The payment id we gave the gateway when checkout started. */
  reference: string;
  outcome: "paid" | "failed";
  amountSen: number;
  raw: unknown;
};

export type Gateway = {
  name: string;
  /** Where to send the customer to pay. */
  checkoutUrl(paymentId: string): string;
  /** Checks the signature and returns the event, or null if the request is not genuine. */
  verify(rawBody: string, signature: string | null): PaymentEvent | null;
};

function secret() {
  const s = process.env.PAYMENT_WEBHOOK_SECRET;
  if (!s) throw new Error("PAYMENT_WEBHOOK_SECRET is not set");
  return s;
}

export function sign(rawBody: string) {
  return createHmac("sha256", secret()).update(rawBody).digest("hex");
}

/** A built-in fake gateway so the whole flow can be tested without a vendor account. */
const sandbox: Gateway = {
  name: "sandbox",
  checkoutUrl: (paymentId) => `/pay/sandbox/${paymentId}`,
  verify(rawBody, signature) {
    if (!signature) return null;
    const expected = Buffer.from(sign(rawBody), "hex");
    let given: Buffer;
    try {
      given = Buffer.from(signature, "hex");
    } catch {
      return null;
    }
    if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
    try {
      const body = JSON.parse(rawBody) as { id: string; reference: string; status: string; amount_sen: number };
      if (!body.id || !body.reference || (body.status !== "paid" && body.status !== "failed")) return null;
      return { eventId: body.id, reference: body.reference, outcome: body.status, amountSen: Number(body.amount_sen), raw: body };
    } catch {
      return null;
    }
  },
};

/** Sandbox is on in development, and in production only when PAYMENT_GATEWAY=sandbox is set on purpose. */
export function sandboxEnabled() {
  const choice = process.env.PAYMENT_GATEWAY;
  return choice === "sandbox" || (!choice && process.env.NODE_ENV !== "production");
}

export function getGateway(): Gateway | null {
  if (sandboxEnabled()) return sandbox;
  return null; // A real gateway adapter is added here once one is chosen.
}
