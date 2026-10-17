"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/supabase/server";
import { myTimeToIso, toSen } from "@/lib/workspace";

function back(id: string, error?: string): never {
  redirect(error ? `/work/${id}?error=${encodeURIComponent(error)}` : `/work/${id}`);
}

/** Accept a fixed-price booking as it is. The customer then pays. */
export async function acceptBooking(id: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase.rpc("transition_booking", { p_booking: id, p_to: "awaiting_payment" });
  back(id, error?.message);
}

export async function declineBooking(id: string, formData: FormData) {
  const { supabase } = await requireUser();
  const reason = String(formData.get("reason") ?? "").trim() || "Declined by contractor";
  const { error } = await supabase.rpc("transition_booking", { p_booking: id, p_to: "declined", p_reason: reason });
  back(id, error?.message);
}

export async function cancelAsContractor(id: string, formData: FormData) {
  const { supabase } = await requireUser();
  const reason = String(formData.get("reason") ?? "").trim() || "Cancelled by contractor";
  const { error } = await supabase.rpc("transition_booking", { p_booking: id, p_to: "cancelled", p_reason: reason });
  back(id, error?.message);
}

export async function scheduleBooking(id: string, formData: FormData) {
  const { supabase } = await requireUser();
  const start = String(formData.get("start") ?? "");
  const hours = Number(formData.get("hours") ?? 2);
  const tech = String(formData.get("technician") ?? "");
  if (!start || !tech) back(id, "Choose a start time and a technician.");
  const startIso = myTimeToIso(start);
  const endIso = new Date(new Date(startIso).getTime() + Math.max(0.5, hours) * 3600_000).toISOString();
  const { error } = await supabase.rpc("transition_booking", {
    p_booking: id,
    p_to: "scheduled",
    p_scheduled_start: startIso,
    p_scheduled_end: endIso,
    p_assigned_to: tech,
  });
  back(id, error?.message);
}

export async function startJob(id: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase.rpc("transition_booking", { p_booking: id, p_to: "in_progress" });
  back(id, error?.message);
}

/** Builds a quote from up to six lines and sends it to the customer. */
export async function sendQuote(id: string, formData: FormData) {
  const { supabase } = await requireUser();
  const lines: { kind: "labour" | "part" | "gas" | "call_out" | "other"; description: string; quantity: number; unit_price_sen: number; sort_order: number }[] = [];
  for (let n = 0; n < 6; n++) {
    const description = String(formData.get(`description_${n}`) ?? "").trim();
    if (!description) continue;
    const price = toSen(String(formData.get(`price_${n}`) ?? ""));
    const quantity = Math.max(1, Math.floor(Number(formData.get(`qty_${n}`) ?? 1)) || 1);
    if (price === null) redirect(`/work/${id}/quote?error=${encodeURIComponent(`Line ${n + 1} needs a valid price.`)}`);
    lines.push({
      kind: String(formData.get(`kind_${n}`) ?? "other") as (typeof lines)[number]["kind"],
      description,
      quantity,
      unit_price_sen: price,
      sort_order: n,
    });
  }
  if (lines.length === 0) redirect(`/work/${id}/quote?error=${encodeURIComponent("Add at least one line.")}`);

  const days = Math.max(1, Math.min(30, Number(formData.get("days") ?? 7) || 7));
  const { data: quote, error } = await supabase
    .from("quotes")
    .insert({
      booking_id: id,
      note: String(formData.get("note") ?? "").trim() || null,
      valid_until: new Date(Date.now() + days * 86400_000).toISOString(),
    })
    .select("id")
    .single();
  if (error || !quote) redirect(`/work/${id}/quote?error=${encodeURIComponent(error?.message ?? "Could not create the quote")}`);

  const { error: lineError } = await supabase.from("quote_lines").insert(lines.map((l) => ({ ...l, quote_id: quote.id })));
  if (lineError) redirect(`/work/${id}/quote?error=${encodeURIComponent(lineError.message)}`);

  const { error: sendError } = await supabase.rpc("send_quote", { p_quote: quote.id });
  if (sendError) redirect(`/work/${id}/quote?error=${encodeURIComponent(sendError.message)}`);
  redirect(`/work/${id}`);
}
