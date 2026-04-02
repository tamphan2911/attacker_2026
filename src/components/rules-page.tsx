"use client";

import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  FileCheck2,
  Flag,
  Medal,
  ShieldAlert,
  Trophy,
  UsersRound,
} from "lucide-react";

import {
  TEAM_MAX_MEMBERS,
  TEAM_MIN_MEMBERS,
  audienceHighlights,
  competitionRoundWindows,
  roundItems,
  ruleItems,
} from "@/data/site-content";
import { useSiteState } from "@/components/providers/site-state-provider";
import { SectionHeading, Surface } from "@/components/site-ui";
import { formatDateRangeLabel, pickText } from "@/lib/site";

const generalRuleIcons = [UsersRound, ShieldAlert, BadgeCheck];
const policyIcons = [Flag, ShieldAlert, FileCheck2, Medal];

const roundRuleMeta = {
  "01": {
    anchor: "round-1-rules",
    icon: FileCheck2,
    statTone: "from-sky-500/18 via-cyan-400/10 to-white/0",
    focus: {
      en: "Round 1 is individual at paper level but ranked at team level.",
      vi: "Vòng 1 làm bài theo cá nhân nhưng xếp hạng ở cấp độ đội.",
    },
    notes: [
      {
        en: "Only locked teams with 3 to 5 members may enter the official exam.",
        vi: "Chỉ các đội đã khóa đội và có từ 3 đến 5 thành viên mới được vào bài thi chính thức.",
      },
      {
        en: "Every member takes one timed paper consisting of 36 objective questions and 2 essay questions.",
        vi: "Mỗi thành viên làm một đề có giới hạn thời gian gồm 36 câu khách quan và 2 câu tự luận.",
      },
      {
        en: "Top 50 teams are selected by the average score of eligible team members.",
        vi: "Top 50 đội được chọn theo điểm trung bình của các thành viên đủ điều kiện trong đội.",
      },
    ],
  },
  "02": {
    anchor: "round-2-rules",
    icon: BadgeCheck,
    statTone: "from-emerald-500/16 via-teal-400/10 to-white/0",
    focus: {
      en: "Round 2 is a judged report stage with versioned file submission.",
      vi: "Vòng 2 là giai đoạn chấm báo cáo với cơ chế nộp tệp theo phiên bản.",
    },
    notes: [
      {
        en: "Only teams qualified from Round 1 can access the Round 2 submission center.",
        vi: "Chỉ các đội vượt qua Vòng 1 mới được truy cập khu vực nộp bài Vòng 2.",
      },
      {
        en: "Team leaders submit the official report file, while all previous versions remain visible for tracking.",
        vi: "Đội trưởng nộp tệp báo cáo chính thức, còn các phiên bản trước vẫn được lưu để theo dõi.",
      },
      {
        en: "Judge scoring selects the top 5 teams for the final and recognizes the next 10 as Emerging Teams.",
        vi: "Điểm chấm của giám khảo chọn top 5 đội vào chung kết và ghi nhận 10 đội tiếp theo là Đội tiềm năng.",
      },
    ],
  },
  "03": {
    anchor: "round-3-rules",
    icon: Trophy,
    statTone: "from-amber-500/18 via-orange-400/10 to-white/0",
    focus: {
      en: "The final is a live presentation and defense stage for the top 5 teams.",
      vi: "Vòng chung kết là giai đoạn thuyết trình và bảo vệ trực tiếp dành cho top 5 đội.",
    },
    notes: [
      {
        en: "Finalists present their project live and answer questions directly from the judging panel.",
        vi: "Các đội chung kết thuyết trình dự án trực tiếp và trả lời câu hỏi từ hội đồng giám khảo.",
      },
      {
        en: "Presentation quality, feasibility, and judge Q&A performance all influence the final score.",
        vi: "Chất lượng thuyết trình, tính khả thi và phần hỏi đáp với giám khảo đều ảnh hưởng đến điểm cuối.",
      },
      {
        en: "Final podium awards are determined only after the live final defense is completed.",
        vi: "Thứ hạng chung cuộc chỉ được xác định sau khi hoàn tất phần bảo vệ trực tiếp tại vòng chung kết.",
      },
    ],
  },
} as const;

