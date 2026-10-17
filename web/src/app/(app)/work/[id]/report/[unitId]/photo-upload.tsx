"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { addPhoto } from "../actions";

const MAX_SIDE = 1600;
const KINDS = [
  ["before", "Before"],
  ["after", "After"],
  ["nameplate", "Nameplate"],
  ["fault", "Fault"],
  ["other", "Other"],
] as const;

/** Shrinks a phone photo before upload so it is quick on mobile data. */
async function shrink(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not process the image"))), "image/jpeg", 0.82),
  );
}

export function ReportPhotoUpload({ reportId, companyId, bookingId }: { reportId: string; companyId: string; bookingId: string }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [kind, setKind] = useState<string>("before");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [, startTransition] = useTransition();

  async function onChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError(null);
    setBusy(true);
    try {
      const blob = await shrink(file);
      const path = `${companyId}/${bookingId}/${kind}-${Date.now()}.jpg`;
      const { error: upErr } = await createClient().storage.from("job-report-photos").upload(path, blob, { contentType: "image/jpeg" });
      if (upErr) throw new Error(upErr.message);
      const result = await addPhoto(reportId, path, kind, null);
      if (result.error) throw new Error(result.error);
      startTransition(() => router.refresh());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value)}
          aria-label="Photo type"
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2.5 dark:border-zinc-700 dark:bg-zinc-900"
        >
          {KINDS.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        <input ref={input} id="report-photo" type="file" accept="image/*" capture="environment" onChange={onChange} className="sr-only" />
        <label
          htmlFor="report-photo"
          className="inline-flex min-h-11 cursor-pointer items-center rounded-lg bg-sky-700 px-4 py-2 font-medium text-white"
        >
          {busy ? "Uploading..." : "Take or choose photo"}
        </label>
      </div>
      {error ? <p role="alert" className="text-sm text-red-700">{error}</p> : null}
    </div>
  );
}
