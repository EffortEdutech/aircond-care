-- 0008_functions_triggers.sql
-- Helper functions, business rules (triggers) and the RPC functions the app calls.

-- ---------------------------------------------------------------------------
-- Generic
-- ---------------------------------------------------------------------------

create function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

do $$
declare t text;
begin
  foreach t in array array['profiles', 'addresses', 'companies', 'company_services', 'units',
                           'bookings', 'job_reports', 'payments', 'payouts', 'disputes']
  loop
    execute format('create trigger set_updated_at before update on public.%I
                    for each row execute function public.set_updated_at()', t);
  end loop;
end $$;

-- Create the profile row when a user signs up.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, phone, email)
  values (new.id,
          coalesce(new.raw_user_meta_data ->> 'full_name', ''),
          nullif(new.phone, ''),
          nullif(new.email, ''))
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Helpers used by RLS policies and triggers
-- ---------------------------------------------------------------------------

create function public.is_platform_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.platform_admins where user_id = auth.uid());
$$;

create function public.is_company_member(p_company uuid, p_roles public.company_role[] default null)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.company_members m
    join public.companies c on c.id = m.company_id
    where m.company_id = p_company
      and m.user_id = auth.uid()
      and m.is_active
      and c.status <> 'suspended'
      and (p_roles is null or m.role = any (p_roles))
  );
$$;

create function public.my_company_ids() returns setof uuid
language sql stable security definer set search_path = public as $$
  select m.company_id
  from public.company_members m
  join public.companies c on c.id = m.company_id
  where m.user_id = auth.uid() and m.is_active and c.status <> 'suspended';
$$;

-- Owner of the unit, a company with an active access grant, or admin.
create function public.can_access_unit(p_unit uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.units u where u.id = p_unit and u.customer_id = auth.uid())
      or exists (select 1 from public.unit_access_grants g
                 where g.unit_id = p_unit and g.revoked_at is null
                   and g.company_id in (select public.my_company_ids()))
      or public.is_platform_admin();
$$;

-- The customer, the company's owner or dispatcher, the technician assigned to the job, or admin.
create function public.is_booking_party(p_booking uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.bookings b
                 where b.id = p_booking
                   and (b.customer_id = auth.uid()
                        or public.is_company_member(b.company_id, array['owner', 'dispatcher']::public.company_role[])
                        or (b.assigned_to = auth.uid() and public.is_company_member(b.company_id))))
      or public.is_platform_admin();
$$;

-- A contractor may read a customer's contact details while a booking is open and for
-- 30 days after it ends (follow-up on the job).
create function public.contractor_can_see_customer(p_customer uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.bookings b
    where b.customer_id = p_customer
      and b.company_id in (select public.my_company_ids())
      and (b.status not in ('closed', 'cancelled', 'declined', 'refunded')
           or coalesce(b.confirmed_at, b.cancelled_at, b.updated_at) > now() - interval '30 days')
  );
$$;

