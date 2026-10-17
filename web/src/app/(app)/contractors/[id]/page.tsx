import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/supabase/server";
import { Card, PageHeader } from "@/components/ui";
import { unitTypeLabel } from "@/lib/units";
import { dateTime, rm } from "@/lib/format";

export const metadata: Metadata = { title: "Contractor" };

export default async function ContractorPage({ params }: PageProps<"/contractors/[id]">) {
  const { id } = await params;
  const { supabase } = await requireUser();

  const [{ data: company }, { data: services }, { data: coverage }, { data: types }, { data: reviews }] = await Promise.all([
    supabase.from("public_company_profiles").select("id, name, description, rating_avg, rating_count").eq("id", id).maybeSingle(),
    supabase
      .from("company_services")
      .select("service_type_code, unit_type, price_sen, duration_minutes")
      .eq("company_id", id)
      .eq("is_active", true)
      .order("service_type_code"),
    supabase.from("company_service_areas").select("call_out_fee_sen, service_areas(state, district)").eq("company_id", id),
    supabase.from("service_types").select("code, name, requires_quote").order("sort_order"),
    supabase
      .from("reviews")
      .select("id, rating, comment, company_reply, created_at")
      .eq("company_id", id)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);
  if (!company) notFound();
  const typeName = new Map((types ?? []).map((t) => [t.code, t]));

  return (
    <>
      <PageHeader
        title={company.name ?? "Contractor"}
        action={
          <Link
            href={`/book/${id}`}
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-sky-700 px-4 py-2 font-medium text-white hover:bg-sky-800"
          >
            Book
          </Link>
        }
      />
      <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
        {(company.rating_count ?? 0) > 0 ? `★ ${Number(company.rating_avg).toFixed(1)} from ${company.rating_count} reviews` : "New on Aircond Care"}
      </p>
      {company.description ? <p className="mb-6">{company.description}</p> : null}

      <h2 className="mb-2 text-lg font-semibold">Services and prices</h2>
      <Card className="mb-6">
        <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {(services ?? []).map((s, i) => {
            const t = typeName.get(s.service_type_code);
            const quote = s.price_sen === null || t?.requires_quote;
            return (
              <li key={i} className="flex items-start justify-between gap-3 py-2">
                <span>
                  {t?.name ?? s.service_type_code}
                  <span className="block text-xs text-zinc-500">
                    {s.unit_type ? unitTypeLabel(s.unit_type) : "Any unit type"}
                    {s.duration_minutes ? ` · about ${s.duration_minutes} min` : ""}
                  </span>
                </span>
                <span className="shrink-0 font-medium">{quote ? "Quote" : rm(s.price_sen)}</span>
              </li>
            );
          })}
        </ul>
        <p className="mt-3 text-xs text-zinc-500">Repairs, gas top-ups and installations are priced by quote after the contractor reviews your request.</p>
      </Card>

      <h2 className="mb-2 text-lg font-semibold">Areas and call-out fee</h2>
      <Card className="mb-6">
        <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {(coverage ?? []).map((c, i) => (
            <li key={i} className="flex justify-between py-2">
              <span>
                {c.service_areas?.district}, {c.service_areas?.state}
              </span>
              <span className="font-medium">{rm(c.call_out_fee_sen)}</span>
            </li>
          ))}
        </ul>
      </Card>

      <h2 className="mb-2 text-lg font-semibold">Reviews</h2>
      {reviews && reviews.length > 0 ? (
        <ul className="space-y-3">
          {reviews.map((r) => (
            <li key={r.id}>
              <Card>
                <p className="text-sm">★ {r.rating} · <span className="text-zinc-500">{dateTime(r.created_at)}</span></p>
                {r.comment ? <p className="mt-1">{r.comment}</p> : null}
                {r.company_reply ? <p className="mt-2 border-l-2 border-zinc-300 pl-3 text-sm text-zinc-600 dark:text-zinc-400">Reply: {r.company_reply}</p> : null}
              </Card>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-zinc-600 dark:text-zinc-400">No reviews yet.</p>
      )}
    </>
  );
}
