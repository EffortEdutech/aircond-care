import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/supabase/server";
import { Button, Card, Field, PageHeader, Select } from "@/components/ui";
import { rm } from "@/lib/format";

export const metadata: Metadata = { title: "Find a contractor" };

export default async function ContractorsPage({ searchParams }: PageProps<"/contractors">) {
  const { supabase, user } = await requireUser();
  const sp = await searchParams;
  const pick = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

  const [{ data: areas }, { data: types }, { data: defaultAddr }] = await Promise.all([
    supabase.from("service_areas").select("id, state, district").eq("is_active", true).order("state").order("district"),
    supabase.from("service_types").select("code, name").eq("is_active", true).order("sort_order"),
    supabase
      .from("addresses")
      .select("service_area_id")
      .eq("customer_id", user.id)
      .not("service_area_id", "is", null)
      .order("is_default", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const areaId = Number(pick(sp.area) || defaultAddr?.service_area_id || 0) || null;
  const serviceCode = pick(sp.service);

  type Row = { id: string; name: string; description: string | null; rating_avg: number; rating_count: number; starting: number | null; fee: number };
  let results: Row[] = [];
  if (areaId) {
    const { data: coverage } = await supabase
      .from("company_service_areas")
      .select("company_id, call_out_fee_sen")
      .eq("service_area_id", areaId);
    let ids = (coverage ?? []).map((c) => c.company_id);
    if (serviceCode && ids.length > 0) {
      const { data: offered } = await supabase
        .from("company_services")
        .select("company_id")
        .eq("service_type_code", serviceCode)
        .eq("is_active", true)
        .in("company_id", ids);
      const set = new Set((offered ?? []).map((o) => o.company_id));
      ids = ids.filter((id) => set.has(id));
    }
    if (ids.length > 0) {
      const { data: companies } = await supabase
        .from("public_company_profiles")
        .select("id, name, description, rating_avg, rating_count, starting_price_sen")
        .in("id", ids);
      const fee = new Map((coverage ?? []).map((c) => [c.company_id, c.call_out_fee_sen]));
      results = (companies ?? [])
        .filter((c) => c.id)
        .map((c) => ({
          id: c.id!,
          name: c.name ?? "",
          description: c.description,
          rating_avg: Number(c.rating_avg ?? 0),
          rating_count: c.rating_count ?? 0,
          starting: c.starting_price_sen,
          fee: fee.get(c.id!) ?? 0,
        }))
        .sort((a, b) => b.rating_avg - a.rating_avg || a.fee - b.fee);
    }
  }

  return (
    <>
      <PageHeader title="Find a contractor" />
      <form className="mb-5 space-y-3" method="get">
        <Field label="Where is the aircond?">
          <Select name="area" defaultValue={areaId ?? ""}>
            <option value="">Choose an area</option>
            {(areas ?? []).map((a) => (
              <option key={a.id} value={a.id}>
                {a.district}, {a.state}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Service (optional)">
          <Select name="service" defaultValue={serviceCode}>
            <option value="">Any service</option>
            {(types ?? []).map((s) => (
              <option key={s.code} value={s.code}>
                {s.name}
              </option>
            ))}
          </Select>
        </Field>
        <Button type="submit">Search</Button>
      </form>

      {!areaId ? (
        <p className="text-zinc-600 dark:text-zinc-400">Choose an area to see contractors who serve it.</p>
      ) : results.length === 0 ? (
        <p className="text-zinc-600 dark:text-zinc-400">No contractors serve this area{serviceCode ? " for that service" : ""} yet. Try another area or service.</p>
      ) : (
        <ul className="space-y-3">
          {results.map((c) => (
            <li key={c.id}>
              <Link href={`/contractors/${c.id}?area=${areaId}`} className="block">
                <Card className="hover:border-sky-600">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-medium">{c.name}</p>
                    <p className="shrink-0 text-sm text-zinc-600 dark:text-zinc-400">
                      {c.rating_count > 0 ? `★ ${c.rating_avg.toFixed(1)} (${c.rating_count})` : "New"}
                    </p>
                  </div>
                  {c.description ? <p className="mt-1 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">{c.description}</p> : null}
                  <p className="mt-2 text-sm">
                    {c.starting !== null ? `From ${rm(c.starting)}` : "Quote only"} · Call-out {rm(c.fee)}
                  </p>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
