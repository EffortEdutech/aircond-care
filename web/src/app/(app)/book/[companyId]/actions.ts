"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/supabase/server";
import { optional } from "@/lib/units";

function fail(companyId: string, message: string): never {
  redirect(`/book/${companyId}?error=${encodeURIComponent(message)}`);
}

/** Creates the booking, then its items. The database prices each item from the contractor's list. */
export async function createBooking(companyId: string, formData: FormData) {
  const { supabase, user } = await requireUser();

  const addressId = optional(formData, "address_id");
  if (!addressId) fail(companyId, "Choose the address for the visit.");

  // Fields named service_<unitId> hold the chosen service code for that unit.
  const items: { unit_id: string; service_type_code: string }[] = [];
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("service_") && typeof value === "string" && value !== "") {
      items.push({ unit_id: key.slice("service_".length), service_type_code: value });
    }
  }
  if (items.length === 0) fail(companyId, "Choose a service for at least one unit.");

  // The time box is in Malaysia time (datetime-local has no zone).
  const when = optional(formData, "requested_start");
  const requested_start = when ? new Date(`${when}:00+08:00`).toISOString() : null;
  if (requested_start && new Date(requested_start).getTime() < Date.now()) fail(companyId, "Choose a time in the future.");

  const { data: booking, error } = await supabase
    .from("bookings")
    .insert({
      customer_id: user.id,
      company_id: companyId,
      address_id: addressId,
      fault_description: optional(formData, "fault_description"),
      customer_notes: optional(formData, "customer_notes"),
      requested_start,
    })
    .select("id")
    .single();
  if (error || !booking) fail(companyId, error?.message ?? "Could not create the booking.");

  const { error: itemError } = await supabase.from("booking_items").insert(items.map((i) => ({ ...i, booking_id: booking.id })));
  if (itemError) {
    // Do not leave an empty booking behind.
    await supabase.rpc("transition_booking", { p_booking: booking.id, p_to: "cancelled", p_reason: "Could not add the services" });
    fail(companyId, itemError.message);
  }

  redirect(`/bookings/${booking.id}`);
}
