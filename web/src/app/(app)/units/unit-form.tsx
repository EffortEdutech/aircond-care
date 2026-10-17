import type { Tables } from "@/lib/supabase/database.types";
import { UNIT_TYPES } from "@/lib/units";
import { Button, Field, Input, Select, Textarea } from "@/components/ui";

type Unit = Tables<"units">;
type AddressOption = Pick<Tables<"addresses">, "id" | "label" | "line1">;

export function UnitForm({
  action,
  addresses,
  unit,
  submitLabel,
}: {
  action: (formData: FormData) => void | Promise<void>;
  addresses: AddressOption[];
  unit?: Unit;
  submitLabel: string;
}) {
  return (
    <form action={action} className="space-y-4">
      <Field label="Name" hint="For example Master bedroom or Shop front">
        <Input name="nickname" defaultValue={unit?.nickname ?? ""} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Brand">
          <Input name="brand" defaultValue={unit?.brand ?? ""} placeholder="Daikin, Panasonic, Midea" />
        </Field>
        <Field label="Model">
          <Input name="model" defaultValue={unit?.model ?? ""} />
        </Field>
        <Field label="Type">
          <Select name="unit_type" defaultValue={unit?.unit_type ?? "wall_split"}>
            {UNIT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Horsepower (HP)">
          <Input name="horsepower" type="number" step="0.5" min="0.5" max="99" inputMode="decimal" defaultValue={unit?.horsepower ?? ""} />
        </Field>
        <Field label="Serial number">
          <Input name="serial_number" defaultValue={unit?.serial_number ?? ""} />
        </Field>
        <Field label="Refrigerant">
          <Input name="refrigerant" defaultValue={unit?.refrigerant ?? ""} placeholder="R32, R410A, R22" />
        </Field>
        <Field label="Installed on">
          <Input name="install_date" type="date" defaultValue={unit?.install_date ?? ""} />
        </Field>
        <Field label="Warranty ends on">
          <Input name="warranty_ends_on" type="date" defaultValue={unit?.warranty_ends_on ?? ""} />
        </Field>
      </div>
      <Field label="Address">
        <Select name="address_id" defaultValue={unit?.address_id ?? ""}>
          <option value="">No address</option>
          {addresses.map((a) => (
            <option key={a.id} value={a.id}>
              {a.label}, {a.line1}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Where in the property" hint="For example Living room, Level 2 bedroom">
        <Input name="location_in_property" defaultValue={unit?.location_in_property ?? ""} />
      </Field>
      <Field label="Notes">
        <Textarea name="notes" defaultValue={unit?.notes ?? ""} />
      </Field>
      <Button type="submit">{submitLabel}</Button>
    </form>
  );
}
