-- 0004_bookings_quotes.sql
-- Bookings, their items, quotes, access grants and chat.

create sequence public.booking_no_seq;

create table public.bookings (
  id                uuid primary key default gen_random_uuid(),
  booking_no        text not null unique
                    default ('AC-' || to_char(now(), 'YYMM') || '-' || lpad(nextval('public.booking_no_seq')::text, 6, '0')),
  customer_id       uuid not null references public.profiles (id),
  company_id        uuid not null references public.companies (id),
  address_id        uuid references public.addresses (id) on delete set null,
  address_snapshot  jsonb not null default '{}'::jsonb,
  status            public.booking_status not null default 'requested',
  fault_description text,
  customer_notes    text,
  requested_start   timestamptz,
  scheduled_start   timestamptz,
  scheduled_end     timestamptz,
  assigned_to       uuid references public.profiles (id),
  subtotal_sen      bigint not null default 0 check (subtotal_sen >= 0),
  call_out_fee_sen  bigint not null default 0 check (call_out_fee_sen >= 0),
  total_sen         bigint generated always as (subtotal_sen + call_out_fee_sen) stored,
  commission_bps    integer check (commission_bps between 0 and 10000), -- snapshot taken when paid
  accepted_at       timestamptz,
  paid_at           timestamptz,
  completed_at      timestamptz,
  auto_confirm_at   timestamptz,
  confirmed_at      timestamptz,
  cancelled_at      timestamptz,
  cancel_reason     text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  check (scheduled_end is null or scheduled_start is null or scheduled_end > scheduled_start)
);
create index bookings_customer_idx on public.bookings (customer_id, created_at desc);
create index bookings_company_idx on public.bookings (company_id, status, created_at desc);
create index bookings_assigned_idx on public.bookings (assigned_to) where assigned_to is not null;
create index bookings_auto_confirm_idx on public.bookings (auto_confirm_at) where status = 'completed';
comment on table public.bookings is 'One customer, one contractor company. Status changes only through the transition functions.';

create table public.booking_items (
  id                uuid primary key default gen_random_uuid(),
  booking_id        uuid not null references public.bookings (id) on delete cascade,
  unit_id           uuid not null references public.units (id),
  service_type_code text not null references public.service_types (code),
  description       text,
  quantity          integer not null default 1 check (quantity > 0),
  unit_price_sen    bigint not null default 0 check (unit_price_sen >= 0), -- set by trigger from the price list
  line_total_sen    bigint generated always as (quantity * unit_price_sen) stored,
  unique (booking_id, unit_id, service_type_code)
);
create index booking_items_unit_idx on public.booking_items (unit_id);
comment on table public.booking_items is 'The units and services in a booking. Prices come from the contractor price list, not from the client.';

-- Contractor access to a unit exists because of a booking (ADR-0002).
create table public.unit_access_grants (
  id         uuid primary key default gen_random_uuid(),
  unit_id    uuid not null references public.units (id) on delete cascade,
  company_id uuid not null references public.companies (id) on delete cascade,
  booking_id uuid not null references public.bookings (id) on delete cascade,
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  revoked_by uuid references public.profiles (id),
  unique (booking_id, unit_id)
);
create index unit_access_active_idx on public.unit_access_grants (company_id, unit_id) where revoked_at is null;
create index unit_access_unit_idx on public.unit_access_grants (unit_id);
comment on table public.unit_access_grants is 'Which contractor company may read which unit. Created by a booking; the customer can revoke after the job is closed.';

create table public.quotes (
  id          uuid primary key default gen_random_uuid(),
  booking_id  uuid not null references public.bookings (id) on delete cascade,
  version     integer not null default 1,
  status      public.quote_status not null default 'draft',
  valid_until timestamptz,
  note        text,
  created_by  uuid references public.profiles (id),
  sent_at     timestamptz,
  decided_at  timestamptz,
  created_at  timestamptz not null default now(),
  unique (booking_id, version)
);
comment on table public.quotes is 'Quote path for repair, install and gas top-up. The customer pays only after accepting.';

create table public.quote_lines (
  id             uuid primary key default gen_random_uuid(),
  quote_id       uuid not null references public.quotes (id) on delete cascade,
  kind           public.quote_line_kind not null default 'other',
  description    text not null,
  quantity       integer not null default 1 check (quantity > 0),
  unit_price_sen bigint not null check (unit_price_sen >= 0),
  line_total_sen bigint generated always as (quantity * unit_price_sen) stored,
  sort_order     smallint not null default 0
);
create index quote_lines_quote_idx on public.quote_lines (quote_id);

create table public.booking_messages (
  id         uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings (id) on delete cascade,
  sender_id  uuid not null references public.profiles (id),
  body       text not null check (length(body) > 0),
  created_at timestamptz not null default now()
);
create index booking_messages_booking_idx on public.booking_messages (booking_id, created_at);
comment on table public.booking_messages is 'Chat between customer and contractor on a booking.';
