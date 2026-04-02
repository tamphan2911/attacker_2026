import type { Locale, LocalizedText, TeamProfile, TeamInvitation } from "@/types/site";

export function pickText(locale: Locale, value: LocalizedText): string {
  return value[locale];
}

export function formatDateLabel(locale: Locale, value: string): string {
  return new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function formatDateRangeLabel(locale: Locale, startDate: string, endDate: string): string {
  const formattedStart = formatDateLabel(locale, startDate);
  const formattedEnd = formatDateLabel(locale, endDate);

  if (startDate === endDate) {
    return formattedStart;
  }

  return `${formattedStart} - ${formattedEnd}`;
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
