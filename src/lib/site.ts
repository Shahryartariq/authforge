/** Edit these to rebrand the starter for a new project. */
export const site = {
  name: "Authforge",
  /** The home page title: what it is, in under 60 characters. */
  title: "Authforge: Next.js auth starter with passkeys, 2FA and admin",
  description:
    "Production-ready authentication for Next.js: email and password, Google and GitHub, two-factor, passkeys, roles and an admin panel.",
  repo: "https://github.com/Shahryartariq/authforge",
  author: "Muhammad Shehryar Tariq",
  authorUrl: "https://github.com/Shahryartariq",
} as const;

/**
 * Open Graph fields every public page shares. A page that sets its own
 * `openGraph` replaces the whole object, so spread this in to keep the site
 * name and the share image.
 */
export const openGraphBase = {
  type: "website" as const,
  siteName: site.name,
  locale: "en_US",
  images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: `${site.name}: authentication starter for Next.js` }],
};

/** Where users land after signing in. */
export const AFTER_SIGN_IN = "/dashboard";
