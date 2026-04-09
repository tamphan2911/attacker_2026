"use client";

import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Presentation,
  Sparkles,
  Trophy,
  Users2,
} from "lucide-react";

import { useSiteState } from "@/components/providers/site-state-provider";
import { GradientAvatar, PageIntro, SectionHeading, StatusPill, Surface } from "@/components/site-ui";
import { competitionRoundWindows } from "@/data/site-content";
import { formatDateRangeLabel } from "@/lib/site";
import type { TeamFinalOutcome, TeamProfile, UserProfile } from "@/types/site";

const finalOutcomeOrder: Record<TeamFinalOutcome, number> = {
  champion: 0,
  "runner-up": 1,
  "third-place": 2,
  "fourth-place": 3,
  "emerging-team": 4,
};

function getFinalistTeams(teams: TeamProfile[]) {
  return [...teams]
    .filter((team) => team.stage === "round-3" || (team.finalOutcome && team.finalOutcome !== "emerging-team"))
    .sort((left, right) => {
      const leftRank = left.finalOutcome ? finalOutcomeOrder[left.finalOutcome] : 10;
      const rightRank = right.finalOutcome ? finalOutcomeOrder[right.finalOutcome] : 10;
      if (leftRank !== rightRank) {
        return leftRank - rightRank;
      }

      if (left.createdAt !== right.createdAt) {
        return left.createdAt.localeCompare(right.createdAt);
      }

      return left.name.localeCompare(right.name);
    })
    .slice(0, 5);
}

function getEmergingTeams(teams: TeamProfile[], finalistIds: Set<string>) {
  return [...teams]
    .filter((team) => team.finalOutcome === "emerging-team" && !finalistIds.has(team.id))
    .sort((left, right) => left.name.localeCompare(right.name))
    .slice(0, 10);
}

function getLeader(team: TeamProfile, users: UserProfile[]) {
  return users.find((user) => user.id === team.leaderId);
}

