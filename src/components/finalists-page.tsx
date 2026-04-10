"use client";

import { useSiteState } from "@/components/providers/site-state-provider";
import { GradientAvatar, SectionHeading, StatusPill, Surface } from "@/components/site-ui";
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

function createEmptySlots<T>(items: T[], count: number) {
  return Array.from({ length: count }, (_, index) => items[index] ?? null);
}

export function FinalistsPage() {
  const { locale, teams, users, currentTeam, timelineItems } = useSiteState();
  const finalPresentationItem = timelineItems.find((item) => item.id === "round-3-final-presentation");
  const finalists = getFinalistTeams(teams);
  const finalistIds = new Set(finalists.map((team) => team.id));
  const emergingTeams = getEmergingTeams(teams, finalistIds);
  const finalistSlots = createEmptySlots(finalists, 5);
  const emergingSlots = createEmptySlots(emergingTeams, 10);

  return (
    <div className="space-y-12 md:space-y-16">
      <section className="space-y-5">
        <SectionHeading
          eyebrow={locale === "en" ? "Finalist teams" : "Đội vào thuyết trình"}
          title={locale === "en" ? "Top 5 finalist teams" : "Top 5 đội vào chung kết"}
          description={
            locale === "en"
              ? "The five teams below are the finalist list only. This section does not indicate ranking order."
              : "Năm đội dưới đây là danh sách đội vào chung kết. Phần này chỉ mang tính liệt kê, không thể hiện thứ hạng."
          }
        />

        <div className="grid gap-4 xl:grid-cols-2">
            {finalistSlots.map((team, index) => {
              if (!team) {
                return (
                  <Surface key={`finalist-slot-${index}`} className="overflow-hidden border-dashed px-5 py-5 md:px-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="flex items-start gap-4">
                        <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-[1.15rem] border border-slate-500/18 bg-[var(--panel-subtle)] text-sm font-semibold theme-text-soft">
                          {String(index + 1).padStart(2, "0")}
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="theme-heading text-xl font-semibold theme-text-strong">
                              {locale === "en" ? "Finalist slot" : "Vị trí chung kết"}
                            </h3>
                            <StatusPill tone="default">
                              {locale === "en" ? "Awaiting update" : "Chờ cập nhật"}
                            </StatusPill>
                          </div>
                          <p className="mt-2 text-sm leading-7 theme-text-soft">
                            {locale === "en"
                              ? "This finalist slot is reserved and will be filled when the shortlist is finalized."
                              : "Vị trí chung kết này đang được giữ chỗ và sẽ được cập nhật khi danh sách chính thức hoàn tất."}
                          </p>
                        </div>
                      </div>

                      <div className="rounded-[1.2rem] border theme-border bg-white/82 px-4 py-3 dark:bg-white/[0.05]">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] theme-eyebrow">
                          {locale === "en" ? "Presentation day" : "Ngày thuyết trình"}
                        </p>
                        <p className="mt-2 text-sm font-semibold theme-text-strong">
                          {finalPresentationItem
                            ? formatDateRangeLabel(locale, finalPresentationItem.startDate, finalPresentationItem.endDate)
                            : locale === "en"
                              ? "To be announced"
                              : "Sẽ cập nhật"}
                        </p>
                      </div>
                    </div>
                  </Surface>
                );
              }

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
                        <p className="mt-2 text-sm leading-7 theme-text-soft">
                          {locale === "en" ? `Keyword · ${team.track}` : `Từ khóa · ${team.track}`}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <StatusPill tone="success">
                            {locale === "en" ? "Finalist team" : "Đội vào chung kết"}
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
                        {locale === "en" ? "Presentation day" : "Ngày thuyết trình"}
                      </p>
                      <p className="mt-2 text-sm font-semibold theme-text-strong">
                        {finalPresentationItem
                          ? formatDateRangeLabel(locale, finalPresentationItem.startDate, finalPresentationItem.endDate)
                          : locale === "en"
                            ? "To be announced"
                            : "Sẽ cập nhật"}
                      </p>
                      <p className="mt-1 text-xs leading-6 theme-text-soft">
                        {leader?.name
                          ? `${locale === "en" ? "Team leader" : "Đội trưởng"} · ${leader.name}`
                          : locale === "en"
                            ? "Leader info is being updated"
                            : "Đang cập nhật thông tin đội trưởng"}
                      </p>
                    </div>
                  </div>
                </Surface>
              );
            })}
        </div>
      </section>

      <section className="space-y-5">
        <SectionHeading
          eyebrow={locale === "en" ? "Recognition" : "Ghi nhận nổi bật"}
          title={locale === "en" ? "10 Emerging Teams" : "10 Đội tiềm năng"}
          description={
            locale === "en"
              ? "The ten teams below are recognized as Emerging Teams only. This section is also a plain listing without ranking meaning."
              : "Mười đội dưới đây được ghi nhận là Đội tiềm năng. Phần này cũng chỉ là danh sách liệt kê, không mang ý nghĩa xếp hạng."
          }
        />

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
                    {locale === "en" ? "Keyword" : "Từ khóa"}
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.22em] theme-eyebrow">
                    {locale === "en" ? "Recognition" : "Ghi nhận"}
                  </th>
                </tr>
              </thead>
              <tbody>
                  {emergingSlots.map((team, index) => {
                    if (!team) {
                      return (
                        <tr key={`emerging-slot-${index}`} className="border-b theme-border last:border-b-0">
                          <td className="px-5 py-4 font-semibold theme-text-soft">{String(index + 1).padStart(2, "0")}</td>
                          <td className="px-5 py-4">
                            <p className="font-semibold theme-text-strong">
                              {locale === "en" ? "Emerging Team slot" : "Vị trí Đội tiềm năng"}
                            </p>
                            <p className="text-xs theme-text-soft">
                              {locale === "en" ? "Awaiting official update" : "Chờ cập nhật chính thức"}
                            </p>
                          </td>
                          <td className="px-5 py-4 text-sm theme-text-soft">--</td>
                          <td className="px-5 py-4 text-sm theme-text-soft">--</td>
                          <td className="px-5 py-4">
                            <StatusPill tone="default">
                              {locale === "en" ? "Reserved" : "Giữ chỗ"}
                            </StatusPill>
                          </td>
                        </tr>
                      );
                    }

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
      </section>
    </div>
  );
}
