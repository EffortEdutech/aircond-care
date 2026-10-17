"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/supabase/server";

export async function decideDispute(disputeId: string, formData: FormData) {
  const { supabase } = await requireUser();
  const here = `/admin/disputes/${disputeId}`;
  const outcome = String(formData.get("outcome") ?? "");
  const note = String(formData.get("note") ?? "").trim();
  if (!["release", "refund", "partial"].includes(outcome)) redirect(`${here}?error=${encodeURIComponent("Choose an outcome.")}`);
  if (note.length < 5) redirect(`${here}?error=${encodeURIComponent("Add a short note explaining the decision.")}`);
  let refundSen = 0;
  if (outcome === "partial") {
    const rm = Number(String(formData.get("refund_rm") ?? "").replace(/,/g, ""));
    if (!(rm > 0)) redirect(`${here}?error=${encodeURIComponent("Enter the refund amount in RM.")}`);
    refundSen = Math.round(rm * 100);
  }
  const { error } = await supabase.rpc("decide_dispute", { p_dispute: disputeId, p_outcome: outcome, p_refund_sen: refundSen, p_note: note });
  redirect(error ? `${here}?error=${encodeURIComponent(error.message)}` : "/admin/disputes");
}
