"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isLocale } from "@/lib/i18n";

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

async function siteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  return `${h.get("x-forwarded-proto") ?? "https"}://${host}`;
}

async function rememberLocale(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("locale").eq("id", userId).maybeSingle();
  if (isLocale(data?.locale)) {
    (await cookies()).set("locale", data.locale, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  }
}

export async function signIn(formData: FormData) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: text(formData, "email"),
    password: String(formData.get("password") ?? ""),
  });
  if (error || !data.user) {
    redirect(`/login?error=${encodeURIComponent(error?.message ?? "Could not sign in")}`);
  }
  await rememberLocale(data.user.id);
  redirect("/units");
}

export async function signUp(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  if (password.length < 8) {
    redirect(`/signup?error=${encodeURIComponent("Use at least 8 characters for the password")}`);
  }
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: text(formData, "email"),
    password,
    options: {
      data: { full_name: text(formData, "full_name") },
      emailRedirectTo: `${await siteUrl()}/auth/callback`,
    },
  });
  if (error) redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  // With email confirmation on there is no session yet.
  if (!data.session) redirect("/login?notice=check-email");
  redirect("/units");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
