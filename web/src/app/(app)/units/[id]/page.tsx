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

export const metadata: Metadata = { title: "Unit" };

export default async function UnitPage({ params, searchParams }: PageProps<"/units/[id]">) {
  const [{ id }, query, t, { supabase, user }] = await Promise.all([params, searchParams, getT(), requireUser()]);
  const [{ data: unit }, { data: addresses }, { data: history }] = await Promise.all([
    supabase.from("units").select("*").eq("id", id).maybeSingle(),
    supabase.from("addresses").select("id, label, line1").order("is_default", { ascending: false }),
    supabase.from("unit_history").select("*").eq("unit_id", id).order("finalised_at", { ascending: false }),
  ]);
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
                </Card>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-zinc-600 dark:text-zinc-400">{t("noHistory")}</p>
        )}
      </section>

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
