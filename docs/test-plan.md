# Aircond Care test plan

Site: https://aircond-care.vercel.app  
All test accounts use the password `{PW}` and the email `<name>@example.test`.

## Before you start

1. Use Chrome or Safari. Open the site in a private window per role, or sign out between roles.
2. Do the sections in order. Mark every case Pass, Fail, Blocked or Skip.
3. Cases tagged **once** use up a seeded booking. If it has already moved on, mark Blocked and tell the developer to reseed.
4. Cases tagged **pay** only work when the sandbox payment gateway is on. Payment is switched off now, so skip them.
5. Cases tagged **mail** depend on an email arriving.
6. Always reinstate a company you suspend (J4).

## Test accounts

| Email | Role | Notes |
|---|---|---|
| test.customer1@example.test | Customer | Three units, addresses in areas 1 and 3 |
| test.customer2@example.test | Customer | Bookings with Valley Cool (completed, paid) |
| test.customer3@example.test | Customer | Disputed booking |
| test.owner1@example.test | Contractor owner | Cool Breeze, Pro plan |
| test.owner2@example.test | Contractor owner | Klang Air Specialists, Starter plan |
| test.owner3@example.test | Contractor owner | Valley Cool Services |
| test.tech1@example.test | Technician | Cool Breeze, jobs AC-2610-000012 and 14 |
| test.tech2@example.test | Technician | Jobs AC-2610-000011 |
| test.admin@example.test | Platform admin | Admin pages |

## Seed bookings (single use)

| Booking | Status | Used by |
|---|---|---|
| AC-2610-000007 | Quoted | E1 accept quote |
| AC-2610-000008 | Awaiting payment | M0 payment-off message |
| AC-2610-000010 | Paid | F6 owner2 schedules |
| AC-2610-000011 | Scheduled | G3 tech2 starts |
| AC-2610-000012 | In progress | H1-H3 tech1 report and complete |
| AC-2610-000013 | Completed | H4-H5 customer2 confirms and reviews |
| AC-2610-000015 | Paid | H7 receipt |
| AC-2610-000016 | Disputed | I2, I3, J6 dispute |

## Reporting a defect

Write: case ID, what you did, what you expected, what happened, a screenshot, device and browser. Severity:

- **Blocker**: Cannot continue, wrong data shown to the wrong person, or money wrong.
- **Major**: A feature does not work, no workaround.
- **Minor**: Works but is confusing, ugly or slow.
- **Text**: Spelling, wording or translation.

## A. Public pages and sign-in

Use a private/incognito window, signed out.

### A1 Public pages open
Who: Signed out

1. Open /, /terms, /privacy, /refunds, /contractor-terms and /support one by one.

**Expected:** Every page opens with a heading. The four legal pages show a notice that they are a draft. Footer links between them work.

Result: [ ] Pass  [ ] Fail  [ ] Blocked  [ ] Skip  Notes: ______

### A2 Signed-out visitors are sent to sign-in
Who: Signed out

1. Open /units, /bookings, /work, /admin and /account one by one.

**Expected:** Each one goes to the sign-in page. No data is shown.

Result: [ ] Pass  [ ] Fail  [ ] Blocked  [ ] Skip  Notes: ______

### A3 Wrong password
Who: Signed out

1. Open /login.
2. Enter test.customer1@example.test with a wrong password and sign in.

**Expected:** An error message appears and you stay on the sign-in page.

Result: [ ] Pass  [ ] Fail  [ ] Blocked  [ ] Skip  Notes: ______

### A4 Sign in and sign out
Who: test.customer1

1. Sign in as test.customer1@example.test.
2. Check you land on My units.
3. Click Sign out.
4. Press the browser Back button.

**Expected:** After sign-out you are on the sign-in page. Back does not show customer data.

Result: [ ] Pass  [ ] Fail  [ ] Blocked  [ ] Skip  Notes: ______

### A5 Sign-up needs the terms box and a long password
Who: Signed out

1. Open /signup.
2. Fill name, a new email and a 5-character password; leave the terms box unticked; submit.
3. Tick the terms box, keep the short password; submit.

**Expected:** Both attempts are refused (browser or page message). Nothing is created.

Result: [ ] Pass  [ ] Fail  [ ] Blocked  [ ] Skip  Notes: ______

### A6 Create a new account `mail`
Who: Your own email

1. Open /signup and fill your full name, your own email (a +alias works, e.g. you+tester1@gmail.com) and a password of 8+ characters.
2. Tick the terms box and submit.
3. If asked to confirm your email, open the email and click the link.

