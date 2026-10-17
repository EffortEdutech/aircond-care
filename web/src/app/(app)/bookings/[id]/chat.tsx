"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button, Input } from "@/components/ui";

type Message = { id: string; sender_id: string; body: string; created_at: string };

/** Booking chat. New messages arrive live; row-level security limits them to the two parties. */
export function Chat({ bookingId, userId, initial, readOnly }: { bookingId: string; userId: string; initial: Message[]; readOnly: boolean }) {
  const [messages, setMessages] = useState<Message[]>(initial);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`booking-${bookingId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "booking_messages", filter: `booking_id=eq.${bookingId}` },
        (payload) => {
          const m = payload.new as Message;
          setMessages((prev) => (prev.some((p) => p.id === m.id) ? prev : [...prev, m]));
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [bookingId]);

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    setSending(true);
    setError(null);
    const supabase = createClient();
    const { data, error: err } = await supabase
      .from("booking_messages")
      .insert({ booking_id: bookingId, sender_id: userId, body })
      .select("id, sender_id, body, created_at")
      .single();
    setSending(false);
    if (err || !data) {
      setError(err?.message ?? "Message not sent. Try again.");
      return;
    }
    setMessages((prev) => (prev.some((p) => p.id === data.id) ? prev : [...prev, data]));
    setText("");
  }

  return (
    <div>
      <div className="max-h-96 space-y-2 overflow-y-auto rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950" aria-live="polite">
        {messages.length === 0 ? <p className="text-sm text-zinc-500">No messages yet. Say hello to the contractor.</p> : null}
        {messages.map((m) => {
          const mine = m.sender_id === userId;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${mine ? "bg-sky-700 text-white" : "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-100"}`}>
                <p className="whitespace-pre-wrap break-words">{m.body}</p>
                <p className={`mt-1 text-[10px] ${mine ? "text-sky-100" : "text-zinc-500"}`}>
                  {new Date(m.created_at).toLocaleTimeString("en-MY", { timeZone: "Asia/Kuala_Lumpur", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottom} />
      </div>
      {error ? <p role="alert" className="mt-2 text-sm text-red-700">{error}</p> : null}
      {readOnly ? (
        <p className="mt-2 text-sm text-zinc-500">This booking is finished, so chat is closed.</p>
      ) : (
        <form onSubmit={send} className="mt-3 flex gap-2">
          <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a message" maxLength={2000} aria-label="Message" />
          <Button type="submit" disabled={sending || text.trim() === ""}>
            Send
          </Button>
        </form>
      )}
    </div>
  );
}
