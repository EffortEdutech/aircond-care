import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/supabase/server";
import { Button, Card, Input, Notice, PageHeader } from "@/components/ui";
import { dateTime } from "@/lib/format";
import { removeReview } from "./actions";

export const metadata: Metadata = { title: "Reviews" };

export default async function ReviewsPage({ searchParams }: PageProps<"/admin/reviews">) {
  const [sp, { supabase }] = await Promise.all([searchParams, requireUser()]);
  const { data: isAdmin } = await supabase.rpc("is_platform_admin");
  if (!isAdmin) redirect("/units");
  const error = Array.isArray(sp.error) ? sp.error[0] : sp.error;

  const { data: reviews } = await supabase
    .from("reviews")
    .select("id, rating, comment, company_reply, visibility, removed_reason, created_at, companies(name)")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <>
      <p className="mb-2 text-sm">
        <Link href="/admin" className="text-sky-700 underline">← Admin</Link>
      </p>
      <PageHeader title="Reviews" />
      {error ? <Notice kind="error">{error}</Notice> : null}
      <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
        Remove only abusive, false or off-topic reviews. A rating can never be edited, and a removed review stops counting toward the contractor&apos;s score.
      </p>
      {(reviews ?? []).length === 0 ? <p className="text-zinc-600 dark:text-zinc-400">No reviews yet.</p> : null}
      <ul className="space-y-3">
        {(reviews ?? []).map((r) => (
          <li key={r.id}>
            <Card className="space-y-2 text-sm">
              <p className="font-medium">
                {r.companies?.name} · {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}
                <span className="ml-2 font-normal text-zinc-500">{dateTime(r.created_at)}</span>
              </p>
              {r.comment ? <p>{r.comment}</p> : <p className="text-zinc-500">No comment.</p>}
              {r.company_reply ? <p className="border-l-2 border-zinc-300 pl-3 text-zinc-600">Reply: {r.company_reply}</p> : null}
              {r.visibility === "visible" ? (
                <form action={removeReview.bind(null, r.id)} className="flex gap-2">
                  <Input name="reason" placeholder="Reason for removing" aria-label="Reason" required />
                  <Button type="submit" variant="danger">Remove</Button>
                </form>
              ) : (
                <p className="text-red-700">Removed: {r.removed_reason}</p>
              )}
            </Card>
          </li>
        ))}
      </ul>
    </>
  );
}
