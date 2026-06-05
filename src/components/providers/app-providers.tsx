"use client";

import type { ReactNode } from "react";
import { SessionProvider } from "next-auth/react";

import {
  SiteStateProvider,
  type SiteDataApiPayload,
} from "@/components/providers/site-state-provider";

export function AppProviders({
  children,
  initialSiteData,
}: {
  children: ReactNode;
  initialSiteData?: SiteDataApiPayload;
}) {
  return (
    <SessionProvider>
      <SiteStateProvider initialSiteData={initialSiteData}>{children}</SiteStateProvider>
    </SessionProvider>
  );
}
