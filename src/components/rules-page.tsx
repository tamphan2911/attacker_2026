"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Download,
  FileCheck2,
  FileDown,
  FileText,
  Flag,
  GraduationCap,
  Medal,
  NotebookPen,
  Orbit,
  ShieldAlert,
  Sparkles,
  Trophy,
  UsersRound,
} from "lucide-react";

import { useSiteState } from "@/components/providers/site-state-provider";
import { SectionHeading, Surface } from "@/components/site-ui";
import { getCompetitionRoundWindow } from "@/lib/competition";
import {
  reportTemplateFileDefinitions,
  type ReportTemplateFileId,
} from "@/lib/report-template-files";
import { rubricFileDefinitions, type RubricFileId } from "@/lib/rubric-files";
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

const roundRubricLinks: Record<"01" | "02" | "03", RubricFileId> = {
  "01": "round-1-essay",
  "02": "round-2-report",
  "03": "round-3-final-presentation",
};

const roundTemplateLinks: Partial<Record<"01" | "02" | "03", ReportTemplateFileId>> = {
  "02": "round-2-report-template",
};

function renderInlineRichText(text: string) {
  const parts: React.ReactNode[] = [];
  const pattern = /(\*\*([^*]+)\*\*|\*([^*]+)\*|\[([^\]]+)\]\((https?:\/\/[^)\s]+)\))/gu;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    if (match[2]) {
      parts.push(<strong key={`strong-${match.index}`}>{match[2]}</strong>);
    } else if (match[3]) {
      parts.push(<em key={`em-${match.index}`}>{match[3]}</em>);
    } else if (match[4] && match[5]) {
      parts.push(
        <a
          key={`link-${match.index}`}
          href={match[5]}
          target="_blank"
          rel="noreferrer"
          className="font-semibold text-[var(--brand)] underline-offset-4 hover:underline"
        >
          {match[4]}
        </a>,
      );
    }

    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

function RichRulesText({ body }: { body: string }) {
  const lines = body.split(/\n+/u).map((line) => line.trim()).filter(Boolean);
  if (!lines.length) {
    return null;
  }

  return (
    <div className="space-y-3">
      {lines.map((line, index) => {
        if (line.startsWith("## ")) {
          return (
            <h5 key={`${line}-${index}`} className="theme-heading text-lg font-semibold theme-text-strong">
              {renderInlineRichText(line.slice(3).trim())}
            </h5>
          );
        }

        if (line.startsWith("> ")) {
          return (
            <blockquote
              key={`${line}-${index}`}
              className="rounded-[1.15rem] border-l-4 border-sky-400/70 bg-sky-100/50 px-4 py-3 text-sm leading-7 theme-text-body dark:bg-sky-300/10"
            >
              {renderInlineRichText(line.slice(2).trim())}
            </blockquote>
          );
        }

        if (line.startsWith("- ")) {
          return (
            <ul key={`${line}-${index}`} className="list-disc pl-5 text-sm leading-7 theme-text-body">
              <li>{renderInlineRichText(line.slice(2).trim())}</li>
            </ul>
          );
        }

        if (/^\d+\.\s/u.test(line)) {
          return (
            <ol key={`${line}-${index}`} className="list-decimal pl-5 text-sm leading-7 theme-text-body">
              <li>{renderInlineRichText(line.replace(/^\d+\.\s/u, "").trim())}</li>
            </ol>
          );
        }

        return (
          <p key={`${line}-${index}`} className="text-sm leading-8 theme-text-body">
            {renderInlineRichText(line)}
          </p>
        );
      })}
    </div>
  );
}

type PublicRubricRecord = {
  id: RubricFileId;
  downloadUrl: string;
};

type PublicReportTemplateRecord = {
  id: ReportTemplateFileId;
  downloadUrl: string;
};

