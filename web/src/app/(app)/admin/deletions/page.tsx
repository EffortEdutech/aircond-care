import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/supabase/server";
import { Button, Card, Input, Notice, PageHeader } from "@/components/ui";
import { dateTime } from "@/lib/format";
import { processDeletion } from "./actions";

export const metadata: Metadata = { title: "Deletion requests" };

export default async function DeletionsPage({ searchParams }: PageProps<"/admin/deletions">) {
  const [sp, { supabase }] = await Promise.all([searchParams, requireUser()]);
  const { data: isAdmin } = await supabase.rpc("is_platform_admin");
  if (!isAdmin) redirect("/units");
  const error = typeof sp.error === "string" ? sp.error : null;

  const { data: rows } = await supabase
    .from("account_deletion_requests")
    .select("id, user_id, reason, status, admin_note, created_at, handled_at, profiles!account_deletion_requests_user_id_fkey(full_name, email)")
    .order("created_at", { ascending: false })
    .limit(100);

  const pending = (rows ?? []).filter((r) => r.status === "pending");
  const past = (rows ?? []).filter((r) => r.status !== "pending");

  return (
    <>
      <PageHeader title="Deletion requests" />
      <p className="mb-4 text-sm">
        <Link href="/admin" className="text-sky-700 underline">Back to admin</Link>
      </p>
      {error ? <Notice kind="error">{error}</Notice> : null}
      {sp.done ? <Notice kind="info">Done.</Notice> : null}

      <h2 className="mb-2 text-lg font-semibold">Waiting ({pending.length})</h2>
      {pending.length === 0 ? <p className="mb-6 text-sm text-zinc-600">Nothing waiting.</p> : null}
      <div className="mb-8 space-y-4">
        {pending.map((r) => (
          <Card key={r.id} className="space-y-3 text-sm">
            <div>
              <p className="font-semibold">{r.profiles?.full_name || "(no name)"}</p>
              <p className="text-zinc-600 dark:text-zinc-400">{r.profiles?.email ?? "no email"} · asked {dateTime(r.created_at)}</p>
              {r.reason ? <p className="mt-1">Reason: {r.reason}</p> : null}
            </div>
            <form action={processDeletion.bind(null, r.id)} className="space-y-2">
              <Input name="note" placeholder="Note (required if rejecting)" maxLength={300} />
              <div className="flex flex-wrap gap-2">
                <Button type="submit" name="decision" value="approve" variant="danger">Approve and delete</Button>
                <Button type="submit" name="decision" value="reject" variant="secondary">Reject</Button>
              </div>
              <p className="text-xs text-zinc-500">
                Approval is refused while the user has open bookings. It clears their name, phone and email, removes them from any company and
                closes their sign-in. Payment records stay.
              </p>
            </form>
          </Card>
        ))}
      </div>

      {past.length > 0 ? (
        <>
          <h2 className="mb-2 text-lg font-semibold">History</h2>
          <ul className="space-y-2 text-sm">
            {past.map((r) => (
              <li key={r.id} className="rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-800">
                {r.status} · {dateTime(r.handled_at ?? r.created_at)}
                {r.admin_note ? ` · ${r.admin_note}` : ""}
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </>
  );
}
