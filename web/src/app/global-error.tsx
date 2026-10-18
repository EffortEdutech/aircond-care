"use client";

/** Last-resort screen when even the root layout fails. Plain styles: no app CSS can be assumed. */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", maxWidth: 420, margin: "4rem auto", padding: "0 1rem" }}>
        <h1 style={{ fontSize: "1.5rem" }}>Something went wrong</h1>
        <p>Please try again. If it keeps happening, email support and quote the reference below.</p>
        {error.digest ? <p style={{ fontFamily: "monospace", fontSize: 12 }}>Reference: {error.digest}</p> : null}
        <button type="button" onClick={reset} style={{ padding: "0.6rem 1.2rem", fontSize: "1rem" }}>
          Try again
        </button>
      </body>
    </html>
  );
}
