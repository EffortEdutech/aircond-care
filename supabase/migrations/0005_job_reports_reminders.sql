-- 0005_job_reports_reminders.sql
-- Job reports (the unit history) and service reminders.

-- A finalised report is append-only. A correction is a new report whose supersedes_id
-- points at the original (see the protect_final_report trigger in 0008).
create table public.job_reports (
  id                          uuid primary key default gen_random_uuid(),
  booking_id                  uuid not null references public.bookings (id),
  unit_id                     uuid not null references public.units (id),
  company_id                  uuid not null references public.companies (id),
  author_id                   uuid not null references public.profiles (id),
  supersedes_id               uuid references public.job_reports (id),
  status                      public.report_status not null default 'draft',
  work_done                   text not null,
  findings                    text,
  refrigerant_type            text,
  gas_added_grams             integer check (gas_added_grams >= 0),
  readings                    jsonb not null default '{}'::jsonb,
  recommended_next_service_on date,
  customer_signoff_name       text,
  customer_signoff_at         timestamptz,
  finalised_at                timestamptz,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now(),
  check ((status = 'final') = (finalised_at is not null))
);
-- One original report per unit per booking; corrections chain off it.
create unique index job_reports_one_original on public.job_reports (booking_id, unit_id) where supersedes_id is null;
create unique index job_reports_one_correction on public.job_reports (supersedes_id) where supersedes_id is not null;
create index job_reports_unit_idx on public.job_reports (unit_id, finalised_at desc);
create index job_reports_company_idx on public.job_reports (company_id);
comment on table public.job_reports is 'The unit history. One report per unit per job; final reports cannot be changed or deleted.';

create table public.job_report_parts (
  id             uuid primary key default gen_random_uuid(),
  job_report_id  uuid not null references public.job_reports (id) on delete cascade,
  description    text not null,
  quantity       integer not null default 1 check (quantity > 0),
  unit_price_sen bigint check (unit_price_sen >= 0)
);
create index job_report_parts_report_idx on public.job_report_parts (job_report_id);
comment on table public.job_report_parts is 'Parts replaced or fitted during a job.';

create table public.job_report_photos (
  id            uuid primary key default gen_random_uuid(),
  job_report_id uuid not null references public.job_reports (id) on delete cascade,
  storage_path  text not null,
  kind          public.photo_kind not null default 'other',
  caption       text,
  created_at    timestamptz not null default now()
);
create index job_report_photos_report_idx on public.job_report_photos (job_report_id);
comment on table public.job_report_photos is 'Before and after photos, nameplate and fault photos for a job report.';

create table public.service_reminders (
  id                uuid primary key default gen_random_uuid(),
  unit_id           uuid not null references public.units (id) on delete cascade,
  service_type_code text not null references public.service_types (code),
  due_on            date not null,
  status            public.reminder_status not null default 'pending',
  source_report_id  uuid references public.job_reports (id) on delete set null,
  sent_at           timestamptz,
  created_at        timestamptz not null default now(),
  unique (unit_id, service_type_code, due_on)
);
create index service_reminders_due_idx on public.service_reminders (due_on) where status = 'pending';
comment on table public.service_reminders is 'Next-service reminders per unit, created when a job report is finalised.';
