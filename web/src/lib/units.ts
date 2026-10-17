import type { Database } from "@/lib/supabase/database.types";

export type UnitType = Database["public"]["Enums"]["unit_type"];

export const UNIT_TYPES: { value: UnitType; label: string }[] = [
  { value: "wall_split", label: "Wall split" },
  { value: "cassette", label: "Ceiling cassette" },
  { value: "ceiling_concealed", label: "Ceiling concealed" },
  { value: "ceiling_exposed", label: "Ceiling exposed" },
  { value: "window", label: "Window" },
  { value: "multi_split", label: "Multi split (system)" },
  { value: "portable", label: "Portable" },
  { value: "other", label: "Other" },
];

export function unitTypeLabel(value: string) {
  return UNIT_TYPES.find((t) => t.value === value)?.label ?? value;
}

/** Reads a text field; empty becomes null. */
export function optional(formData: FormData, key: string): string | null {
  const value = String(formData.get(key) ?? "").trim();
  return value === "" ? null : value;
}

export function optionalNumber(formData: FormData, key: string): number | null {
  const value = optional(formData, key);
  if (value === null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}
