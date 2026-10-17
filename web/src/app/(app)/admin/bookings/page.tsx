import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/supabase/server";
import { Card, PageHeader } from "@/components/ui";
import { STATUS_LABEL, statusColor, type BookingStatus } from "@/lib/bookings";
import { dateTime, rm } from "@/lib/format";

export const metadata: Metadata = { title: "All bookings" };

const STATUSES = Object.keys(STATUS_LABEL) as BookingStatus[];

export default async function AdminBookingsPage({ searchParams }: PageProps<"/admin/bookings">) {
  const [sp, { supabase }] = await Promise.all([searchParams, requireUser()]);
  const { data: isAdmin } = await supabase.rpc("is_platform_admin");
  if (!isAdmin) redirect("/units");
  const filter = (Array.isArray(sp.status) ? sp.status[0] : sp.status) as BookingStatus | undefined;

  let q = supabase
    .from("bookings")
    .select("id, booking_no, status, total_sen, created_at, scheduled_start, companies(name), profiles!bookings_customer_id_fkey(full_name)")
    .order("created_at", { ascending: false })
    .limit(100);
  if (filter && STATUSES.includes(filter)) q = q.eq("status", filter);
  const { data: rows } = await q;

  const { data: counts } = await supabase.from("bookings").select("status");
  const byStatus = new Map<string, number>();
  (counts ?? []).forEach((c) => byStatus.set(c.status, (byStatus.get(c.status) ?? 0) + 1));

  return (
    <>
      <p className="mb-2 text-sm">
        <Link href="/admin" className="text-sky-700 underline">← Admin</Link>
      </p>
      <PageHeader title="All bookings" />
      <div className="mb-4 flex flex-wrap gap-2 text-sm">
        <Link href="/admin/bookings" className={`rounded-full border px-3 py-1 ${!filter ? "border-sky-700 bg-sky-50 text-sky-800" : "border-zinc-300"}`}>
          All ({(counts ?? []).length})
        </Link>
        {STATUSES.filter((s) => byStatus.get(s)).map((s) => (
          <Link key={s} href={`/admin/bookings?status=${s}`} className={`rounded-full border px-3 py-1 ${filter === s ? "border-sky-700 bg-sky-50 text-sky-800" : "border-zinc-300"}`}>
            {STATUS_LABEL[s]} ({byStatus.get(s)})
          </Link>
        ))}
      </div>
      {(rows ?? []).length === 0 ? <p className="text-zinc-600 dark:text-zinc-400">No bookings.</p> : null}
      <ul className="space-y-2">
        {(rows ?? []).map((r) => (
          <li key={r.id}>
            <Card className="flex items-center justify-between gap-3 text-sm">
              <span>
                <span className="font-medium">{r.booking_no}</span> · {r.companies?.name}
                <span className="block text-xs text-zinc-500">
                  {r.profiles?.full_name ?? "Customer"} · {dateTime(r.created_at)}
                </span>
              </span>
              <span className="text-right">
                <span className={`rounded-full px-2 py-0.5 text-xs ${statusColor(r.status as BookingStatus)}`}>{STATUS_LABEL[r.status as BookingStatus]}</span>
                <span className="block text-xs text-zinc-500">{rm(r.total_sen)}</span>
              </span>
            </Card>
          </li>
        ))}
      </ul>
    </>
  );
}
