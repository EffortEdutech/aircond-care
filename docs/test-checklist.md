# Test checklist by role

Sign in with the seed accounts (password `AircondTest#2026`). Use a phone-sized window for at least one pass. Tick a line only when you saw it work. Write what you saw next to anything that fails (page, what you clicked, message shown, the Reference code if there is one).

**Payment note:** payment is deferred, so "Pay now" shows "Online payment is not switched on yet" unless the sandbox gateway is on. To test everything after payment, set `PAYMENT_GATEWAY=sandbox` and `PAYMENT_WEBHOOK_SECRET` on a **preview** deployment only (see `docs/PAYGATE_INTEGRATION_PLAN.md`). Lines marked **[needs sandbox]** depend on that.

## Public (signed out)
- [ ] Home, Terms, Privacy, Refunds, Contractor terms, Support all open and show the draft banner.
- [ ] /units, /bookings, /work, /admin send you to sign-in.
- [ ] Wrong password shows an error and stays on sign-in.
- [ ] Sign-up refuses without the terms box ticked.
- [ ] Tab key: first Tab shows "Skip to content", Enter jumps to the page body.

## Customer (test.customer1@example.test)
- [ ] My units: 3 units listed; open one and see its service history.
- [ ] Add a unit (with a nameplate photo); it appears; archive it.
- [ ] Addresses: add one with an area; edit; delete.
- [ ] Find contractor: list shows verified contractors only; open a profile (prices, areas, reviews).
- [ ] Book: pick address, pick services for two units, add a note, send. Booking shows "Requested".
- [ ] Book a repair (needs a quote) and see "waiting for quote".
- [ ] Accept a quote; decline another quote.
- [ ] Chat with the contractor on a booking; the other side gets an alert.
- [ ] Cancel a booking before payment; reason is saved.
- [ ] **[needs sandbox]** Pay; booking becomes Paid; receipt opens.
- [ ] **[needs sandbox]** After the job is completed: confirm the job, leave a review.
- [ ] **[needs sandbox]** Report a problem instead: open a dispute, add a message with a photo.
- [ ] Rebook from a unit page: the form arrives with unit and service preselected.
- [ ] Alerts page: unread count drops when opened. Turn off "Alerts in the app" on Account and check chat alerts stop.
- [ ] Account: change name and phone; download my data works; request account deletion, then cancel it.
- [ ] Another customer's booking address (try pasting its URL as customer1): shows not found.
- [ ] Switch language to Malay and Chinese: menus change, nothing is cut off.

## Contractor owner (test.owner1@example.test, Cool Breeze)
- [ ] Workspace opens; incoming requests listed; filter by status works.
- [ ] Accept a fixed-price request; send a quote on a repair; decline with a reason.
- [ ] **[needs sandbox]** Schedule the visit after payment (choose a technician); start the job.
- [ ] **[needs sandbox]** Job report per unit (readings, photos, notes), then Mark completed.
- [ ] Reply to a review publicly.
- [ ] Company page: edit profile, prices, service areas, upload a document.
- [ ] Team: add a technician; on the starter company (owner2) adding past the limit is refused.
- [ ] Earnings: totals match the bookings that were paid and closed.
- [ ] Plan page: Pro and Business show "Coming soon".
- [ ] Cannot open /admin. Cannot see another company's bookings (paste a URL from owner2's company).

## Technician (test.tech1@example.test)
- [ ] Sees only jobs assigned to them. Can start a job and fill reports. Cannot see earnings or team.

## Contractor on a suspended or past-due company (owner3, Valley Cool)
- [ ] Sees the reason; cannot take new bookings; customers do not see them in Find contractor.

## Admin (test.admin@example.test)
- [ ] Home lists pending contractors and documents; verify one; reject one with a note; suspend one with a reason.
- [ ] Bookings list opens fast (about a second) and filters by status.
- [ ] Disputes: read the thread with photos; decide (release / full refund / partial).
- [ ] Reviews: remove one with a reason.
- [ ] Users: set a temporary password for a user, sign in with it.
- [ ] Deletion requests: approve one with no open bookings; one with open bookings is refused.
- [ ] Audit log: search by action, email, ID and dates; paging works.
- [ ] Payout batch: CSV downloads (empty is fine without payments).
- [ ] /api/health with the cron secret: `missingEnv` only lists payment variables.

## Automatic jobs
- [ ] Vercel → Cron Jobs: the daily settle job ran in the last 24 hours with no error.
- [ ] A completed job auto-confirms after 48 hours and the payout is queued **[needs sandbox]**.
- [ ] Service reminders reach customers whose unit is due.

## Failures
Send me the list of lines that failed with what you saw. The Playwright suite in `e2e/` covers the signed-out, access and booking-request checks.
