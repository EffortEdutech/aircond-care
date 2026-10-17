"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/supabase/server";
import { getGateway } from "@/lib/payments/gateway";
import { settleBookings } from "@/lib/settle";

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

/** The customer confirms the job is done. The booking closes and the contractor's payout is queued. */
export async function confirmJob(bookingId: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase.rpc("transition_booking", { p_booking: bookingId, p_to: "closed" });
  if (error) redirect(`/bookings/${bookingId}?error=${encodeURIComponent(error.message)}`);
  try {
    await settleBookings();
  } catch {
    // The daily job picks it up if the server key is not set yet.
  }
  redirect(`/bookings/${bookingId}`);
}

export async function reportProblem(bookingId: string, formData: FormData) {
  const { supabase } = await requireUser();
  const reason = String(formData.get("reason") ?? "").trim();
  if (reason.length < 10) redirect(`/bookings/${bookingId}?error=${encodeURIComponent("Please describe the problem in a few words.")}`);
  const { error } = await supabase.rpc("raise_dispute", { p_booking: bookingId, p_reason: reason });
  if (error) redirect(`/bookings/${bookingId}?error=${encodeURIComponent(error.message)}`);
  redirect(`/bookings/${bookingId}`);
}

export async function leaveReview(bookingId: string, formData: FormData) {
  const { supabase, user } = await requireUser();
  const rating = Number(formData.get("rating"));
  if (!(rating >= 1 && rating <= 5)) redirect(`/bookings/${bookingId}?error=${encodeURIComponent("Choose 1 to 5 stars.")}`);
  const { error } = await supabase.from("reviews").insert({
    booking_id: bookingId,
    customer_id: user.id,
    rating,
    comment: String(formData.get("comment") ?? "").trim() || null,
  } as never); // the company is filled in by the database
  if (error) redirect(`/bookings/${bookingId}?error=${encodeURIComponent(error.message)}`);
  redirect(`/bookings/${bookingId}`);
}
