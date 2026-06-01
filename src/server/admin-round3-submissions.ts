import { SubmissionRound, TeamSubmissionResourceSource } from "@prisma/client";

import { prisma } from "@/lib/db";
import { readRound2FinalistResults, type Round2AdvancementBracket } from "@/server/round2-finalists";
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

export async function readAdminRound3SubmissionRows(): Promise<{ rows: AdminRound3SubmissionRow[] }> {
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
  for (const bracket of ["finalist", "emerging"] as const) {
    Array.from(latestByTeam.values())
      .filter(
        (submission) =>
          bracketByTeamId.get(submission.teamId) === bracket &&
          typeof submission.team.finalScore === "number",
      )
      .sort((left, right) => {
        const scoreDelta = (right.team.finalScore ?? 0) - (left.team.finalScore ?? 0);
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
    rows: submissions.map<AdminRound3SubmissionRow>((submission) => ({
      submissionId: submission.id,
      teamId: submission.team.id,
      teamName: submission.team.name,
      teamTag: submission.team.tag,
      round2Bracket: bracketByTeamId.get(submission.teamId),
      finalScore: submission.team.finalScore ?? undefined,
      finalScoreUpdatedAt: submission.team.finalScoreUpdatedAt?.toISOString(),
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
    })),
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
