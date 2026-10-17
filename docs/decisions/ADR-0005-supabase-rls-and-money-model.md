# ADR-0005: Supabase Postgres, with rules in the database

- **Status:** Accepted
- **Date:** 2026-10-16
- **Source:** [Database overview](../database/README.md)

## Decision

1. The database is Supabase Postgres. The rules that matter (who can see what, which status changes are allowed, how money is calculated) live in the database as row-level security, triggers and functions, not only in application code.
2. Clients write through narrow column grants and functions. Booking status, prices, ratings and verification cannot be set directly by a customer or a contractor.
3. Money is stored as integer sen. Commission is stored in basis points and copied onto the booking when it is paid.
4. Every money movement is a row in an append-only ledger. A settled booking must sum to zero.
5. A final job report is immutable. Corrections are new reports that supersede the old one.

## Context

Customers' equipment history is the asset the product is built on, and the platform holds customers' money. Both need protection that does not depend on every client being correct. Supabase gives each user a database identity, so row-level security can express the access rules directly.

## Consequences

- Any client (web, mobile, scripts) gets the same protection.
- Business logic is in SQL, so changes are migrations and need tests. A suite of 109 checks covers the workflow and access rules.
- Payment webhooks, payouts and scheduled jobs must run with the service role on the server.
- Policies that call helper functions must also check ownership directly where a row is read straight after insert, otherwise `INSERT ... RETURNING` fails. The tests caught this on units and bookings.
- Generated columns are not available inside BEFORE triggers, so triggers compute totals from their parts.
