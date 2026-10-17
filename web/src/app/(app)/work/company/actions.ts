"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/supabase/server";
import { toSen } from "@/lib/workspace";

const HERE = "/work/company";
function done(error?: string): never {
  redirect(error ? `${HERE}?error=${encodeURIComponent(error)}` : HERE);
}

export async function updateProfile(companyId: string, formData: FormData) {
  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("companies")
    .update({
      name: String(formData.get("name") ?? "").trim(),
      description: String(formData.get("description") ?? "").trim() || null,
      phone: String(formData.get("phone") ?? "").trim() || null,
      email: String(formData.get("email") ?? "").trim() || null,
    })
    .eq("id", companyId);
  done(error?.message);
}

export async function addService(companyId: string, formData: FormData) {
  const { supabase } = await requireUser();
  const code = String(formData.get("service") ?? "");
  const unitType = String(formData.get("unit_type") ?? "");
  const priceText = String(formData.get("price") ?? "").trim();
  const price = priceText === "" ? null : toSen(priceText);
  if (priceText !== "" && price === null) done("Enter the price as a number, for example 80 or 80.50.");
  const minutes = Number(formData.get("minutes") ?? 0) || null;
  const { error } = await supabase.from("company_services").insert({
    company_id: companyId,
    service_type_code: code,
    unit_type: unitType === "" ? null : (unitType as "wall_split"),
    price_sen: price,
    duration_minutes: minutes,
  });
  done(error?.message);
}

export async function removeService(id: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("company_services").delete().eq("id", id);
  done(error?.message);
}

export async function addArea(companyId: string, formData: FormData) {
  const { supabase } = await requireUser();
  const fee = toSen(String(formData.get("fee") ?? "0"));
  if (fee === null) done("Enter the call-out fee as a number.");
  const { error } = await supabase
    .from("company_service_areas")
    .upsert({ company_id: companyId, service_area_id: Number(formData.get("area")), call_out_fee_sen: fee });
  done(error?.message);
}

export async function removeArea(companyId: string, areaId: number) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("company_service_areas").delete().eq("company_id", companyId).eq("service_area_id", areaId);
  done(error?.message);
}

export async function addMember(companyId: string, formData: FormData) {
  const { supabase } = await requireUser();
  const { error } = await supabase.rpc("add_team_member", {
    p_company: companyId,
    p_email: String(formData.get("email") ?? ""),
    p_role: String(formData.get("role") ?? "technician") as "technician",
  });
  done(error?.message);
}

export async function setMemberActive(companyId: string, userId: string, active: boolean) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("company_members").update({ is_active: active }).eq("company_id", companyId).eq("user_id", userId);
  done(error?.message);
}

/** Records a document after the browser has uploaded the file to storage. */
export async function recordDocument(companyId: string, docType: string, path: string, expiresOn: string | null) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("company_documents").insert({
    company_id: companyId,
    doc_type: docType as "ssm_registration",
    storage_path: path,
    expires_on: expiresOn || null,
  });
  return { error: error?.message ?? null };
}

export async function createCompany(formData: FormData) {
  const { supabase } = await requireUser();
  const { error } = await supabase.rpc("create_company", {
    p_name: String(formData.get("name") ?? ""),
    p_legal_name: String(formData.get("legal_name") ?? ""),
    p_ssm_number: String(formData.get("ssm") ?? ""),
    p_phone: String(formData.get("phone") ?? "") || undefined,
    p_email: String(formData.get("email") ?? "") || undefined,
  });
  if (error) redirect(`/work/onboard?error=${encodeURIComponent(error.message)}`);
  redirect(HERE);
}
