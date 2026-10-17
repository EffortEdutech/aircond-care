# ADR-0006: Web app on Vercel, one Supabase project until the pilot

- **Status:** Accepted
- **Date:** 2026-10-17
- **Source:** Sprint 0 decisions

## Decision

1. The product is a web app that works well on phones (Next.js, TypeScript), deployed on Vercel. A native mobile app is not planned for the first release.
2. During development there is one Supabase project, Aircond Care. There is no separate staging project yet, because there are no real users or real data.
3. Development uses the free tiers of Vercel and Supabase. Before the closed pilot (Sprint 9) both move to paid plans and a staging project is added.
4. Every schema change is a migration file in `supabase/migrations`, so a staging or replacement project can be rebuilt from the repository.

## Context

- Vercel's Hobby plan is limited to non-commercial personal use. Its guidelines treat any site that requests or processes payment as commercial, so a live marketplace needs the Pro plan ([Vercel fair use guidelines](https://vercel.com/docs/limits/fair-use-guidelines)). Building on Hobby before launch is fine.
- Supabase's free plan pauses a project after one week of inactivity, includes no automatic backups or point-in-time recovery, and allows two active projects. The Pro plan starts at $25 a month, never pauses, and keeps seven days of daily backups ([Supabase pricing](https://supabase.com/pricing)).
- A second project would only protect production from experiments. Until real people use the product there is nothing in production to protect, and the migrations can rebuild the schema at any time.

## Consequences

- Cost before the pilot is zero. From the pilot on, plan for Vercel Pro and Supabase Pro, plus a second Supabase project for staging.
- A free Supabase project can pause if it sits idle for a week. Open the dashboard or run a query to wake it.
- No backups exist on the free plan. Treat the data as disposable until Pro is on.
- Test accounts created in development must be deleted before real users arrive.
- A native app can be added later against the same database; nothing here prevents it.
