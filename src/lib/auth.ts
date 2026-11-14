import { betterAuth } from "better-auth";
import { APIError, createAuthMiddleware, getSessionFromCtx, isAPIError } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { admin, haveIBeenPwned, lastLoginMethod, twoFactor } from "better-auth/plugins";
import { passkey } from "@better-auth/passkey";
import { authAdapter } from "@/db/adapter";
import { isListedAdmin } from "@/lib/admin-emails";
import { baseURL, emailFeatures, env, trustedOrigins } from "@/lib/env";
import { sendEmail } from "@/lib/email/send";
import {
  confirmEmailChangeTemplate,
  deleteAccountTemplate,
  existingAccountTemplate,
  passwordChangedTemplate,
  resetPasswordTemplate,
  verifyEmailTemplate,
  verifyNewEmailTemplate,
} from "@/lib/email/templates";
import { EMAIL_CHANGE } from "@/lib/email-change";
import { site } from "@/lib/site";

const ONE_HOUR = 60 * 60;
const ONE_DAY = 24 * ONE_HOUR;

/** Tells the owner their password changed, in case it wasn't them. */
async function notifyPasswordChanged(user: { name: string; email: string }) {
  if (!emailFeatures.delivery) return;
  const mail = passwordChangedTemplate(user.name, `${baseURL}/forgot-password`);
  await sendEmail({ to: user.email, ...mail });
}

/**
 * While an admin is impersonating someone, the account's sign-in methods are
 * read-only. Impersonation is for seeing what a user sees, and an admin who
 * could add a passkey or link a GitHub account would keep a way in afterwards.
 */
const BLOCKED_WHILE_IMPERSONATING = new Set([
  "/change-password",
  "/change-email",
  "/delete-user",
  "/link-social",
  "/unlink-account",
  "/revoke-session",
  "/revoke-sessions",
  "/revoke-other-sessions",
  "/passkey/generate-register-options",
  "/passkey/verify-registration",
  "/passkey/update-passkey",
  "/passkey/delete-passkey",
  "/two-factor/enable",
  "/two-factor/disable",
  "/two-factor/generate-backup-codes",
]);

const socialProviders = {
  ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
    ? {
        google: {
          clientId: env.GOOGLE_CLIENT_ID,
          clientSecret: env.GOOGLE_CLIENT_SECRET,
          prompt: "select_account" as const,
        },
      }
    : {}),
  ...(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET
    ? { github: { clientId: env.GITHUB_CLIENT_ID, clientSecret: env.GITHUB_CLIENT_SECRET } }
    : {}),
};

