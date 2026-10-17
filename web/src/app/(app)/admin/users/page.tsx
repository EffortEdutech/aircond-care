import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/supabase/server";
import { Button, Card, Field, Input, Notice, PageHeader } from "@/components/ui";
import { setTemporaryPassword } from "./actions";

export const metadata: Metadata = { title: "Users" };

export default async function AdminUsersPage({ searchParams }: PageProps<"/admin/users">) {
  const [sp, { supabase }] = await Promise.all([searchParams, requireUser()]);
  const { data: isAdmin } = await supabase.rpc("is_platform_admin");
  if (!isAdmin) redirect("/units");
  const error = Array.isArray(sp.error) ? sp.error[0] : sp.error;
  const done = Array.isArray(sp.done) ? sp.done[0] : sp.done;

  return (
    <>
      <p className="mb-2 text-sm">
        <Link href="/admin" className="text-sky-700 underline">← Admin</Link>
      </p>
      <PageHeader title="Users" />
      {error ? <Notice kind="error">{error}</Notice> : null}
      {done ? <Notice kind="info">Temporary password set for {done}. Tell them privately and ask them to change it after signing in.</Notice> : null}
      <Card className="space-y-3">
        <h2 className="font-semibold">Set a temporary password</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          For people who cannot receive the reset email while the free email service is limited. Check who is asking before you do this.
        </p>
        <form action={setTemporaryPassword} className="space-y-3">
          <Field label="User's email">
            <Input name="email" type="email" required autoComplete="off" />
          </Field>
          <Field label="Temporary password" hint="At least 10 characters">
            <Input name="password" type="text" minLength={10} required autoComplete="off" />
          </Field>
          <Button type="submit">Set password</Button>
        </form>
      </Card>
    </>
  );
}
