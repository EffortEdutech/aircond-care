import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/**
 * Supabase client that bypasses row-level security. Server code only, and only for the
 * payment webhook. The key must never reach the browser: do not prefix it with NEXT_PUBLIC_.
 */
export function createServiceClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  return createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
