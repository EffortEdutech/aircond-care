"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/supabase/server";

/** Only follow plain in-app paths back. */
function safeBack(back: string): string {
  return back.startsWith("/") && !back.startsWith("//") ? back : "/bookings";
}

export async function postDisputeMessage(disputeId: string, back: string, formData: FormData) {
  const { supabase, user } = await requireUser();
  const to = safeBack(back);
  const typed = String(formData.get("body") ?? "").trim();
  const { data: dispute } = await supabase.from("disputes").select("booking_id").eq("id", disputeId).maybeSingle();
  if (!dispute) redirect(`${to}?error=${encodeURIComponent("Problem report not found.")}`);
  // Only photos this person uploaded to this booking's folder.
  const prefix = `${dispute!.booking_id}/${user.id}/`;
  const photos = formData.getAll("photo").map(String).filter((p) => p.startsWith(prefix) && !p.includes("..")).slice(0, 4);
  if (!typed && photos.length === 0) redirect(`${to}?error=${encodeURIComponent("Write a message or add a photo first.")}`);
  const body = typed || "(photo)";
  const { error } = await supabase
    .from("dispute_messages")
    .insert({ dispute_id: disputeId, author_id: user.id, body, attachment_paths: photos });
  redirect(error ? `${to}?error=${encodeURIComponent(error.message)}` : to);
}
