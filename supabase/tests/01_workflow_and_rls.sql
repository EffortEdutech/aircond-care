-- 01_workflow_and_rls.sql
-- End-to-end test of the booking workflow, access rules (RLS), the immutable job-report
-- history and the money maths. Runs in one transaction and rolls back, so it leaves nothing behind.
-- A failed check raises an exception and stops the run.

\set ON_ERROR_STOP on
\o /dev/null
begin;

create schema tests;
grant usage on schema tests to anon, authenticated, service_role;

create table tests.kv (k text primary key, v text not null);

create function tests.put(p_key text, p_val text) returns void
language sql security definer set search_path = tests as $$
  insert into tests.kv values (p_key, p_val) on conflict (k) do update set v = excluded.v;
$$;
create function tests.get(p_key text) returns text
language sql stable security definer set search_path = tests as $$
  select v from tests.kv where k = p_key;
$$;

-- Act as a signed-in user, as anonymous, or as the backend (service role: no user, no RLS).
create function tests.login(p_user uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', p_user::text, true);
  execute 'set local role authenticated';
end $$;
create function tests.anon() returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', '', true);
  execute 'set local role anon';
end $$;
create function tests.backend() returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', '', true);
  execute 'reset role';
end $$;

create function tests.eq(p_name text, p_actual bigint, p_expected bigint) returns void language plpgsql as $$
begin
  if p_actual is distinct from p_expected then
    raise exception 'FAIL %: expected %, got %', p_name, p_expected, p_actual;
  end if;
  raise notice 'ok - %', p_name;
end $$;
create function tests.eqt(p_name text, p_actual text, p_expected text) returns void language plpgsql as $$
begin
  if p_actual is distinct from p_expected then
    raise exception 'FAIL %: expected %, got %', p_name, p_expected, p_actual;
  end if;
  raise notice 'ok - %', p_name;
end $$;
create function tests.ok(p_name text, p_cond boolean) returns void language plpgsql as $$
begin
  if p_cond is not true then
    raise exception 'FAIL %', p_name;
  end if;
  raise notice 'ok - %', p_name;
end $$;
-- The statement must fail, and the error message must contain p_like.
create function tests.fails(p_name text, p_sql text, p_like text) returns void language plpgsql as $$
begin
  begin
    execute p_sql;
  exception when others then
    if sqlerrm ilike '%' || p_like || '%' then
      raise notice 'ok - % (%)', p_name, sqlerrm;
      return;
    end if;
    raise exception 'FAIL %: expected an error containing "%", got "%"', p_name, p_like, sqlerrm;
  end;
  raise exception 'FAIL %: expected an error containing "%" but it succeeded', p_name, p_like;
end $$;

-- Fixed ids for the people in the story.
--   cust A  a0000000-0000-0000-0000-000000000001     cust B  a0000000-0000-0000-0000-000000000002
--   owner X b0000000-0000-0000-0000-000000000001     tech X  b0000000-0000-0000-0000-000000000002
--   owner Y c0000000-0000-0000-0000-000000000001     admin   d0000000-0000-0000-0000-000000000001

-- ===========================================================================
-- Setup: users and profiles
-- ===========================================================================
insert into auth.users (id, email, phone, raw_user_meta_data) values
  ('a0000000-0000-0000-0000-000000000001', 'aisha@example.test', '60110000001', '{"full_name":"Aisha (customer A)"}'),
  ('a0000000-0000-0000-0000-000000000002', 'ben@example.test',   '60110000002', '{"full_name":"Ben (customer B)"}'),
  ('b0000000-0000-0000-0000-000000000001', 'owner.x@example.test', '60120000001', '{"full_name":"Owner of X"}'),
  ('b0000000-0000-0000-0000-000000000002', 'tech.x@example.test',  '60120000002', '{"full_name":"Technician of X"}'),
  ('c0000000-0000-0000-0000-000000000001', 'owner.y@example.test', '60130000001', '{"full_name":"Owner of Y"}'),
  ('d0000000-0000-0000-0000-000000000001', 'admin@example.test',   '60140000001', '{"full_name":"Platform admin"}');
insert into public.platform_admins (user_id) values ('d0000000-0000-0000-0000-000000000001');

select tests.eq('a profile is created for every new user', (select count(*) from public.profiles), 6);

-- ===========================================================================
-- Company onboarding: create, upload documents, admin verifies
-- ===========================================================================
select tests.login('b0000000-0000-0000-0000-000000000001');
select tests.put('co_x', public.create_company('Sejuk Services', 'Sejuk Services Sdn Bhd', '202001000001', '0123456789', 'hello@sejuk.test')::text);
insert into public.company_members (company_id, user_id, role)
  values (tests.get('co_x')::uuid, 'b0000000-0000-0000-0000-000000000002', 'technician');
select tests.backend();
select tests.eq('a new company starts on the Starter plan (15% commission)', public.current_commission_bps(tests.get('co_x')::uuid)::bigint, 1500);
select tests.login('b0000000-0000-0000-0000-000000000001');
select tests.fails('the only owner cannot be demoted',
  $$update public.company_members set role = 'dispatcher' where user_id = 'b0000000-0000-0000-0000-000000000001'$$,
  'at least one active owner');

insert into public.company_documents (company_id, doc_type, storage_path)
  select tests.get('co_x')::uuid, t, 'documents/' || t from unnest(enum_range(null::public.document_type)) t;
select tests.fails('an owner cannot verify their own company',
  format($$select public.admin_set_company_status(%L, 'verified')$$, tests.get('co_x')),
  'admin only');
select tests.fails('a company cannot self-edit its verification status',
  format($$update public.companies set status = 'verified' where id = %L$$, tests.get('co_x')),
  'permission denied');

select tests.login('d0000000-0000-0000-0000-000000000001');
select tests.fails('admin cannot verify without approved documents',
  format($$select public.admin_set_company_status(%L, 'verified')$$, tests.get('co_x')),
  'approved SSM');
select public.admin_review_document(id, 'approved') from public.company_documents where company_id = tests.get('co_x')::uuid;
select public.admin_set_company_status(tests.get('co_x')::uuid, 'verified');
select tests.eq('company X is verified', (select count(*) from public.companies where id = tests.get('co_x')::uuid and status = 'verified' and verified_at is not null), 1);

-- Owner sets up service areas and the price list.
select tests.login('b0000000-0000-0000-0000-000000000001');
insert into public.company_service_areas (company_id, service_area_id, call_out_fee_sen)
  select tests.get('co_x')::uuid, id, 3000 from public.service_areas where district = 'Petaling';
insert into public.company_services (company_id, service_type_code, unit_type, price_sen) values
  (tests.get('co_x')::uuid, 'general_service', null,        8000),
  (tests.get('co_x')::uuid, 'chemical_wash',   'wall_split', 15000),
  (tests.get('co_x')::uuid, 'gas_topup',       null,        null),
  (tests.get('co_x')::uuid, 'repair',          null,        null);

-- Company Y exists only to prove isolation. Verified directly by the backend.
select tests.login('c0000000-0000-0000-0000-000000000001');
select tests.put('co_y', public.create_company('Dingin Aircond', 'Dingin Aircond Enterprise', '201901000002')::text);
select tests.backend();
update public.companies set status = 'verified' where id = tests.get('co_y')::uuid;
insert into public.company_service_areas (company_id, service_area_id, call_out_fee_sen)
  select tests.get('co_y')::uuid, id, 2500 from public.service_areas where district = 'Petaling';

-- ===========================================================================
-- Customer A registers an address and a unit
-- ===========================================================================
select tests.login('a0000000-0000-0000-0000-000000000001');
do $$
declare v uuid;
begin
  insert into public.addresses (customer_id, label, line1, postcode, service_area_id)
  select 'a0000000-0000-0000-0000-000000000001', 'Home', '12 Jalan Test, Petaling Jaya', '47800', id
    from public.service_areas where district = 'Petaling'
  returning id into v;
  perform tests.put('addr_a', v::text);

  insert into public.units (customer_id, address_id, nickname, brand, model, unit_type, horsepower, install_date)
  values ('a0000000-0000-0000-0000-000000000001', v, 'Living room', 'TestBrand', 'TB-1.0', 'wall_split', 1.0, '2024-03-01')
  returning id into v;
  perform tests.put('unit_a', v::text);
end $$;

select tests.login('a0000000-0000-0000-0000-000000000002');
select tests.eq('customer B cannot see customer A''s unit', (select count(*) from public.units), 0);
select tests.eq('customer B cannot see customer A''s address', (select count(*) from public.addresses), 0);
select tests.login('b0000000-0000-0000-0000-000000000001');
select tests.eq('a contractor cannot see a unit before there is a booking', (select count(*) from public.units), 0);

-- ===========================================================================
-- Booking 1: fixed-price general service
-- ===========================================================================
select tests.login('a0000000-0000-0000-0000-000000000001');
do $$
declare v uuid;
begin
  insert into public.bookings (customer_id, company_id, address_id, fault_description)
  values ('a0000000-0000-0000-0000-000000000001', tests.get('co_x')::uuid, tests.get('addr_a')::uuid, 'Not cold enough')
  returning id into v;
  perform tests.put('bk1', v::text);
end $$;
select tests.eqt('a new booking is always requested', (select status::text from public.bookings where id = tests.get('bk1')::uuid), 'requested');
select tests.eq('call-out fee is set from the company area fee', (select call_out_fee_sen from public.bookings where id = tests.get('bk1')::uuid), 3000);
select tests.ok('the address is snapshotted on the booking', (select address_snapshot ->> 'line1' from public.bookings where id = tests.get('bk1')::uuid) = '12 Jalan Test, Petaling Jaya');

select tests.fails('a customer cannot set an item price',
  format($$insert into public.booking_items (booking_id, unit_id, service_type_code, unit_price_sen) values (%L, %L, 'general_service', 1)$$, tests.get('bk1'), tests.get('unit_a')),
  'permission denied');
insert into public.booking_items (booking_id, unit_id, service_type_code)
  values (tests.get('bk1')::uuid, tests.get('unit_a')::uuid, 'general_service');
select tests.eq('item price comes from the price list', (select unit_price_sen from public.booking_items where booking_id = tests.get('bk1')::uuid), 8000);
select tests.eq('booking total = item + call-out fee', (select total_sen from public.bookings where id = tests.get('bk1')::uuid), 11000);
select tests.fails('a service the company does not offer is rejected',
  format($$insert into public.booking_items (booking_id, unit_id, service_type_code) values (%L, %L, 'installation')$$, tests.get('bk1'), tests.get('unit_a')),
  'does not offer');
select tests.fails('a customer cannot change booking status directly',
  format($$update public.bookings set status = 'paid' where id = %L$$, tests.get('bk1')),
  'permission denied');
update public.bookings set customer_notes = 'Gate code 1234' where id = tests.get('bk1')::uuid;

-- Access: the booking grants company X access to the unit, and nobody else.
select tests.eq('customer sees one access grant on the unit', (select count(*) from public.unit_access_grants where unit_id = tests.get('unit_a')::uuid), 1);
select tests.login('b0000000-0000-0000-0000-000000000001');
select tests.eq('company X owner can now see the unit', (select count(*) from public.units where id = tests.get('unit_a')::uuid), 1);
select tests.eq('company X owner can see the booking', (select count(*) from public.bookings), 1);
select tests.eq('company X owner can see the customer''s contact details', (select count(*) from public.profiles where id = 'a0000000-0000-0000-0000-000000000001'), 1);
select tests.eq('company X owner cannot see other customers', (select count(*) from public.profiles where id = 'a0000000-0000-0000-0000-000000000002'), 0);
select tests.login('c0000000-0000-0000-0000-000000000001');
select tests.eq('company Y cannot see the unit', (select count(*) from public.units), 0);
select tests.eq('company Y cannot see the booking', (select count(*) from public.bookings), 0);
select tests.login('b0000000-0000-0000-0000-000000000002');
select tests.eq('an unassigned technician cannot see the booking', (select count(*) from public.bookings), 0);

-- Workflow: only the right person can make each move.
select tests.login('a0000000-0000-0000-0000-000000000001');
select tests.fails('a customer cannot accept their own booking',
  format($$select public.transition_booking(%L, 'awaiting_payment')$$, tests.get('bk1')),
  'not allowed');
select tests.login('b0000000-0000-0000-0000-000000000001');
select public.transition_booking(tests.get('bk1')::uuid, 'awaiting_payment');
select tests.eqt('the contractor accepted the fixed-price booking', (select status::text from public.bookings where id = tests.get('bk1')::uuid), 'awaiting_payment');

-- Payment: the backend records a held payment, then marks the booking paid.
select tests.backend();
select tests.fails('a booking cannot be paid without a payment that covers it',
  format($$select public.transition_booking(%L, 'paid')$$, tests.get('bk1')),
  'do not cover');
insert into public.payments (booking_id, customer_id, method, gateway, gateway_ref, amount_sen, status, paid_at)
  values (tests.get('bk1')::uuid, 'a0000000-0000-0000-0000-000000000001', 'fpx', 'testgw', 'ref-1', 11000, 'held', now());
select public.transition_booking(tests.get('bk1')::uuid, 'paid');
select tests.eq('commission rate is snapshotted when paid', (select commission_bps from public.bookings where id = tests.get('bk1')::uuid), 1500);
select tests.eq('the ledger holds the payment', (select sum(amount_sen) from public.ledger_entries where booking_id = tests.get('bk1')::uuid)::bigint, 11000);

-- Scheduling and the job.
select tests.login('b0000000-0000-0000-0000-000000000001');
select public.transition_booking(tests.get('bk1')::uuid, 'scheduled', now() + interval '1 day', now() + interval '1 day 2 hours', 'b0000000-0000-0000-0000-000000000002');
select tests.login('b0000000-0000-0000-0000-000000000002');
select tests.eq('the assigned technician can now see the booking', (select count(*) from public.bookings), 1);
select public.transition_booking(tests.get('bk1')::uuid, 'in_progress');
select tests.fails('a booking cannot complete without a final job report',
  format($$select public.transition_booking(%L, 'completed')$$, tests.get('bk1')),
  'final job report');

do $$
declare v uuid;
begin
  insert into public.job_reports (booking_id, unit_id, work_done, findings, gas_added_grams)
  values (tests.get('bk1')::uuid, tests.get('unit_a')::uuid, 'Washed coils, cleaned filters', 'Drain slightly blocked', 0)
  returning id into v;
  perform tests.put('rep1', v::text);
  insert into public.job_report_parts (job_report_id, description, quantity) values (v, 'Drain hose', 1);
end $$;
select tests.eqt('the report records the company and author', (select company_id::text || '/' || author_id::text from public.job_reports where id = tests.get('rep1')::uuid),
  tests.get('co_x') || '/b0000000-0000-0000-0000-000000000002');
select tests.login('a0000000-0000-0000-0000-000000000001');
select tests.eq('a draft report is hidden from the customer', (select count(*) from public.job_reports), 0);

select tests.login('b0000000-0000-0000-0000-000000000002');
update public.job_reports set status = 'final' where id = tests.get('rep1')::uuid;
select tests.ok('finalising stamps the time', (select finalised_at is not null from public.job_reports where id = tests.get('rep1')::uuid));
do $$
declare n integer;
begin
  update public.job_reports set findings = 'edited' where id = tests.get('rep1')::uuid;
  get diagnostics n = row_count;
  perform tests.eq('a technician cannot edit a final report (RLS hides it)', n::bigint, 0);
end $$;
select tests.backend();
select tests.fails('even the backend cannot edit a final report',
  format($$update public.job_reports set findings = 'edited' where id = %L$$, tests.get('rep1')), 'cannot be changed');
select tests.fails('even the backend cannot delete a final report',
  format($$delete from public.job_reports where id = %L$$, tests.get('rep1')), 'cannot be deleted');
select tests.fails('parts cannot be added to a final report',
  format($$insert into public.job_report_parts (job_report_id, description) values (%L, 'sneaky')$$, tests.get('rep1')), 'is final');

select tests.login('b0000000-0000-0000-0000-000000000002');
select public.transition_booking(tests.get('bk1')::uuid, 'completed');
select tests.ok('completion starts the confirmation window', (select auto_confirm_at > now() from public.bookings where id = tests.get('bk1')::uuid));

select tests.login('a0000000-0000-0000-0000-000000000001');
select tests.eq('a service reminder is set for the unit', (select count(*) from public.service_reminders where unit_id = tests.get('unit_a')::uuid and status = 'pending'), 1);
select tests.ok('the reminder is due six months after the job', (select due_on = (current_date + interval '6 months')::date from public.service_reminders where unit_id = tests.get('unit_a')::uuid and status = 'pending'));
select tests.eq('the customer sees the finished job in the unit history', (select count(*) from public.unit_history where unit_id = tests.get('unit_a')::uuid), 1);
select tests.login('b0000000-0000-0000-0000-000000000001');
select tests.eq('the contractor sees the unit history', (select count(*) from public.unit_history where unit_id = tests.get('unit_a')::uuid), 1);
select tests.login('a0000000-0000-0000-0000-000000000002');
select tests.eq('customer B sees no history for that unit', (select count(*) from public.unit_history), 0);
select tests.login('c0000000-0000-0000-0000-000000000001');
select tests.eq('company Y sees no history for that unit', (select count(*) from public.unit_history), 0);

-- Corrections replace the original in the history; they never rewrite it.
select tests.login('b0000000-0000-0000-0000-000000000001');
do $$
declare v uuid;
begin
  insert into public.job_reports (booking_id, unit_id, supersedes_id, work_done, findings)
  values (tests.get('bk1')::uuid, tests.get('unit_a')::uuid, tests.get('rep1')::uuid, 'Washed coils, cleaned filters, replaced drain hose', 'Drain was blocked')
  returning id into v;
  perform tests.put('rep2', v::text);
  update public.job_reports set status = 'final' where id = v;
end $$;
select tests.fails('a report can only be corrected once',
  format($$insert into public.job_reports (booking_id, unit_id, supersedes_id, work_done) values (%L, %L, %L, 'again')$$, tests.get('bk1'), tests.get('unit_a'), tests.get('rep1')),
  'duplicate key');
select tests.login('a0000000-0000-0000-0000-000000000001');
select tests.eqt('the history shows the correction, not the original', (select report_id::text from public.unit_history where unit_id = tests.get('unit_a')::uuid), tests.get('rep2'));

-- Customer confirms; backend queues the payout.
select tests.login('b0000000-0000-0000-0000-000000000001');
select tests.fails('the contractor cannot confirm on the customer''s behalf',
  format($$select public.transition_booking(%L, 'closed')$$, tests.get('bk1')), 'not allowed');
select tests.login('a0000000-0000-0000-0000-000000000001');
select public.transition_booking(tests.get('bk1')::uuid, 'closed');
select tests.fails('a customer cannot queue a payout', format($$select public.queue_payout(%L)$$, tests.get('bk1')), 'permission denied');

select tests.backend();
select tests.put('po1', public.queue_payout(tests.get('bk1')::uuid, 0)::text);
select tests.eq('payout gross', (select gross_sen from public.payouts where id = tests.get('po1')::uuid), 11000);
select tests.eq('payout commission is 15%', (select commission_sen from public.payouts where id = tests.get('po1')::uuid), 1650);
select tests.eq('payout net', (select net_sen from public.payouts where id = tests.get('po1')::uuid), 9350);
select tests.ok('payout is scheduled for a future Friday', (select scheduled_for > current_date and extract(isodow from scheduled_for) = 5 from public.payouts where id = tests.get('po1')::uuid));
select tests.eq('ledger before payout is sent = net owed', (select balance_sen from public.booking_ledger_balance where booking_id = tests.get('bk1')::uuid)::bigint, 9350);
update public.payouts set status = 'paid', paid_at = now() where id = tests.get('po1')::uuid;
select tests.eq('ledger is zero once the payout is sent', (select balance_sen from public.booking_ledger_balance where booking_id = tests.get('bk1')::uuid)::bigint, 0);
select tests.fails('the ledger is append-only', $$update public.ledger_entries set amount_sen = 1$$, 'append-only');

select tests.login('b0000000-0000-0000-0000-000000000001');
select tests.eq('the owner sees their payout', (select count(*) from public.payouts), 1);
select tests.ok('the owner sees ledger entries', (select count(*) from public.ledger_entries) > 0);
select tests.login('b0000000-0000-0000-0000-000000000002');
select tests.eq('a technician does not see payouts', (select count(*) from public.payouts), 0);
select tests.login('a0000000-0000-0000-0000-000000000001');
select tests.eq('a customer does not see payouts', (select count(*) from public.payouts), 0);
select tests.eq('a customer does not see the ledger', (select count(*) from public.ledger_entries), 0);

-- ===========================================================================
-- Review
-- ===========================================================================
select tests.login('a0000000-0000-0000-0000-000000000001');
insert into public.reviews (booking_id, customer_id, rating, comment) values (tests.get('bk1')::uuid, 'a0000000-0000-0000-0000-000000000001', 5, 'Fast and tidy');
select tests.eq('the company rating is updated', (select (rating_avg * 100)::bigint from public.companies where id = tests.get('co_x')::uuid), 500);
select tests.fails('a booking can only be reviewed once',
  format($$insert into public.reviews (booking_id, customer_id, rating) values (%L, 'a0000000-0000-0000-0000-000000000001', 1)$$, tests.get('bk1')), 'duplicate key');
select tests.login('a0000000-0000-0000-0000-000000000002');
select tests.fails('a customer cannot review as someone else',
  format($$insert into public.reviews (booking_id, customer_id, rating) values (%L, 'a0000000-0000-0000-0000-000000000001', 1)$$, tests.get('bk1')), 'row-level security');
select tests.login('b0000000-0000-0000-0000-000000000001');
update public.reviews set company_reply = 'Thank you!' where booking_id = tests.get('bk1')::uuid;
select tests.ok('a reply is time-stamped', (select replied_at is not null from public.reviews where booking_id = tests.get('bk1')::uuid));
select tests.fails('a company cannot change a rating', format($$update public.reviews set rating = 1 where booking_id = %L$$, tests.get('bk1')), 'permission denied');
select tests.anon();
select tests.eq('visitors can read visible reviews', (select count(*) from public.reviews), 1);
select tests.fails('visitors cannot see who wrote a review', $$select customer_id from public.reviews$$, 'permission denied');

-- ===========================================================================
-- Booking 2: repair through the quote path, then a dispute
-- ===========================================================================
select tests.login('a0000000-0000-0000-0000-000000000001');
do $$
declare v uuid;
begin
  insert into public.bookings (customer_id, company_id, address_id, fault_description)
  values ('a0000000-0000-0000-0000-000000000001', tests.get('co_x')::uuid, tests.get('addr_a')::uuid, 'Water leaking from the indoor unit')
  returning id into v;
  perform tests.put('bk2', v::text);
  insert into public.booking_items (booking_id, unit_id, service_type_code) values (v, tests.get('unit_a')::uuid, 'repair');
end $$;
select tests.eq('a quote-only service starts at zero', (select subtotal_sen from public.bookings where id = tests.get('bk2')::uuid), 0);

select tests.login('b0000000-0000-0000-0000-000000000001');
select tests.fails('a booking with a repair cannot skip the quote',
  format($$select public.transition_booking(%L, 'awaiting_payment')$$, tests.get('bk2')), 'needs a quote');
do $$
declare v uuid;
begin
  insert into public.quotes (booking_id, note) values (tests.get('bk2')::uuid, 'Drain and capacitor') returning id into v;
  perform tests.put('q1', v::text);
  insert into public.quote_lines (quote_id, kind, description, quantity, unit_price_sen) values
    (v, 'labour', 'Diagnose and clear drain', 1, 20000),
    (v, 'part',   'Capacitor',                2, 5000);
end $$;
select tests.login('a0000000-0000-0000-0000-000000000001');
select tests.eq('a customer cannot see a draft quote', (select count(*) from public.quotes), 0);
select tests.fails('a customer cannot send a quote', format($$select public.send_quote(%L)$$, tests.get('q1')), 'not allowed');
select tests.login('b0000000-0000-0000-0000-000000000001');
select public.send_quote(tests.get('q1')::uuid);
select tests.eqt('sending a quote moves the booking to quoted', (select status::text from public.bookings where id = tests.get('bk2')::uuid), 'quoted');
select tests.login('a0000000-0000-0000-0000-000000000001');
select tests.eq('the customer now sees the quote and its lines', (select count(*) from public.quote_lines), 2);
select public.accept_quote(tests.get('q1')::uuid);
select tests.eq('accepting sets the booking subtotal from the quote', (select subtotal_sen from public.bookings where id = tests.get('bk2')::uuid), 30000);
select tests.eq('booking total includes the call-out fee', (select total_sen from public.bookings where id = tests.get('bk2')::uuid), 33000);
select tests.eqt('accepting moves the booking to awaiting_payment', (select status::text from public.bookings where id = tests.get('bk2')::uuid), 'awaiting_payment');

select tests.backend();
select tests.fails('quote lines are locked once the quote is sent',
  format($$insert into public.quote_lines (quote_id, description, unit_price_sen) values (%L, 'extra', 1)$$, tests.get('q1')), 'draft');
select tests.fails('the status graph blocks impossible jumps',
  format($$update public.bookings set status = 'closed' where id = %L$$, tests.get('bk2')), 'invalid booking status change');
insert into public.payments (booking_id, customer_id, method, gateway, gateway_ref, amount_sen, status, paid_at)
  values (tests.get('bk2')::uuid, 'a0000000-0000-0000-0000-000000000001', 'card', 'testgw', 'ref-2', 33000, 'held', now());
select public.transition_booking(tests.get('bk2')::uuid, 'paid');

select tests.login('b0000000-0000-0000-0000-000000000001');
select public.transition_booking(tests.get('bk2')::uuid, 'scheduled', now() + interval '2 days', now() + interval '2 days 3 hours', 'b0000000-0000-0000-0000-000000000002');
select tests.login('b0000000-0000-0000-0000-000000000002');
select public.transition_booking(tests.get('bk2')::uuid, 'in_progress');
do $$
declare v uuid;
begin
  insert into public.job_reports (booking_id, unit_id, work_done) values (tests.get('bk2')::uuid, tests.get('unit_a')::uuid, 'Cleared drain, replaced capacitor') returning id into v;
  update public.job_reports set status = 'final' where id = v;
end $$;
select public.transition_booking(tests.get('bk2')::uuid, 'completed');

-- Audit: the contractor opens the unit; the customer can see who looked.
select tests.login('b0000000-0000-0000-0000-000000000001');
select public.log_unit_view(tests.get('unit_a')::uuid);
select tests.login('a0000000-0000-0000-0000-000000000001');
select tests.eq('the customer can see who viewed their unit', (select count(*) from public.audit_log where entity_type = 'unit' and action = 'unit_viewed'), 1);
select tests.login('a0000000-0000-0000-0000-000000000002');
select tests.eq('other customers cannot', (select count(*) from public.audit_log), 0);

-- Dispute.
select tests.login('b0000000-0000-0000-0000-000000000001');
select tests.fails('the contractor cannot raise a dispute outside the window',
  format($$select public.raise_dispute(%L, 'x')$$, tests.get('bk1')), 'awaiting confirmation');
select tests.login('a0000000-0000-0000-0000-000000000001');
select tests.put('dp1', public.raise_dispute(tests.get('bk2')::uuid, 'The leak came back the next day')::text);
select tests.eqt('a dispute freezes the booking', (select status::text from public.bookings where id = tests.get('bk2')::uuid), 'disputed');
select tests.fails('a customer cannot close a disputed booking',
  format($$select public.transition_booking(%L, 'closed')$$, tests.get('bk2')), 'not allowed');
select tests.fails('access cannot be revoked while a booking is open',
  format($$select public.revoke_unit_access(%L, %L)$$, tests.get('unit_a'), tests.get('co_x')), 'open booking');
select tests.fails('a customer cannot decide a dispute', format($$select public.decide_dispute(%L, 'refund')$$, tests.get('dp1')), 'admin only');
select tests.login('b0000000-0000-0000-0000-000000000001');
select tests.eq('the contractor can see the dispute', (select count(*) from public.disputes), 1);

select tests.login('d0000000-0000-0000-0000-000000000001');
select tests.fails('a partial refund must be below the total',
  format($$select public.decide_dispute(%L, 'partial', 33000)$$, tests.get('dp1')), 'below the booking total');
select public.decide_dispute(tests.get('dp1')::uuid, 'partial', 5000, 'Partial refund for the repeat visit');
select tests.eqt('the booking is closed after the decision', (select status::text from public.bookings where id = tests.get('bk2')::uuid), 'closed');
select tests.eqt('the dispute records the outcome', (select status::text from public.disputes where id = tests.get('dp1')::uuid), 'resolved_partial');

select tests.backend();
update public.payments set refunded_sen = 5000, status = 'partially_refunded' where booking_id = tests.get('bk2')::uuid;
select tests.put('po2', public.queue_payout(tests.get('bk2')::uuid, 0)::text);
select tests.eq('refund reduces the payout gross', (select gross_sen from public.payouts where id = tests.get('po2')::uuid), 28000);
select tests.eq('commission applies after the refund', (select commission_sen from public.payouts where id = tests.get('po2')::uuid), 4200);
select tests.eq('net after refund and commission', (select net_sen from public.payouts where id = tests.get('po2')::uuid), 23800);
update public.payouts set status = 'paid', paid_at = now() where id = tests.get('po2')::uuid;
select tests.eq('ledger is zero after refund, commission and payout', (select balance_sen from public.booking_ledger_balance where booking_id = tests.get('bk2')::uuid)::bigint, 0);

-- ===========================================================================
-- Customer control of the record
-- ===========================================================================
select tests.login('a0000000-0000-0000-0000-000000000002');
select tests.fails('only the owner can revoke access', format($$select public.revoke_unit_access(%L, %L)$$, tests.get('unit_a'), tests.get('co_x')), 'not your unit');
select tests.login('a0000000-0000-0000-0000-000000000001');
select tests.eq('revoking access ends both grants', public.revoke_unit_access(tests.get('unit_a')::uuid, tests.get('co_x')::uuid)::bigint, 2);
select tests.login('b0000000-0000-0000-0000-000000000001');
select tests.eq('the contractor can no longer read the unit', (select count(*) from public.units), 0);
select tests.eq('the contractor can no longer read the history', (select count(*) from public.unit_history), 0);
select tests.login('a0000000-0000-0000-0000-000000000001');
select tests.eq('the customer still has the full history', (select count(*) from public.unit_history where unit_id = tests.get('unit_a')::uuid), 2);
select tests.eq('export returns the customer''s units', jsonb_array_length(public.export_my_data() -> 'units')::bigint, 1);
select tests.fails('platform_admins is not readable by users', $$select * from public.platform_admins$$, 'permission denied');

-- ===========================================================================
-- Public pages
-- ===========================================================================
select tests.anon();
select tests.eq('visitors see the service catalogue', (select count(*) from public.service_types), 6);
select tests.eq('visitors see verified companies only', (select count(*) from public.public_company_profiles), 2);
select tests.eq('visitors see the starting price', (select starting_price_sen from public.public_company_profiles where slug like 'sejuk-services-%'), 8000);
select tests.fails('visitors cannot read bookings', $$select * from public.bookings$$, 'permission denied');
select tests.fails('visitors cannot read profiles', $$select * from public.profiles$$, 'permission denied');

select tests.backend();
select tests.eq('every settled booking nets to zero in the ledger', (select count(*) from public.booking_ledger_balance where balance_sen <> 0), 0);

rollback;
\o
\echo 'All checks passed.'
