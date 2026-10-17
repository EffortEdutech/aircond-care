"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/supabase/server";

export async function cancelBooking(id: string, formData: FormData) {
  const { supabase } = await requireUser();
  const reason = String(formData.get("reason") ?? "").trim() || "Cancelled by customer";
  const { error } = await supabase.rpc("transition_booking", { p_booking: id, p_to: "cancelled", p_reason: reason });
  if (error) redirect(`/bookings/${id}?error=${encodeURIComponent(error.message)}`);
  redirect(`/bookings/${id}`);
}
