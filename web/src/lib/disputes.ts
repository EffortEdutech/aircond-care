import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

export const DISPUTE_LABEL: Record<string, string> = {
  open: "Open",
  under_review: "Under review",
  resolved_release: "Resolved: paid to contractor",
  resolved_refund: "Resolved: full refund",
  resolved_partial: "Resolved: partial refund",
  withdrawn: "Withdrawn",
};

export async function loadDispute(supabase: SupabaseClient<Database>, bookingId: string) {
  const { data: dispute } = await supabase
    .from("disputes")
    .select("id, booking_id, raised_by, reason, status, refund_sen, resolution_note, decided_at, created_at")
    .eq("booking_id", bookingId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!dispute) return { dispute: null, messages: [] };
  const { data: messages } = await supabase
    .from("dispute_messages")
    .select("id, author_id, body, created_at")
    .eq("dispute_id", dispute.id)
    .order("created_at");
  return { dispute, messages: messages ?? [] };
}
