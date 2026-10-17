import { createServiceClient } from "@/lib/supabase/admin";

/**
 * Backend job. Closes completed bookings whose confirmation window has passed, then creates the
 * payout for every closed booking that has paid money and no payout yet.
 * Gateway fees are not known in the sandbox, so they are recorded as zero for now.
 */
export async function settleBookings(): Promise<{ closed: number; payouts: number; errors: string[] }> {
  const db = createServiceClient();
  const errors: string[] = [];

  const { data: closed, error: closeError } = await db.rpc("auto_close_completed_bookings");
  if (closeError) errors.push(`auto-close: ${closeError.message}`);

  const { data: candidates } = await db.from("bookings").select("id").eq("status", "closed");
  const ids = (candidates ?? []).map((b) => b.id);
  let payouts = 0;
  if (ids.length > 0) {
    const [{ data: existing }, { data: paid }] = await Promise.all([
      db.from("payouts").select("booking_id").in("booking_id", ids),
      db.from("payments").select("booking_id").in("booking_id", ids).in("status", ["held", "partially_refunded"]),
    ]);
    const done = new Set((existing ?? []).map((p) => p.booking_id));
    const withMoney = new Set((paid ?? []).map((p) => p.booking_id));
    for (const id of ids) {
      if (done.has(id) || !withMoney.has(id)) continue;
      const { error } = await db.rpc("queue_payout", { p_booking: id, p_gateway_fee_sen: 0 });
      if (error) errors.push(`payout ${id}: ${error.message}`);
      else payouts++;
    }
  }
  return { closed: closed ?? 0, payouts, errors };
}
