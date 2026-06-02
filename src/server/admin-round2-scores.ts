import { SubmissionRound, TeamSubmissionResourceSource, UserRole } from "@prisma/client";

import { prisma } from "@/lib/db";
import { readAdminRound2JudgeOptions } from "@/server/admin-round2-submissions";
import {
  ensureRound2JudgeAssignments,
  readRound2SubmissionLockState,
} from "@/server/round2-judge-assignment";
import type { AdminRound2JudgeOption } from "@/types/admin-round2-submissions";
import type {
  AdminRound2JudgeScoreRecord,
  AdminRound2ScoreRow,
  AdminRound2ScoreStatus,
} from "@/types/admin-round2-scores";

function createStatus(scoredCount: number): AdminRound2ScoreStatus {
  if (scoredCount >= 2) {
    return "scored";
  }

  if (scoredCount === 1) {
    return "partially-scored";
  }

  return "not-scored";
}

export async function readAdminRound2ScoreRows(): Promise<AdminRound2ScoreRow[]> {
  const { closed: round2Closed, deadlineAt: round2DeadlineAt } = await readRound2SubmissionLockState();

  if (round2Closed) {
    await ensureRound2JudgeAssignments(prisma);
  }

  const submissions = await prisma.teamSubmission.findMany({
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
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        include: {
          judgeUser: {
            select: {
              id: true,
              name: true,
              role: true,
              judgeProfileId: true,
            },
          },
        },
      },
    },
  });

  const latestCandidates =
    round2Closed && round2DeadlineAt
      ? submissions.filter((submission) => submission.submittedAt.getTime() <= round2DeadlineAt.getTime())
      : submissions;
  const latestByTeam = new Map<string, (typeof submissions)[number]>();
  for (const submission of latestCandidates) {
    const currentLatest = latestByTeam.get(submission.teamId);
    if (
      !currentLatest ||
      submission.version > currentLatest.version ||
      (submission.version === currentLatest.version &&
        submission.submittedAt.getTime() > currentLatest.submittedAt.getTime())
    ) {
      latestByTeam.set(submission.teamId, submission);
    }
  }

  return Array.from(latestByTeam.values())
    .map<AdminRound2ScoreRow>((submission) => {
      const judges = submission.judgeReviews
        .filter((review) => round2Closed && review.judgeUser.role === UserRole.JUDGE)
        .slice(0, 2)
        .map<AdminRound2JudgeScoreRecord>((review) => ({
          judgeUserId: review.judgeUser.id,
          judgeName: review.judgeUser.name,
          judgeProfileId: review.judgeUser.judgeProfileId ?? undefined,
          score: review.score ?? undefined,
          scoredAt: review.scoredAt?.toISOString(),
        }));

      const scoredReviews = judges.filter((judge) => typeof judge.score === "number");
      const averageScore =
        scoredReviews.length > 0
          ? scoredReviews.reduce((total, judge) => total + (judge.score ?? 0), 0) / scoredReviews.length
          : undefined;

      return {
        submissionId: submission.id,
        teamId: submission.team.id,
        teamName: submission.team.name,
        teamTag: submission.team.tag,
        title: submission.title,
        version: submission.version,
        resourceLabel: submission.resourceLabel,
        resourceUrl:
          submission.resourceSource === TeamSubmissionResourceSource.UPLOAD && submission.resourceStorageKey
            ? `/api/team-submissions/${submission.id}/file`
            : submission.resourceUrl ?? undefined,
        resourceSource: submission.resourceSource === TeamSubmissionResourceSource.UPLOAD ? "upload" : "external",
        submittedAt: submission.submittedAt.toISOString(),
        submittedByUserId: submission.submittedByUser.id,
        submittedByName: submission.submittedByUser.name,
        submittedByLoginId: submission.submittedByUser.loginId,
        status: createStatus(scoredReviews.length),
        averageScore,
        judges,
      };
    })
    .sort((left, right) => {
      const leftAverage = left.averageScore ?? Number.NEGATIVE_INFINITY;
      const rightAverage = right.averageScore ?? Number.NEGATIVE_INFINITY;

      if (leftAverage !== rightAverage) {
        return rightAverage - leftAverage;
      }

      return right.submittedAt.localeCompare(left.submittedAt);
    });
}

export async function readAdminRound2ScorePageData(): Promise<{
  scores: AdminRound2ScoreRow[];
  availableJudges: AdminRound2JudgeOption[];
  round2Closed: boolean;
}> {
  const [scores, availableJudges, round2LockState] = await Promise.all([
    readAdminRound2ScoreRows(),
    readAdminRound2JudgeOptions(),
    readRound2SubmissionLockState(),
  ]);

  return {
    scores,
    availableJudges,
    round2Closed: round2LockState.closed,
  };
}

export async function saveAdminRound2ScoreRow(
  submissionId: string,
  payload: {
    judges: Array<{
      judgeUserId: string;
      score?: number | null;
    }>;
  },
) {
  void submissionId;
  void payload;

  return {
    ok: false as const,
    status: 403,
    error: "Round 2 judge assignment and score entry are now handled from judge accounts.",
  };
}

export async function deleteAdminRound2ScoreRow(submissionId: string) {
  const submission = await prisma.teamSubmission.findUnique({
    where: { id: submissionId },
    select: { id: true },
  });

  if (!submission) {
    return {
      ok: false as const,
      status: 404,
      error: "Round 2 score row not found.",
    };
  }

  await prisma.teamSubmissionJudgeReview.deleteMany({
    where: { submissionId },
  });

  return {
    ok: true as const,
    status: 200,
    data: { submissionId },
  };
}
