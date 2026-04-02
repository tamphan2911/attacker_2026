"use client";

import Image from "next/image";
import { BadgeDollarSign, Building2, Handshake } from "lucide-react";

import { sponsorProfiles } from "@/data/site-content";
import { pickText } from "@/lib/site";
import { useSiteState } from "@/components/providers/site-state-provider";
import { SectionHeading, Surface } from "@/components/site-ui";
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
  const { locale, pageContent } = useSiteState();

  return (
    <div className="space-y-16">
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <SectionHeading
          eyebrow={pickText(locale, pageContent.sponsors.header.eyebrow)}
          title={pickText(locale, pageContent.sponsors.header.title)}
          description={pickText(locale, pageContent.sponsors.header.description)}
        />

        <Surface className="px-5 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-200/80">
            {locale === "en" ? "Why this section matters" : "Vì sao section này quan trọng"}
          </p>
          <div className="mt-5 space-y-3">
            {[
              {
                icon: <Handshake className="h-4 w-4 text-cyan-300" />,
                label: locale === "en" ? "Clarifies sponsor roles" : "Làm rõ vai trò nhà tài trợ",
              },
              {
                icon: <BadgeDollarSign className="h-4 w-4 text-emerald-300" />,
                label: locale === "en" ? "Links support to rewards and activities" : "Gắn sự đồng hành với giải thưởng và hoạt động",
              },
              {
                icon: <Building2 className="h-4 w-4 text-orange-300" />,
                label: locale === "en" ? "Makes the competition feel more established" : "Giúp cuộc thi có cảm giác trưởng thành hơn",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-3 rounded-2xl border theme-border theme-panel px-4 py-3 text-sm theme-text-body"
              >
                {item.icon}
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </Surface>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {sponsorProfiles.map((sponsor, index) => (
          <Surface key={sponsor.name} className="overflow-hidden px-6 py-6">
            <div className="space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="w-full max-w-[290px] rounded-[1.5rem] border theme-border bg-white px-4 py-4 shadow-[0_18px_40px_rgba(148,163,184,0.12)]">
                  <Image
                    src={sponsor.logoSrc}
                    alt={sponsor.name}
                    width={320}
                    height={96}
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

              <div className="rounded-[1.6rem] border theme-border theme-panel-subtle px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] theme-eyebrow">
                  {locale === "en" ? "Contribution" : "Đồng hành"}
                </p>
                <p className="mt-3 text-sm leading-7 theme-text-muted">
                  {index === 0
                    ? locale === "en"
                      ? "Supports prize positioning, visibility, and credibility."
                      : "Đồng hành ở mức độ giải thưởng, hình ảnh và độ tin cậy."
                    : index === 1
                      ? locale === "en"
                        ? "Shapes challenge framing and industry context."
                        : "Định hình đề bài và bối cảnh trong ngành."
                      : index === 2
                        ? locale === "en"
                          ? "Adds specialist knowledge and evaluation depth."
                          : "Bổ sung chuyên môn và chiều sâu đánh giá."
                        : locale === "en"
                          ? "Expands reach through community and student channels."
                          : "Mở rộng độ phủ thông qua cộng đồng và kênh sinh viên."}
                </p>
              </div>
            </div>
          </Surface>
        ))}
      </section>
    </div>
  );
}
