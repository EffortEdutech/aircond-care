# User support

Answer within the times promised on the Support page (first reply 2 working days).

## Cannot sign in / reset email did not arrive
Supabase free email sends about 2 per hour and only to team addresses until custom email is set up.
1. Admin → **Users** → "Set a temporary password". Enter their email and a 10+ character password.
2. Send them the password by a private message (not the same channel as the email). Ask them to change it at Account after signing in.
3. If sign-up confirmation never arrives, the same page works once the account exists. Turn on custom email before the pilot (see `docs/email-limits.md`).

## Delete my account
Account → "Request account deletion" creates a request. Admin → **Deletion requests**.
- *Approve and delete* clears name, phone and email, removes company memberships and closes the sign-in. It is refused while the user has open bookings: wait until they finish or are cancelled, or help them cancel.
- *Reject* needs a reason the user will see.
Payment and booking records stay (accounting), without personal details.

## Download my data
Account → "Download my data". If they cannot, sign in as admin is not needed: ask them to try again or send the file after generating it with them.

## Contractor documents
Admin (home page) lists companies and documents. Approve, reject with a note, or suspend a company with a reason. A suspended company cannot take bookings.

## Bad review
Admin → **Reviews** → remove with a written reason. The company rating updates.

## Dispute
Admin → **Disputes**. Read the thread and photos, decide: release to contractor, full refund, or partial refund, and write a note both sides can see. See [payouts-and-refunds.md](payouts-and-refunds.md) for the money side.

## Find out what happened
Admin → **Audit log**. Search by action word, by the person's email, or by a booking or company ID.
