"use client";

import type { ReactNode } from "react";
import { SessionProvider } from "next-auth/react";

import { SiteStateProvider } from "@/components/providers/site-state-provider";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <SiteStateProvider>{children}</SiteStateProvider>
    </SessionProvider>
  );
}