**Expected:** You end up signed in (or asked to confirm email first). The Account page shows your name. Note how long any email took.

Result: [ ] Pass  [ ] Fail  [ ] Blocked  [ ] Skip  Notes: ______

### A7 Forgot password `mail`
Who: Your own account from A6

1. Open /forgot-password and enter your email.
2. Wait up to 10 minutes for the email (the free email plan sends only about 2 per hour).
3. If it arrives, open the link, set a new password, sign in with it.

**Expected:** Page says the email was sent. If the email arrives, the new password works. If nothing arrives in 10 minutes, mark Blocked and tell the developer.

Result: [ ] Pass  [ ] Fail  [ ] Blocked  [ ] Skip  Notes: ______

### A8 Skip-to-content link
Who: Any page

1. On the sign-in page press the Tab key once.
2. Press Enter.

**Expected:** A 'Skip to content' link appears first and moves focus to the form.

Result: [ ] Pass  [ ] Fail  [ ] Blocked  [ ] Skip  Notes: ______

## B. My account

Sign in as test.customer1@example.test unless stated.

### B1 Change name and phone
Who: test.customer1

1. Open Account.
2. Change the full name to 'Aisyah Tester' and add a phone number.
3. Click Save.
4. Refresh the page.

**Expected:** The new values are still there. Change the name back afterwards.

Result: [ ] Pass  [ ] Fail  [ ] Blocked  [ ] Skip  Notes: ______

### B2 Switch language
Who: test.customer1

1. Open Account and choose Bahasa Melayu as the language, then save.
2. Look at the top menu and the Units page.
3. Do the same with 中文.
4. Switch back to English.

**Expected:** Menu and main labels change language each time and nothing is cut off. Pages not yet translated stay in English; note which ones.

Result: [ ] Pass  [ ] Fail  [ ] Blocked  [ ] Skip  Notes: ______

### B3 In-app alerts setting
Who: test.customer1

1. Open Account and find 'Alerts in the app'. Turn it off and save.
2. Refresh the page.
3. Turn it on again and save.

**Expected:** The setting is remembered after refresh.

Result: [ ] Pass  [ ] Fail  [ ] Blocked  [ ] Skip  Notes: ______

### B4 Download my data
Who: test.customer1

1. Open Account, find 'Your data' and click the download link.

**Expected:** A file downloads. It contains your profile, units, addresses and bookings, and nothing about other customers.

Result: [ ] Pass  [ ] Fail  [ ] Blocked  [ ] Skip  Notes: ______

### B5 Request and cancel account deletion
Who: Your own account from A6

1. Open Account and find 'Delete my account'.
2. Optionally enter a reason and click 'Request account deletion'.
3. Check that the page says the request is waiting.
4. Click 'Cancel the request'.

**Expected:** The request shows as waiting, then disappears when cancelled.

Result: [ ] Pass  [ ] Fail  [ ] Blocked  [ ] Skip  Notes: ______

## C. Units and addresses

Sign in as test.customer1@example.test. Customer 1 has three units: Living room, Master bedroom (both wall split) and Shop floor (ceiling cassette).

### C1 Units list
Who: test.customer1

1. Open My units.

**Expected:** The three units are listed with their type.

Result: [ ] Pass  [ ] Fail  [ ] Blocked  [ ] Skip  Notes: ______

### C2 Add a unit
Who: test.customer1

1. On My units click to add a unit.
2. Fill the form: a nickname 'Tester unit', type Wall split, brand and model if asked. Save.

**Expected:** The unit appears in the list and its page opens.

Result: [ ] Pass  [ ] Fail  [ ] Blocked  [ ] Skip  Notes: ______

### C3 Unit page and history
Who: test.customer1

1. Open 'Living room'.
2. Read the Details, Nameplate photo, History and 'Contractors who can see this unit' sections.

**Expected:** Details are correct. History lists past jobs. Contractors listed are only ones that have worked on or been given access to this unit.

Result: [ ] Pass  [ ] Fail  [ ] Blocked  [ ] Skip  Notes: ______

### C4 Nameplate photo
Who: test.customer1

1. Open 'Tester unit' (from C2).
2. Upload a photo from your phone or computer in the Nameplate photo section.

**Expected:** The photo uploads and shows on the page. A very large file is shrunk or politely refused, not an error screen.

Result: [ ] Pass  [ ] Fail  [ ] Blocked  [ ] Skip  Notes: ______

### C5 Archive and restore a unit
Who: test.customer1

1. Open 'Tester unit' and click Archive.
2. Check it left the main list.
3. Find archived units, open it and click Restore.

