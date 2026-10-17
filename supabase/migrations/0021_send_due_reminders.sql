-- 0021_send_due_reminders.sql
-- Backend job: turn service reminders that fall due within the next N days into in-app
-- notifications for the unit owner. Each reminder is sent once.
create function public.send_due_reminders(p_days_ahead int default 14) returns int
language plpgsql security definer set search_path = public as $$
declare r record; n int := 0;
begin
  if auth.uid() is not null then
    raise exception 'backend only' using errcode = '42501';
  end if;
  for r in
    select sr.id, sr.unit_id, sr.service_type_code, sr.due_on, u.customer_id
      from public.service_reminders sr
      join public.units u on u.id = sr.unit_id
     where sr.status = 'pending' and sr.due_on <= current_date + p_days_ahead
     for update of sr skip locked
  loop
    insert into public.notifications (user_id, channel, template, payload, status, sent_at)
    values (r.customer_id, 'in_app', 'service_reminder',
            jsonb_build_object('unit_id', r.unit_id, 'service', r.service_type_code, 'due_on', r.due_on, 'audience', 'customer'),
            'sent', now());
    update public.service_reminders set status = 'sent', sent_at = now() where id = r.id;
    n := n + 1;
  end loop;
  return n;
end $$;
revoke all on function public.send_due_reminders(int) from public, anon, authenticated;
grant execute on function public.send_due_reminders(int) to service_role;
