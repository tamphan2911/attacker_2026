"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  CircleDashed,
  Download,
  FileCheck2,
  FilePenLine,
  Medal,
  NotebookPen,
  UserRound,
} from "lucide-react";

import { useSiteState } from "@/components/providers/site-state-provider";
import { PageIntro, SectionHeading, StatusPill, Surface } from "@/components/site-ui";
import { isRound2Started } from "@/lib/competition";
import { formatDateLabel, pickLocalizedText } from "@/lib/site";
import type {
  CompetitionRoundKey,
  JudgeDashboardData,
  JudgeDashboardRound1Task,
  JudgeDashboardTask,
  JudgeDashboardTeamTask,
  Locale,
} from "@/types/site";

function cn(...values: Array<string | false | undefined>) {
  return values.filter(Boolean).join(" ");
}

function formatDateTimeLabel(locale: Locale, value: string) {
  return new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

const roundMeta: Record<
  CompetitionRoundKey,
  {
    label: Record<Locale, string>;
    title: Record<Locale, string>;
    description: Record<Locale, string>;
    icon: typeof Medal;
    iconClassName: string;
  }
> = {
  "round-1": {
    label: { en: "Round 1", vi: "Vòng 1" },
    title: { en: "Essay scoring queue", vi: "Hàng chờ chấm tự luận" },
    description: {
      en: "Review each participant's essay responses and save your judge score.",
      vi: "Xem phần tự luận của từng thí sinh và lưu điểm chấm của bạn.",
    },
    icon: NotebookPen,
    iconClassName:
      "bg-[linear-gradient(135deg,#1d4ed8,#0ea5e9)] text-white shadow-[0_16px_32px_rgba(14,116,221,0.18)]",
  },
  "round-2": {
    label: { en: "Round 2", vi: "Vòng 2" },
    title: { en: "Report review queue", vi: "Hàng chờ chấm báo cáo" },
    description: {
      en: "Download the latest team reports, then enter your score and notes.",
      vi: "Tải báo cáo mới nhất của đội thi, sau đó nhập điểm và ghi chú chấm.",
    },
    icon: FileCheck2,
    iconClassName:
      "bg-[linear-gradient(135deg,#0f766e,#22c55e)] text-white shadow-[0_16px_32px_rgba(34,197,94,0.18)]",
  },
  "round-3": {
    label: { en: "Final round", vi: "Chung kết" },
    title: { en: "Final-round scoring queue", vi: "Hàng chờ chấm chung kết" },
    description: {
      en: "Open the finalist submissions, download the deck/report, and record the score.",
      vi: "Mở hồ sơ của đội chung kết, tải deck/báo cáo và ghi lại điểm chấm.",
    },
    icon: Medal,
    iconClassName:
      "bg-[linear-gradient(135deg,#c2410c,#f59e0b)] text-slate-950 shadow-[0_16px_32px_rgba(245,158,11,0.22)]",
  },
};

function StatusIcon({
  locale,
  status,
}: {
  locale: Locale;
  status: JudgeDashboardTask["status"];
}) {
  const isScored = status === "scored";
  const label = isScored
    ? locale === "en"
      ? "Scored"
      : "Đã chấm"
    : locale === "en"
      ? "Not scored yet"
      : "Chưa chấm";

  return (
    <span className="group relative inline-flex items-center justify-center">
      <span
        className={cn(
          "inline-flex h-10 w-10 items-center justify-center rounded-full border transition",
          isScored
            ? "border-emerald-500/26 bg-[linear-gradient(135deg,rgba(52,211,153,0.22),rgba(16,185,129,0.16))] text-emerald-700 dark:border-emerald-300/18 dark:bg-emerald-300/12 dark:text-emerald-100"
            : "border-amber-500/24 bg-[linear-gradient(135deg,rgba(251,191,36,0.22),rgba(245,158,11,0.14))] text-amber-700 dark:border-amber-300/18 dark:bg-amber-300/12 dark:text-amber-100",
        )}
      >
        {isScored ? <CheckCircle2 className="h-5 w-5" /> : <CircleDashed className="h-5 w-5" />}
      </span>
      <span className="theme-header-tooltip pointer-events-none absolute right-0 top-full z-20 mt-3 whitespace-nowrap rounded-full px-3 py-1.5 text-[0.68rem] font-medium opacity-0 transition duration-200 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100">
        {label}
      </span>
    </span>
  );
}

function JudgeRound1Table({
  locale,
  tasks,
}: {
  locale: Locale;
  tasks: JudgeDashboardRound1Task[];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left">
        <thead>
          <tr className="border-b theme-border text-xs uppercase tracking-[0.2em] theme-text-soft">
            <th className="px-4 py-3 font-semibold">{locale === "en" ? "Participant" : "Thí sinh"}</th>
            <th className="px-4 py-3 font-semibold">{locale === "en" ? "Team" : "Đội thi"}</th>
            <th className="px-4 py-3 font-semibold">{locale === "en" ? "Submitted" : "Thời gian nộp"}</th>
            <th className="px-4 py-3 text-center font-semibold">{locale === "en" ? "Status" : "Trạng thái"}</th>
            <th className="px-4 py-3 text-right font-semibold">{locale === "en" ? "Score" : "Chấm điểm"}</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr
              id={`judge-task-${task.submissionId}`}
              key={task.submissionId}
              className="border-b theme-border last:border-b-0 scroll-mt-32"
            >
              <td className="px-4 py-4">
                <p className="font-semibold theme-text-strong">{task.participantName}</p>
                <p className="mt-1 text-xs theme-text-soft">{task.participantUniversity}</p>
              </td>
              <td className="px-4 py-4">
                <p className="font-semibold theme-text-body">{task.teamName}</p>
                <p className="mt-1 text-xs theme-text-soft">{task.teamTag}</p>
              </td>
              <td className="px-4 py-4">
                <p className="inline-flex items-center gap-2 text-sm theme-text-body">
                  <FileCheck2 className="h-4 w-4 text-sky-500" />
                  {formatDateTimeLabel(locale, task.submittedAt)}
                </p>
              </td>
              <td className="px-4 py-4 text-center">
                <StatusIcon locale={locale} status={task.status} />
              </td>
              <td className="px-4 py-4 text-right">
                <Link
                  href={`/judge-dashboard/round-1/${task.submissionId}`}
                  className="theme-button-primary inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold"
                >
                  <NotebookPen className="h-4 w-4" />
                  {locale === "en" ? "Score essay" : "Chấm tự luận"}
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function JudgeTeamSubmissionTable({
  locale,
  tasks,
}: {
  locale: Locale;
  tasks: JudgeDashboardTeamTask[];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left">
        <thead>
          <tr className="border-b theme-border text-xs uppercase tracking-[0.2em] theme-text-soft">
            <th className="px-4 py-3 font-semibold">{locale === "en" ? "Team" : "Đội thi"}</th>
            <th className="px-4 py-3 font-semibold">{locale === "en" ? "Report" : "Hồ sơ"}</th>
            <th className="px-4 py-3 font-semibold">{locale === "en" ? "Latest activity" : "Cập nhật"}</th>
            <th className="px-4 py-3 text-center font-semibold">{locale === "en" ? "Status" : "Trạng thái"}</th>
            <th className="px-4 py-3 text-right font-semibold">{locale === "en" ? "Score" : "Chấm điểm"}</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr
              id={`judge-task-${task.submissionId}`}
              key={task.submissionId}
              className="border-b theme-border last:border-b-0 scroll-mt-32"
            >
              <td className="px-4 py-4">
                <p className="font-semibold theme-text-strong">{task.teamName}</p>
                <p className="mt-1 text-xs theme-text-soft">{task.teamTag}</p>
              </td>
              <td className="px-4 py-4">
                <p className="font-semibold theme-text-body">{task.title}</p>
                <p className="mt-1 text-xs theme-text-soft">
                  {`${locale === "en" ? "Version" : "Phiên bản"} ${task.version} · ${task.resourceLabel}`}
                </p>
              </td>
              <td className="px-4 py-4">
                <p className="text-sm theme-text-body">{formatDateLabel(locale, task.submittedAt)}</p>
                <p className="mt-1 text-xs theme-text-soft">
                  {locale === "en" ? `Submitted by ${task.submittedByName}` : `Người nộp: ${task.submittedByName}`}
                </p>
              </td>
              <td className="px-4 py-4 text-center">
                <StatusIcon locale={locale} status={task.status} />
              </td>
              <td className="px-4 py-4 text-right">
                <div className="flex items-center justify-end gap-2">
                  {task.resourceUrl ? (
                    <a
                      href={task.resourceUrl}
                      className="theme-button-secondary inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold"
                    >
                      <Download className="h-4 w-4" />
                      {locale === "en" ? "Report" : "Tải hồ sơ"}
                    </a>
                  ) : null}
                  <Link
                    href={`/judge-dashboard/submissions/${task.submissionId}`}
                    className="theme-button-primary inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold"
                  >
                    <FilePenLine className="h-4 w-4" />
                    {locale === "en" ? "Score" : "Chấm điểm"}
                  </Link>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function JudgeDashboardPage({ data }: { data: JudgeDashboardData }) {
  const { locale, timelineItems } = useSiteState();
  const searchParams = useSearchParams();
  const savedSubmissionId = searchParams.get("scored") ?? "";
  const [collapsedRounds, setCollapsedRounds] = useState<Partial<Record<CompetitionRoundKey, boolean>>>(() => ({
    "round-1": isRound2Started(timelineItems, new Date()),
  }));

  useEffect(() => {
    if (!savedSubmissionId) {
      return;
    }

    const savedRound = data.rounds.find((group) =>
      group.tasks.some((task) => task.submissionId === savedSubmissionId),
    )?.round;

    let scrollTimer: number | undefined;
    const expandTimer = window.setTimeout(() => {
      if (savedRound === "round-1") {
        setCollapsedRounds((current) => ({ ...current, "round-1": false }));
      }

      scrollTimer = window.setTimeout(() => {
        document
          .getElementById(`judge-task-${savedSubmissionId}`)
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 120);
    }, 80);

    return () => {
      window.clearTimeout(expandTimer);
      if (scrollTimer) {
        window.clearTimeout(scrollTimer);
      }
    };
  }, [data.rounds, savedSubmissionId]);

  const handleToggleRound = (round: CompetitionRoundKey) => {
    setCollapsedRounds((current) => ({ ...current, [round]: !current[round] }));
  };

  return (
    <div className="space-y-8">
      <PageIntro
        eyebrow={locale === "en" ? "Judge dashboard" : "Bảng chấm giám khảo"}
        title={
          locale === "en"
            ? "Review the submissions assigned to your judging rounds."
            : "Xem các bài thi và bài nộp thuộc những vòng bạn được phân công chấm."
        }
        description={
          locale === "en"
            ? "Each section is grouped by round, ordered by the latest scoring activity, and keeps the scoring action one click away."
            : "Mỗi khu vực được nhóm theo vòng, sắp theo hoạt động gần nhất và giữ thao tác chấm điểm chỉ cách một lần bấm."
        }
        aside={
          <Surface className="rounded-[1.6rem] px-5 py-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] theme-text-soft">
              {locale === "en" ? "Judge profile" : "Hồ sơ giám khảo"}
            </p>
            <p className="mt-3 text-lg font-semibold theme-text-strong">{data.judge.name}</p>
            <p className="mt-2 text-sm theme-text-muted">{pickLocalizedText(locale, data.judge.position)}</p>
            <p className="mt-2 text-sm theme-text-soft">{pickLocalizedText(locale, data.judge.organization)}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {data.judge.rounds.map((round) => (
                <StatusPill key={round} tone={round === "round-1" ? "info" : round === "round-2" ? "success" : "warning"}>
                  {roundMeta[round].label[locale]}
                </StatusPill>
              ))}
            </div>
          </Surface>
        }
      />

      {savedSubmissionId ? (
        <Surface className="border-emerald-500/20 px-5 py-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            <p className="text-sm font-semibold theme-text-strong">
              {locale === "en" ? "Judge score saved." : "Đã lưu điểm chấm."}
            </p>
          </div>
        </Surface>
      ) : null}

      {data.rounds.length === 0 ? (
        <Surface className="px-6 py-6 md:px-8 md:py-8">
          <SectionHeading
            eyebrow={locale === "en" ? "No assignments yet" : "Chưa có phân công"}
            title={locale === "en" ? "No scoring queue is assigned to this judge yet." : "Giám khảo này hiện chưa được phân công hàng chờ chấm điểm."}
            description={
              locale === "en"
                ? "Update the linked judge profile rounds first, then the dashboard will group the assigned scoring items automatically."
                : "Hãy cập nhật trước các vòng phụ trách trong hồ sơ giám khảo liên kết, sau đó bảng chấm sẽ tự nhóm các đầu việc tương ứng."
            }
          />
        </Surface>
      ) : null}

      {data.rounds.map((group) => {
        const meta = roundMeta[group.round];
        const Icon = meta.icon;
        const canCollapse = group.round === "round-1";
        const isCollapsed = Boolean(collapsedRounds[group.round]);

        return (
          <Surface key={group.round} className="overflow-hidden px-0 py-0">
            <div className="border-b theme-border px-6 py-6 md:px-8">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-start gap-4">
                  <div className={cn("flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.4rem]", meta.iconClassName)}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] theme-eyebrow">{meta.label[locale]}</p>
                    <h2 className="mt-2 text-2xl font-semibold theme-text-strong">{meta.title[locale]}</h2>
                    <p className="mt-3 max-w-3xl text-sm leading-7 theme-text-muted">{meta.description[locale]}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 self-start lg:self-center">
                  <StatusPill tone={group.round === "round-1" ? "info" : group.round === "round-2" ? "success" : "warning"}>
                    {`${group.tasks.length} ${locale === "en" ? "items" : "mục"}`}
                  </StatusPill>
                  {canCollapse ? (
                    <button
                      type="button"
                      onClick={() => handleToggleRound(group.round)}
                      aria-label={
                        isCollapsed
                          ? locale === "en"
                            ? "Expand Round 1 scoring queue"
                            : "Mở hàng chờ chấm Vòng 1"
                          : locale === "en"
                            ? "Collapse Round 1 scoring queue"
                            : "Thu gọn hàng chờ chấm Vòng 1"
                      }
                      className="theme-button-secondary group relative inline-flex h-11 w-11 items-center justify-center rounded-full transition duration-300 hover:-translate-y-0.5 active:translate-y-0"
                    >
                      <ChevronDown
                        className={cn(
                          "h-4.5 w-4.5 transition-transform duration-300",
                          isCollapsed ? "rotate-0" : "rotate-180",
                        )}
                      />
                      <span className="theme-header-tooltip pointer-events-none absolute right-0 top-full z-20 mt-3 whitespace-nowrap rounded-full px-3 py-1.5 text-[0.68rem] font-medium opacity-0 transition duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
                        {isCollapsed
                          ? locale === "en"
                            ? "Expand"
                            : "Mở rộng"
                          : locale === "en"
                            ? "Collapse"
                            : "Thu gọn"}
                      </span>
                    </button>
                  ) : null}
                </div>
              </div>
            </div>

            <div
              className={cn(
                "grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
                canCollapse && isCollapsed ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100",
              )}
            >
              <div className="min-h-0 overflow-hidden">
                {group.tasks.length === 0 ? (
                  <div className="px-6 py-8 md:px-8">
                    <p className="text-sm theme-text-soft">
                      {locale === "en"
                        ? "No scoring items are waiting in this round right now."
                        : "Hiện chưa có đầu việc chấm điểm nào trong vòng này."}
                    </p>
                  </div>
                ) : (
                  <div className="px-2 py-2 md:px-4 md:py-4">
                    {group.round === "round-1" ? (
                      <JudgeRound1Table locale={locale} tasks={group.tasks as JudgeDashboardRound1Task[]} />
                    ) : (
                      <JudgeTeamSubmissionTable locale={locale} tasks={group.tasks as JudgeDashboardTeamTask[]} />
                    )}
                  </div>
                )}
              </div>
            </div>
          </Surface>
        );
      })}

      <Surface className="px-6 py-5 md:px-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <UserRound className="mt-1 h-5 w-5 text-sky-500" />
            <p className="max-w-3xl text-sm leading-7 theme-text-muted">
              {locale === "en"
                ? "Judge scores are stored per judge account, so the same submission can be reviewed independently by multiple judges without overwriting each other."
                : "Điểm chấm được lưu theo từng tài khoản giám khảo, nên cùng một bài thi hoặc bài nộp có thể được nhiều giám khảo chấm độc lập mà không ghi đè lẫn nhau."}
            </p>
          </div>
          <Link href="/profile" className="inline-flex items-center gap-2 text-sm font-semibold theme-accent">
            {locale === "en" ? "Back to profile" : "Quay lại hồ sơ"}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </Surface>
    </div>
  );
}
