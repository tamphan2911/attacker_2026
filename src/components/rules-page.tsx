"use client";

import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileCheck2,
  Flag,
  GraduationCap,
  Medal,
  NotebookPen,
  Orbit,
  Radar,
  ShieldAlert,
  Sparkles,
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

const generalRuleIcons = [UsersRound, GraduationCap, Sparkles];
const generalRuleIconClasses = [
  "border-sky-600/24 bg-[linear-gradient(135deg,rgba(14,165,233,0.26),rgba(59,130,246,0.2))] text-sky-800 dark:text-sky-100",
  "border-emerald-600/24 bg-[linear-gradient(135deg,rgba(16,185,129,0.24),rgba(52,211,153,0.18))] text-emerald-800 dark:text-emerald-100",
  "border-violet-600/24 bg-[linear-gradient(135deg,rgba(124,58,237,0.24),rgba(168,85,247,0.18))] text-violet-800 dark:text-violet-100",
] as const;
const policyIcons = [Flag, ShieldAlert, NotebookPen, Medal];
const policyIconClasses = [
  "border-rose-600/24 bg-rose-500/14 text-rose-800 dark:text-rose-100",
  "border-amber-600/24 bg-amber-500/14 text-amber-800 dark:text-amber-100",
  "border-cyan-600/24 bg-cyan-500/14 text-cyan-800 dark:text-cyan-100",
  "border-emerald-600/24 bg-emerald-500/14 text-emerald-800 dark:text-emerald-100",
] as const;
const quickPolicyItems = [
  {
    icon: UsersRound,
    iconClass: "border-sky-600/24 bg-sky-500/16 text-sky-800 dark:text-sky-100",
  },
  {
    icon: ShieldAlert,
    iconClass: "border-amber-600/24 bg-amber-500/16 text-amber-800 dark:text-amber-100",
  },
  {
    icon: Radar,
    iconClass: "border-emerald-600/24 bg-emerald-500/16 text-emerald-800 dark:text-emerald-100",
  },
] as const;

