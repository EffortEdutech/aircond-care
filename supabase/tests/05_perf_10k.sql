-- Performance check at roughly 10x the expected pilot size. Rolled back at the end.
-- Loads 10,000 bookings (+ items, ledger, chat, audit, notifications) spread over the seed
-- accounts, then times the queries the app runs, as the persona that runs them (RLS applies).
-- Output: one line per query with execution time in ms and the plan's top node.
-- Rule of thumb: anything over 100 ms here needs an index or a rewrite before launch.

do $$
declare
  custs uuid[]; comps uuid[];
  rec record; j jsonb; report text := ''; ms numeric; top text;
  c1 uuid; o11 uuid := '10000000-0000-4000-8000-000000000011'; adm uuid := '10000000-0000-4000-8000-000000000099';
  comp11 uuid; t0 timestamptz;
begin
  select array_agg(id order by email) into custs from public.profiles where email like 'test.customer%@example.test';
  select array_agg(id order by name) into comps from public.companies where name like '[TEST]%';
  c1 := custs[1];
  select company_id into comp11 from public.company_members where user_id = o11 and is_active limit 1;

  t0 := clock_timestamp();
  begin
    set local session_replication_role = replica;  -- skip triggers while bulk loading, if allowed
  exception when others then null; end;

  insert into public.units (customer_id, nickname)
  select custs[1 + (g % 3)], 'perf unit ' || g from generate_series(1, 900) g;

  insert into public.bookings (customer_id, company_id, status, subtotal_sen, call_out_fee_sen, commission_bps, created_at, completed_at, confirmed_at)
  select custs[1 + (g % 3)], comps[1 + (g % 3)], (array['closed','closed','closed','scheduled','requested','cancelled','disputed'])[1 + (g % 7)]::public.booking_status,
         15000, 2000, 1000,
         now() - (random() * 365) * interval '1 day', now() - (random() * 300) * interval '1 day', now() - (random() * 300) * interval '1 day'
  from generate_series(1, 10000) g;

  insert into public.booking_items (booking_id, unit_id, service_type_code)
  select b.id, (select u.id from public.units u where u.customer_id = b.customer_id and u.nickname like 'perf unit%' order by random() limit 1), 'general_service'
  from (select id, customer_id from public.bookings order by created_at desc limit 3000) b;

  insert into public.ledger_entries (booking_id, company_id, entry_type, amount_sen)
  select id, company_id, 'payment_received', 17000 from public.bookings where status = 'closed';
  insert into public.ledger_entries (booking_id, company_id, entry_type, amount_sen)
  select id, company_id, 'commission', -1700 from public.bookings where status = 'closed';

  insert into public.booking_messages (booking_id, sender_id, body)
  select id, customer_id, 'perf message ' || n from public.bookings, generate_series(1, 2) n;

  insert into public.audit_log (actor_id, action, entity_type, entity_id, meta)
  select adm, (array['payout_queued','dispute_decided','company_verified','refund_recorded'])[1 + (g % 4)], 'booking', gen_random_uuid(), '{}'::jsonb
  from generate_series(1, 10000) g;

  insert into public.notifications (user_id, channel, template, payload, status)
  select custs[1 + (g % 3)], 'in_app', 'new_message', '{}'::jsonb, 'sent' from generate_series(1, 10000) g;

  begin set local session_replication_role = origin; exception when others then null; end;
  analyze public.bookings; analyze public.booking_items; analyze public.ledger_entries;
  analyze public.booking_messages; analyze public.audit_log; analyze public.notifications; analyze public.units;
  report := report || format('loaded in %s s' || E'\n', round(extract(epoch from clock_timestamp() - t0)::numeric, 1));

  for rec in
    select * from (values
      ('customer: my bookings (50)',       c1,  'select * from public.bookings where customer_id = ''' || c1 || ''' order by created_at desc limit 50'),
      ('customer: my units',               c1,  'select * from public.units where customer_id = ''' || c1 || ''' and not is_archived order by created_at desc'),
      ('customer: unread alerts count',    c1,  'select count(*) from public.notifications where user_id = ''' || c1 || ''' and read_at is null'),
      ('customer: notifications (50)',     c1,  'select * from public.notifications where user_id = ''' || c1 || ''' order by created_at desc limit 50'),
      ('customer: booking chat',           c1,  'select * from public.booking_messages where booking_id = (select id from public.bookings where customer_id = ''' || c1 || ''' limit 1) order by created_at'),
      ('owner: work list (100)',           o11, 'select * from public.bookings where company_id = ''' || comp11 || ''' order by created_at desc limit 100'),
      ('owner: work list, status filter',  o11, 'select * from public.bookings where company_id = ''' || comp11 || ''' and status = ''scheduled'' order by created_at desc limit 100'),
      ('owner: earnings total',            o11, 'select entry_type, sum(amount_sen) from public.ledger_entries where company_id = ''' || comp11 || ''' group by 1'),
      ('owner: ledger recent (100)',       o11, 'select * from public.ledger_entries where company_id = ''' || comp11 || ''' order by id desc limit 100'),
      ('admin: bookings list (100)',       adm, 'select * from public.bookings order by created_at desc limit 100'),
      ('admin: bookings by status',        adm, 'select * from public.bookings where status = ''disputed'' order by created_at desc limit 100'),
      ('admin: disputes list',             adm, 'select * from public.disputes order by created_at desc limit 100'),
      ('admin: audit search by action',    adm, 'select * from public.audit_log where action ilike ''%dispute%'' order by created_at desc limit 51'),
      ('admin: audit newest page',         adm, 'select * from public.audit_log order by created_at desc limit 51'),
      ('admin: audit by entity id',        adm, 'select * from public.audit_log where entity_id = (select entity_id from public.audit_log limit 1)'),
      ('admin: payment reconciliation',    adm, 'select * from public.payment_reconciliation'),
      ('admin: payouts due',               adm, 'select * from public.payouts where status = ''queued'' order by created_at')
    ) as v(label, who, q)
  loop
    perform set_config('request.jwt.claims', json_build_object('sub', rec.who, 'role', 'authenticated')::text, true);
    perform set_config('request.jwt.claim.sub', rec.who::text, true);
    set local role authenticated;
    begin
      execute 'explain (analyze, format json) ' || rec.q into j;
      ms := (j -> 0 ->> 'Execution Time')::numeric;
      top := j -> 0 -> 'Plan' ->> 'Node Type';
      report := report || format('%s ms | %s | %s' || E'\n', lpad(round(ms, 1)::text, 7), rpad(rec.label, 36), top);
    exception when others then
      report := report || format('ERROR | %s | %s' || E'\n', rec.label, sqlerrm);
    end;
    reset role;
  end loop;

  raise exception E'PERF REPORT (10k bookings)\n%', report;
end $$;
