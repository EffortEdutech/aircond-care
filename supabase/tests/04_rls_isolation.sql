-- RLS isolation test. Run against a database with the seed accounts (supabase/seed).
-- Everything is rolled back: the block ends by raising an exception that carries the report.
-- Re-run after every migration. Expected output ends with: FAILURES: 0
--
-- Read checks: a signed-in persona must see zero rows that belong to someone else.
-- Write checks: direct writes that should be impossible must fail or touch zero rows.

do $$
declare
  rec record;
  got int;
  report text := '';
  fails int := 0;
  c1 uuid; c2 uuid; o11 uuid; o12 uuid; t1 uuid; adm uuid;
  mine_c text := '(select company_id from public.company_members where user_id = %U and is_active)';
begin
  execute $f$
    create function pg_temp.vis(p_uid uuid, p_sql text) returns int language plpgsql as $b$
    declare n int;
    begin
      perform set_config('request.jwt.claims',
        case when p_uid is null then '{"role":"anon"}' else json_build_object('sub', p_uid, 'role', 'authenticated')::text end, true);
      perform set_config('request.jwt.claim.sub', coalesce(p_uid::text, ''), true);
      execute case when p_uid is null then 'set local role anon' else 'set local role authenticated' end;
      begin
        execute p_sql into n;
      exception when insufficient_privilege then
        n := 0;
      end;
      reset role;
      return n;
    end $b$ $f$;

  select id into c1 from public.profiles where email = 'test.customer1@example.test';
  select id into c2 from public.profiles where email = 'test.customer2@example.test';
  select id into t1 from public.profiles where email = 'test.tech1@example.test';
  o11 := '10000000-0000-4000-8000-000000000011';
  o12 := '10000000-0000-4000-8000-000000000012';
  adm := '10000000-0000-4000-8000-000000000099';

  -- label, persona, read-as-persona query, expected count (0 means "no foreign rows")
  for rec in
    select * from (values
      ('customer: foreign bookings',        c1, 'select count(*) from public.bookings where customer_id <> %U', 0),
      ('customer: foreign units',           c1, 'select count(*) from public.units where customer_id <> %U', 0),
      ('customer: foreign addresses',       c1, 'select count(*) from public.addresses where customer_id <> %U', 0),
      ('customer: foreign payments',        c1, 'select count(*) from public.payments where customer_id <> %U', 0),
      ('customer: foreign notifications',   c1, 'select count(*) from public.notifications where user_id <> %U', 0),
      ('customer: foreign chat',            c1, 'select count(*) from public.booking_messages m join public.bookings b on b.id = m.booking_id where b.customer_id <> %U', 0),
      ('customer: foreign disputes',        c1, 'select count(*) from public.disputes d join public.bookings b on b.id = d.booking_id where b.customer_id <> %U', 0),
      ('customer: foreign quotes',          c1, 'select count(*) from public.quotes q join public.bookings b on b.id = q.booking_id where b.customer_id <> %U', 0),
      ('customer: foreign reminders',       c1, 'select count(*) from public.service_reminders r join public.units u on u.id = r.unit_id where u.customer_id <> %U', 0),
      ('customer: ledger',                  c1, 'select count(*) from public.ledger_entries', 0),
      ('customer: payouts',                 c1, 'select count(*) from public.payouts', 0),
      ('customer: audit log',               c1, 'select count(*) from public.audit_log', 0),
      ('customer: webhook events',          c1, 'select count(*) from public.webhook_events', 0),
      ('customer: platform admins',         c1, 'select count(*) from public.platform_admins', 0),
      ('customer: company subscriptions',   c1, 'select count(*) from public.company_subscriptions', 0),
      ('customer: subscription invoices',   c1, 'select count(*) from public.subscription_invoices', 0),
      ('customer: foreign deletion reqs',   c1, 'select count(*) from public.account_deletion_requests where user_id <> %U', 0),
      ('customer: company documents',       c1, 'select count(*) from public.company_documents', 0),
      ('owner: foreign bookings',           o11, 'select count(*) from public.bookings where company_id not in ' || mine_c, 0),
      ('owner: foreign ledger',             o11, 'select count(*) from public.ledger_entries where company_id not in ' || mine_c, 0),
      ('owner: foreign payouts',            o11, 'select count(*) from public.payouts where company_id not in ' || mine_c, 0),
      ('owner: foreign job reports',        o11, 'select count(*) from public.job_reports where company_id not in ' || mine_c, 0),
      ('owner: foreign subscriptions',      o11, 'select count(*) from public.company_subscriptions where company_id not in ' || mine_c, 0),
      ('owner: foreign invoices',           o11, 'select count(*) from public.subscription_invoices where company_id not in ' || mine_c, 0),
      ('owner: foreign documents',          o11, 'select count(*) from public.company_documents where company_id not in ' || mine_c, 0),
      ('owner: foreign audit rows',         o11, 'select count(*) from public.audit_log where company_id is distinct from null and company_id not in ' || mine_c, 0),
      ('owner: foreign quotes',             o11, 'select count(*) from public.quotes q join public.bookings b on b.id = q.booking_id where b.company_id not in ' || mine_c, 0),
      ('owner: foreign chat',               o11, 'select count(*) from public.booking_messages m join public.bookings b on b.id = m.booking_id where b.company_id not in ' || mine_c, 0),
      ('owner: foreign disputes',           o11, 'select count(*) from public.disputes d join public.bookings b on b.id = d.booking_id where b.company_id not in ' || mine_c, 0),
      ('owner: foreign payments',           o11, 'select count(*) from public.payments p join public.bookings b on b.id = p.booking_id where b.company_id not in ' || mine_c, 0),
      ('owner: foreign addresses',          o11, 'select count(*) from public.addresses a where not exists (select 1 from public.bookings b where b.address_id = a.id and b.company_id in ' || mine_c || ')', 0),
      ('owner: units without booking/grant',o11, 'select count(*) from public.units u where not exists (select 1 from public.booking_items i join public.bookings b on b.id = i.booking_id where i.unit_id = u.id and b.company_id in ' || mine_c || ') and not exists (select 1 from public.unit_access_grants g where g.unit_id = u.id and g.company_id in ' || mine_c || ')', 0),
      ('owner: webhook events',             o11, 'select count(*) from public.webhook_events', 0),
      ('owner: platform admins',            o11, 'select count(*) from public.platform_admins', 0),
      ('owner: foreign notifications',      o11, 'select count(*) from public.notifications where user_id <> %U', 0),
      ('other owner: foreign bookings',     o12, 'select count(*) from public.bookings where company_id not in ' || mine_c, 0),
      ('tech: bookings not assigned',       t1, 'select count(*) from public.bookings where assigned_to is distinct from %U', 0),
      ('tech: ledger',                      t1, 'select count(*) from public.ledger_entries', 0),
      ('tech: payouts',                     t1, 'select count(*) from public.payouts', 0),
      ('tech: subscriptions',               t1, 'select count(*) from public.company_subscriptions', 0),
      ('anon: bookings',                    null::uuid, 'select count(*) from public.bookings', 0),
      ('anon: units',                       null::uuid, 'select count(*) from public.units', 0),
      ('anon: addresses',                   null::uuid, 'select count(*) from public.addresses', 0),
      ('anon: profiles',                    null::uuid, 'select count(*) from public.profiles', 0),
      ('anon: payments',                    null::uuid, 'select count(*) from public.payments', 0),
      ('anon: ledger',                      null::uuid, 'select count(*) from public.ledger_entries', 0),
      ('anon: payouts',                     null::uuid, 'select count(*) from public.payouts', 0),
      ('anon: chat',                        null::uuid, 'select count(*) from public.booking_messages', 0),
      ('anon: disputes',                    null::uuid, 'select count(*) from public.disputes', 0),
      ('anon: notifications',               null::uuid, 'select count(*) from public.notifications', 0),
      ('anon: audit log',                   null::uuid, 'select count(*) from public.audit_log', 0),
      ('anon: company documents',           null::uuid, 'select count(*) from public.company_documents', 0),
      ('anon: company members',             null::uuid, 'select count(*) from public.company_members', 0),
      ('anon: subscriptions',               null::uuid, 'select count(*) from public.company_subscriptions', 0),
      ('anon: deletion requests',           null::uuid, 'select count(*) from public.account_deletion_requests', 0),
      ('anon: job reports',                 null::uuid, 'select count(*) from public.job_reports', 0),
      ('anon: webhook events',              null::uuid, 'select count(*) from public.webhook_events', 0)
    ) as v(label, who, q, expect)
  loop
    got := pg_temp.vis(rec.who, replace(rec.q, '%U', coalesce('''' || rec.who::text || '''::uuid', 'null')));
    if got <> rec.expect then
      fails := fails + 1;
      report := report || 'FAIL ' || rec.label || ': saw ' || got || E' (expected ' || rec.expect || E')\n';
    end if;
  end loop;

  -- Positive controls: each persona can still see their own data.
  for rec in
    select * from (values
      ('customer sees own bookings',   c1,  'select count(*) from public.bookings where customer_id = %U'),
      ('owner sees own bookings',      o11, 'select count(*) from public.bookings where company_id in ' || mine_c),
      ('anon sees public profiles',    null::uuid, 'select count(*) from public.public_company_profiles'),
      ('anon sees plans',              null::uuid, 'select count(*) from public.subscription_plans'),
      ('admin sees everything',        adm, 'select count(*) from public.bookings')
    ) as v(label, who, q)
  loop
    got := pg_temp.vis(rec.who, replace(rec.q, '%U', coalesce('''' || rec.who::text || '''::uuid', 'null')));
    if got = 0 then
      fails := fails + 1;
      report := report || 'FAIL ' || rec.label || E': saw 0 rows\n';
    end if;
  end loop;

  -- Write checks, as customer1: each must fail or change nothing.
  perform set_config('request.jwt.claims', json_build_object('sub', c1, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', c1::text, true);
  set local role authenticated;

  update public.profiles set full_name = 'hacked' where id = c2;
  get diagnostics got = row_count;
  if got <> 0 then fails := fails + 1; report := report || E'FAIL customer edited another profile\n'; end if;

  update public.units set nickname = 'hacked' where customer_id = c2;
  get diagnostics got = row_count;
  if got <> 0 then fails := fails + 1; report := report || E'FAIL customer edited another customer''s unit\n'; end if;

  begin
    update public.bookings set status = 'closed' where customer_id = c1;
    get diagnostics got = row_count;
    if got <> 0 then fails := fails + 1; report := report || E'FAIL customer changed booking status directly\n'; end if;
  exception when others then null; end;

  begin
    update public.bookings set total_sen = 1 where customer_id = c1;
    get diagnostics got = row_count;
    if got <> 0 then fails := fails + 1; report := report || E'FAIL customer changed booking total directly\n'; end if;
  exception when others then null; end;

  begin
    insert into public.ledger_entries (booking_id, company_id, entry_type, amount_sen)
    select id, company_id, 'payment_received', 1 from public.bookings limit 1;
    fails := fails + 1; report := report || E'FAIL customer inserted a ledger entry\n';
  exception when others then null; end;

  begin
    update public.payments set status = 'held' where customer_id = c1;
    get diagnostics got = row_count;
    if got <> 0 then fails := fails + 1; report := report || E'FAIL customer marked a payment paid\n'; end if;
  exception when others then null; end;

  begin
    update public.notifications set user_id = c2 where user_id = c1;
    get diagnostics got = row_count;
    if got <> 0 then fails := fails + 1; report := report || E'FAIL customer re-addressed a notification\n'; end if;
  exception when others then null; end;

  begin
    delete from public.audit_log;
    get diagnostics got = row_count;
    if got <> 0 then fails := fails + 1; report := report || E'FAIL customer deleted audit rows\n'; end if;
  exception when others then null; end;

  begin
    insert into public.platform_admins (user_id) values (c1);
    fails := fails + 1; report := report || E'FAIL customer made themselves admin\n';
  exception when others then null; end;
  reset role;

  -- Write checks, as the owner of company 11: cannot touch other companies or customers.
  perform set_config('request.jwt.claims', json_build_object('sub', o11, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', o11::text, true);
  set local role authenticated;
  begin
    update public.bookings set customer_notes = 'x' where company_id not in (select company_id from public.company_members where user_id = o11);
    get diagnostics got = row_count;
    if got <> 0 then fails := fails + 1; report := report || E'FAIL owner edited another company''s booking\n'; end if;
  exception when others then null; end;
  begin
    update public.company_subscriptions set plan_code = 'business' where company_id in (select company_id from public.company_members where user_id = o11);
    get diagnostics got = row_count;
    if got <> 0 then fails := fails + 1; report := report || E'FAIL owner changed their own plan directly\n'; end if;
  exception when others then null; end;
  begin
    update public.companies set status = 'verified' where id in (select company_id from public.company_members where user_id = o11);
    get diagnostics got = row_count;
    if got <> 0 then fails := fails + 1; report := report || E'FAIL owner approved their own company\n'; end if;
  exception when others then null; end;
  begin
    update public.units set nickname = 'hacked';
    get diagnostics got = row_count;
    if got <> 0 then fails := fails + 1; report := report || E'FAIL owner edited customer units\n'; end if;
  exception when others then null; end;
  reset role;

  raise exception E'RLS REPORT\n%FAILURES: %', report, fails;
end $$;
