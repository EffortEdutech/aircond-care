-- TEST DATA ONLY. Full scenario set that sits on top of test_contractors.sql and test_users.sql.
-- Run those two first. Safe to run more than once (it stops if the marker booking already exists).
-- Password for every account: AircondTest#2026
--
-- Adds: customer3 (Sarah), technician2 (Kumar at Valley Cool), 2 more units, bookings in every status,
-- quotes, held payments with ledger, job reports (draft + final), service reminders, payouts,
-- reviews + reply, disputes, company documents, subscriptions + invoices, notifications, audit log.
-- Backend-only steps run with no signed-in user; customer/admin steps set a test JWT for that step.

do $seed$
declare
  c1 uuid; c2 uuid; c3 uuid;                                  -- companies
  u_c1 constant uuid := '10000000-0000-4000-8000-000000000001';
  u_c2 constant uuid := '10000000-0000-4000-8000-000000000002';
  u_c3 constant uuid := '10000000-0000-4000-8000-000000000003';
  u_o1 constant uuid := '10000000-0000-4000-8000-000000000011';
  u_o2 constant uuid := '10000000-0000-4000-8000-000000000012';
  u_o3 constant uuid := '10000000-0000-4000-8000-000000000013';
  u_t1 constant uuid := '10000000-0000-4000-8000-000000000021';
  u_t2 constant uuid := '10000000-0000-4000-8000-000000000022';
  u_ad constant uuid := '10000000-0000-4000-8000-000000000099';
  a_c3 constant uuid := '20000000-0000-4000-8000-000000000005';
  b uuid; q uuid; d uuid;
  i int;