**Expected:** Archived units disappear from booking forms; Restore brings it back.

Result: [ ] Pass  [ ] Fail  [ ] Blocked  [ ] Skip  Notes: ______

### C6 Delete a unit
Who: test.customer1

1. Open 'Tester unit' and delete it (confirm if asked).

**Expected:** The unit is removed. A unit with booking history cannot be deleted (it can only be archived) and says so.

Result: [ ] Pass  [ ] Fail  [ ] Blocked  [ ] Skip  Notes: ______

### C7 Addresses
Who: test.customer1

1. Open Addresses.
2. Add an address with a label, street line and an area.
3. Edit it.
4. Delete it.

**Expected:** Add, edit and delete each work. The two existing addresses (Shop in area 1, Home in area 3) are untouched.

Result: [ ] Pass  [ ] Fail  [ ] Blocked  [ ] Skip  Notes: ______

## D. Finding a contractor and booking

Sign in as test.customer1@example.test. Contractors: Cool Breeze (serves area 1), Klang Air Specialists (areas 3 and 4), Valley Cool Services (areas 1, 5, 6).

### D1 Find a contractor
Who: test.customer1

1. Open 'Find contractor'.
2. Search without filters, then pick a service and an area.

**Expected:** Only verified contractors serving that area are listed. Each card shows rating and price from.

Result: [ ] Pass  [ ] Fail  [ ] Blocked  [ ] Skip  Notes: ______

### D2 Contractor profile
Who: test.customer1

1. Open [TEST] Cool Breeze Aircond.

**Expected:** You see about text, 'Services and prices', 'Areas and call-out fee' and Reviews. General service on a wall split is RM80.00 and chemical wash RM180.00. Repair shows 'quote'.

Result: [ ] Pass  [ ] Fail  [ ] Blocked  [ ] Skip  Notes: ______

### D3 Book a fixed-price service
Who: test.customer1

1. On the Cool Breeze profile click Book.
2. Choose address 'Shop'.
3. For Living room choose General service; for Master bedroom choose Chemical wash; leave Shop floor as 'Not this unit'.
4. Add a note: 'Guard post at the gate'. Click 'Send request'.

**Expected:** A booking opens with status Requested. Services total RM260.00 plus call-out RM20.00 gives RM280.00 (compare to what the page shows and report any difference). Cooling the request does not charge you.

Result: [ ] Pass  [ ] Fail  [ ] Blocked  [ ] Skip  Notes: ______

### D4 Book needs at least one service
Who: test.customer1

1. Open the Cool Breeze booking form.
2. Leave every unit as 'Not this unit' and click 'Send request'.

**Expected:** The request is refused with a message. No booking is created.

Result: [ ] Pass  [ ] Fail  [ ] Blocked  [ ] Skip  Notes: ______

### D5 Address outside the contractor's area
Who: test.customer1

1. Open the booking form for Klang Air Specialists.
2. Look at the address list.

**Expected:** Only the address in a Klang area (Home) can be chosen. The Shop address is not offered.

Result: [ ] Pass  [ ] Fail  [ ] Blocked  [ ] Skip  Notes: ______

### D6 Book a repair (quote needed)
Who: test.customer1

1. Book Cool Breeze, pick Repair for one unit.
2. In 'What is wrong' write 'Not cold, water leaking'. Send request.

**Expected:** Booking shows Requested and says the contractor will send a quote. No price is charged yet.

Result: [ ] Pass  [ ] Fail  [ ] Blocked  [ ] Skip  Notes: ______

### D7 Rebook from a unit
Who: test.customer1

1. Open 'Shop floor'. If a 'Book again' link is shown, click it.

**Expected:** The booking form opens with the same contractor, the unit and the service already selected.

Result: [ ] Pass  [ ] Fail  [ ] Blocked  [ ] Skip  Notes: ______

### D8 Bookings list
Who: test.customer1

1. Open Bookings.

**Expected:** All your bookings are listed with status colours. You see only your own.

Result: [ ] Pass  [ ] Fail  [ ] Blocked  [ ] Skip  Notes: ______

## E. Quotes, chat and cancelling

Use the seeded bookings below. They can be used once; tick them in the 'Data used' list.

### E1 Quote: view and accept `once`
Who: test.customer1

1. Open Bookings and open AC-2610-000007 (status Quoted, Cool Breeze).
2. Read the Quote section.
3. Click 'Accept quote'.

**Expected:** The quote lines and price are shown. After accepting, status becomes Awaiting payment and a 'Pay now' button appears.

Result: [ ] Pass  [ ] Fail  [ ] Blocked  [ ] Skip  Notes: ______

