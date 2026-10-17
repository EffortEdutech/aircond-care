import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteAddress, updateAddress } from "../actions";
import { AddressForm } from "../address-form";
import { requireUser } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n";
import { Button, Card, Notice, PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Edit address" };

export default async function EditAddressPage({ params, searchParams }: PageProps<"/addresses/[id]">) {
  const [{ id }, query, t, { supabase }] = await Promise.all([params, searchParams, getT(), requireUser()]);
  const [{ data: address }, { data: areas }] = await Promise.all([
    supabase.from("addresses").select("*").eq("id", id).maybeSingle(),
    supabase.from("service_areas").select("id, state, district").eq("is_active", true).order("state").order("district"),
  ]);
  if (!address) notFound();
  const error = typeof query.error === "string" ? query.error : null;
  return (
    <>
      <PageHeader
        title={t("edit")}
        action={
          <Link href="/addresses" className="text-sm font-medium text-sky-700 underline dark:text-sky-400">
            {t("cancel")}
          </Link>
        }
      />
      {error ? <Notice kind="error">{error}</Notice> : null}
      <Card>
        <AddressForm action={updateAddress.bind(null, id)} areas={areas ?? []} address={address} submitLabel={t("save")} />
      </Card>
      <form action={deleteAddress.bind(null, id)} className="mt-6">
        <Button type="submit" variant="danger">
          {t("delete")}
        </Button>
        <p className="mt-2 text-xs text-zinc-500">Units at this address keep their record; they just lose the link.</p>
      </form>
    </>
  );
}
