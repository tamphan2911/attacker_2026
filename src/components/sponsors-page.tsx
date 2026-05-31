"use client";

import Image from "next/image";

import { pickText } from "@/lib/site";
import { useSiteState } from "@/components/providers/site-state-provider";
import { Surface } from "@/components/site-ui";
import type { LocalizedText } from "@/types/site";

function getSponsorTierStyle(tier: LocalizedText) {
  const normalized = `${tier.en} ${tier.vi}`.toLowerCase();

  if (normalized.includes("strategic") || normalized.includes("chiến lược")) {
    return "border-transparent bg-[linear-gradient(135deg,#071221,#0f3f75,#1772d0)] text-white shadow-[0_16px_38px_rgba(23,114,208,0.24)]";
  }

  if (normalized.includes("diamond")) {
    return "border border-cyan-200/50 bg-[linear-gradient(135deg,#eff9ff,#d9f3ff,#f8fdff)] text-slate-900 shadow-[0_14px_34px_rgba(14,165,233,0.18)]";
  }

  if (normalized.includes("gold")) {
    return "border border-amber-200/70 bg-[linear-gradient(135deg,#fff5d6,#ffe28a,#fff2c2)] text-amber-950 shadow-[0_14px_34px_rgba(245,158,11,0.18)]";
  }

  if (normalized.includes("silver")) {
    return "border border-slate-300/80 bg-[linear-gradient(135deg,#f8fafc,#e2e8f0,#f1f5f9)] text-slate-800 shadow-[0_14px_34px_rgba(100,116,139,0.16)]";
  }

  if (normalized.includes("bronze")) {
    return "border border-orange-200/70 bg-[linear-gradient(135deg,#fbe7db,#d99466,#f3d1b9)] text-orange-950 shadow-[0_14px_34px_rgba(180,83,9,0.18)]";
  }

  return "theme-panel-strong theme-text-body border theme-border";
}

export function SponsorsPage() {
  const { locale, pageContent, sponsors } = useSiteState();

  return (
    <div className="space-y-16">
      <section>
        <div className="max-w-3xl">
          <p className="theme-eyebrow text-xs font-semibold uppercase tracking-[0.34em]">
            {pickText(locale, pageContent.sponsors.header.eyebrow)}
          </p>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {sponsors.map((sponsor, index) => (
          <Surface key={`${sponsor.name}-${index}`} className="overflow-hidden px-6 py-6">
            <div className="space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="w-full max-w-[290px] rounded-[1.5rem] border theme-border bg-white px-4 py-4 shadow-[0_18px_40px_rgba(148,163,184,0.12)]">
                  <Image
                    src={sponsor.logoSrc}
                    alt={sponsor.name}
                    width={320}
                    height={96}
                    unoptimized={sponsor.logoSrc.startsWith("/api/sponsor-images/")}
                    className="h-16 w-full object-contain object-left"
                  />
                </div>
                <div
                  className={`shrink-0 rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] ${getSponsorTierStyle(sponsor.tier)}`}
                >
                  {pickText(locale, sponsor.tier)}
                </div>
              </div>

              <div>
                <p className="theme-heading text-2xl font-semibold theme-text-strong">{sponsor.name}</p>
                <p className="mt-2 text-sm theme-text-soft">{pickText(locale, sponsor.category)}</p>
                <p className="mt-5 text-sm leading-7 theme-text-muted">{pickText(locale, sponsor.description)}</p>
              </div>
            </div>
          </Surface>
        ))}
      </section>
    </div>
  );
}