### E2 Quote: decline
Who: test.customer1

1. Send a new repair request to Cool Breeze (as in D6). Switch to the contractor (test.owner1), open it and send a quote (see F5).
2. Back as test.customer1 open that booking and decline the quote.

**Expected:** Declining returns the booking to a state where the contractor can send a new quote, or closes it. Note which.

Result: [ ] Pass  [ ] Fail  [ ] Blocked  [ ] Skip  Notes: ______

### E3 Chat both ways
Who: test.customer1, then test.owner1

1. As test.customer1 open your Requested booking from D3 and send a message in Chat.
2. Sign out. Sign in as test.owner1@example.test, open Workspace, open the same booking, check the message and reply.
3. Sign back in as test.customer1.

**Expected:** The owner sees your message, you see the reply. The unread Alerts counter goes up for the other person and drops after opening Alerts.

Result: [ ] Pass  [ ] Fail  [ ] Blocked  [ ] Skip  Notes: ______

### E4 Cancel before payment
Who: test.customer1

1. Open your D3 or D6 booking while it is still Requested.
2. Enter a reason in 'Cancellation reason' and click the cancel button.

**Expected:** Status becomes Cancelled and the reason is shown. The contractor sees it as cancelled.

Result: [ ] Pass  [ ] Fail  [ ] Blocked  [ ] Skip  Notes: ______

### E5 Contractor declines
Who: test.owner1

1. As test.owner1 open a new request, type a reason in 'Reason for declining' and click Decline.
2. Check as the customer.

**Expected:** Status Declined with the reason visible to the customer.

Result: [ ] Pass  [ ] Fail  [ ] Blocked  [ ] Skip  Notes: ______

## F. Contractor workspace (owner)

Sign in as test.owner1@example.test (Cool Breeze, Pro plan) unless stated.

### F1 Workspace list
Who: test.owner1

1. Open Workspace (top menu).

**Expected:** Bookings are grouped: Needs your reply, To schedule, Coming up and on site, Waiting on the customer, Finished. Counts match what you see.

Result: [ ] Pass  [ ] Fail  [ ] Blocked  [ ] Skip  Notes: ______

### F2 Accept at listed price
Who: test.owner1

1. Open the new D3 booking from the list.
2. Click 'Accept at listed price (RM...)'.

**Expected:** Status becomes Awaiting payment. The customer is told to pay. No money is moved.

Result: [ ] Pass  [ ] Fail  [ ] Blocked  [ ] Skip  Notes: ______

### F3 Decline with a reason
Who: test.owner1

1. Open another Requested booking.
2. Type a reason and click Decline.

**Expected:** Status Declined. The reason is required.

Result: [ ] Pass  [ ] Fail  [ ] Blocked  [ ] Skip  Notes: ______

### F4 Cannot accept a repair at a listed price
Who: test.owner1

1. Open the D6 repair booking.

**Expected:** There is no 'Accept at listed price' button. You can send a quote instead.

Result: [ ] Pass  [ ] Fail  [ ] Blocked  [ ] Skip  Notes: ______

### F5 Send a quote
Who: test.owner1

1. Open the D6 repair booking and click 'Send a quote'.
2. Add a line: Kind = labour, Note 'Replace drain hose', Price 60.00, Quantity 1. Add a second line: parts, Price 25.00.
3. Send the quote.

**Expected:** Customer sees the quote total (call-out fee plus lines) and can accept or decline.

Result: [ ] Pass  [ ] Fail  [ ] Blocked  [ ] Skip  Notes: ______

### F6 Schedule a paid booking `once`
Who: test.owner2 (Klang)

1. Sign in as test.owner2@example.test and open AC-2610-000010 (Paid).
2. Pick a start date and time in the future, hours 2, choose a technician (the owner is the only team member), click 'Confirm schedule'.

**Expected:** Status becomes Scheduled. Customer 2 gets an alert.

Result: [ ] Pass  [ ] Fail  [ ] Blocked  [ ] Skip  Notes: ______

### F7 Company settings: profile
Who: test.owner1

1. Open Workspace, then Company settings.
2. In Profile change About, phone, email and click 'Save profile'.
3. Open Find contractor as a customer and check the profile.

**Expected:** Changes appear on the public profile. Change them back afterwards.

Result: [ ] Pass  [ ] Fail  [ ] Blocked  [ ] Skip  Notes: ______

### F8 Services and prices
Who: test.owner1

1. In Company settings go to 'Services and prices'.
2. Add a service: General service, unit type Ceiling concealed, price RM120. Click 'Add service'.
3. Check the public profile.
4. Remove the service.

