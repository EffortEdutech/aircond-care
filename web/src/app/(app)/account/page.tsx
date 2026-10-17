import type { Metadata } from "next";
import { cancelDeletion, requestDeletion, updateProfile } from "./actions";
import { requireUser } from "@/lib/supabase/server";
import { LOCALES, LOCALE_NAMES, getT } from "@/lib/i18n";
import { Button, Card, Field, Input, Notice, PageHeader, Select } from "@/components/ui";

export const metadata: Metadata = { title: "Account" };

export default async function AccountPage({ searchParams }: PageProps<"/account">) {
  const [{ supabase, user }, t, params] = await Promise.all([requireUser(), getT(), searchParams]);
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  const error = typeof params.error === "string" ? params.error : null;
  const { data: pendingDeletion } = await supabase
    .from("account_deletion_requests")
    .select("id, created_at")
    .eq("user_id", user.id)
    .eq("status", "pending")
    .maybeSingle();
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
              <input type="checkbox" name="notify_in_app" defaultChecked={profile?.notify_in_app ?? true} className={check} /> Alerts in the app
            </label>
            <p className="-mt-1 pl-8 text-xs text-zinc-500">
              Untick to mute chat messages, service reminders and visit updates. Payment, refund and problem-report alerts always arrive.
            </p>
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
      <Card className="mt-6 space-y-2 text-sm">
        <h2 className="font-semibold">Your data</h2>
        <p className="text-zinc-600 dark:text-zinc-400">Download a copy of your profile, addresses, units, bookings and reviews.</p>
        <a href="/account/export" className="inline-flex min-h-11 items-center rounded-lg border border-zinc-300 px-4 py-2 font-medium dark:border-zinc-700">
          Download my data
        </a>
      </Card>
      <Card className="mt-6 space-y-3 text-sm">
        <h2 className="font-semibold">Delete my account</h2>
        {params.deletion === "requested" ? <Notice kind="info">Request sent. We will review it and email or message you.</Notice> : null}
        {params.deletion === "cancelled" ? <Notice kind="info">Request cancelled.</Notice> : null}
        {pendingDeletion ? (
          <>
            <p className="text-zinc-600 dark:text-zinc-400">
              Your deletion request is waiting for review (sent {new Date(pendingDeletion.created_at).toLocaleDateString("en-MY")}).
            </p>
            <form action={cancelDeletion}>
              <Button type="submit" variant="secondary">Cancel the request</Button>
            </form>
          </>
        ) : (
          <form action={requestDeletion} className="space-y-3">
            <p className="text-zinc-600 dark:text-zinc-400">
              We remove your name and contact details and close your sign-in. We cannot do this while you have a booking in progress. Payment
              records stay for accounting, without your personal details.
            </p>
            <Field label="Why are you leaving? (optional)">
              <Input name="reason" maxLength={300} />
            </Field>
            <Button type="submit" variant="secondary">Request account deletion</Button>
          </form>
        )}
      </Card>
      <p className="mt-6 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
        <a href="/terms" className="underline">Terms</a>
        <a href="/privacy" className="underline">Privacy</a>
        <a href="/refunds" className="underline">Refunds</a>
        <a href="/support" className="underline">Support</a>
      </p>
    </>
  );
}
