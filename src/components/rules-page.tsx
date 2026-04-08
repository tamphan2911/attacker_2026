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
  "border-sky-700/26 bg-[linear-gradient(135deg,rgba(14,165,233,0.34),rgba(59,130,246,0.24))] text-sky-950 shadow-[0_10px_24px_rgba(14,165,233,0.1)] dark:text-sky-100",
  "border-emerald-700/26 bg-[linear-gradient(135deg,rgba(16,185,129,0.3),rgba(52,211,153,0.2))] text-emerald-950 shadow-[0_10px_24px_rgba(16,185,129,0.1)] dark:text-emerald-100",
  "border-violet-700/26 bg-[linear-gradient(135deg,rgba(124,58,237,0.28),rgba(168,85,247,0.22))] text-violet-950 shadow-[0_10px_24px_rgba(124,58,237,0.1)] dark:text-violet-100",
] as const;
const policyIcons = [Flag, ShieldAlert, NotebookPen, Medal];
const policyIconClasses = [
  "border-rose-700/24 bg-[linear-gradient(135deg,rgba(244,63,94,0.22),rgba(251,113,133,0.16))] text-rose-950 shadow-[0_10px_24px_rgba(244,63,94,0.08)] dark:text-rose-100",
  "border-amber-700/24 bg-[linear-gradient(135deg,rgba(245,158,11,0.24),rgba(251,191,36,0.16))] text-amber-950 shadow-[0_10px_24px_rgba(245,158,11,0.08)] dark:text-amber-100",
  "border-cyan-700/24 bg-[linear-gradient(135deg,rgba(6,182,212,0.24),rgba(34,211,238,0.16))] text-cyan-950 shadow-[0_10px_24px_rgba(6,182,212,0.08)] dark:text-cyan-100",
  "border-emerald-700/24 bg-[linear-gradient(135deg,rgba(16,185,129,0.24),rgba(52,211,153,0.16))] text-emerald-950 shadow-[0_10px_24px_rgba(16,185,129,0.08)] dark:text-emerald-100",
] as const;
const specificRuleIcons = [Sparkles, ShieldAlert, Medal] as const;
const quickPolicyItems = [
  {
    icon: UsersRound,
    iconClass: "border-sky-700/24 bg-[linear-gradient(135deg,rgba(14,165,233,0.3),rgba(59,130,246,0.2))] text-sky-950 shadow-[0_10px_22px_rgba(14,165,233,0.08)] dark:text-sky-100",
  },
  {
    icon: ShieldAlert,
    iconClass: "border-amber-700/24 bg-[linear-gradient(135deg,rgba(245,158,11,0.28),rgba(251,191,36,0.18))] text-amber-950 shadow-[0_10px_22px_rgba(245,158,11,0.08)] dark:text-amber-100",
  },
  {
    icon: Radar,
    iconClass: "border-emerald-700/24 bg-[linear-gradient(135deg,rgba(16,185,129,0.28),rgba(52,211,153,0.18))] text-emerald-950 shadow-[0_10px_22px_rgba(16,185,129,0.08)] dark:text-emerald-100",
  },
] as const;

