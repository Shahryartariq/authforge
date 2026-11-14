import { site } from "@/lib/site";

const escape = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function layout({ heading, body, cta, url, footer }: {
  heading: string;
  body: string;
  cta: string;
  url: string;
  footer: string;
}) {
  const safeUrl = escape(url);
  const html = `<!doctype html>
<html><body style="margin:0;background:#f4f4f5;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#18181b">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:12px;padding:32px">
        <tr><td style="font-size:14px;font-weight:600;letter-spacing:.02em;color:#71717a">${escape(site.name)}</td></tr>
        <tr><td style="padding-top:16px;font-size:22px;font-weight:600">${escape(heading)}</td></tr>
        <tr><td style="padding-top:12px;font-size:15px;line-height:1.6;color:#3f3f46">${escape(body)}</td></tr>
        <tr><td style="padding-top:24px">
          <a href="${safeUrl}" style="display:inline-block;background:#18181b;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:8px;font-size:15px;font-weight:500">${escape(cta)}</a>
        </td></tr>
        <tr><td style="padding-top:24px;font-size:13px;line-height:1.6;color:#71717a">
          Or paste this link into your browser:<br><a href="${safeUrl}" style="color:#52525b;word-break:break-all">${safeUrl}</a>
        </td></tr>
        <tr><td style="padding-top:24px;border-top:1px solid #e4e4e7;margin-top:24px;font-size:12px;color:#a1a1aa">${escape(footer)}</td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
  const text = `${heading}\n\n${body}\n\n${cta}: ${url}\n\n${footer}`;
  return { html, text };
}

export const verifyEmailTemplate = (name: string, url: string) => ({
  subject: `Verify your email for ${site.name}`,
  ...layout({
    heading: `Welcome, ${name || "there"}`,
    body: "Confirm your email address to finish setting up your account. The link expires in 1 hour.",
    cta: "Verify email",
    url,
    footer: "If you didn't create an account, you can ignore this email.",
  }),
});

export const resetPasswordTemplate = (name: string, url: string) => ({
  subject: `Reset your ${site.name} password`,
  ...layout({
    heading: "Reset your password",
    body: `Hi ${name || "there"}, we received a request to reset your password. The link expires in 1 hour and can be used once.`,
    cta: "Choose a new password",
    url,
    footer: "If you didn't ask for this, you can ignore this email. Your password won't change.",
  }),
});

export const deleteAccountTemplate = (name: string, url: string) => ({
  subject: `Confirm deleting your ${site.name} account`,
  ...layout({
    heading: "Delete your account?",
    body: `Hi ${name || "there"}, confirm below to permanently delete your account and all its data. This can't be undone.`,
    cta: "Delete my account",
    url,
    footer: "If you didn't ask for this, ignore this email and change your password.",
  }),
});

/** Step 1 of an email change: the current address approves it. */
export const confirmEmailChangeTemplate = (name: string, newEmail: string, url: string) => ({
  subject: `Approve your ${site.name} email change`,
  ...layout({
    heading: "Change your email address?",
    body: `Hi ${name || "there"}, we received a request to change your sign-in email to ${newEmail}. Approve it below, then confirm the link we send to the new address. The link expires in 1 hour.`,
    cta: "Approve the change",
    url,
    footer: "If you didn't ask for this, don't approve it. Change your password, because someone else may be signed in to your account.",
  }),
});

/** Step 2 of an email change: the new address proves it's reachable. */
export const verifyNewEmailTemplate = (name: string, url: string) => ({
  subject: `Confirm your new email for ${site.name}`,
  ...layout({
    heading: "Confirm your new email",
    body: `Hi ${name || "there"}, confirm this address to finish changing your sign-in email. The link expires in 1 hour.`,
    cta: "Confirm new email",
    url,
    footer: "If you didn't ask for this, you can ignore this email. Nothing will change.",
  }),
});

/** Someone tried to sign up with an address that already has an account. */
export const existingAccountTemplate = (name: string, signInUrl: string) => ({
  subject: `You already have a ${site.name} account`,
  ...layout({
    heading: "You already have an account",
    body: `Hi ${name || "there"}, someone just tried to create a ${site.name} account with this email address. You already have one, so nothing changed. If that was you, sign in instead. Use "Forgot password?" on the sign-in page if you need a new password.`,
    cta: "Sign in",
    url: signInUrl,
    footer: "If it wasn't you, you can ignore this email. Your account is safe.",
  }),
});

/** Sent after a password change or reset, so a change the owner didn't make gets noticed. */
export const passwordChangedTemplate = (name: string, resetUrl: string) => ({
  subject: `Your ${site.name} password was changed`,
  ...layout({
    heading: "Your password was changed",
    body: `Hi ${name || "there"}, the password for your ${site.name} account was just changed. If that was you, there's nothing to do.`,
    cta: "This wasn't me: reset my password",
    url: resetUrl,
    footer: "Resetting your password signs out every device.",
  }),
});
