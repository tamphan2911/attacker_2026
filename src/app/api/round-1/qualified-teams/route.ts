import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import {
  ROUND1_ESSAY_MAX_SCORE,
  ROUND1_OBJECTIVE_MAX_SCORE,
  ROUND1_TOTAL_MAX_SCORE,
} from "@/lib/round1";
import { readTimelineItems } from "@/server/timeline-items";

const QUALIFIED_TEAM_LIMIT = 50;
const ROUND1_ANNOUNCEMENT_ID = "round-1-top-50-announcement";

function startOfVietnamDay(value: string) {
  return new Date(`${value}T00:00:00.000+07:00`);
}

function average(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((total, value) => total + value, 0) / values.length;
}

export async function GET() {
  const timelineItems = await readTimelineItems();
  const announcementItem = timelineItems.find((item) => item.id === ROUND1_ANNOUNCEMENT_ID);
  const announcementAt = announcementItem?.startDate
    ? startOfVietnamDay(announcementItem.startDate)
    : new Date(0);
  const released = Date.now() >= announcementAt.getTime();

  if (!released) {
    return NextResponse.json(
      {
        released: false,
        announcementStartDate: announcementItem?.startDate,
        announcementEndDate: announcementItem?.endDate,
        qualifiedTeams: [],
        maxScores: {
          objective: ROUND1_OBJECTIVE_MAX_SCORE,
          essay: ROUND1_ESSAY_MAX_SCORE,
          total: ROUND1_TOTAL_MAX_SCORE,
        },
      },
      { status: 200 },
    );
  }

  const [teams, submissions] = await Promise.all([
    prisma.team.findMany({
      include: {
        leader: {
          select: {
            name: true,
            university: true,
          },
        },
        members: {
          select: {
            userId: true,
          },
        },
      },
      orderBy: [{ createdAt: "asc" }],
    }),
    prisma.round1Submission.findMany({
      orderBy: [{ submittedAt: "desc" }],
    }),
  ]);

  const submissionsByTeamId = new Map<string, typeof submissions>();
  for (const submission of submissions) {
    const current = submissionsByTeamId.get(submission.teamId) ?? [];
    current.push(submission);
    submissionsByTeamId.set(submission.teamId, current);
  }

  const rankedTeams = teams
    .map((team) => {
      const teamSubmissions = submissionsByTeamId.get(team.id) ?? [];
      const scoredSubmissions = teamSubmissions.filter(
        (submission) => submission.essayScore != null && submission.totalScore != null,
      );
      const latestSubmittedAt = teamSubmissions[0]?.submittedAt;

      return {
        team,
        completedMembers: teamSubmissions.length,
        scoredMembers: scoredSubmissions.length,
        averageObjectiveScore: average(scoredSubmissions.map((submission) => submission.objectiveScore)),
        averageEssayScore: average(scoredSubmissions.map((submission) => submission.essayScore ?? 0)),
        averageTotalScore: average(scoredSubmissions.map((submission) => submission.totalScore ?? 0)),
        latestSubmittedAt,
      };
    })
    .filter((group) => group.scoredMembers > 0)
    .sort(
      (left, right) =>
        right.averageTotalScore - left.averageTotalScore ||
        right.averageObjectiveScore - left.averageObjectiveScore ||
        right.completedMembers - left.completedMembers ||
        left.team.name.localeCompare(right.team.name),
    )
    .slice(0, QUALIFIED_TEAM_LIMIT)
    .map((group, index) => ({
      rank: index + 1,
      teamId: group.team.id,
      teamName: group.team.name,
      teamTag: group.team.tag,
      track: group.team.track,
      avatarTone: group.team.avatarTone,
      avatarImageSrc: group.team.avatarImageSrc,
      memberCount: group.team.members.length,
      leaderName: group.team.leader.name,
      leaderUniversity: group.team.leader.university,
      completedMembers: group.completedMembers,
      scoredMembers: group.scoredMembers,
      averageObjectiveScore: Number(group.averageObjectiveScore.toFixed(2)),
      averageEssayScore: Number(group.averageEssayScore.toFixed(2)),
      averageTotalScore: Number(group.averageTotalScore.toFixed(2)),
      latestSubmittedAt: group.latestSubmittedAt?.toISOString(),
    }));

  return NextResponse.json(
    {
      released: true,
      announcementStartDate: announcementItem?.startDate,
      announcementEndDate: announcementItem?.endDate,
      qualifiedTeams: rankedTeams,
      maxScores: {
        objective: ROUND1_OBJECTIVE_MAX_SCORE,
        essay: ROUND1_ESSAY_MAX_SCORE,
        total: ROUND1_TOTAL_MAX_SCORE,
      },
    },
    { status: 200 },
  );
}
