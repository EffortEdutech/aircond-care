"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/supabase/server";
import { optional, optionalNumber } from "@/lib/units";

function fields(formData: FormData) {
  return {
    label: optional(formData, "label") ?? "Home",
    line1: String(formData.get("line1") ?? "").trim(),
    line2: optional(formData, "line2"),
    postcode: optional(formData, "postcode"),
    service_area_id: optionalNumber(formData, "service_area_id"),
    access_notes: optional(formData, "access_notes"),
    is_default: formData.get("is_default") === "on",
  };
}

export async function createAddress(formData: FormData) {
  const { supabase, user } = await requireUser();
  const values = fields(formData);
  if (!values.line1) redirect(`/addresses?error=${encodeURIComponent("Enter the street address")}`);
  if (values.is_default) await supabase.from("addresses").update({ is_default: false }).eq("customer_id", user.id);
  const { error } = await supabase.from("addresses").insert({ ...values, customer_id: user.id });
  if (error) redirect(`/addresses?error=${encodeURIComponent(error.message)}`);
  redirect("/addresses");
}

export async function updateAddress(id: string, formData: FormData) {
  const { supabase, user } = await requireUser();
  const values = fields(formData);
  if (!values.line1) redirect(`/addresses/${id}?error=${encodeURIComponent("Enter the street address")}`);
  if (values.is_default) await supabase.from("addresses").update({ is_default: false }).eq("customer_id", user.id);
  const { error } = await supabase.from("addresses").update(values).eq("id", id);
  if (error) redirect(`/addresses/${id}?error=${encodeURIComponent(error.message)}`);
  redirect("/addresses");
}

export async function deleteAddress(id: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("addresses").delete().eq("id", id);
  if (error) redirect(`/addresses/${id}?error=${encodeURIComponent(error.message)}`);
  redirect("/addresses");
}
