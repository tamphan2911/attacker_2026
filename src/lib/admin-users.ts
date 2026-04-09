import {
  getTeamCompetitionState,
  isRoundFinished,
  pickCompetitionStateLabel,
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
    case "student":
    default:
      return locale === "en" ? "Participant" : "Thí sinh";
  }
}

export function getAdminUserCompetitionStatus(
  locale: Locale,
  user: UserProfile,
  team?: TeamProfile,
  timelineItems?: TimelineItem[],
): {
  key: string;
  label: string;
  tone: "default" | "success" | "warning";
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

  if (team.stage === "round-3" && isRoundFinished("round-3", new Date(), timelineItems)) {
    return {
      key: "finished",
      label: locale === "en" ? "Finished" : "Hoàn thành",
      tone: "success",
    };
  }

  if (team.stage === "round-2" && isRoundFinished("round-2", new Date(), timelineItems)) {
    return {
      key: "stopped",
      label: locale === "en" ? "Stopped at Round 2" : "Dừng tại Vòng 2",
      tone: "warning",
    };
  }

  if (team.stage === "round-1" && isRoundFinished("round-1", new Date(), timelineItems)) {
    return {
      key: "stopped",
      label: locale === "en" ? "Stopped at Round 1" : "Dừng tại Vòng 1",
      tone: "warning",
    };
  }

  const competitionState = getTeamCompetitionState(team);
  if (competitionState === "not-eligible") {
    return {
      key: "stopped",
      label:
        locale === "en"
          ? "Stopped before Round 1 (not eligible)"
          : "Dừng trước Vòng 1 (chưa đủ điều kiện)",
      tone: "warning",
    };
  }

  return {
    key: competitionState,
    label: pickCompetitionStateLabel(locale, competitionState),
    tone: "success",
  };
}
