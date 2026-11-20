import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Providers } from "@/components/providers";
import { baseURL } from "@/lib/env";
import { openGraphBase, site } from "@/lib/site";
import "./globals.css";

// Geist, cut down to Latin (33 KB instead of 70 KB). See src/app/fonts/OFL.txt.
// Code and numbers use the system monospace font, so no second font downloads.
const geist = localFont({
  src: "./fonts/geist-latin.woff2",
  variable: "--font-geist-sans",
  weight: "100 900",
  display: "swap",
  adjustFontFallback: "Arial",
});

export const metadata: Metadata = {
  metadataBase: new URL(baseURL),
  title: { default: site.title, template: `%s · ${site.name}` },
  description: site.description,
  applicationName: site.name,
  authors: [{ name: site.author, url: site.authorUrl }],
  // No canonical URL here: it would be inherited by the sign-in pages and the
  // 404 page, telling search engines they are copies of the home page. Each
  // indexable page (home, privacy) sets its own.
  openGraph: { ...openGraphBase, title: site.title, description: site.description },
  twitter: { card: "summary_large_image", title: site.title, description: site.description },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fcfcfc" },
    { media: "(prefers-color-scheme: dark)", color: "#16171c" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning className={`${geist.variable} h-full`}>
      <body className="flex min-h-full flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
