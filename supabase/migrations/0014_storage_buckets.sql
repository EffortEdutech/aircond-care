-- 0014_storage_buckets.sql
-- File storage: four buckets, with access decided by the first folders of the file path.
--
--   unit-photos          {customer_id}/{unit_id}/{file}      private. Customer owns; a contractor on an active booking can read.
--   job-report-photos    {company_id}/{booking_id}/{file}    private. Company staff write; booking parties read.
--   company-documents    {company_id}/{file}                 private. Company owner uploads; staff and platform admin read.
--   company-logos        {company_id}/{file}                 public read. Company owner writes.
--
-- The same ownership rules as the tables apply, so a file is visible to exactly the people who can see its record.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('unit-photos',       'unit-photos',       false, 8388608,  array['image/jpeg', 'image/png', 'image/webp', 'image/heic']),
  ('job-report-photos', 'job-report-photos', false, 8388608,  array['image/jpeg', 'image/png', 'image/webp', 'image/heic']),
  ('company-documents', 'company-documents', false, 10485760, array['application/pdf', 'image/jpeg', 'image/png']),
  ('company-logos',     'company-logos',     true,  2097152,  array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Turns a path segment into a uuid, or null if it is not one, so a bad path denies access instead of raising an error.
create function public.path_uuid(p_segment text) returns uuid
language sql immutable set search_path = public as $$
  select case when p_segment ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
              then p_segment::uuid end
$$;
grant execute on function public.path_uuid(text) to authenticated, service_role;

-- unit-photos: the customer's own folder; contractors with an active grant can read.
create policy unit_photos_read on storage.objects for select to authenticated
  using (bucket_id = 'unit-photos'
         and ((storage.foldername(name))[1] = (select auth.uid())::text
              or public.can_access_unit(public.path_uuid((storage.foldername(name))[2]))));
create policy unit_photos_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'unit-photos'
              and (storage.foldername(name))[1] = (select auth.uid())::text
              and exists (select 1 from public.units u
                           where u.id = public.path_uuid((storage.foldername(name))[2])
                             and u.customer_id = (select auth.uid())));
create policy unit_photos_update on storage.objects for update to authenticated
  using (bucket_id = 'unit-photos' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'unit-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy unit_photos_delete on storage.objects for delete to authenticated
  using (bucket_id = 'unit-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- job-report-photos: company staff write into their company folder; anyone on the booking can read.
create policy report_photos_read on storage.objects for select to authenticated
  using (bucket_id = 'job-report-photos'
         and (public.is_company_member(public.path_uuid((storage.foldername(name))[1]))
              or public.is_booking_party(public.path_uuid((storage.foldername(name))[2]))
              or public.is_platform_admin()));
create policy report_photos_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'job-report-photos'
              and public.is_company_member(public.path_uuid((storage.foldername(name))[1]))
              and exists (select 1 from public.bookings b
                           where b.id = public.path_uuid((storage.foldername(name))[2])
                             and b.company_id = public.path_uuid((storage.foldername(name))[1])));
create policy report_photos_update on storage.objects for update to authenticated
  using (bucket_id = 'job-report-photos' and public.is_company_member(public.path_uuid((storage.foldername(name))[1])))
  with check (bucket_id = 'job-report-photos' and public.is_company_member(public.path_uuid((storage.foldername(name))[1])));
create policy report_photos_delete on storage.objects for delete to authenticated
  using (bucket_id = 'job-report-photos' and public.is_company_member(public.path_uuid((storage.foldername(name))[1])));

-- company-documents: only the company owner uploads; company staff and platform admin read.
create policy company_docs_read on storage.objects for select to authenticated
  using (bucket_id = 'company-documents'
         and (public.is_company_staff(public.path_uuid((storage.foldername(name))[1]))
              or public.is_platform_admin()));
create policy company_docs_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'company-documents'
              and public.is_company_member(public.path_uuid((storage.foldername(name))[1]), array['owner']::public.company_role[]));
create policy company_docs_delete on storage.objects for delete to authenticated
  using (bucket_id = 'company-documents'
         and public.is_company_member(public.path_uuid((storage.foldername(name))[1]), array['owner']::public.company_role[]));

-- company-logos: the bucket is public for reading; only the company owner writes.
create policy company_logos_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'company-logos'
              and public.is_company_member(public.path_uuid((storage.foldername(name))[1]), array['owner']::public.company_role[]));
create policy company_logos_update on storage.objects for update to authenticated
  using (bucket_id = 'company-logos'
         and public.is_company_member(public.path_uuid((storage.foldername(name))[1]), array['owner']::public.company_role[]))
  with check (bucket_id = 'company-logos'
              and public.is_company_member(public.path_uuid((storage.foldername(name))[1]), array['owner']::public.company_role[]));
create policy company_logos_delete on storage.objects for delete to authenticated
  using (bucket_id = 'company-logos'
         and public.is_company_member(public.path_uuid((storage.foldername(name))[1]), array['owner']::public.company_role[]));
