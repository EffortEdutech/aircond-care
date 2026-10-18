# Payouts and refunds

Until a real payment gateway is connected, payments run in **sandbox** mode and no real money moves.
When real payments start, add a line here for the provider's dashboard steps.

## How money flows
1. Customer pays: ledger gets `payment_received`.
2. Job confirmed (customer taps confirm, or auto-confirms after the confirm window): ledger gets `commission`, and the contractor payout is **queued**.
3. Weekly (Friday): you pay queued payouts by bank transfer, then record it.
4. Refunds: ledger gets `refund` entries.
The ledger is append-only. Never edit or delete entries. Fix mistakes with a new entry.

## Weekly payout run
1. Admin → **Payout batch** → download the CSV of queued payouts (company, bank details, amount).
2. Pay each by bank transfer.
3. Paste the bank batch reference and mark them paid. The system records `payout` entries.
4. Check: `select * from payment_reconciliation where not balanced;` returns no rows (Supabase SQL editor).

## A payout is stuck
- Booking not closed: it is still in `completed`. The daily job closes it after the confirm window. Check Vercel → Cron Jobs last run; or the customer can confirm.
- Booking in dispute: payout is held until the dispute is decided.
- Company suspended: payouts for it wait; decide with the company first.
- Payout queued but missing from the CSV: check the booking is `closed` and `payouts.status = 'queued'`.

## Refund by hand
- Dispute decision with refund (full or partial): Admin → Disputes → decide. The ledger records the refund automatically.
- Booking cancelled or declined after payment: the refund entry is created automatically.
- Sandbox: no money moves. Live: the gateway refund must also be issued in the provider dashboard (not automated yet). Record the provider's refund reference in the dispute note.

## Wrong amount or duplicate payment
Do not edit rows. Note the payment and booking IDs, check `payment_reconciliation`, and add a correcting ledger entry through a migration or SQL reviewed by a second person. The audit log keeps `payment_amount_mismatch`, `duplicate_payment_refunded` and `late_payment_refunded` events.
