import { CompetitionStage } from "@prisma/client";

import { canApplyRound1Qualification } from "@/lib/competition";
import { prisma } from "@/lib/db";
import { ensureRound2TeamJudgeAssignments } from "@/server/round2-judge-assignment";
import { readTimelineItems } from "@/server/timeline-items";
import type { TimelineItem } from "@/types/site";

export const ROUND1_QUALIFIED_TEAM_LIMIT = 50;
const ROUND1_QUALIFICATION_SYNC_INTERVAL_MS = 2 * 60 * 1000;
let lastRound1QualificationSyncCheckAt = 0;

type Round1QualificationSyncOptions = {
  now?: Date;
  timelineItems?: TimelineItem[];
  force?: boolean;
};

function average(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((total, value) => total + value, 0) / values.length;
}

export async function readRound1QualifiedTeamIds(limit = ROUND1_QUALIFIED_TEAM_LIMIT) {
  const [teams, submissions] = await Promise.all([
    prisma.team.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: [{ createdAt: "asc" }],
    }),
    prisma.round1Submission.findMany({
      select: {
        teamId: true,
        objectiveScore: true,
        essayScore: true,
        totalScore: true,
        submittedAt: true,
      },
      orderBy: [{ submittedAt: "desc" }],
    }),
  ]);

  const submissionsByTeamId = new Map<string, typeof submissions>();
  for (const submission of submissions) {
    const current = submissionsByTeamId.get(submission.teamId) ?? [];
    current.push(submission);
    submissionsByTeamId.set(submission.teamId, current);
  }

  return teams
    .map((team) => {
      const teamSubmissions = submissionsByTeamId.get(team.id) ?? [];
      const scoredSubmissions = teamSubmissions.filter(
        (submission) => submission.essayScore != null && submission.totalScore != null,
      );

      return {
        teamId: team.id,
        teamName: team.name,
        completedMembers: teamSubmissions.length,
        scoredMembers: scoredSubmissions.length,
        averageObjectiveScore: average(scoredSubmissions.map((submission) => submission.objectiveScore)),
        averageTotalScore: average(scoredSubmissions.map((submission) => submission.totalScore ?? 0)),
      };
    })
    .filter((group) => group.scoredMembers > 0)
    .sort(
      (left, right) =>
        right.averageTotalScore - left.averageTotalScore ||
        right.averageObjectiveScore - left.averageObjectiveScore ||
        right.completedMembers - left.completedMembers ||
        left.teamName.localeCompare(right.teamName),
    )
    .slice(0, limit)
    .map((group) => group.teamId);
}

export async function syncRound1QualificationStages(options: Round1QualificationSyncOptions = {}) {
  const now = options.now ?? new Date();
  const timelineItems = options.timelineItems ?? (await readTimelineItems());

  if (!canApplyRound1Qualification(timelineItems, now)) {
    return {
      applied: false,
      promotedCount: 0,
    };
  }

  if (
    !options.force &&
    now.getTime() - lastRound1QualificationSyncCheckAt < ROUND1_QUALIFICATION_SYNC_INTERVAL_MS
  ) {
    return {
      applied: true,
      promotedCount: 0,
    };
  }
  lastRound1QualificationSyncCheckAt = now.getTime();

  const qualifiedTeamIds = await readRound1QualifiedTeamIds();
  if (qualifiedTeamIds.length === 0) {
    return {
      applied: true,
      promotedCount: 0,
    };
  }

  const updateResult = await prisma.$transaction(async (tx) => {
    const promotedTeams = await tx.team.updateMany({
      where: {
        id: { in: qualifiedTeamIds },
        stage: CompetitionStage.ROUND_1,
      },
      data: {
        stage: CompetitionStage.ROUND_2,
      },
    });

    await ensureRound2TeamJudgeAssignments(tx, { teamIds: qualifiedTeamIds });

    return promotedTeams;
  });

  return {
    applied: true,
    promotedCount: updateResult.count,
  };
}
