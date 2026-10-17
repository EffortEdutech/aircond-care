"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/supabase/server";
import { getGateway } from "@/lib/payments/gateway";

export async function cancelBooking(id: string, formData: FormData) {
  const { supabase } = await requireUser();
  const reason = String(formData.get("reason") ?? "").trim() || "Cancelled by customer";
  const { error } = await supabase.rpc("transition_booking", { p_booking: id, p_to: "cancelled", p_reason: reason });
  if (error) redirect(`/bookings/${id}?error=${encodeURIComponent(error.message)}`);
  redirect(`/bookings/${id}`);
}

export async function acceptQuote(bookingId: string, quoteId: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase.rpc("accept_quote", { p_quote: quoteId });
  if (error) redirect(`/bookings/${bookingId}?error=${encodeURIComponent(error.message)}`);
  redirect(`/bookings/${bookingId}`);
}

export async function declineQuote(bookingId: string, quoteId: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase.rpc("decline_quote", { p_quote: quoteId });
  if (error) redirect(`/bookings/${bookingId}?error=${encodeURIComponent(error.message)}`);
  redirect(`/bookings/${bookingId}`);
}

export async function startCheckout(bookingId: string, formData: FormData) {
  const { supabase } = await requireUser();
  const gateway = getGateway();
  if (!gateway) redirect(`/bookings/${bookingId}?error=${encodeURIComponent("Online payment is not switched on yet.")}`);
  const method = String(formData.get("method") ?? "fpx") as "fpx" | "card" | "ewallet";
  const { data: paymentId, error } = await supabase.rpc("start_payment", { p_booking: bookingId, p_method: method, p_gateway: gateway.name });
  if (error || !paymentId) redirect(`/bookings/${bookingId}?error=${encodeURIComponent(error?.message ?? "Could not start payment")}`);
  redirect(gateway.checkoutUrl(paymentId));
}
