import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/supabase/server";
import { getWorkspace } from "@/lib/workspace";
import { Button, Card, Field, Input, Notice, PageHeader, Select } from "@/components/ui";
import { STATUS_HELP, STATUS_LABEL, statusColor, type BookingStatus } from "@/lib/bookings";
import { unitTypeLabel } from "@/lib/units";
import { dateTime, rm } from "@/lib/format";
import { Chat } from "../../bookings/[id]/chat";
import { acceptBooking, cancelAsContractor, declineBooking, scheduleBooking, startJob } from "../actions";

export const metadata: Metadata = { title: "Booking" };

export default async function WorkBookingPage({ params, searchParams }: PageProps<"/work/[id]">) {
  const [{ id }, sp, { supabase, user }] = await Promise.all([params, searchParams, requireUser()]);
  const error = Array.isArray(sp.error) ? sp.error[0] : sp.error;
  const ws = await getWorkspace(supabase, user.id);

  const { data: b } = await supabase
    .from("bookings")
    .select(
      "id, booking_no, status, customer_id, company_id, fault_description, customer_notes, requested_start, scheduled_start, scheduled_end, assigned_to, subtotal_sen, call_out_fee_sen, total_sen, address_snapshot, cancel_reason, booking_items(id, service_type_code, quantity, unit_price_sen, line_total_sen, units(nickname, brand, model, unit_type))",
    )
    .eq("id", id)
    .maybeSingle();
  if (!b || !ws.company || b.company_id !== ws.company.id) notFound();

  const [{ data: types }, { data: messages }, { data: customer }, { data: quotes }, { data: team }] = await Promise.all([
    supabase.from("service_types").select("code, name, requires_quote"),
    supabase.from("booking_messages").select("id, sender_id, body, created_at").eq("booking_id", id).order("created_at"),
    supabase.from("profiles").select("full_name, phone").eq("id", b.customer_id).maybeSingle(),
    supabase.from("quotes").select("id, version, status, note, valid_until, quote_lines(id, kind, description, quantity, line_total_sen, sort_order)").eq("booking_id", id).order("version", { ascending: false }),
    supabase.from("company_members").select("user_id, role, profiles(full_name)").eq("company_id", ws.company.id).eq("is_active", true),
  ]);

  const typeMap = new Map((types ?? []).map((t) => [t.code, t]));
  const status = b.status as BookingStatus;
  const needsQuote = b.booking_items.some((i) => typeMap.get(i.service_type_code)?.requires_quote);
  const addr = b.address_snapshot as { label?: string; line1?: string; line2?: string; postcode?: string } | null;
  const mine = b.assigned_to === user.id;
  const ended = ["closed", "cancelled", "declined", "refunded"].includes(status);
  const techName = (team ?? []).find((m) => m.user_id === b.assigned_to)?.profiles?.full_name;

  return (
    <>
      <p className="mb-2 text-sm">
        <Link href="/work" className="text-sky-700 underline">
          Back to bookings
        </Link>
      </p>
      <PageHeader title={b.booking_no ?? "Booking"} />
      {error ? <Notice kind="error">{error}</Notice> : null}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-3 py-1 text-sm font-medium ${statusColor(status)}`}>{STATUS_LABEL[status]}</span>
        <span className="text-sm text-zinc-500">{customer?.full_name}{customer?.phone ? ` · ${customer.phone}` : ""}</span>
      </div>
      <p className="mb-4 text-zinc-700 dark:text-zinc-300">{STATUS_HELP[status]}</p>
      {b.cancel_reason && (status === "cancelled" || status === "declined") ? <p className="mb-4 text-sm text-zinc-500">Reason: {b.cancel_reason}</p> : null}

      {ws.isManager && (status === "requested" || status === "quoted") ? (
        <Card className="mb-6 space-y-3">
          <h2 className="font-semibold">Your reply</h2>
          {status === "requested" && !needsQuote ? (
            <form action={acceptBooking.bind(null, b.id)}>
              <Button type="submit">Accept at listed price ({rm(b.total_sen)})</Button>
              <p className="mt-1 text-xs text-zinc-500">The customer is then asked to pay. Nothing is released to you until the job is confirmed.</p>
            </form>
          ) : null}
          <Link href={`/work/${b.id}/quote`} className="inline-flex min-h-11 items-center rounded-lg border border-zinc-300 px-4 py-2 font-medium hover:bg-zinc-50 dark:border-zinc-700">
            {status === "quoted" ? "Send a new quote" : "Send a quote"}
          </Link>
          <form action={declineBooking.bind(null, b.id)} className="space-y-2">
            <Input name="reason" placeholder="Reason for declining" aria-label="Reason for declining" />
            <Button type="submit" variant="danger">
              Decline
            </Button>
          </form>
        </Card>
      ) : null}

      {ws.isManager && status === "paid" ? (
        <Card className="mb-6">
          <h2 className="mb-2 font-semibold">Schedule the visit</h2>
          <form action={scheduleBooking.bind(null, b.id)} className="space-y-3">
            <Field label="Start (Malaysia time)" hint={b.requested_start ? `Customer asked for ${dateTime(b.requested_start)}` : undefined}>
              <Input type="datetime-local" name="start" required />
            </Field>
            <Field label="Expected hours">
              <Input type="number" name="hours" min="0.5" max="12" step="0.5" defaultValue="2" />
            </Field>
            <Field label="Technician">
              <Select name="technician" required defaultValue="">
                <option value="" disabled>
                  Choose
                </option>
                {(team ?? []).map((m) => (
                  <option key={m.user_id} value={m.user_id}>
                    {m.profiles?.full_name ?? m.user_id} ({m.role})
                  </option>
                ))}
              </Select>
            </Field>
            <Button type="submit">Confirm schedule</Button>
          </form>
        </Card>
      ) : null}

      {status === "scheduled" && (mine || ws.isManager) ? (
        <Card className="mb-6">
          <h2 className="mb-2 font-semibold">On the day</h2>
          <form action={startJob.bind(null, b.id)}>
            <Button type="submit">Start job</Button>
          </form>
        </Card>
      ) : null}

      {status === "in_progress" ? (
        <Notice kind="info">Job reports, photos and sign-off arrive in Sprint 5. The job can be completed once every unit has a final report.</Notice>
      ) : null}

      <h2 className="mb-2 text-lg font-semibold">Services</h2>
      <Card className="mb-6">
        <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {b.booking_items.map((i) => {
            const t = typeMap.get(i.service_type_code);
            const u = i.units;
            return (
              <li key={i.id} className="flex items-start justify-between gap-3 py-2">
                <span>
                  {t?.name ?? i.service_type_code}
                  <span className="block text-xs text-zinc-500">
                    {u ? u.nickname || [u.brand, u.model].filter(Boolean).join(" ") || unitTypeLabel(u.unit_type) : "Unit"}
                    {u ? ` · ${unitTypeLabel(u.unit_type)}` : ""}
                  </span>
                </span>
                <span className="shrink-0">{t?.requires_quote ? "Quote" : rm(i.line_total_sen)}</span>
              </li>
            );
          })}
          <li className="flex justify-between py-2 text-sm">
            <span>Call-out fee</span>
            <span>{rm(b.call_out_fee_sen)}</span>
          </li>
          <li className="flex justify-between py-2 font-semibold">
            <span>Total</span>
            <span>{rm(b.total_sen)}</span>
          </li>
        </ul>
      </Card>

      {(quotes ?? []).length > 0 ? (
        <>
          <h2 className="mb-2 text-lg font-semibold">Quotes</h2>
          {quotes!.map((q) => (
            <Card key={q.id} className="mb-3 text-sm">
              <p className="mb-1 font-medium">
                Version {q.version} · {q.status}
                {q.valid_until ? ` · valid until ${dateTime(q.valid_until)}` : ""}
              </p>
              <ul>
                {[...q.quote_lines].sort((a, c) => (a.sort_order ?? 0) - (c.sort_order ?? 0)).map((l) => (
                  <li key={l.id} className="flex justify-between">
                    <span>
                      {l.description} × {l.quantity}
                    </span>
                    <span>{rm(l.line_total_sen)}</span>
                  </li>
                ))}
              </ul>
              {q.note ? <p className="mt-1 text-zinc-500">{q.note}</p> : null}
            </Card>
          ))}
        </>
      ) : null}

      <h2 className="mb-2 mt-6 text-lg font-semibold">Visit</h2>
      <Card className="mb-6 space-y-1 text-sm">
        <p>{[addr?.label, addr?.line1, addr?.line2, addr?.postcode].filter(Boolean).join(", ")}</p>
        {b.scheduled_start ? (
          <p>
            <strong>Scheduled:</strong> {dateTime(b.scheduled_start)}
            {techName ? ` · ${techName}` : ""}
          </p>
        ) : b.requested_start ? (
          <p>
            <strong>Customer asked for:</strong> {dateTime(b.requested_start)}
          </p>
        ) : null}
        {b.fault_description ? <p><strong>Problem:</strong> {b.fault_description}</p> : null}
        {b.customer_notes ? <p><strong>Notes:</strong> {b.customer_notes}</p> : null}
      </Card>

      <h2 className="mb-2 text-lg font-semibold">Chat with customer</h2>
      <div className="mb-6">
        <Chat bookingId={b.id} userId={user.id} initial={messages ?? []} readOnly={ended} />
      </div>

      {ws.isManager && ["paid", "scheduled"].includes(status) ? (
        <form action={cancelAsContractor.bind(null, b.id)} className="space-y-2 border-t border-zinc-200 pt-4 dark:border-zinc-800">
          <Input name="reason" placeholder="Reason for cancelling" aria-label="Cancellation reason" />
          <Button type="submit" variant="danger">
            Cancel this booking
          </Button>
          <p className="text-xs text-zinc-500">The customer is refunded when payments go live.</p>
        </form>
      ) : null}
    </>
  );
}
