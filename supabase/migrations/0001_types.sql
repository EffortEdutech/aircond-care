-- 0001_types.sql
-- Enum types shared by the whole schema.
-- Money is always stored as integer sen (1 RM = 100 sen) in bigint columns named *_sen.

create type public.company_role as enum ('owner', 'dispatcher', 'technician');
create type public.company_status as enum ('pending', 'verified', 'suspended');
create type public.document_type as enum ('ssm_registration', 'business_licence', 'insurance', 'identity');
create type public.review_state as enum ('pending', 'approved', 'rejected');

create type public.unit_type as enum (
  'wall_split', 'cassette', 'ceiling_concealed', 'ceiling_exposed',
  'window', 'multi_split', 'portable', 'other'
);

create type public.booking_status as enum (
  'requested',        -- customer asked; contractor has not answered
  'quoted',           -- contractor sent a quote; waiting for the customer
  'awaiting_payment', -- accepted (fixed price or quote); waiting for payment
  'paid',             -- payment held by the platform
  'scheduled',        -- technician and time assigned
  'in_progress',      -- technician on site
  'completed',        -- job reports filed; waiting for confirmation or auto-confirm
  'disputed',         -- dispute open; payout frozen
  'closed',           -- confirmed; payout may be released
  'cancelled',
  'declined',
  'refunded'
);

create type public.quote_status as enum ('draft', 'sent', 'accepted', 'declined', 'expired');
create type public.quote_line_kind as enum ('labour', 'part', 'gas', 'call_out', 'other');
create type public.report_status as enum ('draft', 'final');
create type public.photo_kind as enum ('before', 'after', 'nameplate', 'fault', 'other');
create type public.reminder_status as enum ('pending', 'sent', 'booked', 'dismissed');

create type public.payment_method as enum ('fpx', 'card', 'ewallet');
create type public.payment_status as enum ('pending', 'held', 'released', 'refunded', 'partially_refunded', 'failed');
create type public.payout_status as enum ('queued', 'processing', 'paid', 'failed');
create type public.ledger_entry_type as enum ('payment_received', 'commission', 'gateway_fee', 'payout', 'refund');

create type public.dispute_status as enum ('open', 'under_review', 'resolved_release', 'resolved_refund', 'resolved_partial', 'withdrawn');
create type public.review_visibility as enum ('visible', 'removed');

create type public.subscription_status as enum ('active', 'past_due', 'cancelled');
create type public.invoice_status as enum ('open', 'paid', 'void', 'failed');

create type public.notification_channel as enum ('whatsapp', 'push', 'email');
create type public.notification_status as enum ('queued', 'sent', 'failed');
