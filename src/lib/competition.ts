import { competitionRoundWindows, TEAM_MIN_MEMBERS } from "@/data/site-content";
import {
  compareTimelineDateRanges,
  getTimelineEndDateTime,
  getTimelineStartDateTime,
} from "@/lib/timeline-dates";
import type {
  CompetitionRoundKey,
  CompetitionRoundWindow,
  CompetitionStage,
  CompetitionState,
  Locale,
  SubmissionRound,
  TeamFinalOutcome,
  TeamProfile,
  TimelineItem,
} from "@/types/site";

const stageOrder: Record<CompetitionStage, number> = {
  "round-1": 1,
  "round-2": 2,
  "round-3": 3,
};

const primaryRoundTimelineItemIds: Record<CompetitionRoundKey, string> = {
  "round-1": "round-1-individual-qualifier",
  "round-2": "round-2-report-submission",
  "round-3": "round-3-final-presentation",
};

export const ROUND1_RESULT_ANNOUNCEMENT_TIMELINE_ID = "round-1-top-50-announcement";
export const WEBSITE_ANNOUNCEMENT_TIMELINE_ID = "website-announcement";

function sortTimelineItemsByDate(items: TimelineItem[]) {
  return [...items].sort(compareTimelineDateRanges);
}

export function getTimelineItemById(itemId: string, timelineItems?: TimelineItem[]) {
  return timelineItems?.find((item) => item.id === itemId);
}

export function getCompetitionRoundPrimaryTimelineItem(
  round: CompetitionRoundKey,
  timelineItems?: TimelineItem[],
) {
  return getTimelineItemById(primaryRoundTimelineItemIds[round], timelineItems);
}

export function getCompetitionRoundWindow(
  round: CompetitionRoundKey,
  timelineItems?: TimelineItem[],
): CompetitionRoundWindow | undefined {
  const fallbackWindow = competitionRoundWindows.find((item) => item.round === round);
  if (!timelineItems?.length) {
    return fallbackWindow;
  }

  const phaseItems = sortTimelineItemsByDate(timelineItems.filter((item) => item.phase === round));
  if (!phaseItems.length) {
    return fallbackWindow;
  }

  return {
    round,
    title: fallbackWindow?.title ?? {
      en: round === "round-1" ? "Round 1" : round === "round-2" ? "Round 2" : "Final round",
      vi: round === "round-1" ? "Vòng 1" : round === "round-2" ? "Vòng 2" : "Chung kết",
    },
    startDate: phaseItems[0].startDate,
    endDate: phaseItems[phaseItems.length - 1].endDate,
    startTime: phaseItems[0].startTime,
    endTime: phaseItems[phaseItems.length - 1].endTime,
  };
}

function getSubmissionDeadlineItemId(round: SubmissionRound) {
  return round === "round-3" ? "round-3-final-report-submission" : "round-2-report-submission";
}

export function getSubmissionDeadlineTimelineItem(
  round: SubmissionRound,
  timelineItems?: TimelineItem[],
) {
  if (!timelineItems?.length) {
    return undefined;
  }

  return timelineItems.find((item) => item.id === getSubmissionDeadlineItemId(round));
}

export function isTimelineItemFinished(
  itemId: string,
  timelineItems?: TimelineItem[],
  now = new Date(),
) {
  const item = getTimelineItemById(itemId, timelineItems);
  if (!item) {
    return false;
  }

  return now.getTime() > getTimelineEndDateTime(item).getTime();
}

export function isTimelineItemStarted(
  itemId: string,
  timelineItems?: TimelineItem[],
  now = new Date(),
) {
  const item = getTimelineItemById(itemId, timelineItems);
  if (!item) {
    return false;
  }

  return now.getTime() >= getTimelineStartDateTime(item).getTime();
}

export function isRound1ResultAnnouncementReleased(timelineItems?: TimelineItem[], now = new Date()) {
  return isTimelineItemStarted(ROUND1_RESULT_ANNOUNCEMENT_TIMELINE_ID, timelineItems, now);
}

export function isWebsiteAnnouncementReleased(timelineItems?: TimelineItem[], now = new Date()) {
  return isTimelineItemStarted(WEBSITE_ANNOUNCEMENT_TIMELINE_ID, timelineItems, now);
}

export function isRound2Started(timelineItems?: TimelineItem[], now = new Date()) {
  const round2Item = getCompetitionRoundPrimaryTimelineItem("round-2", timelineItems);
  if (round2Item) {
    return now.getTime() >= getTimelineStartDateTime(round2Item).getTime();
  }

  const round2Window = getCompetitionRoundWindow("round-2", timelineItems);
  if (!round2Window) {
    return false;
  }

  return now.getTime() >= getTimelineStartDateTime(round2Window).getTime();
}

export function canApplyRound1Qualification(timelineItems?: TimelineItem[], now = new Date()) {
  return isRound1ResultAnnouncementReleased(timelineItems, now) && isRound2Started(timelineItems, now);
}

