# Changelog

## 1.1.0 (unreleased)

Two audits of the live site and the code: flows, SEO, performance, CI and security.

### Fixed
- **Settings stopped loading after a day signed in.** The sessions list came from an endpoint that only answers sessions less than a day old, so the page failed from day 2 to day 7 of every session.
- **Open redirect.** A `callbackURL` like `/<tab>/example.com` passed the redirect guard, because browsers drop tabs and newlines from URLs. After a demo-mode sign-up, after 2FA, and from the "Email verified" page, a crafted link could send someone to another site.
- Signing up with an address that already had an account showed "Check your inbox" and sent nothing. The owner now gets an email saying so.
- `/verify-email` said "Email verified, you're signed in" to anyone who opened it.
- A session ended from another device made the next action fail with "Unauthorized". It now goes to sign-in and back.
- A refused Google or GitHub link landed on the auth library's built-in error page.
- Links between sign-in, sign-up and 2FA dropped the page you were going to.
- An admin page number past the end showed an empty list.
- Sign-in didn't work on Vercel preview deployments (the preview's own address wasn't trusted).
- A console error on every page: the Content Security Policy blocked a zod probe.
- Clicking "Sign in with a passkey" right after a page loaded could fail with a challenge mismatch.

### Added
- **Change your email**: the current address approves, the new address confirms. In demo mode it applies at once.
- **Emails for the owner**: a notice when the password changes or is reset, and a heads-up when someone tries to sign up with their address.
- **Admin → Set password…** for a user who is locked out; it signs them out everywhere.
- Error pages for a page that fails to load, with a retry.
- "Sign in again" on actions that need a recent sign-in (add a passkey, disconnect an account).
- robots.txt, sitemap.xml, canonical URLs, a share image, structured data, favicon, Apple icon and web manifest. Sign-in and account pages are `noindex`.
- `SECURITY.md`, `/.well-known/security.txt`, `CONTRIBUTING.md`, issue and pull request templates.

### Security
- While impersonating, an admin can't add a passkey, link an account, change the email, delete the account or sign out sessions.
- Session tokens are no longer sent to the Settings page; signing a device out goes by session id.
- Requests that take the current password (change password, delete account) are rate limited like sign-in.
- The API refuses a profile picture URL or an oversized name sent around the forms.
- `Cross-Origin-Opener-Policy: same-origin`; a tighter `Permissions-Policy`.
- Better Auth 1.7.25, Next.js 16.4.6, React 19.3.1. `pnpm audit` reports no known vulnerabilities.

### Performance
- Sign-in pages ship 72 KB less JavaScript: form validation uses `zod/mini` (the full build brought error messages in dozens of languages).
- One self-hosted Latin font (33 KB) in place of two families; CSS inlined; the sign-in popup and the 2FA QR code load on demand.
- Sign-in, sign-up and 2FA forms are in the prerendered HTML.
- Lighthouse mobile, 1.0.0 → 1.1.0: home 78 → 99, privacy 92 → 97, sign-in 85 → 94, sign-up 90 → 98.

### CI
- CodeQL on every pull request and weekly; a dependency audit that covers build tools too.
- Actions pinned to commits, a read-only token, timeouts, cached Playwright browsers, Dependabot.
- 65 browser tests (was 33) and 41 unit tests (was 33).

## 1.0.0 (2026-11-10)

The first stable release: a reusable auth starter for Next.js with a live demo at [getauthforge.vercel.app](https://getauthforge.vercel.app).

### Sign-in
- Email and password with email verification, password reset and breached-password checks (Have I Been Pwned).
- Google and GitHub sign-in, with automatic account linking only when both emails are verified.
- Two-factor authentication: authenticator apps, 10 one-time backup codes, trusted devices for 30 days.
- Passkeys (Face ID, Touch ID, Windows Hello, security keys), including browser autofill.
- Sign in from a popup on any page, or on the full /sign-in page.

### Accounts and admin
- Settings: profile, password change (signs out other devices), 2FA, passkeys, connected accounts, active sessions, delete account.
- Admin panel: case-insensitive search, roles, bans with a reason and length, sign out everywhere, impersonation, create and delete users.
- `ADMIN_EMAILS` gives listed addresses the admin role, only once the email is proven.

### Setup and deployment
- `pnpm env:setup` creates `.env` and lets you pick **Drizzle or Prisma**; the other one's files are removed.
- Demo mode (`REQUIRE_EMAIL_VERIFICATION=false`) for deployments without an email provider.
- One-click Vercel deploy; migrations run on production deploys.
- UI built with shadcn/ui, light and dark themes.

### Security
- Sessions are checked in the database on every request, so bans and sign-outs take effect at once.
- Database-backed rate limits (the sixth sign-in attempt in a minute is refused).
- Strict Content Security Policy and security headers; open-redirect guard on `callbackURL`.

### Quality
- 33 Playwright browser tests against two production builds (verification on, and demo mode).
- Unit tests, a schema drift check and a smoke test; CI runs the full pipeline for both Drizzle and Prisma.

### Fixes before 1.0
- A two-minute session cache kept revoked and banned sessions working (#4).
- Prisma search treated `%` and `_` as wildcards; Prisma saw a schema change that never went away (#7).
- The sign-in popup stayed open after pressing Back (#9).
- Clicking "Sign in with a passkey" as /sign-in loaded could fail with "Challenge not found" (#12).
