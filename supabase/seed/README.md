# Test data

Two files, both safe to run more than once, both for development only.

| File | What it adds |
| --- | --- |
| `test_contractors.sql` | Three verified `[TEST]` contractors with service areas, call-out fees and price lists |
| `test_users.sql` | Seven accounts, their addresses and units, two bookings with chat |

Password for every account: `AircondTest#2026`

| Email | Role |
| --- | --- |
| test.customer1@example.test | Customer Aisyah: Petaling and Kuala Lumpur, 3 units, a booking with Cool Breeze |
| test.customer2@example.test | Customer Daniel: Klang and Gombak, 2 units, a repair request to Klang Air |
| test.owner1@example.test | Owner, Cool Breeze Aircond |
| test.owner2@example.test | Owner, Klang Air Specialists |
| test.owner3@example.test | Owner, Valley Cool Services |
| test.tech1@example.test | Technician, Cool Breeze Aircond |
| test.admin@example.test | Platform admin |

Contractor and admin screens arrive in Sprint 3 and 6. Until then these accounts exist so the data is in place.

Remove everything before the pilot: accounts ending in `@example.test`, and companies whose SSM number starts with `TEST-`.

## Full scenario set (test_full_dataset.sql)

Run after `test_contractors.sql` and `test_users.sql`. Safe to repeat. Same password for all accounts: `AircondTest#2026`.

New accounts: `test.customer3@example.test` (Sarah, KL condo, 2 units) and `test.tech2@example.test` (Kumar, technician at Valley Cool).

| Booking | Status | Who / what to try |
|---|---|---|
| 40…01, 02, 16 | requested | customer1 and customer2 (earlier seed), customer3 (marker) |
| 40…03 | quoted | customer1 to Cool Breeze: quote RM 155.00 waiting for the customer |
| 40…04 | awaiting_payment | customer1 to Cool Breeze, chemical wash |
| 40…05 | awaiting_payment | customer2 to Klang Air: repair quote accepted (RM 125.00) |
| 40…06 | paid | customer2 to Klang Air, payment held |
| 40…07 | scheduled | customer3 to Valley Cool, technician Kumar, tomorrow |
| 40…08 | in_progress | customer1 to Cool Breeze, tech1, draft job report |
| 40…09 | completed | customer2 to Valley Cool, awaiting confirmation (confirm or dispute) |
| 40…10 | closed | payout queued, 5-star review with company reply |
| 40…11 | closed | payout paid, 3-star review, gas top-up report |
| 40…12 | disputed | customer3 vs Valley Cool, under review, messages |
| 40…13 | refunded | dispute decided by admin, full refund |
| 40…14 | declined | customer1, reason "Fully booked that day" |
| 40…15 | cancelled | customer2, reason "Changed plans" |

Also seeded: held payments with ledger entries, commission and gateway fee on payouts, 5 final job reports (with parts and photo records), service reminders created on finalise, company documents (approved, pending, rejected), subscriptions (Pro active, Starter active, Starter past due) with invoices, notifications, audit log rows.

Notes: photo and document rows point at file paths that do not exist in Storage, so images will show as missing. Payments use the placeholder gateway `test-gateway`.
