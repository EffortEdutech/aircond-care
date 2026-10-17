"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/supabase/server";

export async function removeReview(reviewId: string, formData: FormData) {
  const { supabase } = await requireUser();
  const reason = String(formData.get("reason") ?? "").trim();
  if (reason.length < 5) redirect(`/admin/reviews?error=${encodeURIComponent("Give a reason for removing the review.")}`);
  const { error } = await supabase.rpc("admin_remove_review", { p_review: reviewId, p_reason: reason });
  redirect(error ? `/admin/reviews?error=${encodeURIComponent(error.message)}` : "/admin/reviews");
}
