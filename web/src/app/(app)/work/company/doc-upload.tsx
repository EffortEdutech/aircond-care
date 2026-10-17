"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { recordDocument } from "./actions";

const TYPES = [
  ["ssm_registration", "SSM registration"],
  ["business_licence", "Business licence"],
  ["insurance", "Insurance"],
  ["identity", "Owner identity"],
] as const;

export function DocUpload({ companyId }: { companyId: string }) {
  const router = useRouter();
  const file = useRef<HTMLInputElement>(null);
  const [type, setType] = useState<string>(TYPES[0][0]);
  const [expires, setExpires] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [, startTransition] = useTransition();

  async function upload() {
    const f = file.current?.files?.[0];
    if (!f) return setError("Choose a file first (PDF, JPG or PNG, up to 10 MB).");
    setError(null);
    setBusy(true);
    try {
      const ext = f.name.split(".").pop()?.toLowerCase() || "pdf";
      const path = `${companyId}/${type}-${Date.now()}.${ext}`;
      const { error: upErr } = await createClient().storage.from("company-documents").upload(path, f, { contentType: f.type });
      if (upErr) throw new Error(upErr.message);
      const result = await recordDocument(companyId, type, path, expires || null);
      if (result.error) throw new Error(result.error);
      if (file.current) file.current.value = "";
      startTransition(() => router.refresh());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  const field = "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-base dark:border-zinc-700 dark:bg-zinc-900";
  return (
    <div className="space-y-3">
      <select value={type} onChange={(e) => setType(e.target.value)} className={field} aria-label="Document type">
        {TYPES.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
      <input ref={file} type="file" accept="application/pdf,image/jpeg,image/png" className={field} aria-label="File" />
      <label className="block text-sm">
        Expiry date (if any)
        <input type="date" value={expires} onChange={(e) => setExpires(e.target.value)} className={`${field} mt-1`} />
      </label>
      {error ? <p role="alert" className="text-sm text-red-700">{error}</p> : null}
      <button
        type="button"
        onClick={upload}
        disabled={busy}
        className="inline-flex min-h-11 items-center rounded-lg bg-sky-700 px-4 py-2 font-medium text-white disabled:opacity-60"
      >
        {busy ? "Uploading..." : "Upload document"}
      </button>
    </div>
  );
}