const roundRuleMeta = {
  "01": {
    anchor: "round-1-rules",
    icon: FileCheck2,
    statTone: "from-sky-500/18 via-cyan-400/10 to-white/0",
    iconClass:
      "border-sky-600/24 bg-[linear-gradient(135deg,rgba(14,165,233,0.24),rgba(59,130,246,0.2))] text-sky-800 dark:text-sky-100",
    chipClass:
      "border-sky-600/24 bg-[linear-gradient(135deg,rgba(14,165,233,0.18),rgba(59,130,246,0.14))] text-sky-800 shadow-[0_12px_30px_rgba(14,165,233,0.08)] dark:border-sky-300/22 dark:bg-sky-300/[0.12] dark:text-sky-100",
    noteNumberClass:
      "bg-[linear-gradient(135deg,#0ea5e9,#2563eb)] text-white dark:bg-[linear-gradient(135deg,#38bdf8,#2563eb)]",
    deliverableIcon: Clock3,
    deliverableIconClass:
      "border-sky-600/24 bg-sky-500/14 text-sky-800 dark:text-sky-100",
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
    iconClass:
      "border-emerald-600/24 bg-[linear-gradient(135deg,rgba(16,185,129,0.24),rgba(52,211,153,0.2))] text-emerald-800 dark:text-emerald-100",
    chipClass:
      "border-emerald-600/24 bg-[linear-gradient(135deg,rgba(16,185,129,0.18),rgba(52,211,153,0.14))] text-emerald-800 shadow-[0_12px_30px_rgba(16,185,129,0.08)] dark:border-emerald-300/22 dark:bg-emerald-300/[0.12] dark:text-emerald-100",
    noteNumberClass:
      "bg-[linear-gradient(135deg,#10b981,#059669)] text-white dark:bg-[linear-gradient(135deg,#34d399,#059669)]",
    deliverableIcon: NotebookPen,
    deliverableIconClass:
      "border-emerald-600/24 bg-emerald-500/14 text-emerald-800 dark:text-emerald-100",
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
    iconClass:
      "border-amber-600/24 bg-[linear-gradient(135deg,rgba(245,158,11,0.24),rgba(249,115,22,0.2))] text-amber-800 dark:text-amber-100",
    chipClass:
      "border-amber-600/24 bg-[linear-gradient(135deg,rgba(245,158,11,0.18),rgba(249,115,22,0.14))] text-amber-800 shadow-[0_12px_30px_rgba(245,158,11,0.08)] dark:border-amber-300/22 dark:bg-amber-300/[0.12] dark:text-amber-100",
    noteNumberClass:
      "bg-[linear-gradient(135deg,#f59e0b,#f97316)] text-white dark:bg-[linear-gradient(135deg,#fbbf24,#f97316)]",
    deliverableIcon: Orbit,
    deliverableIconClass:
      "border-amber-600/24 bg-amber-500/14 text-amber-800 dark:text-amber-100",
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

        <Surface className="theme-rules-shell relative overflow-hidden px-5 py-5">
          <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,rgba(23,114,208,0),rgba(23,114,208,0.92),rgba(23,114,208,0))]" />
          <p className="text-xs font-semibold uppercase tracking-[0.28em] theme-eyebrow">
            {locale === "en" ? "Quick policy read" : "Đọc nhanh"}
          </p>
          <div className="mt-5 space-y-3">
            {[
              {
                label:
                  locale === "en"
                    ? `${TEAM_MIN_MEMBERS}-${TEAM_MAX_MEMBERS} members are required for official Round 1 access`
                    : `Cần ${TEAM_MIN_MEMBERS}-${TEAM_MAX_MEMBERS} thành viên để vào Vòng 1 chính thức`,
              },
              {
                label:
                  locale === "en"
                    ? "Team lock must be approved by all members before Round 1 starts"
                    : "Khóa đội phải được toàn bộ thành viên đồng thuận trước khi bắt đầu Vòng 1",
              },
              {
                label:
                  locale === "en"
                    ? "Progression is determined by team ranking at every stage"
                    : "Việc đi tiếp được quyết định theo xếp hạng đội ở từng giai đoạn",
              },
            ].map((item, index) => {
              const Icon = quickPolicyItems[index]?.icon ?? BadgeCheck;
              const iconClass = quickPolicyItems[index]?.iconClass ?? "border-sky-600/24 bg-sky-500/14 text-sky-800 dark:text-sky-100";

              return (
              <div
                key={item.label}
                className="theme-rules-note-card flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm leading-7 theme-text-body"
              >
                <span className={`mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl border ${iconClass}`}>
                  <Icon className="h-4 w-4" />
                </span>
                <span>{item.label}</span>
              </div>
              );
            })}
          </div>
        </Surface>
      </section>

      <section id="general-rules" className="scroll-mt-36 space-y-7">
        <Surface className="theme-rules-shell overflow-hidden px-6 py-6 md:px-7 md:py-7">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(23,114,208,0.14),transparent_52%)]" />
          <div className="relative">
            <SectionHeading
              eyebrow={pickText(locale, pageContent.rules.coreRules.eyebrow)}
              title={pickText(locale, pageContent.rules.coreRules.title)}
              className="max-w-none"
            />

            <div className="mt-7 grid gap-4 md:grid-cols-3">
              {audienceHighlights.map((item, index) => {
                const Icon = generalRuleIcons[index] ?? Flag;
                const iconClass = generalRuleIconClasses[index] ?? generalRuleIconClasses[0];

                return (
                  <div
                    key={item.title.en}
                    className="theme-rules-soft-panel rounded-[1.65rem] border px-4 py-4"
                  >
                    <span className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl border ${iconClass}`}>
                      <Icon className="h-4.5 w-4.5" />
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

            <div className="mt-8 border-t theme-border pt-7">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] theme-eyebrow">
                {locale === "en" ? "General policy checks" : "Điểm kiểm soát chung"}
              </p>
              <div className="mt-6 grid gap-3 xl:grid-cols-2">
                {ruleItems.map((item, index) => {
                  const Icon = policyIcons[index] ?? BadgeCheck;
                  const iconClass = policyIconClasses[index] ?? policyIconClasses[0];

                  return (
                    <div
                      key={item.title.en}
                      className="theme-rules-note-card rounded-[1.55rem] border px-4 py-4"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`inline-flex h-9 w-9 items-center justify-center rounded-2xl border ${iconClass}`}>
                          <Icon className="h-4 w-4" />
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
                className="mt-6 inline-flex items-center gap-2 rounded-full border border-sky-500/24 bg-[linear-gradient(135deg,rgba(14,165,233,0.12),rgba(59,130,246,0.08))] px-4 py-2 text-sm font-semibold text-sky-700 transition hover:border-sky-500/36 hover:bg-[linear-gradient(135deg,rgba(14,165,233,0.16),rgba(59,130,246,0.12))] active:scale-[0.98] dark:text-sky-100"
              >
                {locale === "en" ? "Open timeline overview" : "Mở lịch trình tổng quan"}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </Surface>
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
              className="theme-rules-round-shell scroll-mt-36 overflow-hidden rounded-[2rem] border px-5 py-6 md:px-7 md:py-7"
            >
              <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={`inline-flex h-11 w-11 items-center justify-center rounded-[1.2rem] border ${meta.iconClass}`}>
                      <Icon className="h-5 w-5" />
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
                    <span className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium ${meta.chipClass}`}>
                      <CalendarDays className="h-4 w-4" />
                      {roundWindow
                        ? formatDateRangeLabel(locale, roundWindow.startDate, roundWindow.endDate)
                        : pickText(locale, round.duration)}
                    </span>
                    <span className={`inline-flex max-w-xl items-start gap-2 rounded-[1.15rem] border px-4 py-3 text-sm font-medium leading-6 ${meta.chipClass}`}>
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      {pickText(locale, meta.focus)}
                    </span>
                  </div>

                  <div className="theme-rules-soft-panel mt-6 rounded-[1.8rem] border px-5 py-5">
                    <p className="text-sm leading-8 theme-text-body">{pickText(locale, round.description)}</p>

                    <div className="mt-5 grid gap-3 md:grid-cols-3">
                      {round.deliverables.map((deliverable, deliverableIndex) => {
                        const DeliverableIcon = meta.deliverableIcon;

                        return (
                        <div
                          key={deliverable.en}
                          className="theme-rules-note-card rounded-[1.35rem] border px-4 py-4"
                        >
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex h-8 w-8 items-center justify-center rounded-2xl border ${meta.deliverableIconClass}`}>
                              <DeliverableIcon className="h-4 w-4" />
                            </span>
                            <p className="text-xs font-semibold uppercase tracking-[0.24em] theme-eyebrow">
                              {locale === "en" ? `Deliverable ${deliverableIndex + 1}` : `Đầu việc ${deliverableIndex + 1}`}
                            </p>
                          </div>
                          <p className="mt-2 text-sm leading-7 theme-text-body">
                            {pickText(locale, deliverable)}
                          </p>
                        </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <Surface className="theme-rules-shell relative overflow-hidden px-5 py-5">
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
                            className="theme-rules-note-card rounded-[1.35rem] border px-4 py-4"
                          >
                            <div className="flex items-center gap-3">
                              <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${meta.noteNumberClass}`}>
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
                    className={`inline-flex w-full items-center justify-between rounded-[1.35rem] border px-4 py-3 text-sm font-semibold transition active:scale-[0.99] ${meta.chipClass}`}
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
