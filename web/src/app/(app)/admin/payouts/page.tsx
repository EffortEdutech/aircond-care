import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/supabase/server";
import { Button, Card, Input, Notice, PageHeader } from "@/components/ui";
import { dateTime, rm } from "@/lib/format";
import { markPaid } from "./actions";

export const metadata: Metadata = { title: "Payout batch" };

export default async function PayoutsPage({ searchParams }: PageProps<"/admin/payouts">) {
  const [sp, { supabase }] = await Promise.all([searchParams, requireUser()]);
  const { data: isAdmin } = await supabase.rpc("is_platform_admin");
  if (!isAdmin) redirect("/units");
  const error = Array.isArray(sp.error) ? sp.error[0] : sp.error;

  const { data: payouts } = await supabase
    .from("payouts")
    .select("id, net_sen, status, scheduled_for, paid_at, gateway_ref, companies(name), bookings(booking_no)")
    .order("scheduled_for", { ascending: true });
  const queued = (payouts ?? []).filter((p) => p.status === "queued" || p.status === "processing");
  const done = (payouts ?? []).filter((p) => p.status === "paid");
  const byDate = [...new Set(queued.map((p) => p.scheduled_for))];

  return (
    <>
      <p className="mb-2 text-sm">
        <Link href="/admin" className="text-sky-700 underline">
          Back to admin
        </Link>
      </p>
      <PageHeader title="Payout batch" />
      {error ? <Notice kind="error">{error}</Notice> : null}
      <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
        Download the batch as a spreadsheet, pay each company by bank transfer, then tick the payouts and enter the transfer reference to mark them paid.
      </p>

      {queued.length === 0 ? <Card className="mb-6 text-sm">Nothing is waiting to be paid.</Card> : null}
      {byDate.map((date) => {
        const rows = queued.filter((p) => p.scheduled_for === date);
        return (
          <form key={date} action={markPaid} className="mb-6 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                Friday batch · {date} · {rm(rows.reduce((t, r) => t + r.net_sen, 0))}
              </h2>
              <a href={`/admin/payouts/export?date=${date}`} className="text-sm font-medium text-sky-700 underline">
                Download CSV
              </a>
            </div>
            <Card className="space-y-1">
              {rows.map((p) => (
                <label key={p.id} className="flex items-center gap-3 py-1 text-sm">
                  <input type="checkbox" name="payout" value={p.id} defaultChecked />
                  <span className="flex-1">
                    {p.companies?.name} · {p.bookings?.booking_no}
                  </span>
                  <span>{rm(p.net_sen)}</span>
                </label>
              ))}
            </Card>
            <div className="flex flex-wrap gap-2">
              <Input name="reference" placeholder="Bank transfer reference" aria-label="Bank transfer reference" className="min-w-48 flex-1" />
              <Button type="submit">Mark ticked as paid</Button>
            </div>
          </form>
        );
      })}

      {done.length > 0 ? (
        <>
          <h2 className="mb-2 text-lg font-semibold">Paid</h2>
          <ul className="space-y-1 text-sm">
            {done.slice(-20).reverse().map((p) => (
              <li key={p.id} className="flex justify-between">
                <span>
                  {p.companies?.name} · {p.bookings?.booking_no}
                </span>
                <span>
                  {rm(p.net_sen)} · {dateTime(p.paid_at)} · {p.gateway_ref}
                </span>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </>
  );
}
