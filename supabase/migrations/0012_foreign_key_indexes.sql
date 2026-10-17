-- 0012_foreign_key_indexes.sql
-- Cover every foreign key that had no index (performance advisor lint 0001).
-- These speed up joins, cascades and account deletion as the tables grow.

create index if not exists addresses_service_area_idx          on public.addresses (service_area_id);
create index if not exists booking_items_service_type_idx      on public.booking_items (service_type_code);
create index if not exists booking_messages_sender_idx         on public.booking_messages (sender_id);
create index if not exists bookings_address_idx                on public.bookings (address_id);
create index if not exists companies_created_by_idx            on public.companies (created_by);
create index if not exists companies_verified_by_idx           on public.companies (verified_by);
create index if not exists company_documents_reviewed_by_idx   on public.company_documents (reviewed_by);
create index if not exists company_service_areas_area_idx      on public.company_service_areas (service_area_id);
create index if not exists company_services_service_type_idx   on public.company_services (service_type_code);
create index if not exists company_subscriptions_plan_idx      on public.company_subscriptions (plan_code);
create index if not exists dispute_messages_author_idx         on public.dispute_messages (author_id);
create index if not exists disputes_decided_by_idx             on public.disputes (decided_by);
create index if not exists disputes_raised_by_idx              on public.disputes (raised_by);
create index if not exists job_reports_author_idx              on public.job_reports (author_id);
create index if not exists ledger_entries_payment_idx          on public.ledger_entries (payment_id);
create index if not exists ledger_entries_payout_idx           on public.ledger_entries (payout_id);
create index if not exists quotes_created_by_idx               on public.quotes (created_by);
create index if not exists reviews_customer_idx                on public.reviews (customer_id);
create index if not exists reviews_removed_by_idx              on public.reviews (removed_by);
create index if not exists service_reminders_service_type_idx  on public.service_reminders (service_type_code);
create index if not exists service_reminders_source_report_idx on public.service_reminders (source_report_id);
create index if not exists subscription_invoices_sub_idx       on public.subscription_invoices (subscription_id);
create index if not exists unit_access_grants_revoked_by_idx   on public.unit_access_grants (revoked_by);
create index if not exists units_address_idx                   on public.units (address_id);
