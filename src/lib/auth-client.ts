"use client";

import { createAuthClient } from "better-auth/react";
import {
  adminClient,
  lastLoginMethodClient,
  twoFactorClient,
} from "better-auth/client/plugins";
import { passkeyClient } from "@better-auth/passkey/client";

/** Pages that need a session (the same list as the proxy's matcher). */
const SIGNED_IN_PAGE = /^\/(dashboard|settings|admin)(\/|$)/;

export const authClient = createAuthClient({
  fetchOptions: {
    // The session was ended somewhere else (signed out on another device,
    // banned, expired) while this page was open. Any action then fails with
    // 401, so go to sign-in and come back here afterwards. A wrong password
    // is a 400, so this never fires for a typo.
    onError({ response, error }) {
      if (
        response?.status === 401 &&
        (error as { code?: string }).code === "UNAUTHORIZED" &&
        SIGNED_IN_PAGE.test(window.location.pathname)
      ) {
        const back = encodeURIComponent(window.location.pathname + window.location.search);
        // A full page load on purpose: it drops everything rendered for the old session.
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.href = `/sign-in?notice=session-ended&callbackURL=${back}`;
      }
    },
  },
  plugins: [
    twoFactorClient({
      onTwoFactorRedirect() {
        const params = new URLSearchParams(window.location.search);
        const next = params.get("callbackURL");
        window.location.href = next
          ? `/two-factor?callbackURL=${encodeURIComponent(next)}`
          : "/two-factor";
      },
    }),
    passkeyClient(),
    adminClient(),
    lastLoginMethodClient(),
  ],
});

export const { signIn, signUp, signOut, useSession } = authClient;
