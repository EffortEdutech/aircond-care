-- 02_storage.sql
-- Storage policies from 0014: who may read and write files, decided by the path.
-- Runs in one transaction and rolls back. A failed check raises an exception and stops the run.

\set ON_ERROR_STOP on
\o /dev/null
begin;

do $$
declare
  a uuid := gen_random_uuid();
  b uuid := gen_random_uuid();
  unit_a uuid;
  n int;
begin
  insert into auth.users (id, email) values (a, 'a@test.invalid'), (b, 'b@test.invalid');
  insert into public.units (customer_id, nickname) values (a, 'A unit') returning id into unit_a;

  -- Customer A uploads and reads her own unit photo.
  perform set_config('request.jwt.claim.sub', a::text, true);
  set local role authenticated;
  insert into storage.objects (bucket_id, name) values ('unit-photos', a || '/' || unit_a || '/nameplate.jpg');
  select count(*) into n from storage.objects where bucket_id = 'unit-photos';
  if n <> 1 then raise exception 'A should see her own photo, saw %', n; end if;

  -- She cannot write into someone else's folder, for a unit that is not hers, or with a bad path.
  begin
    insert into storage.objects (bucket_id, name) values ('unit-photos', b || '/' || unit_a || '/x.jpg');
    raise exception 'A wrote into B folder';
  exception when insufficient_privilege then null; end;
  begin
    insert into storage.objects (bucket_id, name) values ('unit-photos', a || '/' || gen_random_uuid() || '/x.jpg');
    raise exception 'A wrote for a unit that is not hers';
  exception when insufficient_privilege then null; end;
  begin
    insert into storage.objects (bucket_id, name) values ('unit-photos', a || '/not-a-uuid/x.jpg');
    raise exception 'A wrote with a bad path';
  exception when insufficient_privilege then null; end;
  begin
    insert into storage.objects (bucket_id, name) values ('company-documents', a || '/id.pdf');
    raise exception 'A wrote a company document';
  exception when insufficient_privilege then null; end;

  -- Customer B sees and changes nothing of A's.
  reset role;
  perform set_config('request.jwt.claim.sub', b::text, true);
  set local role authenticated;
  select count(*) into n from storage.objects where bucket_id = 'unit-photos';
  if n <> 0 then raise exception 'B should see no photos, saw %', n; end if;
  begin
    insert into storage.objects (bucket_id, name) values ('unit-photos', a || '/' || unit_a || '/b.jpg');
    raise exception 'B wrote into A unit folder';
  exception when insufficient_privilege then null; end;
  delete from storage.objects where bucket_id = 'unit-photos';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'B deleted % of A photos', n; end if;

  -- A signed-out visitor sees no photos.
  reset role;
  perform set_config('request.jwt.claim.sub', '', true);
  set local role anon;
  select count(*) into n from storage.objects where bucket_id = 'unit-photos';
  if n <> 0 then raise exception 'anon should see no photos, saw %', n; end if;

  -- Customer A can remove her own photo.
  reset role;
  perform set_config('request.jwt.claim.sub', a::text, true);
  set local role authenticated;
  delete from storage.objects where bucket_id = 'unit-photos';
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'A should delete her photo, deleted %', n; end if;
  reset role;
end $$;

rollback;
\o
\echo Storage policies: all checks passed
