"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { setNameplatePhoto } from "./actions";

const MAX_SIDE = 1600;

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

export function PhotoUpload({ unitId, userId, hasPhoto }: { unitId: string; userId: string; hasPhoto: boolean }) {
  const input = useRef<HTMLInputElement>(null);
  const router = useRouter();
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
      const path = `${userId}/${unitId}/nameplate-${Date.now()}.jpg`;
      const { error: uploadError } = await createClient()
        .storage.from("unit-photos")
        .upload(path, blob, { contentType: "image/jpeg" });
      if (uploadError) throw new Error(uploadError.message);
      const result = await setNameplatePhoto(unitId, path);
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
    <div>
      <input ref={input} type="file" accept="image/*" capture="environment" onChange={onChange} className="sr-only" id="nameplate" />
      <label
        htmlFor="nameplate"
        className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-lg border border-zinc-300 bg-white px-4 py-2 text-base font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
      >
        {busy ? "Uploading..." : hasPhoto ? "Replace nameplate photo" : "Take or choose nameplate photo"}
      </label>
      {error ? (
        <p role="alert" className="mt-2 text-sm text-red-700 dark:text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}
