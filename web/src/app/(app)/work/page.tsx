import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/supabase/server";
import { getWorkspace } from "@/lib/workspace";
import { Card, PageHeader } from "@/components/ui";
import { STATUS_LABEL, statusColor, type BookingStatus } from "@/lib/bookings";
import { dateTime, rm } from "@/lib/format";

export const metadata: Metadata = { title: "Workspace" };

const GROUPS: { title: string; hint: string; statuses: BookingStatus[] }[] = [
  { title: "Needs your reply", hint: "New requests and quotes waiting on the customer.", statuses: ["requested", "quoted"] },
  { title: "To schedule", hint: "Paid. Pick a time and a technician.", statuses: ["paid"] },
  { title: "Coming up and on site", hint: "Scheduled and in progress.", statuses: ["scheduled", "in_progress"] },
  { title: "Waiting on the customer", hint: "Accepted and waiting for payment, or done and waiting for confirmation.", statuses: ["awaiting_payment", "completed", "disputed"] },
  { title: "Finished", hint: "", statuses: ["closed", "refunded", "declined", "cancelled"] },
];

export default async function WorkPage() {
  const { supabase, user } = await requireUser();
  const ws = await getWorkspace(supabase, user.id);
  if (!ws.company) redirect("/work/onboard");

  let query = supabase
    .from("bookings")
    .select("id, booking_no, status, requested_start, scheduled_start, total_sen, assigned_to, booking_items(id)")
    .eq("company_id", ws.company.id)
    .order("created_at", { ascending: false })
    .limit(100);
  if (!ws.isManager) query = query.eq("assigned_to", user.id);
  const { data: bookings } = await query;

  return (
    <>
      <PageHeader
        title={ws.isManager ? "Bookings" : "My jobs"}
        action={
          ws.isManager ? (
            <Link href="/work/company" className="text-sm font-medium text-sky-700 underline">
              Company settings
            </Link>
          ) : undefined
        }
      />
      <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
        {ws.company.name}
        {ws.company.status === "pending" ? " · Not verified yet. Customers can see you, but upload your documents so we can verify you." : null}
        {ws.company.status === "suspended" ? " · Suspended" : null}
      </p>

      {(bookings ?? []).length === 0 ? (
        <Card>{ws.isManager ? "No bookings yet." : "Nothing is assigned to you yet."}</Card>
      ) : null}

      {GROUPS.map((g) => {
        const rows = (bookings ?? []).filter((b) => g.statuses.includes(b.status as BookingStatus));
        if (rows.length === 0) return null;
        return (
          <section key={g.title} className="mb-6">
            <h2 className="text-lg font-semibold">{g.title}</h2>
            {g.hint ? <p className="mb-2 text-sm text-zinc-500">{g.hint}</p> : null}
            <ul className="space-y-2">
              {rows.map((b) => (
                <li key={b.id}>
                  <Link href={`/work/${b.id}`}>
                    <Card className="flex items-center justify-between gap-3 hover:border-sky-600">
                      <span>
                        <span className="block font-medium">{b.booking_no}</span>
                        <span className="block text-sm text-zinc-500">
                          {b.booking_items.length} unit{b.booking_items.length === 1 ? "" : "s"} ·{" "}
                          {b.scheduled_start ? `Visit ${dateTime(b.scheduled_start)}` : b.requested_start ? `Wants ${dateTime(b.requested_start)}` : "No time asked"}
                        </span>
                      </span>
                      <span className="text-right">
                        <span className={`block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor(b.status as BookingStatus)}`}>
                          {STATUS_LABEL[b.status as BookingStatus]}
                        </span>
                        <span className="text-sm">{rm(b.total_sen)}</span>
                      </span>
                    </Card>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </>
  );
}
