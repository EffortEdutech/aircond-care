# Accessibility and language review (2026-10-18)

Code-level review of the web app. No screen reader or browser audit was run; do the checks in the last section on a phone before the pilot.

## Already good
- Page language is set on `<html lang>` from the chosen locale (en / ms / zh).
- Every form field sits inside a `<label>` (the shared `Field` component), so screen readers announce it; unlabeled inputs carry `aria-label`.
- Error and info banners use `role="alert"` / `role="status"`, so they are announced.
- Inputs show a visible focus ring; text size is 16px+ on inputs (no iOS zoom); buttons are at least 44px tall on key actions.
- The one `<img>` (unit nameplate) has meaningful alt text. Dispute photo thumbnails are shown with alt text.
- Light and dark modes both defined. Hint text uses zinc-500 on white (about 4.8:1, passes AA for normal text).

## Gaps to fix (small, none blocking a pilot)
1. **No "skip to content" link.** Keyboard users tab through the header on every page. Add a link at the top of `layout.tsx` and an `id="main"` on each page's `<main>`.
2. **Dispute photos: alt text is generic.** Fine for now; a caption field would help.
3. **Colour is the only cue in a few status chips** (e.g. paid vs pending). The word is also shown, so it is acceptable, but check in grayscale.
4. **Date-time inputs** (`datetime-local`) vary by browser/phone. Check on iPhone Safari and Android Chrome.
5. **Error screen** (`error.tsx`) is English only.

## Language coverage
The translation table (`lib/i18n.ts`) covers navigation, sign-in, units, addresses and common buttons in English, Bahasa Melayu and Chinese. **Most newer pages are English only:** booking and quote screens, contractor workspace, disputes, admin, notifications, plan page, and all legal pages (Terms, Privacy, Refunds, Contractor terms, Support).

Needs a native-speaker review before showing to Malay or Chinese users:
- Existing ms and zh strings in `lib/i18n.ts` (written by AI, never checked by a native speaker).
- Anything newly translated. Legal text should be translated by the lawyer, not by us, and the English version must say which one prevails.

Suggested order for translating: booking flow and booking status words (customer-facing) first, then notification texts, then contractor screens. Admin can stay English.

## Phone checks to do by hand (15 minutes)
- Open sign-up, a booking, and a dispute on a small phone (320 to 360 px wide): nothing cut off, nothing needs sideways scrolling.
- Tab through the login form and the booking form with a keyboard: order makes sense, focus always visible.
- Turn on VoiceOver or TalkBack for the login page and the booking page: fields are read with their names, errors are announced.
- Browser zoom to 200%: still usable.
- Switch language to Malay and Chinese: no cut-off or overflow in buttons and headings.
