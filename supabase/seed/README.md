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