export function isRoundFinished(
  round: CompetitionRoundKey,
  now = new Date(),
  timelineItems?: TimelineItem[],
) {
  const window = getCompetitionRoundWindow(round, timelineItems);
  if (!window) {
    return false;
  }

  return now.getTime() > getTimelineEndDateTime(window).getTime();
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

export function canTeamTakeRound1(
  team: TeamProfile,
  now = new Date(),
  timelineItems?: TimelineItem[],
) {
  const round1Closed = getCompetitionRoundPrimaryTimelineItem("round-1", timelineItems)
    ? isTimelineItemFinished("round-1-individual-qualifier", timelineItems, now)
    : isRoundFinished("round-1", now, timelineItems);

  return getTeamCompetitionState(team) === "round-1" && isTeamRound1Locked(team) && !round1Closed;
}

export function canTeamSubmitForRound(
  team: TeamProfile,
  round: SubmissionRound,
  now = new Date(),
  timelineItems?: TimelineItem[],
) {
  const submissionDeadlineItem = getSubmissionDeadlineTimelineItem(round, timelineItems);
  const isSubmissionWindowClosed = submissionDeadlineItem
    ? now.getTime() > getTimelineEndDateTime(submissionDeadlineItem).getTime()
    : isRoundFinished(round, now, timelineItems);

  return isTeamCurrentlyCompetingRound(team, round) && !isSubmissionWindowClosed;
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
      return locale === "en" ? "Currently in Final round" : "Đang thi đấu chung kết";
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

export function pickTeamFinalOutcomeLabel(locale: Locale, outcome: TeamFinalOutcome) {
  switch (outcome) {
    case "champion":
      return locale === "en" ? "Champion" : "Quán quân";
    case "runner-up":
      return locale === "en" ? "Runner-up" : "Á quân";
    case "third-place":
      return locale === "en" ? "Third place" : "Quý quân";
    case "fourth-place":
      return locale === "en" ? "4th place" : "Hạng 4";
    case "emerging-team":
      return locale === "en" ? "Emerging Team" : "Đội ươm mầm";
  }
}

function canShowTeamFinalOutcome(team: TeamProfile, now = new Date(), timelineItems?: TimelineItem[]) {
  if (!team.finalOutcome) {
    return false;
  }

  if (team.finalOutcome === "emerging-team") {
    return isRoundFinished("round-2", now, timelineItems) || isRoundFinished("round-3", now, timelineItems);
  }

  return isRoundFinished("round-3", now, timelineItems);
}

function isEmergingAwardAnnouncementReleased(now = new Date(), timelineItems?: TimelineItem[]) {
  return isTimelineItemStarted("round-3-emerging-awards-announcement", timelineItems, now);
}

function pickRound2AdvancementStatusLabel(locale: Locale, team: TeamProfile, now = new Date(), timelineItems?: TimelineItem[]) {
  if (team.round2Advancement === "finalist") {
    if (isRoundFinished("round-3", now, timelineItems)) {
      return locale === "en" ? "Stop at Final round" : "Dừng chân tại chung kết";
    }

    return locale === "en" ? "Finalist" : "Đội chung kết";
  }

  if (team.round2Advancement === "emerging") {
    if (isEmergingAwardAnnouncementReleased(now, timelineItems) || isRoundFinished("round-3", now, timelineItems)) {
      return locale === "en" ? "Stopped at Emerging round" : "Dừng chân tại vòng Ươm mầm";
    }

    return locale === "en" ? "Emerging round" : "Vòng Đội Ươm mầm";
  }

  return undefined;
}

function pickRound2AdvancementStatusDescription(locale: Locale, team: TeamProfile, now = new Date(), timelineItems?: TimelineItem[]) {
  if (team.round2Advancement === "finalist") {
    if (isRoundFinished("round-3", now, timelineItems)) {
      return locale === "en"
        ? "This team advanced from Round 2 to the final round and stopped there."
        : "Đội này đã vượt qua Vòng 2 để vào chung kết và dừng chân tại đó.";
    }

    return locale === "en"
      ? "This team advanced from Round 2 and is competing as a finalist."
      : "Đội này đã vượt qua Vòng 2 và đang thi đấu ở nhóm chung kết.";
  }

  if (team.round2Advancement === "emerging") {
    if (isEmergingAwardAnnouncementReleased(now, timelineItems) || isRoundFinished("round-3", now, timelineItems)) {
      return locale === "en"
        ? "This team advanced from Round 2 to the Emerging round and stopped there."
        : "Đội này đã vượt qua Vòng 2 vào vòng Ươm mầm và dừng chân tại đó.";
    }

    return locale === "en"
      ? "This team advanced from Round 2 and is competing in the Emerging round."
      : "Đội này đã vượt qua Vòng 2 và đang thi đấu ở Vòng Đội Ươm mầm.";
  }

  return undefined;
}

export function pickTeamDisplayStatusLabel(
  locale: Locale,
  team: TeamProfile,
  now = new Date(),
  timelineItems?: TimelineItem[],
) {
  const competitionState = getTeamCompetitionState(team);
  if (competitionState === "not-eligible") {
    return pickCompetitionStateLabel(locale, competitionState);
  }

  if (canShowTeamFinalOutcome(team, now, timelineItems) && team.finalOutcome) {
    return pickTeamFinalOutcomeLabel(locale, team.finalOutcome);
  }

  const advancementStatusLabel = pickRound2AdvancementStatusLabel(locale, team, now, timelineItems);
  if (advancementStatusLabel) {
    return advancementStatusLabel;
  }

  if (team.stage === "round-3" && isRoundFinished("round-3", now, timelineItems)) {
    return locale === "en" ? "Stop at Final round" : "Dừng chân tại chung kết";
  }

  if (team.stage === "round-2" && isRoundFinished("round-2", now, timelineItems)) {
    return locale === "en" ? "Stop at Round 2" : "Dừng chân tại Vòng 2";
  }

  if (team.stage === "round-1" && isRoundFinished("round-1", now, timelineItems)) {
    return locale === "en" ? "Stop at Round 1" : "Dừng chân tại Vòng 1";
  }

  return pickCompetitionStateLabel(locale, competitionState);
}

export function pickTeamDisplayStatusDescription(
  locale: Locale,
  team: TeamProfile,
  now = new Date(),
  timelineItems?: TimelineItem[],
) {
  const competitionState = getTeamCompetitionState(team);
  if (competitionState === "not-eligible") {
    return pickCompetitionStateDescription(locale, competitionState);
  }

  if (canShowTeamFinalOutcome(team, now, timelineItems) && team.finalOutcome) {
    switch (team.finalOutcome) {
      case "champion":
        return locale === "en"
          ? "This team finished the season as the overall champion."
          : "Đội này khép lại mùa giải với danh hiệu quán quân.";
      case "runner-up":
        return locale === "en"
          ? "This team finished the season as the runner-up."
          : "Đội này khép lại mùa giải với danh hiệu á quân.";
      case "third-place":
        return locale === "en"
          ? "This team finished the season in third place."
          : "Đội này khép lại mùa giải với vị trí quý quân.";
      case "fourth-place":
        return locale === "en"
          ? "This team finished the season in fourth place."
          : "Đội này khép lại mùa giải với vị trí hạng 4.";
      case "emerging-team":
        return locale === "en"
          ? "This team completed the season as an Emerging Team after Round 2."
          : "Đội này khép lại mùa giải với danh hiệu Đội ươm mầm sau Vòng 2.";
      }
  }

  const advancementStatusDescription = pickRound2AdvancementStatusDescription(locale, team, now, timelineItems);
  if (advancementStatusDescription) {
    return advancementStatusDescription;
  }

  if (team.stage === "round-3" && isRoundFinished("round-3", now, timelineItems)) {
    return locale === "en"
      ? "This team reached the final round and stopped there."
      : "Đội này đã vào vòng chung kết và dừng chân tại đó.";
  }

  if (team.stage === "round-2" && isRoundFinished("round-2", now, timelineItems)) {
    return locale === "en"
      ? "This team reached Round 2 and stopped there."
      : "Đội này đã vào Vòng 2 và dừng chân tại đó.";
  }

  if (team.stage === "round-1" && isRoundFinished("round-1", now, timelineItems)) {
    return locale === "en"
      ? "This team completed Round 1 and stopped there."
      : "Đội này đã hoàn thành Vòng 1 và dừng chân tại đó.";
  }

  return pickCompetitionStateDescription(locale, competitionState);
}

export function pickTeamDisplayStatusTone(
  team: TeamProfile,
  now = new Date(),
  timelineItems?: TimelineItem[],
) {
  const competitionState = getTeamCompetitionState(team);
  if (competitionState === "not-eligible") {
    return "warning" as const;
  }

  if (canShowTeamFinalOutcome(team, now, timelineItems) && team.finalOutcome) {
    return "success" as const;
  }

  if (team.round2Advancement) {
    if (
      (team.round2Advancement === "finalist" && isRoundFinished("round-3", now, timelineItems)) ||
      (team.round2Advancement === "emerging" &&
        (isEmergingAwardAnnouncementReleased(now, timelineItems) || isRoundFinished("round-3", now, timelineItems)))
    ) {
      return "warning" as const;
    }

    return "info" as const;
  }

  if (
    (team.stage === "round-1" && isRoundFinished("round-1", now, timelineItems)) ||
    (team.stage === "round-2" && isRoundFinished("round-2", now, timelineItems)) ||
    (team.stage === "round-3" && isRoundFinished("round-3", now, timelineItems))
  ) {
    return "warning" as const;
  }

  return "info" as const;
}

export function pickRoundLabel(locale: Locale, round: CompetitionRoundKey) {
  switch (round) {
    case "round-1":
      return locale === "en" ? "Round 1" : "Vòng 1";
    case "round-2":
      return locale === "en" ? "Round 2" : "Vòng 2";
    case "round-3":
      return locale === "en" ? "Final round" : "Chung kết";
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
