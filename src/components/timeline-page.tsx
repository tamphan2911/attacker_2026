"use client";

import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Flag,
  Route,
  ShieldCheck,
} from "lucide-react";

import { timelineItems } from "@/data/site-content";
import { useSiteState } from "@/components/providers/site-state-provider";
import { SectionHeading, Surface } from "@/components/site-ui";
import { formatDateRangeLabel, pickText } from "@/lib/site";
import type { CompetitionRoundKey } from "@/types/site";

const timelinePhaseMeta: Array<{
  phase: "general" | CompetitionRoundKey;
  anchor: string;
  eyebrow: { en: string; vi: string };
  title: { en: string; vi: string };
  description: { en: string; vi: string };
  icon: typeof Flag;
  ruleHref: string;
}> = [
  {
    phase: "general",
    anchor: "general-timeline",
    eyebrow: { en: "Preparation", vi: "Chuẩn bị" },
    title: { en: "Registration, briefing, and team lock", vi: "Đăng ký, briefing và chốt đội" },
    description: {
      en: "This phase covers account setup, team formation, and the final lock checkpoint required before Round 1.",
      vi: "Giai đoạn này bao gồm tạo tài khoản, hình thành đội và mốc chốt đội bắt buộc trước khi vào Vòng 1.",
    },
    icon: Flag,
    ruleHref: "/rules#general-rules",
  },
  {
    phase: "round-1",
    anchor: "round-1-timeline",
    eyebrow: { en: "Round 1", vi: "Vòng 1" },
    title: { en: "Individual qualifier and Top 50 announcement", vi: "Bài thi cá nhân và công bố Top 50" },
    description: {
      en: "The first competition stage is an online individual exam, but qualification is decided by team-average ranking.",
      vi: "Giai đoạn thi đầu tiên là bài thi trực tuyến theo cá nhân, nhưng điều kiện đi tiếp được quyết định bằng xếp hạng điểm trung bình đội.",
    },
    icon: ShieldCheck,
    ruleHref: "/rules#round-1-rules",
  },
  {
    phase: "round-2",
    anchor: "round-2-timeline",
    eyebrow: { en: "Round 2", vi: "Vòng 2" },
    title: { en: "Report submission and judge review", vi: "Nộp báo cáo và chấm bởi giám khảo" },
    description: {
      en: "Round 2 focuses on report submission, version tracking, and the judged shortlist for the final.",
      vi: "Vòng 2 tập trung vào nộp báo cáo, theo dõi phiên bản và chấm chọn danh sách vào chung kết.",
    },
    icon: Route,
    ruleHref: "/rules#round-2-rules",
  },
  {
    phase: "round-3",
    anchor: "round-3-timeline",
    eyebrow: { en: "Final round", vi: "Chung kết" },
    title: { en: "Live presentation, defense, and awards", vi: "Thuyết trình trực tiếp, bảo vệ và trao giải" },
    description: {
      en: "The final stage condenses presentation, Q&A, and final scoring into one live event day.",
      vi: "Giai đoạn chung kết gói gọn phần thuyết trình, hỏi đáp và chấm điểm cuối trong một ngày sự kiện trực tiếp.",
    },
    icon: CalendarDays,
    ruleHref: "/rules#round-3-rules",
  },
];

