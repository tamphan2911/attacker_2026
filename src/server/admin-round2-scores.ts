import { SubmissionRound, TeamSubmissionResourceSource, UserRole } from "@prisma/client";

import { prisma } from "@/lib/db";
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
        orderBy: [{ scoredAt: "desc" }, { createdAt: "desc" }],
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
