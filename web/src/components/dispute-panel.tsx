import { Button, Card, Textarea } from "@/components/ui";
import { dateTime, rm } from "@/lib/format";
import { DISPUTE_LABEL } from "@/lib/disputes";
import { postDisputeMessage } from "@/app/(app)/disputes/actions";

type Dispute = {
  id: string;
  raised_by: string;
  reason: string;
  status: string;
  refund_sen: number;
  resolution_note: string | null;
  decided_at: string | null;
  created_at: string;
};
type Message = { id: string; author_id: string; body: string; created_at: string };

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
        <form action={postDisputeMessage.bind(null, dispute.id, back)} className="space-y-2 border-t border-zinc-200 pt-2 dark:border-zinc-800">
          <Textarea name="body" required placeholder="Add details or reply" aria-label="Message" />
          <Button type="submit" variant="secondary">Send message</Button>
        </form>
      ) : null}
    </Card>
  );
}
