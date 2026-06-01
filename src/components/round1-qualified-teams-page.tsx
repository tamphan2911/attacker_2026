"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Clock3, Search, ShieldCheck, Users2 } from "lucide-react";
import Link from "next/link";

import { useSiteState } from "@/components/providers/site-state-provider";
import { GradientAvatar, SectionHeading, Surface } from "@/components/site-ui";
import { formatDateRangeLabel, pickText } from "@/lib/site";

type QualifiedTeamMember = {
  userId: string;
  name: string;
  university: string;
  avatarTone: string;
  avatarImageSrc?: string | null;
  isLeader: boolean;
};

type QualifiedTeam = {
  teamId: string;
  teamName: string;
  teamTag: string;
  track: string;
  avatarTone: string;
  avatarImageSrc?: string | null;
  memberCount: number;
  leaderName: string;
  leaderUniversity: string;
  members: QualifiedTeamMember[];
  completedMembers: number;
  scoredMembers: number;
  averageObjectiveScore: number;
  averageEssayScore: number;
  averageTotalScore: number;
};

type Round1QualifiedTeamsPayload = {
  released: boolean;
  adminPreview?: boolean;
  announcementStartDate?: string;
  announcementEndDate?: string;
  announcementStartTime?: string;
  announcementEndTime?: string;
  qualifiedTeams: QualifiedTeam[];
  maxScores: {
    objective: number;
    essay: number;
    total: number;
  };
};

