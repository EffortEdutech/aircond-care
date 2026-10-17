-- 0017_payments_flow.sql
-- Sprint 4: paying for a booking, gateway events, automatic refunds, reconciliation.
-- The gateway is not chosen yet. These functions do not depend on any one gateway: the app
-- passes in a normalised event (paid or failed) after it has checked the gateway's signature.

-- Every event the gateway sends is stored once. The unique key is how duplicates are ignored.
create table public.webhook_events (
  id          uuid primary key default gen_random_uuid(),
  gateway     text not null,
  event_id    text not null,
  payment_id  uuid references public.payments (id),
  outcome     text not null,
  result      text,
  payload     jsonb,
  received_at timestamptz not null default now(),
  unique (gateway, event_id)
);
alter table public.webhook_events enable row level security;
-- No policies and no grants: only the backend (service role) and the functions below touch it.

-- Customer starts (or restarts) a payment for a booking that is waiting for payment.
create function public.start_payment(p_booking uuid, p_method public.payment_method, p_gateway text)
returns uuid
language plpgsql security definer set search_path = public as $$
declare b public.bookings; v_amount bigint; v_id uuid;
begin
  select * into b from public.bookings where id = p_booking for update;
  if not found then raise exception 'booking not found'; end if;
  if b.customer_id is distinct from auth.uid() then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if b.status <> 'awaiting_payment' then
    raise exception 'this booking is not waiting for payment';
  end if;
  v_amount := b.subtotal_sen + b.call_out_fee_sen;
  if v_amount <= 0 then raise exception 'nothing to pay on this booking'; end if;

  -- An earlier attempt that never finished is replaced, so the customer can always retry.
  update public.payments set status = 'failed' where booking_id = b.id and status = 'pending';

  v_id := gen_random_uuid();
  insert into public.payments (id, booking_id, customer_id, method, gateway, gateway_ref, amount_sen, status)
  values (v_id, b.id, b.customer_id, p_method, p_gateway, v_id::text, v_amount, 'pending');
  return v_id;
end $$;

-- Backend only. Applies one verified gateway event. Safe to call twice with the same event.
-- p_outcome is 'paid' or 'failed'. p_reference is the payment id we gave the gateway.
create function public.apply_payment_event(
  p_gateway text, p_event_id text, p_reference text, p_outcome text, p_amount_sen bigint, p_payload jsonb default null
) returns text
language plpgsql security definer set search_path = public as $$
declare
  v_event uuid; p public.payments; b public.bookings; v_result text;
begin
  if auth.uid() is not null then raise exception 'backend only' using errcode = '42501'; end if;
  if p_outcome not in ('paid', 'failed') then raise exception 'unknown outcome %', p_outcome; end if;

  insert into public.webhook_events (gateway, event_id, outcome, payload)
  values (p_gateway, p_event_id, p_outcome, p_payload)
  on conflict (gateway, event_id) do nothing
  returning id into v_event;
  if v_event is null then return 'duplicate'; end if;

  select * into p from public.payments
   where gateway = p_gateway and gateway_ref = p_reference for update;
  if not found then
    update public.webhook_events set result = 'unknown_payment' where id = v_event;
    return 'unknown_payment';
  end if;
  update public.webhook_events set payment_id = p.id where id = v_event;

  if p_outcome = 'failed' then
    if p.status = 'pending' then update public.payments set status = 'failed' where id = p.id; v_result := 'failed';
    else v_result := 'ignored_' || p.status;
    end if;
    update public.webhook_events set result = v_result where id = v_event;
    return v_result;
  end if;

  -- outcome = paid
  if p.status in ('held', 'released', 'refunded', 'partially_refunded') then
    v_result := 'already_' || p.status;
  elsif p_amount_sen is distinct from p.amount_sen then
    v_result := 'amount_mismatch';
    insert into public.audit_log (action, entity_type, entity_id, meta)
    values ('payment_amount_mismatch', 'payment', p.id,
            jsonb_build_object('expected_sen', p.amount_sen, 'received_sen', p_amount_sen, 'event_id', p_event_id));
  else
    update public.payments set status = 'held', paid_at = now() where id = p.id;   -- ledger entry written by trigger
    select * into b from public.bookings where id = p.booking_id for update;
    if b.status = 'awaiting_payment' and exists (
         select 1 from public.payments where booking_id = b.id and status = 'held' and id <> p.id) then
      -- A second payment arrived for a booking that is already covered: return it.
      update public.payments set refunded_sen = amount_sen, status = 'refunded' where id = p.id;
      insert into public.audit_log (action, entity_type, entity_id, company_id, meta)
      values ('duplicate_payment_refunded', 'payment', p.id, b.company_id, jsonb_build_object('booking_id', b.id));
      v_result := 'duplicate_payment_refunded';
    elsif b.status = 'awaiting_payment' then
      update public.bookings set status = 'paid' where id = b.id;
      v_result := 'held';
    else
      -- Late payment: the booking was cancelled or changed while the customer was paying.
      update public.payments set refunded_sen = amount_sen, status = 'refunded' where id = p.id;
      insert into public.audit_log (action, entity_type, entity_id, company_id, meta)
      values ('late_payment_refunded', 'payment', p.id, b.company_id,
              jsonb_build_object('booking_id', b.id, 'booking_status', b.status));
      v_result := 'late_payment_refunded';
    end if;
  end if;
  update public.webhook_events set result = v_result where id = v_event;
  return v_result;