export function RulesPage() {
  const { locale, pageContent } = useSiteState();

  return (
    <div className="space-y-16 md:space-y-20">
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <SectionHeading
          eyebrow={pickText(locale, pageContent.rules.header.eyebrow)}
          title={pickText(locale, pageContent.rules.header.title)}
          description={pickText(locale, pageContent.rules.header.description)}
        />

        <Surface className="relative overflow-hidden px-5 py-5">
          <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,rgba(23,114,208,0),rgba(23,114,208,0.92),rgba(23,114,208,0))]" />
          <p className="text-xs font-semibold uppercase tracking-[0.28em] theme-eyebrow">
            {locale === "en" ? "Quick policy read" : "Đọc nhanh"}
          </p>
          <div className="mt-5 space-y-3">
            {[
              {
                icon: <UsersRound className="h-4 w-4 text-sky-500" />,
                label:
                  locale === "en"
                    ? `${TEAM_MIN_MEMBERS}-${TEAM_MAX_MEMBERS} members are required for official Round 1 access`
                    : `Cần ${TEAM_MIN_MEMBERS}-${TEAM_MAX_MEMBERS} thành viên để vào Vòng 1 chính thức`,
              },
              {
                icon: <ShieldAlert className="h-4 w-4 text-amber-500" />,
                label:
                  locale === "en"
                    ? "Team lock must be approved by all members before Round 1 starts"
                    : "Khóa đội phải được toàn bộ thành viên đồng thuận trước khi bắt đầu Vòng 1",
              },
              {
                icon: <Medal className="h-4 w-4 text-emerald-500" />,
                label:
                  locale === "en"
                    ? "Progression is determined by team ranking at every stage"
                    : "Việc đi tiếp được quyết định theo xếp hạng đội ở từng giai đoạn",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-start gap-3 rounded-2xl border theme-border bg-white/70 px-4 py-3 text-sm leading-7 theme-text-body dark:bg-white/[0.05]"
              >
                <span className="mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl border border-sky-500/18 bg-sky-500/10">
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </Surface>
      </section>

      <section id="general-rules" className="scroll-mt-36 space-y-7">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
          <Surface className="overflow-hidden px-6 py-6 md:px-7 md:py-7">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(23,114,208,0.14),transparent_52%)]" />
            <div className="relative">
              <SectionHeading
                eyebrow={pickText(locale, pageContent.rules.coreRules.eyebrow)}
                title={pickText(locale, pageContent.rules.coreRules.title)}
                description={pickText(locale, pageContent.rules.coreRules.description)}
                className="max-w-none"
              />

              <div className="mt-7 grid gap-4 md:grid-cols-3">
                {audienceHighlights.map((item, index) => {
                  const Icon = generalRuleIcons[index] ?? Flag;

                  return (
                    <div
                      key={item.title.en}
                      className="rounded-[1.65rem] border theme-border bg-white/76 px-4 py-4 shadow-[0_16px_36px_rgba(148,163,184,0.08)] dark:bg-white/[0.05]"
                    >
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-sky-500/18 bg-sky-500/10">
                        <Icon className="h-4.5 w-4.5 text-sky-600 dark:text-sky-200" />
                      </span>
                      <p className="mt-4 text-base font-semibold theme-text-strong">
                        {pickText(locale, item.title)}
                      </p>
                      <p className="mt-3 text-sm leading-7 theme-text-soft">
                        {pickText(locale, item.description)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </Surface>

          <Surface className="px-6 py-6 md:px-7 md:py-7">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] theme-eyebrow">
              {locale === "en" ? "General policy checks" : "Điểm kiểm soát chung"}
            </p>
            <div className="mt-6 space-y-3">
              {ruleItems.map((item, index) => {
                const Icon = policyIcons[index] ?? BadgeCheck;

                return (
                  <div
                    key={item.title.en}
                    className="rounded-[1.55rem] border theme-border bg-white/70 px-4 py-4 dark:bg-white/[0.05]"
                  >
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-900/8 bg-slate-950/[0.03] dark:border-white/10 dark:bg-white/[0.04]">
                        <Icon className="h-4 w-4 theme-text-strong" />
                      </span>
                      <p className="text-sm font-semibold uppercase tracking-[0.18em] theme-text-strong">
                        {pickText(locale, item.title)}
                      </p>
                    </div>
                    <p className="mt-3 text-sm leading-7 theme-text-soft">
                      {pickText(locale, item.description)}
                    </p>
                  </div>
                );
              })}
            </div>

            <Link
              href="/competition/timeline#general-timeline"
              className="mt-6 inline-flex items-center gap-2 rounded-full border border-sky-500/22 bg-sky-500/[0.08] px-4 py-2 text-sm font-semibold text-sky-700 transition hover:border-sky-500/36 hover:bg-sky-500/[0.12] active:scale-[0.98] dark:text-sky-100"
            >
              {locale === "en" ? "Open timeline overview" : "Mở lịch trình tổng quan"}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Surface>
        </div>
      </section>

      <section className="space-y-6">
        {roundItems.map((round) => {
          const roundKey = round.id === "01" ? "round-1" : round.id === "02" ? "round-2" : "round-3";
          const roundWindow = competitionRoundWindows.find((item) => item.round === roundKey);
          const meta = roundRuleMeta[round.id as keyof typeof roundRuleMeta];
          const Icon = meta.icon;

          return (
            <section
              key={round.id}
              id={meta.anchor}
              className="scroll-mt-36 overflow-hidden rounded-[2rem] border theme-border bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(245,249,255,0.98))] px-5 py-6 shadow-[0_24px_60px_rgba(148,163,184,0.12)] dark:bg-[linear-gradient(180deg,rgba(11,23,42,0.96),rgba(7,16,31,0.98))] md:px-7 md:py-7"
            >
              <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-[1.2rem] border border-sky-500/18 bg-sky-500/10">
                      <Icon className="h-5 w-5 text-sky-600 dark:text-sky-200" />
                    </span>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.28em] theme-eyebrow">
                        {pickText(locale, round.label)}
                      </p>
                      <h3 className="theme-heading mt-2 text-2xl font-semibold theme-text-strong md:text-[2.2rem]">
                        {pickText(locale, round.title)}
                      </h3>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <span className="inline-flex items-center gap-2 rounded-full border theme-border bg-white/78 px-4 py-2 text-sm font-medium theme-text-body dark:bg-white/[0.05]">
                      <CalendarDays className="h-4 w-4 text-sky-500" />
                      {roundWindow
                        ? formatDateRangeLabel(locale, roundWindow.startDate, roundWindow.endDate)
                        : pickText(locale, round.duration)}
                    </span>
                    <span className="inline-flex max-w-xl items-start gap-2 rounded-[1.15rem] border theme-border bg-white/78 px-4 py-3 text-sm font-medium leading-6 theme-text-body dark:bg-white/[0.05]">
                      <BadgeCheck className="h-4 w-4 text-emerald-500" />
                      {pickText(locale, meta.focus)}
                    </span>
                  </div>

                  <div className="mt-6 rounded-[1.8rem] border theme-border bg-white/72 px-5 py-5 dark:bg-white/[0.05]">
                    <p className="text-sm leading-8 theme-text-body">{pickText(locale, round.description)}</p>

                    <div className="mt-5 grid gap-3 md:grid-cols-3">
                      {round.deliverables.map((deliverable) => (
                        <div
                          key={deliverable.en}
                          className={`rounded-[1.35rem] border theme-border bg-[linear-gradient(135deg,rgba(255,255,255,0.9),rgba(255,255,255,0.68))] px-4 py-4 dark:bg-[linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))]`}
                        >
                          <p className="text-xs font-semibold uppercase tracking-[0.24em] theme-eyebrow">
                            {locale === "en" ? "Deliverable" : "Đầu việc"}
                          </p>
                          <p className="mt-2 text-sm leading-7 theme-text-body">
                            {pickText(locale, deliverable)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <Surface className="relative overflow-hidden px-5 py-5">
                    <div
                      className={`absolute inset-x-0 top-0 h-20 bg-[linear-gradient(135deg,var(--tw-gradient-stops))] ${meta.statTone}`}
                    />
                    <div className="relative">
                      <p className="text-xs font-semibold uppercase tracking-[0.28em] theme-eyebrow">
                        {locale === "en" ? "Specific round rules" : "Quy định riêng của vòng"}
                      </p>
                      <div className="mt-5 space-y-3">
                        {meta.notes.map((note, index) => (
                          <div
                            key={note.en}
                            className="rounded-[1.35rem] border theme-border bg-white/76 px-4 py-4 dark:bg-white/[0.05]"
                          >
                            <div className="flex items-center gap-3">
                              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-950/[0.06] text-xs font-semibold theme-text-strong dark:bg-white/[0.08]">
                                {index + 1}
                              </span>
                              <p className="text-sm leading-7 theme-text-body">{pickText(locale, note)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Surface>

                  <Link
                    href={`/competition/timeline#${roundKey}-timeline`}
                    className="inline-flex w-full items-center justify-between rounded-[1.35rem] border border-sky-500/22 bg-sky-500/[0.08] px-4 py-3 text-sm font-semibold text-sky-700 transition hover:border-sky-500/34 hover:bg-sky-500/[0.12] active:scale-[0.99] dark:text-sky-100"
                  >
                    <span>{locale === "en" ? "Open this round on timeline page" : "Mở giai đoạn này trên trang lịch trình"}</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </section>
          );
        })}
      </section>
    </div>
  );
}
