import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteUnit, setArchived, updateUnit } from "../actions";
import { UnitForm } from "../unit-form";
import { PhotoUpload } from "../photo-upload";
import { requireUser } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n";
import { unitTypeLabel } from "@/lib/units";
import { Button, Card, Notice, PageHeader } from "@/components/ui";
import { revokeAccess } from "../actions";

export const metadata: Metadata = { title: "Unit" };

export default async function UnitPage({ params, searchParams }: PageProps<"/units/[id]">) {
  const [{ id }, query, t, { supabase, user }] = await Promise.all([params, searchParams, getT(), requireUser()]);
  const [{ data: unit }, { data: addresses }, { data: history }, { data: reminders }, { data: grants }] = await Promise.all([
    supabase.from("units").select("*").eq("id", id).maybeSingle(),
    supabase.from("addresses").select("id, label, line1").order("is_default", { ascending: false }),
    supabase.from("unit_history").select("*").eq("unit_id", id).order("finalised_at", { ascending: false }),
    supabase.from("service_reminders").select("id, service_type_code, due_on").eq("unit_id", id).eq("status", "pending").order("due_on"),
    supabase.from("unit_access_grants").select("company_id, granted_at, companies(name)").eq("unit_id", id).is("revoked_at", null),
  ]);
  const { data: photoRows } = (history ?? []).length
    ? await supabase.from("job_report_photos").select("id, job_report_id, storage_path, kind").in("job_report_id", history!.map((h) => h.report_id!))
    : { data: [] as { id: string; job_report_id: string; storage_path: string; kind: string }[] };
  const urls = new Map<string, string>();
  if ((photoRows ?? []).length > 0) {
    const { data } = await supabase.storage.from("job-report-photos").createSignedUrls(photoRows!.map((p) => p.storage_path), 3600);
    (data ?? []).forEach((x) => x.path && x.signedUrl && urls.set(x.path, x.signedUrl));
  }
  const companyAccess = [...new Map((grants ?? []).map((g) => [g.company_id, g])).values()];
  if (!unit) notFound();

  const signed = unit.nameplate_photo_path
    ? await supabase.storage.from("unit-photos").createSignedUrl(unit.nameplate_photo_path, 3600)
    : null;
  const error = typeof query.error === "string" ? query.error : null;
  const title = unit.nickname || [unit.brand, unit.model].filter(Boolean).join(" ") || unitTypeLabel(unit.unit_type);

  return (
    <>
      <PageHeader
        title={title}
        action={
          <Link href="/units" className="text-sm font-medium text-sky-700 underline dark:text-sky-400">
            {t("units")}
          </Link>
        }
      />
      {error ? <Notice kind="error">{error}</Notice> : null}
      {query.saved ? <Notice kind="info">Saved.</Notice> : null}
      {unit.is_archived ? <Notice kind="info">This unit is archived and hidden from booking.</Notice> : null}

      {(reminders ?? []).length > 0 ? (
        <Notice kind="info">
          Next service due:{" "}
          {reminders!.map((r) => `${r.service_type_code.replaceAll("_", " ")} on ${r.due_on}`).join(", ")}.{" "}
          <Link href="/contractors" className="font-medium underline">
            Find a contractor
          </Link>
        </Notice>
      ) : null}

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold">{t("history")}</h2>
        {history && history.length > 0 ? (
          <ol className="space-y-3">
            {history.map((h) => (
              <li key={h.report_id}>
                <Card>
                  <p className="text-sm text-zinc-500">
                    {h.finalised_at ? new Date(h.finalised_at).toLocaleDateString("en-MY", { dateStyle: "medium" }) : ""} · {h.company_name}
                  </p>
                  <p className="font-medium">{(h.service_types ?? []).join(", ").replaceAll("_", " ")}</p>
                  <p className="text-sm text-zinc-700 dark:text-zinc-300">{h.work_done}</p>
                  {h.findings ? <p className="text-sm text-zinc-500">Findings: {h.findings}</p> : null}
                  {h.refrigerant_type ? (
                    <p className="text-sm text-zinc-500">
                      Gas {h.refrigerant_type}
                      {h.gas_added_grams ? `, ${h.gas_added_grams} g added` : ""}
                    </p>
                  ) : null}
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {(photoRows ?? []).filter((p) => p.job_report_id === h.report_id).map((p) =>
                      urls.get(p.storage_path) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img key={p.id} src={urls.get(p.storage_path)} alt={`${p.kind} photo`} className="rounded-lg border border-zinc-200 dark:border-zinc-800" />
                      ) : null,
                    )}
                  </div>
                </Card>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-zinc-600 dark:text-zinc-400">{t("noHistory")}</p>
        )}
      </section>

      {companyAccess.length > 0 ? (
        <section className="mb-8">
          <h2 className="mb-3 text-lg font-semibold">Contractors who can see this unit</h2>
          <Card className="space-y-2 text-sm">
            {companyAccess.map((g) => (
              <form key={g.company_id} action={revokeAccess.bind(null, id, g.company_id)} className="flex items-center justify-between gap-2">
                <span>{g.companies?.name}</span>
                <button className="text-red-700 underline">Remove access</button>
              </form>
            ))}
            <p className="text-xs text-zinc-500">You can remove access once the company has no open booking on this unit.</p>
          </Card>
        </section>
      ) : null}

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold">Nameplate photo</h2>
        {signed?.data?.signedUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={signed.data.signedUrl}
            alt="Nameplate of this unit"
            className="mb-3 max-h-72 w-full rounded-xl border border-zinc-200 object-contain dark:border-zinc-800"
          />
        ) : null}
        <PhotoUpload unitId={unit.id} userId={user.id} hasPhoto={!!unit.nameplate_photo_path} />
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold">Details</h2>
        <Card>
          <UnitForm action={updateUnit.bind(null, id)} addresses={addresses ?? []} unit={unit} submitLabel={t("save")} />
        </Card>
      </section>

      <section className="flex flex-wrap gap-3">
        <form action={setArchived.bind(null, id, !unit.is_archived)}>
          <Button type="submit" variant="secondary">
            {unit.is_archived ? "Restore" : "Archive"}
          </Button>
        </form>
        <form action={deleteUnit.bind(null, id)}>
          <Button type="submit" variant="danger">
            {t("delete")}
          </Button>
        </form>
      </section>
    </>
  );
}