export const auth = betterAuth({
  appName: site.name,
  baseURL,
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins,

  database: authAdapter,

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: emailFeatures.verificationRequired,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    resetPasswordTokenExpiresIn: ONE_HOUR,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      const mail = resetPasswordTemplate(user.name, url);
      await sendEmail({ to: user.email, ...mail });
    },
    onPasswordReset: async ({ user }) => notifyPasswordChanged(user),
    // Signing up with an address that already has an account looks the same
    // on screen (so the form can't be used to find accounts). The owner gets
    // an email instead of a verification link that would never come.
    onExistingUserSignUp: async ({ user }) => {
      const mail = existingAccountTemplate(user.name, `${baseURL}/sign-in`);
      await sendEmail({ to: user.email, ...mail });
    },
  },

  emailVerification: {
    sendOnSignUp: emailFeatures.verificationRequired,
    // An unverified user who tries to sign in gets a fresh link.
    sendOnSignIn: emailFeatures.verificationRequired,
    autoSignInAfterVerification: true,
    expiresIn: ONE_HOUR,
    sendVerificationEmail: async ({ user, url }) => {
      // Demo mode with no email provider: nothing to verify, nothing to send.
      if (!emailFeatures.delivery && !emailFeatures.verificationRequired) return;
      // The last step of an email change also arrives here, addressed to the
      // new email. Its link lands on the "your email was changed" notice.
      if (url.includes(EMAIL_CHANGE.approvedParam)) {
        const mail = verifyNewEmailTemplate(user.name, url.replace(EMAIL_CHANGE.approvedParam, EMAIL_CHANGE.doneParam));
        await sendEmail({ to: user.email, ...mail });
        return;
      }
      const mail = verifyEmailTemplate(user.name, url);
      await sendEmail({ to: user.email, ...mail });
    },
  },

  socialProviders,

  account: {
    accountLinking: {
      enabled: true,
      // Google and GitHub verify emails, so a matching account is linked automatically.
      trustedProviders: ["google", "github"],
    },
  },

  user: {
    changeEmail: {
      enabled: true,
      // A verified user's current address approves the change first, then the
      // new address confirms it. Nothing changes until both links are opened.
      sendChangeEmailConfirmation: async ({ user, newEmail, url }) => {
        const mail = confirmEmailChangeTemplate(user.name, newEmail, url);
        await sendEmail({ to: user.email, ...mail });
      },
      // Demo mode: an address nobody verified can be changed directly.
      updateEmailWithoutVerification: !emailFeatures.verificationRequired,
    },
    deleteUser: {
      enabled: true,
      // Confirm by email when email works; otherwise the password (or a
      // fresh session) is the confirmation.
      ...(emailFeatures.delivery
        ? {
            sendDeleteAccountVerification: async ({ user, url }) => {
              const mail = deleteAccountTemplate(user.name, url);
              await sendEmail({ to: user.email, ...mail });
            },
          }
        : {}),
    },
  },

  session: {
    expiresIn: 7 * ONE_DAY,
    updateAge: ONE_DAY,
    // No cookie cache: every request checks the session in the database, so
    // sign-outs, password changes and bans take effect immediately. (With a
    // cache, a revoked session keeps working until the cache expires.)
    cookieCache: { enabled: false },
  },

  rateLimit: {
    enabled: env.NODE_ENV === "production",
    // Database storage works across serverless instances; memory does not.
    storage: "database",
    window: 60,
    max: 100,
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
      "/sign-up/email": { window: 60, max: 3 },
      "/request-password-reset": { window: 5 * 60, max: 3 },
      "/send-verification-email": { window: 5 * 60, max: 3 },
      "/two-factor/*": { window: 60, max: 5 },
      "/passkey/*": { window: 60, max: 10 },
      // These take the current password, so they'd let someone holding a
      // session guess it. Same limit as sign-in.
      "/change-password": { window: 60, max: 5 },
      "/delete-user": { window: 60, max: 5 },
      "/verify-password": { window: 60, max: 5 },
      "/change-email": { window: 5 * 60, max: 3 },
    },
  },

  databaseHooks: {
    user: {
      create: {
        // Emails listed in ADMIN_EMAILS get the admin role on sign-up (see isListedAdmin).
        before: async (user) => {
          if (isListedAdmin(user, env.ADMIN_EMAILS, emailFeatures.verificationRequired)) {
            return { data: { ...user, role: "admin" } };
          }
        },
      },
    },
  },

  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (!BLOCKED_WHILE_IMPERSONATING.has(ctx.path)) return;
      const current = await getSessionFromCtx(ctx);
      if (current?.session.impersonatedBy) {
        throw new APIError("FORBIDDEN", {
          code: "NOT_WHILE_IMPERSONATING",
          message: "Sign-in settings can't be changed while impersonating.",
        });
      }
    }),
    after: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/change-password" || isAPIError(ctx.context.returned)) return;
      // "Sign out other devices" replaces the session, so look at the new one first.
      const user = ctx.context.newSession?.user ?? (await getSessionFromCtx(ctx))?.user;
      if (user) await notifyPasswordChanged(user);
    }),
  },

  advanced: {
    useSecureCookies: env.NODE_ENV === "production",
    database: { generateId: "uuid" },
  },

  telemetry: { enabled: false },

  // When a Google or GitHub sign-in can't even be matched to a request (an
  // expired or replayed link), land on our sign-in page with the error, not on
  // the library's built-in error page.
  onAPIError: { errorURL: `${baseURL}/sign-in` },

  plugins: [
    twoFactor({
      issuer: site.name,
      backupCodeOptions: { amount: 10, length: 10 },
    }),
    passkey({
      rpID: new URL(baseURL).hostname,
      rpName: site.name,
      origin: baseURL,
    }),
    admin({
      defaultRole: "user",
      adminRoles: ["admin"],
      impersonationSessionDuration: ONE_HOUR,
    }),
    lastLoginMethod(),
    ...(env.PWNED_PASSWORD_CHECK
      ? [
          haveIBeenPwned({
            customPasswordCompromisedMessage:
              "This password has appeared in a data breach. Please choose a different one.",
          }),
        ]
      : []),
    // Must stay last: lets Server Actions set auth cookies.
    nextCookies(),
  ],
});

export type Session = typeof auth.$Infer.Session;
