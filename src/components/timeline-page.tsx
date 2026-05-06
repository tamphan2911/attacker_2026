"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Flag,
  FileBadge2,
  FileUp,
  Presentation,
  Route,
  ShieldCheck,
} from "lucide-react";

import { useSiteState } from "@/components/providers/site-state-provider";
import { Surface } from "@/components/site-ui";
import {
  canTeamTakeRound1,
  isTeamCurrentlyCompetingRound,
} from "@/lib/competition";
import { formatDateRangeLabel, pickText } from "@/lib/site";
import type {
  CompetitionRoundKey,
  LocalizedText,
  TeamProfile,
  TimelineItem,
  UserRole,
} from "@/types/site";

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
  darkStatusClass: string;
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
    darkStatusClass: "dark:border-violet-300/22 dark:bg-violet-300/[0.12] dark:text-violet-100",
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
    darkStatusClass: "dark:border-sky-300/22 dark:bg-sky-300/[0.12] dark:text-sky-100",
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
    darkStatusClass: "dark:border-emerald-300/22 dark:bg-emerald-300/[0.12] dark:text-emerald-100",
  },
  {
    phase: "round-3",
    anchor: "round-3-timeline",
    eyebrow: { en: "Final round", vi: "Chung kết" },
    title: { en: "Final report, presentation, and awards", vi: "Báo cáo cuối, thuyết trình và trao giải" },
    description: {
      en: "The final stage starts with the finalist report deadline, then moves into live presentation, judge Q&A, and the final award decision.",
      vi: "Giai đoạn chung kết bắt đầu bằng hạn nộp báo cáo của top 5, sau đó chuyển sang thuyết trình trực tiếp, hỏi đáp cùng giám khảo và quyết định giải thưởng cuối cùng.",
    },
    icon: CalendarDays,
    ruleHref: "/rules#round-3-rules",
    iconClass:
      "border-amber-600/24 bg-[linear-gradient(135deg,rgba(245,158,11,0.2),rgba(249,115,22,0.16))] text-amber-800 dark:border-amber-300/20 dark:bg-amber-300/12 dark:text-amber-100",
    buttonClass:
      "border-amber-600/24 bg-[linear-gradient(135deg,rgba(245,158,11,0.12),rgba(249,115,22,0.08))] text-amber-800 hover:border-amber-600/34 hover:bg-[linear-gradient(135deg,rgba(245,158,11,0.16),rgba(249,115,22,0.12))] dark:border-amber-300/22 dark:bg-amber-300/[0.12] dark:text-amber-100",
    statusClass:
      "border-amber-600/20 bg-amber-500/12 text-amber-800 dark:border-amber-300/22 dark:bg-amber-300/[0.12] dark:text-amber-100",
    darkStatusClass: "dark:border-amber-300/22 dark:bg-amber-300/[0.12] dark:text-amber-100",
  },
];

type TimelineCardStatus = "finished" | "ongoing" | "upcoming" | "not-started";

interface TimelineActionLink {
  key: string;
  href?: string;
  label: LocalizedText;
  icon: typeof ArrowRight;
  disabled?: boolean;
  title?: LocalizedText;
}

function getTimelineItemKey(item: TimelineItem) {
  return item.id;
}

