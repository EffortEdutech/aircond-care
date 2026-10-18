# Backup and restore

## What exists today
Supabase **free** plan: no downloadable backups and no point-in-time recovery. If the database is lost, so is the data.
Supabase **Pro**: daily backups kept 7 days; point-in-time recovery is a paid add-on. Move to Pro before the pilot.

## Weekly manual backup (do this until Pro)
On your own computer (needs the Supabase CLI and the database password from Dashboard → Project Settings → Database):
```
supabase db dump --db-url "postgresql://postgres:<PASSWORD>@db.zxhuprfxibpaoblbdflu.supabase.co:5432/postgres" -f backup-schema.sql
supabase db dump --db-url "<same URL>" --data-only --use-copy -f backup-data.sql
```
Keep the files somewhere private and outside the repo (they hold personal data). Name them with the date.
**Files in storage buckets are not in the dump.** Buckets: `unit-photos`, `job-report-photos`, `dispute-photos`, `company-documents`, `company-logos`. Download them from Dashboard → Storage if you need a full copy.

## Restore
1. Create a new Supabase project (same region).
2. Run `backup-schema.sql`, then `backup-data.sql`, using `psql` with the new project's connection string.
3. Re-create the storage buckets and their policies (they are in `supabase/migrations/0014_storage_buckets.sql` and `0023_*`), and upload the files back.
4. Point the site at the new project: in Vercel set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, then redeploy. Update Auth → URL Configuration (Site URL and Redirect URLs).
5. Check `/api/health`, sign in, open a booking, check the ledger totals with `select * from payment_reconciliation` (every row `balanced = true`).

## Restore test
Do a trial restore into a throwaway project once before launch, and again after major schema changes. A backup that was never restored is a guess.

## Before risky changes
Take a manual dump first. Always.
