import { createServiceClient } from "@/lib/supabase/admin";
import { getGateway } from "./gateway";

/** Verifies one gateway request and applies it. Used by the webhook route and the sandbox page. */
export async function processWebhook(rawBody: string, signature: string | null): Promise<{ status: number; result: string }> {
  const gateway = getGateway();
  if (!gateway) return { status: 503, result: "no_gateway" };
  const event = gateway.verify(rawBody, signature);
  if (!event) return { status: 401, result: "bad_signature" };

  const { data, error } = await createServiceClient().rpc("apply_payment_event", {
    p_gateway: gateway.name,
    p_event_id: event.eventId,
    p_reference: event.reference,
    p_outcome: event.outcome,
    p_amount_sen: event.amountSen,
    p_payload: event.raw as never,
  });
  // Any non-2xx makes a real gateway retry, which is what we want for a database error.
  if (error) return { status: 500, result: error.message };
  return { status: 200, result: data ?? "ok" };
}
