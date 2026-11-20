"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * What people see when a page fails to load (a database hiccup, a bug). The
 * details stay in the server log; the reference shown matches the log entry.
 */
export function ErrorState({
  error,
  retry,
  home,
  fullPage = false,
}: {
  error: unknown;
  retry: () => void;
  home: { href: string; label: string };
  fullPage?: boolean;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const digest =
    typeof error === "object" && error !== null && "digest" in error ? String(error.digest) : undefined;

  return (
    <div
      role="alert"
      className={cn("flex flex-col items-center justify-center gap-4 px-4 text-center", fullPage ? "min-h-dvh" : "py-24")}
    >
      <p className="font-mono text-sm text-muted-foreground">Error</p>
      <h1 className="text-2xl font-semibold tracking-tight">Something went wrong</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        This page couldn&apos;t load. It&apos;s usually temporary, so try again.
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        <Button onClick={() => retry()}>Try again</Button>
        <Link href={home.href} className={buttonVariants({ variant: "outline" })}>
          {home.label}
        </Link>
      </div>
      {digest && <p className="font-mono text-xs text-muted-foreground">Reference: {digest}</p>}
    </div>
  );
}
