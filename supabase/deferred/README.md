# Deferred migrations

Written and reviewed, but not applied on purpose.

- `security_hardening.sql`: revoke API access to trigger functions and `is_platform_admin` for anon, speed up two RLS policies, add two foreign-key indexes, document intentional advisor findings.
  Deferred by the owner on 2026-10-18 until the production upgrade (Supabase Pro).
  When applying: copy to `supabase/migrations/` with the next free number, apply, then re-run `tests/04_rls_isolation.sql` (expect `FAILURES: 0`) and re-check the advisors.
- Also turn on leaked-password protection (Dashboard → Authentication → Providers → Email) once on Pro.

- `bookings_rls_performance.sql`: faster `bookings` read/update policies (new `my_manager_company_ids()` helper) plus three indexes.
  Found by `tests/05_perf_10k.sql` at 10,000 bookings: the contractor work list took ~770 ms and the admin bookings list ~5 s, because the policy calls `is_booking_party(id)` for every row. Everything else was under 10 ms.
  At pilot size (hundreds of bookings) this is not noticeable, so it is parked, but apply it before the booking count passes roughly 2,000.
  Not yet applied or validated. When applying: copy to `supabase/migrations/` with the next free number, apply, re-run `tests/04_rls_isolation.sql` (expect `FAILURES: 0`), then re-run `tests/05_perf_10k.sql` and compare.
