"use client";

import { useEffect, useMemo, useState } from "react";
import { Medal, Sparkles, Sprout, Trophy, Users2 } from "lucide-react";

import { useSiteState } from "@/components/providers/site-state-provider";
import { GradientAvatar, SectionHeading, StatusPill, Surface } from "@/components/site-ui";
import { formatDateRangeLabel } from "@/lib/site";

interface EmergingAwardTeam {
  id: string;
  name: string;
  tag: string;
  leaderId: string;
  leaderName: string;
  leaderUniversity: string;
  memberCount: number;
  avatarTone: string;
  avatarImageSrc?: string;
  track: string;
  finalScore: number;
  round2AverageScore: number;
}

interface EmergingResultsPayload {
  released: boolean;
  announcementStartDate?: string;
  awardTeams: EmergingAwardTeam[];
}

function createAwardSlots(items: EmergingAwardTeam[]) {
  return Array.from({ length: 10 }, (_, index) => items[index] ?? null);
}

function formatScore(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

export function EmergingResultsPage() {
  const { locale, currentTeam, timelineItems } = useSiteState();
  const [results, setResults] = useState<EmergingResultsPayload>({
    released: false,
    awardTeams: [],
  });
  const [loading, setLoading] = useState(true);

  const announcementItem = timelineItems.find((item) => item.id === "round-3-emerging-awards-announcement");
  const awardSlots = useMemo(
    () => createAwardSlots(results.released ? results.awardTeams : []),
    [results.awardTeams, results.released],
  );

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const response = await fetch("/api/round-3/emerging-results", {
          cache: "no-store",
          credentials: "same-origin",
        });

        if (!response.ok) {
          throw new Error("Could not load Emerging results.");
        }

        const payload = (await response.json()) as EmergingResultsPayload;
        if (!cancelled) {
          setResults({
            released: Boolean(payload.released),
            announcementStartDate: payload.announcementStartDate,
            awardTeams: payload.awardTeams ?? [],
          });
        }
      } catch {
        if (!cancelled) {
          setResults({ released: false, awardTeams: [] });
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-8 md:space-y-10">
      <section className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <Surface className="overflow-hidden px-5 py-6 md:px-7 md:py-7">
          <div className="flex items-start gap-4">
            <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.15rem] border border-emerald-500/22 bg-[linear-gradient(135deg,rgba(16,185,129,0.2),rgba(14,165,233,0.14))] text-emerald-800 dark:border-emerald-300/20 dark:bg-emerald-300/12 dark:text-emerald-100">
              <Sprout className="h-6 w-6" />
            </span>
            <SectionHeading
              eyebrow={locale === "en" ? "Emerging award" : "Giải Đội ươm mầm"}
              title={locale === "en" ? "Emerging results" : "Kết quả Đội ươm mầm"}
              description={
                locale === "en"
                  ? "The 10 Emerging round award recipients are ranked by the final score entered after the Emerging report round."
                  : "10 đội nhận giải Đội ươm mầm được xếp theo điểm chung cuộc sau vòng nộp báo cáo Đội ươm mầm."
              }
            />
          </div>
        </Surface>

        <Surface className="px-5 py-5 md:px-6">
          <div className="flex h-full flex-col justify-between gap-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] theme-eyebrow">
                {locale === "en" ? "Announcement" : "Công bố"}
              </p>
              <p className="mt-2 text-sm font-semibold leading-7 theme-text-strong">
                {announcementItem
                  ? formatDateRangeLabel(
                      locale,
                      announcementItem.startDate,
                      announcementItem.endDate,
                      announcementItem.startTime,
                      announcementItem.endTime,
                    )
                  : locale === "en"
                    ? "To be announced"
                    : "Sẽ cập nhật"}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <StatusPill tone={results.released ? "success" : "warning"}>
                {results.released
                  ? locale === "en"
                    ? "Released"
                    : "Đã công bố"
                  : locale === "en"
                    ? "Pending"
                    : "Chờ công bố"}
              </StatusPill>
              <StatusPill tone="info">
                {locale === "en" ? "10 award teams" : "10 đội nhận giải"}
              </StatusPill>
            </div>
          </div>
        </Surface>
      </section>

      <section className="space-y-5">
        <div className="grid gap-4 xl:grid-cols-2">
          {awardSlots.map((team, index) => {
            const rank = index + 1;
            const isCurrentTeam = Boolean(team && currentTeam?.id === team.id);
            const RankIcon = rank <= 3 ? Trophy : Medal;

            if (!team) {
              return (
                <Surface key={`emerging-award-slot-${rank}`} className="border-dashed px-5 py-5 md:px-6">
                  <div className="flex items-start gap-4">
                    <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-[1rem] border border-slate-400/24 bg-[var(--panel-subtle)] text-sm font-semibold theme-text-soft">
                      {String(rank).padStart(2, "0")}
                    </span>
                    <div className="min-w-0">
                      <p className="theme-heading text-xl font-semibold theme-text-strong">
                        {locale === "en" ? "Emerging award slot" : "Vị trí giải Đội ươm mầm"}
                      </p>
                      <p className="mt-2 text-sm leading-7 theme-text-soft">
                        {loading
                          ? locale === "en"
                            ? "Loading official results..."
                            : "Đang tải kết quả chính thức..."
                          : locale === "en"
                            ? "Official team will appear after the announcement and score confirmation."
                            : "Đội chính thức sẽ hiển thị sau khi công bố và xác nhận điểm."}
                      </p>
                    </div>
                  </div>
                </Surface>
              );
            }

            return (
              <Surface
                key={team.id}
                className={`overflow-hidden px-5 py-5 md:px-6 ${
                  isCurrentTeam ? "border-emerald-500/34 shadow-[0_24px_54px_rgba(16,185,129,0.14)]" : ""
                }`}
              >
                <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                  <div className="flex min-w-0 items-start gap-4">
                    <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-[1rem] border border-emerald-500/22 bg-[linear-gradient(135deg,rgba(16,185,129,0.18),rgba(14,165,233,0.12))] text-sm font-semibold text-emerald-800 dark:border-emerald-300/20 dark:bg-emerald-300/12 dark:text-emerald-100">
                      {String(rank).padStart(2, "0")}
                    </span>
                    <GradientAvatar
                      label={team.name}
                      tone={team.avatarTone}
                      imageSrc={team.avatarImageSrc}
                      className="h-14 w-14 rounded-[1.15rem]"
                    />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="theme-heading text-xl font-semibold theme-text-strong">
                          {team.name}
                        </h2>
                        <StatusPill>{`#${team.tag}`}</StatusPill>
                        {isCurrentTeam ? (
                          <StatusPill tone="info">
                            {locale === "en" ? "Your team" : "Đội của bạn"}
                          </StatusPill>
                        ) : null}
                      </div>
                      <p className="mt-2 text-sm leading-7 theme-text-muted">{team.track}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <StatusPill tone="success">
                          {locale === "en" ? "Emerging award" : "Giải Đội ươm mầm"}
                        </StatusPill>
                        <StatusPill tone="default">
                          {`${team.memberCount} ${locale === "en" ? "members" : "thành viên"}`}
                        </StatusPill>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 md:min-w-[18rem] md:grid-cols-1">
                    <div className="rounded-[1.1rem] border theme-border bg-white/72 px-4 py-3 dark:bg-white/[0.04]">
                      <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] theme-eyebrow">
                        <RankIcon className="h-3.5 w-3.5" />
                        {locale === "en" ? "Final score" : "Điểm chung cuộc"}
                      </p>
                      <p className="mt-2 text-2xl font-semibold theme-text-strong">
                        {formatScore(team.finalScore)}
                      </p>
                    </div>
                    <div className="rounded-[1.1rem] border theme-border bg-white/72 px-4 py-3 dark:bg-white/[0.04]">
                      <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] theme-eyebrow">
                        <Users2 className="h-3.5 w-3.5" />
                        {locale === "en" ? "Leader" : "Đội trưởng"}
                      </p>
                      <p className="mt-2 text-sm font-semibold theme-text-strong">{team.leaderName}</p>
                      <p className="mt-1 text-xs leading-5 theme-text-soft">{team.leaderUniversity}</p>
                    </div>
                  </div>
                </div>
              </Surface>
            );
          })}
        </div>
      </section>

      <Surface className="px-5 py-5 md:px-6">
        <div className="flex items-start gap-3">
          <Sparkles className="mt-1 h-5 w-5 theme-accent" />
          <p className="text-sm leading-7 theme-text-muted">
            {locale === "en"
              ? "Ranking is based on the final Emerging round score. Round 2 score is used only as the tie-breaker."
              : "Xếp hạng dựa trên điểm chung cuộc của Vòng Đội ươm mầm. Điểm Vòng 2 chỉ dùng để phân định khi bằng điểm."}
          </p>
        </div>
      </Surface>
    </div>
  );
}
