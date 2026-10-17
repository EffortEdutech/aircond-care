-- 0016_team_members.sql
-- Lets a company owner add an existing user to the team by email.
-- A client cannot look up other people's profiles, so the lookup runs inside this function.

create function public.add_team_member(p_company uuid, p_email text, p_role public.company_role)
returns void
language plpgsql security definer set search_path = public as $$
declare v_user uuid;
begin
  if not public.is_company_member(p_company, array['owner']::public.company_role[]) then
    raise exception 'only the company owner can add team members' using errcode = '42501';
  end if;
  select id into v_user from public.profiles where lower(email) = lower(trim(p_email));
  if v_user is null then
    raise exception 'No account uses that email. Ask them to sign up first, then add them.';
  end if;
  insert into public.company_members (company_id, user_id, role)
  values (p_company, v_user, p_role)
  on conflict (company_id, user_id) do update set role = excluded.role, is_active = true;
  insert into public.audit_log (actor_id, action, entity_type, entity_id, company_id, meta)
  values (auth.uid(), 'team_member_added', 'company', p_company, p_company,
          jsonb_build_object('user_id', v_user, 'role', p_role));
end $$;

revoke execute on function public.add_team_member(uuid, text, public.company_role) from public, anon;
grant execute on function public.add_team_member(uuid, text, public.company_role) to authenticated;
