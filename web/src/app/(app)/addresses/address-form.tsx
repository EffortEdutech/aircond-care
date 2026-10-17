import type { Tables } from "@/lib/supabase/database.types";
import { Button, Field, Input, Select, Textarea } from "@/components/ui";

type Address = Tables<"addresses">;
type Area = Pick<Tables<"service_areas">, "id" | "state" | "district">;

export function AddressForm({
  action,
  areas,
  address,
  submitLabel,
}: {
  action: (formData: FormData) => void | Promise<void>;
  areas: Area[];
  address?: Address;
  submitLabel: string;
}) {
  return (
    <form action={action} className="space-y-4">
      <Field label="Label">
        <Input name="label" defaultValue={address?.label ?? "Home"} placeholder="Home, Shop, Office" />
      </Field>
      <Field label="Street address">
        <Input name="line1" defaultValue={address?.line1 ?? ""} autoComplete="address-line1" required />
      </Field>
      <Field label="Building, floor or unit (optional)">
        <Input name="line2" defaultValue={address?.line2 ?? ""} autoComplete="address-line2" />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Postcode">
          <Input name="postcode" inputMode="numeric" defaultValue={address?.postcode ?? ""} autoComplete="postal-code" />
        </Field>
        <Field label="Area">
          <Select name="service_area_id" defaultValue={address?.service_area_id ?? ""}>
            <option value="">Select area</option>
            {areas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.state}, {a.district}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label="Access notes (optional)" hint="Guard house, parking, lift access, pets">
        <Textarea name="access_notes" defaultValue={address?.access_notes ?? ""} />
      </Field>
      <label className="flex items-center gap-3 text-base">
        <input
          type="checkbox"
          name="is_default"
          defaultChecked={address?.is_default ?? false}
          className="h-5 w-5 rounded border-zinc-300 text-sky-700 focus:ring-sky-600"
        />
        Use as my default address
      </label>
      <Button type="submit">{submitLabel}</Button>
    </form>
  );
}
