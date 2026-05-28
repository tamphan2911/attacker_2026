import type { Locale, LocalizedText, TeamProfile, TeamInvitation } from "@/types/site";
import { formatTimelineDateRangeLabel } from "@/lib/timeline-dates";

export function pickText(locale: Locale, value: LocalizedText): string {
  return value[locale];
}

export function normalizeLocalizedText(value: LocalizedText | string | null | undefined): LocalizedText {
  if (typeof value === "string") {
    return { en: value, vi: value };
  }

  return {
    en: value?.en ?? "",
    vi: value?.vi ?? value?.en ?? "",
  };
}

export function pickLocalizedText(locale: Locale, value: LocalizedText | string | null | undefined): string {
  return pickText(locale, normalizeLocalizedText(value));
}

export function formatDateLabel(locale: Locale, value: string): string {
  return new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function formatDateRangeLabel(
  locale: Locale,
  startDate: string,
  endDate: string,
  startTime?: string,
  endTime?: string,
): string {
  return formatTimelineDateRangeLabel(locale, startDate, endDate, startTime, endTime);
}

export function initials(value: string): string {
  return value
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function getTeamForUser(userId: string, teams: TeamProfile[]): TeamProfile | undefined {
  return teams.find((team) => team.memberIds.includes(userId));
}

export function getPendingInvitesForTeam(
  teamId: string,
  invitations: TeamInvitation[],
): TeamInvitation[] {
  return invitations.filter((invitation) => invitation.teamId === teamId && invitation.status === "pending");
}

export function getPendingInvitesForUser(
  userId: string,
  invitations: TeamInvitation[],
): TeamInvitation[] {
  return invitations.filter((invitation) => invitation.toUserId === userId && invitation.status === "pending");
}
