# Rotate keys and secrets

Rotate immediately if a key was pasted somewhere public, a laptop was lost, or a person with access leaves.

| Secret | Where it lives | How to rotate |
|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` (full access, bypasses all rules) | Vercel env, `web/.env.local` | Supabase → Project Settings → API Keys → create a new secret key, update Vercel (Production and Preview) and `.env.local`, redeploy, then delete the old key. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (safe to expose, limited by RLS) | Vercel env, `.env.local` | Same page; only rotate if abused. Update and redeploy. |
| Database password | Supabase → Database settings | Reset there. Update anything that uses the connection string (backup scripts). The site itself does not use it. |
| `CRON_SECRET` | Vercel env, `.env.local` | Generate a long random string, update Vercel (Production and Preview), redeploy. The Vercel cron picks it up automatically. |
| `PAYMENT_WEBHOOK_SECRET` | Vercel env, payment provider dashboard | Change in the provider first, then in Vercel at the same moment, redeploy. Payments arriving in the gap are retried by the provider; check `webhook_events` afterwards. |
| GitHub access | GitHub settings | Revoke the personal access token or deploy key, create a new one. |

After any rotation: `/api/health` with the cron secret should show `missingEnv` without new names, and a test sign-in should work.

Never put secrets in the repo, in chat, or in a variable that starts with `NEXT_PUBLIC_` (those are sent to every browser).
