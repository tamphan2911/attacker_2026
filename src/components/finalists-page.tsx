"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { useSiteState } from "@/components/providers/site-state-provider";
import { SectionHeading, StatusPill, Surface } from "@/components/site-ui";
import { formatDateRangeLabel, pickText } from "@/lib/site";
import type { EditableFinalistsGuidancePanel } from "@/types/site";

interface Round2FinalistTeam {
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
  averageScore: number;
}

interface Round2FinalistsPayload {
  released: boolean;
  finalists: Round2FinalistTeam[];
  emergingTeams: Round2FinalistTeam[];
}

function createEmptySlots<T>(items: T[], count: number) {
  return Array.from({ length: count }, (_, index) => items[index] ?? null);
}

function getTeamInitials(label: string) {
  return label
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function TeamRectangleAvatar({
  label,
  tone,
  imageSrc,
  className,
}: {
  label: string;
  tone: string;
  imageSrc?: string;
  className: string;
}) {
  return (
    <div
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-[0.85rem] bg-gradient-to-br text-sm font-semibold text-white ${tone} ${className}`}
    >
      {imageSrc ? (
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${imageSrc})` }}
        />
      ) : null}
      <span className={imageSrc ? "hidden" : "relative z-10"}>{getTeamInitials(label)}</span>
    </div>
  );
}

function GuidancePanel({
  locale,
  panel,
  organizerEmail,
}: {
  locale: "en" | "vi";
  panel: EditableFinalistsGuidancePanel;
  organizerEmail: string;
}) {
  return (
    <Surface className="px-5 py-5 md:px-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold theme-text-strong">{pickText(locale, panel.title)}</p>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-7 theme-text-muted">
            {panel.items.map((item, index) => (
              <li key={`${index}-${pickText(locale, item)}`}>{pickText(locale, item)}</li>
            ))}
          </ul>
          <p className="mt-3 text-xs leading-6 theme-text-soft">
            {pickText(locale, panel.emailLabel)}: {organizerEmail}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-3">
          <Link
            href="/dashboard#round-3-section"
            className="theme-button-primary inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold"
          >
            {pickText(locale, panel.reportLabel)}
          </Link>
        </div>
      </div>
    </Surface>
  );
}

