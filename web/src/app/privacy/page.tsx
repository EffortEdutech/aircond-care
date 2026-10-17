import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { SUPPORT } from "@/lib/legal";

export const metadata: Metadata = { title: "Privacy Notice" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Notice">
      <p>
        This notice explains what personal data Aircond Care collects, why, and what you can do about it. It is written with Malaysia&apos;s
        Personal Data Protection Act 2010 in mind.
      </p>
      <h2>What we collect</h2>
      <ul>
        <li>Account details: name, email, phone number, preferred language.</li>
        <li>Service addresses, and details of your air conditioners (brand, model, photos of the nameplate, service history).</li>
        <li>Bookings, messages, photos you upload, reviews and dispute records.</li>
        <li>Payment records (amounts, status, references). We do not store full card numbers; the payment provider handles those.</li>
        <li>For contractors: business registration details and uploaded documents.</li>
        <li>Basic technical logs, such as sign-in times, used to keep the service secure.</li>
      </ul>
      <h2>Why we use it</h2>
      <ul>
        <li>To run bookings, payments and payouts.</li>
        <li>To remind you when a unit is due for service.</li>
        <li>To prevent fraud and to resolve disputes.</li>
        <li>To meet legal and accounting duties.</li>
      </ul>
      <h2>Who sees it</h2>
      <ul>
        <li>The contractor you book sees the details needed to do the job: your name, phone, address and the unit.</li>
        <li>Our platform administrators can see bookings, messages and documents when handling a dispute or verifying a contractor.</li>
        <li>Service providers that run our systems (hosting, database, payment, messaging) process data for us under their own terms.</li>
        <li>We do not sell your data.</li>
      </ul>
      <h2>How long we keep it</h2>
      <p>
        We keep account data while your account is open. Financial and booking records are kept for as long as accounting law requires, even
        after an account is deleted, but they are then stripped of your name and contact details.
      </p>
      <h2>Your choices</h2>
      <ul>
        <li>Download a copy of your data from the Account page.</li>
        <li>Correct your details on the Account page.</li>
        <li>Choose how you receive updates (email, push, WhatsApp).</li>
        <li>Ask us to delete your account from the Account page.</li>
      </ul>
      <h2>Cookies</h2>
      <p>We use only the cookies needed to keep you signed in and to remember your language. We do not use advertising cookies.</p>
      <h2>Contact</h2>
      <p>
        Write to {SUPPORT.email}. We reply within {SUPPORT.firstResponse}.
      </p>
    </LegalPage>
  );
}
