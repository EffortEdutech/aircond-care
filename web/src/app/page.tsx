import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n";
import { LegalFooterLinks } from "@/components/legal-page";

export default async function Home() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (data.user) redirect("/units");
  const t = await getT();
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12">
      <h1 className="text-4xl font-semibold tracking-tight">{t("appName")}</h1>
      <p className="mt-3 text-lg text-zinc-600 dark:text-zinc-400">{t("tagline")}</p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/signup"
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-sky-700 px-5 py-2 font-medium text-white hover:bg-sky-800"
        >
          {t("signUp")}
        </Link>
        <Link
          href="/login"
          className="inline-flex min-h-11 items-center justify-center rounded-lg border border-zinc-300 px-5 py-2 font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
        >
          {t("signIn")}
        </Link>
      </div>
      <LegalFooterLinks />
    </main>
  );
}
