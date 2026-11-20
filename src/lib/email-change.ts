/**
 * An email change takes two links: one to the current address (approve), then
 * one to the new address (confirm). Both come back to Settings, and this query
 * parameter says which step just happened so the page can show the right notice.
 *
 * `approvedParam` and `doneParam` are the same values as they appear inside an
 * encoded `callbackURL`, which is where the server sees them.
 */
export const EMAIL_CHANGE = {
  param: "emailChange",
  approvedURL: "/settings?emailChange=approved",
  approvedParam: encodeURIComponent("emailChange=approved"),
  doneParam: encodeURIComponent("emailChange=done"),
} as const;
