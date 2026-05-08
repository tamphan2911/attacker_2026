import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";

import { prisma } from "@/lib/db";
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
import { getRound1ExamState } from "@/server/team-service";

export async function GET() {
  const currentDbUser = await getCurrentDbUser();
  if (!currentDbUser) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  if (currentDbUser.role === UserRole.STUDENT) {
    await getRound1ExamState(currentDbUser.id);
  }

  const membership = await prisma.teamMember.findUnique({
    where: { userId: currentDbUser.id },
    select: { teamId: true },
  });
  const currentTeamId = membership?.teamId;
  const elevated = hasElevatedRole(currentDbUser.role);

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

  return NextResponse.json(
    {
      currentUserId: currentDbUser.id,
      users: users.map(serializeUser),
      teams: teams.map(serializeTeam),
      invitations: invitations.map(serializeInvitation),
      leadershipTransferRequests: leadershipTransferRequests.map(serializeLeadershipTransferRequest),
      teamLockRequests: teamLockRequests.map(serializeRound1LockRequest),
      round1Submissions: round1Submissions.map(serializeRound1Submission),
      submissions: teamSubmissions.map(serializeTeamSubmission),
    },
    { status: 200 },
  );
}
