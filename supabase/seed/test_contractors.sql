-- TEST DATA ONLY. Three fake contractors so the customer screens have something to show.
-- Every name starts with "[TEST]" and every SSM number with "TEST-".
-- Before the pilot, remove them by SSM number prefix 'TEST-' (company services, areas and
-- ratings are removed with the company).

insert into public.companies (slug, name, legal_name, ssm_number, description, phone, email, status, verified_at, rating_avg, rating_count) values
  ('test-cool-breeze', '[TEST] Cool Breeze Aircond', 'Cool Breeze Aircond Sdn Bhd (test)', 'TEST-0001',
   'Test contractor. Fast general servicing and chemical wash across KL and Petaling.', '+60100000001', 'test1@example.invalid', 'verified', now(), 4.60, 38),
  ('test-klang-air', '[TEST] Klang Air Specialists', 'Klang Air Specialists Sdn Bhd (test)', 'TEST-0002',
   'Test contractor. Repairs, gas top-up and installation in Klang and Petaling.', '+60100000002', 'test2@example.invalid', 'verified', now(), 4.20, 12),
  ('test-valley-cool', '[TEST] Valley Cool Services', 'Valley Cool Services Sdn Bhd (test)', 'TEST-0003',
   'Test contractor. Chemical overhaul and servicing in Gombak, Hulu Langat and KL.', '+60100000003', 'test3@example.invalid', 'verified', now(), 0, 0)
on conflict (ssm_number) do nothing;

-- Service areas and call-out fees (RM 30 = 3000 sen).
insert into public.company_service_areas (company_id, service_area_id, call_out_fee_sen)
select c.id, a.id, v.fee
  from (values
    ('TEST-0001', 'Kuala Lumpur', 2000), ('TEST-0001', 'Petaling', 3000),
    ('TEST-0002', 'Klang', 2500), ('TEST-0002', 'Petaling', 4000),
    ('TEST-0003', 'Gombak', 3000), ('TEST-0003', 'Hulu Langat', 3500), ('TEST-0003', 'Kuala Lumpur', 3000)
  ) v(ssm, district, fee)
  join public.companies c on c.ssm_number = v.ssm
  join public.service_areas a on a.district = v.district
on conflict do nothing;

-- Price list. null price = quote only. unit_type null = any unit type.
insert into public.company_services (company_id, service_type_code, unit_type, price_sen, duration_minutes)
select c.id, v.code, v.utype::public.unit_type, v.price, v.mins
  from (values
    ('TEST-0001', 'general_service',   'wall_split', 8000,  60),
    ('TEST-0001', 'general_service',   'cassette',   15000, 90),
    ('TEST-0001', 'chemical_wash',     'wall_split', 18000, 120),
    ('TEST-0001', 'repair',            null,         null::bigint, null::int),
    ('TEST-0002', 'general_service',   null,         9000,  60),
    ('TEST-0002', 'gas_topup',         null,         null,  null),
    ('TEST-0002', 'repair',            null,         null,  null),
    ('TEST-0002', 'installation',      null,         null,  null),
    ('TEST-0003', 'general_service',   'wall_split', 7000,  60),
    ('TEST-0003', 'chemical_wash',     'wall_split', 16000, 120),
    ('TEST-0003', 'chemical_overhaul', 'wall_split', 28000, 180)
  ) v(ssm, code, utype, price, mins)
  join public.companies c on c.ssm_number = v.ssm
on conflict do nothing;
