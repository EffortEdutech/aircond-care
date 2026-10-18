# Deferred migrations

Written and reviewed, but not applied on purpose.

- `security_hardening.sql`: revoke API access to trigger functions and `is_platform_admin` for anon, speed up two RLS policies, add two foreign-key indexes, document intentional advisor findings.
  Deferred by the owner on 2026-10-18 until the production upgrade (Supabase Pro).
  When applying: copy to `supabase/migrations/` with the next free number, apply, then re-run `tests/04_rls_isolation.sql` (expect `FAILURES: 0`) and re-check the advisors.
- Also turn on leaked-password protection (Dashboard → Authentication → Providers → Email) once on Pro.