export function FinalistsPage() {
  const { locale, currentTeam, timelineItems, pageContent } = useSiteState();
  const [round2Results, setRound2Results] = useState<Round2FinalistsPayload>({
    released: false,
    finalists: [],
    emergingTeams: [],
  });
  const finalPresentationItem = timelineItems.find((item) => item.id === "round-3-final-presentation");
  const finalistSlots = createEmptySlots(round2Results.released ? round2Results.finalists : [], 5);
  const emergingSlots = createEmptySlots(round2Results.released ? round2Results.emergingTeams : [], 20);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const response = await fetch("/api/round-2/finalists", {
          cache: "no-store",
          credentials: "same-origin",
        });

        if (!response.ok) {
          throw new Error("Could not load Round 2 finalist results.");
        }

        const payload = (await response.json()) as Round2FinalistsPayload;
        if (!cancelled) {
          setRound2Results({
            released: Boolean(payload.released),
            finalists: payload.finalists ?? [],
            emergingTeams: payload.emergingTeams ?? [],
          });
        }
      } catch {
        if (!cancelled) {
          setRound2Results({
            released: false,
            finalists: [],
            emergingTeams: [],
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-12 md:space-y-16">
      <section className="space-y-5">
        <SectionHeading
          eyebrow={pickText(locale, pageContent.finalists.finalistsHeader.eyebrow)}
          title={pickText(locale, pageContent.finalists.finalistsHeader.title)}
          description={pickText(locale, pageContent.finalists.finalistsHeader.description)}
        />

        {round2Results.released ? (
          <GuidancePanel
            locale={locale}
            panel={pageContent.finalists.finalistGuidance}
            organizerEmail={pageContent.contact.officialEmailValue}
          />
        ) : null}

        <div className="grid gap-4 xl:grid-cols-2">
            {finalistSlots.map((team, index) => {
              if (!team) {
                return (
                  <Surface key={`finalist-slot-${index}`} className="overflow-hidden border-dashed px-5 py-5 md:px-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="flex items-start gap-4">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="theme-heading text-xl font-semibold theme-text-strong">
                              {pickText(locale, pageContent.finalists.finalistSlotLabel)}
                            </h3>
                            <StatusPill tone="default">
                              {pickText(locale, pageContent.finalists.awaitingUpdateLabel)}
                            </StatusPill>
                          </div>
                          <p className="mt-2 text-sm leading-7 theme-text-soft">
                            {pickText(locale, pageContent.finalists.finalistSlotDescription)}
                          </p>
                        </div>
                      </div>

                      <div className="w-full shrink-0 rounded-[1.2rem] border theme-border bg-white/82 px-4 py-3 dark:bg-white/[0.05] md:w-[18.5rem]">
                        <p className="whitespace-nowrap text-xs font-semibold uppercase tracking-[0.18em] theme-eyebrow sm:tracking-[0.22em]">
                          {pickText(locale, pageContent.finalists.presentationDayLabel)}
                        </p>
                        <p className="mt-2 text-sm font-semibold theme-text-strong">
                          {finalPresentationItem
                            ? formatDateRangeLabel(
                                locale,
                                finalPresentationItem.startDate,
                                finalPresentationItem.endDate,
                                finalPresentationItem.startTime,
                                finalPresentationItem.endTime,
                              )
                            : pickText(locale, pageContent.finalists.toBeAnnouncedLabel)}
                        </p>
                      </div>
                    </div>
                  </Surface>
                );
              }

              const isCurrentTeam = currentTeam?.id === team.id;

              return (
                <Surface
                  key={team.id}
                  className={`overflow-hidden px-5 py-5 md:px-6 ${isCurrentTeam ? "border-sky-500/30 shadow-[0_26px_58px_rgba(23,114,208,0.14)]" : ""}`}
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="flex items-start gap-4">
                      <TeamRectangleAvatar
                        label={team.name}
                        tone={team.avatarTone}
                        imageSrc={team.avatarImageSrc}
                        className="h-16 w-16"
                      />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="theme-heading text-xl font-semibold theme-text-strong">
                            {team.name}
                          </h3>
                          <StatusPill>{`#${team.tag}`}</StatusPill>
                          {isCurrentTeam ? (
                            <StatusPill tone="info">
                              {pickText(locale, pageContent.finalists.yourTeamLabel)}
                            </StatusPill>
                          ) : null}
                        </div>
                        <p className="mt-2 text-sm leading-7 theme-text-soft">
                          {`${pickText(locale, pageContent.finalists.keywordPrefix)} · ${team.track}`}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <StatusPill tone="success">
                            {pickText(locale, pageContent.finalists.finalistTeamLabel)}
                          </StatusPill>
                          <StatusPill tone="default">
                            {`${team.memberCount} ${pickText(locale, pageContent.finalists.membersSuffix)}`}
                          </StatusPill>
                        </div>
                      </div>
                    </div>

                    <div className="w-full shrink-0 rounded-[1.2rem] border theme-border bg-white/82 px-4 py-3 dark:bg-white/[0.05] md:w-[18.5rem]">
                      <p className="whitespace-nowrap text-xs font-semibold uppercase tracking-[0.18em] theme-eyebrow sm:tracking-[0.22em]">
                        {pickText(locale, pageContent.finalists.presentationDayLabel)}
                      </p>
                      <p className="mt-2 text-sm font-semibold theme-text-strong">
                        {finalPresentationItem
                          ? formatDateRangeLabel(
                              locale,
                              finalPresentationItem.startDate,
                              finalPresentationItem.endDate,
                              finalPresentationItem.startTime,
                              finalPresentationItem.endTime,
                            )
                          : pickText(locale, pageContent.finalists.toBeAnnouncedLabel)}
                      </p>
                      <p className="mt-1 text-xs leading-6 theme-text-soft">
                        {team.leaderName
                          ? `${pickText(locale, pageContent.finalists.teamLeaderPrefix)} · ${team.leaderName}`
                          : pickText(locale, pageContent.finalists.leaderInfoUpdating)}
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
          eyebrow={pickText(locale, pageContent.finalists.emergingHeader.eyebrow)}
          title={pickText(locale, pageContent.finalists.emergingHeader.title)}
          description={pickText(locale, pageContent.finalists.emergingHeader.description)}
        />

        {round2Results.released ? (
          <GuidancePanel
            locale={locale}
            panel={pageContent.finalists.emergingGuidance}
            organizerEmail={pageContent.contact.officialEmailValue}
          />
        ) : null}

        <Surface className="overflow-hidden px-0 py-0">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b theme-border bg-[rgba(244,249,255,0.88)] dark:bg-white/[0.04]">
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.22em] theme-eyebrow">#</th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.22em] theme-eyebrow">
                    {pickText(locale, pageContent.finalists.teamColumnLabel)}
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.22em] theme-eyebrow">
                    {pickText(locale, pageContent.finalists.leaderColumnLabel)}
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.22em] theme-eyebrow">
                    {pickText(locale, pageContent.finalists.keywordColumnLabel)}
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.22em] theme-eyebrow">
                    {pickText(locale, pageContent.finalists.recognitionColumnLabel)}
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
                              {pickText(locale, pageContent.finalists.emergingTeamSlotLabel)}
                            </p>
                            <p className="text-xs theme-text-soft">
                              {pickText(locale, pageContent.finalists.awaitingOfficialUpdate)}
                            </p>
                          </td>
                          <td className="px-5 py-4 text-sm theme-text-soft">--</td>
                          <td className="px-5 py-4 text-sm theme-text-soft">--</td>
                          <td className="px-5 py-4">
                            <StatusPill tone="default">
                              {pickText(locale, pageContent.finalists.reservedLabel)}
                            </StatusPill>
                          </td>
                        </tr>
                      );
                    }

                    const isCurrentTeam = currentTeam?.id === team.id;

                    return (
                      <tr
                        key={team.id}
                        className={`border-b theme-border last:border-b-0 ${isCurrentTeam ? "bg-sky-500/6 dark:bg-sky-300/[0.06]" : ""}`}
                      >
                        <td className="px-5 py-4 font-semibold theme-text-strong">{String(index + 1).padStart(2, "0")}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <TeamRectangleAvatar
                              label={team.name}
                              tone={team.avatarTone}
                              imageSrc={team.avatarImageSrc}
                              className="h-11 w-11"
                            />
                            <div className="min-w-0">
                              <p className="font-semibold theme-text-strong">{team.name}</p>
                              <p className="text-xs theme-text-soft">{`#${team.tag}`}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-medium theme-text-body">{team.leaderName || "--"}</p>
                          <p className="mt-1 text-xs theme-text-soft">{team.leaderUniversity || "--"}</p>
                        </td>
                        <td className="px-5 py-4 text-sm leading-7 theme-text-body">{team.track}</td>
                        <td className="px-5 py-4">
                          <StatusPill tone="warning">
                            {pickText(locale, pageContent.finalists.emergingTeamLabel)}
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
