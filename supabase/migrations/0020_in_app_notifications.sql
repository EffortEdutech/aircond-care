-- 0020_in_app_notifications.sql
-- In-app inbox: database triggers write a notification for the people affected by
-- each booking event. They are read by the bell in the app header.

alter table public.notifications add column if not exists read_at timestamptz;
create index if not exists notifications_unread_idx on public.notifications (user_id, created_at desc) where read_at is null;

create policy notifications_mark_read on public.notifications for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
grant update (read_at) on public.notifications to authenticated;

-- One notification for one user. Skips the person who caused the event.
create function public.notify_user(p_user uuid, p_template text, p_payload jsonb) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_user is null or p_user = auth.uid() then return; end if;
  insert into public.notifications (user_id, channel, template, payload, status, sent_at)
  values (p_user, 'in_app', p_template, p_payload, 'sent', now());
end $$;
revoke all on function public.notify_user(uuid, text, jsonb) from public, anon, authenticated;

-- Everyone who works a booking for the company: owners, dispatchers and the assigned technician.
create function public.notify_company(p_booking uuid, p_template text, p_payload jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare b public.bookings; r record;
begin
  select * into b from public.bookings where id = p_booking;
  if not found then return; end if;
  for m in
    select distinct cm.user_id from public.company_members cm
     where cm.company_id = b.company_id and cm.is_active
       and (cm.role in ('owner', 'dispatcher') or cm.user_id = b.assigned_to)
  loop
    perform public.notify_user(r.user_id, p_template, p_payload || jsonb_build_object('audience', 'company'));
  end loop;
end $$;
revoke all on function public.notify_company(uuid, text, jsonb) from public, anon, authenticated;

create function public.notify_customer(p_booking uuid, p_template text, p_payload jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare b public.bookings;
begin
  select * into b from public.bookings where id = p_booking;
  if not found then return; end if;
  perform public.notify_user(b.customer_id, p_template, p_payload || jsonb_build_object('audience', 'customer'));
end $$;
revoke all on function public.notify_customer(uuid, text, jsonb) from public, anon, authenticated;

create function public.trg_notify_booking() returns trigger
language plpgsql security definer set search_path = public as $$
declare p jsonb := jsonb_build_object('booking_id', new.id, 'booking_no', new.booking_no);
begin
  if tg_op = 'INSERT' then
    perform public.notify_company(new.id, 'new_booking', p);
    return null;
  end if;
  if new.status is not distinct from old.status then return null; end if;
  case new.status
    when 'quoted' then perform public.notify_customer(new.id, 'quote_received', p);
    when 'awaiting_payment' then
      if old.status = 'quoted' then perform public.notify_company(new.id, 'quote_accepted', p);
      else perform public.notify_customer(new.id, 'booking_accepted', p); end if;
    when 'paid' then perform public.notify_company(new.id, 'payment_received', p);
    when 'scheduled' then
      perform public.notify_customer(new.id, 'visit_scheduled', p);
      perform public.notify_company(new.id, 'job_assigned', p);
    when 'in_progress' then perform public.notify_customer(new.id, 'job_started', p);
    when 'completed' then perform public.notify_customer(new.id, 'job_completed', p);
    when 'closed' then perform public.notify_company(new.id, 'job_closed', p);
    when 'disputed' then
      perform public.notify_customer(new.id, 'dispute_raised', p);
      perform public.notify_company(new.id, 'dispute_raised', p);
    when 'cancelled' then
      perform public.notify_customer(new.id, 'booking_cancelled', p);
      perform public.notify_company(new.id, 'booking_cancelled', p);
    when 'declined' then perform public.notify_customer(new.id, 'booking_declined', p);
    when 'refunded' then perform public.notify_customer(new.id, 'booking_refunded', p);
    else null;
  end case;
  return null;
end $$;
create trigger notify_booking after insert or update of status on public.bookings
  for each row execute function public.trg_notify_booking();

create function public.trg_notify_message() returns trigger
language plpgsql security definer set search_path = public as $$
declare b public.bookings; p jsonb;
begin
  select * into b from public.bookings where id = new.booking_id;
  if not found then return null; end if;
  p := jsonb_build_object('booking_id', b.id, 'booking_no', b.booking_no);
  if new.sender_id = b.customer_id then
    perform public.notify_company(b.id, 'new_message', p);
  else
    perform public.notify_customer(b.id, 'new_message', p);
  end if;
  return null;
end $$;
create trigger notify_message after insert on public.booking_messages
  for each row execute function public.trg_notify_message();

create function public.trg_notify_dispute() returns trigger
language plpgsql security definer set search_path = public as $$
declare b public.bookings; p jsonb; v_tpl text;
begin
  if tg_table_name = 'dispute_messages' then
    select bk.* into b from public.bookings bk join public.disputes d on d.booking_id = bk.id where d.id = new.dispute_id;
    v_tpl := 'dispute_message';
  else
    if new.status = old.status or new.status in ('open', 'under_review') then return null; end if;
    select * into b from public.bookings where id = new.booking_id;
    v_tpl := 'dispute_decided';
  end if;
  if not found then return null; end if;
  p := jsonb_build_object('booking_id', b.id, 'booking_no', b.booking_no);
  perform public.notify_customer(b.id, v_tpl, p);
  perform public.notify_company(b.id, v_tpl, p);
  return null;
end $$;
create trigger notify_dispute_decided after update of status on public.disputes
  for each row execute function public.trg_notify_dispute();
create trigger notify_dispute_message after insert on public.dispute_messages
  for each row execute function public.trg_notify_dispute();
