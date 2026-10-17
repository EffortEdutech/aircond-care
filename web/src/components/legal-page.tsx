import Link from "next/link";
import type { ReactNode } from "react";
import { LEGAL_IS_DRAFT, TERMS_VERSION } from "@/lib/legal";

const LINKS = [
  { href: "/terms", label: "Terms of Service" },
  { href: "/privacy", label: "Privacy Notice" },
  { href: "/refunds", label: "Refund Policy" },
  { href: "/contractor-terms", label: "Contractor Agreement" },
  { href: "/support", label: "Support" },
];

export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8">
      <Link href="/" className="text-sm text-sky-700 underline dark:text-sky-400">
        Aircond Care
      </Link>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight">{title}</h1>
      {LEGAL_IS_DRAFT ? (
        <p className="mt-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100">
          Draft for review. This text has not yet been checked by a lawyer and may change before launch.
        </p>
      ) : null}
      <p className="mt-2 text-xs text-zinc-500">Version {TERMS_VERSION}</p>
      <div className="mt-6 space-y-4 text-base leading-relaxed [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-semibold [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-6">
        {children}
      </div>
      <nav className="mt-10 flex flex-wrap gap-x-4 gap-y-2 border-t border-zinc-200 pt-4 text-sm dark:border-zinc-800" aria-label="Legal">
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href} className="text-sky-700 underline dark:text-sky-400">
            {l.label}
          </Link>
        ))}
      </nav>
    </main>
  );
}

export function LegalFooterLinks() {
  return (
    <p className="mt-8 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-zinc-500">
      {LINKS.map((l) => (
        <Link key={l.href} href={l.href} className="underline">
          {l.label}
        </Link>
      ))}
    </p>
  );
}