end $$;

-- Refunds are recorded here. Sending the money back through the gateway is a separate step
-- once a real gateway is connected; the audit row marks every refund that still needs it.
create function public.refund_on_booking_end() returns trigger
language plpgsql security definer set search_path = public as $$
declare r record;
begin
  if new.status in ('cancelled', 'refunded') and old.status in ('paid', 'scheduled', 'disputed') then
    for r in select id, amount_sen from public.payments where booking_id = new.id and status = 'held' loop
      update public.payments set refunded_sen = amount_sen, status = 'refunded' where id = r.id;
      insert into public.audit_log (action, entity_type, entity_id, company_id, meta)
      values ('refund_recorded', 'payment', r.id, new.company_id,
              jsonb_build_object('booking_id', new.id, 'amount_sen', r.amount_sen, 'gateway_refund_pending', true));
    end loop;
  end if;
  return null;
end $$;
create trigger refund_on_booking_end after update of status on public.bookings
  for each row when (old.status is distinct from new.status) execute function public.refund_on_booking_end();

create function public.refund_on_dispute_decision() returns trigger
language plpgsql security definer set search_path = public as $$
declare r record; v_total bigint;
begin
  if new.status in ('resolved_refund', 'resolved_partial') and old.status in ('open', 'under_review') and new.refund_sen > 0 then
    select * into r from public.payments where booking_id = new.booking_id and status = 'held' order by created_at limit 1;
    if found then
      update public.payments
         set refunded_sen = least(amount_sen, new.refund_sen),
             status = case when new.refund_sen >= amount_sen then 'refunded' else 'partially_refunded' end::public.payment_status
       where id = r.id;
      insert into public.audit_log (action, entity_type, entity_id, meta)
      values ('refund_recorded', 'payment', r.id,
              jsonb_build_object('dispute_id', new.id, 'amount_sen', least(r.amount_sen, new.refund_sen), 'gateway_refund_pending', true));
    end if;
  end if;
  return null;
end $$;
create trigger refund_on_dispute_decision after update of status on public.disputes
  for each row execute function public.refund_on_dispute_decision();

-- Reconciliation: for every payment that was ever paid, the ledger must show the money in and any money back.
create view public.payment_reconciliation with (security_invoker = true) as
select p.id as payment_id, p.booking_id, p.status, p.amount_sen, p.refunded_sen, p.gateway, p.gateway_ref, p.paid_at,
       coalesce(sum(l.amount_sen) filter (where l.entry_type = 'payment_received'), 0) as ledger_received_sen,
       coalesce(-sum(l.amount_sen) filter (where l.entry_type = 'refund'), 0) as ledger_refunded_sen,
       (coalesce(sum(l.amount_sen) filter (where l.entry_type = 'payment_received'), 0) = p.amount_sen
        and coalesce(-sum(l.amount_sen) filter (where l.entry_type = 'refund'), 0) = p.refunded_sen) as balanced
  from public.payments p
  left join public.ledger_entries l on l.payment_id = p.id
 where p.paid_at is not null
 group by p.id;
grant select on public.payment_reconciliation to authenticated;

revoke execute on function public.start_payment(uuid, public.payment_method, text) from public, anon;
grant execute on function public.start_payment(uuid, public.payment_method, text) to authenticated;
revoke execute on function public.apply_payment_event(text, text, text, text, bigint, jsonb) from public, anon, authenticated;
grant execute on function public.apply_payment_event(text, text, text, text, bigint, jsonb) to service_role;
