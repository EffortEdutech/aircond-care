import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/supabase/server";
import { getWorkspace } from "@/lib/workspace";
import { Card, PageHeader } from "@/components/ui";
import { rm } from "@/lib/format";

export const metadata: Metadata = { title: "Plan" };

const FEATURE_LABEL: Record<string, string> = {
  profile: "Public company profile",
  inbox: "Booking inbox",
  basic_schedule: "Basic schedule",
  team_accounts: "Team accounts",
  quotes: "Quotes",
  invoices: "Invoices",
  customer_list: "Customer list",
  reminders: "Service reminders to your customers",
  multi_technician: "Several technicians per job day",
  reports_exports: "Reports and exports",
  priority_placement: "Priority placement in search",
};

export default async function PlanPage() {
  const { supabase, user } = await requireUser();
  const ws = await getWorkspace(supabase, user.id);
  if (!ws.company) redirect("/work/onboard");

  const [{ data: plans }, { data: sub }, { count: members }] = await Promise.all([
    supabase
      .from("subscription_plans")
      .select("code, name, monthly_fee_sen, commission_bps, max_members, features, is_available, sort_order")
      .order("sort_order"),
    supabase.from("company_subscriptions").select("plan_code, status").eq("company_id", ws.company.id).maybeSingle(),
    supabase.from("company_members").select("user_id", { count: "exact", head: true }).eq("company_id", ws.company.id).eq("is_active", true),
  ]);
  const current = plans?.find((p) => p.code === sub?.plan_code);

  return (
    <>
      <PageHeader title="Your plan" />
      <p className="mb-4 text-sm">
        <Link href="/work" className="text-sky-700 underline">Back to work</Link>
      </p>
      <Card className="mb-6 space-y-1 text-sm">
        <p>
          You are on <strong>{current?.name ?? "Starter"}</strong>
          {sub?.status === "past_due" ? " (payment overdue)" : ""}. Commission on each paid job: <strong>{((current?.commission_bps ?? 1500) / 100).toFixed(0)}%</strong>.
        </p>
        <p className="text-zinc-600 dark:text-zinc-400">
          Team members: {members ?? 0}
          {current?.max_members ? ` of ${current.max_members}` : " (no limit)"}.
        </p>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        {(plans ?? []).map((p) => {
          const isCurrent = p.code === current?.code;
          const features = Array.isArray(p.features) ? (p.features as string[]) : [];
          return (
            <Card key={p.code} className={`space-y-3 text-sm ${isCurrent ? "ring-2 ring-sky-600" : ""}`}>
              <div>
                <h2 className="text-lg font-semibold">{p.name}</h2>
                <p className="text-2xl font-semibold">
                  {p.monthly_fee_sen === 0 ? "Free" : rm(p.monthly_fee_sen)}
                  {p.monthly_fee_sen > 0 ? <span className="text-sm font-normal text-zinc-500"> / month</span> : null}
                </p>
              </div>
              <ul className="list-disc space-y-1 pl-5">
                <li>{(p.commission_bps / 100).toFixed(0)}% commission per paid job</li>
                <li>{p.max_members ? `${p.max_members} person (you)` : "Unlimited team members"}</li>
                {features.map((f) => (
                  <li key={f}>{FEATURE_LABEL[f] ?? f}</li>
                ))}
              </ul>
              <p className="text-xs font-medium text-zinc-500">
                {isCurrent ? "Your current plan" : p.is_available ? "Available" : "Coming soon"}
              </p>
            </Card>
          );
        })}
      </div>
      <p className="mt-4 text-xs text-zinc-500">
        Paid plans are not open yet. We will tell you before billing starts. See the{" "}
        <Link href="/contractor-terms" className="underline">Contractor Agreement</Link>.
      </p>
    </>
  );
}