export function TimelinePage() {
  const { locale, pageContent } = useSiteState();

  return (
    <div className="space-y-16 md:space-y-20">
      <section>
        <SectionHeading
          eyebrow={pickText(locale, pageContent.rules.timeline.eyebrow)}
          title={pickText(locale, pageContent.rules.timeline.title)}
          description={pickText(locale, pageContent.rules.timeline.description)}
        />
      </section>

      <section className="space-y-6">
        {timelinePhaseMeta.map((phase) => {
          const items = timelineItems.filter((item) => item.phase === phase.phase);
          const Icon = phase.icon;

          return (
            <section
              key={phase.phase}
              id={phase.anchor}
              className="scroll-mt-36 rounded-[2rem] border theme-border bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(245,249,255,0.98))] px-5 py-6 shadow-[0_22px_55px_rgba(148,163,184,0.12)] dark:bg-[linear-gradient(180deg,rgba(11,23,42,0.96),rgba(7,16,31,0.98))] md:px-7 md:py-7"
            >
              <div className="grid gap-6 xl:grid-cols-[290px_minmax(0,1fr)] xl:items-start">
                <div className="space-y-4 xl:sticky xl:top-32 xl:self-start">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-[1.25rem] border border-sky-500/18 bg-sky-500/10">
                    <Icon className="h-5 w-5 text-sky-600 dark:text-sky-200" />
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] theme-eyebrow">
                      {pickText(locale, phase.eyebrow)}
                    </p>
                    <h2 className="theme-heading mt-3 text-2xl font-semibold theme-text-strong md:text-[2.25rem] md:leading-[1.08]">
                      {pickText(locale, phase.title)}
                    </h2>
                    <p className="mt-4 text-sm leading-8 theme-text-muted">
                      {pickText(locale, phase.description)}
                    </p>
                  </div>

                  <Link
                    href={phase.ruleHref}
                    className="inline-flex items-center gap-2 rounded-full border border-sky-500/22 bg-sky-500/[0.08] px-4 py-2 text-sm font-semibold text-sky-700 transition hover:border-sky-500/34 hover:bg-sky-500/[0.12] active:scale-[0.98] dark:text-sky-100"
                  >
                    {locale === "en" ? "Open rule block" : "Mở khối thể lệ"}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>

                <div className="space-y-4">
                  {items.map((item) => (
                    <Surface key={`${item.phase}-${item.title.en}-${item.startDate}`} className="px-5 py-5">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.26em] theme-eyebrow">
                            {formatDateRangeLabel(locale, item.startDate, item.endDate)}
                          </p>
                          <h3 className="theme-heading mt-3 text-xl font-semibold theme-text-strong">
                            {pickText(locale, item.title)}
                          </h3>
                        </div>
                        <span className="inline-flex items-center gap-2 rounded-full border theme-border bg-white/78 px-4 py-2 text-sm font-medium theme-text-body dark:bg-white/[0.05]">
                          <CalendarDays className="h-4 w-4 text-sky-500" />
                          {locale === "en" ? "Scheduled" : "Đã lên lịch"}
                        </span>
                      </div>

                      <div className="mt-5 grid gap-3 md:grid-cols-3">
                        <div className="rounded-[1.25rem] border theme-border bg-white/76 px-4 py-4 dark:bg-white/[0.05]">
                          <p className="text-xs font-semibold uppercase tracking-[0.22em] theme-eyebrow">
                            {locale === "en" ? "Time" : "Thời gian"}
                          </p>
                          <p className="mt-2 text-sm leading-7 theme-text-body">
                            {formatDateRangeLabel(locale, item.startDate, item.endDate)}
                          </p>
                        </div>
                        <div className="rounded-[1.25rem] border theme-border bg-white/76 px-4 py-4 dark:bg-white/[0.05]">
                          <p className="text-xs font-semibold uppercase tracking-[0.22em] theme-eyebrow">
                            {locale === "en" ? "Place" : "Địa điểm"}
                          </p>
                          <p className="mt-2 text-sm leading-7 theme-text-body">{pickText(locale, item.location)}</p>
                        </div>
                        <div className="rounded-[1.25rem] border theme-border bg-white/76 px-4 py-4 dark:bg-white/[0.05]">
                          <p className="text-xs font-semibold uppercase tracking-[0.22em] theme-eyebrow">
                            {locale === "en" ? "Method" : "Hình thức"}
                          </p>
                          <p className="mt-2 text-sm leading-7 theme-text-body">{pickText(locale, item.method)}</p>
                        </div>
                      </div>

                      <div className="mt-4 rounded-[1.25rem] border theme-border bg-white/70 px-4 py-4 dark:bg-white/[0.04]">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] theme-eyebrow">
                          {locale === "en" ? "Basic information" : "Thông tin cơ bản"}
                        </p>
                        <p className="mt-2 text-sm leading-8 theme-text-soft">{pickText(locale, item.description)}</p>
                      </div>

                      {item.supportLinks?.length ? (
                        <div className="mt-4 flex flex-wrap gap-3">
                          {item.supportLinks.map((supportLink) => (
                            <Link
                              key={`${item.title.en}-${supportLink.href}`}
                              href={supportLink.href}
                              className="inline-flex items-center gap-2 rounded-full border theme-border bg-white/80 px-4 py-2 text-sm font-medium theme-text-body transition hover:border-sky-500/28 hover:bg-sky-500/[0.08] hover:text-[var(--text-strong)] active:scale-[0.98] dark:bg-white/[0.05]"
                            >
                              {pickText(locale, supportLink.label)}
                              <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                          ))}
                        </div>
                      ) : null}
                    </Surface>
                  ))}
                </div>
              </div>
            </section>
          );
        })}
      </section>
    </div>
  );
}
