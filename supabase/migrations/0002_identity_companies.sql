-- 0002_identity_companies.sql
-- People, addresses and contractor companies.

-- A profile row exists for every auth user. A person can be a customer, a member of
-- one or more contractor companies, and a platform admin, all at once.
create table public.profiles (
  id              uuid primary key references auth.users (id) on delete cascade,
  full_name       text not null default '',
  phone           text,
  email           text,
  locale          text not null default 'en' check (locale in ('en', 'ms', 'zh')),
  notify_whatsapp boolean not null default true,
  notify_push     boolean not null default true,
  notify_email    boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create unique index profiles_phone_key on public.profiles (phone) where phone is not null;
comment on table public.profiles is 'One row per user. Customer, contractor staff and admin are roles of the same person.';

create table public.platform_admins (
  user_id    uuid primary key references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);
comment on table public.platform_admins is 'Platform operations staff. Rows are managed with the service role only.';

create table public.service_areas (
  id        integer generated always as identity primary key,
  state     text not null,
  district  text not null,
  is_active boolean not null default true,
  unique (state, district)
);
comment on table public.service_areas is 'State and district pairs that contractors can serve and customers can book in.';

create table public.addresses (
  id              uuid primary key default gen_random_uuid(),
  customer_id     uuid not null references public.profiles (id) on delete cascade,
  label           text not null default 'Home',
  line1           text not null,
  line2           text,
  postcode        text,
  service_area_id integer references public.service_areas (id),
  latitude        numeric(9, 6) check (latitude between -90 and 90),
  longitude       numeric(9, 6) check (longitude between -180 and 180),
  access_notes    text,
  is_default      boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index addresses_customer_idx on public.addresses (customer_id);
comment on table public.addresses is 'Saved customer addresses (home, shop, office). Contractors see a snapshot on the booking, not this table.';

create table public.companies (
  id               uuid primary key default gen_random_uuid(),
  slug             text unique,
  name             text not null,
  legal_name       text not null,
  ssm_number       text not null unique,
  description      text,
  phone            text,
  email            text,
  logo_path        text,
  status           public.company_status not null default 'pending',
  verified_at      timestamptz,
  verified_by      uuid references public.profiles (id),
  suspended_reason text,
  rating_avg       numeric(3, 2) not null default 0,
  rating_count     integer not null default 0,
  created_by       uuid references public.profiles (id),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
comment on table public.companies is 'Contractor companies. Each company is an isolated workspace.';

create table public.company_members (
  company_id uuid not null references public.companies (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  role       public.company_role not null,
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (company_id, user_id)
);
create index company_members_user_idx on public.company_members (user_id) where is_active;
comment on table public.company_members is 'Staff of a contractor company: owner, dispatcher or technician.';

create table public.company_documents (
  id           uuid primary key default gen_random_uuid(),
  company_id   uuid not null references public.companies (id) on delete cascade,
  doc_type     public.document_type not null,
  storage_path text not null,
  status       public.review_state not null default 'pending',
  expires_on   date,
  reviewed_by  uuid references public.profiles (id),
  reviewed_at  timestamptz,
  review_note  text,
  created_at   timestamptz not null default now()
);
create index company_documents_company_idx on public.company_documents (company_id);
comment on table public.company_documents is 'SSM registration, licences, insurance and identity documents reviewed by admin.';

create table public.company_service_areas (
  company_id       uuid not null references public.companies (id) on delete cascade,
  service_area_id  integer not null references public.service_areas (id),
  call_out_fee_sen bigint not null default 0 check (call_out_fee_sen >= 0),
  primary key (company_id, service_area_id)
);
comment on table public.company_service_areas is 'Where a company works, with its call-out fee per area.';
