import type { Database } from "@/lib/supabase/database.types";

export type BookingStatus = Database["public"]["Enums"]["booking_status"];

export const STATUS_LABEL: Record<BookingStatus, string> = {
  requested: "Requested",
  quoted: "Quote received",
  awaiting_payment: "Awaiting payment",
  paid: "Paid",
  scheduled: "Scheduled",
  in_progress: "In progress",
  completed: "Completed",
  disputed: "Disputed",
  closed: "Closed",
  declined: "Declined",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

export const STATUS_HELP: Record<BookingStatus, string> = {
  requested: "Waiting for the contractor to accept or send a quote.",
  quoted: "The contractor sent a quote. Review it to continue.",
  awaiting_payment: "Accepted. Payment is the next step.",
  paid: "Payment received. The contractor will schedule the visit.",
  scheduled: "A visit time and technician are set.",
  in_progress: "The technician is working on your unit.",
  completed: "Work is done. Confirm it or raise a problem within the review window.",
  disputed: "A problem was raised. Our team is reviewing it.",
  closed: "Finished. The job is in your unit history.",
  declined: "The contractor could not take this job.",
  cancelled: "This booking was cancelled.",
  refunded: "This booking was refunded.",
};

/** Steps shown in the timeline, in order. Side outcomes (declined, cancelled, refunded, disputed) show as a badge. */
export const TIMELINE: BookingStatus[] = ["requested", "awaiting_payment", "paid", "scheduled", "in_progress", "completed", "closed"];

/** The customer may cancel in these states (matches the database rules). */
export const CUSTOMER_CAN_CANCEL: BookingStatus[] = ["requested", "quoted", "awaiting_payment"];

export function statusColor(status: BookingStatus) {
  if (status === "cancelled" || status === "declined" || status === "refunded") return "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300";
  if (status === "disputed") return "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200";
  if (status === "closed" || status === "completed") return "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200";
  return "bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-200";
}
