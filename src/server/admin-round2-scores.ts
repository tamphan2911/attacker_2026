import { SubmissionRound, TeamSubmissionResourceSource, UserRole } from "@prisma/client";

import { prisma } from "@/lib/db";
import { getTimelineItemById } from "@/lib/competition";
import { readAdminRound2JudgeOptions } from "@/server/admin-round2-submissions";
import { readTimelineItems } from "@/server/timeline-items";
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

function endOfVietnamDay(date: string) {
  return new Date(`${date}T23:59:59.999+07:00`);
}

async function isRound2SubmissionClosed(now = new Date()) {
  const timelineItems = await readTimelineItems();
  const submissionDeadline = getTimelineItemById("round-2-report-submission", timelineItems);

  if (!submissionDeadline) {
    return false;
  }

  return now.getTime() > endOfVietnamDay(submissionDeadline.endDate).getTime();
}

export async function readAdminRound2ScoreRows(): Promise<AdminRound2ScoreRow[]> {
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

  const latestByTeam = new Map<string, (typeof submissions)[number]>();
  for (const submission of submissions) {
    if (!latestByTeam.has(submission.teamId)) {
      latestByTeam.set(submission.teamId, submission);
    }
  }

  return Array.from(latestByTeam.values())
    .map<AdminRound2ScoreRow>((submission) => {
      const judges = submission.judgeReviews
        .filter((review) => review.judgeUser.role === UserRole.JUDGE)
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
          submission.resourceSource === TeamSubmissionResourceSource.UPLOAD
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
  const [scores, availableJudges, round2Closed] = await Promise.all([
    readAdminRound2ScoreRows(),
    readAdminRound2JudgeOptions(),
    isRound2SubmissionClosed(),
  ]);

  return {
    scores,
    availableJudges,
    round2Closed,
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
  const round2Closed = await isRound2SubmissionClosed();
  if (!round2Closed) {
    return {
      ok: false as const,
      status: 409,
      error: "Round 2 score entry opens only after the Round 2 submission deadline.",
    };
  }

  const normalizedJudges = payload.judges
    .map((judge) => ({
      judgeUserId: judge.judgeUserId.trim(),
      score:
        typeof judge.score === "number" && Number.isFinite(judge.score)
          ? Math.max(0, Math.min(100, judge.score))
          : null,
    }))
    .filter((judge) => judge.judgeUserId);

  const uniqueJudgeIds = Array.from(new Set(normalizedJudges.map((judge) => judge.judgeUserId)));
  if (normalizedJudges.length !== 2 || uniqueJudgeIds.length !== 2) {
    return {
      ok: false as const,
      status: 400,
      error: "Exactly two distinct Round 2 judges must be selected.",
    };
  }

  const assignableJudges = await readAdminRound2JudgeOptions();
  const validJudgeIds = new Set(assignableJudges.map((judge) => judge.judgeUserId));
  if (!uniqueJudgeIds.every((judgeUserId) => validJudgeIds.has(judgeUserId))) {
    return {
      ok: false as const,
      status: 400,
      error: "Both selected judges must belong to the Round 2 judging panel.",
    };
  }

  const submission = await prisma.teamSubmission.findUnique({
    where: { id: submissionId },
    include: {
      judgeReviews: true,
    },
  });

  if (!submission || submission.round !== SubmissionRound.ROUND_2) {
    return {
      ok: false as const,
      status: 404,
      error: "Round 2 submission not found.",
    };
  }

  const latestSubmission = await prisma.teamSubmission.findFirst({
    where: {
      teamId: submission.teamId,
      round: SubmissionRound.ROUND_2,
    },
    orderBy: [{ version: "desc" }, { submittedAt: "desc" }],
    select: { id: true },
  });

  if (!latestSubmission || latestSubmission.id !== submission.id) {
    return {
      ok: false as const,
      status: 409,
      error: "Only the latest Round 2 submission version can be edited here.",
    };
  }

  const incomingJudgeIds = new Set(uniqueJudgeIds);
  const removableJudgeIds = submission.judgeReviews
    .filter((review) => !incomingJudgeIds.has(review.judgeUserId))
    .map((review) => review.judgeUserId);

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

    for (const judge of normalizedJudges) {
      const hasScore = typeof judge.score === "number";
      await tx.teamSubmissionJudgeReview.upsert({
        where: {
          judgeUserId_submissionId: {
            judgeUserId: judge.judgeUserId,
            submissionId,
          },
        },
        update: {
          score: judge.score,
          scoredAt: hasScore ? new Date() : null,
        },
        create: {
          judgeUserId: judge.judgeUserId,
          submissionId,
          score: judge.score,
          scoredAt: hasScore ? new Date() : null,
        },
      });
    }
  });

  return {
    ok: true as const,
    status: 200,
    data: { saved: true },
  };
}
