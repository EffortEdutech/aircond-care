-- 0009_rls_policies.sql
-- Row-level security, grants, views and admin functions.
--
-- Model:
--   * authenticated users read and write only what the policies below allow;
--   * sensitive state changes (booking status, quotes, disputes, payouts, company
--     verification) go through functions defined in 0008 and in this file;
--   * the backend uses the service role, which bypasses RLS;
--   * anonymous visitors can read the public catalogue and public company pages only.

-- ---------------------------------------------------------------------------
-- More helpers
-- ---------------------------------------------------------------------------

-- Active staff of a company, even if the company is suspended (so they can see why).
create function public.is_company_staff(p_company uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.company_members
                 where company_id = p_company and user_id = auth.uid() and is_active);
$$;

-- Owner or dispatcher of the company that holds the booking.
create function public.is_booking_manager(p_booking uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.bookings b
                 where b.id = p_booking
                   and public.is_company_member(b.company_id, array['owner', 'dispatcher']::public.company_role[]));
$$;

-- ---------------------------------------------------------------------------
-- Views
-- ---------------------------------------------------------------------------

-- The history of a unit: final reports that no later correction has replaced.
-- Runs with the caller's rights, so access follows the job_reports policy.
create view public.unit_history with (security_invoker = true) as
select r.id as report_id,
       r.unit_id,
       r.booking_id,
       r.company_id,
       c.name as company_name,
       r.work_done,
       r.findings,
       r.refrigerant_type,
       r.gas_added_grams,
       r.readings,
       r.recommended_next_service_on,
       r.finalised_at,
       r.supersedes_id,
       coalesce((select array_agg(distinct i.service_type_code order by i.service_type_code)
                   from public.booking_items i
                  where i.booking_id = r.booking_id and i.unit_id = r.unit_id), '{}'::text[]) as service_types
  from public.job_reports r
  left join public.companies c on c.id = r.company_id
 where r.status = 'final'
   and not exists (select 1 from public.job_reports n where n.supersedes_id = r.id and n.status = 'final');
comment on view public.unit_history is 'Customer-facing timeline of a unit. Corrections replace the report they correct.';

-- Public company pages: verified companies only, safe columns only. Deliberately runs with
-- the view owner''s rights (no security_invoker) so anonymous visitors can search.
create view public.public_company_profiles as
select c.id,
       c.slug,
       c.name,
       c.description,
       c.logo_path,
       c.rating_avg,
       c.rating_count,
       (select min(s.price_sen) from public.company_services s
         where s.company_id = c.id and s.is_active and s.price_sen is not null) as starting_price_sen,
       (select jsonb_agg(jsonb_build_object('state', a.state, 'district', a.district,
                                            'call_out_fee_sen', csa.call_out_fee_sen))
          from public.company_service_areas csa
          join public.service_areas a on a.id = csa.service_area_id
         where csa.company_id = c.id) as service_areas
  from public.companies c
 where c.status = 'verified';

-- Admin check: every settled booking should sum to zero.
create view public.booking_ledger_balance with (security_invoker = true) as
select booking_id, sum(amount_sen) as balance_sen, count(*) as entries
  from public.ledger_entries
 group by booking_id;

-- ---------------------------------------------------------------------------
-- Admin functions (company verification, document review, review removal)
-- ---------------------------------------------------------------------------

create function public.admin_set_company_status(
  p_company uuid, p_status public.company_status, p_reason text default null
) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_platform_admin() then
    raise exception 'admin only' using errcode = '42501';
  end if;
  if p_status = 'verified' and exists (
       select 1 from unnest(array['ssm_registration', 'business_licence', 'insurance', 'identity']::public.document_type[]) t(doc_type)
        where not exists (select 1 from public.company_documents d
                           where d.company_id = p_company and d.doc_type = t.doc_type and d.status = 'approved')) then
    raise exception 'a company needs approved SSM registration, licence, insurance and identity documents';
  end if;
  update public.companies
     set status = p_status,
         verified_at = case when p_status = 'verified' then now() else verified_at end,
         verified_by = case when p_status = 'verified' then auth.uid() else verified_by end,
         suspended_reason = case when p_status = 'suspended' then p_reason else null end
   where id = p_company;
  if not found then
    raise exception 'company not found';
  end if;
  insert into public.audit_log (actor_id, action, entity_type, entity_id, company_id, meta)
  values (auth.uid(), 'company_status_set', 'company', p_company, p_company,
          jsonb_build_object('status', p_status, 'reason', p_reason));