**Expected:** The price shows publicly, then disappears after removal.

Result: [ ] Pass  [ ] Fail  [ ] Blocked  [ ] Skip  Notes: ______

### F9 Service areas
Who: test.owner1

1. Go to 'Where you work'. Add an area with a call-out fee of RM15 and click 'Add area'.
2. Remove it.

**Expected:** Customers with an address in that area can book while it exists.

Result: [ ] Pass  [ ] Fail  [ ] Blocked  [ ] Skip  Notes: ______

### F10 Team and plan limit
Who: test.owner1, test.owner2

1. As test.owner1 (Pro) open Team and add an existing user by email as technician. Remove them again if possible.
2. As test.owner2 (Starter) try to add members until the plan limit is reached.

**Expected:** Pro allows more members. Starter refuses past its limit with a clear message about the plan.

Result: [ ] Pass  [ ] Fail  [ ] Blocked  [ ] Skip  Notes: ______

### F11 Verification documents
Who: test.owner1

1. Open 'Verification documents' in Company settings.
2. Upload a small PDF or photo as a test document.

**Expected:** The file uploads and is listed. It is not visible to customers.

Result: [ ] Pass  [ ] Fail  [ ] Blocked  [ ] Skip  Notes: ______

### F12 Plan page
Who: test.owner1

1. Open Workspace, then Your plan.

**Expected:** Shows the current plan and commission rate. Pro and Business appear as 'Coming soon' where not yet available.

Result: [ ] Pass  [ ] Fail  [ ] Blocked  [ ] Skip  Notes: ______

### F13 Earnings
Who: test.owner1

1. Open Earnings.

**Expected:** Sections 'Waiting for the customer to confirm' and 'Payouts' show only your company's money. The totals agree with the closed bookings.

Result: [ ] Pass  [ ] Fail  [ ] Blocked  [ ] Skip  Notes: ______

### F14 Register a new company
Who: Your own account from A6

1. Sign in as your own tester account.
2. Open /work/onboard ('Register your company').
3. Enter a trading name, registered name, SSM number, email and phone. Click 'Create workspace'.

**Expected:** A workspace is created in 'Not verified yet' state and appears in the admin approval list (see J2).

Result: [ ] Pass  [ ] Fail  [ ] Blocked  [ ] Skip  Notes: ______

## G. Technician

Technicians see only the jobs assigned to them.

### G1 My jobs
Who: test.tech1

1. Sign in as test.tech1@example.test.
2. Open Workspace.

**Expected:** The page is titled 'My jobs' and lists only AC-2610-000012 and AC-2610-000014. No earnings or team controls.

Result: [ ] Pass  [ ] Fail  [ ] Blocked  [ ] Skip  Notes: ______

### G2 Technician cannot see other companies' jobs
Who: test.tech1

1. Copy the address of a Klang booking page from test.owner2 (/work/...) and paste it while signed in as tech1.

**Expected:** Not found or no access. No data from Klang is shown.

Result: [ ] Pass  [ ] Fail  [ ] Blocked  [ ] Skip  Notes: ______

### G3 Start a scheduled job `once`
Who: test.tech2

1. Sign in as test.tech2@example.test and open AC-2610-000011 (Scheduled).
2. Click 'Start job'.

**Expected:** Status becomes In progress.

Result: [ ] Pass  [ ] Fail  [ ] Blocked  [ ] Skip  Notes: ______

## H. Finishing a job

These use jobs already in the right state in the seed data, so no payment is needed.

### H1 Job report: draft and photos
Who: test.tech1

1. Sign in as test.tech1, open AC-2610-000012 (In progress).
2. Under 'Job reports' click 'Start report' for the unit.
3. Fill Work done, Findings, Refrigerant, Gas added (grams), Supply and Return air, Current (A). Click 'Save draft'.
4. Add a before photo and an after photo.

**Expected:** Draft saves. Photos upload and show as thumbnails. Leaving and re-opening keeps the data.

Result: [ ] Pass  [ ] Fail  [ ] Blocked  [ ] Skip  Notes: ______

### H2 Job report: finalise and sign-off `once`
Who: test.tech1

1. Open the report again. Enter 'Customer sign-off: name of the person on site' and a 'Next service on' date. Click 'Finalise report'.

**Expected:** The report becomes final and read-only; the link says View. Editing again would create a new version, not change the old one.

Result: [ ] Pass  [ ] Fail  [ ] Blocked  [ ] Skip  Notes: ______

### H3 Mark job completed `once`
Who: test.owner1 or test.tech1

