import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/supabase/server";
import { getWorkspace } from "@/lib/workspace";
import { Button, Field, Input, Notice, PageHeader } from "@/components/ui";
import { createCompany } from "../company/actions";

export const metadata: Metadata = { title: "Register your company" };

export default async function OnboardPage({ searchParams }: PageProps<"/work/onboard">) {
  const [sp, { supabase, user }] = await Promise.all([searchParams, requireUser()]);
  const ws = await getWorkspace(supabase, user.id);
  if (ws.company) redirect("/work");
  const error = Array.isArray(sp.error) ? sp.error[0] : sp.error;
  return (
    <>
      <PageHeader title="Register your company" />
      <p className="mb-4 text-zinc-600 dark:text-zinc-400">
        Set up your contractor workspace. After this, upload your SSM and licence documents so we can verify you.
      </p>
      {error ? <Notice kind="error">{error}</Notice> : null}
      <form action={createCompany} className="space-y-4">
        <Field label="Trading name" hint="Shown to customers">
          <Input name="name" required />
        </Field>
        <Field label="Registered company name">
          <Input name="legal_name" required />
        </Field>
        <Field label="SSM registration number">
          <Input name="ssm" required />
        </Field>
        <Field label="Business phone">
          <Input name="phone" type="tel" />
        </Field>
        <Field label="Business email">
          <Input name="email" type="email" />
        </Field>
        <Button type="submit">Create workspace</Button>
      </form>
    </>
  );
}
