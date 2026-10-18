# Connecting Aircond Care to the Central Payment Hub (PayGate, Stripe)

Status: plan only. Nothing in PayGate or Stripe was changed. Read from `C:\Users\user\Documents\00 Payment Gateway` on 2026-10-18.

## What PayGate does today
- Apps never touch Stripe. They call PayGate with `app_id`, `user_ref`, `plan_key`; PayGate decides amount, currency and Stripe price from its **registry**.
- Plans can be `subscription` or `one_time`, with a **fixed** price in the registry.
- Entitlements (what the user paid for) are written only from verified Stripe webhooks, never from the browser return.
- Providers: Stripe only. Capabilities: hosted checkout, portal, subscriptions, refunds (partial), webhooks. **Not** listed: Stripe Connect, transfers, payouts, holding funds, dynamic amounts.
- New apps are onboarded through the PayGate admin UI workspace, then a reviewed registry apply. No shortcuts, no app-owned Stripe code.
- Pattern to copy: MyExpensio's thin client (Tracks 6O/6P): a server route forwards the user's Supabase token to PayGate; a feature flag keeps the old path as rollback.

## Aircond Care has two different money flows

| Flow | Shape | Fits PayGate today? |
|---|---|---|
| **A. Contractor plans** (Pro, Business) | Fixed monthly price, entitlement = plan features | **Yes.** Same as MyExpensio Pro. |
| **B. Booking payments** | Variable amount per job (menu price or quote + call-out fee), held until the customer confirms, 10% commission kept, rest paid to the contractor, partial refunds after disputes | **No, not as-is.** PayGate refuses an app-supplied amount, has no per-job order concept (item checkout is sandbox-only and fixed SKUs), and cannot split or pay out. |

## Flow A: what to do (no PayGate code change needed)
1. Onboard `aircond_care` in PayGate's admin workspace (Stage 0 intake below).
2. Plans: `pro_monthly`, `business_monthly` (prices from our `subscription_plans`), entitlement keys such as `aircond_care.team_10`, `aircond_care.priority_listing` (final list when we confirm what Pro/Business include).
3. PayGate must trust our JWT: Aircond Care uses Supabase Auth, same as MyExpensio. Add our Supabase project's JWT routing in PayGate's env (PayGate side, operator action).
4. In Aircond Care: a thin client (`lib/paygate/*`) + a "Upgrade plan" route behind a flag `PAYGATE_CHECKOUT_ENABLED`, and an entitlement read that updates `company_subscriptions`. `user_ref` = the company owner's user id, or a company id prefixed (decide at intake; company id is better because the plan belongs to the company).
5. Sandbox proof first (Stripe test mode), as in Track 6Q. Live only with your explicit approval gate.

## Flow B: three options (decision needed)

**B1. Extend PayGate with "attested one-off orders" (recommended).**
Aircond Care signs a request (HMAC with a per-app secret) containing `booking_id`, `amount_minor`, `currency`, expiry. PayGate verifies the signature, checks the amount against registry limits (min/max per app), creates Stripe Checkout (payment mode), and on the verified webhook tells us "paid". Refunds (full/partial) go through PayGate. Money lands in your Stripe balance; **payouts to contractors stay as our weekly bank-transfer batch** (already built: payout batch CSV + ledger). No Connect needed.
- Pros: smallest change; matches how we already work; keeps Stripe logic out of the app.
- Cons: needs a PayGate change, so it needs a documented PayGate track and your approval under its own governance rules (new capability, "attested amount" is a deliberate change to the rule that apps cannot set amounts).
- Our adapter side is small: `lib/payments/gateway.ts` already has the boundary (`checkoutUrl`, `verify`); add a PayGate adapter next to `sandbox`.

**B2. Stripe Connect (marketplace) through PayGate.**
Contractors onboard to Stripe, funds split automatically, payouts by Stripe.
- Pros: automatic payouts, contractors see Stripe dashboards.
- Cons: biggest PayGate extension; **I have not verified whether Stripe Connect is available for a Malaysian platform with Malaysian connected accounts, nor the fees**: check with Stripe before choosing this. Holding funds until confirmation needs separate charges and transfers, with time limits.

**B3. Keep the sandbox until a different gateway is chosen for bookings.**
Use PayGate for plans only. Booking payments use a local Malaysian gateway (FPX, DuitNow) later through our adapter. Cheaper for FPX in Malaysia; still needs the same legal review.

## Legal flag (both B1 and B2)
Collecting customers' money and releasing it to contractors later is holding funds for a third party. Ask the lawyer (already on the deferred list) whether this needs a licence or a regulated partner in Malaysia, and what the refund wording must say. This can change which option is allowed.

## Stage 0 intake sheet for `aircond_care` (PayGate runbook)
- App name: Aircond Care. `app_id`: `aircond_care`.
- Billing entity / provider account alias: ______ (which company's Stripe account receives the money; the MyExpensio plan used `nhl_global_solution`).
- Test URL: https://aircond-care.vercel.app. Live URL: ______ (custom domain not set).
- Auth: Supabase (project `zxhuprfxibpaoblbdflu`), JWT sub = user id.
- `user_ref`: company id (recommended) or owner user id.
- First plans: Pro monthly RM ___, Business monthly RM ___ (currently "Coming soon" in the app).
- Entitlement keys: ______.
- Support email / refund policy owner: myeffort.studio@gmail.com.

## What I can do next without touching PayGate or Stripe
1. Build the thin client and the flagged upgrade route for Flow A, off by default, with tests against a mocked PayGate.
2. Add the PayGate adapter skeleton to `lib/payments/gateway.ts` for Flow B1, off by default.
3. Write the B1 proposal as a PayGate track document for you to review in the PayGate repo.
