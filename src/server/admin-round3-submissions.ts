import { Round2AiReportScoringStatus, SubmissionRound, TeamSubmissionJudgeReviewSource, TeamSubmissionResourceSource, UserRole } from "@prisma/client";

import { prisma } from "@/lib/db";
import { readRound2FinalistResults, type Round2AdvancementBracket } from "@/server/round2-finalists";
import { ensureEmergingJudgeAssignments } from "@/server/emerging-judge-assignment";
import { decodeTeamReviewNote } from "@/server/judge-service";
import { deleteTeamSubmissionFile } from "@/server/team-submission-storage";
import type { AdminRound3SubmissionRow } from "@/types/admin-round3-submissions";

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

function serializeAiStatus(status?: Round2AiReportScoringStatus | null): NonNullable<AdminRound3SubmissionRow["emergingGptStatus"]> {
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

export async function readAdminRound3SubmissionRows(): Promise<{ rows: AdminRound3SubmissionRow[] }> {
  await ensureEmergingJudgeAssignments(prisma);

  const [submissions, round2Results] = await Promise.all([
    prisma.teamSubmission.findMany({
      where: {
        round: SubmissionRound.ROUND_3,
      },
      orderBy: [{ submittedAt: "desc" }, { version: "desc" }],
      include: {
        team: {
          select: {
            id: true,
            name: true,
            tag: true,
            finalScore: true,
            finalScoreUpdatedAt: true,
          },
        },
        judgeReviews: {
          include: {
            judgeUser: {
              select: {
                role: true,
              },
            },
          },
          orderBy: [{ scoredAt: "desc" }, { updatedAt: "desc" }],
        },
        aiReportReview: true,
        submittedByUser: {
          select: {
            id: true,
            name: true,
            loginId: true,
          },
        },
      },
    }),
    readRound2FinalistResults(),
  ]);

  const bracketByTeamId = new Map<string, Round2AdvancementBracket>();
  if (round2Results.released) {
    for (const team of round2Results.finalists) {
      bracketByTeamId.set(team.id, "finalist");
    }
    for (const team of round2Results.emergingTeams) {
      bracketByTeamId.set(team.id, "emerging");
    }
  }

  const latestByTeam = new Map<string, (typeof submissions)[number]>();
  for (const submission of submissions) {
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

  const finalRankByTeamId = new Map<string, number>();
  const emergingScoreByTeamId = new Map<string, {
    score?: number;
    source: "human" | "gpt" | "none";
    scoredAt?: string;
    rubricScores: Record<string, number>;
  }>();
  for (const submission of latestByTeam.values()) {
    if (bracketByTeamId.get(submission.teamId) !== "emerging") {
      continue;
    }

    const humanReview = submission.judgeReviews.find(
      (review) =>
        review.judgeUser.role === UserRole.JUDGE &&
        review.source === TeamSubmissionJudgeReviewSource.HUMAN &&
        typeof review.score === "number" &&
        review.scoredAt,
    );
    const scoredReview = humanReview ?? submission.judgeReviews.find(
      (review) =>
        review.judgeUser.role === UserRole.JUDGE &&
        typeof review.score === "number" &&
        review.scoredAt,
    );
    const decoded = decodeTeamReviewNote(scoredReview?.note);

    emergingScoreByTeamId.set(submission.teamId, {
      score: scoredReview?.score ?? undefined,
      source: humanReview
        ? "human"
        : scoredReview?.source === TeamSubmissionJudgeReviewSource.AI
          ? "gpt"
          : "none",
      scoredAt: scoredReview?.scoredAt?.toISOString(),
      rubricScores: decoded.rubricScores,
    });
  }

  const latestRound2Submissions = await prisma.teamSubmission.findMany({
    where: {
      round: SubmissionRound.ROUND_2,
      teamId: { in: Array.from(bracketByTeamId.keys()) },
    },
    include: {
      judgeReviews: {
        include: {
          judgeUser: {
            select: {
              role: true,
            },
          },
        },
      },
    },
    orderBy: [{ submittedAt: "desc" }, { version: "desc" }],
  });
  const latestRound2ByTeamId = new Map<string, (typeof latestRound2Submissions)[number]>();
  for (const submission of latestRound2Submissions) {
    const currentLatest = latestRound2ByTeamId.get(submission.teamId);
    if (!currentLatest || submission.version > currentLatest.version || (submission.version === currentLatest.version && submission.submittedAt.getTime() > currentLatest.submittedAt.getTime())) {
      latestRound2ByTeamId.set(submission.teamId, submission);
    }
  }
  const round2ScoreByTeamId = new Map<string, number>();
  for (const [teamId, submission] of latestRound2ByTeamId) {
    const scoredReviews = submission.judgeReviews.filter(
      (review) => review.judgeUser.role === UserRole.JUDGE && typeof review.score === "number" && review.scoredAt,
    );
    if (scoredReviews.length > 0) {
      round2ScoreByTeamId.set(
        teamId,
        Math.round((scoredReviews.reduce((total, review) => total + (review.score ?? 0), 0) / scoredReviews.length) * 100) / 100,
      );
    }
  }

  for (const bracket of ["finalist", "emerging"] as const) {
    Array.from(latestByTeam.values())
      .filter(
        (submission) =>
          bracketByTeamId.get(submission.teamId) === bracket &&
          typeof (bracket === "emerging" ? emergingScoreByTeamId.get(submission.teamId)?.score : submission.team.finalScore) === "number",
      )
      .sort((left, right) => {
        const leftScore = bracket === "emerging" ? emergingScoreByTeamId.get(left.teamId)?.score : left.team.finalScore;
        const rightScore = bracket === "emerging" ? emergingScoreByTeamId.get(right.teamId)?.score : right.team.finalScore;
        const scoreDelta = (rightScore ?? 0) - (leftScore ?? 0);
        if (scoreDelta !== 0) {
          return scoreDelta;
        }

        return left.submittedAt.getTime() - right.submittedAt.getTime();
      })
      .forEach((submission, index) => {
        finalRankByTeamId.set(submission.teamId, index + 1);
      });
  }

  return {
    rows: submissions.map<AdminRound3SubmissionRow>((submission) => {
      const bracket = bracketByTeamId.get(submission.teamId);
      const emergingScore = emergingScoreByTeamId.get(submission.teamId);
      const displayedFinalScore = bracket === "emerging" ? emergingScore?.score : submission.team.finalScore ?? undefined;
      const round2Score = round2ScoreByTeamId.get(submission.teamId);

      return {
      submissionId: submission.id,
      teamId: submission.team.id,
      teamName: submission.team.name,
      teamTag: submission.team.tag,
      round2Bracket: bracket,
      finalScore: displayedFinalScore,
      finalScoreUpdatedAt: bracket === "emerging" ? emergingScore?.scoredAt : submission.team.finalScoreUpdatedAt?.toISOString(),
      round2Score,
      scoreDifference:
        typeof displayedFinalScore === "number" && typeof round2Score === "number"
          ? Math.round((displayedFinalScore - round2Score) * 100) / 100
          : undefined,
      emergingScoreSource: bracket === "emerging" ? emergingScore?.source ?? "none" : undefined,
      emergingScoredAt: bracket === "emerging" ? emergingScore?.scoredAt : undefined,
      emergingGptStatus: bracket === "emerging" ? serializeAiStatus(submission.aiReportReview?.status) : undefined,
      emergingGptScore: bracket === "emerging" ? submission.aiReportReview?.score ?? undefined : undefined,
      emergingGptModel: bracket === "emerging" ? submission.aiReportReview?.model || undefined : undefined,
      emergingGptScoredAt: bracket === "emerging" ? submission.aiReportReview?.scoredAt?.toISOString() : undefined,
      emergingGptError: bracket === "emerging" ? submission.aiReportReview?.error ?? undefined : undefined,
      finalRank:
        latestByTeam.get(submission.teamId)?.id === submission.id
          ? finalRankByTeamId.get(submission.teamId)
          : undefined,
      title: submission.title,
      version: submission.version,
      isLatest: latestByTeam.get(submission.teamId)?.id === submission.id ? "valid latest" : "history only",
      resourceLabel: submission.resourceLabel,
      resourceUrl:
        submission.resourceSource === TeamSubmissionResourceSource.UPLOAD && submission.resourceStorageKey
          ? `/api/team-submissions/${submission.id}/file`
          : submission.resourceUrl ?? undefined,
      resourceSource: submission.resourceSource === TeamSubmissionResourceSource.UPLOAD ? "upload" : "external",
      resourceSizeBytes: submission.resourceSizeBytes ?? undefined,
      submittedAt: submission.submittedAt.toISOString(),
      submittedByUserId: submission.submittedByUser.id,
      submittedByName: submission.submittedByUser.name,
      submittedByLoginId: submission.submittedByUser.loginId,
      };
    }),
  };
}

export async function saveAdminRound3FinalScore(
  teamId: string,
  finalScore: number | null,
): Promise<ServiceResult<{ teamId: string; finalScore?: number; finalScoreUpdatedAt?: string }>> {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: {
      id: true,
      submissions: {
        where: { round: SubmissionRound.ROUND_3 },
        select: { id: true },
        take: 1,
      },
    },
  });

  if (!team || team.submissions.length === 0) {
    return fail(404, "Round 3 report not found for this team.");
  }

  const updated = await prisma.team.update({
    where: { id: teamId },
    data: {
      finalScore,
      finalScoreUpdatedAt: finalScore === null ? null : new Date(),
    },
    select: {
      id: true,
      finalScore: true,
      finalScoreUpdatedAt: true,
    },
  });

  return ok({
    teamId: updated.id,
    finalScore: updated.finalScore ?? undefined,
    finalScoreUpdatedAt: updated.finalScoreUpdatedAt?.toISOString(),
  });
}

export async function deleteRound3SubmissionByAdmin(
  submissionId: string,
): Promise<ServiceResult<{ deleted: true }>> {
  const submission = await prisma.teamSubmission.findUnique({
    where: { id: submissionId },
    select: {
      id: true,
      round: true,
      resourceSource: true,
      resourceStorageKey: true,
    },
  });

  if (!submission || submission.round !== SubmissionRound.ROUND_3) {
    return fail(404, "Final/Emerging submission not found.");
  }

  if (
    submission.resourceSource === TeamSubmissionResourceSource.UPLOAD &&
    submission.resourceStorageKey
  ) {
    try {
      await deleteTeamSubmissionFile(submission.resourceStorageKey);
    } catch {
      return fail(500, "The uploaded PDF could not be deleted from storage. The submission was not removed.");
    }
  }

  await prisma.teamSubmission.delete({
    where: { id: submissionId },
  });

  return ok({ deleted: true });
}
