-- RUN IN: Supabase dashboard -> SQL Editor -> New query -> paste all -> Run.
-- Runs as one transaction: if anything fails, nothing changes.
begin;

-- 0024: make the bookings RLS policies set-based.
-- Found by tests/05_perf_10k.sql: with 10,000 bookings the contractor work list took ~0.8 s and the
-- admin list ~5 s, because is_booking_party(id) ran a subquery for every row.
-- Access rules are unchanged: the customer, owners and dispatchers of the company, the assigned
-- technician (while an active member), and platform admins.

create or replace function public.my_manager_company_ids()
returns setof uuid
language sql stable security definer set search_path = public as $$
  select m.company_id
  from public.company_members m
  join public.companies c on c.id = m.company_id
  where m.user_id = (select auth.uid())
    and m.is_active
    and m.role in ('owner', 'dispatcher')
    and c.status <> 'suspended';
$$;
revoke execute on function public.my_manager_company_ids() from public, anon;
grant execute on function public.my_manager_company_ids() to authenticated;

drop policy if exists bookings_select on public.bookings;
create policy bookings_select on public.bookings for select to authenticated
  using (
    customer_id = (select auth.uid())
    or company_id in (select public.my_manager_company_ids())
    or (assigned_to = (select auth.uid()) and company_id in (select public.my_company_ids()))
    or (select public.is_platform_admin())
  );

drop policy if exists bookings_update on public.bookings;
create policy bookings_update on public.bookings for update to authenticated
  using (
    customer_id = (select auth.uid())
    or company_id in (select public.my_manager_company_ids())
    or (assigned_to = (select auth.uid()) and company_id in (select public.my_company_ids()))
    or (select public.is_platform_admin())
  );

-- Indexes that match the list pages' filters and sort order.
create index if not exists bookings_company_created_idx on public.bookings (company_id, created_at desc);
create index if not exists bookings_customer_created_idx on public.bookings (customer_id, created_at desc);
create index if not exists bookings_status_created_idx on public.bookings (status, created_at desc);

commit;

-- ===== AFTER RUNNING: check =====
-- select policyname, qual from pg_policies where tablename='bookings';   -- bookings_select / bookings_update should mention my_manager_company_ids

-- ===== ROLLBACK (only if something looks wrong; run separately) =====
-- begin;
-- drop policy bookings_select on public.bookings;
-- create policy bookings_select on public.bookings for select to authenticated using (customer_id = (select auth.uid()) or is_booking_party(id));
-- drop policy bookings_update on public.bookings;
-- create policy bookings_update on public.bookings for update to authenticated using (is_booking_party(id)) with check (is_booking_party(id));
-- commit;
