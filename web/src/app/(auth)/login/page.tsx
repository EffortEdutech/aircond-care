import type { Metadata } from "next";
import Link from "next/link";
import { signIn } from "../actions";
import { Button, Card, Field, Input, Notice } from "@/components/ui";
import { getT } from "@/lib/i18n";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const [t, params] = await Promise.all([getT(), searchParams]);
  const error = typeof params.error === "string" ? params.error : null;
  const notice = params.notice === "check-email";
  return (
    <main className="mx-auto w-full max-w-md px-4 py-10">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">{t("signIn")}</h1>
      {error ? <Notice kind="error">{error}</Notice> : null}
      {notice ? <Notice kind="info">{t("checkEmail")}</Notice> : null}
      <Card>
        <form action={signIn} className="space-y-4">
          <Field label={t("email")}>
            <Input name="email" type="email" autoComplete="email" required />
          </Field>
          <Field label={t("password")}>
            <Input name="password" type="password" autoComplete="current-password" required />
          </Field>
          <Button type="submit" className="w-full">
            {t("signIn")}
          </Button>
        </form>
      </Card>
      <p className="mt-4 text-center text-sm text-zinc-600 dark:text-zinc-400">
        <Link href="/signup" className="font-medium text-sky-700 underline dark:text-sky-400">
          {t("signUp")}
        </Link>
      </p>
    </main>
  );
}
