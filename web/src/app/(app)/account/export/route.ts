import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** Downloads everything the platform holds about the signed-in user, as JSON. */
export async function GET() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return new Response("Sign in first", { status: 401 });
  const { data, error } = await supabase.rpc("export_my_data");
  if (error) return new Response(error.message, { status: 500 });
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "content-type": "application/json",
      "content-disposition": `attachment; filename="aircond-care-my-data.json"`,
      "cache-control": "no-store",
    },
  });
}
