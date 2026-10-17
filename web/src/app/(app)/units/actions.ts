"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/supabase/server";
import { UNIT_TYPES, optional, optionalNumber, type UnitType } from "@/lib/units";

function fields(formData: FormData) {
  const type = String(formData.get("unit_type") ?? "wall_split");
  return {
    nickname: optional(formData, "nickname"),
    brand: optional(formData, "brand"),
    model: optional(formData, "model"),
    serial_number: optional(formData, "serial_number"),
    unit_type: (UNIT_TYPES.some((t) => t.value === type) ? type : "other") as UnitType,
    horsepower: optionalNumber(formData, "horsepower"),
    refrigerant: optional(formData, "refrigerant"),
    install_date: optional(formData, "install_date"),
    warranty_ends_on: optional(formData, "warranty_ends_on"),
    location_in_property: optional(formData, "location_in_property"),
    address_id: optional(formData, "address_id"),
    notes: optional(formData, "notes"),
  };
}

export async function createUnit(formData: FormData) {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("units")
    .insert({ ...fields(formData), customer_id: user.id })
    .select("id")
    .single();
  if (error || !data) redirect(`/units/new?error=${encodeURIComponent(error?.message ?? "Could not save the unit")}`);
  redirect(`/units/${data.id}`);
}

export async function updateUnit(id: string, formData: FormData) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("units").update(fields(formData)).eq("id", id);
  if (error) redirect(`/units/${id}?error=${encodeURIComponent(error.message)}`);
  redirect(`/units/${id}?saved=1`);
}

export async function setArchived(id: string, archived: boolean) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("units").update({ is_archived: archived }).eq("id", id);
  if (error) redirect(`/units/${id}?error=${encodeURIComponent(error.message)}`);
  redirect(archived ? "/units" : `/units/${id}`);
}

export async function deleteUnit(id: string) {
  const { supabase, user } = await requireUser();
  const { data: files } = await supabase.storage.from("unit-photos").list(`${user.id}/${id}`);
  if (files && files.length > 0) {
    await supabase.storage.from("unit-photos").remove(files.map((f) => `${user.id}/${id}/${f.name}`));
  }
  const { error } = await supabase.from("units").delete().eq("id", id);
  if (error) {
    redirect(
      `/units/${id}?error=${encodeURIComponent(
        error.code === "23503" ? "This unit has a booking, so it can be archived but not deleted." : error.message,
      )}`,
    );
  }
  redirect("/units");
}

/** Called by the browser after it has uploaded a photo. Checks the path belongs to this user and unit. */
export async function setNameplatePhoto(unitId: string, path: string) {
  const { supabase, user } = await requireUser();
  if (!path.startsWith(`${user.id}/${unitId}/`)) return { error: "Invalid file path" };
  const { data: unit } = await supabase.from("units").select("nameplate_photo_path").eq("id", unitId).single();
  const { error } = await supabase.from("units").update({ nameplate_photo_path: path }).eq("id", unitId);
  if (error) return { error: error.message };
  if (unit?.nameplate_photo_path && unit.nameplate_photo_path !== path) {
    await supabase.storage.from("unit-photos").remove([unit.nameplate_photo_path]);
  }
  revalidatePath(`/units/${unitId}`);
  return { error: null };
}
