/** Bump when the Terms or Privacy Notice change in a way users must re-accept. */
export const TERMS_VERSION = "2026-10-draft";

/** Shown on every legal page until a lawyer has reviewed the text. */
export const LEGAL_IS_DRAFT = true;

/** Support promise shown on the support page. Keep in step with what the team can actually meet. */
export const SUPPORT = {
  email: "myeffort.studio@gmail.com",
  firstResponse: "2 working days",
  disputeResponse: "5 working days",
} as const;
