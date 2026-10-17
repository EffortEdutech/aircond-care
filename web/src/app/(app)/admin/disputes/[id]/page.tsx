import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/supabase/server";
import { Button, Card, Field, Input, Notice, PageHeader, Select, Textarea } from "@/components/ui";
import { DisputePanel } from "@/components/dispute-panel";
import { loadDispute } from "@/lib/disputes";
import { dateTime, rm } from "@/lib/format";
import { decideDispute } from "../actions";

export const metadata: Metadata = { title: "Dispute" };

export default async function DisputePage({ params, searchParams }: PageProps<"/admin/disputes/[id]">) {
  const [{ id }, sp, { supabase, user }] = await Promise.all([params, searchParams, requireUser()]);
  const { data: isAdmin } = await supabase.rpc("is_platform_admin");
  if (!isAdmin) redirect("/units");
  const error = Array.isArray(sp.error) ? sp.error[0] : sp.error;

  const { data: d } = await supabase.from("disputes").select("id, booking_id, status").eq("id", id).maybeSingle();
  if (!d) notFound();
  const { dispute, messages } = await loadDispute(supabase, d.booking_id);
  if (!dispute) notFound();

  const { data: b } = await supabase
    .from("bookings")
    .select("id, booking_no, status, customer_id, total_sen, scheduled_start, fault_description, companies(name), profiles!bookings_customer_id_fkey(full_name, phone)")
    .eq("id", d.booking_id)
    .maybeSingle();
  const [{ data: reports }, { data: payments }] = await Promise.all([
    supabase.from("unit_history").select("report_id, work_done, findings, finalised_at").eq("booking_id", d.booking_id),
    supabase.from("payments").select("id, status, amount_sen, refunded_sen").eq("booking_id", d.booking_id),
  ]);
  const unresolved = dispute.status === "open" || dispute.status === "under_review";

  return (
    <>
      <p className="mb-2 text-sm">
        <Link href="/admin/disputes" className="text-sky-700 underline">← Disputes</Link>
      </p>
      <PageHeader title={`Dispute ${b?.booking_no ?? ""}`} />
      {error ? <Notice kind="error">{error}</Notice> : null}

      {b ? (
        <Card className="mb-6 space-y-1 text-sm">
          <p><strong>Contractor:</strong> {b.companies?.name}</p>
          <p><strong>Customer:</strong> {b.profiles?.full_name ?? "—"} {b.profiles?.phone ? `· ${b.profiles.phone}` : ""}</p>
          <p><strong>Job:</strong> {b.fault_description ?? "Service visit"} · {b.scheduled_start ? dateTime(b.scheduled_start) : "not scheduled"}</p>
          <p><strong>Total:</strong> {rm(b.total_sen)} · {(payments ?? []).map((p) => `${p.status} ${rm(p.amount_sen)}`).join(", ") || "no payment"}</p>
        </Card>
      ) : null}

      {(reports ?? []).length > 0 ? (
        <Card className="mb-6 space-y-2 text-sm">
          <h2 className="font-semibold">Contractor&apos;s job report</h2>
          {reports!.map((r) => (
            <div key={r.report_id}>
              <p><strong>Work done:</strong> {r.work_done}</p>
              {r.findings ? <p><strong>Findings:</strong> {r.findings}</p> : null}
            </div>
          ))}
        </Card>
      ) : null}

      <DisputePanel dispute={dispute} messages={messages} userId={user.id} customerId={b?.customer_id ?? ""} back={`/admin/disputes/${id}`} />

      {unresolved ? (
        <Card>
          <h2 className="mb-1 font-semibold">Decide</h2>
          <p className="mb-3 text-xs text-zinc-500">The decision is final. Refunds are recorded immediately.</p>
          <form action={decideDispute.bind(null, id)} className="space-y-3">
            <Field label="Outcome">
              <Select name="outcome" defaultValue="release">
                <option value="release">Release payment to contractor</option>
                <option value="partial">Partial refund to customer</option>
                <option value="refund">Full refund to customer</option>
              </Select>
            </Field>
            <Field label="Refund amount (RM)" hint="Only for a partial refund. Must be below the total.">
              <Input name="refund_rm" inputMode="decimal" placeholder="e.g. 50.00" />
            </Field>
            <Field label="Note to both sides">
              <Textarea name="note" required />
            </Field>
            <Button type="submit">Record decision</Button>
          </form>
        </Card>
      ) : null}
    </>
  );
}