1. Open AC-2610-000012 again.
2. Click 'Mark job completed'.

**Expected:** Refused until every unit has a final report. After finalising it works and status becomes Completed. The customer is told they have 48 hours.

Result: [ ] Pass  [ ] Fail  [ ] Blocked  [ ] Skip  Notes: ______

### H4 Customer confirms the job `once`
Who: test.customer2

1. Sign in as test.customer2@example.test and open AC-2610-000013 (Completed, Valley Cool).
2. Read the Job report. Click 'Confirm job is done'.

**Expected:** Status becomes Closed. The review form 'How was the service?' appears.

Result: [ ] Pass  [ ] Fail  [ ] Blocked  [ ] Skip  Notes: ______

### H5 Leave a review
Who: test.customer2

1. On the closed booking choose a rating, add a comment and click 'Send review'.

**Expected:** The review shows on the contractor's public page. A second review on the same booking is not possible.

Result: [ ] Pass  [ ] Fail  [ ] Blocked  [ ] Skip  Notes: ______

### H6 Contractor replies to the review
Who: test.owner3

1. Sign in as test.owner3@example.test and open the same booking.
2. Type a public reply and click 'Post reply'.

**Expected:** The reply appears under the review on the public profile.

Result: [ ] Pass  [ ] Fail  [ ] Blocked  [ ] Skip  Notes: ______

### H7 Receipt
Who: test.customer2

1. On a paid booking (for example AC-2610-000015) click 'View receipt'.

**Expected:** A receipt opens with the booking number, lines, call-out fee, total and payment reference.

Result: [ ] Pass  [ ] Fail  [ ] Blocked  [ ] Skip  Notes: ______

## I. Problems and disputes

Photos must be JPG, PNG or WebP, up to 5 MB each, up to 4 per message.

### I1 Report a problem `once`
Who: test.customer3

1. Use a Completed booking that is still waiting. If none is left, ask the developer to reseed. Sign in as the customer, type a reason in 'What is wrong?' and click 'Report a problem'.

**Expected:** Status becomes Disputed and a dispute thread opens.

Result: [ ] Pass  [ ] Fail  [ ] Blocked  [ ] Skip  Notes: ______

### I2 Dispute thread with photos
Who: test.customer3

1. Open AC-2610-000016 (Disputed).
2. Write a message and attach 2 photos. Send.
3. Try attaching 5 photos.

**Expected:** The message and 2 thumbnails appear. More than 4 photos are refused with a message.

Result: [ ] Pass  [ ] Fail  [ ] Blocked  [ ] Skip  Notes: ______

### I3 Contractor responds
Who: test.owner3

1. Sign in as test.owner3, open the disputed booking and reply with a photo.

**Expected:** Reply shows to the customer and admin. The contractor cannot decide the dispute.

Result: [ ] Pass  [ ] Fail  [ ] Blocked  [ ] Skip  Notes: ______

### I4 Auto-confirm after 48 hours
Who: Developer

1. Ask the developer to check that a Completed booking older than 48 hours closed by itself after the daily job (04:00 Malaysia time).

**Expected:** Booking is Closed and the payout is queued. Marked Blocked if no such booking exists.

Result: [ ] Pass  [ ] Fail  [ ] Blocked  [ ] Skip  Notes: ______

## J. Admin

Sign in as test.admin@example.test.

### J1 Admin home
Who: test.admin

1. Open Admin.

**Expected:** Lists companies and documents waiting for review, plus a payments check section.

Result: [ ] Pass  [ ] Fail  [ ] Blocked  [ ] Skip  Notes: ______

### J2 Verify a company
Who: test.admin

1. Open the company you registered in F14 and look at its documents.
2. Approve a document, then verify the company (the button stays disabled until the required documents are approved).

**Expected:** The company becomes Verified and appears in Find contractor.

Result: [ ] Pass  [ ] Fail  [ ] Blocked  [ ] Skip  Notes: ______

### J3 Reject a document with a note
Who: test.admin

1. Reject a document and write a review note.

**Expected:** The contractor sees the note on their Company settings page.

Result: [ ] Pass  [ ] Fail  [ ] Blocked  [ ] Skip  Notes: ______

### J4 Suspend and reinstate
Who: test.admin

1. Suspend [TEST] Valley Cool Services with a reason.
2. As test.owner3 check the workspace; as a customer check Find contractor.
3. Reinstate the company.

**Expected:** While suspended: owner3 sees 'Suspended' and the reason, and the company is hidden from customers. After reinstating it all returns. Always reinstate.

