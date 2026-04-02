import { competitionRoundWindows, TEAM_MIN_MEMBERS } from "@/data/site-content";
import type {
  CompetitionRoundKey,
  CompetitionStage,
  CompetitionState,
  Locale,
  SubmissionRound,
  TeamProfile,
} from "@/types/site";

const stageOrder: Record<CompetitionStage, number> = {
  "round-1": 1,
  "round-2": 2,
  "round-3": 3,
};

export function getCompetitionRoundWindow(round: CompetitionRoundKey) {
  return competitionRoundWindows.find((item) => item.round === round);
}

function endOfDay(value: string) {
  return new Date(`${value}T23:59:59.999`);
}

export function isRoundFinished(round: CompetitionRoundKey, now = new Date()) {
  const window = getCompetitionRoundWindow(round);
  if (!window) {
    return false;
  }

  return now.getTime() > endOfDay(window.endDate).getTime();
}

export function getTeamCompetitionState(team: TeamProfile): CompetitionState {
  if (team.stage === "round-1" && team.memberIds.length < TEAM_MIN_MEMBERS) {
    return "not-eligible";
  }

  return team.stage;
}

export function isTeamRound1Locked(team: TeamProfile) {
  return team.round1LockStatus === "locked";
}

export function isTeamRosterLocked(team: TeamProfile) {
  return team.stage !== "round-1" || team.round1LockStatus === "pending" || team.round1LockStatus === "locked";
}

export function isTeamCurrentlyCompetingRound(team: TeamProfile, round: CompetitionRoundKey) {
  return team.stage === round;
}

export function hasTeamPassedRound(team: TeamProfile, round: CompetitionRoundKey) {
  return stageOrder[team.stage] > stageOrder[round];
}

export function hasTeamReachedRound(team: TeamProfile, round: CompetitionRoundKey) {
  return stageOrder[team.stage] >= stageOrder[round];
}

export function canTeamTakeRound1(team: TeamProfile, now = new Date()) {
  return getTeamCompetitionState(team) === "round-1" && isTeamRound1Locked(team) && !isRoundFinished("round-1", now);
}

export function canTeamSubmitForRound(
  team: TeamProfile,
  round: SubmissionRound,
  now = new Date(),
) {
  return isTeamCurrentlyCompetingRound(team, round) && !isRoundFinished(round, now);
}

export function pickCompetitionStateLabel(locale: Locale, state: CompetitionState) {
  switch (state) {
    case "not-eligible":
      return locale === "en" ? "Not eligible for Round 1" : "Chưa đủ điều kiện Vòng 1";
    case "round-1":
      return locale === "en" ? "Currently in Round 1" : "Đang thi đấu Vòng 1";
    case "round-2":
      return locale === "en" ? "Currently in Round 2" : "Đang thi đấu Vòng 2";
    case "round-3":
      return locale === "en" ? "Currently in Round 3" : "Đang thi đấu Vòng 3";
  }
}

export function pickCompetitionStateDescription(locale: Locale, state: CompetitionState) {
  switch (state) {
    case "not-eligible":
      return locale === "en"
        ? "This team has not met the minimum 3-member requirement to enter Round 1 yet."
        : "Đội này chưa đạt mức tối thiểu 3 thành viên để vào Vòng 1.";
    case "round-1":
      return locale === "en"
        ? "This team is currently competing in the individual Round 1 qualifier."
        : "Đội này hiện đang thi đấu ở Vòng 1 theo hình thức cá nhân.";
    case "round-2":
      return locale === "en"
        ? "This team passed Round 1 and is currently competing in Round 2."
        : "Đội này đã qua Vòng 1 và hiện đang thi đấu ở Vòng 2.";
    case "round-3":
      return locale === "en"
        ? "This team passed Round 2 and is currently competing in the final round."
        : "Đội này đã qua Vòng 2 và hiện đang thi đấu ở vòng chung kết.";
  }
}

export function pickRoundLabel(locale: Locale, round: CompetitionRoundKey) {
  switch (round) {
    case "round-1":
      return locale === "en" ? "Round 1" : "Vòng 1";
    case "round-2":
      return locale === "en" ? "Round 2" : "Vòng 2";
    case "round-3":
      return locale === "en" ? "Round 3" : "Vòng 3";
  }
}

export function pickRound1LockStatusLabel(locale: Locale, status: TeamProfile["round1LockStatus"]) {
  switch (status) {
    case "open":
      return locale === "en" ? "Not locked" : "Chưa khóa đội";
    case "pending":
      return locale === "en" ? "Awaiting approvals" : "Đang chờ xác nhận";
    case "locked":
      return locale === "en" ? "Team locked" : "Đội đã khóa";
    case "declined":
      return locale === "en" ? "Lock declined" : "Khóa đội bị từ chối";
  }
}
