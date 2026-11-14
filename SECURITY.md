# Security

Authforge is an authentication starter, so security reports get priority.

## Reporting a vulnerability

Please don't open a public issue for a security problem.

Report it privately through GitHub: **[Report a vulnerability](https://github.com/Shahryartariq/authforge/security/advisories/new)** (the "Security" tab of the repository). Include:

- what the problem is and what someone could do with it,
- the steps or a small script to reproduce it,
- the commit or release you tested.

You can expect a first reply within 3 days. If the report is confirmed, the fix is released first and the advisory is published afterwards, with credit to you unless you'd rather not be named.

The live demo (getauthforge.vercel.app) is in scope. Please test with your own accounts, and don't run automated scanners or load tests against it.

## Supported versions

Fixes go into the latest release on `main`. This is a starter you copy into your own project, so apply the fix from the changelog or the linked commit to your copy.

## What the project does to stay secure

- Sessions are checked in the database on every request. Signing out, changing a password, and bans take effect at once.
- Sign-in, sign-up, password reset, two-factor, passkey and password-confirming requests are rate limited in the database, so the limits hold across serverless instances.
- Passwords are hashed with scrypt, limited to 8–128 characters, and checked against known breaches (Have I Been Pwned, by k-anonymity: the password never leaves the server).
- Two-factor secrets and backup codes are stored encrypted.
- Post-sign-in redirects only accept same-site paths.
- Sign-up, password reset and "resend verification" answer the same way whether or not an account exists.
- The owner is emailed when their password changes, when someone tries to sign up with their address, and to approve an email change.
- While an admin impersonates a user, the account's sign-in methods can't be changed.
- Session tokens are never sent to page scripts: the session cookie is `HttpOnly`, `Secure` and `SameSite=Lax`, and Settings lists sessions by id only.
- A Content Security Policy, HSTS, `frame-ancestors 'none'` and related headers are set on every response (`next.config.ts`).
- CI runs a dependency audit, CodeQL and the full browser test suite on every pull request. Secret scanning with push protection is on for the repository.

## Known trade-offs

- **`script-src 'unsafe-inline'`.** Next.js prerendered pages carry inline scripts, and a nonce-based policy would force every page to render on each request. The app never renders user-supplied HTML, and `object-src 'none'` and `base-uri 'self'` are set. If you need a strict policy, see the Next.js guide on nonces.
- **Rate limits use the client IP from `X-Forwarded-For`.** On Vercel that header is set by the platform. If you host it yourself, put it behind a proxy that overwrites the header; otherwise a client can change its apparent address.
- **Demo mode** (`REQUIRE_EMAIL_VERIFICATION=false`) lets anyone register any address without proving it. It exists for the public demo. Keep verification on for a real app.
- **Passkey and Google/GitHub sign-ins don't ask for a two-factor code.** A passkey is already a strong second factor, and the provider handles its own. Two-factor protects password sign-ins.
- **Admins are fully trusted.** An admin can set any user's password or delete any account.
