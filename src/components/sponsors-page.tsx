"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeDollarSign, Building2, Handshake } from "lucide-react";

import { sponsorProfiles } from "@/data/site-content";
import { pickText } from "@/lib/site";
import { useSiteState } from "@/components/providers/site-state-provider";
import { SectionHeading, Surface } from "@/components/site-ui";

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
            <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
              <div className="flex-1">
                <div className="flex items-center justify-between gap-4">
                  <div className="rounded-[1.5rem] border theme-border bg-white px-5 py-4 shadow-[0_18px_40px_rgba(148,163,184,0.12)]">
                    <Image
                      src={sponsor.logoSrc}
                      alt={sponsor.name}
                      width={190}
                      height={56}
                      className="h-12 w-auto object-contain"
                    />
                  </div>
                  <div className={`shrink-0 rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] ${
                    index === 0
                      ? "bg-[linear-gradient(135deg,#0a1d34,#1772d0)] text-white"
                      : "theme-panel-strong theme-text-body border theme-border"
                  }`}>
                    {pickText(locale, sponsor.tier)}
                  </div>
                </div>
                <p className="theme-heading mt-5 text-2xl font-semibold theme-text-strong">{sponsor.name}</p>
                <p className="mt-2 text-sm theme-text-soft">{pickText(locale, sponsor.category)}</p>
                <p className="mt-5 text-sm leading-7 theme-text-muted">{pickText(locale, sponsor.description)}</p>
              </div>
              <div className="w-full rounded-[1.6rem] border theme-border theme-panel-subtle px-4 py-4 md:max-w-[180px]">
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

      <section className="space-y-6">
        <SectionHeading
          eyebrow={locale === "en" ? "Logo wall" : "Logo wall"}
          title={
            locale === "en"
              ? "A sponsor page should show the brands clearly."
              : "Trang nhà tài trợ cần hiển thị rõ thương hiệu của các đối tác."
          }
          description={
            locale === "en"
              ? "These are sample visual marks for the prototype and can be replaced with official sponsor logos later."
              : "Đây là các logo mẫu cho prototype và có thể được thay bằng logo chính thức của nhà tài trợ sau này."
          }
        />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {sponsorProfiles.map((sponsor) => (
            <Surface key={sponsor.name + "-logo"} className="flex min-h-[150px] items-center justify-center px-5 py-5">
              <Image
                src={sponsor.logoSrc}
                alt={sponsor.name}
                width={210}
                height={64}
                className="h-auto max-h-16 w-auto object-contain"
              />
            </Surface>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Surface className="px-6 py-6 md:px-8 md:py-8">
          <SectionHeading
            eyebrow={pickText(locale, pageContent.sponsors.partnership.eyebrow)}
            title={pickText(locale, pageContent.sponsors.partnership.title)}
            description={pickText(locale, pageContent.sponsors.partnership.description)}
          />
        </Surface>

        <Surface className="px-6 py-6">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-200/80">
            {locale === "en" ? "Next subsection" : "Phần tiếp theo"}
          </p>
          <p className="mt-4 text-2xl font-semibold theme-text-strong">
            {locale === "en" ? "Meet the judges." : "Gặp hội đồng giám khảo."}
          </p>
          <p className="mt-4 text-sm leading-7 theme-text-muted">
            {locale === "en"
              ? "The judges page gives the same level of structure to expertise and evaluation credibility."
              : "Trang giám khảo sẽ mang mức độ cấu trúc tương tự cho chuyên môn và độ tin cậy trong đánh giá."}
          </p>
          <Link href="/competition/judges" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold theme-accent">
            {locale === "en" ? "Open judges page" : "Mở trang giám khảo"}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Surface>
      </section>
    </div>
  );
}
