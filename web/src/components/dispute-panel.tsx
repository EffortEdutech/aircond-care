import { Card } from "@/components/ui";
import { DisputeReplyForm } from "@/components/dispute-reply-form";
import { dateTime, rm } from "@/lib/format";
import { DISPUTE_LABEL } from "@/lib/disputes";
import { postDisputeMessage } from "@/app/(app)/disputes/actions";

type Dispute = {
  id: string;
  booking_id: string;
  raised_by: string;
  reason: string;
  status: string;
  refund_sen: number;
  resolution_note: string | null;
  decided_at: string | null;
  created_at: string;
};
type Message = { id: string; author_id: string; body: string; created_at: string; photos: string[] };

/** Shows a dispute thread. Parties and admin can add messages while it is unresolved. */
export function DisputePanel({
  dispute,
  messages,
  userId,
  customerId,
  back,
}: {
  dispute: Dispute;
  messages: Message[];
  userId: string;
  customerId: string;
  back: string;
}) {
  const unresolved = dispute.status === "open" || dispute.status === "under_review";
  const who = (id: string) => (id === userId ? "You" : id === customerId ? "Customer" : "Contractor or support");
  return (
    <Card className="mb-6 space-y-3 border-amber-300 text-sm dark:border-amber-900">
      <div>
        <h2 className="font-semibold">Problem reported · {DISPUTE_LABEL[dispute.status] ?? dispute.status}</h2>
        <p className="text-xs text-zinc-500">
          {who(dispute.raised_by)} raised this on {dateTime(dispute.created_at)}
        </p>
      </div>
      <p>{dispute.reason}</p>
      {messages.length > 0 ? (
        <ul className="space-y-2 border-t border-zinc-200 pt-2 dark:border-zinc-800">
          {messages.map((m) => (
            <li key={m.id}>
              <span className="text-xs text-zinc-500">
                {who(m.author_id)} · {dateTime(m.created_at)}
              </span>
              <p>{m.body}</p>
              {m.photos.length > 0 ? (
                <div className="mt-1 flex flex-wrap gap-2">
                  {m.photos.map((u) => (
                    <a key={u} href={u} target="_blank" rel="noreferrer">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={u} alt="Evidence photo" className="h-24 w-24 rounded-lg border border-zinc-200 object-cover dark:border-zinc-700" />
                    </a>
                  ))}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
      {dispute.decided_at ? (
        <p className="border-t border-zinc-200 pt-2 dark:border-zinc-800">
          <strong>Decision:</strong> {DISPUTE_LABEL[dispute.status]}
          {dispute.refund_sen > 0 ? ` (${rm(dispute.refund_sen)} refunded)` : ""}
          {dispute.resolution_note ? `. ${dispute.resolution_note}` : ""}
        </p>
      ) : null}
      {unresolved ? (
        <DisputeReplyForm action={postDisputeMessage.bind(null, dispute.id, back)} bookingId={dispute.booking_id} userId={userId} />
      ) : null}
    </Card>
  );
}
