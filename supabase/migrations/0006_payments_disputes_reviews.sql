-- 0006_payments_disputes_reviews.sql
-- Money, disputes and reviews. Payments, payouts and the ledger are written by the
-- backend (service role) only; users can read their own rows.

create table public.payments (
  id            uuid primary key default gen_random_uuid(),
  booking_id    uuid not null references public.bookings (id),
  customer_id   uuid not null references public.profiles (id),
  method        public.payment_method,
  gateway       text not null,
  gateway_ref   text not null,
  amount_sen    bigint not null check (amount_sen > 0),
  refunded_sen  bigint not null default 0 check (refunded_sen >= 0),
  status        public.payment_status not null default 'pending',
  paid_at       timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (gateway, gateway_ref),
  check (refunded_sen <= amount_sen)
);
create index payments_booking_idx on public.payments (booking_id);
create index payments_customer_idx on public.payments (customer_id);
comment on table public.payments is 'Customer payments through the gateway. The platform holds the funds until the booking is closed.';

create table public.payouts (
  id              uuid primary key default gen_random_uuid(),
  company_id      uuid not null references public.companies (id),
  booking_id      uuid not null unique references public.bookings (id),
  gross_sen       bigint not null check (gross_sen >= 0),
  commission_sen  bigint not null check (commission_sen >= 0),
  gateway_fee_sen bigint not null default 0 check (gateway_fee_sen >= 0),
  net_sen         bigint not null check (net_sen >= 0),
  status          public.payout_status not null default 'queued',
  scheduled_for   date not null,
  paid_at         timestamptz,
  gateway_ref     text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  check (net_sen = gross_sen - commission_sen - gateway_fee_sen)
);
create index payouts_company_idx on public.payouts (company_id, scheduled_for desc);
create index payouts_due_idx on public.payouts (scheduled_for) where status = 'queued';
comment on table public.payouts is 'One payout per closed booking: gross, less commission and gateway fee.';

-- Cash held by the platform, per booking. A fully settled booking sums to zero.
create table public.ledger_entries (
  id         bigint generated always as identity primary key,
  booking_id uuid not null references public.bookings (id),
  company_id uuid references public.companies (id),
  payment_id uuid references public.payments (id),
  payout_id  uuid references public.payouts (id),
  entry_type public.ledger_entry_type not null,
  amount_sen bigint not null check (amount_sen <> 0),
  memo       text,
  created_at timestamptz not null default now()
);
create index ledger_booking_idx on public.ledger_entries (booking_id);
create index ledger_company_idx on public.ledger_entries (company_id, created_at desc);
comment on table public.ledger_entries is 'Append-only money ledger. +payment_received, -commission, -gateway_fee, -payout, -refund.';

create table public.disputes (
  id              uuid primary key default gen_random_uuid(),
  booking_id      uuid not null references public.bookings (id),
  raised_by       uuid not null references public.profiles (id),
  reason          text not null,
  status          public.dispute_status not null default 'open',
  refund_sen      bigint not null default 0 check (refund_sen >= 0),
  resolution_note text,
  decided_by      uuid references public.profiles (id),
  decided_at      timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
-- Only one unresolved dispute per booking.
create unique index disputes_one_open on public.disputes (booking_id) where status in ('open', 'under_review');
create index disputes_booking_idx on public.disputes (booking_id);
comment on table public.disputes is 'Customer or contractor disputes. An open dispute freezes the payout until admin decides.';

create table public.dispute_messages (
  id               uuid primary key default gen_random_uuid(),
  dispute_id       uuid not null references public.disputes (id) on delete cascade,
  author_id        uuid not null references public.profiles (id),
  body             text not null check (length(body) > 0),
  attachment_paths text[] not null default '{}',
  created_at       timestamptz not null default now()
);
create index dispute_messages_dispute_idx on public.dispute_messages (dispute_id, created_at);

create table public.reviews (
  id             uuid primary key default gen_random_uuid(),
  booking_id     uuid not null unique references public.bookings (id),
  customer_id    uuid not null references public.profiles (id),
  company_id     uuid not null references public.companies (id),
  rating         smallint not null check (rating between 1 and 5),
  comment        text,
  company_reply  text,
  replied_at     timestamptz,
  visibility     public.review_visibility not null default 'visible',
  removed_reason text,
  removed_by     uuid references public.profiles (id),
  created_at     timestamptz not null default now()
);
create index reviews_company_idx on public.reviews (company_id, created_at desc) where visibility = 'visible';
comment on table public.reviews is 'One review per closed booking. Admin can remove a review but cannot change its rating.';
