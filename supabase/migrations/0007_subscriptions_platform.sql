-- 0007_subscriptions_platform.sql
-- Contractor subscriptions, platform settings, notifications and the audit log.

create table public.subscription_plans (
  code            text primary key,
  name            text not null,
  monthly_fee_sen bigint not null check (monthly_fee_sen >= 0),
  commission_bps  integer not null check (commission_bps between 0 and 10000),
  max_members     integer check (max_members > 0),
  features        jsonb not null default '[]'::jsonb,
  is_available    boolean not null default true,  -- false until the plan launches (Phase 2)
  sort_order      smallint not null default 0
);
comment on table public.subscription_plans is 'Contractor plans. commission_bps is in basis points (1000 = 10%). Values are proposed starting points.';

create table public.company_subscriptions (
  id                 uuid primary key default gen_random_uuid(),
  company_id         uuid not null references public.companies (id) on delete cascade,
  plan_code          text not null references public.subscription_plans (code),
  status             public.subscription_status not null default 'active',
  started_at         timestamptz not null default now(),
  current_period_end timestamptz,
  cancelled_at       timestamptz,
  gateway_ref        text,
  created_at         timestamptz not null default now()
);
-- One live subscription per company.
create unique index company_subscriptions_one_live on public.company_subscriptions (company_id) where status in ('active', 'past_due');
comment on table public.company_subscriptions is 'The plan a company is on. A new company starts on the Starter plan.';

create table public.subscription_invoices (
  id              uuid primary key default gen_random_uuid(),
  company_id      uuid not null references public.companies (id) on delete cascade,
  subscription_id uuid not null references public.company_subscriptions (id),
  period_start    date not null,
  period_end      date not null,
  amount_sen      bigint not null check (amount_sen >= 0),
  status          public.invoice_status not null default 'open',
  paid_at         timestamptz,
  gateway_ref     text,
  created_at      timestamptz not null default now(),
  check (period_end > period_start)
);
create index subscription_invoices_company_idx on public.subscription_invoices (company_id, period_start desc);
comment on table public.subscription_invoices is 'Billing history for contractor subscriptions.';

create table public.platform_settings (
  key         text primary key,
  value       jsonb not null,
  description text,
  updated_at  timestamptz not null default now()
);
comment on table public.platform_settings is 'Tunable platform rules, such as the auto-confirm window.';

create table public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  channel    public.notification_channel not null,
  template   text not null,
  payload    jsonb not null default '{}'::jsonb,
  status     public.notification_status not null default 'queued',
  attempts   smallint not null default 0,
  sent_at    timestamptz,
  error      text,
  created_at timestamptz not null default now()
);
create index notifications_queue_idx on public.notifications (created_at) where status = 'queued';
create index notifications_user_idx on public.notifications (user_id, created_at desc);
comment on table public.notifications is 'Outbound WhatsApp, push and email messages, sent by a worker.';

create table public.audit_log (
  id          bigint generated always as identity primary key,
  actor_id    uuid,
  action      text not null,
  entity_type text not null,
  entity_id   uuid,
  company_id  uuid,
  meta        jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);
create index audit_entity_idx on public.audit_log (entity_type, entity_id, created_at desc);
create index audit_company_idx on public.audit_log (company_id, created_at desc);
comment on table public.audit_log is 'Who viewed or changed a unit record, a payout or a dispute decision.';