function buildTimelineActionLinks({
  item,
  currentUserRole,
  currentTeam,
  activeUserId,
  timelineItems,
  now,
}: {
  item: TimelineItem;
  currentUserRole: UserRole;
  currentTeam?: TeamProfile;
  activeUserId: string;
  timelineItems: TimelineItem[];
  now: Date;
}): TimelineActionLink[] {
  const actionLinks: TimelineActionLink[] = [];

  if (item.id === "round-2-top-5-announcement" || item.id === "round-3-final-presentation") {
    actionLinks.push({
      key: `${item.id}-finalists`,
      href: item.id === "round-3-final-presentation" ? "/competition/final-results" : "/competition/finalists",
      label: { en: "Read result update", vi: "Đọc cập nhật kết quả" },
      icon: Presentation,
    });
  }

  for (const supportLink of item.supportLinks ?? []) {
    if (item.id === "round-1-individual-qualifier" && supportLink.href === "/round-1") {
      if (currentUserRole === "student" && currentTeam && canTeamTakeRound1(currentTeam, now, timelineItems)) {
        actionLinks.push({
          key: `${item.id}-${supportLink.href}`,
          href: supportLink.href,
          label: supportLink.label,
          icon: FileBadge2,
        });
      }
      continue;
    }

    if (item.id === "round-2-report-submission" && supportLink.href === "/dashboard") {
      if (
        currentUserRole === "student" &&
        currentTeam &&
        currentTeam.leaderId === activeUserId &&
        isTeamCurrentlyCompetingRound(currentTeam, "round-2")
      ) {
        const round2Closed = now.getTime() > parseLocalDate(item.endDate, true).getTime();
        actionLinks.push({
          key: `${item.id}-${supportLink.href}`,
          href: round2Closed ? undefined : "/dashboard#round-2-section",
          label: supportLink.label,
          icon: FileUp,
          disabled: round2Closed,
          title: round2Closed
            ? {
                en: "Round 2 submission window has closed.",
                vi: "Hạn nộp bài Vòng 2 đã kết thúc.",
              }
            : undefined,
        });
      }
      continue;
    }

    if (item.id === "round-3-final-report-submission" && supportLink.href === "/dashboard") {
      if (
        currentUserRole === "student" &&
        currentTeam &&
        currentTeam.leaderId === activeUserId &&
        isTeamCurrentlyCompetingRound(currentTeam, "round-3")
      ) {
        const finalReportClosed = now.getTime() > parseLocalDate(item.endDate, true).getTime();
        actionLinks.push({
          key: `${item.id}-${supportLink.href}`,
          href: finalReportClosed ? undefined : "/dashboard#round-3-section",
          label: supportLink.label,
          icon: FileUp,
          disabled: finalReportClosed,
          title: finalReportClosed
            ? {
                en: "The final report deadline has passed.",
                vi: "Hạn nộp báo cáo chung kết đã kết thúc.",
              }
            : undefined,
        });
      }
      continue;
    }

    if (
      (item.id === "round-2-top-5-announcement" || item.id === "round-3-final-presentation") &&
      supportLink.href === "/news"
    ) {
      continue;
    }

    if (item.id === "round-3-final-presentation" && supportLink.href === "/competition") {
      continue;
    }

    actionLinks.push({
      key: `${item.id}-${supportLink.href}`,
      href:
        item.id === "round-2-top-5-announcement" && supportLink.href === "/news"
          ? "/competition/finalists"
          : supportLink.href,
      label: supportLink.label,
      icon: ArrowRight,
    });
  }

  return actionLinks;
}

function parseLocalDate(value: string, endOfDay = false) {
  const [year, month, day] = value.split("-").map(Number);
  return endOfDay
    ? new Date(year, month - 1, day, 23, 59, 59, 999)
    : new Date(year, month - 1, day, 0, 0, 0, 0);
}

