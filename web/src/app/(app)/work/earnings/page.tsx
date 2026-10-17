import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/supabase/server";
import { getWorkspace } from "@/lib/workspace";
import { Card, PageHeader } from "@/components/ui";
import { dateTime, rm } from "@/lib/format";

export const metadata: Metadata = { title: "Earnings" };

export default async function EarningsPage() {
  const { supabase, user } = await requireUser();
  const ws = await getWorkspace(supabase, user.id);
  if (!ws.company) redirect("/work/onboard");
  if (ws.company.role !== "owner") redirect("/work");

  const [{ data: payouts }, { data: waiting }] = await Promise.all([
    supabase
      .from("payouts")
      .select("id, booking_id, gross_sen, commission_sen, gateway_fee_sen, net_sen, status, scheduled_for, paid_at, bookings(booking_no)")
      .eq("company_id", ws.company.id)
      .order("scheduled_for", { ascending: false }),
    supabase.from("bookings").select("id, booking_no, total_sen, auto_confirm_at").eq("company_id", ws.company.id).eq("status", "completed"),
  ]);

  const queued = (payouts ?? []).filter((p) => p.status !== "paid" && p.status !== "failed");
  const paid = (payouts ?? []).filter((p) => p.status === "paid");
  const sum = (rows: { net_sen: number }[]) => rows.reduce((t, r) => t + r.net_sen, 0);

  return (
    <>
      <p className="mb-2 text-sm">
        <Link href="/work" className="text-sky-700 underline">
          Back to bookings
        </Link>
      </p>
      <PageHeader title="Earnings" />
      <div className="mb-6 grid grid-cols-3 gap-3 text-center">
        <Card>
          <p className="text-xs text-zinc-500">Awaiting customer</p>
          <p className="text-lg font-semibold">{rm((waiting ?? []).reduce((t, b) => t + (b.total_sen ?? 0), 0))}</p>
        </Card>
        <Card>
          <p className="text-xs text-zinc-500">Scheduled payout</p>
          <p className="text-lg font-semibold">{rm(sum(queued))}</p>
        </Card>
        <Card>
          <p className="text-xs text-zinc-500">Paid</p>
          <p className="text-lg font-semibold">{rm(sum(paid))}</p>
        </Card>
      </div>
      <p className="mb-4 text-xs text-zinc-500">Amounts are after the platform commission. Payouts are made by bank transfer on the weekly payout day.</p>

      {(waiting ?? []).length > 0 ? (
        <section className="mb-6">
          <h2 className="mb-2 text-lg font-semibold">Waiting for the customer to confirm</h2>
          <ul className="space-y-2">
            {waiting!.map((b) => (
              <li key={b.id}>
                <Card className="flex justify-between text-sm">
                  <span>{b.booking_no}</span>
                  <span>{rm(b.total_sen)} · auto-confirms {dateTime(b.auto_confirm_at)}</span>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <h2 className="mb-2 text-lg font-semibold">Payouts</h2>
      {(payouts ?? []).length === 0 ? <Card className="text-sm">No payouts yet. A payout is created when a customer confirms a job.</Card> : null}
      <ul className="space-y-2">
        {(payouts ?? []).map((p) => (
          <li key={p.id}>
            <Card className="space-y-1 text-sm">
              <div className="flex justify-between font-medium">
                <span>{p.bookings?.booking_no}</span>
                <span>{rm(p.net_sen)}</span>
              </div>
              <p className="text-zinc-500">
                Job {rm(p.gross_sen)} − commission {rm(p.commission_sen)}
                {p.gateway_fee_sen ? ` − gateway fee ${rm(p.gateway_fee_sen)}` : ""}
              </p>
              <p className="text-zinc-500">
                {p.status === "paid" ? `Paid ${dateTime(p.paid_at)}` : `Scheduled for ${p.scheduled_for}`} · {p.status}
              </p>
            </Card>
          </li>
        ))}
      </ul>
    </>
  );
}
