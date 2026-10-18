# Runbooks

One page per situation. Each says what you will see, what to do, and how to check it worked.
Written for the owner running the platform alone on the free tiers (Supabase free, Vercel hobby).

| Situation | Guide |
|---|---|
| Is the site up? Something looks broken | [incident-checklist.md](incident-checklist.md) |
| Bad deploy, need to go back | [deploy-and-rollback.md](deploy-and-rollback.md) |
| Back up the database, restore it | [backup-and-restore.md](backup-and-restore.md) |
| A key or secret leaked or must be changed | [rotate-keys.md](rotate-keys.md) |
| A user cannot sign in, wants deletion, wrong data | [user-support.md](user-support.md) |
| Pay contractors, stuck payout, refund by hand | [payouts-and-refunds.md](payouts-and-refunds.md) |

Quick links
- Health: `https://aircond-care.vercel.app/api/health` (add header `Authorization: Bearer <CRON_SECRET>` for detail)
- Admin: `/admin` (Disputes, Bookings, Reviews, Users, Deletion requests, Audit log, Payout batch)
- Vercel project: aircond-care. Supabase project: zxhuprfxibpaoblbdflu.
