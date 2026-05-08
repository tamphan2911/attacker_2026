import { Round1BankStatus, Round1TestBankType } from "@prisma/client";

import { ROUND1_ESSAY_TOTAL, type Round1PaperQuestion, type Round1QuestionResponse } from "@/lib/round1";
import { prisma } from "@/lib/db";

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

export function parseRound1ArchiveQuestions(rawQuestions: string | null | undefined) {
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

export function parseRound1ArchiveAnswers(rawAnswers: string | null | undefined) {
  try {
    const parsed = rawAnswers ? (JSON.parse(rawAnswers) as Record<string, Round1QuestionResponse>) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export interface ResolvedRound1SubmissionArchive {
  questions: Round1PaperQuestion[];
  answers: Record<string, Round1QuestionResponse>;
  essayQuestionScores: Record<string, number>;
  hasRecoveredEssayQuestions: boolean;
}

export function parseRound1SubmissionArchiveSync(rawArchive: string | null | undefined) {
  try {
    const parsed = rawArchive
      ? (JSON.parse(rawArchive) as {
          questions?: Round1PaperQuestion[];
          answers?: Record<string, Round1QuestionResponse>;
          essayQuestionScores?: Record<string, number>;
        })
      : null;

    return {
      questions: parseRound1ArchiveQuestions(JSON.stringify(parsed?.questions ?? [])),
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

function createFallbackEssayQuestion(
  id: string,
  paperOrder: number,
  reference?: Round1PaperQuestion,
): Round1PaperQuestion {
  return {
    ...(reference ?? {}),
    id,
    paperOrder,
    prompt:
      reference?.prompt ?? {
        en: `Archived essay question ${paperOrder}`,
        vi: `Câu tự luận lưu trữ ${paperOrder}`,
      },
    topic: reference?.topic ?? "Essay",
    difficulty: reference?.difficulty ?? "medium",
    type: "essay",
  };
}

async function readEssayReferenceQuestions() {
  const activeEssayBank = await prisma.round1TestBank.findFirst({
    where: {
      bankType: Round1TestBankType.ESSAY,
      status: Round1BankStatus.ACTIVE,
    },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
  });

  if (activeEssayBank) {
    return parseRound1ArchiveQuestions(activeEssayBank.questions).filter(
      (question) => question.type === "essay",
    );
  }

  const latestEssayBank = await prisma.round1TestBank.findFirst({
    where: {
      bankType: Round1TestBankType.ESSAY,
    },
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
  });

  return parseRound1ArchiveQuestions(latestEssayBank?.questions).filter(
    (question) => question.type === "essay",
  );
}

export async function resolveRound1SubmissionArchive(
  rawArchive: string | null | undefined,
): Promise<ResolvedRound1SubmissionArchive> {
  const { questions, answers, essayQuestionScores } = parseRound1SubmissionArchiveSync(rawArchive);

  const archivedEssayQuestions = questions.filter((question) => question.type === "essay");
  if (archivedEssayQuestions.length > 0) {
    return {
      questions,
      answers,
      essayQuestionScores,
      hasRecoveredEssayQuestions: false,
    };
  }

  const essayReferenceQuestions = await readEssayReferenceQuestions();
  const recoveredEssayQuestionIds = [
    ...new Set([
      ...Object.keys(essayQuestionScores),
      ...Object.entries(answers)
        .filter(([, response]) => Boolean(response?.essayText?.trim()))
        .map(([questionId]) => questionId),
      ...essayReferenceQuestions.slice(0, ROUND1_ESSAY_TOTAL).map((question) => question.id),
    ]),
  ].slice(0, ROUND1_ESSAY_TOTAL);

  if (recoveredEssayQuestionIds.length === 0) {
    return {
      questions,
      answers,
      essayQuestionScores,
      hasRecoveredEssayQuestions: false,
    };
  }

  const archivedObjectiveQuestions = questions.filter((question) => question.type !== "essay");
  const questionReferenceById = new Map(
    essayReferenceQuestions.map((question) => [question.id, question]),
  );
  const recoveredEssayQuestions = recoveredEssayQuestionIds.map((questionId, index) =>
    createFallbackEssayQuestion(
      questionId,
      archivedObjectiveQuestions.length + index + 1,
      questionReferenceById.get(questionId) ?? essayReferenceQuestions[index],
    ),
  );

  return {
    questions: [...archivedObjectiveQuestions, ...recoveredEssayQuestions],
    answers,
    essayQuestionScores,
    hasRecoveredEssayQuestions: true,
  };
}
