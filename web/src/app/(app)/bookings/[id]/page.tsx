import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/supabase/server";
import { Button, Card, Input, Notice, PageHeader } from "@/components/ui";
import { CUSTOMER_CAN_CANCEL, STATUS_HELP, STATUS_LABEL, TIMELINE, statusColor, type BookingStatus } from "@/lib/bookings";
import { unitTypeLabel } from "@/lib/units";
import { dateTime, rm } from "@/lib/format";
import { cancelBooking } from "../actions";
import { Chat } from "./chat";

export const metadata: Metadata = { title: "Booking" };

export default async function BookingPage({ params, searchParams }: PageProps<"/bookings/[id]">) {
  const [{ id }, sp, { supabase, user }] = await Promise.all([params, searchParams, requireUser()]);
  const error = Array.isArray(sp.error) ? sp.error[0] : sp.error;

  const { data: b } = await supabase
    .from("bookings")
    .select(
      "id, booking_no, status, fault_description, customer_notes, requested_start, scheduled_start, subtotal_sen, call_out_fee_sen, total_sen, address_snapshot, cancel_reason, created_at, public_company_profiles(id, name), booking_items(id, service_type_code, quantity, unit_price_sen, line_total_sen, units(nickname, brand, model, unit_type))",
    )
    .eq("id", id)
    .maybeSingle();
  if (!b) notFound();

  const [{ data: types }, { data: messages }] = await Promise.all([
    supabase.from("service_types").select("code, name, requires_quote"),
    supabase.from("booking_messages").select("id, sender_id, body, created_at").eq("booking_id", id).order("created_at"),
  ]);
  const typeMap = new Map((types ?? []).map((t) => [t.code, t]));
  const status = b.status as BookingStatus;
  const needsQuote = b.booking_items.some((i) => typeMap.get(i.service_type_code)?.requires_quote);
  const addr = b.address_snapshot as { label?: string; line1?: string; line2?: string; postcode?: string } | null;
  const stepIndex = TIMELINE.indexOf(status === "quoted" ? "requested" : status);
  const ended = status === "closed" || status === "cancelled" || status === "declined" || status === "refunded";

  return (
    <>
      <PageHeader title={b.public_company_profiles?.name ?? "Booking"} />
      {error ? <Notice kind="error">{error}</Notice> : null}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-3 py-1 text-sm font-medium ${statusColor(status)}`}>{STATUS_LABEL[status]}</span>
        <span className="text-sm text-zinc-500">{b.booking_no}</span>
      </div>
      <p className="mb-4 text-zinc-700 dark:text-zinc-300">{STATUS_HELP[status]}</p>
      {b.cancel_reason && (status === "cancelled" || status === "declined") ? <p className="mb-4 text-sm text-zinc-500">Reason: {b.cancel_reason}</p> : null}
      {needsQuote && status === "requested" ? (
        <Notice kind="info">This request includes work that is priced by quote. The contractor will send a quote for you to accept before any payment.</Notice>
      ) : null}

      {stepIndex >= 0 ? (
        <ol className="mb-6 flex gap-1 overflow-x-auto" aria-label="Progress">
          {TIMELINE.map((s, i) => (
            <li
              key={s}
              className={`flex-1 whitespace-nowrap rounded-md px-2 py-1.5 text-center text-xs font-medium ${
                i < stepIndex || (i === stepIndex && s === "closed")
                  ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"
                  : i === stepIndex
                    ? "bg-sky-700 text-white"
                    : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800"
              }`}
              aria-current={i === stepIndex ? "step" : undefined}
            >
              {STATUS_LABEL[s]}
            </li>
          ))}
        </ol>
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
            <span>{needsQuote ? "Total so far" : "Total"}</span>
            <span>{rm(b.total_sen)}</span>
          </li>
        </ul>
      </Card>

      <h2 className="mb-2 text-lg font-semibold">Visit</h2>
      <Card className="mb-6 space-y-1 text-sm">
        <p>{[addr?.label, addr?.line1, addr?.line2, addr?.postcode].filter(Boolean).join(", ")}</p>
        {b.scheduled_start ? (
          <p>
            <strong>Scheduled:</strong> {dateTime(b.scheduled_start)}
          </p>
        ) : b.requested_start ? (
          <p>
            <strong>You asked for:</strong> {dateTime(b.requested_start)}
          </p>
        ) : null}
        {b.fault_description ? <p><strong>Problem:</strong> {b.fault_description}</p> : null}
        {b.customer_notes ? <p><strong>Your notes:</strong> {b.customer_notes}</p> : null}
      </Card>

      <h2 className="mb-2 text-lg font-semibold">Chat</h2>
      <div className="mb-6">
        <Chat bookingId={b.id} userId={user.id} initial={messages ?? []} readOnly={ended} />
      </div>

      {CUSTOMER_CAN_CANCEL.includes(status) ? (
        <form action={cancelBooking.bind(null, b.id)} className="space-y-2 border-t border-zinc-200 pt-4 dark:border-zinc-800">
          <Input name="reason" placeholder="Reason (optional)" aria-label="Cancellation reason" />
          <Button type="submit" variant="danger">
            Cancel this booking
          </Button>
        </form>
      ) : null}
    </>
  );
}
