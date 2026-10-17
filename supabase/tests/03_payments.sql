-- Payment flow test. Runs against a database that already has the seed data, changes nothing
-- (it ends by raising an error that carries the results). Expected result text:
--   retry: first=failed | other_customer=blocked | fail_event=failed | mismatch=amount_mismatch | paid=held
--   | duplicate=duplicate | booking=paid | unbalanced=0 | after_cancel=refunded refunded=21000 unbalanced=0
--   | late=late_payment_refunded unbalanced=0 | partial=partially_refunded refunded=1000 unbalanced=0
do $t$
declare
  cu1 constant text := '10000000-0000-4000-8000-000000000001';
  cu2 constant text := '10000000-0000-4000-8000-000000000002';
  ad  constant text := '10000000-0000-4000-8000-000000000099';
  b4 constant uuid := '40000000-0000-4000-8000-000000000004';
  b5 constant uuid := '40000000-0000-4000-8000-000000000005';
  p1 uuid; p2 uuid; p3 uuid; r text; res text := ''; st text; bad int;
begin
  perform set_config('request.jwt.claims', json_build_object('sub', cu1, 'role','authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', cu1, true);
  set local role authenticated;
  p1 := public.start_payment(b4, 'fpx', 'sandbox');
  p2 := public.start_payment(b4, 'card', 'sandbox');
  select status::text into st from public.payments where id = p1; res := res || 'retry: first=' || st;
  begin perform public.start_payment(b5, 'fpx', 'sandbox'); res := res || ' | other_customer=ALLOWED(BAD)'; exception when others then res := res || ' | other_customer=blocked'; end;
  reset role;
  perform set_config('request.jwt.claims', '', true); perform set_config('request.jwt.claim.sub', '', true);
  r := public.apply_payment_event('sandbox','e1', p2::text, 'failed', null); res := res || ' | fail_event=' || r;
  perform set_config('request.jwt.claims', json_build_object('sub', cu1, 'role','authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', cu1, true);
  set local role authenticated;
  p3 := public.start_payment(b4, 'ewallet', 'sandbox');
  reset role;
  perform set_config('request.jwt.claims', '', true); perform set_config('request.jwt.claim.sub', '', true);
  r := public.apply_payment_event('sandbox','e2', p3::text, 'paid', 1); res := res || ' | mismatch=' || r;
  r := public.apply_payment_event('sandbox','e3', p3::text, 'paid', (select amount_sen from public.payments where id=p3)); res := res || ' | paid=' || r;
  r := public.apply_payment_event('sandbox','e3', p3::text, 'paid', (select amount_sen from public.payments where id=p3)); res := res || ' | duplicate=' || r;
  select status::text into st from public.bookings where id=b4; res := res || ' | booking=' || st;
  select count(*) into bad from public.payment_reconciliation where not balanced; res := res || ' | unbalanced=' || bad;
  perform public.transition_booking(b4, 'cancelled', null, null, null, 'test');
  select status::text || ' refunded=' || refunded_sen into st from public.payments where id=p3; res := res || ' | after_cancel=' || st;
  select count(*) into bad from public.payment_reconciliation where not balanced; res := res || ' unbalanced=' || bad;
  perform set_config('request.jwt.claims', json_build_object('sub', cu2, 'role','authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', cu2, true);
  set local role authenticated;
  p1 := public.start_payment(b5, 'fpx', 'sandbox');
  reset role;
  perform set_config('request.jwt.claims', '', true); perform set_config('request.jwt.claim.sub', '', true);
  update public.bookings set status='cancelled' where id=b5;
  r := public.apply_payment_event('sandbox','e4', p1::text, 'paid', (select amount_sen from public.payments where id=p1)); res := res || ' | late=' || r;
  select count(*) into bad from public.payment_reconciliation where not balanced; res := res || ' unbalanced=' || bad;
  perform set_config('request.jwt.claims', json_build_object('sub', ad, 'role','authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', ad, true);
  set local role authenticated;
  perform public.decide_dispute((select id from public.disputes where booking_id='40000000-0000-4000-8000-000000000012'), 'partial', 1000, 'partial test');
  reset role;
  select status::text || ' refunded=' || refunded_sen into st from public.payments where booking_id='40000000-0000-4000-8000-000000000012'; res := res || ' | partial=' || st;
  select count(*) into bad from public.payment_reconciliation where not balanced; res := res || ' unbalanced=' || bad;
  raise exception 'RESULT: %', res;
end $t$;
