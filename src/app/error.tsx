"use client"; // Error boundaries must be Client Components

import { ErrorState } from "@/components/error-state";

export default function ErrorPage({ error, retry }: { error: unknown; retry: () => void }) {
  return (
    <main>
      <ErrorState error={error} retry={retry} home={{ href: "/", label: "Go home" }} fullPage />
    </main>
  );
}
