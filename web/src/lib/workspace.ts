import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

export type Role = Database["public"]["Enums"]["company_role"];

export type Workspace = {
  /** The company the person is working in (the first active membership). */
  company: { id: string; name: string; status: Database["public"]["Enums"]["company_status"]; role: Role } | null;
  isAdmin: boolean;
  /** Owners and dispatchers manage bookings; technicians only see and run their own jobs. */
  isManager: boolean;
};

export async function getWorkspace(supabase: SupabaseClient<Database>, userId: string): Promise<Workspace> {
  const [{ data: memberships }, { data: isAdmin }] = await Promise.all([
    supabase
      .from("company_members")
      .select("role, companies(id, name, status)")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("created_at")
      .limit(1),
    supabase.rpc("is_platform_admin"),
  ]);
  const m = memberships?.[0];
  const c = m?.companies;
  const company = m && c ? { id: c.id, name: c.name, status: c.status, role: m.role } : null;
  return { company, isAdmin: Boolean(isAdmin), isManager: company?.role === "owner" || company?.role === "dispatcher" };
}

/** Converts a datetime-local value (Malaysia time) to an ISO string. */
export function myTimeToIso(value: string): string {
  return new Date(`${value}:00+08:00`).toISOString();
}

/** "12.50" to 1250 sen. Returns null when the text is not a valid amount. */
export function toSen(value: string): number | null {
  const n = Number(value.replace(/[, ]/g, ""));
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : null;
}
