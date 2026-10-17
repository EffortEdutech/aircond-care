"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/supabase/server";

function done(error?: string): never {
  redirect(error ? `/admin?error=${encodeURIComponent(error)}` : "/admin");
}

export async function reviewDocument(id: string, decision: "approved" | "rejected", formData: FormData) {
  const { supabase } = await requireUser();
  const note = String(formData.get("note") ?? "").trim() || undefined;
  const { error } = await supabase.rpc("admin_review_document", { p_document: id, p_status: decision, p_note: note });
  done(error?.message);
}

export async function setCompanyStatus(id: string, status: "verified" | "suspended" | "pending", formData: FormData) {
  const { supabase } = await requireUser();
  const reason = String(formData.get("reason") ?? "").trim() || undefined;
  const { error } = await supabase.rpc("admin_set_company_status", { p_company: id, p_status: status, p_reason: reason });
  done(error?.message);
}
