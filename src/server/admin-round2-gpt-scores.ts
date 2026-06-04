import {
  Round2AiReportScoringStatus,
  SubmissionRound,
  TeamSubmissionJudgeReviewSource,
  UserRole,
} from "@prisma/client";

import { prisma } from "@/lib/db";

const GPT_SCORE_SUBMISSION_ROUNDS = [SubmissionRound.ROUND_2, SubmissionRound.ROUND_3];

export type AdminRound2GptScoreRow = {
  reviewId: string;
  submissionId: string;
  round: "round-2" | "round-3";
  teamId: string;
  teamName: string;
  teamTag: string;
  title: string;
  version: number;
  resourceLabel: string;
  submittedAt: string;
  submittedByName: string;
  submittedByLoginId: string;
  status: "not-started" | "scoring" | "scored" | "failed" | "skipped-human";
  score?: number;
  model?: string;
  error?: string;
  comment?: string;
  scoredAt?: string;
  createdAt: string;
  updatedAt: string;
  judgeSlots: Array<{
    judgeUserId: string;
    judgeName: string;
    source: "human" | "ai";
    score?: number;
    scoredAt?: string;
  }>;
};

function serializeStatus(status: Round2AiReportScoringStatus): AdminRound2GptScoreRow["status"] {
  switch (status) {
    case Round2AiReportScoringStatus.SCORING:
      return "scoring";
    case Round2AiReportScoringStatus.SCORED:
      return "scored";
    case Round2AiReportScoringStatus.FAILED:
      return "failed";
    case Round2AiReportScoringStatus.SKIPPED_HUMAN:
      return "skipped-human";
    case Round2AiReportScoringStatus.NOT_STARTED:
    default:
      return "not-started";
  }
}

function serializeRound(round: SubmissionRound): AdminRound2GptScoreRow["round"] {
  return round === SubmissionRound.ROUND_3 ? "round-3" : "round-2";
}

export async function readAdminRound2GptScoreRows(): Promise<AdminRound2GptScoreRow[]> {
  const reviews = await prisma.round2AiReportReview.findMany({
    where: {
      submission: {
        round: { in: GPT_SCORE_SUBMISSION_ROUNDS },
      },
    },
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    include: {
      submission: {
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
                },
              },
            },
          },
        },
      },
    },
  });

  return reviews.map((review) => ({
    reviewId: review.id,
    submissionId: review.submissionId,
    round: serializeRound(review.submission.round),
    teamId: review.submission.team.id,
    teamName: review.submission.team.name,
    teamTag: review.submission.team.tag,
    title: review.submission.title,
    version: review.submission.version,
    resourceLabel: review.submission.resourceLabel,
    submittedAt: review.submission.submittedAt.toISOString(),
    submittedByName: review.submission.submittedByUser.name,
    submittedByLoginId: review.submission.submittedByUser.loginId,
    status: serializeStatus(review.status),
    score: review.score ?? undefined,
    model: review.model || undefined,
    error: review.error ?? undefined,
    comment: review.comment || undefined,
    scoredAt: review.scoredAt?.toISOString(),
    createdAt: review.createdAt.toISOString(),
    updatedAt: review.updatedAt.toISOString(),
    judgeSlots: review.submission.judgeReviews
      .filter((item) => item.judgeUser.role === UserRole.JUDGE)
      .slice(0, 2)
      .map((item) => ({
        judgeUserId: item.judgeUserId,
        judgeName: item.judgeUser.name,
        source: item.source === TeamSubmissionJudgeReviewSource.AI ? "ai" : "human",
        score: item.score ?? undefined,
        scoredAt: item.scoredAt?.toISOString(),
      })),
  }));
}

export async function deleteAdminRound2GptScores(options: {
  reviewIds?: string[];
  deleteAll?: boolean;
}) {
  const where = options.deleteAll
    ? {
        submission: {
          round: { in: GPT_SCORE_SUBMISSION_ROUNDS },
        },
      }
    : {
        id: {
          in: options.reviewIds ?? [],
        },
        submission: {
          round: { in: GPT_SCORE_SUBMISSION_ROUNDS },
        },
      };

  const reviews = await prisma.round2AiReportReview.findMany({
    where,
    select: {
      id: true,
      submissionId: true,
    },
  });

  if (!reviews.length) {
    return {
      ok: true as const,
      status: 200,
      data: { deletedCount: 0 },
    };
  }

  const reviewIds = reviews.map((review) => review.id);
  const submissionIds = Array.from(new Set(reviews.map((review) => review.submissionId)));

  await prisma.$transaction([
    prisma.teamSubmissionJudgeReview.updateMany({
      where: {
        submissionId: { in: submissionIds },
        source: TeamSubmissionJudgeReviewSource.AI,
      },
      data: {
        score: null,
        note: "",
        source: TeamSubmissionJudgeReviewSource.HUMAN,
        scoredAt: null,
      },
    }),
    prisma.round2AiReportReview.deleteMany({
      where: {
        id: { in: reviewIds },
      },
    }),
  ]);

  return {
    ok: true as const,
    status: 200,
    data: { deletedCount: reviewIds.length },
  };
}
