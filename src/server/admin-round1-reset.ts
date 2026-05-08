import {
  Round1BankStatus,
  Round1QuestionDifficulty,
  Round1QuestionType,
  Round1TestBankType,
} from "@prisma/client";

import { round1IndividualSubmissions, round1TestBanks } from "@/data/site-content";
import { prisma } from "@/lib/db";
import { ROUND1_OBJECTIVE_TOTAL, getRound1ObjectiveScore } from "@/lib/round1";
import {
  buildRound1SubmissionArchiveFromBanks,
} from "@/server/round1-submission-archive";

export interface Round1ResetResult {
  syncedBankCount: number;
  archivedBankCount: number;
  deletedReviewCount: number;
  deletedAttemptCount: number;
  deletedSubmissionCount: number;
  createdSubmissionCount: number;
}

function mapBankType(bankType: "objective" | "essay") {
  return bankType === "essay" ? Round1TestBankType.ESSAY : Round1TestBankType.OBJECTIVE;
}

function mapBankStatus(status: "draft" | "active" | "archived") {
  switch (status) {
    case "draft":
      return Round1BankStatus.DRAFT;
    case "archived":
      return Round1BankStatus.ARCHIVED;
    case "active":
    default:
      return Round1BankStatus.ACTIVE;
  }
}

function mapQuestionDifficulty(difficulty: "easy" | "medium" | "hard") {
  switch (difficulty) {
    case "medium":
      return Round1QuestionDifficulty.MEDIUM;
    case "hard":
      return Round1QuestionDifficulty.HARD;
    case "easy":
    default:
      return Round1QuestionDifficulty.EASY;
  }
}

function mapQuestionType(type: "true-false" | "single-choice" | "multiple-choice" | "pairing" | "essay") {
  switch (type) {
    case "true-false":
      return Round1QuestionType.TRUE_FALSE;
    case "multiple-choice":
      return Round1QuestionType.MULTIPLE_CHOICE;
    case "pairing":
      return Round1QuestionType.PAIRING;
    case "essay":
      return Round1QuestionType.ESSAY;
    case "single-choice":
    default:
      return Round1QuestionType.SINGLE_CHOICE;
  }
}

export async function resetRound1SubmissionsToCanonicalSeed(): Promise<Round1ResetResult> {
  const canonicalObjectiveBank = round1TestBanks.find((bank) => bank.bankType === "objective");
  const canonicalEssayBank = round1TestBanks.find((bank) => bank.bankType === "essay");

  if (!canonicalObjectiveBank || !canonicalEssayBank) {
    throw new Error("Canonical Round 1 banks are missing from the site content source.");
  }

  const objectiveBankById = new Map([[canonicalObjectiveBank.id, canonicalObjectiveBank]]);
  const mappedEssayBank = canonicalEssayBank;
  const canonicalBankIds = round1TestBanks.map((bank) => bank.id);
  const canonicalBankTypes = round1TestBanks.map((bank) => mapBankType(bank.bankType));

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
    for (const bank of round1TestBanks) {
      await tx.round1TestBank.upsert({
        where: { id: bank.id },
        create: {
          id: bank.id,
          slug: bank.id,
          bankType: mapBankType(bank.bankType),
          status: mapBankStatus(bank.status),
          titleEn: bank.title.en,
          titleVi: bank.title.vi,
          descriptionEn: bank.description.en,
          descriptionVi: bank.description.vi,
          questionPoolSize: bank.questionPoolSize,
          questionsPerAttempt: bank.questionsPerAttempt,
          shuffleQuestions: bank.shuffleQuestions,
          shuffleOptions: bank.shuffleOptions,
          durationMinutes: bank.durationMinutes,
          wordLimit: bank.wordLimit ?? null,
          publishedAt: bank.publishedAt ? new Date(bank.publishedAt) : null,
          questions: JSON.stringify(
            bank.questions.map((question) => ({
              ...question,
              difficulty: mapQuestionDifficulty(question.difficulty),
              type: mapQuestionType(question.type),
            })),
          ),
        },
        update: {
          slug: bank.id,
          bankType: mapBankType(bank.bankType),
          status: mapBankStatus(bank.status),
          titleEn: bank.title.en,
          titleVi: bank.title.vi,
          descriptionEn: bank.description.en,
          descriptionVi: bank.description.vi,
          questionPoolSize: bank.questionPoolSize,
          questionsPerAttempt: bank.questionsPerAttempt,
          shuffleQuestions: bank.shuffleQuestions,
          shuffleOptions: bank.shuffleOptions,
          durationMinutes: bank.durationMinutes,
          wordLimit: bank.wordLimit ?? null,
          publishedAt: bank.publishedAt ? new Date(bank.publishedAt) : null,
          questions: JSON.stringify(
            bank.questions.map((question) => ({
              ...question,
              difficulty: mapQuestionDifficulty(question.difficulty),
              type: mapQuestionType(question.type),
            })),
          ),
        },
      });
    }

    const archiveOtherBanks = await tx.round1TestBank.updateMany({
      where: {
        id: { notIn: canonicalBankIds },
        bankType: { in: canonicalBankTypes },
        status: { not: Round1BankStatus.ARCHIVED },
      },
      data: {
        status: Round1BankStatus.ARCHIVED,
      },
    });

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
      syncedBankCount: round1TestBanks.length,
      archivedBankCount: archiveOtherBanks.count,
      deletedReviewCount: reviewDeletion.count,
      deletedAttemptCount: attemptDeletion.count,
      deletedSubmissionCount: submissionDeletion.count,
      createdSubmissionCount: round1IndividualSubmissions.length,
    };
  });
}
