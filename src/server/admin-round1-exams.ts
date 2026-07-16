import {
  Round1AiEssayScoringStatus,
  Round1JudgeReviewSource,
  TeamRound1LockStatus,
  UserRole,
} from "@prisma/client";

import {
  countWords,
  isRound1QuestionAnswered,
  scoreRound1Question,
  type Round1PaperQuestion,
  type Round1QuestionResponse,
} from "@/lib/round1";
import { prisma } from "@/lib/db";
import { TEAM_MIN_MEMBERS } from "@/data/site-content";
import {
  ensureRound1SubmissionArchive,
  parseRound1ArchiveAnswers,
  parseRound1ArchiveQuestions,
} from "@/server/round1-submission-archive";
import { syncRound1DeadlineForfeitures } from "@/server/round1-deadline";
import type {
  AdminRound1AiScoringStatus,
  AdminRound1ExamDetail,
  AdminRound1ExamListRow,
  AdminRound1ExamQuestionRecord,
  AdminRound1ScoreSource,
} from "@/types/admin-round1-exams";
import type { CompetitionStage } from "@/types/site";

function mapStage(stage: "ROUND_1" | "ROUND_2" | "ROUND_3"): CompetitionStage {
  switch (stage) {
    case "ROUND_2":
      return "round-2";
    case "ROUND_3":
      return "round-3";
    case "ROUND_1":
    default:
      return "round-1";
  }
}

function buildQuestionRecords(
  questions: Round1PaperQuestion[],
  answers: Record<string, Round1QuestionResponse>,
  essayQuestionScores: Record<string, number>,
) {
  return questions.map<AdminRound1ExamQuestionRecord>((question) => {
    const response = answers[question.id];
    const scored = scoreRound1Question(question, response);

    return {
      id: question.id,
      paperOrder: question.paperOrder,
      prompt: question.prompt,
      topic: question.topic,
      difficulty: question.difficulty,
      type: question.type,
      options: question.options,
      pairingItems: question.pairingItems,
      rubricNote: question.rubricNote,
      placeholder: question.placeholder,
      response,
      answered: isRound1QuestionAnswered(question, response),
      autoScored: scored.autoScored,
      isCorrect: scored.autoScored ? scored.isCorrect : undefined,
      wordCount: question.type === "essay" ? countWords(response?.essayText ?? "") : undefined,
      essayScore: question.type === "essay" ? (essayQuestionScores[question.id] ?? null) : undefined,
    };
  });
}

function countAnsweredQuestions(
  questions: Round1PaperQuestion[],
  answers: Record<string, Round1QuestionResponse>,
) {
  return questions.filter((question) => isRound1QuestionAnswered(question, answers[question.id])).length;
}

function mapAiScoringStatus(status?: Round1AiEssayScoringStatus | null): AdminRound1AiScoringStatus {
  switch (status) {
    case Round1AiEssayScoringStatus.SCORING:
      return "scoring";
    case Round1AiEssayScoringStatus.SCORED:
      return "scored";
    case Round1AiEssayScoringStatus.FAILED:
      return "failed";
    case Round1AiEssayScoringStatus.SKIPPED_HUMAN:
      return "skipped-human";
    case Round1AiEssayScoringStatus.NOT_STARTED:
    default:
      return "not-started";
  }
}

function getRound1ScoreSource(
  judgeReviews: Array<{ source: Round1JudgeReviewSource; score: number | null; scoredAt: Date | null }>,
): AdminRound1ScoreSource {
  if (
    judgeReviews.some(
      (review) => review.source === Round1JudgeReviewSource.HUMAN && review.score != null && review.scoredAt,
    )
  ) {
    return "human-judge";
  }

  if (
    judgeReviews.some(
      (review) => review.source === Round1JudgeReviewSource.AI && review.score != null && review.scoredAt,
    )
  ) {
    return "gpt-draft";
  }

  return "none";
}

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

