# Aircond Care web app

Next.js (App Router, TypeScript, Tailwind) on Supabase. Mobile-first; customers use it on their phones.

## What is here (Sprint 1)

- Sign up, sign in, sign out (email and password). Confirmation link lands on `/auth/callback`.
- Profile: name, phone, language (English, Bahasa Melayu, 中文), notification choices.
- Addresses: add, edit, set default, delete.
- Unit registry: add, edit, archive, delete; nameplate photo taken or chosen on the phone, shrunk in the browser, stored in the private `unit-photos` bucket.
- Unit page with the service history timeline (empty until jobs are completed).

All data access runs as the signed-in user, so the database's row-level security decides what each person sees. The app never uses the service-role key.

## Run it

```bash
cd web
npm install
cp .env.example .env.local      # then fill in the Supabase URL and publishable key
npm run dev                     # http://localhost:3020
```

Checks before pushing: `npm run lint`, `npm run typecheck`, `npm run build`.

## Structure

```
src/
  proxy.ts                 Refreshes the session; sends signed-out visitors to /login
  lib/supabase/            Browser and server clients, generated database types
  lib/i18n.ts              English, Malay, Chinese strings (Malay and Chinese need native review)
  lib/units.ts             Unit types and form helpers
  components/ui.tsx        Inputs, buttons, cards
  app/(auth)/              Login, signup and their actions
  app/(app)/               Signed-in pages: units, addresses, account
  app/auth/callback/       Email confirmation
```

## Notes

- This Next.js version renamed `middleware` to `proxy` and ships its docs in `node_modules/next/dist/docs/`.
- Cache Components is off: every signed-in page is rendered per request.
- Fonts are the system fonts, so builds need no network and pages load fast on mobile data.
- Regenerate the database types after a migration: `npx supabase gen types typescript --project-id zxhuprfxibpaoblbdflu > src/lib/supabase/database.types.ts`.
- Phone-number sign-in needs an SMS provider in Supabase Auth. It is not switched on yet.
- Supabase's built-in email sender is limited to a few emails an hour. Fine for development; a real sender (SMTP) is needed before the pilot.
