import { Round1BankStatus, Round1TestBankType } from "@prisma/client";

import { round1IndividualSubmissions } from "@/data/site-content";
import { prisma } from "@/lib/db";
import { ROUND1_OBJECTIVE_TOTAL, getRound1ObjectiveScore } from "@/lib/round1";
import {
  buildRound1SubmissionArchiveFromBanks,
  mapStoredBankToAppBank,
} from "@/server/round1-submission-archive";

export interface Round1ResetResult {
  deletedReviewCount: number;
  deletedAttemptCount: number;
  deletedSubmissionCount: number;
  createdSubmissionCount: number;
}

export async function resetRound1SubmissionsToCanonicalSeed(): Promise<Round1ResetResult> {
  const [objectiveBanks, activeEssayBank, latestEssayBank] = await Promise.all([
    prisma.round1TestBank.findMany({
      where: { bankType: Round1TestBankType.OBJECTIVE },
    }),
    prisma.round1TestBank.findFirst({
      where: { bankType: Round1TestBankType.ESSAY, status: Round1BankStatus.ACTIVE },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    }),
    prisma.round1TestBank.findFirst({
      where: { bankType: Round1TestBankType.ESSAY },
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    }),
  ]);

  const essayBank = activeEssayBank ?? latestEssayBank;
  if (!objectiveBanks.length || !essayBank) {
    throw new Error("Round 1 banks are not configured well enough to recreate submissions.");
  }

  const objectiveBankById = new Map(
    objectiveBanks.map((bank) => [bank.id, mapStoredBankToAppBank(bank, "objective")]),
  );
  const mappedEssayBank = mapStoredBankToAppBank(essayBank, "essay");

  const expectedUserIds = [...new Set(round1IndividualSubmissions.map((submission) => submission.userId))];
  const expectedTeamIds = [...new Set(round1IndividualSubmissions.map((submission) => submission.teamId))];

  const [users, teams] = await Promise.all([
    prisma.user.findMany({
      where: { id: { in: expectedUserIds } },
      select: { id: true },
    }),
    prisma.team.findMany({
      where: { id: { in: expectedTeamIds } },
      select: { id: true },
    }),
  ]);

  const missingUserIds = expectedUserIds.filter((userId) => !users.some((user) => user.id === userId));
  const missingTeamIds = expectedTeamIds.filter((teamId) => !teams.some((team) => team.id === teamId));

  if (missingUserIds.length > 0 || missingTeamIds.length > 0) {
    const fragments = [
      missingUserIds.length > 0 ? `users: ${missingUserIds.join(", ")}` : "",
      missingTeamIds.length > 0 ? `teams: ${missingTeamIds.join(", ")}` : "",
    ].filter(Boolean);

    throw new Error(`Cannot recreate Round 1 submissions because required records are missing (${fragments.join(" ; ")}).`);
  }

  return prisma.$transaction(async (tx) => {
    const reviewDeletion = await tx.round1JudgeReview.deleteMany();
    const attemptDeletion = await tx.round1ExamAttempt.deleteMany();
    const submissionDeletion = await tx.round1Submission.deleteMany();

    for (const seedSubmission of round1IndividualSubmissions) {
      const objectiveBank = objectiveBankById.get(seedSubmission.bankId);
      if (!objectiveBank) {
        throw new Error(`Missing objective bank ${seedSubmission.bankId} while rebuilding Round 1 submissions.`);
      }

      const objectiveScore = getRound1ObjectiveScore(seedSubmission.rightCount);
      const wrongCount = Math.max(0, ROUND1_OBJECTIVE_TOTAL - seedSubmission.rightCount);
      const totalScore =
        typeof seedSubmission.essayScore === "number"
          ? objectiveScore + seedSubmission.essayScore
          : null;
      const archive = buildRound1SubmissionArchiveFromBanks({
        submissionId: seedSubmission.id,
        objectiveBank,
        essayBank: mappedEssayBank,
        rightCount: seedSubmission.rightCount,
        essayScore: seedSubmission.essayScore,
      });

      await tx.round1Submission.create({
        data: {
          id: seedSubmission.id,
          bankId: seedSubmission.bankId,
          teamId: seedSubmission.teamId,
          userId: seedSubmission.userId,
          submittedAt: new Date(seedSubmission.submittedAt),
          rightCount: seedSubmission.rightCount,
          wrongCount,
          score: totalScore ?? objectiveScore,
          objectiveScore,
          essayScore: seedSubmission.essayScore,
          totalScore,
          durationMinutes: seedSubmission.durationMinutes,
          answers: JSON.stringify(archive),
        },
      });
    }

    return {
      deletedReviewCount: reviewDeletion.count,
      deletedAttemptCount: attemptDeletion.count,
      deletedSubmissionCount: submissionDeletion.count,
      createdSubmissionCount: round1IndividualSubmissions.length,
    };
  });
}
