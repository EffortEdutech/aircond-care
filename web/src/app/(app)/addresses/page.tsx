import type { Metadata } from "next";
import Link from "next/link";
import { createAddress } from "./actions";
import { AddressForm } from "./address-form";
import { requireUser } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n";
import { Card, Notice, PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Addresses" };

export default async function AddressesPage({ searchParams }: PageProps<"/addresses">) {
  const [{ supabase }, t, params] = await Promise.all([requireUser(), getT(), searchParams]);
  const [{ data: addresses }, { data: areas }] = await Promise.all([
    supabase.from("addresses").select("*").order("is_default", { ascending: false }).order("created_at"),
    supabase.from("service_areas").select("id, state, district").eq("is_active", true).order("state").order("district"),
  ]);
  const error = typeof params.error === "string" ? params.error : null;
  return (
    <>
      <PageHeader title={t("addresses")} />
      {error ? <Notice kind="error">{error}</Notice> : null}
      {addresses && addresses.length > 0 ? (
        <ul className="mb-8 space-y-3">
          {addresses.map((a) => (
            <li key={a.id}>
              <Link href={`/addresses/${a.id}`} className="block">
                <Card className="hover:border-sky-600">
                  <p className="font-medium">
                    {a.label}
                    {a.is_default ? (
                      <span className="ml-2 rounded-full bg-sky-100 px-2 py-0.5 text-xs text-sky-800 dark:bg-sky-950 dark:text-sky-200">
                        Default
                      </span>
                    ) : null}
                  </p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {[a.line1, a.line2, a.postcode].filter(Boolean).join(", ")}
                  </p>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mb-8 text-zinc-600 dark:text-zinc-400">{t("noAddresses")}</p>
      )}
      <h2 className="mb-3 text-lg font-semibold">{t("addAddress")}</h2>
      <Card>
        <AddressForm action={createAddress} areas={areas ?? []} submitLabel={t("add")} />
      </Card>
    </>
  );
}
