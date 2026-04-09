"use client";

import { Crown, Medal, Sparkles, Star, Trophy } from "lucide-react";

import { useSiteState } from "@/components/providers/site-state-provider";
import { GradientAvatar, StatusPill, Surface } from "@/components/site-ui";
import { competitionRoundWindows } from "@/data/site-content";
import { pickText, formatDateRangeLabel } from "@/lib/site";
import type { TeamFinalOutcome, TeamProfile, UserProfile } from "@/types/site";

const outcomeMeta: Array<{
  outcome: Exclude<TeamFinalOutcome, "emerging-team">;
  slots: number;
  eyebrow: { en: string; vi: string };
  title: { en: string; vi: string };
  note: { en: string; vi: string };
  icon: typeof Crown;
  iconClass: string;
  shellClass: string;
}> = [
  {
    outcome: "champion",
    slots: 1,
    eyebrow: { en: "First place", vi: "Hạng nhất" },
    title: { en: "Champion", vi: "Quán quân" },
    note: {
      en: "The team with the highest final-round score.",
      vi: "Đội đạt tổng điểm cao nhất ở vòng chung kết.",
    },
    icon: Crown,
    iconClass:
      "border-amber-500/26 bg-[linear-gradient(135deg,rgba(251,191,36,0.26),rgba(245,158,11,0.18))] text-amber-700 dark:border-amber-300/20 dark:bg-amber-300/12 dark:text-amber-100",
    shellClass:
      "border-amber-500/18 bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.18),transparent_36%),linear-gradient(180deg,rgba(255,255,255,0.99),rgba(255,248,235,0.97))] dark:border-amber-300/18 dark:bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.14),transparent_34%),linear-gradient(180deg,rgba(20,16,6,0.9),rgba(24,17,7,0.84))]",
  },
  {
    outcome: "runner-up",
    slots: 1,
    eyebrow: { en: "Second place", vi: "Hạng nhì" },
    title: { en: "Runner-up", vi: "Á quân" },
    note: {
      en: "The team ranked just behind the champion.",
      vi: "Đội đứng ngay sau quán quân ở kết quả cuối cùng.",
    },
    icon: Trophy,
    iconClass:
      "border-sky-500/26 bg-[linear-gradient(135deg,rgba(56,189,248,0.24),rgba(37,99,235,0.16))] text-sky-700 dark:border-sky-300/20 dark:bg-sky-300/12 dark:text-sky-100",
    shellClass:
      "border-sky-500/18 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.18),transparent_36%),linear-gradient(180deg,rgba(255,255,255,0.99),rgba(239,247,255,0.97))] dark:border-sky-300/18 dark:bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.14),transparent_34%),linear-gradient(180deg,rgba(8,20,38,0.9),rgba(8,22,44,0.84))]",
  },
  {
    outcome: "third-place",
    slots: 1,
    eyebrow: { en: "Third place", vi: "Hạng ba" },
    title: { en: "Third place", vi: "Quý quân" },
    note: {
      en: "The team closing the podium after the final defense.",
      vi: "Đội khép lại nhóm dẫn đầu sau buổi bảo vệ chung kết.",
    },
    icon: Medal,
    iconClass:
      "border-fuchsia-500/24 bg-[linear-gradient(135deg,rgba(217,70,239,0.2),rgba(168,85,247,0.16))] text-fuchsia-700 dark:border-fuchsia-300/20 dark:bg-fuchsia-300/12 dark:text-fuchsia-100",
    shellClass:
      "border-fuchsia-500/18 bg-[radial-gradient(circle_at_top_right,rgba(217,70,239,0.16),transparent_36%),linear-gradient(180deg,rgba(255,255,255,0.99),rgba(250,243,255,0.97))] dark:border-fuchsia-300/18 dark:bg-[radial-gradient(circle_at_top_right,rgba(217,70,239,0.12),transparent_34%),linear-gradient(180deg,rgba(24,11,34,0.9),rgba(21,10,31,0.84))]",
  },
  {
    outcome: "fourth-place",
    slots: 2,
    eyebrow: { en: "Shared fourth place", vi: "Đồng hạng tư" },
    title: { en: "4th place teams", vi: "Hai đội hạng 4" },
    note: {
      en: "Two finalist teams receive the fourth-place recognition.",
      vi: "Hai đội chung kết còn lại cùng nhận danh hiệu hạng 4.",
    },
    icon: Star,
    iconClass:
      "border-emerald-500/24 bg-[linear-gradient(135deg,rgba(52,211,153,0.22),rgba(16,185,129,0.16))] text-emerald-700 dark:border-emerald-300/20 dark:bg-emerald-300/12 dark:text-emerald-100",
    shellClass:
      "border-emerald-500/18 bg-[radial-gradient(circle_at_top_right,rgba(52,211,153,0.16),transparent_36%),linear-gradient(180deg,rgba(255,255,255,0.99),rgba(240,251,246,0.97))] dark:border-emerald-300/18 dark:bg-[radial-gradient(circle_at_top_right,rgba(52,211,153,0.12),transparent_34%),linear-gradient(180deg,rgba(9,24,20,0.9),rgba(8,26,24,0.84))]",
  },
];

