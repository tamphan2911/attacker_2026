"use client";

import Link from "next/link";
import { ArrowRight, CircleHelp, ShieldCheck, UsersRound } from "lucide-react";

import {
  TEAM_MAX_MEMBERS,
  TEAM_MIN_MEMBERS,
  faqItems,
} from "@/data/site-content";
import { pickText } from "@/lib/site";
import { useSiteState } from "@/components/providers/site-state-provider";
import { SectionHeading, Surface } from "@/components/site-ui";

export function FaqPage() {
  const { locale, pageContent } = useSiteState();

  return (
    <div className="space-y-16">
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <SectionHeading
          eyebrow={pickText(locale, pageContent.rules.faq.eyebrow)}
          title={pickText(locale, pageContent.rules.faq.title)}
          description={pickText(locale, pageContent.rules.faq.description)}
        />

        <Surface className="px-5 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-200/80">
            {locale === "en" ? "Quick answers" : "Tra loi nhanh"}
          </p>
          <div className="mt-5 space-y-3">
            {[
              {
                icon: <UsersRound className="h-4 w-4 text-cyan-300" />,
                label:
                  locale === "en"
                    ? `Round 1 requires a team of ${TEAM_MIN_MEMBERS}-${TEAM_MAX_MEMBERS} members`
                    : `Vong 1 yeu cau doi co ${TEAM_MIN_MEMBERS}-${TEAM_MAX_MEMBERS} thanh vien`,
              },
              {
                icon: <ShieldCheck className="h-4 w-4 text-emerald-300" />,
                label:
                  locale === "en"
                    ? "A leader must transfer leadership before leaving"
                    : "Doi truong phai chuyen quyen truoc khi roi doi",
              },
              {
                icon: <CircleHelp className="h-4 w-4 text-orange-300" />,
                label:
                  locale === "en"
                    ? "Round 1 ranks teams by average member score"
                    : "Vong 1 xep hang doi theo diem trung binh thanh vien",
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
        {faqItems.map((item, index) => (
          <Surface key={item.question.en} className="px-6 py-6 md:px-7 md:py-7">
            <div className="inline-flex rounded-full border theme-border bg-white/70 px-3 py-1.5 text-[0.72rem] font-semibold uppercase tracking-[0.24em] theme-eyebrow">
              {locale === "en" ? `Question ${index + 1}` : `Cau hoi ${index + 1}`}
            </div>
            <p className="mt-5 text-xl font-semibold theme-text-strong">
              {pickText(locale, item.question)}
            </p>
            <p className="mt-4 text-sm leading-7 theme-text-muted">
              {pickText(locale, item.answer)}
            </p>
          </Surface>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Surface className="px-6 py-6 md:px-8 md:py-8">
          <SectionHeading
            eyebrow={locale === "en" ? "Related page" : "Trang lien quan"}
            title={
              locale === "en"
                ? "Read the full rules and timeline next."
                : "Xem tiep trang the le va lich trinh day du."
            }
            description={
              locale === "en"
                ? "The FAQ answers repeated questions quickly, while the rules page still holds the official structure, progression logic, and timeline milestones."
                : "FAQ giup tra loi nhanh cac cau hoi lap lai, trong khi trang the le van giu cau truc chinh thuc, logic di tiep va cac moc thoi gian."
            }
          />
        </Surface>

        <Surface className="px-6 py-6">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-200/80">
            {locale === "en" ? "Next subsection" : "Sub-section tiep theo"}
          </p>
          <p className="mt-4 text-2xl font-semibold theme-text-strong">
            {locale === "en" ? "Open Rules & Timeline." : "Mo The le va Lich trinh."}
          </p>
          <p className="mt-4 text-sm leading-7 theme-text-muted">
            {locale === "en"
              ? "Use the structured rules page when you want the full stage flow, eligibility policy, and graphical timeline."
              : "Hay mo trang the le co cau truc khi ban muon xem day du lo trinh cac vong, dieu kien va timeline do hoa."}
          </p>
          <Link href="/rules" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold theme-accent">
            {locale === "en" ? "Open rules page" : "Mo trang the le"}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Surface>
      </section>
    </div>
  );
}
