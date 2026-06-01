import { getTimelineItemById, isTimelineItemStarted } from "@/lib/competition";
import { prisma } from "@/lib/db";
import { readRound2FinalistResults } from "@/server/round2-finalists";
import { readTimelineItems } from "@/server/timeline-items";

const EMERGING_AWARDS_TIMELINE_ID = "round-3-emerging-awards-announcement";
const EMERGING_AWARD_COUNT = 10;

export interface Round3EmergingAwardTeam {
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
  finalScore: number;
  finalScoreUpdatedAt?: string;
  round2AverageScore: number;
}

export async function readRound3EmergingResults(now = new Date()) {
  const timelineItems = await readTimelineItems();
  const announcement = getTimelineItemById(EMERGING_AWARDS_TIMELINE_ID, timelineItems);
  const released = isTimelineItemStarted(EMERGING_AWARDS_TIMELINE_ID, timelineItems, now);

  if (!released) {
    return {
      released: false,
      announcementStartDate: announcement?.startDate,
      awardTeams: [] as Round3EmergingAwardTeam[],
    };
  }

  const round2Results = await readRound2FinalistResults(now);
  if (!round2Results.released || round2Results.emergingTeams.length === 0) {
    return {
      released: true,
      announcementStartDate: announcement?.startDate,
      awardTeams: [] as Round3EmergingAwardTeam[],
    };
  }

  const emergingTeamIds = round2Results.emergingTeams.map((team) => team.id);
  const teams = await prisma.team.findMany({
    where: {
      id: { in: emergingTeamIds },
      finalScore: { not: null },
    },
    select: {
      id: true,
      finalScore: true,
      finalScoreUpdatedAt: true,
    },
  });
  const finalScoreByTeamId = new Map(teams.map((team) => [team.id, team]));

  const awardTeams = round2Results.emergingTeams
    .flatMap<Round3EmergingAwardTeam>((team) => {
      const scoreRecord = finalScoreByTeamId.get(team.id);
      if (typeof scoreRecord?.finalScore !== "number") {
        return [];
      }

      return [{
        id: team.id,
        name: team.name,
        tag: team.tag,
        leaderId: team.leaderId,
        leaderName: team.leaderName,
        leaderUniversity: team.leaderUniversity,
        memberCount: team.memberCount,
        avatarTone: team.avatarTone,
        avatarImageSrc: team.avatarImageSrc,
        track: team.track,
        finalScore: scoreRecord.finalScore,
        finalScoreUpdatedAt: scoreRecord.finalScoreUpdatedAt?.toISOString(),
        round2AverageScore: team.averageScore,
      }];
    })
    .sort((left, right) => {
      if (left.finalScore !== right.finalScore) {
        return right.finalScore - left.finalScore;
      }

      return right.round2AverageScore - left.round2AverageScore;
    })
    .slice(0, EMERGING_AWARD_COUNT);

  return {
    released: true,
    announcementStartDate: announcement?.startDate,
    awardTeams,
  };
}
