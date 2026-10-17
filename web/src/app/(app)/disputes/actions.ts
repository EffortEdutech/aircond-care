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
  const body = String(formData.get("body") ?? "").trim();
  if (!body) redirect(`${to}?error=${encodeURIComponent("Write a message first.")}`);
  const { error } = await supabase.from("dispute_messages").insert({ dispute_id: disputeId, author_id: user.id, body });
  redirect(error ? `${to}?error=${encodeURIComponent(error.message)}` : to);
}
