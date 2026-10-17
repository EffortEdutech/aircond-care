# Email on the Supabase free tier

Supabase's built-in email sender is for testing only
([docs](https://supabase.com/docs/guides/auth/auth-smtp)):

- It sends only to addresses that belong to your Supabase organisation's team. Anyone else gets "Email address not authorized".
- It sends about 2 emails per hour for the whole project. Supabase says this can change without notice.
- No delivery guarantee.

## What this means for the app

| Flow | Behaviour on the free sender | What we did |
| --- | --- | --- |
| Sign-up confirmation | Fails for outside addresses if "Confirm email" is on | For testing, turn off Authentication → Providers → Email → "Confirm email" |
| Forgot password | Email may not arrive | Page shows a warning. A rate-limit error gives a clear message. |
| Support fallback | | Admin → Users → "Set a temporary password" (service-role key needed) |

## Before the pilot

Add a custom SMTP sender (Resend, Brevo, Postmark, SES and similar) under Authentication → SMTP Settings,
then remove the warning on the forgot-password page and turn "Confirm email" back on.

Also add the site URL and `<site>/auth/callback` to Authentication → URL Configuration → Redirect URLs, or reset links will not work.
