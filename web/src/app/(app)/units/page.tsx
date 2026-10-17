import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n";
import { unitTypeLabel } from "@/lib/units";
import { Card, PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "My units" };

export default async function UnitsPage() {
  const [{ supabase }, t] = await Promise.all([requireUser(), getT()]);
  const { data: units } = await supabase
    .from("units")
    .select("id, nickname, brand, model, unit_type, horsepower, is_archived, addresses(label)")
    .order("is_archived")
    .order("created_at", { ascending: false });
  const add = (
    <Link
      href="/units/new"
      className="inline-flex min-h-11 items-center justify-center rounded-lg bg-sky-700 px-4 py-2 font-medium text-white hover:bg-sky-800"
    >
      {t("addUnit")}
    </Link>
  );
  return (
    <>
      <PageHeader title={t("units")} action={add} />
      {units && units.length > 0 ? (
        <ul className="space-y-3">
          {units.map((u) => (
            <li key={u.id}>
              <Link href={`/units/${u.id}`} className="block">
                <Card className={`hover:border-sky-600 ${u.is_archived ? "opacity-60" : ""}`}>
                  <p className="font-medium">
                    {u.nickname || [u.brand, u.model].filter(Boolean).join(" ") || unitTypeLabel(u.unit_type)}
                    {u.is_archived ? <span className="ml-2 text-xs text-zinc-500">Archived</span> : null}
                  </p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {[u.brand, u.model, unitTypeLabel(u.unit_type), u.horsepower ? `${u.horsepower} HP` : null, u.addresses?.label]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-zinc-600 dark:text-zinc-400">{t("noUnits")}</p>
      )}
    </>
  );
}