Result: [ ] Pass  [ ] Fail  [ ] Blocked  [ ] Skip  Notes: ______

### J5 Bookings list
Who: test.admin

1. Open All bookings. Filter by status.

**Expected:** The list opens in about a second and filters correctly.

Result: [ ] Pass  [ ] Fail  [ ] Blocked  [ ] Skip  Notes: ______

### J6 Decide a dispute: refund `once`
Who: test.admin

1. Open Disputes, then AC-2610-000016.
2. Read the thread and contractor report.
3. Choose Outcome 'Full refund', write a 'Note to both sides', click 'Record decision'.

**Expected:** The dispute closes, the booking becomes Refunded, and both sides see the note.

Result: [ ] Pass  [ ] Fail  [ ] Blocked  [ ] Skip  Notes: ______

### J7 Decide a dispute: partial refund `once`
Who: test.admin

1. Use another disputed booking (create one with I1 first).
2. Choose a partial outcome and enter a refund amount in RM.

**Expected:** An amount above the booking total is refused. A valid amount records a partial refund.

Result: [ ] Pass  [ ] Fail  [ ] Blocked  [ ] Skip  Notes: ______

### J8 Remove a review
Who: test.admin

1. Open Reviews, pick one, enter a reason and click Remove.

**Expected:** The review disappears from the public page and the contractor rating updates.

Result: [ ] Pass  [ ] Fail  [ ] Blocked  [ ] Skip  Notes: ______

### J9 Set a temporary password
Who: test.admin

1. Open Users.
2. Enter your A6 tester email and a temporary password of 10+ characters, click 'Set password'.
3. Sign in with it.

**Expected:** Sign-in works. This is the fallback when reset emails do not arrive.

Result: [ ] Pass  [ ] Fail  [ ] Blocked  [ ] Skip  Notes: ______

### J10 Deletion requests
Who: test.admin

1. Make a deletion request from your A6 account (B5, do not cancel it).
2. As admin open 'Deletion requests'.
3. Click 'Approve and delete'. Try to approve one for a user with open bookings.

**Expected:** The request without open bookings is approved: name, phone and email are cleared and sign-in stops working. One with open bookings is refused.

Result: [ ] Pass  [ ] Fail  [ ] Blocked  [ ] Skip  Notes: ______

### J11 Audit log
Who: test.admin

1. Open Audit log.
2. Search 'Action contains' = dispute. Search by an email. Search by a booking ID. Use From/To dates. Page through.

**Expected:** Each search narrows the list correctly and the actions from J2, J4, J6 appear.

Result: [ ] Pass  [ ] Fail  [ ] Blocked  [ ] Skip  Notes: ______

### J12 Payout batch
Who: test.admin

1. Open Payout batch.
2. Download the CSV.

**Expected:** A CSV downloads (empty is fine without payments). Rows, when present, show company, bank details and amount.

Result: [ ] Pass  [ ] Fail  [ ] Blocked  [ ] Skip  Notes: ______

### J13 Health check
Who: Developer

1. Open /api/health in a browser.

**Expected:** Shows ok and db up. With the secret header it also lists missing settings (only the payment ones until payments are set up).

Result: [ ] Pass  [ ] Fail  [ ] Blocked  [ ] Skip  Notes: ______

## K. Privacy and isolation

Each check pastes an address from one person into another person's session. Expect 'not found' or a redirect, never someone else's data.

### K1 Customer cannot open another customer's booking
Who: test.customer1

1. As test.customer2 copy the address of AC-2610-000009.
2. Sign in as test.customer1 and paste it.

**Expected:** Not found.

Result: [ ] Pass  [ ] Fail  [ ] Blocked  [ ] Skip  Notes: ______

### K2 Customer cannot open another customer's unit
Who: test.customer1

1. Copy a unit address from test.customer2 (/units/...).
2. Paste it as test.customer1.

**Expected:** Not found.

Result: [ ] Pass  [ ] Fail  [ ] Blocked  [ ] Skip  Notes: ______

### K3 Contractor cannot see another company
Who: test.owner1

1. Copy a /work/... address from test.owner2.
2. Paste it as test.owner1.

**Expected:** Not found.

Result: [ ] Pass  [ ] Fail  [ ] Blocked  [ ] Skip  Notes: ______

### K4 Contractor sees a customer's unit only if booked
Who: test.owner1

1. Open a booking from customer 1 and look at the unit.
2. Try a unit address of customer 2.

**Expected:** Only units on bookings with your company (or shared with you) open.

Result: [ ] Pass  [ ] Fail  [ ] Blocked  [ ] Skip  Notes: ______