const roundRuleMeta = {
  "01": {
    anchor: "round-1-rules",
    icon: FileCheck2,
    statTone: "from-sky-500/18 via-cyan-400/10 to-white/0",
    iconClass:
      "border-sky-700/24 bg-[linear-gradient(135deg,rgba(14,165,233,0.32),rgba(59,130,246,0.24))] text-sky-950 shadow-[0_12px_26px_rgba(14,165,233,0.1)] dark:text-sky-100",
    chipClass:
      "border-sky-700/24 bg-[linear-gradient(135deg,rgba(14,165,233,0.26),rgba(59,130,246,0.18))] text-sky-950 shadow-[0_12px_30px_rgba(14,165,233,0.1)] dark:border-sky-300/22 dark:bg-sky-300/[0.12] dark:text-sky-100",
    noteMarkerClass:
      "border border-sky-700/22 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(224,242,254,0.98))] text-sky-950 shadow-[0_10px_24px_rgba(14,165,233,0.1)] dark:border-sky-300/18 dark:bg-[linear-gradient(135deg,#38bdf8,#2563eb)] dark:text-white",
    deliverableIcon: Clock3,
    deliverableIconClass:
      "border-sky-700/24 bg-[linear-gradient(135deg,rgba(14,165,233,0.24),rgba(59,130,246,0.16))] text-sky-950 dark:text-sky-100",
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
    roundNotes: [
      {
        en: "Each student only has one official Round 1 attempt. Once the exam starts, it cannot be paused or restarted.",
        vi: "Mỗi sinh viên chỉ có một lượt thi Vòng 1 chính thức. Khi bài thi bắt đầu, không thể tạm dừng hoặc làm lại.",
      },
      {
        en: "Objective score is available first, while essay score stays pending until admin or moderator review is completed.",
        vi: "Điểm phần khách quan có trước, còn điểm tự luận vẫn ở trạng thái chờ cho đến khi admin hoặc moderator chấm xong.",
      },
    ],
  },
  "02": {
    anchor: "round-2-rules",
    icon: BadgeCheck,
    statTone: "from-emerald-500/16 via-teal-400/10 to-white/0",
    iconClass:
      "border-emerald-700/24 bg-[linear-gradient(135deg,rgba(16,185,129,0.3),rgba(52,211,153,0.22))] text-emerald-950 shadow-[0_12px_26px_rgba(16,185,129,0.1)] dark:text-emerald-100",
    chipClass:
      "border-emerald-700/24 bg-[linear-gradient(135deg,rgba(16,185,129,0.24),rgba(52,211,153,0.18))] text-emerald-950 shadow-[0_12px_30px_rgba(16,185,129,0.1)] dark:border-emerald-300/22 dark:bg-emerald-300/[0.12] dark:text-emerald-100",
    noteMarkerClass:
      "border border-emerald-700/22 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(220,252,231,0.98))] text-emerald-950 shadow-[0_10px_24px_rgba(16,185,129,0.1)] dark:border-emerald-300/18 dark:bg-[linear-gradient(135deg,#34d399,#059669)] dark:text-white",
    deliverableIcon: NotebookPen,
    deliverableIconClass:
      "border-emerald-700/24 bg-[linear-gradient(135deg,rgba(16,185,129,0.24),rgba(52,211,153,0.16))] text-emerald-950 dark:text-emerald-100",
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
    roundNotes: [
      {
        en: "The team leader is responsible for the official upload, but all members should align on the final report version before submission.",
        vi: "Đội trưởng chịu trách nhiệm nộp bài chính thức, nhưng toàn bộ thành viên nên thống nhất phiên bản báo cáo cuối cùng trước khi nộp.",
      },
      {
        en: "Only the latest valid submission version is used for judging once the Round 2 deadline closes.",
        vi: "Khi hạn nộp Vòng 2 kết thúc, chỉ phiên bản hợp lệ mới nhất mới được dùng để chấm điểm.",
      },
    ],
  },
  "03": {
    anchor: "round-3-rules",
    icon: Trophy,
    statTone: "from-amber-500/18 via-orange-400/10 to-white/0",
    iconClass:
      "border-amber-700/24 bg-[linear-gradient(135deg,rgba(245,158,11,0.32),rgba(249,115,22,0.22))] text-amber-950 shadow-[0_12px_26px_rgba(245,158,11,0.1)] dark:text-amber-100",
    chipClass:
      "border-amber-700/24 bg-[linear-gradient(135deg,rgba(245,158,11,0.26),rgba(249,115,22,0.18))] text-amber-950 shadow-[0_12px_30px_rgba(245,158,11,0.1)] dark:border-amber-300/22 dark:bg-amber-300/[0.12] dark:text-amber-100",
    noteMarkerClass:
      "border border-amber-700/22 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(254,243,199,0.98))] text-amber-950 shadow-[0_10px_24px_rgba(245,158,11,0.1)] dark:border-amber-300/18 dark:bg-[linear-gradient(135deg,#fbbf24,#f97316)] dark:text-white",
    deliverableIcon: Orbit,
    deliverableIconClass:
      "border-amber-700/24 bg-[linear-gradient(135deg,rgba(245,158,11,0.24),rgba(249,115,22,0.16))] text-amber-950 dark:text-amber-100",
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
    roundNotes: [
      {
        en: "Teams should prepare both the formal pitch deck and a concise response plan for live judge questions.",
        vi: "Các đội nên chuẩn bị cả slide thuyết trình chính thức và phương án trả lời ngắn gọn cho phần hỏi đáp trực tiếp với giám khảo.",
      },
      {
        en: "Final-stage logistics, presentation order, and check-in instructions should be reviewed carefully before defense day.",
        vi: "Thông tin hậu cần, thứ tự trình bày và hướng dẫn check-in của vòng chung kết cần được xem kỹ trước ngày bảo vệ.",
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
              const iconClass = quickPolicyItems[index]?.iconClass ?? "border-sky-700/24 bg-[linear-gradient(135deg,rgba(14,165,233,0.28),rgba(59,130,246,0.18))] text-sky-950 dark:text-sky-100";

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
                    <div className="flex min-w-0 flex-1 items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-[0.28em] theme-eyebrow">
                          {pickText(locale, round.label)}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-3">
                          <h3 className="theme-heading text-2xl font-semibold theme-text-strong md:text-[2.2rem]">
                            {pickText(locale, round.title)}
                          </h3>
                          <div className="group relative">
                            <Link
                              href={`/competition/timeline#${roundKey}-timeline`}
                              aria-label={
                                locale === "en"
                                  ? "Open this round on the timeline page"
                                  : "Mở giai đoạn này trên trang lịch trình"
                              }
                              className={`inline-flex h-11 w-11 items-center justify-center rounded-full border transition hover:-translate-y-0.5 active:translate-y-0 ${meta.chipClass}`}
                            >
                              <CalendarDays className="h-4.5 w-4.5" />
                            </Link>
                            <span className="theme-header-tooltip pointer-events-none absolute right-0 top-full z-20 mt-3 whitespace-nowrap rounded-full px-3 py-1.5 text-[0.68rem] font-medium opacity-0 transition duration-200 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100">
                              {locale === "en"
                                ? "Open this round on timeline page"
                                : "Mở giai đoạn này trên trang lịch trình"}
                            </span>
                          </div>
                        </div>
                      </div>
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
                        {meta.notes.map((note, index) => {
                          const NoteIcon = specificRuleIcons[index] ?? Sparkles;

                          return (
                            <div
                              key={note.en}
                              className="theme-rules-note-card rounded-[1.35rem] border px-4 py-4"
                            >
                              <div className="flex items-center gap-3">
                                <span className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[0.95rem] ${meta.noteMarkerClass}`}>
                                  <NoteIcon className="h-4 w-4" />
                                </span>
                                <p className="text-sm leading-7 theme-text-body">{pickText(locale, note)}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </Surface>
                </div>
              </div>

              <Surface className="theme-rules-shell mt-6 overflow-hidden px-5 py-5">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] theme-eyebrow">
                  {locale === "en" ? "Round notes" : "Lưu ý của vòng"}
                </p>
                <div className="mt-5 grid gap-3 lg:grid-cols-2">
                  {meta.roundNotes.map((note) => (
                    <div
                      key={note.en}
                      className="theme-rules-note-card flex items-start gap-3 rounded-[1.35rem] border px-4 py-4"
                    >
                      <span className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[0.95rem] ${meta.noteMarkerClass}`}>
                        <NotebookPen className="h-4 w-4" />
                      </span>
                      <p className="text-sm leading-7 theme-text-body">{pickText(locale, note)}</p>
                    </div>
                  ))}
                </div>
              </Surface>
            </section>
          );
        })}
      </section>
    </div>
  );
}
