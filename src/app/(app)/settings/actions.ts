"use server";

import { headers } from "next/headers";
import { isAPIError } from "better-auth/api";
import { auth } from "@/lib/auth";
import { getSession } from "@/lib/session";

type Result = { ok: true } | { ok: false; code: string };

/**
 * Signs out one of the signed-in user's sessions, by its id.
 *
 * The browser only ever gets session ids. The secret session tokens stay on
 * the server, so a script on the page can't read another device's token.
 */
export async function revokeSessionById(sessionId: string): Promise<Result> {
  const current = await getSession();
  if (!current) return { ok: false, code: "UNAUTHORIZED" };

  const { internalAdapter } = await auth.$context;
  const mine = await internalAdapter.listSessions(current.user.id);
  const target = mine.find((s) => s.id === sessionId);
  // Already signed out or expired: the list just needs refreshing.
  if (!target) return { ok: true };

  try {
    await auth.api.revokeSession({ body: { token: target.token }, headers: await headers() });
    return { ok: true };
  } catch (error) {
    if (isAPIError(error)) return { ok: false, code: String(error.body?.code ?? "UNKNOWN") };
    throw error;
  }
}
