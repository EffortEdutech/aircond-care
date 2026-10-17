import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/supabase/server";
import { sandboxEnabled } from "@/lib/payments/gateway";
import { Button, Card, Notice, PageHeader } from "@/components/ui";
import { rm } from "@/lib/format";
import { finishSandboxPayment } from "./actions";

export const metadata: Metadata = { title: "Test payment" };

export default async function SandboxPayPage({ params }: PageProps<"/pay/sandbox/[id]">) {
  const { id } = await params;
  const { supabase } = await requireUser();
  if (!sandboxEnabled()) notFound();
  const { data: p } = await supabase.from("payments").select("id, amount_sen, status, method").eq("id", id).maybeSingle();
  if (!p) notFound();

  return (
    <>
      <PageHeader title="Test payment page" />
      <Notice kind="info">This stands in for the bank or card page. No real money moves.</Notice>
      <Card className="space-y-3">
        <p className="text-2xl font-semibold">{rm(p.amount_sen)}</p>
        <p className="text-sm text-zinc-500">Method: {p.method} · Status: {p.status}</p>
        {p.status === "pending" ? (
          <div className="flex flex-wrap gap-2">
            <form action={finishSandboxPayment.bind(null, p.id, "paid")}>
              <Button type="submit">Pay successfully</Button>
            </form>
            <form action={finishSandboxPayment.bind(null, p.id, "failed")}>
              <Button type="submit" variant="danger">
                Make it fail
              </Button>
            </form>
          </div>
        ) : (
          <p className="text-sm">This payment is already {p.status}.</p>
        )}
      </Card>
    </>
  );
}
