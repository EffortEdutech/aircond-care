import type { Metadata } from "next";
import Link from "next/link";
import { createUnit } from "../actions";
import { UnitForm } from "../unit-form";
import { requireUser } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n";
import { Card, Notice, PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Add a unit" };

export default async function NewUnitPage({ searchParams }: PageProps<"/units/new">) {
  const [{ supabase }, t, params] = await Promise.all([requireUser(), getT(), searchParams]);
  const { data: addresses } = await supabase.from("addresses").select("id, label, line1").order("is_default", { ascending: false });
  const error = typeof params.error === "string" ? params.error : null;
  return (
    <>
      <PageHeader
        title={t("addUnit")}
        action={
          <Link href="/units" className="text-sm font-medium text-sky-700 underline dark:text-sky-400">
            {t("cancel")}
          </Link>
        }
      />
      {error ? <Notice kind="error">{error}</Notice> : null}
      <Card>
        <UnitForm action={createUnit} addresses={addresses ?? []} submitLabel={t("save")} />
      </Card>
      <p className="mt-3 text-sm text-zinc-500">You can add the nameplate photo on the next screen.</p>
    </>
  );
}
