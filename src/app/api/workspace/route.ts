import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";

import { prisma } from "@/lib/db";
import { isRound1ResultAnnouncementReleased } from "@/lib/competition";
import { getCurrentDbUser, hasElevatedRole } from "@/server/auth-helpers";
import {
  serializeInvitation,
  serializeLeadershipTransferRequest,
  serializeRound1LockRequest,
  serializeRound1Submission,
  serializeTeam,
  serializeTeamSubmission,
  serializeUser,
} from "@/server/site-serializers";
import { ensureRound1SubmissionArchives } from "@/server/round1-submission-archive";
import { syncRound1QualificationStages } from "@/server/round1-qualification";
import { attachRound2AdvancementToTeams } from "@/server/team-advancement";
import { getRound1ExamState } from "@/server/team-service";
import { readTimelineItems } from "@/server/timeline-items";

function addIfPresent(target: Set<string>, value: string | null | undefined) {
  if (value) {
    target.add(value);
  }
}

export async function GET() {
  const currentDbUser = await getCurrentDbUser();
  if (!currentDbUser) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  if (currentDbUser.role === UserRole.STUDENT) {
    await getRound1ExamState(currentDbUser.id);
  }

  await syncRound1QualificationStages();

  const membership = await prisma.teamMember.findUnique({
    where: { userId: currentDbUser.id },
    select: { teamId: true },
  });
  const currentTeamId = membership?.teamId;
  const elevated = hasElevatedRole(currentDbUser.role);
  const timelineItems = await readTimelineItems();
  const revealRound1EssayAndTotalScores =
    elevated || isRound1ResultAnnouncementReleased(timelineItems, new Date());

  if (!elevated) {
    const [invitations, leadershipTransferRequests, teamLockRequests, round1Submissions, teamSubmissions] =
      await Promise.all([
        prisma.teamInvitation.findMany({
          where: {
            OR: [
              { toUserId: currentDbUser.id },
              { fromUserId: currentDbUser.id },
              ...(currentTeamId ? [{ teamId: currentTeamId }] : []),
            ],
          },
          orderBy: { createdAt: "desc" },
        }),
        prisma.leadershipTransferRequest.findMany({
          where: {
            OR: [
              { toUserId: currentDbUser.id },
              { fromUserId: currentDbUser.id },
              ...(currentTeamId ? [{ teamId: currentTeamId }] : []),
            ],
          },
          orderBy: { createdAt: "desc" },
        }),
        prisma.round1TeamLockRequest.findMany({
          where: {
            OR: [
              { toUserId: currentDbUser.id },
              { fromUserId: currentDbUser.id },
              ...(currentTeamId ? [{ teamId: currentTeamId }] : []),
            ],
          },
          orderBy: { createdAt: "desc" },
        }),
        prisma.round1Submission.findMany({
          where: {
            OR: [
              { userId: currentDbUser.id },
              ...(currentTeamId ? [{ teamId: currentTeamId }] : []),
            ],
          },
          include: {
            judgeReviews: {
              orderBy: [{ createdAt: "asc" }],
              include: {
                judgeUser: {
                  select: {
                    name: true,
                    loginId: true,
                  },
                },
              },
            },
          },
          orderBy: { submittedAt: "desc" },
        }),
        currentTeamId
          ? prisma.teamSubmission.findMany({
              where: { teamId: currentTeamId },
              orderBy: [{ submittedAt: "desc" }],
            })
          : Promise.resolve([]),
      ]);

    const teamIds = new Set<string>();
    addIfPresent(teamIds, currentTeamId);
    for (const invitation of invitations) {
      addIfPresent(teamIds, invitation.teamId);
    }
    for (const request of leadershipTransferRequests) {
      addIfPresent(teamIds, request.teamId);
    }
    for (const request of teamLockRequests) {
      addIfPresent(teamIds, request.teamId);
    }
    for (const submission of round1Submissions) {
      addIfPresent(teamIds, submission.teamId);
    }
    for (const submission of teamSubmissions) {
      addIfPresent(teamIds, submission.teamId);
    }

    const teams = teamIds.size
      ? await prisma.team.findMany({
          where: { id: { in: Array.from(teamIds) } },
          include: {
            members: {
              select: { userId: true },
            },
          },
          orderBy: { createdAt: "asc" },
        })
      : [];

    const userIds = new Set<string>([currentDbUser.id]);
    for (const invitation of invitations) {
      addIfPresent(userIds, invitation.fromUserId);
      addIfPresent(userIds, invitation.toUserId);
    }
    for (const request of leadershipTransferRequests) {
      addIfPresent(userIds, request.fromUserId);
      addIfPresent(userIds, request.toUserId);
    }
    for (const request of teamLockRequests) {
      addIfPresent(userIds, request.fromUserId);
      addIfPresent(userIds, request.toUserId);
    }
    for (const submission of round1Submissions) {
      addIfPresent(userIds, submission.userId);
    }
    for (const submission of teamSubmissions) {
      addIfPresent(userIds, submission.submittedByUserId);
    }
    for (const team of teams) {
      addIfPresent(userIds, team.leaderId);
      addIfPresent(userIds, team.round1LockDeclinedByUserId);
      for (const member of team.members) {
        addIfPresent(userIds, member.userId);
      }
    }

    const users = await prisma.user.findMany({
      where: { id: { in: Array.from(userIds) } },
      include: {
        accounts: {
          select: { provider: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    if (round1Submissions.length > 0) {
      await ensureRound1SubmissionArchives(
        round1Submissions.map((submission) => ({
          id: submission.id,
          bankId: submission.bankId,
          answers: submission.answers,
          rightCount: submission.rightCount,
          essayScore: submission.essayScore,
        })),
      );
    }

    const serializedTeams = await attachRound2AdvancementToTeams(teams.map(serializeTeam));

    return NextResponse.json(
      {
        currentUserId: currentDbUser.id,
        users: users.map(serializeUser),
        teams: serializedTeams,
        invitations: invitations.map(serializeInvitation),
        leadershipTransferRequests: leadershipTransferRequests.map(serializeLeadershipTransferRequest),
        teamLockRequests: teamLockRequests.map(serializeRound1LockRequest),
        round1Submissions: round1Submissions.map((submission) =>
          serializeRound1Submission(submission, {
            revealEssayAndTotalScores: revealRound1EssayAndTotalScores,
          }),
        ),
        submissions: teamSubmissions.map(serializeTeamSubmission),
      },
      { status: 200 },
    );
  }

  const [users, teams, invitations, leadershipTransferRequests, teamLockRequests, round1Submissions, teamSubmissions] =
    await Promise.all([
      prisma.user.findMany({
        include: {
          accounts: {
            select: { provider: true },
          },
        },
        orderBy: { createdAt: "asc" },
      }),
      prisma.team.findMany({
        include: {
          members: {
            select: { userId: true },
          },
        },
        orderBy: { createdAt: "asc" },
      }),
      prisma.teamInvitation.findMany({
        where: elevated
          ? undefined
          : {
              OR: [
                { toUserId: currentDbUser.id },
                { fromUserId: currentDbUser.id },
                ...(currentTeamId ? [{ teamId: currentTeamId }] : []),
              ],
            },
        orderBy: { createdAt: "desc" },
      }),
      prisma.leadershipTransferRequest.findMany({
        where: elevated
          ? undefined
          : {
              OR: [
                { toUserId: currentDbUser.id },
                { fromUserId: currentDbUser.id },
                ...(currentTeamId ? [{ teamId: currentTeamId }] : []),
              ],
            },
        orderBy: { createdAt: "desc" },
      }),
      prisma.round1TeamLockRequest.findMany({
        where: elevated
          ? undefined
          : {
              OR: [
                { toUserId: currentDbUser.id },
                { fromUserId: currentDbUser.id },
                ...(currentTeamId ? [{ teamId: currentTeamId }] : []),
              ],
            },
        orderBy: { createdAt: "desc" },
      }),
      prisma.round1Submission.findMany({
        where: elevated
          ? undefined
          : {
              OR: [
                { userId: currentDbUser.id },
                ...(currentTeamId ? [{ teamId: currentTeamId }] : []),
              ],
            },
        include: {
          judgeReviews: {
            orderBy: [{ createdAt: "asc" }],
            include: {
              judgeUser: {
                select: {
                  name: true,
                  loginId: true,
                },
              },
            },
          },
        },
        orderBy: { submittedAt: "desc" },
      }),
      elevated
        ? prisma.teamSubmission.findMany({
            orderBy: [{ submittedAt: "desc" }],
          })
        : currentTeamId
          ? prisma.teamSubmission.findMany({
              where: { teamId: currentTeamId },
              orderBy: [{ submittedAt: "desc" }],
            })
          : Promise.resolve([]),
    ]);

  if (round1Submissions.length > 0) {
    await ensureRound1SubmissionArchives(
      round1Submissions.map((submission) => ({
        id: submission.id,
        bankId: submission.bankId,
        answers: submission.answers,
        rightCount: submission.rightCount,
        essayScore: submission.essayScore,
      })),
    );
  }

  const serializedTeams = await attachRound2AdvancementToTeams(teams.map(serializeTeam));

  return NextResponse.json(
    {
      currentUserId: currentDbUser.id,
      users: users.map(serializeUser),
      teams: serializedTeams,
      invitations: invitations.map(serializeInvitation),
      leadershipTransferRequests: leadershipTransferRequests.map(serializeLeadershipTransferRequest),
      teamLockRequests: teamLockRequests.map(serializeRound1LockRequest),
      round1Submissions: round1Submissions.map((submission) =>
        serializeRound1Submission(submission, {
          revealEssayAndTotalScores: revealRound1EssayAndTotalScores,
        }),
      ),
      submissions: teamSubmissions.map(serializeTeamSubmission),
    },
    { status: 200 },
  );
}
