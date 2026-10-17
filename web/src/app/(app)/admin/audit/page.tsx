import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/supabase/server";
import { Button, Card, Field, Input, PageHeader } from "@/components/ui";
import { dateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Audit log" };

const PAGE_SIZE = 50;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

function one(v: string | string[] | undefined): string {
  return (Array.isArray(v) ? v[0] : v)?.trim() ?? "";
}

export default async function AuditPage({ searchParams }: PageProps<"/admin/audit">) {
  const [sp, { supabase }] = await Promise.all([searchParams, requireUser()]);
  const { data: isAdmin } = await supabase.rpc("is_platform_admin");
  if (!isAdmin) redirect("/units");

  const action = one(sp.action);
  const entity = one(sp.entity);
  const actorEmail = one(sp.actor);
  const from = one(sp.from);
  const to = one(sp.to);
  const page = Math.max(1, Number(one(sp.page)) || 1);

  const problems: string[] = [];
  if (entity && !UUID.test(entity)) problems.push("The ID must be a full UUID.");
  if (from && !DATE.test(from)) problems.push("Use the date picker for From.");
  if (to && !DATE.test(to)) problems.push("Use the date picker for To.");

  // Resolve the actor email to an id first. No match means no rows.
  let actorId: string | null = null;
  let actorMissing = false;
  if (actorEmail) {
    const { data } = await supabase.from("profiles").select("id").ilike("email", actorEmail).maybeSingle();
    if (data) actorId = data.id;
    else actorMissing = true;
  }

  let rows: Array<{
    id: number;
    actor_id: string | null;
    action: string;
    entity_type: string;
    entity_id: string | null;
    company_id: string | null;
    meta: unknown;
    created_at: string;
  }> = [];
  if (problems.length === 0 && !actorMissing) {
    let q = supabase
      .from("audit_log")
      .select("id, actor_id, action, entity_type, entity_id, company_id, meta, created_at")
      .order("created_at", { ascending: false })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE); // one extra row tells us whether there is a next page
    if (action) q = q.ilike("action", `%${action.replace(/[%_]/g, "")}%`);
    if (entity) q = q.eq("entity_id", entity);
    if (actorId) q = q.eq("actor_id", actorId);
    if (from) q = q.gte("created_at", `${from}T00:00:00+08:00`);
    if (to) q = q.lt("created_at", new Date(new Date(`${to}T00:00:00+08:00`).getTime() + 86400000).toISOString());
    const { data } = await q;
    rows = data ?? [];
  }
  const hasNext = rows.length > PAGE_SIZE;
  const shown = rows.slice(0, PAGE_SIZE);

  const actorIds = [...new Set(shown.map((r) => r.actor_id).filter((x): x is string => Boolean(x)))];
  const names = new Map<string, string>();
  if (actorIds.length > 0) {
    const { data } = await supabase.from("profiles").select("id, full_name, email").in("id", actorIds);
    (data ?? []).forEach((p) => names.set(p.id, p.email || p.full_name || p.id));
  }

  const qs = (n: number) => {
    const p = new URLSearchParams();
    if (action) p.set("action", action);
    if (entity) p.set("entity", entity);
    if (actorEmail) p.set("actor", actorEmail);
    if (from) p.set("from", from);
    if (to) p.set("to", to);
    p.set("page", String(n));
    return `/admin/audit?${p.toString()}`;
  };

  return (
    <>
      <PageHeader title="Audit log" />
      <p className="mb-4 text-sm">
        <Link href="/admin" className="text-sky-700 underline">Back to admin</Link>
      </p>
      <Card className="mb-6">
        <form method="get" className="grid gap-3 sm:grid-cols-2">
          <Field label="Action contains">
            <Input name="action" defaultValue={action} placeholder="for example dispute" />
          </Field>
          <Field label="Done by (email)">
            <Input name="actor" type="email" defaultValue={actorEmail} />
          </Field>
          <Field label="Booking, company or user ID">
            <Input name="entity" defaultValue={entity} placeholder="full UUID" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="From">
              <Input name="from" type="date" defaultValue={from} />
            </Field>
            <Field label="To">
              <Input name="to" type="date" defaultValue={to} />
            </Field>
          </div>
          <div className="flex gap-2 sm:col-span-2">
            <Button type="submit">Search</Button>
            <Link href="/admin/audit" className="inline-flex min-h-11 items-center px-3 text-sky-700 underline">
              Clear
            </Link>
          </div>
        </form>
      </Card>

      {problems.map((m) => (
        <p key={m} role="alert" className="mb-2 text-sm text-red-700">{m}</p>
      ))}
      {actorMissing ? <p className="mb-2 text-sm text-zinc-600">No user has that email address.</p> : null}

      {shown.length === 0 && problems.length === 0 && !actorMissing ? <p className="text-sm text-zinc-600">Nothing matches.</p> : null}
      <ul className="space-y-2">
        {shown.map((r) => (
          <li key={r.id} className="rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-800">
            <p className="font-medium">
              {r.action} <span className="font-normal text-zinc-500">· {r.entity_type}</span>
            </p>
            <p className="text-xs text-zinc-500">
              {dateTime(r.created_at)} · {r.actor_id ? names.get(r.actor_id) ?? r.actor_id : "system"}
              {r.entity_id ? ` · ${r.entity_id}` : ""}
            </p>
            {r.meta && JSON.stringify(r.meta) !== "{}" ? (
              <pre className="mt-1 overflow-x-auto whitespace-pre-wrap break-words text-xs text-zinc-600 dark:text-zinc-400">
                {JSON.stringify(r.meta)}
              </pre>
            ) : null}
          </li>
        ))}
      </ul>

      {page > 1 || hasNext ? (
        <p className="mt-4 flex gap-4 text-sm">
          {page > 1 ? <Link href={qs(page - 1)} className="text-sky-700 underline">Newer</Link> : null}
          {hasNext ? <Link href={qs(page + 1)} className="text-sky-700 underline">Older</Link> : null}
        </p>
      ) : null}
    </>
  );
}