create function public.setting_int(p_key text, p_default integer) returns integer
language sql stable security definer set search_path = public as $$
  select coalesce((select (value #>> '{}')::integer from public.platform_settings where key = p_key), p_default);
$$;

create function public.current_commission_bps(p_company uuid) returns integer
language sql stable security definer set search_path = public as $$
  select coalesce(
    (select p.commission_bps
       from public.company_subscriptions s
       join public.subscription_plans p on p.code = s.plan_code
      where s.company_id = p_company and s.status in ('active', 'past_due')
      order by s.started_at desc limit 1),
    (select commission_bps from public.subscription_plans where code = 'starter'),
    1500);
$$;

-- ---------------------------------------------------------------------------
-- Companies
-- ---------------------------------------------------------------------------

create function public.create_company(
  p_name text, p_legal_name text, p_ssm_number text,
  p_phone text default null, p_email text default null
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_id  uuid;
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'not signed in' using errcode = '28000';
  end if;
  insert into public.companies (name, legal_name, ssm_number, phone, email, created_by)
  values (trim(p_name), trim(p_legal_name), trim(p_ssm_number), p_phone, p_email, v_uid)
  returning id into v_id;
  update public.companies
     set slug = trim(both '-' from lower(regexp_replace(trim(p_name), '[^a-zA-Z0-9]+', '-', 'g'))) || '-' || substr(v_id::text, 1, 6)
   where id = v_id;
  insert into public.company_members (company_id, user_id, role) values (v_id, v_uid, 'owner');
  insert into public.company_subscriptions (company_id, plan_code) values (v_id, 'starter');
  return v_id;
end $$;

create function public.protect_last_owner() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if old.role = 'owner'
     and ((tg_op = 'DELETE') or (new.role <> 'owner') or (not new.is_active))
     and exists (select 1 from public.companies where id = old.company_id)
     and not exists (select 1 from public.company_members m
                      where m.company_id = old.company_id and m.role = 'owner'
                        and m.is_active and m.user_id <> old.user_id)
  then
    raise exception 'a company must keep at least one active owner';
  end if;
  return coalesce(new, old);
end $$;

create trigger protect_last_owner before update or delete on public.company_members
  for each row execute function public.protect_last_owner();

-- ---------------------------------------------------------------------------
-- Bookings
-- ---------------------------------------------------------------------------

-- On insert: company must be verified, address must be the customer's and in an area the
-- company serves. Snapshot the address and set the call-out fee. New bookings are always 'requested'.
create function public.prepare_booking() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_company_status public.company_status;
  v_addr public.addresses;
  v_fee bigint;
begin
  select status into v_company_status from public.companies where id = new.company_id;
  if v_company_status is distinct from 'verified' then
    raise exception 'company is not verified';
  end if;
  if new.address_id is null then
    raise exception 'a booking needs an address';
  end if;
  select * into v_addr from public.addresses where id = new.address_id and customer_id = new.customer_id;
  if not found then
    raise exception 'address does not belong to the customer';
  end if;
  select call_out_fee_sen into v_fee
    from public.company_service_areas
   where company_id = new.company_id and service_area_id = v_addr.service_area_id;
  if not found then
    raise exception 'company does not serve this area';
  end if;
  new.status := 'requested';
  new.call_out_fee_sen := v_fee;
  new.address_snapshot := to_jsonb(v_addr) - 'id' - 'customer_id' - 'is_default' - 'created_at' - 'updated_at';
  return new;
end $$;

create trigger prepare_booking before insert on public.bookings
  for each row execute function public.prepare_booking();

-- The status graph and its side effects. This runs for every writer, including the service role.
create function public.guard_booking_update() returns trigger
language plpgsql security definer set search_path = public as $$
declare ok boolean;
begin
  if new.customer_id <> old.customer_id or new.company_id <> old.company_id then
    raise exception 'customer and company cannot change on a booking';
  end if;
  if new.assigned_to is distinct from old.assigned_to and new.assigned_to is not null
     and not exists (select 1 from public.company_members m
                      where m.company_id = new.company_id and m.user_id = new.assigned_to and m.is_active) then
    raise exception 'assigned technician must be an active member of the company';
  end if;

  if new.status is distinct from old.status then
    ok := case old.status
      when 'requested'        then new.status in ('quoted', 'awaiting_payment', 'declined', 'cancelled')
      when 'quoted'           then new.status in ('awaiting_payment', 'declined', 'cancelled')
      when 'awaiting_payment' then new.status in ('paid', 'cancelled')
      when 'paid'             then new.status in ('scheduled', 'cancelled', 'refunded')
      when 'scheduled'        then new.status in ('in_progress', 'cancelled', 'refunded')
      when 'in_progress'      then new.status in ('completed')
      when 'completed'        then new.status in ('disputed', 'closed')
      when 'disputed'         then new.status in ('closed', 'refunded')
      else false
    end;
    if not coalesce(ok, false) then
      raise exception 'invalid booking status change: % -> %', old.status, new.status
        using errcode = 'check_violation';
    end if;

    case new.status
      when 'awaiting_payment' then
        new.accepted_at := coalesce(new.accepted_at, now());
      when 'paid' then
        if coalesce((select sum(amount_sen) from public.payments
                      where booking_id = new.id and status = 'held'), 0) < new.subtotal_sen + new.call_out_fee_sen then
          raise exception 'held payments do not cover the booking total';
        end if;
        new.paid_at := now();
        new.commission_bps := coalesce(new.commission_bps, public.current_commission_bps(new.company_id));
      when 'scheduled' then
        if new.scheduled_start is null or new.assigned_to is null then
          raise exception 'scheduling needs a start time and a technician';
        end if;
      when 'completed' then
        -- Every job is written to the unit history before the payout can be released.
        if exists (
          select 1
          from (select distinct unit_id from public.booking_items where booking_id = new.id) u
          where not exists (
            select 1 from public.job_reports r
             where r.booking_id = new.id and r.unit_id = u.unit_id
               and r.status = 'final' and r.supersedes_id is null)
        ) then
          raise exception 'every unit needs a final job report before the booking is completed';
        end if;
        new.completed_at := now();
        new.auto_confirm_at := now() + make_interval(hours => public.setting_int('auto_confirm_hours', 48));
      when 'closed' then
        new.confirmed_at := now();
      when 'cancelled' then
        new.cancelled_at := now();
      else
        null;
    end case;
  end if;
  return new;
end $$;

create trigger guard_booking_update before update on public.bookings
  for each row execute function public.guard_booking_update();

-- Prices come from the contractor price list, never from the client.
create function public.price_booking_item() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_b public.bookings;
  v_u public.units;
  v_price bigint;
begin
  select * into v_b from public.bookings where id = new.booking_id;
  if not found then
    raise exception 'booking not found';
  end if;
  if v_b.status <> 'requested' then
    raise exception 'items can only be added while the booking is requested';
  end if;
  select * into v_u from public.units where id = new.unit_id;
  if not found or v_u.customer_id <> v_b.customer_id then
    raise exception 'unit does not belong to the customer';
  end if;
  perform 1 from public.service_types where code = new.service_type_code and is_active;
  if not found then
    raise exception 'unknown or inactive service type';
  end if;
  select cs.price_sen into v_price
    from public.company_services cs
   where cs.company_id = v_b.company_id
     and cs.service_type_code = new.service_type_code
     and cs.is_active
     and (cs.unit_type = v_u.unit_type or cs.unit_type is null)
   order by (cs.unit_type is null)
   limit 1;
  if not found then
    raise exception 'company does not offer this service for this unit type';
  end if;
  new.unit_price_sen := coalesce(v_price, 0);   -- quote-only services start at 0
  return new;
end $$;

create trigger price_booking_item before insert on public.booking_items
  for each row execute function public.price_booking_item();

create function public.guard_booking_items() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_status public.booking_status;
begin
  select status into v_status from public.bookings where id = coalesce(new.booking_id, old.booking_id);
  if found and v_status <> 'requested' then
    raise exception 'booking items are locked once the booking leaves requested';
  end if;
  if tg_op = 'UPDATE' and (new.booking_id <> old.booking_id or new.unit_id <> old.unit_id
                           or new.service_type_code <> old.service_type_code
                           or new.unit_price_sen <> old.unit_price_sen) then
    raise exception 'only description and quantity can change on a booking item';
  end if;
  return coalesce(new, old);
end $$;

create trigger guard_booking_items before update or delete on public.booking_items
  for each row execute function public.guard_booking_items();

create function public.refresh_booking_subtotal() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_id uuid := coalesce(new.booking_id, old.booking_id);
begin
  update public.bookings
     set subtotal_sen = coalesce((select sum(line_total_sen) from public.booking_items where booking_id = v_id), 0)
   where id = v_id and status = 'requested';
  return null;
end $$;

create trigger refresh_booking_subtotal after insert or update or delete on public.booking_items
  for each row execute function public.refresh_booking_subtotal();

-- Booking an item grants the contractor access to that unit, and marks a matching
-- service reminder as booked.
create function public.on_booking_item_created() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.unit_access_grants (unit_id, company_id, booking_id)
  select new.unit_id, b.company_id, b.id from public.bookings b where b.id = new.booking_id
  on conflict (booking_id, unit_id) do nothing;

  update public.service_reminders
     set status = 'booked'
   where unit_id = new.unit_id and service_type_code = new.service_type_code
     and status in ('pending', 'sent');
  return new;
end $$;

create trigger on_booking_item_created after insert on public.booking_items
  for each row execute function public.on_booking_item_created();

-- Status changes by people go through this function, which checks who may do what.
-- Backend code (service role, no signed-in user) may make any change the status graph allows.
create function public.transition_booking(
  p_booking         uuid,
  p_to              public.booking_status,
  p_scheduled_start timestamptz default null,
  p_scheduled_end   timestamptz default null,
  p_assigned_to     uuid default null,
  p_reason          text default null
) returns public.booking_status
language plpgsql security definer set search_path = public as $$
declare
  b public.bookings;
  uid uuid := auth.uid();
  is_cust boolean;
  is_mgr boolean;
  is_tech boolean;
  ok boolean;
begin
  select * into b from public.bookings where id = p_booking for update;
  if not found then
    raise exception 'booking not found';
  end if;

  if uid is not null then
    is_cust := b.customer_id = uid;
    is_mgr  := public.is_company_member(b.company_id, array['owner', 'dispatcher']::public.company_role[]);
    is_tech := b.assigned_to = uid and public.is_company_member(b.company_id);
    ok := public.is_platform_admin() or case p_to
      when 'declined'         then is_mgr and b.status in ('requested', 'quoted')
      when 'awaiting_payment' then is_mgr and b.status = 'requested'
      when 'scheduled'        then is_mgr and b.status = 'paid'
      when 'in_progress'      then (is_tech or is_mgr) and b.status = 'scheduled'
      when 'completed'        then (is_tech or is_mgr) and b.status = 'in_progress'
      when 'closed'           then is_cust and b.status = 'completed'
      when 'cancelled'        then (is_cust and b.status in ('requested', 'quoted', 'awaiting_payment'))
                                or (is_mgr and b.status in ('requested', 'quoted', 'awaiting_payment', 'paid', 'scheduled'))
      else false
    end;
    if not coalesce(ok, false) then
      raise exception 'not allowed to move booking from % to %', b.status, p_to using errcode = '42501';
    end if;
  end if;

  if p_to = 'awaiting_payment' and b.status = 'requested' and exists (
       select 1 from public.booking_items i
         join public.service_types s on s.code = i.service_type_code
        where i.booking_id = b.id and s.requires_quote) then
    raise exception 'this booking contains a service that needs a quote';
  end if;

  update public.bookings
     set status          = p_to,
         scheduled_start = coalesce(p_scheduled_start, scheduled_start),
         scheduled_end   = coalesce(p_scheduled_end, scheduled_end),
         assigned_to     = coalesce(p_assigned_to, assigned_to),
         cancel_reason   = case when p_to in ('cancelled', 'declined') then p_reason else cancel_reason end
   where id = p_booking;
  return p_to;
end $$;

-- Backend job: confirm bookings whose confirmation window has passed.
create function public.auto_close_completed_bookings() returns integer
language plpgsql security definer set search_path = public as $$
declare v_n integer;
begin
  if auth.uid() is not null then
    raise exception 'backend only' using errcode = '42501';
  end if;
  update public.bookings set status = 'closed'
   where status = 'completed' and auto_confirm_at <= now();
  get diagnostics v_n = row_count;
  return v_n;
end $$;

-- ---------------------------------------------------------------------------
-- Quotes
-- ---------------------------------------------------------------------------

create function public.prepare_quote() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_status public.booking_status;
begin
  select status into v_status from public.bookings where id = new.booking_id;
  if v_status not in ('requested', 'quoted') then
    raise exception 'booking is not open for quoting';
  end if;
  new.version := coalesce((select max(version) from public.quotes where booking_id = new.booking_id), 0) + 1;
  new.status := 'draft';
  new.created_by := coalesce(auth.uid(), new.created_by);
  return new;
end $$;

create trigger prepare_quote before insert on public.quotes
  for each row execute function public.prepare_quote();

create function public.guard_quote_lines() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_status public.quote_status;
begin
  select status into v_status from public.quotes where id = coalesce(new.quote_id, old.quote_id);
  if found and v_status <> 'draft' then
    raise exception 'quote lines can only change while the quote is a draft';
  end if;
  return coalesce(new, old);
end $$;

create trigger guard_quote_lines before insert or update or delete on public.quote_lines
  for each row execute function public.guard_quote_lines();

create function public.send_quote(p_quote uuid) returns void
language plpgsql security definer set search_path = public as $$
declare q public.quotes; b public.bookings;
begin
  select * into q from public.quotes where id = p_quote for update;
  if not found then raise exception 'quote not found'; end if;
  select * into b from public.bookings where id = q.booking_id for update;
  if auth.uid() is not null
     and not public.is_company_member(b.company_id, array['owner', 'dispatcher']::public.company_role[]) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if q.status <> 'draft' then raise exception 'only a draft quote can be sent'; end if;
  if b.status not in ('requested', 'quoted') then raise exception 'booking is not open for quoting'; end if;
  if not exists (select 1 from public.quote_lines where quote_id = q.id) then
    raise exception 'a quote needs at least one line';
  end if;
  update public.quotes set status = 'expired' where booking_id = b.id and status = 'sent' and id <> q.id;
  update public.quotes set status = 'sent', sent_at = now() where id = q.id;
  if b.status = 'requested' then
    update public.bookings set status = 'quoted' where id = b.id;
  end if;
end $$;

create function public.accept_quote(p_quote uuid) returns void
language plpgsql security definer set search_path = public as $$
declare q public.quotes; b public.bookings; v_total bigint;
begin
  select * into q from public.quotes where id = p_quote for update;
  if not found then raise exception 'quote not found'; end if;
  select * into b from public.bookings where id = q.booking_id for update;
  if b.customer_id is distinct from auth.uid() then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if q.status <> 'sent' then raise exception 'only a sent quote can be accepted'; end if;
  if q.valid_until is not null and q.valid_until < now() then raise exception 'this quote has expired'; end if;
  select coalesce(sum(line_total_sen), 0) into v_total from public.quote_lines where quote_id = q.id;
  update public.quotes set status = 'accepted', decided_at = now() where id = q.id;
  update public.bookings set subtotal_sen = v_total, status = 'awaiting_payment' where id = b.id;
end $$;

create function public.decline_quote(p_quote uuid) returns void
language plpgsql security definer set search_path = public as $$
declare q public.quotes; b public.bookings;
begin
  select * into q from public.quotes where id = p_quote for update;
  if not found then raise exception 'quote not found'; end if;
  select * into b from public.bookings where id = q.booking_id;
  if b.customer_id is distinct from auth.uid() then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if q.status <> 'sent' then raise exception 'only a sent quote can be declined'; end if;
  update public.quotes set status = 'declined', decided_at = now() where id = q.id;
end $$;

-- ---------------------------------------------------------------------------
-- Job reports (the unit history)
-- ---------------------------------------------------------------------------

create function public.prepare_job_report() returns trigger
language plpgsql security definer set search_path = public as $$
declare b public.bookings; orig public.job_reports;
begin
  select * into b from public.bookings where id = new.booking_id;
  if not found then raise exception 'booking not found'; end if;
  if not exists (select 1 from public.booking_items where booking_id = new.booking_id and unit_id = new.unit_id) then
    raise exception 'this unit is not part of the booking';
  end if;
  new.company_id := b.company_id;
  new.author_id := coalesce(auth.uid(), new.author_id);
  new.status := 'draft';
  new.finalised_at := null;

  if new.supersedes_id is null then
    if b.status <> 'in_progress' then
      raise exception 'job reports are written while the booking is in progress';
    end if;
  else
    select * into orig from public.job_reports where id = new.supersedes_id;
    if not found or orig.status <> 'final' or orig.booking_id <> new.booking_id or orig.unit_id <> new.unit_id then
      raise exception 'a correction must reference a final report of the same unit and booking';
    end if;
    if b.status not in ('completed', 'closed', 'disputed') then
      raise exception 'corrections are filed after the job is completed';
    end if;
  end if;
  return new;
end $$;

create trigger prepare_job_report before insert on public.job_reports
  for each row execute function public.prepare_job_report();

-- A final report cannot be changed or deleted by anyone, including the backend.
create function public.protect_final_report() returns trigger
language plpgsql as $$
begin
  if tg_op = 'DELETE' then
    if old.status = 'final' then
      raise exception 'final job reports cannot be deleted';
    end if;
    return old;
  end if;
  if old.status = 'final' then
    raise exception 'final job reports cannot be changed; file a correction instead';
  end if;
  if new.booking_id <> old.booking_id or new.unit_id <> old.unit_id or new.company_id <> old.company_id
     or new.supersedes_id is distinct from old.supersedes_id then
    raise exception 'report identity cannot change';
  end if;
  if new.status = 'final' then
    new.finalised_at := now();
  end if;
  return new;
end $$;

create trigger protect_final_report before update or delete on public.job_reports
  for each row execute function public.protect_final_report();

create function public.protect_report_children() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_status public.report_status;
begin
  select status into v_status from public.job_reports where id = coalesce(new.job_report_id, old.job_report_id);
  if found and v_status = 'final' then
    raise exception 'the job report is final';
  end if;
  return coalesce(new, old);
end $$;

create trigger protect_report_parts before insert or update or delete on public.job_report_parts
  for each row execute function public.protect_report_children();
create trigger protect_report_photos before insert or update or delete on public.job_report_photos
  for each row execute function public.protect_report_children();

-- When a report is finalised, set the next service reminder for the unit.
create function public.create_reminder_on_final() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_code text; v_months smallint; v_due date;
begin
  if new.status = 'final' and old.status <> 'final' then
    select s.code, s.default_interval_months into v_code, v_months
      from public.booking_items i
      join public.service_types s on s.code = i.service_type_code
     where i.booking_id = new.booking_id and i.unit_id = new.unit_id
       and s.default_interval_months is not null
     order by s.default_interval_months
     limit 1;
    if v_code is not null then
      v_due := coalesce(new.recommended_next_service_on,
                        (new.finalised_at::date + make_interval(months => v_months))::date);
      update public.service_reminders set status = 'dismissed'
       where unit_id = new.unit_id and service_type_code = v_code and status = 'pending';
      insert into public.service_reminders (unit_id, service_type_code, due_on, source_report_id)
      values (new.unit_id, v_code, v_due, new.id)
      on conflict (unit_id, service_type_code, due_on)
      do update set status = 'pending', source_report_id = excluded.source_report_id;
    end if;
  end if;
  return null;
end $$;

create trigger create_reminder_on_final after update on public.job_reports
  for each row execute function public.create_reminder_on_final();

-- ---------------------------------------------------------------------------
-- Access to unit records
-- ---------------------------------------------------------------------------

-- The customer revokes a company's access to a unit once nothing is open between them.
create function public.revoke_unit_access(p_unit uuid, p_company uuid) returns integer
language plpgsql security definer set search_path = public as $$
declare v_n integer;
begin
  if not exists (select 1 from public.units where id = p_unit and customer_id = auth.uid()) then
    raise exception 'not your unit' using errcode = '42501';
  end if;
  if exists (
    select 1
    from public.bookings b
    join public.booking_items i on i.booking_id = b.id
    where i.unit_id = p_unit and b.company_id = p_company
      and b.status not in ('closed', 'cancelled', 'declined', 'refunded')
  ) then
    raise exception 'the company still has an open booking on this unit';
  end if;
  update public.unit_access_grants
     set revoked_at = now(), revoked_by = auth.uid()
   where unit_id = p_unit and company_id = p_company and revoked_at is null;
  get diagnostics v_n = row_count;
  insert into public.audit_log (actor_id, action, entity_type, entity_id, company_id)
  values (auth.uid(), 'unit_access_revoked', 'unit', p_unit, p_company);
  return v_n;
end $$;

-- Record that a contractor opened a unit's history. The app calls this when it shows the record.
create function public.log_unit_view(p_unit uuid) returns void
language plpgsql security definer set search_path = public as $$
declare v_company uuid;
begin
  if not public.can_access_unit(p_unit) then
    raise exception 'no access to this unit' using errcode = '42501';
  end if;
  select g.company_id into v_company
    from public.unit_access_grants g
   where g.unit_id = p_unit and g.revoked_at is null
     and g.company_id in (select public.my_company_ids())
   limit 1;
  if v_company is not null then
    insert into public.audit_log (actor_id, action, entity_type, entity_id, company_id)
    values (auth.uid(), 'unit_viewed', 'unit', p_unit, v_company);
  end if;
end $$;

-- Customers can export their own data. Runs with the caller's rights, so RLS applies.
create function public.export_my_data() returns jsonb
language sql stable as $$
  select jsonb_build_object(
    'exported_at', now(),
    'profile',   (select to_jsonb(p) from public.profiles p where p.id = auth.uid()),
    'addresses', coalesce((select jsonb_agg(to_jsonb(a)) from public.addresses a where a.customer_id = auth.uid()), '[]'::jsonb),
    'units',     coalesce((select jsonb_agg(to_jsonb(u)) from public.units u where u.customer_id = auth.uid()), '[]'::jsonb),
    'bookings',  coalesce((select jsonb_agg(to_jsonb(b)) from public.bookings b where b.customer_id = auth.uid()), '[]'::jsonb),
    'job_reports', coalesce((select jsonb_agg(to_jsonb(r))
                               from public.job_reports r
                               join public.units u on u.id = r.unit_id
                              where u.customer_id = auth.uid() and r.status = 'final'), '[]'::jsonb),
    'reviews',   coalesce((select jsonb_agg(to_jsonb(v)) from public.reviews v where v.customer_id = auth.uid()), '[]'::jsonb)
  );
$$;

-- ---------------------------------------------------------------------------
-- Money
-- ---------------------------------------------------------------------------

create function public.ledger_append_only() returns trigger
language plpgsql as $$
begin
  raise exception 'the ledger is append-only';
end $$;

create trigger ledger_append_only before update or delete on public.ledger_entries
  for each row execute function public.ledger_append_only();

create function public.ledger_on_payment() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_company uuid;
begin
  select company_id into v_company from public.bookings where id = new.booking_id;
  if (tg_op = 'INSERT' and new.status = 'held')
     or (tg_op = 'UPDATE' and new.status = 'held' and old.status <> 'held') then
    insert into public.ledger_entries (booking_id, company_id, payment_id, entry_type, amount_sen, memo)
    values (new.booking_id, v_company, new.id, 'payment_received', new.amount_sen, 'payment held');
  end if;
  if tg_op = 'UPDATE' and new.refunded_sen > old.refunded_sen then
    insert into public.ledger_entries (booking_id, company_id, payment_id, entry_type, amount_sen, memo)
    values (new.booking_id, v_company, new.id, 'refund', -(new.refunded_sen - old.refunded_sen), 'refund');
  end if;
  return null;
end $$;

create trigger ledger_on_payment after insert or update on public.payments
  for each row execute function public.ledger_on_payment();

create function public.ledger_on_payout_paid() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'paid' and old.status <> 'paid' and new.net_sen > 0 then
    insert into public.ledger_entries (booking_id, company_id, payout_id, entry_type, amount_sen, memo)
    values (new.booking_id, new.company_id, new.id, 'payout', -new.net_sen, 'payout sent');
  end if;
  return null;
end $$;

create trigger ledger_on_payout_paid after update on public.payouts
  for each row execute function public.ledger_on_payout_paid();

-- Backend job: create the payout for a closed booking, less commission and gateway fee.
create function public.queue_payout(p_booking uuid, p_gateway_fee_sen bigint default 0) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  b public.bookings;
  v_gross bigint;
  v_comm bigint;
  v_id uuid;
  v_when date;
begin
  if auth.uid() is not null then
    raise exception 'backend only' using errcode = '42501';
  end if;
  select * into b from public.bookings where id = p_booking for update;
  if not found then raise exception 'booking not found'; end if;
  if b.status <> 'closed' then raise exception 'booking is not closed'; end if;
  if not exists (select 1 from public.payments
                  where booking_id = b.id and status in ('held', 'released', 'partially_refunded')) then
    raise exception 'no held payment for this booking';
  end if;

  v_gross := b.total_sen - coalesce((select sum(refunded_sen) from public.payments where booking_id = b.id), 0);
  v_comm  := round(v_gross * coalesce(b.commission_bps, public.current_commission_bps(b.company_id)) / 10000.0)::bigint;
  v_when  := current_date + (((public.setting_int('payout_weekday_iso', 5) - extract(isodow from current_date)::integer + 6) % 7) + 1);

  insert into public.payouts (company_id, booking_id, gross_sen, commission_sen, gateway_fee_sen, net_sen, scheduled_for)
  values (b.company_id, b.id, v_gross, v_comm, p_gateway_fee_sen, v_gross - v_comm - p_gateway_fee_sen, v_when)
  returning id into v_id;

  if v_comm > 0 then
    insert into public.ledger_entries (booking_id, company_id, payout_id, entry_type, amount_sen, memo)
    values (b.id, b.company_id, v_id, 'commission', -v_comm, 'platform commission');
  end if;
  if p_gateway_fee_sen > 0 then
    insert into public.ledger_entries (booking_id, company_id, payout_id, entry_type, amount_sen, memo)
    values (b.id, b.company_id, v_id, 'gateway_fee', -p_gateway_fee_sen, 'gateway fee');
  end if;
  update public.payments set status = 'released' where booking_id = b.id and status in ('held', 'partially_refunded');
  insert into public.audit_log (action, entity_type, entity_id, company_id, meta)
  values ('payout_queued', 'payout', v_id, b.company_id,
          jsonb_build_object('booking_id', b.id, 'gross_sen', v_gross, 'commission_sen', v_comm));
  return v_id;
end $$;

-- ---------------------------------------------------------------------------
-- Disputes
-- ---------------------------------------------------------------------------

create function public.raise_dispute(p_booking uuid, p_reason text) returns uuid
language plpgsql security definer set search_path = public as $$
declare b public.bookings; v_id uuid;
begin
  select * into b from public.bookings where id = p_booking for update;
  if not found then raise exception 'booking not found'; end if;
  if not public.is_booking_party(p_booking) or public.is_platform_admin() then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if b.status <> 'completed' or (b.auto_confirm_at is not null and b.auto_confirm_at <= now()) then
    raise exception 'a dispute can only be raised while the booking is awaiting confirmation';
  end if;
  insert into public.disputes (booking_id, raised_by, reason) values (b.id, auth.uid(), p_reason)
  returning id into v_id;
  update public.bookings set status = 'disputed' where id = b.id;
  return v_id;
end $$;

create function public.decide_dispute(
  p_dispute uuid, p_outcome text, p_refund_sen bigint default 0, p_note text default null
) returns void
language plpgsql security definer set search_path = public as $$
declare d public.disputes; b public.bookings;
begin
  if not public.is_platform_admin() then
    raise exception 'admin only' using errcode = '42501';
  end if;
  if p_outcome not in ('release', 'refund', 'partial') then
    raise exception 'outcome must be release, refund or partial';
  end if;
  select * into d from public.disputes where id = p_dispute for update;
  if not found then raise exception 'dispute not found'; end if;
  if d.status not in ('open', 'under_review') then raise exception 'dispute already decided'; end if;
  select * into b from public.bookings where id = d.booking_id for update;
  if b.status <> 'disputed' then raise exception 'booking is not in dispute'; end if;
  if p_outcome = 'partial' and (p_refund_sen <= 0 or p_refund_sen >= b.total_sen) then
    raise exception 'a partial refund must be above 0 and below the booking total';
  end if;

  update public.disputes
     set status = (case p_outcome when 'release' then 'resolved_release'
                                  when 'refund'  then 'resolved_refund'
                                  else 'resolved_partial' end)::public.dispute_status,
         refund_sen = case p_outcome when 'refund' then b.total_sen
                                     when 'partial' then p_refund_sen
                                     else 0 end,
         resolution_note = p_note,
         decided_by = auth.uid(),
         decided_at = now()
   where id = d.id;
  update public.bookings
     set status = (case when p_outcome = 'refund' then 'refunded' else 'closed' end)::public.booking_status
   where id = b.id;
  insert into public.audit_log (actor_id, action, entity_type, entity_id, company_id, meta)
  values (auth.uid(), 'dispute_decided', 'dispute', d.id, b.company_id,
          jsonb_build_object('outcome', p_outcome, 'refund_sen', p_refund_sen));
end $$;

-- ---------------------------------------------------------------------------
-- Reviews
-- ---------------------------------------------------------------------------

create function public.prepare_review() returns trigger
language plpgsql security definer set search_path = public as $$
declare b public.bookings;
begin
  select * into b from public.bookings where id = new.booking_id;
  if not found then raise exception 'booking not found'; end if;
  if b.status <> 'closed' then
    raise exception 'only a paid, completed booking can be reviewed';
  end if;
  if b.customer_id <> new.customer_id then
    raise exception 'only the customer of the booking can review it';
  end if;
  new.company_id := b.company_id;
  return new;
end $$;

create trigger prepare_review before insert on public.reviews
  for each row execute function public.prepare_review();

create function public.guard_review_update() returns trigger
language plpgsql as $$
begin
  if new.rating <> old.rating or new.booking_id <> old.booking_id or new.customer_id <> old.customer_id then
    raise exception 'a review rating cannot be changed';
  end if;
  if new.company_reply is distinct from old.company_reply then
    new.replied_at := now();
  end if;
  return new;
end $$;

create trigger guard_review_update before update on public.reviews
  for each row execute function public.guard_review_update();

create function public.refresh_company_rating() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_company uuid := coalesce(new.company_id, old.company_id);
begin
  update public.companies c
     set rating_avg = coalesce((select round(avg(rating)::numeric, 2)
                                  from public.reviews where company_id = v_company and visibility = 'visible'), 0),
         rating_count = (select count(*) from public.reviews where company_id = v_company and visibility = 'visible')
   where c.id = v_company;
  return null;
end $$;

create trigger refresh_company_rating after insert or update or delete on public.reviews
  for each row execute function public.refresh_company_rating();
