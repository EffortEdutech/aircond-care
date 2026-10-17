import type { Metadata } from "next";
import Link from "next/link";
import { signUp } from "../actions";
import { Button, Card, Field, Input, Notice } from "@/components/ui";
import { getT } from "@/lib/i18n";

export const metadata: Metadata = { title: "Create account" };

export default async function SignupPage({ searchParams }: PageProps<"/signup">) {
  const [t, params] = await Promise.all([getT(), searchParams]);
  const error = typeof params.error === "string" ? params.error : null;
  return (
    <main className="mx-auto w-full max-w-md px-4 py-10">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">{t("signUp")}</h1>
      {error ? <Notice kind="error">{error}</Notice> : null}
      <Card>
        <form action={signUp} className="space-y-4">
          <Field label={t("fullName")}>
            <Input name="full_name" autoComplete="name" required />
          </Field>
          <Field label={t("email")}>
            <Input name="email" type="email" autoComplete="email" required />
          </Field>
          <Field label={t("password")} hint="At least 8 characters">
            <Input name="password" type="password" autoComplete="new-password" minLength={8} required />
          </Field>
          <label className="flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              name="accept_terms"
              required
              className="mt-0.5 h-5 w-5 shrink-0 rounded border-zinc-300 text-sky-700 focus:ring-sky-600"
            />
            <span>
              I am at least 18 and I agree to the{" "}
              <Link href="/terms" target="_blank" className="font-medium text-sky-700 underline dark:text-sky-400">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" target="_blank" className="font-medium text-sky-700 underline dark:text-sky-400">
                Privacy Notice
              </Link>
              .
            </span>
          </label>
          <Button type="submit" className="w-full">
            {t("signUp")}
          </Button>
        </form>
      </Card>
      <p className="mt-4 text-center text-sm text-zinc-600 dark:text-zinc-400">
        <Link href="/login" className="font-medium text-sky-700 underline dark:text-sky-400">
          {t("signIn")}
        </Link>
      </p>
    </main>
  );
}
