# ADR-0007: Customer money is held and settled by a registered payment gateway

- **Status:** Proposed (needs legal confirmation before Sprint 4)
- **Date:** 2026-10-17
- **Source:** Sprint 0 research, "Holding customer funds in Malaysia"
- **Refines:** [ADR-0004](ADR-0004-platform-held-payments.md)

## Decision

1. All customer payments still go through the platform (ADR-0004), but the platform does not keep customer money in its own bank account.
2. Payments are taken by a payment gateway registered with Bank Negara Malaysia (BNM) as a merchant acquirer. The gateway settles to contractors and to the platform, and the platform tells it when to release.
3. If no gateway can hold a payment until the job closes, the fallback is a segregated or trust account set up with legal advice.
4. A Malaysian lawyer confirms the design before Sprint 4 starts.

## Context

- Merchant acquiring must be registered with BNM when an entity contracts with merchants, transfers funds to them and is a direct participant in a payment network. BNM looks at the activity, not the name the business uses ([BNM FAQ](https://www.bnm.gov.my/documents/20124/57659/FAQ+for+Application+to+Provide+Merchant+Acquiring+Services.pdf)).
- Issuing electronic money needs BNM approval, and issuers must keep collected funds in a trust or separate account ([Skrine](https://www.skrine.com/insights/newsletter/april-2019/is-cash-still-king), 2019).
- It is not clear from public sources whether a marketplace in this position counts, so the safe route is to let a registered party do the collecting and settling.
- Not yet known: whether any gateway can hold an FPX payment until instructed. That is the first question for each provider. Candidates: CHIP, Billplz, Stripe Connect.

## Consequences

- No schema change. A payment marked `held` means held by the gateway, and payouts already wait for the booking to close.
- Gateway choice moves earlier: questions go out in Sprint 0 and 1, and the choice is made at the end of Sprint 3.
- The payout design (weekly batch) may change to follow what the gateway supports.
- Customer and contractor terms must describe the arrangement. The lawyer should draft or review them.
- Full research and the question lists are in the Claude document "Holding customer funds in Malaysia: options and recommendation".
