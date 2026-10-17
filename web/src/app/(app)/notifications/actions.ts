"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/supabase/server";
import { notificationHref } from "@/lib/notifications";

/** Marks one notification read and opens what it is about. */
export async function openNotification(id: string) {
  const { supabase } = await requireUser();
  const { data } = await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id).select("payload").maybeSingle();
  redirect(data ? notificationHref(data) : "/notifications");
}

export async function markAllRead() {
  const { supabase, user } = await requireUser();
  await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("user_id", user.id).eq("channel", "in_app").is("read_at", null);
  redirect("/notifications");
}
