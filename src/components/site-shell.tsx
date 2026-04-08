"use client";

import type { ReactNode } from "react";

import { useSiteState } from "@/components/providers/site-state-provider";
import { ScrollToTopButton } from "@/components/scroll-to-top-button";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export function SiteShell({ children }: { children: ReactNode }) {
  const { theme } = useSiteState();

  return (
    <div data-theme={theme} className="theme-shell relative min-h-screen overflow-x-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(69,183,255,0.18),transparent_24%),radial-gradient(circle_at_18%_12%,rgba(23,114,208,0.14),transparent_16%),radial-gradient(circle_at_72%_80%,rgba(99,102,241,0.08),transparent_18%)]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.2] [mask-image:linear-gradient(180deg,rgba(0,0,0,0.55),transparent_72%)]"
        style={{
          backgroundImage:
            "linear-gradient(var(--grid-line) 1px, transparent 1px), linear-gradient(90deg, var(--grid-line) 1px, transparent 1px)",
          backgroundSize: "110px 110px",
        }}
      />
      <div className="relative flex min-h-screen flex-col">
        <SiteHeader />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-12 pt-6 md:px-8 md:pt-8">
          {children}
        </main>
        <SiteFooter />
        <ScrollToTopButton />
      </div>
    </div>
  );
}
