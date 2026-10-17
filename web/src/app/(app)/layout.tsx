import Link from "next/link";
import { requireUser } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n";
import { signOut } from "../(auth)/actions";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await requireUser();
  const t = await getT();
  const link = "rounded-lg px-3 py-2 text-sm font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800";
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-2 px-4 py-2">
          <Link href="/units" className="font-semibold tracking-tight">
            {t("appName")}
          </Link>
          <nav className="flex items-center gap-1">
            <Link href="/contractors" className={link}>
              {t("findContractor")}
            </Link>
            <Link href="/bookings" className={link}>
              {t("bookings")}
            </Link>
            <Link href="/units" className={link}>
              {t("units")}
            </Link>
            <Link href="/addresses" className={link}>
              {t("addresses")}
            </Link>
            <Link href="/account" className={link}>
              {t("account")}
            </Link>
            <form action={signOut}>
              <button className={`${link} text-zinc-600 dark:text-zinc-400`}>{t("signOut")}</button>
            </form>
          </nav>
        </div>
      </header>
      <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">{children}</div>
    </div>
  );
}
