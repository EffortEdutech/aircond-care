"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/supabase/server";
import { sandboxEnabled, sign } from "@/lib/payments/gateway";
import { processWebhook } from "@/lib/payments/process";

/** Plays the part of the gateway: builds a signed event and sends it through the same path a real webhook takes. */
export async function finishSandboxPayment(paymentId: string, outcome: "paid" | "failed") {
  const { supabase } = await requireUser();
  if (!sandboxEnabled()) redirect("/bookings");
  // The row-level security rule means a customer only sees their own payment.
  const { data: payment } = await supabase.from("payments").select("id, booking_id, amount_sen, status").eq("id", paymentId).maybeSingle();
  if (!payment) redirect("/bookings");

  const body = JSON.stringify({
    id: `sbx-${paymentId}-${outcome}`,
    reference: paymentId,
    status: outcome,
    amount_sen: payment.amount_sen,
  });
  const { status, result } = await processWebhook(body, sign(body));
  if (status !== 200) redirect(`/bookings/${payment.booking_id}?error=${encodeURIComponent(`Payment event rejected: ${result}`)}`);
  redirect(outcome === "paid" ? `/bookings/${payment.booking_id}/receipt` : `/bookings/${payment.booking_id}?error=${encodeURIComponent("Payment failed. You can try again.")}`);
}
