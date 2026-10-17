-- 0022: sign-up consent record, account-deletion requests, plan team-size limit.

-- 1. Consent record on the profile (set at sign-up from auth metadata).
alter table public.profiles
  add column if not exists terms_accepted_at timestamptz,
  add column if not exists terms_version text;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, phone, email, terms_version, terms_accepted_at)
  values (new.id,
          coalesce(new.raw_user_meta_data ->> 'full_name', ''),
          nullif(new.phone, ''),
          nullif(new.email, ''),
          nullif(new.raw_user_meta_data ->> 'terms_version', ''),
          case when nullif(new.raw_user_meta_data ->> 'terms_version', '') is not null then now() end)
  on conflict (id) do nothing;
  return new;
end $$;

-- 2. Account deletion requests.
create table if not exists public.account_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  reason text,
  status text not null default 'pending' check (status in ('pending','completed','rejected','cancelled')),
  admin_note text,
  handled_by uuid references public.profiles(id),
  handled_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index if not exists account_deletion_one_pending
  on public.account_deletion_requests (user_id) where status = 'pending';

alter table public.account_deletion_requests enable row level security;
create policy deletion_select on public.account_deletion_requests
  for select to authenticated
  using (user_id = auth.uid() or public.is_platform_admin());

create or replace function public.request_account_deletion(p_reason text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'sign in first' using errcode = '42501'; end if;
  insert into public.account_deletion_requests (user_id, reason)
  values (auth.uid(), nullif(trim(p_reason), ''))
  on conflict do nothing;
  insert into public.audit_log (actor_id, action, entity_type, entity_id, meta)
  values (auth.uid(), 'account_deletion_requested', 'profile', auth.uid(), '{}'::jsonb);
end $$;

create or replace function public.cancel_account_deletion()
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.account_deletion_requests
     set status = 'cancelled', handled_at = now()
   where user_id = auth.uid() and status = 'pending';
end $$;

-- Admin completes a request: refuses while money is still moving, then
-- anonymises the profile and deactivates memberships. Ledger, bookings and
-- reviews stay (financial records), but no longer carry personal details.
-- The caller (server action) bans the auth user afterwards.
create or replace function public.admin_process_deletion(p_id uuid, p_approve boolean, p_note text)
returns text language plpgsql security definer set search_path = public as $$
declare r public.account_deletion_requests; v_open int;
begin
  if not public.is_platform_admin() then
    raise exception 'admin only' using errcode = '42501';
  end if;
  select * into r from public.account_deletion_requests where id = p_id and status = 'pending' for update;
  if not found then raise exception 'request not found or already handled'; end if;

  if not p_approve then
    if length(trim(coalesce(p_note, ''))) < 5 then raise exception 'give a reason for rejecting (5+ characters)'; end if;
    update public.account_deletion_requests
       set status = 'rejected', admin_note = trim(p_note), handled_by = auth.uid(), handled_at = now()
     where id = p_id;
    return 'rejected';
  end if;

  select count(*) into v_open from public.bookings b
   where b.status in ('requested','quoted','awaiting_payment','paid','scheduled','in_progress','completed','disputed')
     and (b.customer_id = r.user_id
          or b.company_id in (select cm.company_id from public.company_members cm
                               where cm.user_id = r.user_id and cm.role = 'owner' and cm.is_active));
  if v_open > 0 then
    raise exception 'This user still has % open booking(s). Wait until they are closed or cancelled.', v_open;
  end if;

  update public.profiles
     set full_name = 'Deleted user', phone = null, email = null,
         notify_whatsapp = false, notify_push = false, notify_email = false
   where id = r.user_id;
  update public.company_members set is_active = false where user_id = r.user_id;
  update public.account_deletion_requests
     set status = 'completed', admin_note = nullif(trim(p_note), ''), handled_by = auth.uid(), handled_at = now()
   where id = p_id;
  insert into public.audit_log (actor_id, action, entity_type, entity_id, meta)
  values (auth.uid(), 'account_deleted', 'profile', r.user_id, '{}'::jsonb);
  return 'completed';
end $$;

revoke execute on function public.request_account_deletion(text), public.cancel_account_deletion(),
  public.admin_process_deletion(uuid, boolean, text) from public, anon;
grant execute on function public.request_account_deletion(text), public.cancel_account_deletion(),
  public.admin_process_deletion(uuid, boolean, text) to authenticated;

-- 3. Plan limit: a company cannot have more active members than its plan allows.
-- Existing members are never removed; the check only blocks adding new ones.
create or replace function public.add_team_member(p_company uuid, p_email text, p_role public.company_role)
returns void language plpgsql security definer set search_path = public as $$
declare v_user uuid; v_max int; v_now int; v_already boolean;
begin
  if not public.is_company_member(p_company, array['owner']::public.company_role[]) then
    raise exception 'only the company owner can add team members' using errcode = '42501';
  end if;
  select id into v_user from public.profiles where lower(email) = lower(trim(p_email));
  if v_user is null then
    raise exception 'No account uses that email. Ask them to sign up first, then add them.';
  end if;

  select exists (select 1 from public.company_members where company_id = p_company and user_id = v_user and is_active)
    into v_already;
  if not v_already then
    select p.max_members into v_max
      from public.company_subscriptions s
      join public.subscription_plans p on p.code = s.plan_code
     where s.company_id = p_company;
    select count(*) into v_now from public.company_members where company_id = p_company and is_active;
    if v_max is not null and v_now >= v_max then
      raise exception 'Your plan allows % team member(s). Upgrade your plan to add more.', v_max;
    end if;
  end if;

  insert into public.company_members (company_id, user_id, role)
  values (p_company, v_user, p_role)
  on conflict (company_id, user_id) do update set role = excluded.role, is_active = true;
  insert into public.audit_log (actor_id, action, entity_type, entity_id, company_id, meta)
  values (auth.uid(), 'team_member_added', 'company', p_company, p_company,
          jsonb_build_object('user_id', v_user, 'role', p_role));
end $$;
