-- TEST DATA ONLY. Ready-made accounts for walking through the app. Safe to run more than once.
-- Password for every account below: AircondTest#2026
--
--   test.customer1@example.test   customer  Aisyah   (Petaling + Kuala Lumpur, 3 units, a booking with chat)
--   test.customer2@example.test   customer  Daniel   (Klang + Gombak, 2 units, a repair booking)
--   test.owner1@example.test      owner of [TEST] Cool Breeze Aircond
--   test.owner2@example.test      owner of [TEST] Klang Air Specialists
--   test.owner3@example.test      owner of [TEST] Valley Cool Services
--   test.tech1@example.test       technician at [TEST] Cool Breeze Aircond
--   test.admin@example.test       platform admin
--
-- Before the pilot, remove every account whose email ends in @example.test, and the TEST- companies.

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change, email_change_token_new, email_change_token_current,
  phone_change, phone_change_token, reauthentication_token
)
select '00000000-0000-0000-0000-000000000000', v.id::uuid, 'authenticated', 'authenticated', v.email,
       crypt('AircondTest#2026', gen_salt('bf')), now(),
       '{"provider":"email","providers":["email"]}'::jsonb, jsonb_build_object('full_name', v.name), now(), now(),
       '', '', '', '', '', '', '', ''
  from (values
    ('10000000-0000-4000-8000-000000000001', 'test.customer1@example.test', 'Aisyah (test customer)'),
    ('10000000-0000-4000-8000-000000000002', 'test.customer2@example.test', 'Daniel (test customer)'),
    ('10000000-0000-4000-8000-000000000011', 'test.owner1@example.test',    'Hafiz (test owner, Cool Breeze)'),
    ('10000000-0000-4000-8000-000000000012', 'test.owner2@example.test',    'Mei Ling (test owner, Klang Air)'),
    ('10000000-0000-4000-8000-000000000013', 'test.owner3@example.test',    'Ravi (test owner, Valley Cool)'),
    ('10000000-0000-4000-8000-000000000021', 'test.tech1@example.test',     'Zul (test technician)'),
    ('10000000-0000-4000-8000-000000000099', 'test.admin@example.test',     'Admin (test)')
  ) v(id, email, name)
 where not exists (select 1 from auth.users u where u.email = v.email);

insert into auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), u.id, u.id::text, 'email',
       jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true), now(), now(), now()
  from auth.users u
 where u.email like '%@example.test'
   and not exists (select 1 from auth.identities i where i.user_id = u.id);

-- Profiles are created by the sign-up trigger. Add phones and a default language.
insert into public.profiles (id, full_name, email)
select u.id, u.raw_user_meta_data->>'full_name', u.email from auth.users u
 where u.email like '%@example.test'
on conflict (id) do nothing;

-- Contractor teams and the platform admin.
insert into public.company_members (company_id, user_id, role)
select c.id, u.id, v.role::public.company_role
  from (values
    ('TEST-0001', 'test.owner1@example.test', 'owner'),
    ('TEST-0001', 'test.tech1@example.test',  'technician'),
    ('TEST-0002', 'test.owner2@example.test', 'owner'),
    ('TEST-0003', 'test.owner3@example.test', 'owner')
  ) v(ssm, email, role)
  join public.companies c on c.ssm_number = v.ssm
  join auth.users u on u.email = v.email
on conflict do nothing;

insert into public.platform_admins (user_id)
select id from auth.users where email = 'test.admin@example.test'
on conflict do nothing;

-- Customer addresses (service areas: Petaling, Kuala Lumpur, Klang, Gombak).
insert into public.addresses (id, customer_id, label, line1, line2, postcode, service_area_id, is_default, access_notes)
select v.id::uuid, u.id, v.label, v.line1, v.line2, v.postcode, a.id, v.is_default, v.notes
  from (values
    ('20000000-0000-4000-8000-000000000001', 'test.customer1@example.test', 'Home',   'No. 12, Jalan SS 2/5',      'SS 2, Petaling Jaya', '47300', 'Petaling',     true,  'Guard house at the gate'),
    ('20000000-0000-4000-8000-000000000002', 'test.customer1@example.test', 'Shop',   'Lot 8, Jalan Ipoh',         'Sentul',              '51100', 'Kuala Lumpur', false, 'Ring the bell twice'),
    ('20000000-0000-4000-8000-000000000003', 'test.customer2@example.test', 'Home',   'No. 5, Jalan Kapar',        'Taman Eng Ann, Klang','41150', 'Klang',        true,  null),
    ('20000000-0000-4000-8000-000000000004', 'test.customer2@example.test', 'Parents','No. 22, Jalan Gombak Jaya', 'Gombak',              '53000', 'Gombak',       false, null)
  ) v(id, email, label, line1, line2, postcode, district, is_default, notes)
  join auth.users u on u.email = v.email
  join public.service_areas a on a.district = v.district
on conflict (id) do nothing;

-- Units.
insert into public.units (id, customer_id, address_id, nickname, brand, model, unit_type, horsepower, refrigerant)
select v.id::uuid, a.customer_id, a.id, v.nickname, v.brand, v.model, v.utype::public.unit_type, v.hp, v.refrigerant
  from (values
    ('30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'Living room',    'Daikin',    'FTV35P',  'wall_split', 1.5, 'R32'),
    ('30000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000001', 'Master bedroom', 'Panasonic', 'CS-PU12', 'wall_split', 1.0, 'R32'),
    ('30000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000002', 'Shop floor',     'York',      'YCCE30',  'cassette',   3.0, 'R410A'),
    ('30000000-0000-4000-8000-000000000004', '20000000-0000-4000-8000-000000000003', 'Hall',           'Mitsubishi','MSY-GR13','wall_split', 1.5, 'R32'),
    ('30000000-0000-4000-8000-000000000005', '20000000-0000-4000-8000-000000000004', 'Mum''s room',    'Sharp',     'AH-X10',  'wall_split', 1.0, 'R32')
  ) v(id, address_id, nickname, brand, model, utype, hp, refrigerant)
  join public.addresses a on a.id = v.address_id::uuid
on conflict (id) do nothing;

-- Two bookings, each with a chat message from the contractor owner, so the chat has history.
insert into public.bookings (id, customer_id, company_id, address_id, fault_description, customer_notes)
select v.id::uuid, a.customer_id, c.id, a.id, v.fault, v.notes
  from (values
    ('40000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'TEST-0001', null, 'Please call before arriving'),
    ('40000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000003', 'TEST-0002', 'Not cold and dripping water', null)
  ) v(id, address_id, ssm, fault, notes)
  join public.addresses a on a.id = v.address_id::uuid
  join public.companies c on c.ssm_number = v.ssm
on conflict (id) do nothing;

insert into public.booking_items (booking_id, unit_id, service_type_code)
values
  ('40000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', 'general_service'),
  ('40000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000002', 'general_service'),
  ('40000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000004', 'repair')
on conflict do nothing;

insert into public.booking_messages (booking_id, sender_id, body)
select v.booking::uuid, u.id, v.body
  from (values
    ('40000000-0000-4000-8000-000000000001', 'test.owner1@example.test', 'Hi Aisyah, thanks for the request. We can come Thursday at 2pm for both units. Does that work?'),
    ('40000000-0000-4000-8000-000000000002', 'test.owner2@example.test', 'Hi Daniel, we will need to check the unit first. Is the water leaking from the indoor unit?')
  ) v(booking, email, body)
  join auth.users u on u.email = v.email
 where not exists (select 1 from public.booking_messages m where m.booking_id = v.booking::uuid);
