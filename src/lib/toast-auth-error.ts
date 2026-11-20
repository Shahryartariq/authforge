"use client";

import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage, type AuthError } from "@/lib/auth-errors";

/**
 * Sensitive actions (adding a passkey, disconnecting an account, deleting the
 * account without a password) only work for a day after signing in. After
 * that the server answers with one of these codes.
 */
const NEEDS_FRESH_SIGN_IN = new Set(["SESSION_NOT_FRESH", "SESSION_EXPIRED"]);

/** Shows an auth error as a toast. When the fix is to sign in again, the toast offers it. */
export function toastAuthError(error: AuthError, fallback?: string) {
  if (error?.code && NEEDS_FRESH_SIGN_IN.has(error.code)) {
    toast.error(authErrorMessage(error), {
      duration: 15_000,
      action: { label: "Sign in again", onClick: () => void signInAgain() },
    });
    return;
  }
  toast.error(authErrorMessage(error, fallback));
}

async function signInAgain() {
  const back = encodeURIComponent(window.location.pathname);
  await authClient.signOut();
  // A full page load on purpose: nothing rendered for the old session survives it.
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
  window.location.href = `/sign-in?notice=confirm-identity&callbackURL=${back}`;
}