begin
  if exists (select 1 from public.bookings where id = '40000000-0000-4000-8000-000000000016') then
    raise notice 'full dataset already present, skipping';
    return;
  end if;

  select id into c1 from public.companies where ssm_number = 'TEST-0001';
  select id into c2 from public.companies where ssm_number = 'TEST-0002';
  select id into c3 from public.companies where ssm_number = 'TEST-0003';

  ---------------------------------------------------------------- people, places, units
  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change, email_change_token_new, email_change_token_current,
    phone_change, phone_change_token, reauthentication_token)
  select '00000000-0000-0000-0000-000000000000', v.id::uuid, 'authenticated', 'authenticated', v.email,
         crypt('AircondTest#2026', gen_salt('bf')), now(),
         '{"provider":"email","providers":["email"]}'::jsonb, jsonb_build_object('full_name', v.name), now(), now(),
         '', '', '', '', '', '', '', ''
    from (values
      ('10000000-0000-4000-8000-000000000003', 'test.customer3@example.test', 'Sarah (test customer)'),
      ('10000000-0000-4000-8000-000000000022', 'test.tech2@example.test',     'Kumar (test technician)')
    ) v(id, email, name)
   where not exists (select 1 from auth.users u where u.email = v.email);

  insert into auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
  select gen_random_uuid(), u.id, u.id::text, 'email',
         jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true), now(), now(), now()
    from auth.users u
   where u.email like '%@example.test'
     and not exists (select 1 from auth.identities i2 where i2.user_id = u.id);

  insert into public.profiles (id, full_name, email)
  select u.id, u.raw_user_meta_data->>'full_name', u.email from auth.users u
   where u.email like '%@example.test'
  on conflict (id) do nothing;

  insert into public.company_members (company_id, user_id, role) values (c3, u_t2, 'technician')
  on conflict do nothing;

  insert into public.addresses (id, customer_id, label, line1, line2, postcode, service_area_id, is_default, access_notes)
  select a_c3, u_c3, 'Condo', 'Unit 15-3, Residensi Bangsar South', 'Jalan Kerinchi', '59200', sa.id, true, 'Visitor parking level P2'
    from public.service_areas sa where sa.district = 'Kuala Lumpur'
  on conflict (id) do nothing;

  insert into public.units (id, customer_id, address_id, nickname, brand, model, unit_type, horsepower, refrigerant)
  values
    ('30000000-0000-4000-8000-000000000006', u_c3, a_c3, 'Living room', 'Midea',  'MSAF-12CRN8', 'wall_split', 1.5, 'R32'),
    ('30000000-0000-4000-8000-000000000007', u_c3, a_c3, 'Bedroom',     'Toshiba','RAS-10N4KCV', 'wall_split', 1.0, 'R32')
  on conflict (id) do nothing;

  ---------------------------------------------------------------- bookings (all start as requested)
  -- 03 quoted | 04 awaiting_payment | 05 awaiting_payment via accepted quote | 06 paid | 07 scheduled
  -- 08 in_progress | 09 completed | 10 closed, payout queued | 11 closed, payout paid | 12 disputed
  -- 13 refunded | 14 declined | 15 cancelled | 16 requested (marker)
  insert into public.bookings (id, customer_id, company_id, address_id, fault_description, customer_notes, requested_start)
  values
    ('40000000-0000-4000-8000-000000000003', u_c1, c1, '20000000-0000-4000-8000-000000000001', 'Aircond leaks water and smells musty', null, now() + interval '3 days'),
    ('40000000-0000-4000-8000-000000000004', u_c1, c1, '20000000-0000-4000-8000-000000000001', null, 'Weekend morning preferred', now() + interval '5 days'),
    ('40000000-0000-4000-8000-000000000005', u_c2, c2, '20000000-0000-4000-8000-000000000003', 'Compressor makes a loud noise', null, now() + interval '4 days'),
    ('40000000-0000-4000-8000-000000000006', u_c2, c2, '20000000-0000-4000-8000-000000000003', null, null, now() + interval '2 days'),
    ('40000000-0000-4000-8000-000000000007', u_c3, c3, a_c3, null, 'Call the guard house on arrival', now() + interval '1 day'),
    ('40000000-0000-4000-8000-000000000008', u_c1, c1, '20000000-0000-4000-8000-000000000002', null, null, now()),
    ('40000000-0000-4000-8000-000000000009', u_c2, c3, '20000000-0000-4000-8000-000000000004', null, null, now() - interval '1 day'),
    ('40000000-0000-4000-8000-000000000010', u_c1, c1, '20000000-0000-4000-8000-000000000001', null, null, now() - interval '20 days'),
    ('40000000-0000-4000-8000-000000000011', u_c2, c2, '20000000-0000-4000-8000-000000000003', null, null, now() - interval '30 days'),
    ('40000000-0000-4000-8000-000000000012', u_c3, c3, a_c3, null, null, now() - interval '3 days'),
    ('40000000-0000-4000-8000-000000000013', u_c2, c2, '20000000-0000-4000-8000-000000000003', null, null, now() - interval '12 days'),
    ('40000000-0000-4000-8000-000000000014', u_c1, c1, '20000000-0000-4000-8000-000000000001', 'Not cooling', null, now() + interval '1 day'),
    ('40000000-0000-4000-8000-000000000015', u_c2, c3, '20000000-0000-4000-8000-000000000004', null, 'Changed plans', now() + interval '6 days'),
    ('40000000-0000-4000-8000-000000000016', u_c3, c3, a_c3, null, 'Any weekday after 3pm', now() + interval '7 days')
  on conflict (id) do nothing;

  insert into public.booking_items (booking_id, unit_id, service_type_code, description) values
    ('40000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000001', 'repair', 'Water leaking from the indoor unit'),
    ('40000000-0000-4000-8000-000000000004', '30000000-0000-4000-8000-000000000002', 'chemical_wash', null),
    ('40000000-0000-4000-8000-000000000005', '30000000-0000-4000-8000-000000000004', 'repair', 'Loud compressor noise'),
    ('40000000-0000-4000-8000-000000000006', '30000000-0000-4000-8000-000000000004', 'general_service', null),
    ('40000000-0000-4000-8000-000000000007', '30000000-0000-4000-8000-000000000006', 'general_service', null),
    ('40000000-0000-4000-8000-000000000007', '30000000-0000-4000-8000-000000000007', 'general_service', null),
    ('40000000-0000-4000-8000-000000000008', '30000000-0000-4000-8000-000000000003', 'general_service', null),
    ('40000000-0000-4000-8000-000000000009', '30000000-0000-4000-8000-000000000005', 'chemical_wash', null),
    ('40000000-0000-4000-8000-000000000010', '30000000-0000-4000-8000-000000000001', 'general_service', null),
    ('40000000-0000-4000-8000-000000000011', '30000000-0000-4000-8000-000000000004', 'general_service', null),
    ('40000000-0000-4000-8000-000000000012', '30000000-0000-4000-8000-000000000006', 'chemical_wash', null),
    ('40000000-0000-4000-8000-000000000013', '30000000-0000-4000-8000-000000000004', 'general_service', null),
    ('40000000-0000-4000-8000-000000000014', '30000000-0000-4000-8000-000000000001', 'repair', 'Not cooling'),
    ('40000000-0000-4000-8000-000000000015', '30000000-0000-4000-8000-000000000005', 'general_service', null),
    ('40000000-0000-4000-8000-000000000016', '30000000-0000-4000-8000-000000000007', 'general_service', null);

  ---------------------------------------------------------------- quotes
  -- 03: quote sent, waiting for the customer.
  insert into public.quotes (id, booking_id, created_by, note, valid_until)
  values ('50000000-0000-4000-8000-000000000003', '40000000-0000-4000-8000-000000000003', u_o1,
          'Blocked drain pipe and dirty coil. Price includes labour and parts.', now() + interval '7 days');
  insert into public.quote_lines (quote_id, kind, description, quantity, unit_price_sen, sort_order) values
    ('50000000-0000-4000-8000-000000000003', 'labour',  'Clear drain pipe and clean coil', 1, 12000, 1),
    ('50000000-0000-4000-8000-000000000003', 'part',    'Drain hose replacement',          1,  3500, 2);
  perform public.send_quote('50000000-0000-4000-8000-000000000003');

  -- 05: quote sent, then accepted by the customer.
  insert into public.quotes (id, booking_id, created_by, note, valid_until)
  values ('50000000-0000-4000-8000-000000000005', '40000000-0000-4000-8000-000000000005', u_o2,
          'Compressor capacitor is weak. Replace and test.', now() + interval '7 days');
  insert into public.quote_lines (quote_id, kind, description, quantity, unit_price_sen, sort_order) values
    ('50000000-0000-4000-8000-000000000005', 'labour', 'Diagnose and replace capacitor', 1, 8000, 1),
    ('50000000-0000-4000-8000-000000000005', 'part',   'Run capacitor 35uF',             1, 4500, 2);
  perform public.send_quote('50000000-0000-4000-8000-000000000005');
  perform set_config('request.jwt.claims', json_build_object('sub', u_c2, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', u_c2::text, true);
  perform public.accept_quote('50000000-0000-4000-8000-000000000005');
  perform set_config('request.jwt.claims', '', true);
  perform set_config('request.jwt.claim.sub', '', true);

  ---------------------------------------------------------------- fixed-price bookings -> awaiting_payment
  foreach b in array array[
    '40000000-0000-4000-8000-000000000004', '40000000-0000-4000-8000-000000000006', '40000000-0000-4000-8000-000000000007',
    '40000000-0000-4000-8000-000000000008', '40000000-0000-4000-8000-000000000009', '40000000-0000-4000-8000-000000000010',
    '40000000-0000-4000-8000-000000000011', '40000000-0000-4000-8000-000000000012', '40000000-0000-4000-8000-000000000013']::uuid[]
  loop
    perform public.transition_booking(b, 'awaiting_payment');
  end loop;

  ---------------------------------------------------------------- payments held (06..13) -> paid
  i := 0;
  foreach b in array array[
    '40000000-0000-4000-8000-000000000006', '40000000-0000-4000-8000-000000000007', '40000000-0000-4000-8000-000000000008',
    '40000000-0000-4000-8000-000000000009', '40000000-0000-4000-8000-000000000010', '40000000-0000-4000-8000-000000000011',
    '40000000-0000-4000-8000-000000000012', '40000000-0000-4000-8000-000000000013']::uuid[]
  loop
    i := i + 1;
    insert into public.payments (booking_id, customer_id, method, gateway, gateway_ref, amount_sen, status, paid_at)
    select bk.id, bk.customer_id, (array['fpx','card','ewallet'])[1 + i % 3]::public.payment_method,
           'test-gateway', 'TESTPAY-' || lpad(i::text, 4, '0'), bk.total_sen, 'held', now()
      from public.bookings bk where bk.id = b;
    perform public.transition_booking(b, 'paid');
  end loop;

  ---------------------------------------------------------------- scheduling (07..13)
  perform public.transition_booking('40000000-0000-4000-8000-000000000007', 'scheduled', now() + interval '1 day 2 hours', now() + interval '1 day 4 hours', u_t2);
  foreach b in array array[
    '40000000-0000-4000-8000-000000000008', '40000000-0000-4000-8000-000000000009', '40000000-0000-4000-8000-000000000010',
    '40000000-0000-4000-8000-000000000011', '40000000-0000-4000-8000-000000000012', '40000000-0000-4000-8000-000000000013']::uuid[]
  loop
    perform public.transition_booking(b, 'scheduled', now() - interval '2 days', now() - interval '2 days' + interval '2 hours',
      case (select company_id from public.bookings where id = b)
        when c1 then u_t1 when c3 then u_t2 else u_o2 end);
    perform public.transition_booking(b, 'in_progress');
  end loop;
  -- 08 stays in_progress with a draft report. 09..13 get final reports below.

  ---------------------------------------------------------------- job reports
  insert into public.job_reports (booking_id, unit_id, author_id, work_done, findings)
  values ('40000000-0000-4000-8000-000000000008', '30000000-0000-4000-8000-000000000003', u_t1,
          'Cleaned filters and indoor coil. Checking drain.', 'Dirty filters, light algae in drain pan');

  insert into public.job_reports (id, booking_id, unit_id, author_id, work_done, findings, refrigerant_type, gas_added_grams,
                                  readings, recommended_next_service_on, customer_signoff_name, customer_signoff_at)
  select v.id::uuid, v.booking::uuid, v.unit::uuid, v.author::uuid, v.work, v.findings, v.gas_type, v.gas_g, v.readings::jsonb,
         (current_date + v.next_days), v.signoff, now()
    from (values
      ('60000000-0000-4000-8000-000000000009', '40000000-0000-4000-8000-000000000009', '30000000-0000-4000-8000-000000000005', u_t2,
       'Chemical wash of indoor and outdoor units.', 'Heavy dust build-up; fan blade cleaned', 'R32', 0,
       '{"supply_temp_c":13,"return_temp_c":26,"amps":4.1}', 120, 'Daniel'),
      ('60000000-0000-4000-8000-000000000010', '40000000-0000-4000-8000-000000000010', '30000000-0000-4000-8000-000000000001', u_t1,
       'General service: filters, coil, drain flush, gas pressure check.', 'All normal', 'R32', 0,
       '{"supply_temp_c":12,"return_temp_c":25,"amps":5.2}', 90, 'Aisyah'),
      ('60000000-0000-4000-8000-000000000011', '40000000-0000-4000-8000-000000000011', '30000000-0000-4000-8000-000000000004', u_o2,
       'General service and gas top-up.', 'Low gas, small flare leak suspected', 'R32', 150,
       '{"supply_temp_c":14,"return_temp_c":27,"amps":4.8}', 90, 'Daniel'),
      ('60000000-0000-4000-8000-000000000012', '40000000-0000-4000-8000-000000000012', '30000000-0000-4000-8000-000000000006', u_t2,
       'Chemical wash.', 'Customer later reported water dripping', 'R32', 0,
       '{"supply_temp_c":15,"return_temp_c":26,"amps":4.5}', 120, 'Sarah'),
      ('60000000-0000-4000-8000-000000000013', '40000000-0000-4000-8000-000000000013', '30000000-0000-4000-8000-000000000004', u_o2,
       'General service.', 'Unit still warm after service', 'R32', 0,
       '{"supply_temp_c":19,"return_temp_c":27,"amps":3.0}', 30, 'Daniel')
    ) v(id, booking, unit, author, work, findings, gas_type, gas_g, readings, next_days, signoff);

  insert into public.job_report_parts (job_report_id, description, quantity, unit_price_sen) values
    ('60000000-0000-4000-8000-000000000011', 'R32 refrigerant top-up (per 100g)', 2, 3000),
    ('60000000-0000-4000-8000-000000000009', 'Fan blade clip', 2, 500);

  insert into public.job_report_photos (job_report_id, storage_path, kind, caption)
  select r.id, r.company_id || '/' || r.booking_id || '/' || v.kind || '.jpg', v.kind::public.photo_kind, v.caption
    from public.job_reports r
    cross join (values ('before', 'Before service'), ('after', 'After service')) v(kind, caption)
   where r.id in ('60000000-0000-4000-8000-000000000009', '60000000-0000-4000-8000-000000000010');

  -- Finalise 09..13: creates the unit history and service reminders.
  update public.job_reports set status = 'final' where id in (
    '60000000-0000-4000-8000-000000000009', '60000000-0000-4000-8000-000000000010', '60000000-0000-4000-8000-000000000011',
    '60000000-0000-4000-8000-000000000012', '60000000-0000-4000-8000-000000000013');

  foreach b in array array[
    '40000000-0000-4000-8000-000000000009', '40000000-0000-4000-8000-000000000010', '40000000-0000-4000-8000-000000000011',
    '40000000-0000-4000-8000-000000000012', '40000000-0000-4000-8000-000000000013']::uuid[]
  loop
    perform public.transition_booking(b, 'completed');
  end loop;
  -- 09 stays completed (customer can confirm or dispute).

  ---------------------------------------------------------------- closed bookings, payouts, reviews
  perform set_config('request.jwt.claims', json_build_object('sub', u_c1, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', u_c1::text, true);
  perform public.transition_booking('40000000-0000-4000-8000-000000000010', 'closed');
  perform set_config('request.jwt.claims', json_build_object('sub', u_c2, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', u_c2::text, true);
  perform public.transition_booking('40000000-0000-4000-8000-000000000011', 'closed');
  perform set_config('request.jwt.claims', '', true);
  perform set_config('request.jwt.claim.sub', '', true);

  perform public.queue_payout('40000000-0000-4000-8000-000000000010', 300);
  perform public.queue_payout('40000000-0000-4000-8000-000000000011', 250);
  update public.payouts set status = 'paid', paid_at = now() - interval '2 days', gateway_ref = 'TESTPAYOUT-0001'
   where booking_id = '40000000-0000-4000-8000-000000000011';

  insert into public.reviews (booking_id, customer_id, rating, comment) values
    ('40000000-0000-4000-8000-000000000010', u_c1, 5, 'On time, tidy, and explained everything. Will book again.'),
    ('40000000-0000-4000-8000-000000000011', u_c2, 3, 'Service was fine but the arrival was 30 minutes late.');
  update public.reviews set company_reply = 'Thank you Aisyah, see you at the next service!'
   where booking_id = '40000000-0000-4000-8000-000000000010';

  ---------------------------------------------------------------- disputes
  perform set_config('request.jwt.claims', json_build_object('sub', u_c3, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', u_c3::text, true);
  d := public.raise_dispute('40000000-0000-4000-8000-000000000012', 'Water drips from the indoor unit since the wash.');
  perform set_config('request.jwt.claims', json_build_object('sub', u_c2, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', u_c2::text, true);
  perform public.raise_dispute('40000000-0000-4000-8000-000000000013', 'Aircond still not cold after the service.');
  perform set_config('request.jwt.claims', '', true);
  perform set_config('request.jwt.claim.sub', '', true);

  insert into public.dispute_messages (dispute_id, author_id, body)
  select di.id, v.author, v.body
    from public.disputes di
    join (values
      ('40000000-0000-4000-8000-000000000012'::uuid, u_c3, 'The drip started the same evening. Photos attached.'),
      ('40000000-0000-4000-8000-000000000012'::uuid, u_o3, 'We can revisit tomorrow to check the drain slope.'),
      ('40000000-0000-4000-8000-000000000013'::uuid, u_c2, 'Supply air is only 19 degrees. Not cold.'),
      ('40000000-0000-4000-8000-000000000013'::uuid, u_o2, 'We suspect low gas. Happy to recheck, but the unit may be undersized.')
    ) v(booking, author, body) on v.booking = di.booking_id;

  update public.disputes set status = 'under_review' where booking_id = '40000000-0000-4000-8000-000000000012';

  -- Admin refunds 13 in full.
  perform set_config('request.jwt.claims', json_build_object('sub', u_ad, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', u_ad::text, true);
  select id into q from public.disputes where booking_id = '40000000-0000-4000-8000-000000000013';
  perform public.decide_dispute(q, 'refund', 0, 'Unit still not cooling; full refund approved.');
  perform set_config('request.jwt.claims', '', true);
  perform set_config('request.jwt.claim.sub', '', true);
  update public.payments set refunded_sen = amount_sen, status = 'refunded'
   where booking_id = '40000000-0000-4000-8000-000000000013';

  ---------------------------------------------------------------- declined, cancelled
  perform public.transition_booking('40000000-0000-4000-8000-000000000014', 'declined', null, null, null, 'Fully booked that day');
  perform set_config('request.jwt.claims', json_build_object('sub', u_c2, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', u_c2::text, true);
  perform public.transition_booking('40000000-0000-4000-8000-000000000015', 'cancelled', null, null, null, 'Changed plans');
  perform set_config('request.jwt.claims', '', true);
  perform set_config('request.jwt.claim.sub', '', true);

  ---------------------------------------------------------------- chat history
  insert into public.booking_messages (booking_id, sender_id, body) values
    ('40000000-0000-4000-8000-000000000003', u_o1, 'Hi Aisyah, we sent a quote for the drain and coil. Let us know if you have questions.'),
    ('40000000-0000-4000-8000-000000000007', u_o3, 'Hi Sarah, Kumar will arrive between 2pm and 4pm tomorrow.'),
    ('40000000-0000-4000-8000-000000000007', u_c3, 'Great, thank you. Please call the guard house first.'),
    ('40000000-0000-4000-8000-000000000008', u_t1, 'On site now, starting with the filters.');

  ---------------------------------------------------------------- company documents
  insert into public.company_documents (company_id, doc_type, storage_path, status, expires_on, reviewed_by, reviewed_at, review_note)
  select cc.id, v.doc::public.document_type, cc.id || '/' || v.doc || '.pdf', v.status::public.review_state,
         v.expires, case when v.status = 'pending' then null else u_ad end,
         case when v.status = 'pending' then null else now() end, v.note
    from (values
      ('TEST-0001', 'ssm_registration', 'approved', null::date, null),
      ('TEST-0001', 'business_licence', 'approved', current_date + 300, null),
      ('TEST-0001', 'insurance',        'approved', current_date + 200, null),
      ('TEST-0002', 'ssm_registration', 'approved', null::date, null),
      ('TEST-0002', 'insurance',        'pending',  current_date + 365, null),
      ('TEST-0003', 'ssm_registration', 'approved', null::date, null),
      ('TEST-0003', 'business_licence', 'rejected', current_date - 10, 'Licence expired. Please upload the renewed copy.')
    ) v(ssm, doc, status, expires, note)
    join public.companies cc on cc.ssm_number = v.ssm;

  ---------------------------------------------------------------- subscriptions and invoices
  insert into public.company_subscriptions (company_id, plan_code, status, started_at, current_period_end, gateway_ref)
  values (c1, 'pro',     'active', now() - interval '40 days', now() + interval '20 days', 'TESTSUB-0001'),
         (c2, 'starter', 'active', now() - interval '10 days', now() + interval '20 days', 'TESTSUB-0002'),
         (c3, 'starter', 'past_due', now() - interval '45 days', now() - interval '15 days', 'TESTSUB-0003');

  insert into public.subscription_invoices (company_id, subscription_id, period_start, period_end, amount_sen, status, paid_at, gateway_ref)
  select s.company_id, s.id, current_date - v.start_off, current_date - v.end_off,
         coalesce((select monthly_fee_sen from public.subscription_plans pl where pl.code = s.plan_code), 0),
         v.status::public.invoice_status, case when v.status = 'paid' then now() - interval '30 days' end, 'TESTINV-' || v.n
    from public.company_subscriptions s
    join (values
      ('TEST-0001', 40, 10, 'paid', '0001'),
      ('TEST-0001', 10, -20, 'open', '0002'),
      ('TEST-0003', 45, 15, 'failed', '0003')
    ) v(ssm, start_off, end_off, status, n) on s.company_id = (select id from public.companies where ssm_number = v.ssm);

  ---------------------------------------------------------------- notifications and audit
  insert into public.notifications (user_id, channel, template, payload) values
    (u_c1, 'email',    'quote_received',   '{"booking_no":"see app","note":"Quote ready to review"}'),
    (u_o1, 'whatsapp', 'new_booking',      '{"note":"New booking request"}'),
    (u_c2, 'push',     'dispute_decided',  '{"note":"Your refund was approved"}'),
    (u_c3, 'email',    'service_reminder', '{"note":"Your aircond is due for service"}');

  insert into public.audit_log (actor_id, action, entity_type, entity_id, company_id, meta) values
    (u_ad, 'company_verified', 'company', c1, c1, '{"note":"seed"}'),
    (u_ad, 'company_verified', 'company', c2, c2, '{"note":"seed"}'),
    (u_ad, 'document_rejected', 'company', c3, c3, '{"doc":"business_licence"}');
end
$seed$;
