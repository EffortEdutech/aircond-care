import type { Metadata } from "next";
import { requireUser } from "@/lib/supabase/server";
import { Button, Card, PageHeader } from "@/components/ui";
import { dateTime } from "@/lib/format";
import { NOTIFICATION_TEXT } from "@/lib/notifications";
import { markAllRead, openNotification } from "./actions";

export const metadata: Metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const { supabase } = await requireUser();
  const { data: rows } = await supabase
    .from("notifications")
    .select("id, template, payload, created_at, read_at")
    .eq("channel", "in_app")
    .order("created_at", { ascending: false })
    .limit(50);
  const unread = (rows ?? []).filter((r) => !r.read_at).length;

  return (
    <>
      <PageHeader
        title="Notifications"
        action={
          unread > 0 ? (
            <form action={markAllRead}>
              <Button type="submit" variant="secondary">Mark all read</Button>
            </form>
          ) : null
        }
      />
      {(rows ?? []).length === 0 ? <p className="text-zinc-600 dark:text-zinc-400">Nothing yet. Updates about your bookings show up here.</p> : null}
      <ul className="space-y-2">
        {(rows ?? []).map((n) => {
          const p = (n.payload ?? {}) as { booking_no?: string };
          return (
            <li key={n.id}>
              <form action={openNotification.bind(null, n.id)}>
                <button type="submit" className="block w-full text-left">
                  <Card className={`text-sm hover:border-sky-600 ${n.read_at ? "opacity-70" : "border-sky-300"}`}>
                    <p className={n.read_at ? "" : "font-semibold"}>{NOTIFICATION_TEXT[n.template] ?? n.template}</p>
                    <p className="text-xs text-zinc-500">
                      {p.booking_no ? `${p.booking_no} · ` : ""}
                      {dateTime(n.created_at)}
                    </p>
                  </Card>
                </button>
              </form>
            </li>
          );
        })}
      </ul>
    </>
  );
}
