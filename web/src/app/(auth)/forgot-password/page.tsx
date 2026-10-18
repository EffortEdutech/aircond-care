import type { Metadata } from "next";
import Link from "next/link";
import { requestPasswordReset } from "../actions";
import { Button, Card, Field, Input, Notice } from "@/components/ui";

export const metadata: Metadata = { title: "Forgot password" };

export default async function ForgotPasswordPage({ searchParams }: PageProps<"/forgot-password">) {
  const params = await searchParams;
  const error = typeof params.error === "string" ? params.error : null;
  return (
    <main id="main" className="mx-auto w-full max-w-md px-4 py-10">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Reset your password</h1>
      {error ? <Notice kind="error">{error}</Notice> : null}
      {params.sent ? <Notice kind="info">If that email has an account, a reset link is on its way. Check your inbox.</Notice> : null}
      <Card>
        <form action={requestPasswordReset} className="space-y-4">
          <Field label="Email">
            <Input name="email" type="email" autoComplete="email" required />
          </Field>
          <Button type="submit" className="w-full">Send reset link</Button>
        </form>
      </Card>
      <p className="mt-4 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100">
        Reset emails are limited while the service is in testing, so a message may be delayed or not arrive. If you do not receive one,
        contact support and we will set a temporary password for you.
      </p>
      <p className="mt-4 text-center text-sm">
        <Link href="/login" className="font-medium text-sky-700 underline dark:text-sky-400">Back to sign in</Link>
      </p>
    </main>
  );
}
