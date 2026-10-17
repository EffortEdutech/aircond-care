import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/supabase/server";
import { getWorkspace } from "@/lib/workspace";
import { Button, Card, Field, Input, Notice, PageHeader, Textarea } from "@/components/ui";
import { unitTypeLabel } from "@/lib/units";
import { rm } from "@/lib/format";
import { removePhoto, saveReport } from "../actions";
import { ReportPhotoUpload } from "./photo-upload";

export const metadata: Metadata = { title: "Job report" };

type Readings = { supply_temp_c?: number; return_temp_c?: number; amps?: number };

export default async function ReportPage({ params, searchParams }: PageProps<"/work/[id]/report/[unitId]">) {
  const [{ id, unitId }, sp, { supabase, user }] = await Promise.all([params, searchParams, requireUser()]);
  const error = Array.isArray(sp.error) ? sp.error[0] : sp.error;
  const correct = Array.isArray(sp.correct) ? sp.correct[0] : sp.correct; // id of the final report being corrected
  const ws = await getWorkspace(supabase, user.id);

  const { data: b } = await supabase
    .from("bookings")
    .select("id, booking_no, status, company_id, assigned_to, booking_items(unit_id, service_type_code, units(nickname, brand, model, unit_type, refrigerant))")
    .eq("id", id)
    .maybeSingle();
  if (!b || !ws.company || b.company_id !== ws.company.id) notFound();
  const item = b.booking_items.find((i) => i.unit_id === unitId);
  if (!item) notFound();
  const canWrite = ws.isManager || b.assigned_to === user.id;

  const { data: reports } = await supabase
    .from("job_reports")
    .select("id, status, supersedes_id, work_done, findings, refrigerant_type, gas_added_grams, readings, recommended_next_service_on, customer_signoff_name, finalised_at, job_report_parts(id, description, quantity, unit_price_sen), job_report_photos(id, storage_path, kind)")
    .eq("booking_id", id)
    .eq("unit_id", unitId)
    .order("created_at", { ascending: false });
  const draft = (reports ?? []).find((r) => r.status === "draft") ?? null;
  const final = (reports ?? []).find((r) => r.status === "final") ?? null;
  const showing = draft ?? final;
  const base = draft ?? (correct ? final : null);
  const editable = canWrite && Boolean(draft || (!final && b.status === "in_progress") || (correct && final?.id === correct));

  const photos = showing?.job_report_photos ?? [];
  const urls = new Map<string, string>();
  if (photos.length > 0) {
    const { data } = await supabase.storage.from("job-report-photos").createSignedUrls(photos.map((p) => p.storage_path), 3600);
    (data ?? []).forEach((s) => s.path && s.signedUrl && urls.set(s.path, s.signedUrl));
  }

  const r = (showing?.readings ?? {}) as Readings;
  const u = item.units;
  const title = u ? u.nickname || [u.brand, u.model].filter(Boolean).join(" ") || unitTypeLabel(u.unit_type) : "Unit";
  const parts = showing?.job_report_parts ?? [];

  return (
    <>
      <p className="mb-2 text-sm">
        <Link href={`/work/${id}`} className="text-sky-700 underline">
          Back to booking
        </Link>
      </p>
      <PageHeader title={`Report: ${title}`} />
      <p className="mb-4 text-sm text-zinc-500">
        {b.booking_no} · {item.service_type_code.replaceAll("_", " ")}
        {u ? ` · ${unitTypeLabel(u.unit_type)}` : ""}
      </p>
      {error ? <Notice kind="error">{error}</Notice> : null}
      {sp.saved ? <Notice kind="info">Draft saved.</Notice> : null}

      {showing && !editable ? (
        <Card className="space-y-2 text-sm">
          <p className="font-medium text-emerald-700">Final report{showing.finalised_at ? ` · ${new Date(showing.finalised_at).toLocaleString("en-MY", { timeZone: "Asia/Kuala_Lumpur" })}` : ""}. It cannot be changed.</p>
          <p><strong>Work done:</strong> {showing.work_done}</p>
          {showing.findings ? <p><strong>Findings:</strong> {showing.findings}</p> : null}
          <p>
            <strong>Gas:</strong> {showing.refrigerant_type ?? "n/a"}{showing.gas_added_grams ? `, ${showing.gas_added_grams} g added` : ""}
          </p>
          <p><strong>Readings:</strong> supply {r.supply_temp_c ?? "-"}°C, return {r.return_temp_c ?? "-"}°C, {r.amps ?? "-"} A</p>
          {showing.recommended_next_service_on ? <p><strong>Next service:</strong> {showing.recommended_next_service_on}</p> : null}
          {parts.length > 0 ? (
            <ul className="list-disc pl-5">
              {parts.map((p) => (
                <li key={p.id}>{p.description} × {p.quantity} ({rm(p.unit_price_sen ?? 0)})</li>
              ))}
            </ul>
          ) : null}
          <p><strong>Signed off by:</strong> {showing.customer_signoff_name}</p>
          <div className="grid grid-cols-2 gap-2">
            {photos.map((p) =>
              urls.get(p.storage_path) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={p.id} src={urls.get(p.storage_path)} alt={`${p.kind} photo`} className="rounded-lg border border-zinc-200 dark:border-zinc-800" />
              ) : null,
            )}
          </div>
          {canWrite && ["completed", "closed", "disputed"].includes(b.status) && final ? (
            <Link href={`/work/${id}/report/${unitId}?correct=${final.id}`} className="inline-block pt-2 text-sky-700 underline">
              File a correction
            </Link>
          ) : null}
        </Card>
      ) : null}

      {!showing && !editable ? <Card>No report has been written for this unit yet.</Card> : null}

      {editable ? (
        <>
          {correct ? <Notice kind="info">You are filing a correction. The corrected report replaces the old one in the unit history; the old one stays on record.</Notice> : null}
          <form action={saveReport.bind(null, id, unitId, correct ?? draft?.supersedes_id ?? null, draft?.id ?? null)} className="space-y-4">
            <Field label="Work done">
              <Textarea name="work_done" defaultValue={base?.work_done === "(in progress)" ? "" : (base?.work_done ?? "")} rows={4} />
            </Field>
            <Field label="Findings (condition, issues, advice)">
              <Textarea name="findings" defaultValue={base?.findings ?? ""} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Refrigerant">
                <Input name="refrigerant" defaultValue={base?.refrigerant_type ?? u?.refrigerant ?? ""} placeholder="R32" />
              </Field>
              <Field label="Gas added (grams)">
                <Input name="gas_grams" type="number" min="0" inputMode="numeric" defaultValue={base?.gas_added_grams ?? ""} />
              </Field>
              <Field label="Supply air (°C)">
                <Input name="supply_temp_c" type="number" step="0.1" defaultValue={r.supply_temp_c ?? ""} />
              </Field>
              <Field label="Return air (°C)">
                <Input name="return_temp_c" type="number" step="0.1" defaultValue={r.return_temp_c ?? ""} />
              </Field>
              <Field label="Current (A)">
                <Input name="amps" type="number" step="0.1" defaultValue={r.amps ?? ""} />
              </Field>
              <Field label="Next service on" hint="Leave empty to use the usual interval">
                <Input name="next_service" type="date" defaultValue={base?.recommended_next_service_on ?? ""} />
              </Field>
            </div>

            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">Parts used (optional)</legend>
              {[0, 1, 2, 3, 4].map((n) => {
                const p = parts[n];
                return (
                  <div key={n} className="grid grid-cols-[1fr_4rem_6rem] gap-2">
                    <Input name={`part_desc_${n}`} defaultValue={p?.description ?? ""} placeholder="Part" aria-label={`Part ${n + 1}`} />
                    <Input name={`part_qty_${n}`} type="number" min="1" defaultValue={p?.quantity ?? 1} aria-label="Quantity" />
                    <Input name={`part_price_${n}`} inputMode="decimal" defaultValue={p ? ((p.unit_price_sen ?? 0) / 100).toFixed(2) : ""} placeholder="RM" aria-label="Price" />
                  </div>
                );
              })}
            </fieldset>

            <Field label="Customer sign-off: name of the person on site" hint="Ask the customer to confirm the work. Required to finalise.">
              <Input name="signoff" defaultValue={base?.customer_signoff_name ?? ""} />
            </Field>

            <div className="flex flex-wrap gap-2">
              <Button type="submit" name="intent" value="draft" variant="secondary">
                Save draft
              </Button>
              <Button type="submit" name="intent" value="finalise">
                Finalise report
              </Button>
            </div>
            <p className="text-xs text-zinc-500">A finalised report is read-only and joins the unit history. Mistakes are fixed with a correction.</p>
          </form>

          <h2 className="mb-2 mt-8 text-lg font-semibold">Photos</h2>
          {draft ? (
            <>
              <div className="mb-3 grid grid-cols-2 gap-2">
                {photos.map((p) => (
                  <div key={p.id} className="space-y-1">
                    {urls.get(p.storage_path) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={urls.get(p.storage_path)} alt={`${p.kind} photo`} className="rounded-lg border border-zinc-200 dark:border-zinc-800" />
                    ) : null}
                    <form action={removePhoto.bind(null, id, unitId, p.id)} className="flex justify-between text-sm">
                      <span>{p.kind}</span>
                      <button className="text-red-700 underline">Remove</button>
                    </form>
                  </div>
                ))}
              </div>
              <ReportPhotoUpload reportId={draft.id} companyId={b.company_id} bookingId={b.id} />
            </>
          ) : (
            <p className="text-sm text-zinc-500">Save the draft once to start adding photos.</p>
          )}
        </>
      ) : null}
    </>
  );
}
