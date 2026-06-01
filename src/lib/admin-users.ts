import {
  getTeamCompetitionState,
  pickCompetitionStateLabel,
  pickTeamDisplayStatusLabel,
  pickTeamDisplayStatusTone,
} from "@/lib/competition";
import type { Locale, TeamProfile, TimelineItem, UserProfile } from "@/types/site";

export function pickAdminUserRoleLabel(locale: Locale, role: UserProfile["role"]) {
  switch (role) {
    case "admin":
      return locale === "en" ? "Administrator" : "Quản trị viên";
    case "judge":
      return locale === "en" ? "Judge" : "Giám khảo";
    case "moderator":
      return locale === "en" ? "Moderator" : "Điều phối viên";
    case "supporter":
      return locale === "en" ? "Supporter" : "Supporter";
    case "student":
    default:
      return locale === "en" ? "Participant" : "Thí sinh";
  }
}

export function pickAdminUserEmailVerificationLabel(locale: Locale, verified: boolean) {
  return verified
    ? locale === "en"
      ? "Verified"
      : "Đã kích hoạt"
    : locale === "en"
      ? "Not verified"
      : "Chưa kích hoạt";
}

export function pickAdminUserEmailVerificationTone(verified: boolean) {
  return verified ? ("success" as const) : ("warning" as const);
}

export function getAdminUserCompetitionStatus(
  locale: Locale,
  user: UserProfile,
  team?: TeamProfile,
  timelineItems?: TimelineItem[],
): {
  key: string;
  label: string;
  tone: "default" | "success" | "warning" | "info";
} {
  if (user.role === "admin") {
    return {
      key: "admin",
      label: locale === "en" ? "Administration" : "Điều hành hệ thống",
      tone: "default",
    };
  }

  if (user.role === "moderator") {
    return {
      key: "moderator",
      label: locale === "en" ? "Moderation" : "Điều phối vận hành",
      tone: "default",
    };
  }

  if (user.role === "supporter") {
    return {
      key: "supporter",
      label: locale === "en" ? "Registration support" : "Hỗ trợ đăng ký",
      tone: "default",
    };
  }

  if (user.role === "judge") {
    return {
      key: "judge",
      label: locale === "en" ? "Judge review" : "Giám khảo chấm điểm",
      tone: "default",
    };
  }

  if (!team) {
    return {
      key: "stopped",
      label: locale === "en" ? "Stopped before Round 1" : "Dừng trước Vòng 1",
      tone: "warning",
    };
  }

  const competitionState = getTeamCompetitionState(team);
  return {
    key: team.round2Advancement ?? competitionState,
    label:
      competitionState === "not-eligible"
        ? pickCompetitionStateLabel(locale, competitionState)
        : pickTeamDisplayStatusLabel(locale, team, new Date(), timelineItems),
    tone: pickTeamDisplayStatusTone(team, new Date(), timelineItems),
  };
}
