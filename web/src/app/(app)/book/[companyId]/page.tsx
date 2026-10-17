import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/supabase/server";
import { Button, Card, Field, Input, Notice, PageHeader, Select, Textarea } from "@/components/ui";
import { unitTypeLabel } from "@/lib/units";
import { rm } from "@/lib/format";
import { createBooking } from "./actions";

export const metadata: Metadata = { title: "Book" };

export default async function BookPage({ params, searchParams }: PageProps<"/book/[companyId]">) {
  const { companyId } = await params;
  const sp = await searchParams;
  const error = Array.isArray(sp.error) ? sp.error[0] : sp.error;
  const { supabase, user } = await requireUser();

  const [{ data: company }, { data: services }, { data: coverage }, { data: types }, { data: addresses }, { data: units }] = await Promise.all([
    supabase.from("public_company_profiles").select("id, name").eq("id", companyId).maybeSingle(),
    supabase.from("company_services").select("service_type_code, unit_type, price_sen").eq("company_id", companyId).eq("is_active", true),
    supabase.from("company_service_areas").select("service_area_id, call_out_fee_sen").eq("company_id", companyId),
    supabase.from("service_types").select("code, name, requires_quote").order("sort_order"),
    supabase
      .from("addresses")
      .select("id, label, line1, service_area_id, is_default, service_areas(district)")
      .eq("customer_id", user.id)
      .order("is_default", { ascending: false }),
    supabase
      .from("units")
      .select("id, nickname, brand, model, unit_type, address_id")
      .eq("customer_id", user.id)
      .eq("is_archived", false)
      .order("created_at", { ascending: false }),
  ]);
  if (!company) notFound();

  const fee = new Map((coverage ?? []).map((c) => [c.service_area_id, c.call_out_fee_sen]));
  const served = (addresses ?? []).filter((a) => a.service_area_id !== null && fee.has(a.service_area_id));
  const typeMap = new Map((types ?? []).map((t) => [t.code, t]));

  // Options for one unit: services offered for its type, specific price before the any-type price.
  function optionsFor(unitType: string) {
    const best = new Map<string, number | null>();
    const specific = new Set<string>();
    for (const s of services ?? []) {
      if (s.unit_type !== null && s.unit_type !== unitType) continue;
      const isSpecific = s.unit_type !== null;
      if (!best.has(s.service_type_code) || (isSpecific && !specific.has(s.service_type_code))) {
        best.set(s.service_type_code, s.price_sen);
        if (isSpecific) specific.add(s.service_type_code);
      }
    }
    return [...best.entries()].map(([code, price]) => ({
      code,
      label: `${typeMap.get(code)?.name ?? code} · ${price === null || typeMap.get(code)?.requires_quote ? "quote" : rm(price)}`,
    }));
  }

  const action = createBooking.bind(null, companyId);

  return (
    <>
      <PageHeader title={`Book ${company.name ?? ""}`} />
      {error ? <Notice kind="error">{error}</Notice> : null}

      {served.length === 0 ? (
        <Card>
          <p className="mb-3">
            You need an address in an area this contractor serves. Add one first, choosing its area.
          </p>
          <Link href="/addresses" className="font-medium text-sky-700 underline">
            Go to addresses
          </Link>
        </Card>
      ) : (units ?? []).length === 0 ? (
        <Card>
          <p className="mb-3">Add the aircond unit you want serviced first.</p>
          <Link href="/units/new" className="font-medium text-sky-700 underline">
            Add a unit
          </Link>
        </Card>
      ) : (
        <form action={action} className="space-y-5">
          <Field label="Address for the visit" hint="Only addresses in this contractor's areas are shown. The call-out fee is added to your total.">
            <Select name="address_id" defaultValue={served[0].id} required>
              {served.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label} · {a.line1} · call-out {rm(fee.get(a.service_area_id!) ?? 0)}
                </option>
              ))}
            </Select>
          </Field>

          <fieldset className="space-y-3">
            <legend className="mb-1 text-sm font-medium">Which units, and what service?</legend>
            {(units ?? []).map((u) => {
              const options = optionsFor(u.unit_type);
              const name = u.nickname || [u.brand, u.model].filter(Boolean).join(" ") || unitTypeLabel(u.unit_type);
              return (
                <Card key={u.id}>
                  <p className="font-medium">{name}</p>
                  <p className="mb-2 text-sm text-zinc-600 dark:text-zinc-400">{unitTypeLabel(u.unit_type)}</p>
                  {options.length > 0 ? (
                    <Select name={`service_${u.id}`} defaultValue="" aria-label={`Service for ${name}`}>
                      <option value="">Not this unit</option>
                      {options.map((o) => (
                        <option key={o.code} value={o.code}>
                          {o.label}
                        </option>
                      ))}
                    </Select>
                  ) : (
                    <p className="text-sm text-zinc-500">This contractor does not service {unitTypeLabel(u.unit_type).toLowerCase()} units.</p>
                  )}
                </Card>
              );
            })}
          </fieldset>

          <Field label="What is wrong, if anything? (optional)">
            <Textarea name="fault_description" placeholder="For example: not cold, water leaking, strange noise" />
          </Field>
          <Field label="Preferred date and time (optional)" hint="Malaysia time. The contractor confirms the real slot.">
            <Input type="datetime-local" name="requested_start" />
          </Field>
          <Field label="Notes for the contractor (optional)">
            <Textarea name="customer_notes" placeholder="Parking, guard post, pets" />
          </Field>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Sending a request does not charge you. Fixed-price services show the total once sent; repairs, gas top-ups and installations get a quote first.
          </p>
          <Button type="submit" className="w-full">
            Send request
          </Button>
        </form>
      )}
    </>
  );
}
