"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/supabase/server";
import { isLocale } from "@/lib/i18n";
import { optional } from "@/lib/units";

export async function updateProfile(formData: FormData) {
  const { supabase, user } = await requireUser();
  const locale = String(formData.get("locale") ?? "en");
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: String(formData.get("full_name") ?? "").trim(),
      phone: optional(formData, "phone"),
      locale: isLocale(locale) ? locale : "en",
      notify_in_app: formData.get("notify_in_app") === "on",
      notify_email: formData.get("notify_email") === "on",
      notify_push: formData.get("notify_push") === "on",
      notify_whatsapp: formData.get("notify_whatsapp") === "on",
    })
    .eq("id", user.id);
  if (error) redirect(`/account?error=${encodeURIComponent(error.message)}`);
  (await cookies()).set("locale", isLocale(locale) ? locale : "en", {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  redirect("/account?saved=1");
}

export async function requestDeletion(formData: FormData) {
  const { supabase } = await requireUser();
  const { error } = await supabase.rpc("request_account_deletion", { p_reason: String(formData.get("reason") ?? "") });
  redirect(error ? `/account?error=${encodeURIComponent(error.message)}` : "/account?deletion=requested");
}

export async function cancelDeletion() {
  const { supabase } = await requireUser();
  const { error } = await supabase.rpc("cancel_account_deletion");
  redirect(error ? `/account?error=${encodeURIComponent(error.message)}` : "/account?deletion=cancelled");
}
