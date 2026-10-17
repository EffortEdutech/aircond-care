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

export async function requestPasswordReset(formData: FormData) {
  const email = text(formData, "email");
  if (!email) redirect(`/forgot-password?error=${encodeURIComponent("Enter your email address")}`);
  const supabase = await createClient();
  // The answer is the same whether or not the address has an account.
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${await siteUrl()}/auth/callback?next=/reset-password` });
  if (error && (error.status === 429 || /rate limit/i.test(error.message))) {
    redirect(`/forgot-password?error=${encodeURIComponent("Too many reset emails were sent recently. Please try again in about an hour, or ask support to set a temporary password.")}`);
  }
  redirect("/forgot-password?sent=1");
}

export async function setNewPassword(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  if (password.length < 8) redirect(`/reset-password?error=${encodeURIComponent("Use at least 8 characters for the password")}`);
  if (password !== String(formData.get("confirm") ?? "")) redirect(`/reset-password?error=${encodeURIComponent("The two passwords do not match")}`);
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) redirect(`/reset-password?error=${encodeURIComponent(error.message)}`);
  redirect("/units");
}
