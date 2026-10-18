# Closed pilot readiness (Sprint 9) and launch gate (Sprint 10)

Not started: each needs something outside the code. This page lists what has to be true, who does it, and where the code already stands.

## Blocked on decisions or other people
| Item | Owner | Notes |
|---|---|---|
| Payment path for bookings | You | Choose B1 / B2 / B3 in `PAYGATE_INTEGRATION_PLAN.md`. Plans (Pro / Business) can go through PayGate as they are. |
| Lawyer review: Terms, Privacy, Refunds, Contractor terms, and whether holding funds needs a licence | You + lawyer | Pages are drafts (`LEGAL_IS_DRAFT=true` in `lib/legal.ts`). Turn it off only after sign-off. |
| Custom email sender (SMTP) | You | Then turn on "Confirm email" in Supabase Auth. Free tier sends ~2 emails/hour. |
| Supabase Pro | You | Daily backups, then apply the parked scripts in `supabase/deferred/` and turn on leaked-password protection. |
| Custom domain | You | Needed for live URL, email links and PayGate `live` URL. |
| Native review of Malay and Chinese text | A native speaker | See `accessibility-and-language-review.md`. |

## Recommended: a clean production project instead of cleaning up test data
Ledger rows are append-only and the seed users are real auth accounts, so scrubbing the test project is messy.
Cleaner: when you upgrade, create a **new** Supabase project, run migrations `0001` to `0023` (plus the deferred scripts), create the first admin by hand, then point Vercel at it (steps in `runbooks/backup-and-restore.md`, step 4). Keep the current project as the test/staging project.

## Before inviting pilot contractors and customers
- [ ] Production Supabase project created, migrations applied, `tests/04_rls_isolation.sql` shows `FAILURES: 0`.
- [ ] First admin created in `platform_admins` by hand; seed accounts do not exist.
- [ ] Vercel production env set: Supabase keys, `NEXT_PUBLIC_SITE_URL`, `CRON_SECRET`, payment variables once chosen.
- [ ] `/api/health` with the secret: `missingEnv` empty.
- [ ] Supabase Auth: Site URL and redirect URLs set; custom SMTP on; "Confirm email" on.
- [ ] Legal pages signed off and the draft banner removed.
- [ ] Weekly backup scheduled (runbook) or Pro backups on.
- [ ] 3 to 5 pilot contractors briefed; one support email monitored (2 working days promised on the Support page).
- [ ] Test checklist (`test-checklist.md`) fully ticked on the production project, with the real payment path.
- [ ] A real low-value payment and refund rehearsed end to end, with your explicit approval.

## Launch gate (Sprint 10)
- [ ] Two weeks of pilot with no unresolved money discrepancies (`payment_reconciliation` all balanced).
- [ ] No open critical bugs; error log (`request_error`) reviewed weekly.
- [ ] Support volume and dispute handling time acceptable.
- [ ] Decision recorded: go / extend pilot / stop.
