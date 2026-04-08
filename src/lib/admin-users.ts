import {
  getTeamCompetitionState,
  isRoundFinished,
  pickCompetitionStateLabel,
} from "@/lib/competition";
import type { Locale, TeamProfile, UserProfile } from "@/types/site";

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
      label: locale === "en" ? "Stopped" : "Dừng",
      tone: "warning",
    };
  }

  if (team.stage === "round-3" && isRoundFinished("round-3")) {
    return {
      key: "finished",
      label: locale === "en" ? "Finished" : "Hoàn thành",
      tone: "success",
    };
  }

  if (team.stage === "round-2" && isRoundFinished("round-2")) {
    return {
      key: "stopped",
      label: locale === "en" ? "Stopped after Round 2" : "Dừng sau Vòng 2",
      tone: "warning",
    };
  }

  if (team.stage === "round-1" && isRoundFinished("round-1")) {
    return {
      key: "stopped",
      label: locale === "en" ? "Stopped after Round 1" : "Dừng sau Vòng 1",
      tone: "warning",
    };
  }

  const competitionState = getTeamCompetitionState(team);
  if (competitionState === "not-eligible") {
    return {
      key: "stopped",
      label:
        locale === "en"
          ? "Stopped (not eligible)"
          : "Dừng (chưa đủ điều kiện)",
      tone: "warning",
    };
  }

  return {
    key: competitionState,
    label: pickCompetitionStateLabel(locale, competitionState),
    tone: "success",
  };
}
