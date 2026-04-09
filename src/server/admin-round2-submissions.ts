import { SubmissionRound, TeamSubmissionResourceSource, UserRole } from "@prisma/client";

import { prisma } from "@/lib/db";
import { isRoundFinished } from "@/lib/competition";
import { syncJudgeAccounts } from "@/server/judge-accounts";
import { readStoredJudges } from "@/server/admin-service";
import type {
  AdminRound2AssignedJudgeRecord,
  AdminRound2AssignmentStatus,
  AdminRound2JudgeOption,
  AdminRound2SubmissionRow,
} from "@/types/admin-round2-submissions";

type ServiceSuccess<T> = {
  ok: true;
  status: number;
  data: T;
};

type ServiceFailure = {
  ok: false;
  status: number;
  error: string;
};

type ServiceResult<T> = ServiceSuccess<T> | ServiceFailure;

function ok<T>(data: T, status = 200): ServiceSuccess<T> {
  return { ok: true, status, data };
}

function fail(status: number, error: string): ServiceFailure {
  return { ok: false, status, error };
}

function createAssignmentStatus(count: number): AdminRound2AssignmentStatus {
  if (count >= 2) {
    return "fully-assigned";
  }

  if (count === 1) {
    return "partially-assigned";
  }

  return "unassigned";
}

export async function readAdminRound2JudgeOptions(): Promise<AdminRound2JudgeOption[]> {
  await syncJudgeAccounts();
  const storedJudges = await readStoredJudges();
  const round2JudgeProfileIds = storedJudges
    .filter((judge) => judge.rounds.includes("round-2"))
    .map((judge) => judge.id);

  if (round2JudgeProfileIds.length === 0) {
    return [];
  }

  const users = await prisma.user.findMany({
    where: {
      role: UserRole.JUDGE,
      judgeProfileId: {
        in: round2JudgeProfileIds,
      },
    },
    select: {
      id: true,
      name: true,
      loginId: true,
      judgeProfileId: true,
      university: true,
    },
    orderBy: [{ name: "asc" }],
  });

  return users.map((user) => ({
    judgeUserId: user.id,
    judgeName: user.name,
    judgeLoginId: user.loginId,
    judgeProfileId: user.judgeProfileId ?? undefined,
    organization: user.university,
  }));
}

export async function readAdminRound2SubmissionRows(): Promise<{
  rows: AdminRound2SubmissionRow[];
  availableJudges: AdminRound2JudgeOption[];
  round2Closed: boolean;
}> {
  const [submissions, availableJudges] = await Promise.all([
    prisma.teamSubmission.findMany({
      where: {
        round: SubmissionRound.ROUND_2,
      },
      orderBy: [{ submittedAt: "desc" }, { version: "desc" }],
      include: {
        team: {
          select: {
            id: true,
            name: true,
            tag: true,
          },
        },
        submittedByUser: {
          select: {
            id: true,
            name: true,
            loginId: true,
          },
        },
        judgeReviews: {
          orderBy: [{ createdAt: "asc" }],
          include: {
            judgeUser: {
              select: {
                id: true,
                role: true,
                name: true,
                loginId: true,
                judgeProfileId: true,
                university: true,
              },
            },
          },
        },
      },
    }),
    readAdminRound2JudgeOptions(),
  ]);

  const latestByTeam = new Map<string, (typeof submissions)[number]>();
  for (const submission of submissions) {
    if (!latestByTeam.has(submission.teamId)) {
      latestByTeam.set(submission.teamId, submission);
    }
  }

  const round2Closed = isRoundFinished("round-2");

  const rows = submissions.map<AdminRound2SubmissionRow>((submission) => {
    const assignedJudges = submission.judgeReviews
      .filter((review) => review.judgeUser.role === UserRole.JUDGE)
      .slice(0, 2)
      .map<AdminRound2AssignedJudgeRecord>((review) => ({
        judgeUserId: review.judgeUser.id,
        judgeName: review.judgeUser.name,
        judgeLoginId: review.judgeUser.loginId,
        judgeProfileId: review.judgeUser.judgeProfileId ?? undefined,
        organization: review.judgeUser.university,
        score: review.score ?? undefined,
        scoredAt: review.scoredAt?.toISOString(),
      }));
    const isLatest = latestByTeam.get(submission.teamId)?.id === submission.id;
    const assignmentLocked = assignedJudges.some((judge) => Boolean(judge.scoredAt));

    return {
      submissionId: submission.id,
      teamId: submission.team.id,
      teamName: submission.team.name,
      teamTag: submission.team.tag,
      title: submission.title,
      version: submission.version,
      isLatest: isLatest ? "valid latest" : "history only",
      resourceLabel: submission.resourceLabel,
      resourceUrl:
        submission.resourceSource === TeamSubmissionResourceSource.UPLOAD
          ? `/api/team-submissions/${submission.id}/file`
          : submission.resourceUrl ?? undefined,
      resourceSource: submission.resourceSource === TeamSubmissionResourceSource.UPLOAD ? "upload" : "external",
      submittedAt: submission.submittedAt.toISOString(),
      submittedByUserId: submission.submittedByUser.id,
      submittedByName: submission.submittedByUser.name,
      submittedByLoginId: submission.submittedByUser.loginId,
      assignmentStatus: createAssignmentStatus(assignedJudges.length),
      assignedJudges,
      canAssign: isLatest && round2Closed,
      assignmentLocked,
    };
  });

  return {
    rows,
    availableJudges,
    round2Closed,
  };
}

