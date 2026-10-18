import { createServiceClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const REQUIRED_ENV = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_SITE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "CRON_SECRET",
  "PAYMENT_GATEWAY",
  "PAYMENT_WEBHOOK_SECRET",
];

/**
 * Uptime check. Public answer: ok or not, and whether the database responds.
 * With the cron secret as a Bearer token it also lists which environment variables are missing
 * (names only, never values) and how many payouts, disputes and deletion requests are waiting.
 */
export async function GET(request: Request) {
  const started = Date.now();
  let dbOk = false;
  try {
    const db = createServiceClient();
    const { error } = await db.from("subscription_plans").select("code").limit(1);
    dbOk = !error;
  } catch {
    dbOk = false;
  }

  const body: Record<string, unknown> = {
    ok: dbOk,
    db: dbOk ? "up" : "down",
    ms: Date.now() - started,
    version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "dev",
  };

  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") === `Bearer ${secret}`) {
    body.missingEnv = REQUIRED_ENV.filter((k) => !process.env[k]);
    if (dbOk) {
      const db = createServiceClient();
      const [disputes, deletions, payouts] = await Promise.all([
        db.from("disputes").select("id", { count: "exact", head: true }).in("status", ["open", "under_review"]),
        db.from("account_deletion_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
        db.from("payouts").select("id", { count: "exact", head: true }).eq("status", "queued"),
      ]);
      body.waiting = { openDisputes: disputes.count ?? 0, deletionRequests: deletions.count ?? 0, queuedPayouts: payouts.count ?? 0 };
    }
  }

  return Response.json(body, { status: dbOk ? 200 : 503, headers: { "Cache-Control": "no-store" } });
}
