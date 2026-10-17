import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = { title: "Refund Policy" };

export default function RefundsPage() {
  return (
    <LegalPage title="Refund Policy">
      <h2>Before the job</h2>
      <ul>
        <li>If the contractor declines or cannot attend, you get a full refund.</li>
        <li>If you cancel before the job starts, the refund depends on how close to the appointment you cancel. The exact terms are shown on the booking before you pay.</li>
      </ul>
      <h2>After the job</h2>
      <ul>
        <li>Check the work and confirm it. Payment is released to the contractor when you confirm, or automatically after the confirmation period.</li>
        <li>If the work was not done, was done badly, or the price differs from what was agreed, open a dispute before the confirmation period ends.</li>
        <li>While a dispute is open the payment stays on hold. We review the messages and photos and decide on a full refund, a partial refund, or release to the contractor.</li>
      </ul>
      <h2>How refunds are paid</h2>
      <p>
        Refunds go back to the original payment method. Banks and payment providers can take several working days to show the money.
      </p>
      <h2>Things that are not refunded</h2>
      <ul>
        <li>Work you approved and confirmed, unless a fault shows up that the contractor agreed to cover.</li>
        <li>Faults in parts or equipment that the contractor told you about before starting.</li>
      </ul>
    </LegalPage>
  );
}
