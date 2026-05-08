import { Round1BankStatus, Round1TestBankType, TeamRound1LockStatus, UserRole } from "@prisma/client";

import {
  ROUND1_ESSAY_TOTAL,
  countWords,
  isRound1QuestionAnswered,
  scoreRound1Question,
  type Round1PaperQuestion,
  type Round1QuestionResponse,
} from "@/lib/round1";
import { prisma } from "@/lib/db";
import { TEAM_MIN_MEMBERS } from "@/data/site-content";
import type {
  AdminRound1ExamDetail,
  AdminRound1ExamListRow,
  AdminRound1ExamQuestionRecord,
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

function normalizePersistedDifficulty(difficulty: string | undefined): Round1PaperQuestion["difficulty"] {
  switch ((difficulty ?? "").toLowerCase()) {
    case "easy":
      return "easy";
    case "medium":
      return "medium";
    case "hard":
      return "hard";
    default:
      return "medium";
  }
}

function normalizePersistedType(type: string | undefined): Round1PaperQuestion["type"] {
  switch ((type ?? "").toLowerCase()) {
    case "true_false":
    case "true-false":
      return "true-false";
    case "single_choice":
    case "single-choice":
      return "single-choice";
    case "multiple_choice":
    case "multiple-choice":
      return "multiple-choice";
    case "pairing":
      return "pairing";
    case "essay":
      return "essay";
    default:
      return "single-choice";
  }
}

function parseQuestions(rawQuestions: string | null | undefined) {
  try {
    const parsed = rawQuestions ? (JSON.parse(rawQuestions) as Round1PaperQuestion[]) : [];
    return Array.isArray(parsed)
      ? parsed.map((question, index) => ({
          ...question,
          difficulty: normalizePersistedDifficulty(String(question.difficulty)),
          type: normalizePersistedType(String(question.type)),
          paperOrder:
            typeof question.paperOrder === "number" && Number.isFinite(question.paperOrder)
              ? question.paperOrder
              : index + 1,
        }))
      : [];
  } catch {
    return [];
  }
}

function parseAnswers(rawAnswers: string | null | undefined) {
  try {
    const parsed = rawAnswers ? (JSON.parse(rawAnswers) as Record<string, Round1QuestionResponse>) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function parseSubmissionArchive(rawArchive: string | null | undefined) {
  try {
    const parsed = rawArchive
      ? (JSON.parse(rawArchive) as {
          questions?: Round1PaperQuestion[];
          answers?: Record<string, Round1QuestionResponse>;
          essayQuestionScores?: Record<string, number>;
        })
      : null;
    return {
      questions: parseQuestions(JSON.stringify(parsed?.questions ?? [])),
      answers: parsed?.answers && typeof parsed.answers === "object" ? parsed.answers : {},
      essayQuestionScores:
        parsed?.essayQuestionScores && typeof parsed.essayQuestionScores === "object"
          ? Object.fromEntries(
              Object.entries(parsed.essayQuestionScores).filter(
                ([, value]) => typeof value === "number" && Number.isFinite(value),
              ),
            )
          : {},
    };
  } catch {
    return {
      questions: [] as Round1PaperQuestion[],
      answers: {} as Record<string, Round1QuestionResponse>,
      essayQuestionScores: {} as Record<string, number>,
    };
  }
}

function resequenceQuestions(questions: Round1PaperQuestion[], startOrder = 1) {
  return questions.map((question, index) => ({
    ...question,
    paperOrder: startOrder + index,
  }));
}

function createFallbackEssayQuestion(
  id: string,
  index: number,
  paperOrder: number,
  reference?: Round1PaperQuestion,
): Round1PaperQuestion {
  return {
    ...(reference ?? {}),
    id,
    paperOrder,
    prompt:
      reference?.prompt ?? {
        en: `Archived essay question ${index + 1}`,
        vi: `Câu tự luận lưu trữ ${index + 1}`,
      },
    topic: reference?.topic ?? "Essay",
    difficulty: reference?.difficulty ?? "medium",
    type: "essay",
  };
}

function buildLegacyFallbackQuestions(
  objectiveQuestions: Round1PaperQuestion[],
  essayQuestions: Round1PaperQuestion[],
  answers: Record<string, Round1QuestionResponse>,
) {
  const normalizedObjectiveQuestions = resequenceQuestions(
    objectiveQuestions.filter((question) => question.type !== "essay"),
  );
  const essayReferenceQuestions = essayQuestions.filter((question) => question.type === "essay");
  const essayAnswerEntries = Object.entries(answers).filter(([, response]) =>
    Boolean(response?.essayText?.trim()),
  );

  const normalizedEssayQuestions =
    essayAnswerEntries.length > 0
      ? essayAnswerEntries.map(([questionId], index) =>
          createFallbackEssayQuestion(
            questionId,
            index,
            normalizedObjectiveQuestions.length + index + 1,
            essayReferenceQuestions[index],
          ),
        )
      : resequenceQuestions(
          essayReferenceQuestions
            .slice(0, ROUND1_ESSAY_TOTAL)
            .map((question, index) =>
              createFallbackEssayQuestion(
                question.id,
                index,
                normalizedObjectiveQuestions.length + index + 1,
                question,
              ),
            ),
          normalizedObjectiveQuestions.length + 1,
        );

  return [...normalizedObjectiveQuestions, ...normalizedEssayQuestions];
}

async function readFallbackEssayBankQuestions() {
  const activeEssayBank = await prisma.round1TestBank.findFirst({
    where: {
      bankType: Round1TestBankType.ESSAY,
      status: Round1BankStatus.ACTIVE,
    },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
  });

  if (activeEssayBank) {
    return parseQuestions(activeEssayBank.questions);
  }

  const latestEssayBank = await prisma.round1TestBank.findFirst({
    where: {
      bankType: Round1TestBankType.ESSAY,
    },
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
  });

  return parseQuestions(latestEssayBank?.questions);
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

export async function readAdminRound1ExamRows(): Promise<AdminRound1ExamListRow[]> {
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
              },
            },
          },
        },
      },
    },
  });

  const rows = teams
    .filter((team) => team.members.length >= TEAM_MIN_MEMBERS)
    .flatMap((team) =>
      team.members.flatMap<AdminRound1ExamListRow>(({ user }) => {
        if (user.role !== UserRole.STUDENT) {
          return [];
        }

        const attempt = user.round1ExamAttempt;
        const submission = user.round1Submissions[0];

        const archivedSubmission = submission ? parseSubmissionArchive(submission.answers) : null;
        const attemptQuestions = attempt ? parseQuestions(attempt.questions) : [];
        const attemptAnswers = attempt ? parseAnswers(attempt.answers) : {};

        const sourceQuestions = submission ? archivedSubmission?.questions ?? [] : attemptQuestions;
        const sourceAnswers = submission ? archivedSubmission?.answers ?? {} : attemptAnswers;
        const answeredCount = countAnsweredQuestions(sourceQuestions, sourceAnswers);

        return [
          {
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
            detailAvailable: Boolean(submission || attempt),
          },
        ];
      }),
    );

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
  const submissionArchive = submission ? parseSubmissionArchive(submission.answers) : null;
  const attemptQuestions = attempt ? parseQuestions(attempt.questions) : [];
  const attemptAnswers = attempt ? parseAnswers(attempt.answers) : {};
  const sourceAnswers = submission ? submissionArchive?.answers ?? {} : attemptAnswers;
  const essayQuestionScores = submission ? submissionArchive?.essayQuestionScores ?? {} : {};
  let sourceQuestions = submission ? submissionArchive?.questions ?? [] : attemptQuestions;

  if (submission && sourceQuestions.length === 0) {
    const [objectiveBankQuestions, essayBankQuestions] = await Promise.all([
      Promise.resolve(parseQuestions(submission.bank?.questions)),
      readFallbackEssayBankQuestions(),
    ]);
    sourceQuestions = buildLegacyFallbackQuestions(
      objectiveBankQuestions,
      essayBankQuestions,
      sourceAnswers,
    );
  }

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
