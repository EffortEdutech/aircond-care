"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/supabase/server";
import { toSen } from "@/lib/workspace";

function here(bookingId: string, unitId: string, params = "") {
  return `/work/${bookingId}/report/${unitId}${params}`;
}
function fail(bookingId: string, unitId: string, message: string): never {
  redirect(here(bookingId, unitId, `?error=${encodeURIComponent(message)}`));
}
function num(v: FormDataEntryValue | null): number | null {
  const n = Number(v);
  return v !== null && String(v).trim() !== "" && Number.isFinite(n) ? n : null;
}

/** Saves the report as a draft, or finalises it when the button says so. Creates the draft on first save. */
export async function saveReport(bookingId: string, unitId: string, supersedes: string | null, reportId: string | null, formData: FormData) {
  const { supabase, user } = await requireUser();
  const finalise = formData.get("intent") === "finalise";

  const readings: Record<string, number> = {};
  const supply = num(formData.get("supply_temp_c"));
  const ret = num(formData.get("return_temp_c"));
  const amps = num(formData.get("amps"));
  if (supply !== null) readings.supply_temp_c = supply;
  if (ret !== null) readings.return_temp_c = ret;
  if (amps !== null) readings.amps = amps;

  const next = String(formData.get("next_service") ?? "").trim();
  const fields = {
    work_done: String(formData.get("work_done") ?? "").trim(),
    findings: String(formData.get("findings") ?? "").trim() || null,
    refrigerant_type: String(formData.get("refrigerant") ?? "").trim() || null,
    gas_added_grams: num(formData.get("gas_grams")),
    readings,
    recommended_next_service_on: next || null,
    customer_signoff_name: String(formData.get("signoff") ?? "").trim() || null,
  };
  if (finalise) {
    if (fields.work_done.length < 5) fail(bookingId, unitId, "Describe the work done before finalising.");
    if (!fields.customer_signoff_name) fail(bookingId, unitId, "Enter the name of the person who signed off on site.");
  }

  let id = reportId;
  if (!id) {
    const { data, error } = await supabase
      .from("job_reports")
      .insert({ booking_id: bookingId, unit_id: unitId, author_id: user.id, supersedes_id: supersedes, work_done: fields.work_done || "(in progress)" } as never)
      .select("id")
      .single();
    if (error || !data) fail(bookingId, unitId, error?.message ?? "Could not start the report");
    id = data.id;
  }

  const { error } = await supabase
    .from("job_reports")
    .update({
      ...fields,
      work_done: fields.work_done || "(in progress)",
      customer_signoff_at: fields.customer_signoff_name ? new Date().toISOString() : null,
    })
    .eq("id", id);
  if (error) fail(bookingId, unitId, error.message);

  // Parts: replace the list with what the form holds.
  await supabase.from("job_report_parts").delete().eq("job_report_id", id);
  const parts = [];
  for (let n = 0; n < 5; n++) {
    const description = String(formData.get(`part_desc_${n}`) ?? "").trim();
    if (!description) continue;
    const price = toSen(String(formData.get(`part_price_${n}`) ?? "0"));
    parts.push({
      job_report_id: id,
      description,
      quantity: Math.max(1, Math.floor(num(formData.get(`part_qty_${n}`)) ?? 1)),
      unit_price_sen: price ?? 0,
    });
  }
  if (parts.length > 0) {
    const { error: partError } = await supabase.from("job_report_parts").insert(parts);
    if (partError) fail(bookingId, unitId, partError.message);
  }

  if (finalise) {
    const { error: finalError } = await supabase.from("job_reports").update({ status: "final" }).eq("id", id);
    if (finalError) fail(bookingId, unitId, finalError.message);
    redirect(`/work/${bookingId}`);
  }
  redirect(here(bookingId, unitId, "?saved=1"));
}

export async function completeJob(bookingId: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase.rpc("transition_booking", { p_booking: bookingId, p_to: "completed" });
  redirect(error ? `/work/${bookingId}?error=${encodeURIComponent(error.message)}` : `/work/${bookingId}`);
}

export async function removePhoto(bookingId: string, unitId: string, photoId: string) {
  const { supabase } = await requireUser();
  const { data: photo } = await supabase.from("job_report_photos").select("storage_path").eq("id", photoId).maybeSingle();
  await supabase.from("job_report_photos").delete().eq("id", photoId);
  if (photo) await supabase.storage.from("job-report-photos").remove([photo.storage_path]);
  redirect(here(bookingId, unitId));
}

/** Called from the browser after a photo is uploaded to storage. */
export async function addPhoto(reportId: string, path: string, kind: string, caption: string | null) {
  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("job_report_photos")
    .insert({ job_report_id: reportId, storage_path: path, kind: kind as "before", caption });
  return { error: error?.message ?? null };
}
