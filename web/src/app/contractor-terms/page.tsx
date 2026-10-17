import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = { title: "Contractor Agreement" };

export default function ContractorTermsPage() {
  return (
    <LegalPage title="Contractor Agreement">
      <p>This agreement applies to businesses that offer servicing through Aircond Care, in addition to the Terms of Service.</p>
      <h2>1. Independent business</h2>
      <p>You operate your own business. You are not an employee or agent of Aircond Care. You are responsible for your staff, tools, insurance, licences and taxes.</p>
      <h2>2. Verification</h2>
      <ul>
        <li>You must give truthful business details and upload valid SSM registration, business licence, insurance and owner identity documents.</li>
        <li>You can take bookings only after an administrator approves your documents. We may suspend you if documents expire or are found to be false.</li>
      </ul>
      <h2>3. Doing the work</h2>
      <ul>
        <li>Work must be done with reasonable skill and care, by competent people, and in line with the law.</li>
        <li>Tell the customer about extra work and costs before doing it, and get their approval in the app.</li>
        <li>Record what you did, including photos and parts used, so the customer&apos;s unit history stays accurate.</li>
      </ul>
      <h2>4. Fees and payouts</h2>
      <ul>
        <li>The platform keeps a commission on each paid job. The rate depends on your plan and is shown on your plan page and each booking.</li>
        <li>You are paid after the customer confirms the job or the confirmation period ends, in the weekly payout run. Money under dispute is held until the dispute is decided.</li>
        <li>You are responsible for issuing any invoices or tax documents your customers need.</li>
      </ul>
      <h2>5. Plans</h2>
      <p>The Starter plan is free and lets you work alone. Paid plans with more team members and lower commission are planned and will be announced before they start.</p>
      <h2>6. Conduct</h2>
      <p>Do not take customers off the platform to avoid commission on a booking that started here. Do not post fake reviews or ask customers to remove honest ones.</p>
      <h2>7. Ending the agreement</h2>
      <p>You can close your account at any time once your open bookings are finished. We may suspend or end your account for serious or repeated breaches.</p>
    </LegalPage>
  );
}
