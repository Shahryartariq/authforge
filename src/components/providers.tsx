"use client";

import { ThemeProvider } from "next-themes";
import { QueryNotice } from "@/components/query-notice";
import { Toaster } from "@/components/ui/sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      {children}
      <Toaster position="bottom-right" richColors closeButton />
      <QueryNotice />
    </ThemeProvider>
  );
}
