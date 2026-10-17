"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";

/**
 * Fallback while the free email service is limited: an admin sets a temporary password
 * and tells the person. The person should change it after signing in.
 */
export async function setTemporaryPassword(formData: FormData) {
  const { supabase, user } = await requireUser();
  const { data: isAdmin } = await supabase.rpc("is_platform_admin");
  if (!isAdmin) redirect("/units");

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const fail = (m: string): never => redirect(`/admin/users?error=${encodeURIComponent(m)}`);
  if (!email) fail("Enter the user's email address.");
  if (password.length < 10) fail("Use at least 10 characters for the temporary password.");

  const db = createServiceClient();
  const { data: profile } = await db.from("profiles").select("id").ilike("email", email).maybeSingle();
  if (!profile) fail("No user has that email address.");
  const { error } = await db.auth.admin.updateUserById(profile!.id, { password });
  if (error) fail(error.message);
  await db.from("audit_log").insert({
    actor_id: user.id,
    action: "admin_set_temporary_password",
    entity_type: "profile",
    entity_id: profile!.id,
    meta: {},
  });
  redirect(`/admin/users?done=${encodeURIComponent(email)}`);
}
