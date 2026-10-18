# End-to-end tests (Playwright)

Written but **not yet run**: they were drafted without a browser against the live site, so expect to adjust a selector or two on the first run.
They use the seeded test accounts (`test.*@example.test`, password in `tests/helpers.ts`).

## Run
```
cd e2e
npm install
npx playwright install chromium
npm test                       # against https://aircond-care.vercel.app
BASE_URL=http://localhost:3020 npm test   # against a local `npm run dev` in ../web
npm run report                 # open the HTML report after a run
```

## What is covered
| File | Checks |
|---|---|
| `public.spec.ts` | Public pages load, draft banner, terms checkbox, `/api/health`, no sideways scroll on a phone |
| `access.spec.ts` | Signed-out redirect, customer/owner blocked from admin, admin allowed, wrong password |
| `journey.spec.ts` | Request → contractor accepts and schedules → sandbox payment → another customer cannot open it |

## What is not covered (do by hand, see the test checklist)
Technician job report with photos, customer confirm, dispute with photos and admin decision, payout batch, account deletion, Malay/Chinese text.

## Notes
- The journey test creates one real booking in the test project per run. Clean up later with the test-data removal step before the pilot.
- Sandbox payments need `PAYMENT_GATEWAY=sandbox` and `PAYMENT_WEBHOOK_SECRET` set in Vercel. They are still missing, so the pay step will fail until they are added.
- Customer 1 must have at least one unit and an address inside the contractor's areas.
- Sign-in uses the email limits of Supabase's free plan only for sign-up and reset; password login in these tests is not limited.
