// zod/mini, imported function by function. The full `zod` build can't be
// tree-shaken (it brings every validator and error messages in dozens of
// languages, about 95 KB compressed), and this file runs in the browser on
// every sign-in page. The few checks used here come to a fraction of that.
import {
  config,
  email,
  enum as oneOf,
  maxLength,
  minLength,
  object,
  pipe,
  refine,
  regex,
  string,
  toLowerCase,
  trim,
  type core,
} from "zod/mini";

// Zod compiles validators with `new Function` when the page allows it, and
// probes for that on first use. Our Content Security Policy blocks eval on
// purpose, so the probe showed up as a CSP violation in the browser console.
// Jitless mode skips the probe; validation works exactly the same.
config({ jitless: true });

import { NAME_MAX, PASSWORD_MAX, PASSWORD_MIN } from "./limits";

export { NAME_MAX, PASSWORD_MAX, PASSWORD_MIN };

export const emailSchema = pipe(string().check(trim(), toLowerCase()), email("Enter a valid email address"));

export const passwordSchema = string().check(
  minLength(PASSWORD_MIN, `Use at least ${PASSWORD_MIN} characters`),
  maxLength(PASSWORD_MAX, `Use at most ${PASSWORD_MAX} characters`),
);

const nameSchema = (missing: string) =>
  string().check(trim(), minLength(1, missing), maxLength(NAME_MAX, `Keep it under ${NAME_MAX} characters`));

const passwordsMatch = <T extends { confirmPassword: string }>(pick: (data: T) => string) =>
  refine<T>((d) => pick(d) === d.confirmPassword, { message: "Passwords don't match", path: ["confirmPassword"] });

export const signInSchema = object({
  email: emailSchema,
  password: string().check(minLength(1, "Enter your password")),
});

export const signUpSchema = object({
  name: nameSchema("Enter your name"),
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: string(),
}).check(passwordsMatch((d) => d.password));

export const resetPasswordSchema = object({ password: passwordSchema, confirmPassword: string() }).check(
  passwordsMatch((d) => d.password),
);

export const changePasswordSchema = object({
  currentPassword: string().check(minLength(1, "Enter your current password")),
  newPassword: passwordSchema,
  confirmPassword: string(),
}).check(
  passwordsMatch((d) => d.newPassword),
  refine((d) => d.newPassword !== d.currentPassword, {
    message: "Choose a password different from your current one",
    path: ["newPassword"],
  }),
);

export const otpSchema = string().check(trim(), regex(/^\d{6}$/, "Enter the 6-digit code from your app"));

/** The admin panel's "Create user" form. */
export const createUserSchema = object({
  name: nameSchema("Enter a name"),
  email: emailSchema,
  password: passwordSchema,
  role: oneOf(["user", "admin"]),
});

/** Rough strength score (0–4) for the meter. The server enforces the real rules. */
export function passwordStrength(pw: string): 0 | 1 | 2 | 3 | 4 {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= PASSWORD_MIN) score++;
  if (pw.length >= 12) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(score, 4) as 0 | 1 | 2 | 3 | 4;
}

/** Turns a zod error into { field: firstMessage }. */
export function fieldErrors(error: core.$ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    out[key] ??= issue.message;
  }
  return out;
}
