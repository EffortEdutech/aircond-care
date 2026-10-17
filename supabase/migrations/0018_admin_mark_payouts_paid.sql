-- 0018_admin_mark_payouts_paid.sql
-- The finance person pays contractors by bank transfer, then marks the batch paid here.
-- Marking a payout paid writes the payout entry to the ledger (existing trigger).

create function public.admin_mark_payouts_paid(p_ids uuid[], p_reference text)
returns integer
language plpgsql security definer set search_path = public as $$
declare v_n integer;
begin
  if not public.is_platform_admin() then
    raise exception 'admin only' using errcode = '42501';
  end if;
  update public.payouts
     set status = 'paid', paid_at = now(), gateway_ref = nullif(trim(p_reference), '')
   where id = any (p_ids) and status in ('queued', 'processing');
  get diagnostics v_n = row_count;
  insert into public.audit_log (actor_id, action, entity_type, meta)
  values (auth.uid(), 'payouts_marked_paid', 'payout', jsonb_build_object('count', v_n, 'reference', p_reference));
  return v_n;
end $$;
revoke execute on function public.admin_mark_payouts_paid(uuid[], text) from public, anon;
grant execute on function public.admin_mark_payouts_paid(uuid[], text) to authenticated;
