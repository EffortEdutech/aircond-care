# Incident checklist

Use when someone says "the site is broken" or you see errors.

1. **Is it up?** Open `/api/health`.
   - `{"ok":true,"db":"up"}`: the site and database answer. The problem is in one page or flow.
   - 503 or `"db":"down"`: go to step 3.
   - No answer at all: Vercel is down or the deploy failed. Check https://www.vercel-status.com and the Deployments tab.
2. **Which page, which user?** Ask for the page address, the time, and the Reference code shown on the error screen.
3. **Check the logs.**
   - Vercel → project → Logs. Search `request_error`. Each line has the page path, route, error message and the Reference (digest).
   - Supabase → Logs → Postgres / API. Look for the same time window.
   - Supabase status: https://status.supabase.com. Free projects pause after 7 days with no activity: Dashboard → Restore project.
4. **Did it start after a deploy?** Compare the first error time with the latest deployment time. If yes, [roll back](deploy-and-rollback.md) first, investigate after.
5. **Money questions.** If a payment or payout looks wrong, do not edit data. See [payouts-and-refunds.md](payouts-and-refunds.md). The ledger is append-only: fixes are new entries.
6. **Tell users.** If it lasts more than 15 minutes, email affected users (support address on the Support page).
7. **Write it down.** Date, what happened, cause, fix, what to change so it does not repeat. Keep in `docs/incidents/`.

## Detail view of health
```
curl -s -H "Authorization: Bearer $CRON_SECRET" https://aircond-care.vercel.app/api/health
```
Shows `missingEnv` (names of unset variables) and `waiting` (open disputes, deletion requests, queued payouts).
Today `PAYMENT_GATEWAY` and `PAYMENT_WEBHOOK_SECRET` are expected to be missing until payments go live.

## Daily job
A Vercel Cron runs `/api/cron/settle` at 20:00 UTC (04:00 Malaysia). It closes completed bookings, queues payouts and sends service reminders. If bookings stay "completed" past the confirm window, check Vercel → Cron Jobs → last run, and that `CRON_SECRET` is set for Production.