end $$;

create function public.admin_review_document(
  p_document uuid, p_status public.review_state, p_note text default null
) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_platform_admin() then
    raise exception 'admin only' using errcode = '42501';
  end if;
  update public.company_documents
     set status = p_status, review_note = p_note, reviewed_by = auth.uid(), reviewed_at = now()
   where id = p_document;
  if not found then
    raise exception 'document not found';
  end if;
end $$;

create function public.admin_remove_review(p_review uuid, p_reason text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_platform_admin() then
    raise exception 'admin only' using errcode = '42501';
  end if;
  update public.reviews
     set visibility = 'removed', removed_reason = p_reason, removed_by = auth.uid()
   where id = p_review;
  if not found then
    raise exception 'review not found';
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Enable RLS everywhere
-- ---------------------------------------------------------------------------

do $$
declare t text;
begin
  for t in select tablename from pg_tables where schemaname = 'public'
  loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Policies
-- ---------------------------------------------------------------------------

-- profiles: yourself, colleagues, customers you have a booking with, admin.
create policy profiles_select_self on public.profiles for select to authenticated
  using (id = auth.uid());
create policy profiles_select_colleague on public.profiles for select to authenticated
  using (id in (select m.user_id from public.company_members m where m.company_id in (select public.my_company_ids())));
create policy profiles_select_customer on public.profiles for select to authenticated
  using (public.contractor_can_see_customer(id));
create policy profiles_select_admin on public.profiles for select to authenticated
  using (public.is_platform_admin());
create policy profiles_update_self on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- platform_admins: no policies. Only the helper function reads it.

-- Public catalogue.
create policy service_areas_read on public.service_areas for select to anon, authenticated using (true);
create policy service_types_read on public.service_types for select to anon, authenticated using (true);
create policy plans_read_anon on public.subscription_plans for select to anon using (is_available);
create policy plans_read on public.subscription_plans for select to authenticated using (true);
create policy settings_read on public.platform_settings for select to authenticated using (true);

-- addresses: the customer's own.
create policy addresses_owner on public.addresses for all to authenticated
  using (customer_id = auth.uid()) with check (customer_id = auth.uid());
create policy addresses_admin_read on public.addresses for select to authenticated
  using (public.is_platform_admin());

-- companies
create policy companies_select on public.companies for select to authenticated
  using (status = 'verified' or public.is_company_staff(id) or public.is_platform_admin());
create policy companies_update_owner on public.companies for update to authenticated
  using (public.is_company_member(id, array['owner']::public.company_role[]))
  with check (public.is_company_member(id, array['owner']::public.company_role[]));

create policy members_select on public.company_members for select to authenticated
  using (user_id = auth.uid() or public.is_company_staff(company_id) or public.is_platform_admin());
create policy members_write_owner on public.company_members for all to authenticated
  using (public.is_company_member(company_id, array['owner']::public.company_role[]))
  with check (public.is_company_member(company_id, array['owner']::public.company_role[]));

create policy documents_select on public.company_documents for select to authenticated
  using (public.is_company_staff(company_id) or public.is_platform_admin());
create policy documents_insert on public.company_documents for insert to authenticated
  with check (public.is_company_member(company_id, array['owner']::public.company_role[]));

create policy company_areas_select on public.company_service_areas for select to authenticated
  using (exists (select 1 from public.companies c where c.id = company_id and c.status = 'verified')
         or public.is_company_staff(company_id) or public.is_platform_admin());
create policy company_areas_write on public.company_service_areas for all to authenticated
  using (public.is_company_member(company_id, array['owner']::public.company_role[]))
  with check (public.is_company_member(company_id, array['owner']::public.company_role[]));

create policy company_services_select on public.company_services for select to authenticated
  using (exists (select 1 from public.companies c where c.id = company_id and c.status = 'verified')
         or public.is_company_staff(company_id) or public.is_platform_admin());
create policy company_services_write on public.company_services for all to authenticated
  using (public.is_company_member(company_id, array['owner']::public.company_role[]))
  with check (public.is_company_member(company_id, array['owner']::public.company_role[]));

-- units: owned by the customer; readable by a company with an active grant.
-- customer_id is checked directly as well: a helper function that re-reads the table cannot
-- see a row inserted by the same statement, which would break INSERT ... RETURNING.
create policy units_select on public.units for select to authenticated
  using (customer_id = auth.uid() or public.can_access_unit(id));
create policy units_insert on public.units for insert to authenticated
  with check (customer_id = auth.uid());
create policy units_update on public.units for update to authenticated
  using (customer_id = auth.uid()) with check (customer_id = auth.uid());
create policy units_delete on public.units for delete to authenticated
  using (customer_id = auth.uid());

create policy grants_select on public.unit_access_grants for select to authenticated
  using (company_id in (select public.my_company_ids())
         or exists (select 1 from public.units u where u.id = unit_id and u.customer_id = auth.uid())
         or public.is_platform_admin());

-- bookings
create policy bookings_select on public.bookings for select to authenticated
  using (customer_id = auth.uid() or public.is_booking_party(id));
create policy bookings_insert on public.bookings for insert to authenticated
  with check (customer_id = auth.uid());
create policy bookings_update on public.bookings for update to authenticated
  using (public.is_booking_party(id)) with check (public.is_booking_party(id));

create policy items_select on public.booking_items for select to authenticated
  using (public.is_booking_party(booking_id));
create policy items_write on public.booking_items for all to authenticated
  using (exists (select 1 from public.bookings b where b.id = booking_id and b.customer_id = auth.uid()))
  with check (exists (select 1 from public.bookings b where b.id = booking_id and b.customer_id = auth.uid()));

create policy messages_select on public.booking_messages for select to authenticated
  using (public.is_booking_party(booking_id));
create policy messages_insert on public.booking_messages for insert to authenticated
  with check (sender_id = auth.uid() and public.is_booking_party(booking_id));

-- quotes: drafts are visible to the contractor only.
create policy quotes_select on public.quotes for select to authenticated
  using (public.is_booking_party(booking_id)
         and (status <> 'draft' or public.is_booking_manager(booking_id) or public.is_platform_admin()));
create policy quotes_insert on public.quotes for insert to authenticated
  with check (public.is_booking_manager(booking_id));
create policy quotes_update on public.quotes for update to authenticated
  using (public.is_booking_manager(booking_id)) with check (public.is_booking_manager(booking_id));

create policy quote_lines_select on public.quote_lines for select to authenticated
  using (exists (select 1 from public.quotes q where q.id = quote_id));
create policy quote_lines_write on public.quote_lines for all to authenticated
  using (exists (select 1 from public.quotes q where q.id = quote_id and public.is_booking_manager(q.booking_id)))
  with check (exists (select 1 from public.quotes q where q.id = quote_id and public.is_booking_manager(q.booking_id)));

-- job_reports: the unit history.
--   final reports: the customer, any company with an active grant on the unit, admin;
--   drafts: the author and the company's owner or dispatcher only.
create policy reports_select on public.job_reports for select to authenticated
  using ((status = 'final' and public.can_access_unit(unit_id))
         or (status = 'draft' and (author_id = auth.uid()
                                   or public.is_company_member(company_id, array['owner', 'dispatcher']::public.company_role[])))
         or public.is_platform_admin());
create policy reports_insert on public.job_reports for insert to authenticated
  with check (author_id = auth.uid()
              and public.is_company_member(company_id)
              and (public.is_company_member(company_id, array['owner', 'dispatcher']::public.company_role[])
                   or exists (select 1 from public.bookings b where b.id = booking_id and b.assigned_to = auth.uid())));
create policy reports_update on public.job_reports for update to authenticated
  using (status = 'draft' and (author_id = auth.uid()
                               or public.is_company_member(company_id, array['owner', 'dispatcher']::public.company_role[])))
  with check (public.is_company_member(company_id));
create policy reports_delete on public.job_reports for delete to authenticated
  using (status = 'draft' and (author_id = auth.uid()
                               or public.is_company_member(company_id, array['owner', 'dispatcher']::public.company_role[])));

create policy report_parts_select on public.job_report_parts for select to authenticated
  using (exists (select 1 from public.job_reports r where r.id = job_report_id));
create policy report_parts_write on public.job_report_parts for all to authenticated
  using (exists (select 1 from public.job_reports r where r.id = job_report_id and r.status = 'draft'))
  with check (exists (select 1 from public.job_reports r where r.id = job_report_id and r.status = 'draft'));

create policy report_photos_select on public.job_report_photos for select to authenticated
  using (exists (select 1 from public.job_reports r where r.id = job_report_id));
create policy report_photos_write on public.job_report_photos for all to authenticated
  using (exists (select 1 from public.job_reports r where r.id = job_report_id and r.status = 'draft'))
  with check (exists (select 1 from public.job_reports r where r.id = job_report_id and r.status = 'draft'));

-- reminders: the unit owner can read them and dismiss them.
create policy reminders_select on public.service_reminders for select to authenticated
  using (exists (select 1 from public.units u where u.id = unit_id and u.customer_id = auth.uid())
         or public.is_platform_admin());
create policy reminders_dismiss on public.service_reminders for update to authenticated
  using (exists (select 1 from public.units u where u.id = unit_id and u.customer_id = auth.uid()))
  with check (status = 'dismissed');

-- money: read-only for users. Writes come from the backend (service role).
create policy payments_select on public.payments for select to authenticated
  using (customer_id = auth.uid() or public.is_booking_manager(booking_id) or public.is_platform_admin());
create policy payouts_select on public.payouts for select to authenticated
  using (public.is_company_member(company_id, array['owner']::public.company_role[]) or public.is_platform_admin());
create policy ledger_select on public.ledger_entries for select to authenticated
  using (public.is_company_member(company_id, array['owner']::public.company_role[]) or public.is_platform_admin());

-- disputes: raised and decided through functions; parties can read and discuss.
create policy disputes_select on public.disputes for select to authenticated
  using (public.is_booking_party(booking_id));
create policy dispute_messages_select on public.dispute_messages for select to authenticated
  using (exists (select 1 from public.disputes d where d.id = dispute_id));
create policy dispute_messages_insert on public.dispute_messages for insert to authenticated
  with check (author_id = auth.uid()
              and exists (select 1 from public.disputes d
                           where d.id = dispute_id and d.status in ('open', 'under_review')));

-- reviews: public when visible; the customer writes; the company replies.
create policy reviews_select_anon on public.reviews for select to anon
  using (visibility = 'visible');
create policy reviews_select on public.reviews for select to authenticated
  using (visibility = 'visible' or customer_id = auth.uid()
         or public.is_company_staff(company_id) or public.is_platform_admin());
create policy reviews_insert on public.reviews for insert to authenticated
  with check (customer_id = auth.uid());
create policy reviews_reply on public.reviews for update to authenticated
  using (public.is_company_member(company_id, array['owner', 'dispatcher']::public.company_role[]))
  with check (public.is_company_member(company_id, array['owner', 'dispatcher']::public.company_role[]));

-- subscriptions and invoices: the company owner and admin.
create policy subscriptions_select on public.company_subscriptions for select to authenticated
  using (public.is_company_member(company_id, array['owner']::public.company_role[]) or public.is_platform_admin());
create policy invoices_select on public.subscription_invoices for select to authenticated
  using (public.is_company_member(company_id, array['owner']::public.company_role[]) or public.is_platform_admin());

create policy notifications_select on public.notifications for select to authenticated
  using (user_id = auth.uid());

-- audit log: admin; a company owner sees their company's entries; a customer sees who viewed their units.
create policy audit_select on public.audit_log for select to authenticated
  using (public.is_platform_admin()
         or public.is_company_member(company_id, array['owner']::public.company_role[])
         or (entity_type = 'unit' and exists (select 1 from public.units u where u.id = entity_id and u.customer_id = auth.uid())));

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------
-- Start from nothing for the client roles, then grant what the app needs.
-- (The service role keeps its default privileges and bypasses RLS.)

revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke execute on all functions in schema public from public, anon, authenticated;

grant usage on schema public to anon, authenticated;

-- Reads (RLS decides which rows).
grant select on
  public.profiles, public.service_areas, public.service_types, public.subscription_plans,
  public.platform_settings, public.addresses, public.companies, public.company_members,
  public.company_documents, public.company_service_areas, public.company_services,
  public.units, public.unit_access_grants, public.bookings, public.booking_items,
  public.booking_messages, public.quotes, public.quote_lines, public.job_reports,
  public.job_report_parts, public.job_report_photos, public.service_reminders,
  public.payments, public.payouts, public.ledger_entries, public.disputes,
  public.dispute_messages, public.reviews, public.company_subscriptions,
  public.subscription_invoices, public.notifications, public.audit_log,
  public.unit_history, public.booking_ledger_balance
  to authenticated;

-- Anonymous visitors: catalogue, public company pages and visible reviews (no customer ids).
grant select on public.service_areas, public.service_types, public.subscription_plans,
                public.public_company_profiles to anon;
grant select (id, company_id, rating, comment, company_reply, replied_at, created_at) on public.reviews to anon;
grant select on public.public_company_profiles to authenticated;

-- Writes, limited to the columns people may change directly.
grant update (full_name, phone, email, locale, notify_whatsapp, notify_push, notify_email)
  on public.profiles to authenticated;
grant insert, update, delete on public.addresses to authenticated;
grant update (name, legal_name, description, phone, email, logo_path) on public.companies to authenticated;
grant insert, update, delete on public.company_members to authenticated;
grant insert (company_id, doc_type, storage_path, expires_on) on public.company_documents to authenticated;
grant insert, update, delete on public.company_service_areas, public.company_services to authenticated;
grant insert, update, delete on public.units to authenticated;
grant insert (customer_id, company_id, address_id, fault_description, customer_notes, requested_start)
  on public.bookings to authenticated;
grant update (customer_notes, fault_description) on public.bookings to authenticated;
grant insert (booking_id, unit_id, service_type_code, description, quantity) on public.booking_items to authenticated;
grant update (description, quantity) on public.booking_items to authenticated;
grant delete on public.booking_items to authenticated;
grant insert (booking_id, sender_id, body) on public.booking_messages to authenticated;
grant insert (booking_id, valid_until, note) on public.quotes to authenticated;
grant update (valid_until, note) on public.quotes to authenticated;
grant insert, update, delete on public.quote_lines to authenticated;
grant insert (booking_id, unit_id, author_id, supersedes_id, work_done, findings, refrigerant_type,
              gas_added_grams, readings, recommended_next_service_on, customer_signoff_name, customer_signoff_at)
  on public.job_reports to authenticated;
grant update (work_done, findings, refrigerant_type, gas_added_grams, readings, recommended_next_service_on,
              customer_signoff_name, customer_signoff_at, status)
  on public.job_reports to authenticated;
grant delete on public.job_reports to authenticated;
grant insert, update, delete on public.job_report_parts, public.job_report_photos to authenticated;
grant update (status) on public.service_reminders to authenticated;
grant insert (dispute_id, author_id, body, attachment_paths) on public.dispute_messages to authenticated;
grant insert (booking_id, customer_id, rating, comment) on public.reviews to authenticated;
grant update (company_reply) on public.reviews to authenticated;

-- The booking number default calls nextval as the inserting user.
grant usage on sequence public.booking_no_seq to authenticated;

-- Functions the app may call.
grant execute on function
  public.is_platform_admin(), public.is_company_member(uuid, public.company_role[]),
  public.my_company_ids(), public.can_access_unit(uuid), public.is_booking_party(uuid),
  public.is_booking_manager(uuid), public.is_company_staff(uuid),
  public.contractor_can_see_customer(uuid),
  public.create_company(text, text, text, text, text),
  public.transition_booking(uuid, public.booking_status, timestamptz, timestamptz, uuid, text),
  public.send_quote(uuid), public.accept_quote(uuid), public.decline_quote(uuid),
  public.revoke_unit_access(uuid, uuid), public.log_unit_view(uuid), public.export_my_data(),
  public.raise_dispute(uuid, text), public.decide_dispute(uuid, text, bigint, text),
  public.admin_set_company_status(uuid, public.company_status, text),
  public.admin_review_document(uuid, public.review_state, text),
  public.admin_remove_review(uuid, text)
  to authenticated;
grant execute on function public.is_platform_admin() to anon;

-- Backend-only functions: queue_payout, auto_close_completed_bookings, setting_int and
-- current_commission_bps are not granted to client roles.
grant execute on all functions in schema public to service_role;
