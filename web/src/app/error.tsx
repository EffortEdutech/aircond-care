"use client";

import Link from "next/link";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Something went wrong</h1>
      <p className="mt-3 text-zinc-600 dark:text-zinc-400">
        We could not load this page. Please try again. If it keeps happening, contact support and quote the reference below.
      </p>
      {error.digest ? <p className="mt-2 font-mono text-xs text-zinc-500">Reference: {error.digest}</p> : null}
      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex min-h-11 items-center rounded-lg bg-sky-700 px-5 py-2 font-medium text-white hover:bg-sky-800"
        >
          Try again
        </button>
        <Link href="/support" className="inline-flex min-h-11 items-center px-3 py-2 font-medium text-sky-700 underline dark:text-sky-400">
          Contact support
        </Link>
      </div>
    </main>
  );
}
