import type { Metadata } from "next";
import { updateProfile } from "./actions";
import { requireUser } from "@/lib/supabase/server";
import { LOCALES, LOCALE_NAMES, getT } from "@/lib/i18n";
import { Button, Card, Field, Input, Notice, PageHeader, Select } from "@/components/ui";

export const metadata: Metadata = { title: "Account" };

export default async function AccountPage({ searchParams }: PageProps<"/account">) {
  const [{ supabase, user }, t, params] = await Promise.all([requireUser(), getT(), searchParams]);
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  const error = typeof params.error === "string" ? params.error : null;
  const check = "h-5 w-5 rounded border-zinc-300 text-sky-700 focus:ring-sky-600";
  return (
    <>
      <PageHeader title={t("account")} />
      {error ? <Notice kind="error">{error}</Notice> : null}
      {params.saved ? <Notice kind="info">Saved.</Notice> : null}
      <Card>
        <form action={updateProfile} className="space-y-4">
          <Field label={t("email")}>
            <Input value={profile?.email ?? user.email ?? ""} readOnly disabled />
          </Field>
          <Field label={t("fullName")}>
            <Input name="full_name" defaultValue={profile?.full_name ?? ""} required />
          </Field>
          <Field label={t("phone")} hint="Used for WhatsApp updates, for example +60123456789">
            <Input name="phone" type="tel" defaultValue={profile?.phone ?? ""} autoComplete="tel" />
          </Field>
          <Field label={t("language")}>
            <Select name="locale" defaultValue={profile?.locale ?? "en"}>
              {LOCALES.map((l) => (
                <option key={l} value={l}>
                  {LOCALE_NAMES[l]}
                </option>
              ))}
            </Select>
          </Field>
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Send me updates by</legend>
            <label className="flex items-center gap-3 text-base">
              <input type="checkbox" name="notify_email" defaultChecked={profile?.notify_email ?? true} className={check} /> Email
            </label>
            <label className="flex items-center gap-3 text-base">
              <input type="checkbox" name="notify_push" defaultChecked={profile?.notify_push ?? true} className={check} /> Push
            </label>
            <label className="flex items-center gap-3 text-base">
              <input type="checkbox" name="notify_whatsapp" defaultChecked={profile?.notify_whatsapp ?? true} className={check} /> WhatsApp
            </label>
          </fieldset>
          <Button type="submit">{t("save")}</Button>
        </form>
      </Card>
    </>
  );
}
