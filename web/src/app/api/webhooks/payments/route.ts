import { processWebhook } from "@/lib/payments/process";

export const dynamic = "force-dynamic";

/** The gateway calls this when a payment succeeds or fails. The body is read raw so the signature can be checked. */
export async function POST(request: Request) {
  const raw = await request.text();
  const { status, result } = await processWebhook(raw, request.headers.get("x-signature"));
  return Response.json({ result }, { status });
}
