"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/supabase/server";

export async function markPaid(formData: FormData) {
  const { supabase } = await requireUser();
  const ids = formData.getAll("payout").map(String);
  if (ids.length === 0) redirect(`/admin/payouts?error=${encodeURIComponent("Tick at least one payout.")}`);
  const reference = String(formData.get("reference") ?? "").trim();
  if (!reference) redirect(`/admin/payouts?error=${encodeURIComponent("Enter the bank transfer reference.")}`);
  const { error } = await supabase.rpc("admin_mark_payouts_paid", { p_ids: ids, p_reference: reference });
  redirect(error ? `/admin/payouts?error=${encodeURIComponent(error.message)}` : "/admin/payouts");
}
