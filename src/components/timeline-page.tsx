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
import { Surface } from "@/components/site-ui";
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
  iconClass: string;
  buttonClass: string;
  statusClass: string;
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
    iconClass:
      "border-violet-600/24 bg-[linear-gradient(135deg,rgba(124,58,237,0.2),rgba(168,85,247,0.16))] text-violet-800 dark:border-violet-300/20 dark:bg-violet-300/12 dark:text-violet-100",
    buttonClass:
      "border-violet-600/24 bg-[linear-gradient(135deg,rgba(124,58,237,0.12),rgba(168,85,247,0.08))] text-violet-800 hover:border-violet-600/34 hover:bg-[linear-gradient(135deg,rgba(124,58,237,0.16),rgba(168,85,247,0.12))] dark:border-violet-300/22 dark:bg-violet-300/[0.12] dark:text-violet-100",
    statusClass:
      "border-violet-600/20 bg-violet-500/12 text-violet-800 dark:border-violet-300/22 dark:bg-violet-300/[0.12] dark:text-violet-100",
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
    iconClass:
      "border-sky-600/24 bg-[linear-gradient(135deg,rgba(14,165,233,0.2),rgba(59,130,246,0.16))] text-sky-800 dark:border-sky-300/20 dark:bg-sky-300/12 dark:text-sky-100",
    buttonClass:
      "border-sky-600/24 bg-[linear-gradient(135deg,rgba(14,165,233,0.12),rgba(59,130,246,0.08))] text-sky-800 hover:border-sky-600/34 hover:bg-[linear-gradient(135deg,rgba(14,165,233,0.16),rgba(59,130,246,0.12))] dark:border-sky-300/22 dark:bg-sky-300/[0.12] dark:text-sky-100",
    statusClass:
      "border-sky-600/20 bg-sky-500/12 text-sky-800 dark:border-sky-300/22 dark:bg-sky-300/[0.12] dark:text-sky-100",
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
    iconClass:
      "border-emerald-600/24 bg-[linear-gradient(135deg,rgba(16,185,129,0.2),rgba(52,211,153,0.16))] text-emerald-800 dark:border-emerald-300/20 dark:bg-emerald-300/12 dark:text-emerald-100",
    buttonClass:
      "border-emerald-600/24 bg-[linear-gradient(135deg,rgba(16,185,129,0.12),rgba(52,211,153,0.08))] text-emerald-800 hover:border-emerald-600/34 hover:bg-[linear-gradient(135deg,rgba(16,185,129,0.16),rgba(52,211,153,0.12))] dark:border-emerald-300/22 dark:bg-emerald-300/[0.12] dark:text-emerald-100",
    statusClass:
      "border-emerald-600/20 bg-emerald-500/12 text-emerald-800 dark:border-emerald-300/22 dark:bg-emerald-300/[0.12] dark:text-emerald-100",
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
    iconClass:
      "border-amber-600/24 bg-[linear-gradient(135deg,rgba(245,158,11,0.2),rgba(249,115,22,0.16))] text-amber-800 dark:border-amber-300/20 dark:bg-amber-300/12 dark:text-amber-100",
    buttonClass:
      "border-amber-600/24 bg-[linear-gradient(135deg,rgba(245,158,11,0.12),rgba(249,115,22,0.08))] text-amber-800 hover:border-amber-600/34 hover:bg-[linear-gradient(135deg,rgba(245,158,11,0.16),rgba(249,115,22,0.12))] dark:border-amber-300/22 dark:bg-amber-300/[0.12] dark:text-amber-100",
    statusClass:
      "border-amber-600/20 bg-amber-500/12 text-amber-800 dark:border-amber-300/22 dark:bg-amber-300/[0.12] dark:text-amber-100",
  },
];

export function TimelinePage() {
  const { locale } = useSiteState();

  return (
    <div className="space-y-16 md:space-y-20">
      <section className="space-y-6">
        {timelinePhaseMeta.map((phase) => {
          const items = timelineItems.filter((item) => item.phase === phase.phase);
          const Icon = phase.icon;

          return (
            <section
              key={phase.phase}
              id={phase.anchor}
              className="theme-timeline-shell scroll-mt-36 rounded-[2rem] border px-5 py-6 md:px-7 md:py-7"
            >
              <div className="grid gap-6 xl:grid-cols-[290px_minmax(0,1fr)] xl:items-start">
                <div className="space-y-4 xl:sticky xl:top-32 xl:self-start">
                  <div className={`inline-flex h-12 w-12 items-center justify-center rounded-[1.25rem] border ${phase.iconClass}`}>
                    <Icon className="h-5 w-5" />
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
                    className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition active:scale-[0.98] ${phase.buttonClass}`}
                  >
                    {locale === "en" ? "Open rule block" : "Mở khối thể lệ"}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>

                <div className="space-y-4">
                  {items.map((item) => (
                    <Surface key={`${item.phase}-${item.title.en}-${item.startDate}`} className="theme-timeline-card px-5 py-5">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.26em] theme-eyebrow">
                            {formatDateRangeLabel(locale, item.startDate, item.endDate)}
                          </p>
                          <h3 className="theme-heading mt-3 text-xl font-semibold theme-text-strong">
                            {pickText(locale, item.title)}
                          </h3>
                        </div>
                        <span className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium ${phase.statusClass}`}>
                          <CalendarDays className="h-4 w-4" />
                          {locale === "en" ? "Scheduled" : "Đã lên lịch"}
                        </span>
                      </div>

                      <div className="mt-5 grid gap-3 md:grid-cols-3">
                        <div className="theme-timeline-meta-card rounded-[1.25rem] border px-4 py-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.22em] theme-eyebrow">
                            {locale === "en" ? "Time" : "Thời gian"}
                          </p>
                          <p className="mt-2 text-sm leading-7 theme-text-body">
                            {formatDateRangeLabel(locale, item.startDate, item.endDate)}
                          </p>
                        </div>
                        <div className="theme-timeline-meta-card rounded-[1.25rem] border px-4 py-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.22em] theme-eyebrow">
                            {locale === "en" ? "Place" : "Địa điểm"}
                          </p>
                          <p className="mt-2 text-sm leading-7 theme-text-body">{pickText(locale, item.location)}</p>
                        </div>
                        <div className="theme-timeline-meta-card rounded-[1.25rem] border px-4 py-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.22em] theme-eyebrow">
                            {locale === "en" ? "Method" : "Hình thức"}
                          </p>
                          <p className="mt-2 text-sm leading-7 theme-text-body">{pickText(locale, item.method)}</p>
                        </div>
                      </div>

                      <div className="theme-timeline-note-card mt-4 rounded-[1.25rem] border px-4 py-4">
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
                              className="theme-timeline-link inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition active:scale-[0.98]"
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
