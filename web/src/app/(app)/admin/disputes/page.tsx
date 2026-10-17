import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/supabase/server";
import { Card, PageHeader } from "@/components/ui";
import { dateTime, rm } from "@/lib/format";
import { DISPUTE_LABEL } from "@/lib/disputes";

export const metadata: Metadata = { title: "Disputes" };

export default async function DisputesPage() {
  const { supabase } = await requireUser();
  const { data: isAdmin } = await supabase.rpc("is_platform_admin");
  if (!isAdmin) redirect("/units");

  const { data: rows } = await supabase
    .from("disputes")
    .select("id, status, reason, refund_sen, created_at, decided_at, bookings(booking_no, total_sen, companies(name))")
    .order("created_at", { ascending: false })
    .limit(100);
  const open = (rows ?? []).filter((d) => d.status === "open" || d.status === "under_review");
  const done = (rows ?? []).filter((d) => !(d.status === "open" || d.status === "under_review"));

  const list = (title: string, items: typeof open, empty: string) => (
    <section className="mb-8">
      <h2 className="mb-2 text-lg font-semibold">{title}</h2>
      {items.length === 0 ? (
        <p className="text-zinc-600 dark:text-zinc-400">{empty}</p>
      ) : (
        <ul className="space-y-3">
          {items.map((d) => (
            <li key={d.id}>
              <Link href={`/admin/disputes/${d.id}`}>
                <Card className="text-sm hover:border-sky-600">
                  <p className="font-medium">
                    {d.bookings?.booking_no} · {d.bookings?.companies?.name} · {rm(d.bookings?.total_sen)}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {DISPUTE_LABEL[d.status]} · raised {dateTime(d.created_at)}
                    {d.refund_sen > 0 ? ` · refund ${rm(d.refund_sen)}` : ""}
                  </p>
                  <p className="mt-1 line-clamp-2 text-zinc-700 dark:text-zinc-300">{d.reason}</p>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );

  return (
    <>
      <p className="mb-2 text-sm">
        <Link href="/admin" className="text-sky-700 underline">← Admin</Link>
      </p>
      <PageHeader title="Disputes" />
      {list("Needs a decision", open, "No open disputes.")}
      {list("Decided", done, "Nothing decided yet.")}
    </>
  );
}