function getLeader(team: TeamProfile, users: UserProfile[]) {
  return users.find((user) => user.id === team.leaderId);
}

function getTeamsForOutcome(teams: TeamProfile[], outcome: TeamFinalOutcome, slots: number) {
  return [...teams]
    .filter((team) => team.finalOutcome === outcome)
    .sort((left, right) => {
      if (left.createdAt !== right.createdAt) {
        return left.createdAt.localeCompare(right.createdAt);
      }

      return left.name.localeCompare(right.name);
    })
    .slice(0, slots);
}

export function FinalResultsPage() {
  const { locale, teams, users, currentTeam } = useSiteState();
  const round3Window = competitionRoundWindows.find((window) => window.round === "round-3");

  return (
    <div className="space-y-12 md:space-y-16">
      <section className="theme-card-shadow-soft relative overflow-hidden rounded-[2.2rem] border border-[rgba(23,114,208,0.14)] bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.16),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(245,158,11,0.14),transparent_28%),linear-gradient(135deg,rgba(255,255,255,0.99),rgba(240,247,255,0.97)_52%,rgba(254,249,240,0.95))] px-6 py-7 md:px-8 md:py-9 dark:border-white/12 dark:bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.14),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(245,158,11,0.12),transparent_28%),linear-gradient(135deg,rgba(8,18,35,0.98),rgba(10,23,43,0.96)_52%,rgba(31,21,8,0.9))]">
        <div className="absolute -right-16 top-0 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(37,99,235,0.16),rgba(37,99,235,0))] dark:bg-[radial-gradient(circle,rgba(96,165,250,0.18),rgba(96,165,250,0))]" />
        <div className="absolute bottom-0 left-12 h-32 w-32 rounded-full bg-[radial-gradient(circle,rgba(245,158,11,0.14),rgba(245,158,11,0))] dark:bg-[radial-gradient(circle,rgba(251,191,36,0.16),rgba(251,191,36,0))]" />
        <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-end">
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] theme-eyebrow">
              {locale === "en" ? "Final round results" : "Kết quả chung kết"}
            </p>
            <h1 className="theme-heading text-3xl font-semibold tracking-tight theme-text-strong md:text-[3rem] md:leading-[1.04]">
              {locale === "en"
                ? "Champion, runner-up, third place, and the two 4th-place teams."
                : "Quán quân, á quân, quý quân và hai đội đồng hạng 4."}
            </h1>
            <p className="max-w-3xl text-base leading-8 theme-text-muted md:text-lg">
              {locale === "en"
                ? "This page announces the final-round titles only. The placement below reflects the official award structure after the live defense."
                : "Trang này công bố các danh hiệu của vòng chung kết. Các vị trí bên dưới phản ánh cấu trúc giải thưởng chính thức sau buổi bảo vệ trực tiếp."}
            </p>
          </div>

          <div className="rounded-[1.35rem] border border-white/50 bg-white/74 px-5 py-4 shadow-[0_18px_36px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/[0.06] dark:shadow-none">
            <div className="flex items-center gap-3">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-[1rem] border border-sky-500/18 bg-[linear-gradient(135deg,rgba(56,189,248,0.2),rgba(37,99,235,0.14))] text-sky-700 dark:border-sky-300/18 dark:bg-sky-300/12 dark:text-sky-100">
                <Sparkles className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] theme-eyebrow">
                  {locale === "en" ? "Final event day" : "Ngày chung kết"}
                </p>
                <p className="mt-1 text-sm font-semibold theme-text-strong">
                  {round3Window
                    ? formatDateRangeLabel(locale, round3Window.startDate, round3Window.endDate)
                    : locale === "en"
                      ? "To be announced"
                      : "Sẽ cập nhật"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-5">
        {outcomeMeta.map((meta) => {
          const Icon = meta.icon;
          const teamsForOutcome = getTeamsForOutcome(teams, meta.outcome, meta.slots);
          const slots = Array.from({ length: meta.slots }, (_, index) => teamsForOutcome[index] ?? null);

          return (
            <Surface key={meta.outcome} className={`overflow-hidden px-6 py-6 md:px-7 md:py-7 ${meta.shellClass}`}>
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-2xl">
                  <div className="flex items-center gap-3">
                    <div className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-[1.15rem] border ${meta.iconClass}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.28em] theme-eyebrow">
                        {pickText(locale, meta.eyebrow)}
                      </p>
                      <h2 className="theme-heading mt-1 text-2xl font-semibold theme-text-strong">
                        {pickText(locale, meta.title)}
                      </h2>
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-8 theme-text-muted">{pickText(locale, meta.note)}</p>
                </div>

                <StatusPill tone={meta.outcome === "fourth-place" ? "success" : meta.outcome === "third-place" ? "warning" : "info"}>
                  {meta.slots} {locale === "en" ? (meta.slots > 1 ? "slots" : "slot") : (meta.slots > 1 ? "suất" : "suất")}
                </StatusPill>
              </div>

              <div className={`mt-6 grid gap-4 ${meta.slots === 1 ? "lg:grid-cols-1" : "lg:grid-cols-2"}`}>
                {slots.map((team, index) => {
                  if (!team) {
                    return (
                      <div
                        key={`${meta.outcome}-placeholder-${index}`}
                        className="rounded-[1.45rem] border border-dashed border-slate-400/24 bg-white/76 px-5 py-5 dark:border-white/12 dark:bg-white/[0.04]"
                      >
                        <div className="flex items-start gap-4">
                          <div className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[1rem] border ${meta.iconClass}`}>
                            <Icon className="h-4.5 w-4.5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-base font-semibold theme-text-strong">
                              {locale === "en" ? "Awaiting official update" : "Đang chờ cập nhật chính thức"}
                            </p>
                            <p className="mt-2 text-sm leading-7 theme-text-soft">
                              {locale === "en"
                                ? "This result slot is ready and will be filled when the final scoring is published."
                                : "Vị trí kết quả này đã sẵn sàng và sẽ được điền khi công bố điểm chung kết."}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  const leader = getLeader(team, users);
                  const isCurrentTeam = currentTeam?.id === team.id;

                  return (
                    <div
                      key={team.id}
                      className={`rounded-[1.45rem] border px-5 py-5 shadow-[0_18px_38px_rgba(14,37,66,0.08)] dark:shadow-none ${isCurrentTeam ? "border-sky-500/28 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(235,245,255,0.96))] dark:border-sky-300/22 dark:bg-[linear-gradient(135deg,rgba(11,24,45,0.9),rgba(8,20,39,0.86))]" : "border-white/55 bg-white/78 dark:border-white/10 dark:bg-white/[0.05]"}`}
                    >
                      <div className="flex items-start gap-4">
                        <GradientAvatar
                          label={team.name}
                          tone={team.avatarTone}
                          imageSrc={team.avatarImageSrc}
                          className="h-14 w-14 rounded-[1.15rem]"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="theme-heading text-xl font-semibold theme-text-strong">{team.name}</h3>
                            <StatusPill>{`#${team.tag}`}</StatusPill>
                            {isCurrentTeam ? (
                              <StatusPill tone="info">
                                {locale === "en" ? "Your team" : "Đội của bạn"}
                              </StatusPill>
                            ) : null}
                          </div>
                          <p className="mt-2 text-sm leading-7 theme-text-body">{team.track}</p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <StatusPill tone={meta.outcome === "fourth-place" ? "success" : meta.outcome === "third-place" ? "warning" : "info"}>
                              {pickText(locale, meta.title)}
                            </StatusPill>
                            <StatusPill>
                              {leader?.name
                                ? `${locale === "en" ? "Leader" : "Đội trưởng"} · ${leader.name}`
                                : locale === "en"
                                  ? "Leader update pending"
                                  : "Đang cập nhật đội trưởng"}
                            </StatusPill>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Surface>
          );
        })}
      </section>
    </div>
  );
}
