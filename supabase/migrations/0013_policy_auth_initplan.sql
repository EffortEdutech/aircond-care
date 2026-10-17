-- 0013_policy_auth_initplan.sql
-- Row-level security policies that call auth.uid() directly re-evaluate it for every row.
-- Wrapping it as (select auth.uid()) makes Postgres evaluate it once per query
-- (performance advisor lint 0003). The meaning of every policy is unchanged.
--
-- Written as a rewrite of the live policies so it covers every policy in 0009 without
-- repeating them. Run once: a second run would wrap the call a second time (harmless but untidy).

do $$
declare
  p record;
  stmt text;
begin
  for p in
    select tablename, policyname, qual, with_check
      from pg_policies
     where schemaname = 'public'
       and (qual like '%auth.uid()%' or with_check like '%auth.uid()%')
  loop
    stmt := format('alter policy %I on public.%I', p.policyname, p.tablename);
    if p.qual is not null then
      stmt := stmt || ' using (' || replace(p.qual, 'auth.uid()', '(select auth.uid())') || ')';
    end if;
    if p.with_check is not null then
      stmt := stmt || ' with check (' || replace(p.with_check, 'auth.uid()', '(select auth.uid())') || ')';
    end if;
    execute stmt;
  end loop;
end $$;
