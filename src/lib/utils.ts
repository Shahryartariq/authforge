import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Only allow same-site relative paths as post-auth redirects.
 * Blocks open redirects like "//evil.com" or "https://evil.com".
 *
 * Browsers also drop tabs and newlines from a URL and read a backslash as "/",
 * so "/<tab>/evil.com" and "/<backslash>evil.com" leave the site too. Those characters are
 * never part of a real path here, so any value containing them is refused,
 * and the result is checked once more by parsing it the way a browser does.
 */
export function safeRedirect(value: string | null | undefined, fallback = "/dashboard") {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return fallback;
  if (/[\\\u0000-\u001f\u007f]/.test(value)) return fallback;
  try {
    if (new URL(value, "http://same-site.invalid").origin !== "http://same-site.invalid") return fallback;
  } catch {
    return fallback;
  }
  return value;
}

/** The sign-in page, remembering where to go afterwards (unless that's the default). */
export function signInHref(callbackURL: string) {
  return callbackURL === "/dashboard" ? "/sign-in" : `/sign-in?callbackURL=${encodeURIComponent(callbackURL)}`;
}

export function initials(name: string | null | undefined, email?: string) {
  const source = (name || email || "?").trim();
  const parts = source.split(/\s+/).filter(Boolean);
  const letters = parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : source.slice(0, 2);
  return letters.toUpperCase();
}
