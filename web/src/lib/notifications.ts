/** Plain-language text for each in-app notification template. */
export const NOTIFICATION_TEXT: Record<string, string> = {
  new_booking: "New booking request",
  quote_received: "You received a quote",
  quote_accepted: "The customer accepted your quote",
  booking_accepted: "The contractor accepted your booking. You can pay now.",
  payment_received: "Payment received. Schedule the visit",
  visit_scheduled: "Your visit is scheduled",
  job_assigned: "A visit was scheduled",
  job_started: "The technician has started the job",
  job_completed: "Work is done. Please confirm it or report a problem",
  job_closed: "Job closed. Your payout is queued",
  dispute_raised: "A problem was reported",
  dispute_message: "New message on a reported problem",
  dispute_decided: "A decision was made on the reported problem",
  booking_cancelled: "Booking cancelled",
  booking_declined: "The contractor could not take this booking",
  booking_refunded: "Booking refunded",
  new_message: "New message",
  service_reminder: "Your air conditioner is due for service",
};

export function notificationHref(n: { payload: unknown }): string {
  const p = (n.payload ?? {}) as { booking_id?: string; audience?: string; unit_id?: string };
  if (p.booking_id) return p.audience === "company" ? `/work/${p.booking_id}` : `/bookings/${p.booking_id}`;
  if (p.unit_id) return `/units/${p.unit_id}`;
  return "/notifications";
}
