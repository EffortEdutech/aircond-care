import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function csv(value: unknown) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

/** The weekly batch for the finance person: who to pay, how much, for which job. Admins only. */
export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: isAdmin } = await supabase.rpc("is_platform_admin");
  if (!isAdmin) return new Response("Not allowed", { status: 403 });

  const date = new URL(request.url).searchParams.get("date");
  let query = supabase
    .from("payouts")
    .select("id, gross_sen, commission_sen, gateway_fee_sen, net_sen, scheduled_for, companies(name, legal_name, ssm_number), bookings(booking_no)")
    .in("status", ["queued", "processing"])
    .order("scheduled_for");
  if (date) query = query.eq("scheduled_for", date);
  const { data } = await query;

  const header = ["payout_id", "scheduled_for", "company", "legal_name", "ssm_number", "booking", "gross_rm", "commission_rm", "gateway_fee_rm", "net_rm_to_pay"];
  const rows = (data ?? []).map((p) =>
    [
      p.id,
      p.scheduled_for,
      p.companies?.name,
      p.companies?.legal_name,
      p.companies?.ssm_number,
      p.bookings?.booking_no,
      (p.gross_sen / 100).toFixed(2),
      (p.commission_sen / 100).toFixed(2),
      ((p.gateway_fee_sen ?? 0) / 100).toFixed(2),
      (p.net_sen / 100).toFixed(2),
    ]
      .map(csv)
      .join(","),
  );
  return new Response([header.join(","), ...rows].join("\n"), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="payout-batch-${date ?? "all"}.csv"`,
    },
  });
}
