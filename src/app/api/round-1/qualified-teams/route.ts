import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import {
  ROUND1_RESULT_ANNOUNCEMENT_TIMELINE_ID,
  canApplyRound1Qualification,
  isRound1ResultAnnouncementReleased,
} from "@/lib/competition";
import {
  ROUND1_ESSAY_MAX_SCORE,
  ROUND1_OBJECTIVE_MAX_SCORE,
  ROUND1_TOTAL_MAX_SCORE,
} from "@/lib/round1";
import { getCurrentDbUser, hasElevatedRole } from "@/server/auth-helpers";
import {
  ROUND1_QUALIFIED_TEAM_LIMIT,
  syncRound1QualificationStages,
} from "@/server/round1-qualification";
import { readTimelineItems } from "@/server/timeline-items";

function average(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((total, value) => total + value, 0) / values.length;
}

export async function GET() {
  const [timelineItems, currentUser] = await Promise.all([readTimelineItems(), getCurrentDbUser()]);
  const announcementItem = timelineItems.find((item) => item.id === ROUND1_RESULT_ANNOUNCEMENT_TIMELINE_ID);
  const released = isRound1ResultAnnouncementReleased(timelineItems);
  const canPreviewBeforeRelease = currentUser ? hasElevatedRole(currentUser.role) : false;

  if (!released && !canPreviewBeforeRelease) {
    return NextResponse.json(
      {
        released: false,
        adminPreview: false,
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

  if (canApplyRound1Qualification(timelineItems)) {
    await syncRound1QualificationStages({ timelineItems });
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
          include: {
            user: {
              select: {
                id: true,
                name: true,
                university: true,
                avatarTone: true,
                avatarImageSrc: true,
              },
            },
          },
          orderBy: { joinedAt: "asc" },
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

  const qualifiedTeams = teams
    .map((team) => {
      const teamSubmissions = submissionsByTeamId.get(team.id) ?? [];
      const scoredSubmissions = teamSubmissions.filter(
        (submission) => submission.essayScore != null && submission.totalScore != null,
      );

      return {
        team,
        completedMembers: teamSubmissions.length,
        scoredMembers: scoredSubmissions.length,
        averageObjectiveScore: average(scoredSubmissions.map((submission) => submission.objectiveScore)),
        averageEssayScore: average(scoredSubmissions.map((submission) => submission.essayScore ?? 0)),
        averageTotalScore: average(scoredSubmissions.map((submission) => submission.totalScore ?? 0)),
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
    .slice(0, ROUND1_QUALIFIED_TEAM_LIMIT)
    .sort((left, right) => left.team.name.localeCompare(right.team.name))
    .map((group) => ({
      teamId: group.team.id,
      teamName: group.team.name,
      teamTag: group.team.tag,
      track: group.team.track,
      avatarTone: group.team.avatarTone,
      avatarImageSrc: group.team.avatarImageSrc,
      memberCount: group.team.members.length,
      leaderName: group.team.leader.name,
      leaderUniversity: group.team.leader.university,
      members: group.team.members
        .map((member) => ({
          userId: member.user.id,
          name: member.user.name,
          university: member.user.university,
          avatarTone: member.user.avatarTone,
          avatarImageSrc: member.user.avatarImageSrc,
          isLeader: member.user.id === group.team.leaderId,
        }))
        .sort((left, right) => {
          if (left.isLeader !== right.isLeader) {
            return left.isLeader ? -1 : 1;
          }

          return left.name.localeCompare(right.name);
        }),
      completedMembers: group.completedMembers,
      scoredMembers: group.scoredMembers,
      averageObjectiveScore: Number(group.averageObjectiveScore.toFixed(2)),
      averageEssayScore: Number(group.averageEssayScore.toFixed(2)),
      averageTotalScore: Number(group.averageTotalScore.toFixed(2)),
    }));

  return NextResponse.json(
    {
      released: true,
      adminPreview: !released && canPreviewBeforeRelease,
      announcementStartDate: announcementItem?.startDate,
      announcementEndDate: announcementItem?.endDate,
      qualifiedTeams,
      maxScores: {
        objective: ROUND1_OBJECTIVE_MAX_SCORE,
        essay: ROUND1_ESSAY_MAX_SCORE,
        total: ROUND1_TOTAL_MAX_SCORE,
      },
    },
    { status: 200 },
  );
}
