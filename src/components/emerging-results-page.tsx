"use client";

import { useEffect, useMemo, useState } from "react";
import { Sprout, Users2 } from "lucide-react";

import { useSiteState } from "@/components/providers/site-state-provider";
import { GradientAvatar, SectionHeading, StatusPill, Surface } from "@/components/site-ui";
import { formatDateRangeLabel, pickText } from "@/lib/site";

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
}

interface EmergingResultsPayload {
  released: boolean;
  announcementStartDate?: string;
  awardTeams: EmergingAwardTeam[];
}

function createAwardSlots(items: EmergingAwardTeam[]) {
  return Array.from({ length: 10 }, (_, index) => items[index] ?? null);
}

export function EmergingResultsPage() {
  const { locale, currentTeam, timelineItems, pageContent } = useSiteState();
  const content = pageContent.emergingResults;
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
              eyebrow={pickText(locale, content.header.eyebrow)}
              title={pickText(locale, content.header.title)}
              description={pickText(locale, content.header.description)}
            />
          </div>
        </Surface>

        <Surface className="px-5 py-5 md:px-6">
          <div className="flex h-full flex-col justify-between gap-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] theme-eyebrow">
                {pickText(locale, content.announcementLabel)}
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
                  : pickText(locale, content.toBeAnnouncedLabel)}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <StatusPill tone={results.released ? "success" : "warning"}>
                {results.released
                  ? pickText(locale, content.releasedLabel)
                  : pickText(locale, content.pendingLabel)}
              </StatusPill>
              <StatusPill tone="info">
                {pickText(locale, content.awardTeamsLabel)}
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

            if (!team) {
              return (
                <Surface key={`emerging-award-slot-${rank}`} className="border-dashed px-5 py-5 md:px-6">
                  <div className="flex items-start gap-4">
                    <span className="inline-flex h-[4.25rem] w-[4.25rem] shrink-0 items-center justify-center rounded-[1.25rem] border border-emerald-500/18 bg-[linear-gradient(135deg,rgba(16,185,129,0.14),rgba(14,165,233,0.1))] text-emerald-700 dark:border-emerald-300/18 dark:bg-emerald-300/10 dark:text-emerald-100">
                      <Sprout className="h-6 w-6" />
                    </span>
                    <div className="min-w-0">
                      <p className="theme-heading text-xl font-semibold theme-text-strong">
                        {pickText(locale, content.emptySlotTitle)}
                      </p>
                      <p className="mt-2 text-sm leading-7 theme-text-soft">
                        {loading
                          ? pickText(locale, content.loadingSlotDescription)
                          : pickText(locale, content.pendingSlotDescription)}
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
                    <GradientAvatar
                      label={team.name}
                      tone={team.avatarTone}
                      imageSrc={team.avatarImageSrc}
                      className="h-[4.25rem] w-[4.25rem] shrink-0 rounded-[1.25rem]"
                    />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="theme-heading text-xl font-semibold theme-text-strong">
                          {team.name}
                        </h2>
                        <StatusPill>{`#${team.tag}`}</StatusPill>
                        {isCurrentTeam ? (
                          <StatusPill tone="info">
                            {pickText(locale, content.yourTeamLabel)}
                          </StatusPill>
                        ) : null}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <StatusPill tone="success">
                          {pickText(locale, content.awardLabel)}
                        </StatusPill>
                        <StatusPill tone="default">
                          {`${team.memberCount} ${pickText(locale, content.membersSuffix)}`}
                        </StatusPill>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 md:min-w-[18rem]">
                    <div className="rounded-[1.1rem] border theme-border bg-white/72 px-4 py-3 dark:bg-white/[0.04]">
                      <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] theme-eyebrow">
                        <Users2 className="h-3.5 w-3.5" />
                        {pickText(locale, content.leaderLabel)}
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
    </div>
  );
}
