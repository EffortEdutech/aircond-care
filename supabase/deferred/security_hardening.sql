-- 0024: security and performance hardening from the Sprint 11 advisor review.

-- 1. Trigger functions are fired by the database, never called over the API.
-- Revoking EXECUTE does not stop triggers from firing.
revoke execute on function public.refund_on_booking_end() from public, anon, authenticated;
revoke execute on function public.refund_on_dispute_decision() from public, anon, authenticated;
revoke execute on function public.trg_notify_booking() from public, anon, authenticated;
revoke execute on function public.trg_notify_dispute() from public, anon, authenticated;
revoke execute on function public.trg_notify_message() from public, anon, authenticated;

-- 2. The admin check has no use for signed-out visitors.
revoke execute on function public.is_platform_admin() from public, anon;
grant execute on function public.is_platform_admin() to authenticated;

-- 3. RLS speed: evaluate auth.uid() once per query, not once per row.
drop policy if exists notifications_mark_read on public.notifications;
create policy notifications_mark_read on public.notifications
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists deletion_select on public.account_deletion_requests;
create policy deletion_select on public.account_deletion_requests
  for select to authenticated
  using (user_id = (select auth.uid()) or public.is_platform_admin());

-- 4. Missing foreign-key indexes.
create index if not exists account_deletion_handled_by_idx on public.account_deletion_requests (handled_by);
create index if not exists webhook_events_payment_idx on public.webhook_events (payment_id);

-- 5. Document the advisor findings that are intentional.
comment on table public.platform_admins is 'RLS on with no policies on purpose: only service role and SECURITY DEFINER functions read it.';
comment on table public.webhook_events is 'RLS on with no policies on purpose: only the payment webhook (service role) reads or writes it.';
comment on view public.public_company_profiles is 'SECURITY DEFINER on purpose: public facade that exposes only safe company columns to anonymous visitors.';