function formatCountdown(locale: "en" | "vi", distanceMs: number) {
  if (distanceMs <= 0) {
    return locale === "en" ? "now" : "ngay bây giờ";
  }

  const totalSeconds = Math.floor(distanceMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const paddedHours = String(hours).padStart(2, "0");
  const paddedMinutes = String(minutes).padStart(2, "0");
  const paddedSeconds = String(seconds).padStart(2, "0");

  if (days > 0) {
    return locale === "en"
      ? `${days}d ${paddedHours}:${paddedMinutes}:${paddedSeconds}`
      : `${days} ngày ${paddedHours}:${paddedMinutes}:${paddedSeconds}`;
  }

  return `${paddedHours}:${paddedMinutes}:${paddedSeconds}`;
}

function getTimelineCardStatusClass(
  status: TimelineCardStatus,
  phaseStatusClass: string,
  phaseDarkStatusClass: string,
) {
  switch (status) {
    case "ongoing":
      return `${phaseStatusClass} shadow-[0_18px_34px_rgba(15,23,42,0.08)] dark:shadow-none`;
    case "upcoming":
      return `${phaseStatusClass} shadow-[0_12px_26px_rgba(15,23,42,0.06)] dark:shadow-none`;
    case "finished":
      return "border-slate-300/28 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(241,245,249,0.96))] text-slate-700 dark:border-white/14 dark:bg-white/[0.06] dark:text-slate-200";
    case "not-started":
    default:
      return `border-slate-300/24 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(248,250,252,0.96))] text-slate-700 dark:bg-none ${phaseDarkStatusClass} dark:shadow-none`;
  }
}

function getTimelineCardStatusMeta(
  item: TimelineItem,
  now: Date,
  locale: "en" | "vi",
  nextUpcomingKey: string | null,
) {
  const key = getTimelineItemKey(item);
  const startAt = parseLocalDate(item.startDate);
  const endAt = parseLocalDate(item.endDate, true);

  if (now > endAt) {
    return {
      key,
      status: "finished" as const,
      label: locale === "en" ? "Finished" : "Đã kết thúc",
      countdown: "",
      icon: CheckCircle2,
    };
  }

  if (now >= startAt && now <= endAt) {
    return {
      key,
      status: "ongoing" as const,
      label: locale === "en" ? "Ongoing" : "Đang diễn ra",
      countdown:
        locale === "en"
          ? `Ends in ${formatCountdown(locale, endAt.getTime() - now.getTime())}`
          : `Kết thúc trong ${formatCountdown(locale, endAt.getTime() - now.getTime())}`,
      icon: Clock3,
    };
  }

  if (key === nextUpcomingKey) {
    return {
      key,
      status: "upcoming" as const,
      label: locale === "en" ? "Starting soon" : "Sắp diễn ra",
      countdown:
        locale === "en"
          ? `Starts in ${formatCountdown(locale, startAt.getTime() - now.getTime())}`
          : `Bắt đầu trong ${formatCountdown(locale, startAt.getTime() - now.getTime())}`,
      icon: Clock3,
    };
  }

  return {
    key,
    status: "not-started" as const,
    label: locale === "en" ? "Not started" : "Chưa diễn ra",
    countdown: "",
    icon: CalendarDays,
  };
}

export function TimelinePage() {
  const { locale, timelineItems, currentUser, currentTeam, activeUserId } = useSiteState();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const orderedTimelineItems = [...timelineItems].sort((left, right) => {
    const leftStart = parseLocalDate(left.startDate).getTime();
    const rightStart = parseLocalDate(right.startDate).getTime();
    if (leftStart !== rightStart) {
      return leftStart - rightStart;
    }

    return parseLocalDate(left.endDate, true).getTime() - parseLocalDate(right.endDate, true).getTime();
  });

  const nextUpcomingItem = orderedTimelineItems.find((item) => parseLocalDate(item.startDate).getTime() > now.getTime());
  const nextUpcomingKey = nextUpcomingItem ? getTimelineItemKey(nextUpcomingItem) : null;
  const phaseSummaries = timelinePhaseMeta.map((phase) => {
    const items = [...timelineItems]
      .filter((item) => item.phase === phase.phase)
      .sort((left, right) => {
        if (left.startDate !== right.startDate) {
          return left.startDate.localeCompare(right.startDate);
        }

        return left.endDate.localeCompare(right.endDate);
      });

    return {
      ...phase,
      items,
      startDate: items[0]?.startDate,
      endDate: items[items.length - 1]?.endDate,
    };
  });

  return (
    <div className="space-y-16 md:space-y-20">
      <section className="space-y-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] theme-eyebrow">
              {locale === "en" ? "Timeline diagram" : "Sơ đồ lịch trình"}
            </p>
          </div>
          <p className="max-w-xl text-sm leading-7 theme-text-muted">
            {locale === "en"
              ? "Click any stage to jump straight to the detailed block below."
              : "Nhấn vào từng giai đoạn để chuyển nhanh đến khối thông tin chi tiết bên dưới."}
          </p>
        </div>

        <Surface className="px-4 py-5 md:px-5">
          <div className="grid gap-4 lg:grid-cols-4">
              {phaseSummaries.map((phase) => {
                const Icon = phase.icon;

                return (
                  <div key={phase.phase} className="h-full">
                    <Link
                      href={`#${phase.anchor}`}
                      className="group relative flex h-full min-h-[15rem] flex-col rounded-[1.55rem] border theme-border bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(246,249,252,0.96))] px-4 py-4 text-left shadow-[0_18px_40px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_46px_rgba(15,23,42,0.1)] active:scale-[0.99] dark:bg-[linear-gradient(135deg,rgba(11,20,34,0.92),rgba(17,24,39,0.88))] dark:shadow-none"
                    >
                      <span className={`absolute inset-x-5 bottom-0 h-1 rounded-full bg-current opacity-30 ${phase.phase === "general" ? "text-violet-500 dark:text-violet-300" : phase.phase === "round-1" ? "text-sky-500 dark:text-sky-300" : phase.phase === "round-2" ? "text-emerald-500 dark:text-emerald-300" : "text-amber-500 dark:text-amber-300"}`} />
                      <div className="flex items-start justify-between gap-3">
                        <div className={`inline-flex h-11 w-11 items-center justify-center rounded-[1rem] border ${phase.iconClass}`}>
                          <Icon className="h-4.5 w-4.5" />
                        </div>
                        <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] ${phase.statusClass}`}>
                          {phase.items.length} {locale === "en" ? "steps" : "bước"}
                        </span>
                      </div>

                      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.24em] theme-eyebrow">
                        {pickText(locale, phase.eyebrow)}
                      </p>
                      <p className="mt-2 text-base font-semibold leading-7 theme-text-strong">
                        {pickText(locale, phase.title)}
                      </p>
                      <p className="mt-2 text-sm leading-7 theme-text-muted">
                        {phase.startDate && phase.endDate
                          ? formatDateRangeLabel(locale, phase.startDate, phase.endDate)
                          : locale === "en"
                            ? "Schedule to be updated"
                            : "Lịch sẽ được cập nhật"}
                      </p>
                      <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold theme-accent">
                        {locale === "en" ? "Open detail" : "Mở chi tiết"}
                        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                      </span>
                    </Link>
                  </div>
                );
              })}
          </div>
        </Surface>
      </section>

      <section className="space-y-6">
        {timelinePhaseMeta.map((phase) => {
          const items = [...timelineItems]
            .filter((item) => item.phase === phase.phase)
            .sort((left, right) => {
              if (left.startDate !== right.startDate) {
                return left.startDate.localeCompare(right.startDate);
              }

              return left.endDate.localeCompare(right.endDate);
            });
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
                  {items.map((item) => {
                    const statusMeta = getTimelineCardStatusMeta(item, now, locale, nextUpcomingKey);
                    const StatusIcon = statusMeta.icon;
                    const actionLinks = buildTimelineActionLinks({
                      item,
                      currentUserRole: currentUser.role,
                      currentTeam,
                      activeUserId,
                      timelineItems,
                      now,
                    });

                    return (
                    <Surface key={item.id} className="theme-timeline-card px-5 py-5">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.26em] theme-eyebrow">
                            {formatDateRangeLabel(locale, item.startDate, item.endDate)}
                          </p>
                          <h3 className="theme-heading mt-3 text-xl font-semibold theme-text-strong">
                            {pickText(locale, item.title)}
                          </h3>
                        </div>
                        <span
                          className={`inline-flex min-w-[12rem] flex-col items-start rounded-[1.1rem] border px-4 py-2.5 text-left ${getTimelineCardStatusClass(statusMeta.status, phase.statusClass, phase.darkStatusClass)}`}
                        >
                          <span className="inline-flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.18em]">
                            <StatusIcon className="h-3.5 w-3.5" />
                            {statusMeta.label}
                          </span>
                          {statusMeta.countdown ? (
                            <span className="mt-1 text-xs font-medium leading-5">
                              {statusMeta.countdown}
                            </span>
                          ) : null}
                        </span>
                      </div>

                      <div className="mt-5 grid gap-3 md:grid-cols-3">
                        <div className="theme-timeline-meta-card theme-timeline-meta-card--accent rounded-[1.25rem] border px-4 py-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.22em] theme-eyebrow">
                            {locale === "en" ? "Time" : "Thời gian"}
                          </p>
                          <p className="mt-2 text-sm leading-7 theme-text-body">
                            {formatDateRangeLabel(locale, item.startDate, item.endDate)}
                          </p>
                        </div>
                        <div className="theme-timeline-meta-card theme-timeline-meta-card--accent rounded-[1.25rem] border px-4 py-4">
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

                      {actionLinks.length ? (
                        <div className="mt-4 flex flex-wrap gap-3">
                          {actionLinks.map((actionLink) =>
                            actionLink.disabled ? (
                              <button
                                key={actionLink.key}
                                type="button"
                                disabled
                                title={actionLink.title ? pickText(locale, actionLink.title) : undefined}
                                className="theme-timeline-link theme-timeline-link--accent inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium opacity-75"
                              >
                                <actionLink.icon className="h-3.5 w-3.5" />
                                {pickText(locale, actionLink.label)}
                              </button>
                            ) : (
                              <Link
                                key={actionLink.key}
                                href={actionLink.href ?? "#"}
                                title={actionLink.title ? pickText(locale, actionLink.title) : undefined}
                                className="theme-timeline-link theme-timeline-link--accent inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition active:scale-[0.98]"
                              >
                                <actionLink.icon className="h-3.5 w-3.5" />
                                {pickText(locale, actionLink.label)}
                                <ArrowRight className="h-3.5 w-3.5" />
                              </Link>
                            ),
                          )}
                        </div>
                      ) : null}
                    </Surface>
                    );
                  })}
                </div>
              </div>
            </section>
          );
        })}
      </section>
    </div>
  );
}
