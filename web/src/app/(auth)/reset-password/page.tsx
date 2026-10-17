import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { setNewPassword } from "../actions";
import { Button, Card, Field, Input, Notice } from "@/components/ui";

export const metadata: Metadata = { title: "New password" };

export default async function ResetPasswordPage({ searchParams }: PageProps<"/reset-password">) {
  const [params, supabase] = await Promise.all([searchParams, createClient()]);
  const { data } = await supabase.auth.getUser();
  const error = typeof params.error === "string" ? params.error : null;
  return (
    <main className="mx-auto w-full max-w-md px-4 py-10">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Choose a new password</h1>
      {error ? <Notice kind="error">{error}</Notice> : null}
      {data.user ? (
        <Card>
          <form action={setNewPassword} className="space-y-4">
            <Field label="New password" hint="At least 8 characters">
              <Input name="password" type="password" autoComplete="new-password" minLength={8} required />
            </Field>
            <Field label="Confirm new password">
              <Input name="confirm" type="password" autoComplete="new-password" minLength={8} required />
            </Field>
            <Button type="submit" className="w-full">Save password</Button>
          </form>
        </Card>
      ) : (
        <Notice kind="error">
          This reset link has expired or was already used. <Link href="/forgot-password" className="underline">Ask for a new one</Link>.
        </Notice>
      )}
    </main>
  );
}
