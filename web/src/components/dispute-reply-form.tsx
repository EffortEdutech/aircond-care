"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button, Textarea } from "@/components/ui";

const MAX_SIDE = 1600;
const MAX_PHOTOS = 4;

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

/** Message box with up to four photos. Photos upload as they are chosen; the paths travel with the form. */
export function DisputeReplyForm({
  action,
  bookingId,
  userId,
}: {
  action: (formData: FormData) => void | Promise<void>;
  bookingId: string;
  userId: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [paths, setPaths] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []).slice(0, MAX_PHOTOS - paths.length);
    if (files.length === 0) return;
    setError(null);
    setBusy(true);
    try {
      const added: string[] = [];
      for (const file of files) {
        const blob = await shrink(file);
        const path = `${bookingId}/${userId}/${Date.now()}-${added.length}.jpg`;
        const { error: upErr } = await createClient().storage.from("dispute-photos").upload(path, blob, { contentType: "image/jpeg" });
        if (upErr) throw new Error(upErr.message);
        added.push(path);
      }
      setPaths((p) => [...p, ...added]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <form action={action} className="space-y-2 border-t border-zinc-200 pt-2 dark:border-zinc-800">
      <Textarea name="body" placeholder="Add details or reply" aria-label="Message" />
      {paths.map((p) => (
        <input key={p} type="hidden" name="photo" value={p} />
      ))}
      <div className="flex flex-wrap items-center gap-3">
        {paths.length < MAX_PHOTOS ? (
          <>
            <input ref={input} id="dispute-photo" type="file" accept="image/*" multiple onChange={onChange} className="sr-only" />
            <label
              htmlFor="dispute-photo"
              className="inline-flex min-h-11 cursor-pointer items-center rounded-lg border border-zinc-300 px-4 py-2 font-medium dark:border-zinc-700"
            >
              {busy ? "Uploading..." : "Add photos"}
            </label>
          </>
        ) : null}
        {paths.length > 0 ? (
          <span className="text-xs text-zinc-500">
            {paths.length} photo{paths.length === 1 ? "" : "s"} ready (up to {MAX_PHOTOS})
          </span>
        ) : null}
        <Button type="submit" variant="secondary" disabled={busy}>
          Send message
        </Button>
      </div>
      {error ? (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </form>
  );
}
