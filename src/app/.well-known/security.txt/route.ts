import { baseURL } from "@/lib/env";
import { site } from "@/lib/site";

const ONE_YEAR = 365 * 24 * 60 * 60 * 1000;

/**
 * /.well-known/security.txt (RFC 9116): tells security researchers where to
 * report a vulnerability. `Expires` is required and must be in the future, so
 * it's computed on each request and never goes stale.
 */
export function GET() {
  const body = [
    `Contact: ${site.repo}/security/advisories/new`,
    `Expires: ${new Date(Date.now() + ONE_YEAR).toISOString()}`,
    "Preferred-Languages: en",
    `Canonical: ${baseURL}/.well-known/security.txt`,
    `Policy: ${site.repo}/blob/main/SECURITY.md`,
    "",
  ].join("\n");
  return new Response(body, {
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=86400" },
  });
}
