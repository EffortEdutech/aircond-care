-- 0003_catalog_units.sql
-- Service catalogue, contractor price lists and the customer-owned unit registry.

create table public.service_types (
  code                    text primary key,
  name                    text not null,
  description             text,
  requires_quote          boolean not null default false,
  default_interval_months smallint check (default_interval_months > 0),
  sort_order              smallint not null default 0,
  is_active               boolean not null default true
);
comment on table public.service_types is 'Kinds of job. requires_quote sends the booking through the quote path; default_interval_months drives reminders.';

create table public.company_services (
  id                uuid primary key default gen_random_uuid(),
  company_id        uuid not null references public.companies (id) on delete cascade,
  service_type_code text not null references public.service_types (code),
  unit_type         public.unit_type,                 -- null = any unit type
  price_sen         bigint check (price_sen >= 0),    -- null = quote only
  duration_minutes  integer check (duration_minutes > 0),
  is_active         boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique nulls not distinct (company_id, service_type_code, unit_type)
);
create index company_services_company_idx on public.company_services (company_id);
comment on table public.company_services is 'A contractor price list: fixed price per service type and unit type.';

-- The unit belongs to the customer, never to a contractor.
create table public.units (
  id                   uuid primary key default gen_random_uuid(),
  customer_id          uuid not null references public.profiles (id) on delete cascade,
  address_id           uuid references public.addresses (id) on delete set null,
  nickname             text,
  brand                text,
  model                text,
  serial_number        text,
  unit_type            public.unit_type not null default 'wall_split',
  horsepower           numeric(3, 1) check (horsepower > 0),
  refrigerant          text,
  install_date         date,
  warranty_ends_on     date,
  location_in_property text,
  nameplate_photo_path text,
  notes                text,
  is_archived          boolean not null default false,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create index units_customer_idx on public.units (customer_id);
comment on table public.units is 'Customer-owned aircond units. The core asset of the platform.';
