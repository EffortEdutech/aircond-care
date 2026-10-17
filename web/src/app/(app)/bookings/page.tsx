import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/supabase/server";
import { Card, PageHeader } from "@/components/ui";
import { STATUS_LABEL, statusColor } from "@/lib/bookings";
import { dateTime, rm } from "@/lib/format";

export const metadata: Metadata = { title: "Bookings" };

export default async function BookingsPage() {
  const { supabase } = await requireUser();
  const { data: bookings } = await supabase
    .from("bookings")
    .select("id, booking_no, status, total_sen, created_at, requested_start, public_company_profiles(name), booking_items(id)")
    .order("created_at", { ascending: false });

  return (
    <>
      <PageHeader title="Bookings" />
      {bookings && bookings.length > 0 ? (
        <ul className="space-y-3">
          {bookings.map((b) => (
            <li key={b.id}>
              <Link href={`/bookings/${b.id}`} className="block">
                <Card className="hover:border-sky-600">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-medium">{b.public_company_profiles?.name ?? "Contractor"}</p>
                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor(b.status)}`}>{STATUS_LABEL[b.status]}</span>
                  </div>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                    {b.booking_no} · {b.booking_items.length} {b.booking_items.length === 1 ? "unit" : "units"} · {rm(b.total_sen)}
                  </p>
                  <p className="text-xs text-zinc-500">Requested {dateTime(b.created_at)}</p>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-zinc-600 dark:text-zinc-400">
          No bookings yet. <Link href="/contractors" className="font-medium text-sky-700 underline">Find a contractor</Link> to make your first request.
        </p>
      )}
    </>
  );
}
