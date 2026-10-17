import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service">
      <p>
        Aircond Care is a marketplace. It connects people who own air conditioners with independent servicing contractors. By creating an
        account you agree to these terms.
      </p>
      <h2>1. What we do and do not do</h2>
      <ul>
        <li>We provide the booking, messaging, payment and record-keeping tools.</li>
        <li>The service itself is carried out by the contractor you choose. The contractor, not Aircond Care, is responsible for the quality and safety of the work.</li>
        <li>We check each contractor&apos;s business documents before they can take bookings, but we do not supervise the work on site.</li>
      </ul>
      <h2>2. Your account</h2>
      <ul>
        <li>Give accurate details and keep your password private.</li>
        <li>You must be at least 18 years old to book a service or to register a business.</li>
        <li>You can ask us to delete your account from the Account page. We may keep records that the law or an open booking requires.</li>
      </ul>
      <h2>3. Bookings and prices</h2>
      <ul>
        <li>A booking is confirmed only when the contractor accepts it and you have paid.</li>
        <li>Prices are quoted by the contractor in Malaysian Ringgit. Extra work found on site needs your approval before it is charged.</li>
        <li>You can cancel or reschedule within the limits shown on the booking.</li>
      </ul>
      <h2>4. Payment and release of funds</h2>
      <ul>
        <li>You pay through the platform. The contractor is paid after the job is completed and you confirm it, or automatically after the confirmation period if you do nothing.</li>
        <li>If there is a problem you can open a dispute before the confirmation period ends. Payment stays on hold while a dispute is open.</li>
        <li>The platform keeps a commission from each paid job. The rate depends on the contractor&apos;s plan and is shown to the contractor.</li>
      </ul>
      <h2>5. Reviews</h2>
      <p>Reviews must be honest and based on a real job. We may remove reviews that are abusive, false or unrelated to the service.</p>
      <h2>6. Disputes</h2>
      <p>
        If you and a contractor cannot agree, either of you can ask us to look at it. We will review the messages and photos on the booking and
        decide whether to release, refund or split the payment. Our decision on the platform payment is final for the platform, and does not
        stop you from using other legal remedies.
      </p>
      <h2>7. Limits</h2>
      <p>
        To the extent the law allows, Aircond Care is not liable for damage caused by a contractor&apos;s work, and our total liability to you is
        limited to the amount you paid for the booking concerned.
      </p>
      <h2>8. Changes</h2>
      <p>We may update these terms. If the change is important we will ask you to accept it again.</p>
      <h2>9. Contact</h2>
      <p>
        Questions: see the <a className="text-sky-700 underline dark:text-sky-400" href="/support">support page</a>.
      </p>
    </LegalPage>
  );
}
