import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { SUPPORT } from "@/lib/legal";

export const metadata: Metadata = { title: "Support" };

export default function SupportPage() {
  return (
    <LegalPage title="Support">
      <p>
        Email <a className="text-sky-700 underline dark:text-sky-400" href={`mailto:${SUPPORT.email}`}>{SUPPORT.email}</a>. Put your booking number in the subject if you
        have one.
      </p>
      <h2>How fast we reply</h2>
      <ul>
        <li>First reply to a question: within {SUPPORT.firstResponse}.</li>
        <li>Dispute decision: within {SUPPORT.disputeResponse} of both sides sharing what happened.</li>
        <li>Support hours: Monday to Friday, 9am to 6pm Malaysia time, excluding public holidays.</li>
      </ul>
      <h2>Quick answers</h2>
      <ul>
        <li><strong>Problem with a job:</strong> open the booking and choose Report a problem before the confirmation period ends.</li>
        <li><strong>Forgot your password:</strong> use Forgot password on the sign-in page. If the email does not arrive, write to us and we will set a temporary password.</li>
        <li><strong>Delete your account or download your data:</strong> both are on the Account page.</li>
        <li><strong>Contractor documents rejected:</strong> the reason is shown next to the document. Upload a corrected file.</li>
      </ul>
    </LegalPage>
  );
}
