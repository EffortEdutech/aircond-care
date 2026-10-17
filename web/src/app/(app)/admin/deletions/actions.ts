"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";

export async function processDeletion(requestId: string, formData: FormData) {
  const { supabase } = await requireUser();
  const approve = formData.get("decision") === "approve";
  const note = String(formData.get("note") ?? "").trim();
  const fail = (m: string): never => redirect(`/admin/deletions?error=${encodeURIComponent(m)}`);

  const { data: req } = await supabase.from("account_deletion_requests").select("user_id").eq("id", requestId).maybeSingle();
  if (!req) fail("Request not found.");

  const { error } = await supabase.rpc("admin_process_deletion", { p_id: requestId, p_approve: approve, p_note: note });
  if (error) fail(error.message);

  if (approve) {
    // Personal data is already anonymised in the database; close the sign-in too.
    const db = createServiceClient();
    const { error: banError } = await db.auth.admin.updateUserById(req!.user_id, { ban_duration: "876000h" });
    if (banError) fail(`Profile anonymised, but the sign-in could not be closed: ${banError.message}`);
  }
  redirect("/admin/deletions?done=1");
}
