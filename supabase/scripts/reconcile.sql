-- Payments reconciliation. Run in the Supabase SQL editor.
-- Change the dates, then run each block.

-- 1. Every payment in the range that does not match the ledger. An empty result is good.
select payment_id, booking_id, status, amount_sen, ledger_received_sen, refunded_sen, ledger_refunded_sen
  from public.payment_reconciliation
 where not balanced
   and paid_at >= '2026-10-01' and paid_at < '2026-12-31';

-- 2. Gateway events that were received but did not end in a clean result.
select received_at, gateway, event_id, outcome, result
  from public.webhook_events
 where received_at >= '2026-10-01' and received_at < '2026-12-31'
   and coalesce(result, 'none') not in ('held', 'failed', 'duplicate')
 order by received_at;

-- 3. Compare with the gateway's own statement: export its transactions for the same dates and check that
--    every paid reference below appears there with the same amount.
select p.gateway_ref as reference, p.amount_sen, p.paid_at, p.status
  from public.payments p
 where p.paid_at >= '2026-10-01' and p.paid_at < '2026-12-31'
 order by p.paid_at;

-- 4. Refunds recorded here that still need to be sent through the gateway.
select created_at, entity_id as payment_id, meta
  from public.audit_log
 where action = 'refund_recorded' and (meta->>'gateway_refund_pending')::boolean
 order by created_at;
