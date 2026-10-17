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
  const { data: rows } = await supabase
    .from("dispute_messages")
    .select("id, author_id, body, created_at, attachment_paths")
    .eq("dispute_id", dispute.id)
    .order("created_at");
  // Private evidence photos need short-lived links.
  const paths = (rows ?? []).flatMap((m) => m.attachment_paths ?? []);
  const urls = new Map<string, string>();
  if (paths.length > 0) {
    const { data } = await supabase.storage.from("dispute-photos").createSignedUrls(paths, 3600);
    (data ?? []).forEach((s) => s.path && s.signedUrl && urls.set(s.path, s.signedUrl));
  }
  const messages = (rows ?? []).map((m) => ({
    id: m.id,
    author_id: m.author_id,
    body: m.body,
    created_at: m.created_at,
    photos: (m.attachment_paths ?? []).map((p) => urls.get(p)).filter((u): u is string => Boolean(u)),
  }));
  return { dispute, messages };
}