export async function readAdminRound1ExamRows(): Promise<AdminRound1ExamListRow[]> {
  await syncRound1DeadlineForfeitures();

  const teams = await prisma.team.findMany({
    where: {
      round1LockStatus: TeamRound1LockStatus.LOCKED,
    },
    include: {
      members: {
        include: {
          user: {
            include: {
              round1ExamAttempt: true,
              round1Submissions: {
                take: 1,
                orderBy: { submittedAt: "desc" },
                include: {
                  aiEssayReview: true,
                  judgeReviews: {
                    select: {
                      source: true,
                      score: true,
                      scoredAt: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  const rows = (
    await Promise.all(
      teams
        .filter((team) => team.members.length >= TEAM_MIN_MEMBERS)
        .flatMap((team) =>
          team.members.map<Promise<AdminRound1ExamListRow | null>>(async ({ user }) => {
            if (user.role !== UserRole.STUDENT) {
              return null;
            }

            const attempt = user.round1ExamAttempt;
            const submission = user.round1Submissions[0];

            const archivedSubmission = submission
              ? await ensureRound1SubmissionArchive({
                  id: submission.id,
                  bankId: submission.bankId,
                  answers: submission.answers,
                  rightCount: submission.rightCount,
                  essayScore: submission.essayScore,
                  isForfeited: submission.isForfeited,
                })
              : null;
            const attemptQuestions = attempt ? parseRound1ArchiveQuestions(attempt.questions) : [];
            const attemptAnswers = attempt ? parseRound1ArchiveAnswers(attempt.answers) : {};

            const sourceQuestions = submission ? archivedSubmission?.questions ?? [] : attemptQuestions;
            const sourceAnswers = submission ? archivedSubmission?.answers ?? {} : attemptAnswers;
            const answeredCount = countAnsweredQuestions(sourceQuestions, sourceAnswers);

            return {
              userId: user.id,
              loginId: user.loginId,
              name: user.name,
              email: user.email,
              university: user.university,
              major: user.major,
              classYear: user.classYear,
              teamId: team.id,
              teamName: team.name,
              teamTag: team.tag,
              teamStage: mapStage(team.stage),
              status: submission ? "submitted" : attempt ? "in-progress" : "not-initiated",
              answeredCount,
              totalQuestions: sourceQuestions.length,
              currentQuestionIndex: attempt?.currentQuestionIndex ?? undefined,
              startedAt: attempt?.startedAt.toISOString(),
              deadlineAt: attempt?.deadlineAt.toISOString(),
              submittedAt: submission?.submittedAt.toISOString(),
              updatedAt: attempt?.updatedAt.toISOString(),
              objectiveScore: submission?.objectiveScore ?? undefined,
              essayScore: submission?.essayScore ?? undefined,
              totalScore: submission?.totalScore ?? undefined,
              aiScoringStatus: mapAiScoringStatus(submission?.aiEssayReview?.status),
              aiScoredAt: submission?.aiEssayReview?.scoredAt?.toISOString(),
              aiModel: submission?.aiEssayReview?.model || undefined,
              aiError: submission?.aiEssayReview?.error ?? undefined,
              scoreSource: submission ? getRound1ScoreSource(submission.judgeReviews) : "none",
              detailAvailable: Boolean(submission || attempt),
            };
          }),
        ),
    )
  ).filter((row): row is AdminRound1ExamListRow => row !== null);

  return rows
    .sort((left, right) => {
      const statusRank = { "in-progress": 0, submitted: 1, "not-initiated": 2 } as const;
      if (statusRank[left.status] !== statusRank[right.status]) {
        return statusRank[left.status] - statusRank[right.status];
      }

      const leftTime = left.submittedAt ?? left.updatedAt ?? left.startedAt ?? "";
      const rightTime = right.submittedAt ?? right.updatedAt ?? right.startedAt ?? "";
      if (leftTime !== rightTime) {
        return rightTime.localeCompare(leftTime);
      }

      return left.name.localeCompare(right.name);
    });
}

export async function readAdminRound1ExamDetail(userId: string): Promise<AdminRound1ExamDetail | null> {
  await syncRound1DeadlineForfeitures({ userId });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      teamMembership: {
        include: {
          team: true,
        },
      },
      round1ExamAttempt: {
        include: {
          bank: true,
        },
      },
      round1Submissions: {
        take: 1,
        orderBy: { submittedAt: "desc" },
        include: {
          bank: true,
          team: true,
        },
      },
    },
  });

  if (!user || user.role !== UserRole.STUDENT) {
    return null;
  }

  const submission = user.round1Submissions[0];
  const fallbackTeam = user.teamMembership?.team;
  const team = submission?.team ?? fallbackTeam;

  if (!team || team.round1LockStatus !== TeamRound1LockStatus.LOCKED) {
    return null;
  }

  const attempt = user.round1ExamAttempt;
  const submissionArchive = submission
    ? await ensureRound1SubmissionArchive({
        id: submission.id,
        bankId: submission.bankId,
        answers: submission.answers,
        rightCount: submission.rightCount,
        essayScore: submission.essayScore,
        isForfeited: submission.isForfeited,
      })
    : null;
  const attemptQuestions = attempt ? parseRound1ArchiveQuestions(attempt.questions) : [];
  const attemptAnswers = attempt ? parseRound1ArchiveAnswers(attempt.answers) : {};
  const sourceAnswers = submission ? submissionArchive?.answers ?? {} : attemptAnswers;
  const essayQuestionScores = submission ? submissionArchive?.essayQuestionScores ?? {} : {};
  const sourceQuestions = submission ? submissionArchive?.questions ?? [] : attemptQuestions;

  const questions = buildQuestionRecords(sourceQuestions, sourceAnswers, essayQuestionScores);

  return {
    submissionId: submission?.id,
    userId: user.id,
    loginId: user.loginId,
    name: user.name,
    email: user.email,
    university: user.university,
    major: user.major,
    classYear: user.classYear,
    teamId: team.id,
    teamName: team.name,
    teamTag: team.tag,
    teamStage: mapStage(team.stage),
    status: submission ? "submitted" : attempt ? "in-progress" : "not-initiated",
    bankTitle: submission
      ? { en: submission.bank.titleEn, vi: submission.bank.titleVi }
      : attempt
        ? { en: attempt.bank.titleEn, vi: attempt.bank.titleVi }
        : undefined,
    startedAt: attempt?.startedAt.toISOString(),
    deadlineAt: attempt?.deadlineAt.toISOString(),
    submittedAt: submission?.submittedAt.toISOString(),
    updatedAt: attempt?.updatedAt.toISOString(),
    currentQuestionIndex: attempt?.currentQuestionIndex ?? undefined,
    answeredCount: countAnsweredQuestions(sourceQuestions, sourceAnswers),
    totalQuestions: sourceQuestions.length,
    objectiveScore: submission?.objectiveScore ?? undefined,
    essayScore: submission?.essayScore ?? undefined,
    totalScore: submission?.totalScore ?? undefined,
    rightCount: submission?.rightCount ?? undefined,
    wrongCount: submission?.wrongCount ?? undefined,
    durationMinutes: submission?.durationMinutes ?? undefined,
    questions,
  };
}

export async function deleteAdminRound1ExamRecord(
  userId: string,
): Promise<ServiceResult<{ deletedSubmission: boolean; deletedAttempt: boolean }>> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      round1ExamAttempt: {
        select: { id: true },
      },
      round1Submissions: {
        select: { id: true },
      },
    },
  });

  if (!user || user.role !== UserRole.STUDENT) {
    return fail(404, "Round 1 attempt record not found.");
  }

  const submissionId = user.round1Submissions[0]?.id;
  const attemptId = user.round1ExamAttempt?.id;

  if (!submissionId && !attemptId) {
    return fail(404, "This participant does not have a saved Round 1 attempt or submission.");
  }

  await prisma.$transaction(async (tx) => {
    if (submissionId) {
      await tx.round1Submission.delete({
        where: { id: submissionId },
      });
    }

    if (attemptId) {
      await tx.round1ExamAttempt.delete({
        where: { id: attemptId },
      });
    }
  });

  return ok({
    deletedSubmission: Boolean(submissionId),
    deletedAttempt: Boolean(attemptId),
  });
}

export async function clearAdminRound1EssayScore(
  submissionId: string,
): Promise<ServiceResult<{ submissionId: string }>> {
  const submission = await prisma.round1Submission.findUnique({
    where: { id: submissionId },
    select: { id: true, bankId: true, answers: true, rightCount: true, essayScore: true, isForfeited: true },
  });

  if (!submission) {
    return fail(404, "Round 1 submission not found.");
  }

  if (submission.isForfeited) {
    return fail(409, "This Round 1 attempt was forfeited at the deadline and must remain at zero.");
  }

  const archive = await ensureRound1SubmissionArchive({
    id: submission.id,
    bankId: submission.bankId,
    answers: submission.answers,
    rightCount: submission.rightCount,
    essayScore: submission.essayScore,
  });

  await prisma.$transaction(async (tx) => {
    await tx.round1JudgeReview.deleteMany({
      where: { submissionId },
    });
    await tx.round1AiEssayReview.deleteMany({
      where: { submissionId },
    });
    await tx.round1Submission.update({
      where: { id: submissionId },
      data: {
        essayScore: null,
        totalScore: null,
        answers: JSON.stringify({
          questions: archive.questions,
          answers: archive.answers,
          essayQuestionScores: {},
        }),
      },
    });
  });

  return ok({ submissionId });
}
