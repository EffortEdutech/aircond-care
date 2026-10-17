-- 0023: dispute photos, in-app alert preference, audit-log search indexes.

-- 1. Private bucket for dispute evidence. Path: {booking_id}/{author_id}/{file}.jpg
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('dispute-photos', 'dispute-photos', false, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

create policy dispute_photos_read on storage.objects for select to authenticated
  using (bucket_id = 'dispute-photos'
         and public.is_booking_party(public.path_uuid((storage.foldername(name))[1])));

-- Only the uploader's own folder, only while a dispute on that booking is unresolved.
create policy dispute_photos_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'dispute-photos'
              and (storage.foldername(name))[2] = auth.uid()::text
              and public.is_booking_party(public.path_uuid((storage.foldername(name))[1]))
              and exists (select 1 from public.disputes d
                           where d.booking_id = public.path_uuid((storage.foldername(name))[1])
                             and d.status in ('open', 'under_review')));

alter table public.dispute_messages
  add constraint dispute_messages_max_photos check (attachment_paths is null or cardinality(attachment_paths) <= 4);

-- 2. In-app alert preference. Money, payment and dispute alerts always arrive;
-- chat, reminders and visit updates can be muted.
alter table public.profiles add column if not exists notify_in_app boolean not null default true;

create or replace function public.notify_user(p_user uuid, p_template text, p_payload jsonb)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_user is null or p_user = auth.uid() then return; end if;
  if p_template in ('new_message', 'service_reminder', 'visit_scheduled', 'job_assigned', 'job_started')
     and exists (select 1 from public.profiles where id = p_user and not notify_in_app) then
    return;
  end if;
  insert into public.notifications (user_id, channel, template, payload, status, sent_at)
  values (p_user, 'in_app', p_template, p_payload, 'sent', now());
end $$;

-- 3. Audit-log search.
create index if not exists audit_log_created_idx on public.audit_log (created_at desc);
create index if not exists audit_log_action_idx on public.audit_log (action, created_at desc);
create index if not exists audit_log_entity_idx on public.audit_log (entity_id);
