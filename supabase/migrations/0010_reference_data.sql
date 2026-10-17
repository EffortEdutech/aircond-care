-- 0010_reference_data.sql
-- Reference data the app needs in every environment.
-- Fees, rates and intervals are proposed starting points from the product spec. Change them
-- here or with an update migration once they are validated with contractors.

insert into public.service_types (code, name, description, requires_quote, default_interval_months, sort_order) values
  ('general_service',   'General service',   'Routine cleaning and inspection',                false, 6,    10),
  ('chemical_wash',     'Chemical wash',     'Full chemical wash of indoor and outdoor unit',  false, 12,   20),
  ('chemical_overhaul', 'Chemical overhaul', 'Dismantle and deep-clean overhaul',               false, 12,   30),
  ('gas_topup',         'Gas top-up',        'Refrigerant top-up after leak check',            true,  null, 40),
  ('repair',            'Repair',            'Fault diagnosis and repair',                     true,  null, 50),
  ('installation',      'Installation',      'New unit installation',                          true,  null, 60);

-- Plans. Pro and Business launch in Phase 2, so they are not yet available to sign up for.
insert into public.subscription_plans (code, name, monthly_fee_sen, commission_bps, max_members, features, is_available, sort_order) values
  ('starter',  'Starter',  0,     1500, 1,    '["profile","inbox","basic_schedule"]'::jsonb,                                   true,  10),
  ('pro',      'Pro',      9900,  1000, null, '["team_accounts","quotes","invoices","customer_list","reminders"]'::jsonb,       false, 20),
  ('business', 'Business', 29900, 700,  null, '["multi_technician","reports_exports","priority_placement"]'::jsonb,            false, 30);

insert into public.platform_settings (key, value, description) values
  ('auto_confirm_hours',  '48'::jsonb, 'Hours after completion before a booking auto-confirms and the dispute window closes'),
  ('payout_weekday_iso',  '5'::jsonb,  'Weekday payouts are scheduled for (ISO: 1 = Monday ... 7 = Sunday)');

-- Sample service areas for a Klang Valley launch. The launch area is still an open question.
insert into public.service_areas (state, district) values
  ('Kuala Lumpur', 'Kuala Lumpur'),
  ('Putrajaya',    'Putrajaya'),
  ('Selangor',     'Petaling'),
  ('Selangor',     'Klang'),
  ('Selangor',     'Gombak'),
  ('Selangor',     'Hulu Langat'),
  ('Selangor',     'Sepang');