### K5 Non-admins cannot reach admin pages
Who: test.customer1, test.owner1

1. Paste /admin, /admin/users, /admin/audit as each user.

**Expected:** Redirect or not found. No admin data.

Result: [ ] Pass  [ ] Fail  [ ] Blocked  [ ] Skip  Notes: ______

### K6 Private photos are private
Who: Any

1. Copy the address of a nameplate or dispute photo from the page.
2. Open it in a private window where you are signed out.

**Expected:** It does not load, or the link has expired. Photos are never public.

Result: [ ] Pass  [ ] Fail  [ ] Blocked  [ ] Skip  Notes: ______

### K7 Signed-out files
Who: Signed out

1. Try /account/export and /admin/payouts/export while signed out.

**Expected:** Redirect to sign-in. No file.

Result: [ ] Pass  [ ] Fail  [ ] Blocked  [ ] Skip  Notes: ______

## L. Phone, keyboard, languages

Do these on a real phone as well as a computer.

### L1 Phone layout
Who: Phone

1. On a phone open sign-in, My units, a booking, the booking form and Workspace.

**Expected:** No sideways scrolling. Buttons are easy to tap. Nothing is cut off.

Result: [ ] Pass  [ ] Fail  [ ] Blocked  [ ] Skip  Notes: ______

### L2 Take a photo from the phone
Who: Phone

1. On a phone add a nameplate photo using the camera.

**Expected:** The camera opens, the photo uploads and shows.

Result: [ ] Pass  [ ] Fail  [ ] Blocked  [ ] Skip  Notes: ______

### L3 Keyboard only
Who: Computer

1. Without the mouse sign in, open the booking form and send a request using Tab, Space and Enter.

**Expected:** Focus is always visible and the order makes sense.

Result: [ ] Pass  [ ] Fail  [ ] Blocked  [ ] Skip  Notes: ______

### L4 Zoom 200%
Who: Computer

1. Press Ctrl and + until the browser shows 200%. Open the booking page.

**Expected:** Still usable without overlapping text.

Result: [ ] Pass  [ ] Fail  [ ] Blocked  [ ] Skip  Notes: ______

### L5 Dark mode
Who: Phone or computer

1. Switch the device to dark mode and open three pages.

**Expected:** Text is readable everywhere; no white boxes with white text.

Result: [ ] Pass  [ ] Fail  [ ] Blocked  [ ] Skip  Notes: ______

### L6 Malay and Chinese read-through
Who: A native speaker

1. Switch to each language and read the menu, My units, Addresses and Account.

**Expected:** Wording is natural and correct. Write wrong or odd phrases in the notes.

Result: [ ] Pass  [ ] Fail  [ ] Blocked  [ ] Skip  Notes: ______

## M. Payment (run only when the sandbox gateway is on)

Skip this whole section unless the developer says the sandbox is switched on. Without it 'Pay now' shows 'Online payment is not switched on yet', which is the expected current behaviour.

### M0 Payment off message
Who: test.customer1

1. Open an Awaiting payment booking, for example AC-2610-000008, and click 'Pay now'.

**Expected:** The page returns with the message 'Online payment is not switched on yet.' (expected while payment is off).

Result: [ ] Pass  [ ] Fail  [ ] Blocked  [ ] Skip  Notes: ______

### M1 Pay successfully `pay` `once`
Who: test.customer1

1. Click 'Pay now', choose a payment method, then on the test page click 'Pay successfully'.

**Expected:** Back on the booking: status Paid and the receipt link appears.

Result: [ ] Pass  [ ] Fail  [ ] Blocked  [ ] Skip  Notes: ______

### M2 Pay fails `pay` `once`
Who: test.customer1

1. Start another payment and choose the failing button on the test page.

**Expected:** Status stays Awaiting payment and the customer can try again.

Result: [ ] Pass  [ ] Fail  [ ] Blocked  [ ] Skip  Notes: ______

### M3 Full journey `pay` `once`
Who: test.customer1, test.owner1, test.tech1

1. Request, accept, pay, schedule (owner picks tech1), start, report and finalise, mark completed, customer confirms, review, owner replies.

**Expected:** Each step moves the status forward. Earnings show the job as waiting, then paid out after confirmation.

Result: [ ] Pass  [ ] Fail  [ ] Blocked  [ ] Skip  Notes: ______

### M4 Money check `pay`
Who: test.admin

1. After M3 open Admin, 'Payments check'.

**Expected:** Every row says balanced. Commission matches the plan percentage.

Result: [ ] Pass  [ ] Fail  [ ] Blocked  [ ] Skip  Notes: ______
