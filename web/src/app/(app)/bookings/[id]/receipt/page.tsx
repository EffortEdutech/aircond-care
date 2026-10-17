import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/supabase/server";
import { Card, PageHeader } from "@/components/ui";
import { dateTime, rm } from "@/lib/format";

export const metadata: Metadata = { title: "Receipt" };

const METHOD = { fpx: "Online banking (FPX)", card: "Card", ewallet: "E-wallet" } as const;
const STATE: Record<string, string> = {
  held: "Paid. Held until the job is confirmed.",
  released: "Paid. Released to the contractor.",
  refunded: "Refunded in full.",
  partially_refunded: "Partly refunded.",
};

export default async function ReceiptPage({ params }: PageProps<"/bookings/[id]/receipt">) {
  const { id } = await params;
  const { supabase } = await requireUser();
  const { data: b } = await supabase
    .from("bookings")
    .select("id, booking_no, subtotal_sen, call_out_fee_sen, total_sen, public_company_profiles(name)")
    .eq("id", id)
    .maybeSingle();
  if (!b) notFound();
  const { data: payments } = await supabase
    .from("payments")
    .select("id, method, amount_sen, refunded_sen, status, paid_at, gateway_ref")
    .eq("booking_id", id)
    .in("status", ["held", "released", "refunded", "partially_refunded"])
    .order("paid_at");
  if (!payments || payments.length === 0) notFound();

  return (
    <>
      <p className="mb-2 text-sm print:hidden">
        <Link href={`/bookings/${id}`} className="text-sky-700 underline">
          Back to booking
        </Link>
      </p>
      <PageHeader title="Receipt" />
      <p className="mb-4 text-sm text-zinc-600">
        {b.booking_no} · {b.public_company_profiles?.name}
      </p>
      {payments.map((p) => (
        <Card key={p.id} className="mb-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Services</span>
            <span>{rm(b.subtotal_sen)}</span>
          </div>
          <div className="flex justify-between">
            <span>Call-out fee</span>
            <span>{rm(b.call_out_fee_sen)}</span>
          </div>
          <div className="flex justify-between border-t border-zinc-200 pt-2 text-base font-semibold dark:border-zinc-800">
            <span>Paid</span>
            <span>{rm(p.amount_sen)}</span>
          </div>
          {p.refunded_sen > 0 ? (
            <div className="flex justify-between text-zinc-700">
              <span>Refunded</span>
              <span>-{rm(p.refunded_sen)}</span>
            </div>
          ) : null}
          <p className="text-zinc-500">
            {p.method ? METHOD[p.method] : "Payment"} · {dateTime(p.paid_at)} · Ref {p.id.slice(0, 8).toUpperCase()}
          </p>
          <p>{STATE[p.status]}</p>
        </Card>
      ))}
      <p className="text-xs text-zinc-500 print:hidden">Use your browser&rsquo;s print option to save this receipt as a PDF.</p>
    </>
  );
}
