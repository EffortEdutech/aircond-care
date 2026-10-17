import { settleBookings } from "@/lib/settle";

export const dynamic = "force-dynamic";

/** Called once a day by Vercel Cron (see vercel.json). Vercel sends the CRON_SECRET as a bearer token. */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "unauthorised" }, { status: 401 });
  }
  const result = await settleBookings();
  return Response.json(result, { status: result.errors.length ? 500 : 200 });
}
