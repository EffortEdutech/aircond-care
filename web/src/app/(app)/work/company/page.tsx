import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/supabase/server";
import { getWorkspace } from "@/lib/workspace";
import { Button, Card, Field, Input, Notice, PageHeader, Select, Textarea } from "@/components/ui";
import { UNIT_TYPES, unitTypeLabel } from "@/lib/units";
import { dateTime, rm } from "@/lib/format";
import { addArea, addMember, addService, removeArea, removeService, setMemberActive, updateProfile } from "./actions";
import { DocUpload } from "./doc-upload";

export const metadata: Metadata = { title: "Company settings" };

const DOC_LABEL: Record<string, string> = {
  ssm_registration: "SSM registration",
  business_licence: "Business licence",
  insurance: "Insurance",
  identity: "Owner identity",
};

export default async function CompanyPage({ searchParams }: PageProps<"/work/company">) {
  const [sp, { supabase, user }] = await Promise.all([searchParams, requireUser()]);
  const error = Array.isArray(sp.error) ? sp.error[0] : sp.error;
  const ws = await getWorkspace(supabase, user.id);
  if (!ws.company) redirect("/work/onboard");
  if (!ws.isManager) redirect("/work");
  const isOwner = ws.company.role === "owner";
  const cid = ws.company.id;

  const [{ data: company }, { data: services }, { data: types }, { data: areas }, { data: allAreas }, { data: members }, { data: docs }] = await Promise.all([
    supabase.from("companies").select("name, description, phone, email, status, suspended_reason").eq("id", cid).single(),
    supabase.from("company_services").select("id, service_type_code, unit_type, price_sen, duration_minutes").eq("company_id", cid).eq("is_active", true).order("service_type_code"),
    supabase.from("service_types").select("code, name").order("sort_order"),
    supabase.from("company_service_areas").select("service_area_id, call_out_fee_sen, service_areas(state, district)").eq("company_id", cid),
    supabase.from("service_areas").select("id, state, district").order("state").order("district"),
    supabase.from("company_members").select("user_id, role, is_active, profiles(full_name, email)").eq("company_id", cid),
    supabase.from("company_documents").select("id, doc_type, status, expires_on, review_note, created_at").eq("company_id", cid).order("created_at", { ascending: false }),
  ]);
  const typeName = new Map((types ?? []).map((t) => [t.code, t.name]));
  const covered = new Set((areas ?? []).map((a) => a.service_area_id));
  const statusStyle = { approved: "text-emerald-700", rejected: "text-red-700", pending: "text-amber-700" } as Record<string, string>;

  return (
    <>
      <p className="mb-2 text-sm">
        <Link href="/work" className="text-sky-700 underline">
          Back to bookings
        </Link>
      </p>
      <PageHeader title="Company settings" />
      {error ? <Notice kind="error">{error}</Notice> : null}
      <p className="mb-6 text-sm">
        Status:{" "}
        <strong>{company?.status === "verified" ? "Verified" : company?.status === "suspended" ? "Suspended" : "Pending verification"}</strong>
        {company?.suspended_reason ? ` · ${company.suspended_reason}` : ""}
      </p>

      <h2 className="mb-2 text-lg font-semibold">Profile</h2>
      <Card className="mb-8">
        <form action={updateProfile.bind(null, cid)} className="space-y-3">
          <Field label="Trading name">
            <Input name="name" defaultValue={company?.name ?? ""} required disabled={!isOwner} />
          </Field>
          <Field label="About">
            <Textarea name="description" defaultValue={company?.description ?? ""} disabled={!isOwner} />
          </Field>
          <Field label="Phone">
            <Input name="phone" defaultValue={company?.phone ?? ""} disabled={!isOwner} />
          </Field>
          <Field label="Email">
            <Input name="email" type="email" defaultValue={company?.email ?? ""} disabled={!isOwner} />
          </Field>
          {isOwner ? <Button type="submit">Save profile</Button> : <p className="text-sm text-zinc-500">Only the owner can edit the profile.</p>}
        </form>
      </Card>

      <h2 className="mb-2 text-lg font-semibold">Services and prices</h2>
      <Card className="mb-8 space-y-4">
        <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {(services ?? []).map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-2 py-2 text-sm">
              <span>
                {typeName.get(s.service_type_code) ?? s.service_type_code}
                <span className="block text-xs text-zinc-500">
                  {s.unit_type ? unitTypeLabel(s.unit_type) : "Any unit type"}
                  {s.duration_minutes ? ` · ${s.duration_minutes} min` : ""}
                </span>
              </span>
              <span className="flex items-center gap-3">
                {rm(s.price_sen)}
                <form action={removeService.bind(null, s.id)}>
                  <button className="text-red-700 underline" aria-label="Remove service">Remove</button>
                </form>
              </span>
            </li>
          ))}
          {(services ?? []).length === 0 ? <li className="py-2 text-sm text-zinc-500">No services yet. Customers cannot book you until you add one.</li> : null}
        </ul>
        <form action={addService.bind(null, cid)} className="grid gap-2 border-t border-zinc-200 pt-3 dark:border-zinc-800 sm:grid-cols-2">
          <Select name="service" required defaultValue="" aria-label="Service">
            <option value="" disabled>
              Service
            </option>
            {(types ?? []).map((t) => (
              <option key={t.code} value={t.code}>
                {t.name}
              </option>
            ))}
          </Select>
          <Select name="unit_type" defaultValue="" aria-label="Unit type">
            <option value="">Any unit type</option>
            {UNIT_TYPES.map((u) => (
              <option key={u.value} value={u.value}>
                {u.label}
              </option>
            ))}
          </Select>
          <Input name="price" inputMode="decimal" placeholder="Price in RM (empty = by quote)" aria-label="Price" />
          <Input name="minutes" type="number" min="15" step="15" placeholder="Minutes" aria-label="Duration in minutes" />
          <Button type="submit" className="sm:col-span-2">Add service</Button>
        </form>
      </Card>

      <h2 className="mb-2 text-lg font-semibold">Where you work</h2>
      <Card className="mb-8 space-y-4">
        <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {(areas ?? []).map((a) => (
            <li key={a.service_area_id} className="flex items-center justify-between gap-2 py-2 text-sm">
              <span>
                {a.service_areas?.district}, {a.service_areas?.state}
              </span>
              <span className="flex items-center gap-3">
                Call-out {rm(a.call_out_fee_sen)}
                <form action={removeArea.bind(null, cid, a.service_area_id)}>
                  <button className="text-red-700 underline">Remove</button>
                </form>
              </span>
            </li>
          ))}
          {(areas ?? []).length === 0 ? <li className="py-2 text-sm text-zinc-500">No areas yet. Customers find you by area.</li> : null}
        </ul>
        <form action={addArea.bind(null, cid)} className="grid gap-2 border-t border-zinc-200 pt-3 dark:border-zinc-800 sm:grid-cols-2">
          <Select name="area" required defaultValue="" aria-label="Area">
            <option value="" disabled>
              Area
            </option>
            {(allAreas ?? []).filter((a) => !covered.has(a.id)).map((a) => (
              <option key={a.id} value={a.id}>
                {a.district}, {a.state}
              </option>
            ))}
          </Select>
          <Input name="fee" inputMode="decimal" defaultValue="0" placeholder="Call-out fee in RM" aria-label="Call-out fee" />
          <Button type="submit" className="sm:col-span-2">Add area</Button>
        </form>
      </Card>

      <h2 className="mb-2 text-lg font-semibold">Team</h2>
      <Card className="mb-8 space-y-4">
        <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {(members ?? []).map((m) => (
            <li key={m.user_id} className="flex items-center justify-between gap-2 py-2 text-sm">
              <span>
                {m.profiles?.full_name ?? "Member"} <span className="text-zinc-500">· {m.role}{m.is_active ? "" : " · inactive"}</span>
                <span className="block text-xs text-zinc-500">{m.profiles?.email}</span>
              </span>
              {isOwner && m.user_id !== user.id ? (
                <form action={setMemberActive.bind(null, cid, m.user_id, !m.is_active)}>
                  <button className="text-sky-700 underline">{m.is_active ? "Deactivate" : "Reactivate"}</button>
                </form>
              ) : null}
            </li>
          ))}
        </ul>
        {isOwner ? (
          <form action={addMember.bind(null, cid)} className="grid gap-2 border-t border-zinc-200 pt-3 dark:border-zinc-800 sm:grid-cols-2">
            <Input name="email" type="email" required placeholder="Their sign-up email" aria-label="Email" />
            <Select name="role" defaultValue="technician" aria-label="Role">
              <option value="technician">Technician</option>
              <option value="dispatcher">Dispatcher</option>
              <option value="owner">Owner</option>
            </Select>
            <Button type="submit" className="sm:col-span-2">Add to team</Button>
            <p className="text-xs text-zinc-500 sm:col-span-2">They must already have an account. The starter plan allows one member; plans arrive in a later sprint.</p>
          </form>
        ) : null}
      </Card>

      <h2 className="mb-2 text-lg font-semibold">Verification documents</h2>
      <Card className="mb-8 space-y-4">
        <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {(docs ?? []).map((d) => (
            <li key={d.id} className="py-2 text-sm">
              <span className="font-medium">{DOC_LABEL[d.doc_type] ?? d.doc_type}</span>{" "}
              <span className={statusStyle[d.status]}>{d.status}</span>
              <span className="block text-xs text-zinc-500">
                Uploaded {dateTime(d.created_at)}
                {d.expires_on ? ` · expires ${d.expires_on}` : ""}
                {d.review_note ? ` · ${d.review_note}` : ""}
              </span>
            </li>
          ))}
          {(docs ?? []).length === 0 ? <li className="py-2 text-sm text-zinc-500">No documents yet.</li> : null}
        </ul>
        {isOwner ? <DocUpload companyId={cid} /> : null}
      </Card>
    </>
  );
}
