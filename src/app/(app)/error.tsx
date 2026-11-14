"use client"; // Error boundaries must be Client Components

import { ErrorState } from "@/components/error-state";

/** Keeps the app header and navigation on screen when one signed-in page fails. */
export default function AppErrorPage({ error, retry }: { error: unknown; retry: () => void }) {
  return <ErrorState error={error} retry={retry} home={{ href: "/dashboard", label: "Go to dashboard" }} />;
}