export function FinalistsPage() {
  const { locale, teams, users, currentTeam } = useSiteState();
  const round3Window = competitionRoundWindows.find((window) => window.round === "round-3");
  const finalists = getFinalistTeams(teams);
  const finalistIds = new Set(finalists.map((team) => team.id));
  const emergingTeams = getEmergingTeams(teams, finalistIds);

  return (
    <div className="space-y-12 md:space-y-16">
      <PageIntro
        eyebrow={locale === "en" ? "Round 2 result update" : "Cập nhật kết quả Vòng 2"}
        title={
          locale === "en"
            ? "Top 5 finalist teams and 10 Emerging Teams for the next stage."
            : "Top 5 đội vào thuyết trình chung kết và 10 Đội tiềm năng của mùa giải."
        }
        description={
          locale === "en"
            ? "This page summarizes the shortlist that moves forward to the final presentation stage, while also recognizing the next 10 teams with strong Round 2 performance."
            : "Trang này tổng hợp danh sách đội bước vào phần thuyết trình chung kết, đồng thời ghi nhận 10 đội có thành tích Vòng 2 nổi bật với danh hiệu Đội tiềm năng."
        }
        aside={
          <Surface className="px-5 py-5">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] theme-eyebrow">
              {locale === "en" ? "Final event" : "Ngày chung kết"}
            </p>
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-3 rounded-[1.15rem] border theme-border bg-white/76 px-4 py-3 dark:bg-white/[0.05]">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-sky-600/16 bg-sky-500/12 text-sky-700 dark:border-sky-300/16 dark:bg-sky-300/12 dark:text-sky-100">
                  <CalendarDays className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] theme-eyebrow">
                    {locale === "en" ? "Presentation day" : "Ngày thuyết trình"}
                  </p>
                  <p className="mt-1 text-sm font-medium theme-text-strong">
                    {round3Window
                      ? formatDateRangeLabel(locale, round3Window.startDate, round3Window.endDate)
                      : locale === "en"
                        ? "To be announced"
                        : "Sẽ cập nhật"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-[1.15rem] border theme-border bg-white/76 px-4 py-3 dark:bg-white/[0.05]">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-emerald-600/16 bg-emerald-500/12 text-emerald-700 dark:border-emerald-300/16 dark:bg-emerald-300/12 dark:text-emerald-100">
                  <Trophy className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] theme-eyebrow">
                    {locale === "en" ? "Shortlist" : "Danh sách"}
                  </p>
                  <p className="mt-1 text-sm font-medium theme-text-strong">
                    {locale === "en"
                      ? `${finalists.length} finalists · ${emergingTeams.length} Emerging Teams`
                      : `${finalists.length} đội chung kết · ${emergingTeams.length} Đội tiềm năng`}
                  </p>
                </div>
              </div>
            </div>
          </Surface>
        }
      />

      <section className="space-y-5">
        <SectionHeading
          eyebrow={locale === "en" ? "Finalist teams" : "Đội vào thuyết trình"}
          title={locale === "en" ? "Top 5 finalist teams" : "Top 5 đội vào chung kết"}
          description={
            locale === "en"
              ? "These teams advance to the live presentation round and continue into the final scoring session."
              : "Đây là các đội bước vào phần thuyết trình trực tiếp và tiếp tục được chấm điểm ở vòng chung kết."
          }
        />

        {finalists.length ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {finalists.map((team, index) => {
              const leader = getLeader(team, users);
              const isCurrentTeam = currentTeam?.id === team.id;

              return (
                <Surface
                  key={team.id}
                  className={`overflow-hidden px-5 py-5 md:px-6 ${isCurrentTeam ? "border-sky-500/30 shadow-[0_26px_58px_rgba(23,114,208,0.14)]" : ""}`}
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="flex items-start gap-4">
                      <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-[1.15rem] border border-sky-600/18 bg-[linear-gradient(135deg,rgba(14,165,233,0.16),rgba(37,99,235,0.12))] text-sm font-semibold text-slate-950 dark:border-sky-300/18 dark:bg-sky-300/12 dark:text-sky-100">
                        {String(index + 1).padStart(2, "0")}
                      </div>
                      <GradientAvatar
                        label={team.name}
                        tone={team.avatarTone}
                        imageSrc={team.avatarImageSrc}
                        className="h-14 w-14 rounded-[1.2rem]"
                      />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="theme-heading text-xl font-semibold theme-text-strong">
                            {team.name}
                          </h3>
                          <StatusPill>{`#${team.tag}`}</StatusPill>
                          {isCurrentTeam ? (
                            <StatusPill tone="info">
                              {locale === "en" ? "Your team" : "Đội của bạn"}
                            </StatusPill>
                          ) : null}
                        </div>
                        <p className="mt-2 text-sm leading-7 theme-text-soft">{team.track}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <StatusPill tone="success">
                            {locale === "en" ? "Final presentation slot" : "Suất thuyết trình chung kết"}
                          </StatusPill>
                          <StatusPill tone="default">
                            {locale === "en"
                              ? `${team.memberIds.length} members`
                              : `${team.memberIds.length} thành viên`}
                          </StatusPill>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[1.2rem] border theme-border bg-white/82 px-4 py-3 dark:bg-white/[0.05]">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] theme-eyebrow">
                        {locale === "en" ? "Team leader" : "Đội trưởng"}
                      </p>
                      <p className="mt-2 text-sm font-semibold theme-text-strong">
                        {leader?.name ?? (locale === "en" ? "Updating" : "Đang cập nhật")}
                      </p>
                      <p className="mt-1 text-xs leading-6 theme-text-soft">
                        {leader?.university ?? (locale === "en" ? "University info is being updated" : "Đang cập nhật thông tin trường")}
                      </p>
                    </div>
                  </div>
                </Surface>
              );
            })}
          </div>
        ) : (
          <Surface className="px-6 py-7">
            <div className="flex items-start gap-4">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-[1.2rem] border border-sky-600/18 bg-sky-500/12 text-sky-700 dark:border-sky-300/16 dark:bg-sky-300/12 dark:text-sky-100">
                <Presentation className="h-5 w-5" />
              </span>
              <div>
                <h3 className="theme-heading text-lg font-semibold theme-text-strong">
                  {locale === "en" ? "Finalist shortlist is being updated" : "Danh sách đội chung kết đang được cập nhật"}
                </h3>
                <p className="mt-2 text-sm leading-7 theme-text-muted">
                  {locale === "en"
                    ? "Once the Round 2 shortlist is finalized, the top 5 finalist teams will appear here."
                    : "Khi danh sách sau Vòng 2 được chốt, Top 5 đội vào thuyết trình chung kết sẽ xuất hiện tại đây."}
                </p>
              </div>
            </div>
          </Surface>
        )}
      </section>

      <section className="space-y-5">
        <SectionHeading
          eyebrow={locale === "en" ? "Recognition" : "Ghi nhận nổi bật"}
          title={locale === "en" ? "10 Emerging Teams" : "10 Đội tiềm năng"}
          description={
            locale === "en"
              ? "These teams delivered strong Round 2 performance and receive season recognition before the final stage."
              : "Các đội này có kết quả Vòng 2 nổi bật và được ghi nhận danh hiệu Đội tiềm năng của mùa giải."
          }
        />

        {emergingTeams.length ? (
          <Surface className="overflow-hidden px-0 py-0">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b theme-border bg-[rgba(244,249,255,0.88)] dark:bg-white/[0.04]">
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.22em] theme-eyebrow">#</th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.22em] theme-eyebrow">
                      {locale === "en" ? "Team" : "Đội"}
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.22em] theme-eyebrow">
                      {locale === "en" ? "Leader" : "Đội trưởng"}
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.22em] theme-eyebrow">
                      {locale === "en" ? "Track" : "Định hướng"}
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.22em] theme-eyebrow">
                      {locale === "en" ? "Recognition" : "Ghi nhận"}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {emergingTeams.map((team, index) => {
                    const leader = getLeader(team, users);
                    const isCurrentTeam = currentTeam?.id === team.id;

                    return (
                      <tr
                        key={team.id}
                        className={`border-b theme-border last:border-b-0 ${isCurrentTeam ? "bg-sky-500/6 dark:bg-sky-300/[0.06]" : ""}`}
                      >
                        <td className="px-5 py-4 font-semibold theme-text-strong">{String(index + 1).padStart(2, "0")}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <GradientAvatar
                              label={team.name}
                              tone={team.avatarTone}
                              imageSrc={team.avatarImageSrc}
                              className="h-11 w-11 rounded-[1rem]"
                            />
                            <div className="min-w-0">
                              <p className="font-semibold theme-text-strong">{team.name}</p>
                              <p className="text-xs theme-text-soft">{`#${team.tag}`}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-medium theme-text-body">{leader?.name ?? "--"}</p>
                          <p className="mt-1 text-xs theme-text-soft">{leader?.university ?? "--"}</p>
                        </td>
                        <td className="px-5 py-4 text-sm leading-7 theme-text-body">{team.track}</td>
                        <td className="px-5 py-4">
                          <StatusPill tone="warning">
                            {locale === "en" ? "Emerging Team" : "Đội tiềm năng"}
                          </StatusPill>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Surface>
        ) : (
          <Surface className="px-6 py-7">
            <div className="flex items-start gap-4">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-[1.2rem] border border-amber-600/18 bg-amber-500/12 text-amber-700 dark:border-amber-300/16 dark:bg-amber-300/12 dark:text-amber-100">
                <Sparkles className="h-5 w-5" />
              </span>
              <div>
                <h3 className="theme-heading text-lg font-semibold theme-text-strong">
                  {locale === "en" ? "Emerging Team recognition is being updated" : "Danh sách Đội tiềm năng đang được cập nhật"}
                </h3>
                <p className="mt-2 text-sm leading-7 theme-text-muted">
                  {locale === "en"
                    ? "Once the Round 2 review is finalized, the 10 recognized Emerging Teams will be listed here."
                    : "Khi phần chấm Vòng 2 được hoàn tất, 10 đội được ghi nhận là Đội tiềm năng sẽ được hiển thị tại đây."}
                </p>
              </div>
            </div>
          </Surface>
        )}
      </section>

      <Surface className="px-6 py-6 md:px-7">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-[1.2rem] border border-violet-600/16 bg-violet-500/12 text-violet-700 dark:border-violet-300/16 dark:bg-violet-300/12 dark:text-violet-100">
              <Users2 className="h-5 w-5" />
            </span>
            <div>
              <h3 className="theme-heading text-lg font-semibold theme-text-strong">
                {locale === "en" ? "What comes next?" : "Tiếp theo là gì?"}
              </h3>
              <p className="mt-2 max-w-2xl text-sm leading-7 theme-text-muted">
                {locale === "en"
                  ? "Finalist teams proceed to the on-site presentation stage, while Emerging Teams remain part of the official season recognition. Follow the timeline and official channels for any scheduling updates."
                  : "Các đội vào chung kết sẽ bước sang phần thuyết trình trực tiếp, trong khi Đội tiềm năng vẫn là danh hiệu ghi nhận chính thức của mùa giải. Hãy tiếp tục theo dõi timeline và các kênh chính thức để cập nhật lịch trình."}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/competition/timeline#round-3-timeline"
              className="theme-button-secondary inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold"
            >
              <CalendarDays className="h-4 w-4" />
              {locale === "en" ? "Open final-round timeline" : "Xem timeline chung kết"}
            </Link>
            <Link
              href="/competition"
              className="theme-button-primary inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold"
            >
              <CheckCircle2 className="h-4 w-4" />
              {locale === "en" ? "Review competition format" : "Xem thể thức cuộc thi"}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </Surface>
    </div>
  );
}
