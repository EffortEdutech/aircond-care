# Deploy and rollback

## Normal deploy
Push to `main` on GitHub (EffortEdutech/aircond-care). Vercel builds and deploys to production.
Before pushing: `npm run lint` and `npm run build` in `web/` must pass.

Database changes: add a numbered file in `supabase/migrations/`, apply it, then update `web/src/lib/supabase/database.types.ts`.
**Order matters:** apply a migration that adds things before deploying code that uses them. Apply a migration that removes things after the code stops using them.

## Checklist after a deploy (5 minutes)
- `/api/health` returns ok.
- Sign in as a test customer, open Units and Bookings.
- Sign in as a test contractor, open the work list.
- Vercel → Logs: no new `request_error` lines.

## Roll back the site
Vercel → project → Deployments → pick the last good one → ⋯ → **Promote to Production** (or Instant Rollback).
This takes seconds and does not touch the database.
Then fix forward on a branch; do not leave production on an old build for long (the cron route and migrations may have moved on).

## Roll back the database
Migrations only go forward. To undo one, write a new migration that reverses it (drop the column, restore the old policy) and apply it.
For data loss, see [backup-and-restore.md](backup-and-restore.md).
Policy or function changes are safe to redo; dropping a column or table is not. Take a backup first.

## Parked migrations
`supabase/deferred/` holds reviewed migrations that are not applied yet (see its README). They are not part of the numbered sequence.