export async function assignJudgesToRound2Submission(
  submissionId: string,
  judgeUserIds: string[],
): Promise<ServiceResult<{ saved: true }>> {
  const nextJudgeUserIds = Array.from(
    new Set(
      judgeUserIds
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  );

  if (nextJudgeUserIds.length !== 2) {
    return fail(400, "Exactly two judges must be assigned.");
  }

  await syncJudgeAccounts();
  const storedJudges = await readStoredJudges();
  const round2JudgeProfileIds = storedJudges
    .filter((judge) => judge.rounds.includes("round-2"))
    .map((judge) => judge.id);

  if (!isRoundFinished("round-2")) {
    return fail(409, "Judge assignment opens only after the Round 2 submission deadline.");
  }

  const submission = await prisma.teamSubmission.findUnique({
    where: { id: submissionId },
    include: {
      judgeReviews: {
        orderBy: [{ createdAt: "asc" }],
      },
    },
  });

  if (!submission || submission.round !== SubmissionRound.ROUND_2) {
    return fail(404, "Round 2 submission not found.");
  }

  const latestSubmission = await prisma.teamSubmission.findFirst({
    where: {
      teamId: submission.teamId,
      round: SubmissionRound.ROUND_2,
    },
    orderBy: [{ version: "desc" }, { submittedAt: "desc" }],
    select: {
      id: true,
    },
  });

  if (!latestSubmission || latestSubmission.id !== submission.id) {
    return fail(409, "Judges can only be assigned to the latest submission version.");
  }

  const assignableJudges = await prisma.user.findMany({
    where: {
      id: {
        in: nextJudgeUserIds,
      },
      role: UserRole.JUDGE,
      judgeProfileId: {
        in: round2JudgeProfileIds,
      },
    },
    select: {
      id: true,
    },
  });

  if (assignableJudges.length !== 2) {
    return fail(400, "Both assigned judges must belong to the Round 2 judging panel.");
  }

  const selectedJudgeIds = new Set(nextJudgeUserIds);
  const wouldRemoveScoredJudge = submission.judgeReviews.some(
    (review) => review.scoredAt && !selectedJudgeIds.has(review.judgeUserId),
  );

  if (wouldRemoveScoredJudge) {
    return fail(409, "Judge assignment is locked once a removed judge has already saved a score.");
  }

  const existingJudgeIds = new Set(submission.judgeReviews.map((review) => review.judgeUserId));
  const removableJudgeIds = submission.judgeReviews
    .filter((review) => !review.scoredAt && !selectedJudgeIds.has(review.judgeUserId))
    .map((review) => review.judgeUserId);
  const createJudgeIds = nextJudgeUserIds.filter((judgeUserId) => !existingJudgeIds.has(judgeUserId));

  await prisma.$transaction(async (tx) => {
    if (removableJudgeIds.length > 0) {
      await tx.teamSubmissionJudgeReview.deleteMany({
        where: {
          submissionId,
          judgeUserId: {
            in: removableJudgeIds,
          },
        },
      });
    }

    if (createJudgeIds.length > 0) {
      await tx.teamSubmissionJudgeReview.createMany({
        data: createJudgeIds.map((judgeUserId) => ({
          submissionId,
          judgeUserId,
        })),
      });
    }
  });

  return ok({ saved: true });
}
