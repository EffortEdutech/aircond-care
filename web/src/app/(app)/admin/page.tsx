import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/supabase/server";
import { Button, Card, Input, Notice, PageHeader } from "@/components/ui";
import { dateTime, rm } from "@/lib/format";
import { reviewDocument, setCompanyStatus } from "./actions";

export const metadata: Metadata = { title: "Admin" };

const DOC_LABEL: Record<string, string> = {
  ssm_registration: "SSM registration",
  business_licence: "Business licence",
  insurance: "Insurance",
  identity: "Owner identity",
};

export default async function AdminPage({ searchParams }: PageProps<"/admin">) {
  const [sp, { supabase }] = await Promise.all([searchParams, requireUser()]);
  const { data: isAdmin } = await supabase.rpc("is_platform_admin");
  if (!isAdmin) redirect("/units");
  const error = Array.isArray(sp.error) ? sp.error[0] : sp.error;

  const { data: companies } = await supabase
    .from("companies")
    .select("id, name, legal_name, ssm_number, status, suspended_reason, created_at, company_documents(id, doc_type, storage_path, status, expires_on, review_note, created_at)")
    .order("created_at", { ascending: false });

  // Private files need a short-lived link.
  const paths = (companies ?? []).flatMap((c) => c.company_documents.map((d) => d.storage_path));
  const links = new Map<string, string>();
  if (paths.length > 0) {
    const { data } = await supabase.storage.from("company-documents").createSignedUrls(paths, 600);
    (data ?? []).forEach((s) => s.path && s.signedUrl && links.set(s.path, s.signedUrl));
  }

  const { data: recon } = await supabase.from("payment_reconciliation").select("payment_id, booking_id, status, amount_sen, refunded_sen, ledger_received_sen, ledger_refunded_sen, balanced");
  const unbalanced = (recon ?? []).filter((r) => !r.balanced);
  const { data: audits } = await supabase
    .from("audit_log")
    .select("id, action, created_at, meta")
    .in("action", ["payment_amount_mismatch", "late_payment_refunded", "duplicate_payment_refunded", "refund_recorded"])
    .order("created_at", { ascending: false })
    .limit(15);

  const pending = (companies ?? []).filter((c) => c.status === "pending");
  const rest = (companies ?? []).filter((c) => c.status !== "pending");

  const section = (title: string, rows: NonNullable<typeof companies>) =>
    rows.length === 0 ? null : (
      <section className="mb-8">
        <h2 className="mb-2 text-lg font-semibold">{title}</h2>
        <div className="space-y-4">
          {rows.map((c) => {
            const approved = new Set(c.company_documents.filter((d) => d.status === "approved").map((d) => d.doc_type));
            const missing = Object.keys(DOC_LABEL).filter((k) => !approved.has(k as never)).map((k) => DOC_LABEL[k]);
            return (
              <Card key={c.id} className="space-y-3">
                <div>
                  <p className="font-semibold">{c.name}</p>
                  <p className="text-sm text-zinc-500">
                    {c.legal_name} · SSM {c.ssm_number} · {c.status}
                    {c.suspended_reason ? ` · ${c.suspended_reason}` : ""}
                  </p>
                </div>
                <ul className="divide-y divide-zinc-200 text-sm dark:divide-zinc-800">
                  {c.company_documents.length === 0 ? <li className="py-2 text-zinc-500">No documents uploaded.</li> : null}
                  {c.company_documents.map((d) => (
                    <li key={d.id} className="space-y-2 py-2">
                      <p>
                        <strong>{DOC_LABEL[d.doc_type] ?? d.doc_type}</strong> · {d.status} · uploaded {dateTime(d.created_at)}
                        {d.expires_on ? ` · expires ${d.expires_on}` : ""}{" "}
                        {links.get(d.storage_path) ? (
                          <a href={links.get(d.storage_path)} target="_blank" rel="noreferrer" className="text-sky-700 underline">
                            Open file
                          </a>
                        ) : (
                          <span className="text-zinc-400">(file not found)</span>
                        )}
                      </p>
                      {d.review_note ? <p className="text-zinc-500">Note: {d.review_note}</p> : null}
                      {d.status === "pending" ? (
                        <form className="flex flex-wrap gap-2">
                          <Input name="note" placeholder="Note (required for rejection)" aria-label="Review note" className="min-w-48 flex-1" />
                          <Button formAction={reviewDocument.bind(null, d.id, "approved")}>Approve</Button>
                          <Button variant="danger" formAction={reviewDocument.bind(null, d.id, "rejected")}>
                            Reject
                          </Button>
                        </form>
                      ) : null}
                    </li>
                  ))}
                </ul>
                {c.status !== "verified" && missing.length > 0 ? (
                  <p className="text-xs text-zinc-500">To verify, approve: {missing.join(", ")}.</p>
                ) : null}
                <form className="flex flex-wrap gap-2 border-t border-zinc-200 pt-3 dark:border-zinc-800">
                  <Input name="reason" placeholder="Reason (for suspending)" aria-label="Reason" className="min-w-48 flex-1" />
                  {c.status !== "verified" ? (
                    <Button formAction={setCompanyStatus.bind(null, c.id, "verified")} disabled={missing.length > 0} title={missing.length ? `Still needs approved: ${missing.join(", ")}` : ""}>
                      Verify company
                    </Button>
                  ) : null}
                  {c.status !== "suspended" ? (
                    <Button variant="danger" formAction={setCompanyStatus.bind(null, c.id, "suspended")}>
                      Suspend
                    </Button>
                  ) : (
                    <Button variant="secondary" formAction={setCompanyStatus.bind(null, c.id, "pending")}>
                      Move back to pending
                    </Button>
                  )}
                </form>
              </Card>
            );
          })}
        </div>
      </section>
    );

  return (
    <>
      <PageHeader title="Admin" />
      {error ? <Notice kind="error">{error}</Notice> : null}
      <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
        Verify contractors by checking their documents. Disputes and payouts are added in later sprints.
      </p>
      {section(`Waiting for verification (${pending.length})`, pending)}
      {section("Other companies", rest)}

      <section className="mb-8">
        <h2 className="mb-2 text-lg font-semibold">Payments check</h2>
        <Card className="space-y-2 text-sm">
          <p>
            {(recon ?? []).length} paid payment{(recon ?? []).length === 1 ? "" : "s"} checked against the ledger.{" "}
            {unbalanced.length === 0 ? (
              <strong className="text-emerald-700">All balanced.</strong>
            ) : (
              <strong className="text-red-700">{unbalanced.length} do not match.</strong>
            )}
          </p>
          {unbalanced.map((r) => (
            <p key={r.payment_id} className="text-red-700">
              Payment {r.payment_id?.slice(0, 8)}: paid {rm(r.amount_sen)}, ledger {rm(r.ledger_received_sen)}; refunded {rm(r.refunded_sen)}, ledger {rm(r.ledger_refunded_sen)}
            </p>
          ))}
          <h3 className="pt-2 font-medium">Recent money events</h3>
          <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {(audits ?? []).length === 0 ? <li className="py-1 text-zinc-500">None yet.</li> : null}
            {(audits ?? []).map((a) => (
              <li key={a.id} className="py-1">
                {a.action.replaceAll("_", " ")} · {dateTime(a.created_at)}
                {(a.meta as { gateway_refund_pending?: boolean } | null)?.gateway_refund_pending ? " · gateway refund still to be sent" : ""}
              </li>
            ))}
          </ul>
        </Card>
      </section>
    </>
  );
}
