import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/supabase/server";
import { getWorkspace } from "@/lib/workspace";
import { Button, Card, Input, Notice, PageHeader, Select, Textarea } from "@/components/ui";
import { sendQuote } from "../../actions";

export const metadata: Metadata = { title: "Send a quote" };

const KINDS = [
  ["labour", "Labour"],
  ["part", "Part"],
  ["gas", "Gas"],
  ["call_out", "Call-out"],
  ["other", "Other"],
] as const;

export default async function QuotePage({ params, searchParams }: PageProps<"/work/[id]/quote">) {
  const [{ id }, sp, { supabase, user }] = await Promise.all([params, searchParams, requireUser()]);
  const error = Array.isArray(sp.error) ? sp.error[0] : sp.error;
  const ws = await getWorkspace(supabase, user.id);
  const { data: b } = await supabase.from("bookings").select("id, booking_no, status, company_id, fault_description").eq("id", id).maybeSingle();
  if (!b || !ws.company || !ws.isManager || b.company_id !== ws.company.id) notFound();
  const open = b.status === "requested" || b.status === "quoted";

  return (
    <>
      <p className="mb-2 text-sm">
        <Link href={`/work/${id}`} className="text-sky-700 underline">
          Back to booking
        </Link>
      </p>
      <PageHeader title={`Quote for ${b.booking_no}`} />
      {error ? <Notice kind="error">{error}</Notice> : null}
      {!open ? <Notice kind="error">This booking is no longer open for quoting.</Notice> : null}
      {b.fault_description ? <p className="mb-4 text-sm text-zinc-600">Customer says: {b.fault_description}</p> : null}
      <form action={sendQuote.bind(null, id)} className="space-y-4">
        {[0, 1, 2, 3, 4, 5].map((n) => (
          <Card key={n} className="space-y-2">
            <p className="text-xs font-medium text-zinc-500">Line {n + 1}{n > 0 ? " (optional)" : ""}</p>
            <Input name={`description_${n}`} placeholder="What is this for?" aria-label={`Line ${n + 1} description`} required={n === 0} />
            <div className="grid grid-cols-3 gap-2">
              <Select name={`kind_${n}`} aria-label="Kind" defaultValue={n === 0 ? "labour" : "part"}>
                {KINDS.map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </Select>
              <Input name={`qty_${n}`} type="number" min="1" defaultValue="1" aria-label="Quantity" />
              <Input name={`price_${n}`} inputMode="decimal" placeholder="RM each" aria-label="Price in ringgit" required={n === 0} />
            </div>
          </Card>
        ))}
        <Textarea name="note" placeholder="Note to the customer (what you found, what is included)" aria-label="Note" />
        <label className="block text-sm">
          Valid for (days)
          <Input name="days" type="number" min="1" max="30" defaultValue="7" className="mt-1" />
        </label>
        <Button type="submit" disabled={!open}>
          Send quote
        </Button>
      </form>
    </>
  );
}