function RoundDownloadCard({
  title,
  buttonLabel,
  unavailableLabel,
  downloadUrl,
  kind,
}: {
  title: string;
  buttonLabel: string;
  unavailableLabel: string;
  downloadUrl?: string;
  kind: "rubric" | "template";
}) {
  const Icon = kind === "rubric" ? FileDown : FileText;

  return (
    <div className="theme-rules-note-card rounded-[1.35rem] border px-4 py-4">
      <div className="flex items-start gap-3">
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[1rem] border border-sky-700/24 bg-[linear-gradient(135deg,rgba(14,165,233,0.24),rgba(59,130,246,0.14))] text-sky-950 dark:border-sky-300/20 dark:bg-sky-300/[0.12] dark:text-sky-100">
          <Icon className="h-4.5 w-4.5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold theme-text-strong">{title}</p>
          {downloadUrl ? (
            <a
              href={downloadUrl}
              aria-label={buttonLabel}
              title={buttonLabel}
              className="theme-button-primary mt-4 inline-flex h-11 w-11 items-center justify-center rounded-full p-0 transition hover:-translate-y-0.5 active:translate-y-0"
            >
              <Download className="h-5 w-5" />
            </a>
          ) : (
            <p className="mt-4 rounded-[1rem] border border-amber-300/38 bg-amber-300/12 px-3 py-2 text-sm font-semibold text-amber-800 dark:border-amber-200/24 dark:text-amber-100">
              {unavailableLabel}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

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
        en: "Every member takes one timed paper consisting of 40 objective questions and 2 essay questions.",
        vi: "Mỗi thành viên làm bài vòng 1 gồm 40 câu trắc nghiệm và 2 câu tự luận.",
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
        vi: "Điểm trắc nghiệm được chấm tự động, điểm tự luận sẽ được công bố sau khi có kết quả từ Ban giám khảo.",
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
      vi: "Các đội thi nộp báo cáo mô tả dự án.",
    },
    notes: [
      {
        en: "Only teams qualified from Round 1 can access the Round 2 submission center.",
        vi: "Chỉ các đội vượt qua Vòng 1 mới được truy cập khu vực nộp bài Vòng 2.",
      },
      {
        en: "Team leaders submit the official report file, while all previous versions remain visible for tracking.",
        vi: "Báo cáo vòng 2 được nộp bởi đội trưởng.",
      },
      {
        en: "Judge scoring selects the top 5 teams for the final and qualifies the next 20 teams for the Emerging round.",
        vi: "Bài thi vòng 2 của mỗi đội được chấm bởi 02 giám khảo theo phân bổ của Ban tổ chức.",
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
      en: "The final has two connected steps: final report deadline, then live presentation and defense.",
      vi: "Vòng chung kết có hai bước liên tiếp: hạn nộp báo cáo cuối, sau đó là thuyết trình và bảo vệ trực tiếp.",
    },
    notes: [
      {
        en: "Finalist teams must submit the updated final report and pitch deck before the final-report deadline closes.",
        vi: "Các đội thi chung kết cần nộp lại báo cáo cuối cùng cho Ban tổ chức.",
      },
      {
        en: "After the report deadline, teams move into the live presentation and judge Q&A stage on final event day.",
        vi: "20 đội thi bảng Ươm mầm chỉnh sửa báo cáo và nộp lại cho Ban tổ chức. 10 đội đạt giải Ươm mầm được công bố theo lịch trình của Ban tổ chức.",
      },
      {
        en: "Final podium awards are determined only after the live final defense is completed.",
        vi: "Thứ hạng chung cuộc chỉ được xác định sau khi hoàn tất phần bảo vệ trực tiếp tại vòng chung kết.",
      },
    ],
    roundNotes: [
      {
        en: "The final report deadline closes before presentation day, so teams should freeze the submitted deck and report early enough for rehearsal.",
        vi: "5 đội thi chung kết cần nộp slide trình bày qua email cho Ban tổ chức, hoặc liên hệ Ban tổ chức để được hỗ trợ.",
      },
      {
        en: "Final-stage logistics, presentation order, and check-in instructions should be reviewed carefully after the report deadline and before defense day.",
        vi: "Thứ tự trình bày tại chung kết được bốc thăm bởi đại diện các đội thi chung kết.",
      },
    ],
  },
} as const;

export function RulesPage() {
  const { locale, pageContent, timelineItems } = useSiteState();
  const [rubricRecords, setRubricRecords] = useState<PublicRubricRecord[]>([]);
  const [reportTemplateRecords, setReportTemplateRecords] = useState<PublicReportTemplateRecord[]>([]);
  const generalHighlights = pageContent.rules.generalHighlights;
  const generalPolicyChecks = pageContent.rules.generalPolicyChecks;
  const rulesRounds = pageContent.rules.rounds;
  const rubricRecordById = new Map<RubricFileId, PublicRubricRecord>(
    rubricRecords.map((rubric) => [rubric.id, rubric]),
  );
  const reportTemplateRecordById = new Map<ReportTemplateFileId, PublicReportTemplateRecord>(
    reportTemplateRecords.map((template) => [template.id, template]),
  );

  useEffect(() => {
    let active = true;

    async function loadRubricRecords() {
      const response = await fetch("/api/rubrics", { cache: "no-store" });
      const payload = (await response.json().catch(() => null)) as { rubrics?: PublicRubricRecord[] } | null;

      if (active && response.ok) {
        setRubricRecords(payload?.rubrics ?? []);
      }
    }

    void loadRubricRecords().catch(() => {
      if (active) {
        setRubricRecords([]);
      }
    });

    async function loadReportTemplateRecords() {
      const response = await fetch("/api/report-templates", { cache: "no-store" });
      const payload = (await response.json().catch(() => null)) as { templates?: PublicReportTemplateRecord[] } | null;

      if (active && response.ok) {
        setReportTemplateRecords(payload?.templates ?? []);
      }
    }

    void loadReportTemplateRecords().catch(() => {
      if (active) {
        setReportTemplateRecords([]);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-16 md:space-y-20">
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
              {generalHighlights.map((item, index) => {
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
                {pickText(locale, pageContent.rules.generalPolicyChecksLabel)}
              </p>
              <div className="mt-6 grid gap-3 xl:grid-cols-2">
                {generalPolicyChecks.map((item, index) => {
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
                {pickText(locale, pageContent.rules.openTimelineOverviewLabel)}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </Surface>
      </section>

      <section className="space-y-6">
        {rulesRounds.map((round) => {
          const roundKey = round.id === "01" ? "round-1" : round.id === "02" ? "round-2" : "round-3";
          const roundWindow = getCompetitionRoundWindow(roundKey, timelineItems);
          const meta = roundRuleMeta[round.id as keyof typeof roundRuleMeta];
          const Icon = meta.icon;
          const rubricId = roundRubricLinks[round.id as keyof typeof roundRubricLinks];
          const rubricDefinition = rubricFileDefinitions.find((definition) => definition.id === rubricId)!;
          const rubricRecord = rubricRecordById.get(rubricId);
          const templateId = roundTemplateLinks[round.id as keyof typeof roundTemplateLinks];
          const templateDefinition = templateId
            ? reportTemplateFileDefinitions.find((definition) => definition.id === templateId)
            : undefined;
          const templateRecord = templateId ? reportTemplateRecordById.get(templateId) : undefined;

          return (
            <section
              key={round.id}
              id={meta.anchor}
              className="theme-rules-round-shell scroll-mt-36 overflow-hidden rounded-[2rem] border px-5 py-6 md:px-7 md:py-7"
            >
              <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] theme-eyebrow">
                    {pickText(locale, round.label)}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <span className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[1.2rem] border ${meta.iconClass}`}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
                      <h3 className="theme-heading min-w-0 text-2xl font-semibold theme-text-strong md:text-[2.2rem]">
                        {pickText(locale, round.title)}
                      </h3>
                      <div className="flex shrink-0 items-center gap-2">
                        <div className="group relative">
                          {rubricRecord ? (
                            <a
                              href={rubricRecord.downloadUrl}
                              aria-label={pickText(locale, rubricDefinition.publicDownloadLabel)}
                              className={`inline-flex h-11 w-11 items-center justify-center rounded-full border transition hover:-translate-y-0.5 active:translate-y-0 ${meta.chipClass}`}
                            >
                              <FileDown className="h-4.5 w-4.5" />
                            </a>
                          ) : (
                            <button
                              type="button"
                              aria-disabled="true"
                              aria-label={pickText(locale, rubricDefinition.publicDownloadLabel)}
                              className={`inline-flex h-11 w-11 cursor-not-allowed items-center justify-center rounded-full border opacity-60 ${meta.chipClass}`}
                            >
                              <FileDown className="h-4.5 w-4.5" />
                            </button>
                          )}
                          <span className="theme-header-tooltip pointer-events-none absolute right-0 top-full z-20 mt-3 whitespace-nowrap rounded-full px-3 py-1.5 text-[0.68rem] font-medium opacity-0 transition duration-200 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100">
                            {rubricRecord
                              ? pickText(locale, rubricDefinition.publicDownloadLabel)
                              : locale === "en"
                                ? "Rubric PDF is not uploaded yet"
                                : "Chưa có file rubric PDF"}
                          </span>
                        </div>
                        {templateDefinition ? (
                          <div className="group relative">
                            {templateRecord ? (
                              <a
                                href={templateRecord.downloadUrl}
                                aria-label={pickText(locale, templateDefinition.publicDownloadLabel)}
                                className={`inline-flex h-11 w-11 items-center justify-center rounded-full border transition hover:-translate-y-0.5 active:translate-y-0 ${meta.chipClass}`}
                              >
                                <FileText className="h-4.5 w-4.5" />
                              </a>
                            ) : (
                              <button
                                type="button"
                                aria-disabled="true"
                                aria-label={pickText(locale, templateDefinition.publicDownloadLabel)}
                                className={`inline-flex h-11 w-11 cursor-not-allowed items-center justify-center rounded-full border opacity-60 ${meta.chipClass}`}
                              >
                                <FileText className="h-4.5 w-4.5" />
                              </button>
                            )}
                            <span className="theme-header-tooltip pointer-events-none absolute right-0 top-full z-20 mt-3 whitespace-nowrap rounded-full px-3 py-1.5 text-[0.68rem] font-medium opacity-0 transition duration-200 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100">
                              {templateRecord
                                ? pickText(locale, templateDefinition.publicDownloadLabel)
                                : locale === "en"
                                  ? "Round 2 report template is not uploaded yet"
                                  : "Chưa có file mẫu báo cáo Vòng 2"}
                            </span>
                          </div>
                        ) : null}
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
                            {pickText(locale, pageContent.rules.openRoundOnTimelineLabel)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <span className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium ${meta.chipClass}`}>
                      <CalendarDays className="h-4 w-4" />
                      {roundWindow
                        ? formatDateRangeLabel(locale, roundWindow.startDate, roundWindow.endDate, roundWindow.startTime, roundWindow.endTime)
                        : pickText(locale, round.duration)}
                    </span>
                    <span className={`inline-flex max-w-xl items-start gap-2 rounded-[1.15rem] border px-4 py-3 text-sm font-medium leading-6 ${meta.chipClass}`}>
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      {pickText(locale, round.focus)}
                    </span>
                  </div>

                  <div className="theme-rules-soft-panel mt-6 rounded-[1.8rem] border px-5 py-5">
                    <p className="text-sm leading-8 theme-text-body">{pickText(locale, round.description)}</p>

                    <div className="mt-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.28em] theme-eyebrow">
                        {pickText(locale, pageContent.rules.specificRoundRulesLabel)}
                      </p>
                      {round.id === "03" ? (
                        <div className="mt-5 space-y-6">
                          <div>
                            <p className="theme-heading text-lg font-semibold theme-text-strong">
                              {locale === "en" ? "Emerging round" : "Vòng Đội ươm mầm"}
                            </p>
                            <div className="mt-3">
                              <RichRulesText
                                body={
                                  pickText(locale, round.round3EmergingRules ?? {
                                    en: round.specificRules.map((item) => item.en).join("\n"),
                                    vi: round.specificRules.map((item) => item.vi).join("\n"),
                                  })
                                }
                              />
                            </div>
                          </div>
                          <div className="border-t theme-border" />
                          <div>
                            <p className="theme-heading text-lg font-semibold theme-text-strong">
                              {locale === "en" ? "Final" : "Chung kết"}
                            </p>
                            <div className="mt-3">
                              <RichRulesText
                                body={
                                  pickText(locale, round.round3FinalRules ?? {
                                    en: round.specificRules.map((item) => item.en).join("\n"),
                                    vi: round.specificRules.map((item) => item.vi).join("\n"),
                                  })
                                }
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-4 grid gap-3 md:grid-cols-3">
                          {round.specificRules.map((note, index) => {
                            const NoteIcon = specificRuleIcons[index] ?? Sparkles;

                            return (
                            <div
                              key={note.en}
                              className="theme-rules-note-card rounded-[1.35rem] border px-4 py-4"
                            >
                              <div className="flex items-start gap-3">
                                <span className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl ${meta.noteMarkerClass}`}>
                                  <NoteIcon className="h-4 w-4" />
                                </span>
                                <p className="text-sm leading-7 theme-text-body">
                                  {pickText(locale, note)}
                                </p>
                              </div>
                            </div>
                            );
                          })}
                        </div>
                      )}
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
                        {pickText(locale, pageContent.rules.roundNotesLabel)}
                      </p>
                      <div className="mt-5 space-y-3">
                        {round.roundNotes.map((note) => (
                          <div
                            key={note.en}
                            className="theme-rules-note-card rounded-[1.35rem] border px-4 py-4"
                          >
                            <div className="flex items-center gap-3">
                              <span className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[0.95rem] ${meta.noteMarkerClass}`}>
                                <NotebookPen className="h-4 w-4" />
                              </span>
                              <p className="text-sm leading-7 theme-text-body">{pickText(locale, note)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Surface>
                  <Surface className="theme-rules-shell relative overflow-hidden px-5 py-5">
                    <div
                      className={`absolute inset-x-0 top-0 h-20 bg-[linear-gradient(135deg,var(--tw-gradient-stops))] ${meta.statTone}`}
                    />
                    <div className="relative">
                      <p className="text-xs font-semibold uppercase tracking-[0.28em] theme-eyebrow">
                        {locale === "en" ? "Download files" : "Tải tệp cần thiết"}
                      </p>
                      <div className="mt-5 space-y-3">
                        <RoundDownloadCard
                          kind="rubric"
                          title={pickText(locale, rubricDefinition.label)}
                          buttonLabel={pickText(locale, rubricDefinition.publicDownloadLabel)}
                          unavailableLabel={
                            locale === "en"
                              ? "Rubric PDF is not uploaded yet."
                              : "Chưa có file rubric PDF."
                          }
                          downloadUrl={rubricRecord?.downloadUrl}
                        />

                        {templateDefinition ? (
                          <RoundDownloadCard
                            kind="template"
                            title={pickText(locale, templateDefinition.label)}
                            buttonLabel={pickText(locale, templateDefinition.publicDownloadLabel)}
                            unavailableLabel={
                              locale === "en"
                                ? "Report template is not uploaded yet."
                                : "Chưa có file mẫu báo cáo."
                            }
                            downloadUrl={templateRecord?.downloadUrl}
                          />
                        ) : null}
                      </div>
                    </div>
                  </Surface>
                </div>
              </div>
            </section>
          );
        })}
      </section>
    </div>
  );
}