export function Round1QualifiedTeamsPage() {
  const { locale, currentTeam, pageContent } = useSiteState();
  const content = pageContent.round1Results;
  const [payload, setPayload] = useState<Round1QualifiedTeamsPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        setIsLoading(true);
        setError("");
        const response = await fetch("/api/round-1/qualified-teams", {
          cache: "no-store",
          credentials: "same-origin",
        });

        if (!response.ok) {
          throw new Error("Could not load Round 1 qualified teams.");
        }

        const nextPayload = (await response.json()) as Round1QualifiedTeamsPayload;
        if (!cancelled) {
          setPayload(nextPayload);
        }
      } catch {
        if (!cancelled) {
          setError(pickText(locale, content.errorLabel));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [content.errorLabel, locale]);

  const announcementLabel = useMemo(() => {
    if (!payload?.announcementStartDate) {
      return pickText(locale, content.toBeAnnouncedLabel);
    }

    return formatDateRangeLabel(
      locale,
      payload.announcementStartDate,
      payload.announcementEndDate ?? payload.announcementStartDate,
      payload.announcementStartTime,
      payload.announcementEndTime,
    );
  }, [
    content.toBeAnnouncedLabel,
    locale,
    payload?.announcementEndDate,
    payload?.announcementEndTime,
    payload?.announcementStartDate,
    payload?.announcementStartTime,
  ]);

  const qualifiedTeams = useMemo(() => payload?.qualifiedTeams ?? [], [payload?.qualifiedTeams]);
  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const filteredTeams = useMemo(() => {
    if (!normalizedSearchTerm) {
      return qualifiedTeams;
    }

    return qualifiedTeams.filter((team) => {
      const searchHaystack = [
        team.teamName,
        team.teamTag,
        team.track,
        team.leaderName,
        team.leaderUniversity,
        ...team.members.flatMap((member) => [member.name, member.university]),
      ]
        .join(" ")
        .toLowerCase();

      return searchHaystack.includes(normalizedSearchTerm);
    });
  }, [normalizedSearchTerm, qualifiedTeams]);

  if (isLoading) {
    return (
      <Surface className="mx-auto max-w-3xl px-6 py-10 text-center">
        <p className="text-sm theme-text-soft">{pickText(locale, content.loadingLabel)}</p>
      </Surface>
    );
  }

  if (error || !payload) {
    return (
      <Surface className="mx-auto max-w-3xl px-6 py-10 text-center">
        <p className="text-sm leading-7 theme-text-soft">{error || pickText(locale, content.errorLabel)}</p>
      </Surface>
    );
  }

  if (!payload.released) {
    return (
      <div className="space-y-8">
        <SectionHeading
          eyebrow={pickText(locale, content.unreleasedHeader.eyebrow)}
          title={pickText(locale, content.unreleasedHeader.title)}
          description={pickText(locale, content.unreleasedHeader.description)}
        />

        <Surface className="overflow-hidden px-6 py-6 md:px-8 md:py-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div className="flex items-start gap-4">
              <div className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.25rem] border border-sky-400/28 bg-[linear-gradient(135deg,rgba(186,230,253,0.92),rgba(191,219,254,0.72))] text-sky-800 dark:border-sky-300/20 dark:bg-sky-300/12 dark:text-sky-100">
                <Clock3 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.26em] theme-eyebrow">
                  {pickText(locale, content.announcementDateLabel)}
                </p>
                <h2 className="mt-2 text-2xl font-semibold theme-text-strong">{announcementLabel}</h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 theme-text-muted">
                  {pickText(locale, content.waitingNotice)}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/timeline"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-sky-300/45 bg-sky-100/75 px-5 py-3 text-sm font-semibold text-sky-900 transition hover:-translate-y-0.5 hover:bg-sky-100 dark:border-sky-300/18 dark:bg-sky-300/12 dark:text-sky-100"
              >
                {pickText(locale, content.viewTimelineLabel)}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/news"
                className="inline-flex items-center justify-center gap-2 rounded-full border theme-border theme-panel px-5 py-3 text-sm font-semibold theme-text-strong"
              >
                {pickText(locale, content.openNewsLabel)}
              </Link>
            </div>
          </div>
        </Surface>
      </div>
    );
  }

  return (
    <div className="space-y-10 md:space-y-12">
      <SectionHeading
        eyebrow={pickText(locale, content.releasedHeader.eyebrow)}
        title={pickText(locale, content.releasedHeader.title)}
        description={pickText(locale, content.releasedHeader.description)}
      />

      {payload.adminPreview ? (
        <Surface className="border-sky-500/28 bg-[linear-gradient(135deg,rgba(224,242,254,0.92),rgba(219,234,254,0.70))] px-5 py-4 dark:border-sky-300/20 dark:bg-[linear-gradient(135deg,rgba(56,189,248,0.14),rgba(37,99,235,0.10))]">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-sky-500/24 bg-white/70 text-sky-700 dark:border-sky-200/18 dark:bg-white/10 dark:text-sky-100">
              <ShieldCheck className="h-4.5 w-4.5" />
            </span>
            <div>
              <p className="text-sm font-semibold theme-text-strong">
                {pickText(locale, content.adminPreviewTitle)}
              </p>
              <p className="mt-1 text-sm leading-6 theme-text-muted">
                {pickText(locale, content.adminPreviewDescription)}
              </p>
            </div>
          </div>
        </Surface>
      ) : null}

      {qualifiedTeams.length === 0 ? (
        <Surface className="px-6 py-8 text-center">
          <Search className="mx-auto h-8 w-8 theme-text-faint" />
          <h2 className="mt-4 text-2xl font-semibold theme-text-strong">
            {pickText(locale, content.emptyState.title)}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 theme-text-muted">
            {pickText(locale, content.emptyState.description)}
          </p>
        </Surface>
      ) : (
        <Surface className="overflow-hidden px-0 py-0">
          <div className="border-b theme-border px-5 py-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.26em] theme-eyebrow">
                  {pickText(locale, content.listHeader.eyebrow)}
                </p>
                <p className="mt-2 text-sm leading-6 theme-text-muted">
                  {pickText(locale, content.listHeader.description)}
                </p>
              </div>
              <label className="relative w-full lg:max-w-md">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-sky-700 dark:text-sky-100" />
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder={pickText(locale, content.searchPlaceholder)}
                  className="theme-field h-12 w-full rounded-full border px-11 text-sm font-medium outline-none transition focus:border-sky-400/60"
                />
              </label>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b theme-border bg-[rgba(244,249,255,0.9)] dark:bg-white/[0.04]">
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.22em] theme-eyebrow">
                    {pickText(locale, content.teamColumnLabel)}
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.22em] theme-eyebrow">
                    {pickText(locale, content.membersColumnLabel)}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredTeams.map((team, index) => {
                  const rowToneClassName =
                    currentTeam?.id === team.teamId
                      ? "bg-cyan-100/82 shadow-[inset_4px_0_0_rgba(14,165,233,0.82)] dark:bg-cyan-300/[0.14] dark:shadow-[inset_4px_0_0_rgba(103,232,249,0.72)]"
                      : index % 2 === 0
                        ? "bg-white/72 dark:bg-white/[0.035]"
                        : "bg-sky-50/72 dark:bg-sky-300/[0.055]";

                  return (
                    <tr
                      key={team.teamId}
                      className={`border-b border-slate-200/75 transition-colors last:border-b-0 hover:bg-sky-100/70 dark:border-white/10 dark:hover:bg-sky-300/[0.10] ${rowToneClassName}`}
                    >
                      <td className="px-5 py-4">
                        <div className="flex min-w-[15rem] items-center gap-3">
                          <GradientAvatar
                            label={team.teamName}
                            tone={team.avatarTone}
                            imageSrc={team.avatarImageSrc ?? undefined}
                            className="h-10 w-10 rounded-[0.95rem]"
                          />
                          <div>
                            <p className="font-semibold theme-text-strong">{team.teamName}</p>
                            <p className="mt-1 text-xs theme-text-soft">{`${team.teamTag} · ${team.track}`}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="min-w-[32rem]">
                          <div className="mb-3 inline-flex items-center gap-2 rounded-full border theme-border theme-panel px-3 py-1 text-xs font-semibold theme-text-strong">
                            <Users2 className="h-3.5 w-3.5 theme-text-soft" />
                            {team.memberCount} {pickText(locale, content.membersSuffix)}
                          </div>
                          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                            {team.members.map((member) => (
                              <div
                                key={member.userId}
                                className="flex min-w-0 items-center gap-2 rounded-[1rem] border theme-border bg-white/70 px-3 py-2 dark:bg-white/[0.04]"
                              >
                                <GradientAvatar
                                  label={member.name}
                                  tone={member.avatarTone}
                                  imageSrc={member.avatarImageSrc ?? undefined}
                                  className="h-8 w-8 rounded-xl"
                                />
                                <div className="min-w-0">
                                  <div className="flex min-w-0 items-center gap-2">
                                    <p className="truncate text-xs font-semibold theme-text-strong">{member.name}</p>
                                    {member.isLeader ? (
                                      <span className="shrink-0 rounded-full border border-sky-600/20 bg-sky-100/82 px-2 py-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-sky-800 dark:border-sky-300/18 dark:bg-sky-300/12 dark:text-sky-100">
                                        {pickText(locale, content.leaderLabel)}
                                      </span>
                                    ) : null}
                                  </div>
                                  <p className="mt-0.5 line-clamp-2 text-[0.68rem] leading-4 theme-text-soft">
                                    {member.university || pickText(locale, content.universityMissingLabel)}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredTeams.length === 0 ? (
              <div className="px-6 py-10 text-center">
                <Search className="mx-auto h-8 w-8 theme-text-faint" />
                <p className="mt-4 text-sm font-semibold theme-text-strong">
                  {pickText(locale, content.noSearchResults.title)}
                </p>
                <p className="mt-2 text-sm theme-text-muted">
                  {pickText(locale, content.noSearchResults.description)}
                </p>
              </div>
            ) : null}
          </div>
        </Surface>
      )}
    </div>
  );
}
