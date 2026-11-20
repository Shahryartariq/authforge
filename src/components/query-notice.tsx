"use client";

import { useEffect } from "react";
import { toast } from "sonner";

/**
 * One-line messages for a page reached by a redirect, set with `?notice=<key>`.
 * Only these fixed texts can be shown, so a link can't put its own words on the page.
 */
const NOTICES: Record<string, { text: string; kind: "success" | "info" }> = {
  "account-deleted": { text: "Your account was deleted.", kind: "success" },
  "session-ended": { text: "Your session ended. Sign in again to continue.", kind: "info" },
  "confirm-identity": { text: "For security, sign in again to continue.", kind: "info" },
};

/** Shows the notice once, then removes it from the address bar. */
export function QueryNotice() {
  useEffect(() => {
    const url = new URL(window.location.href);
    const notice = NOTICES[url.searchParams.get("notice") ?? ""];
    if (!url.searchParams.has("notice")) return;
    url.searchParams.delete("notice");
    window.history.replaceState(window.history.state, "", url);
    // After the first paint, so the toast area is mounted.
    if (notice) setTimeout(() => toast[notice.kind](notice.text, { duration: 8000 }), 0);
  }, []);
  return null;
}
