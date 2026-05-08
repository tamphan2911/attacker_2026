import { Round1BankStatus, Round1TestBankType, type Round1Submission as DbRound1Submission, type Round1TestBank as DbRound1TestBank } from "@prisma/client";

import {
  ROUND1_ESSAY_MAX_SCORE,
  ROUND1_ESSAY_TOTAL,
  ROUND1_OBJECTIVE_TOTAL,
  createRound1ExamPaper,
  scoreRound1Question,
  type Round1PaperQuestion,
  type Round1QuestionResponse,
} from "@/lib/round1";
import { prisma } from "@/lib/db";
import type { LocalizedText, Round1Question, Round1TestBank as AppRound1TestBank } from "@/types/site";

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
  repaired: boolean;
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

function parseStoredBankQuestions(rawQuestions: string) {
  return parseRound1ArchiveQuestions(rawQuestions) as Round1Question[];
}

function mapStoredBankToAppBank(bank: DbRound1TestBank, bankType: AppRound1TestBank["bankType"]): AppRound1TestBank {
  return {
    id: bank.id,
    bankType,
    title: { en: bank.titleEn, vi: bank.titleVi },
    description: { en: bank.descriptionEn, vi: bank.descriptionVi },
    status: bank.status.toLowerCase() as AppRound1TestBank["status"],
    questionPoolSize: bank.questionPoolSize,
    questionsPerAttempt: bank.questionsPerAttempt,
    shuffleQuestions: bank.shuffleQuestions,
    shuffleOptions: bank.shuffleOptions,
    durationMinutes: bank.durationMinutes,
    wordLimit: bank.wordLimit ?? undefined,
    publishedAt: bank.publishedAt?.toISOString() ?? bank.createdAt.toISOString(),
    questions: parseStoredBankQuestions(bank.questions),
  };
}

function createSeededRandom(seed: string) {
  let hash = 2166136261;
  for (const char of seed) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }

  return () => {
    hash += 0x6d2b79f5;
    let next = hash;
    next = Math.imul(next ^ (next >>> 15), next | 1);
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61);
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}

function isCanonicalRound1Paper(questions: Round1PaperQuestion[]) {
  const objectiveCount = questions.filter((question) => question.type !== "essay").length;
  const essayCount = questions.filter((question) => question.type === "essay").length;
  return questions.length === ROUND1_OBJECTIVE_TOTAL + ROUND1_ESSAY_TOTAL && objectiveCount === ROUND1_OBJECTIVE_TOTAL && essayCount === ROUND1_ESSAY_TOTAL;
}

function createEssayQuestionScores(totalEssayScore: number | null | undefined, essayQuestionIds: string[]) {
  if (typeof totalEssayScore !== "number" || totalEssayScore < 0 || essayQuestionIds.length === 0) {
    return {} as Record<string, number>;
  }

  const clampedTotal = Math.max(0, Math.min(ROUND1_ESSAY_MAX_SCORE, Math.round(totalEssayScore)));
  const scores = new Array(essayQuestionIds.length).fill(Math.floor(clampedTotal / essayQuestionIds.length));
  let remainder = clampedTotal % essayQuestionIds.length;

  for (let index = 0; index < scores.length && remainder > 0; index += 1, remainder -= 1) {
    scores[index] += 1;
  }

  return Object.fromEntries(
    essayQuestionIds.map((questionId, index) => [questionId, Math.min(14, scores[index] ?? 0)]),
  );
}

function createCorrectResponse(question: Round1PaperQuestion): Round1QuestionResponse {
  switch (question.type) {
    case "true-false":
    case "single-choice":
      return { selectedOptionIds: question.correctOptionIds?.[0] ? [question.correctOptionIds[0]] : [] };
    case "multiple-choice":
      return { selectedOptionIds: [...(question.correctOptionIds ?? [])] };
    case "pairing":
      return {
        pairingMatches: Object.fromEntries(
          (question.pairingItems ?? []).map((item) => [item.id, item.correctOptionId]),
        ),
      };
    default:
      return {};
  }
}

function createIncorrectResponse(question: Round1PaperQuestion): Round1QuestionResponse {
  switch (question.type) {
    case "true-false":
    case "single-choice": {
      const correct = question.correctOptionIds?.[0];
      const fallback = (question.options ?? []).find((option) => option.id !== correct)?.id;
      return { selectedOptionIds: fallback ? [fallback] : [] };
    }
    case "multiple-choice": {
      const incorrectOnly = (question.options ?? [])
        .map((option) => option.id)
        .filter((optionId) => !(question.correctOptionIds ?? []).includes(optionId));
      return { selectedOptionIds: incorrectOnly.length > 0 ? [incorrectOnly[0]] : [] };
    }
    case "pairing": {
      const options = (question.options ?? []).map((option) => option.id);
      if (options.length < 2) {
        return { pairingMatches: {} };
      }

      return {
        pairingMatches: Object.fromEntries(
          (question.pairingItems ?? []).map((item, index) => {
            const correctIndex = options.findIndex((optionId) => optionId === item.correctOptionId);
            const shiftedIndex = correctIndex >= 0 ? (correctIndex + index + 1) % options.length : (index + 1) % options.length;
            return [item.id, options[shiftedIndex] ?? options[0]];
          }),
        ),
      };
    }
    default:
      return {};
  }
}

function createEssayAnswerText(question: Round1PaperQuestion, submissionId: string, answerIndex: number): string {
  const topic = question.topic || "Fintech";
  const viPrompt = (question.prompt as LocalizedText | undefined)?.vi ?? "";
  return [
    `Bai tra loi mau duoc tao cho submission ${submissionId}.`,
    `Chu de: ${topic}.`,
    viPrompt ? `Huong tiep can: ${viPrompt}` : "Huong tiep can: neu ro van de, giai phap va cach do luong.",
    `Y tuong chinh ${answerIndex + 1}: mo ta pain point, giai phap de xuat, va ly do no phu hop voi sinh vien.`,
  ].join(" ");
}

function createPaperEssayQuestion(question: Round1Question, paperOrder: number): Round1PaperQuestion {
  return {
    ...question,
    difficulty: normalizePersistedDifficulty(String(question.difficulty)),
    type: "essay",
    options: question.options?.map((option, optionIndex) => ({
      ...option,
      displayLabel: String.fromCharCode(65 + optionIndex),
    })),
    pairingItems: question.pairingItems?.map((item, itemIndex) => ({
      ...item,
      displayLabel: String.fromCharCode(65 + itemIndex),
    })),
    paperOrder,
  };
}

export function buildRound1SubmissionArchiveFromBanks({
  submissionId,
  objectiveBank,
  essayBank,
  rightCount,
  essayScore,
  existingAnswers = {},
  existingEssayQuestionScores = {},
}: {
  submissionId: string;
  objectiveBank: AppRound1TestBank;
  essayBank: AppRound1TestBank;
  rightCount: number;
  essayScore: number | null | undefined;
  existingAnswers?: Record<string, Round1QuestionResponse>;
  existingEssayQuestionScores?: Record<string, number>;
}) {
  const random = createSeededRandom(submissionId);
  const paper = createRound1ExamPaper({
    objectiveBank,
    essayBank,
    random,
  });

  const objectiveQuestions = paper.filter((question) => question.type !== "essay");
  const generatedEssayQuestions = paper.filter((question) => question.type === "essay");
  const existingEssayQuestionIds = [
    ...new Set([
      ...Object.keys(existingEssayQuestionScores),
      ...Object.entries(existingAnswers)
        .filter(([, response]) => Boolean(response?.essayText?.trim()))
        .map(([questionId]) => questionId),
    ]),
  ];
  const essayQuestionById = new Map(
    essayBank.questions.filter((question) => question.type === "essay").map((question) => [question.id, question]),
  );
  const finalEssayIds = [
    ...existingEssayQuestionIds.filter((questionId) => essayQuestionById.has(questionId)),
    ...generatedEssayQuestions.map((question) => question.id).filter((questionId) => !existingEssayQuestionIds.includes(questionId)),
  ].slice(0, ROUND1_ESSAY_TOTAL);

  const finalEssayQuestions = finalEssayIds.map((questionId, index) =>
    createPaperEssayQuestion(
      essayQuestionById.get(questionId) ?? generatedEssayQuestions[index],
      objectiveQuestions.length + index + 1,
    ),
  );

  const answers: Record<string, Round1QuestionResponse> = {};
  const clampedRightCount = Math.max(0, Math.min(ROUND1_OBJECTIVE_TOTAL, Math.round(rightCount)));

  objectiveQuestions.forEach((question, index) => {
    const existingResponse = existingAnswers[question.id];
    if (existingResponse && scoreRound1Question(question, existingResponse).autoScored) {
      answers[question.id] = existingResponse;
      return;
    }

    answers[question.id] = index < clampedRightCount ? createCorrectResponse(question) : createIncorrectResponse(question);
  });

  finalEssayQuestions.forEach((question, index) => {
    answers[question.id] = existingAnswers[question.id] ?? {
      essayText: createEssayAnswerText(question, submissionId, index),
    };
  });

  const questionScores =
    Object.keys(existingEssayQuestionScores).length === finalEssayQuestions.length
      ? Object.fromEntries(
          finalEssayQuestions.flatMap((question) => {
            const value = existingEssayQuestionScores[question.id];
            return typeof value === "number" && Number.isFinite(value) ? [[question.id, value]] : [];
          }),
        )
      : createEssayQuestionScores(essayScore, finalEssayQuestions.map((question) => question.id));

  return {
    questions: [...objectiveQuestions, ...finalEssayQuestions],
    answers,
    essayQuestionScores: questionScores,
  };
}

type SubmissionArchiveContext = Pick<
  DbRound1Submission,
  "id" | "bankId" | "answers" | "rightCount" | "essayScore"
>;

async function loadObjectiveAndEssayBanks(bankId: string) {
  const [objectiveBank, activeEssayBank, latestEssayBank] = await Promise.all([
    prisma.round1TestBank.findUnique({ where: { id: bankId } }),
    prisma.round1TestBank.findFirst({
      where: { bankType: Round1TestBankType.ESSAY, status: Round1BankStatus.ACTIVE },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    }),
    prisma.round1TestBank.findFirst({
      where: { bankType: Round1TestBankType.ESSAY },
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    }),
  ]);

  return {
    objectiveBank,
    essayBank: activeEssayBank ?? latestEssayBank,
  };
}

export async function ensureRound1SubmissionArchive(
  submission: SubmissionArchiveContext,
): Promise<ResolvedRound1SubmissionArchive> {
  const parsedArchive = parseRound1SubmissionArchiveSync(submission.answers);
  const essayQuestionScores = Object.fromEntries(
    Object.entries(parsedArchive.essayQuestionScores).filter(
      ([, value]) => typeof value === "number" && Number.isFinite(value),
    ),
  );
  const needsCanonicalPaper = !isCanonicalRound1Paper(parsedArchive.questions);
  const needsEssayBreakdown =
    typeof submission.essayScore === "number" &&
    Object.keys(essayQuestionScores).length < ROUND1_ESSAY_TOTAL;

  if (!needsCanonicalPaper && !needsEssayBreakdown) {
    return {
      questions: parsedArchive.questions,
      answers: parsedArchive.answers,
      essayQuestionScores,
      repaired: false,
    };
  }

  const { objectiveBank, essayBank } = await loadObjectiveAndEssayBanks(submission.bankId);
  if (!objectiveBank || !essayBank) {
    return {
      questions: parsedArchive.questions,
      answers: parsedArchive.answers,
      essayQuestionScores,
      repaired: false,
    };
  }

  const rebuiltArchive = buildRound1SubmissionArchiveFromBanks({
    submissionId: submission.id,
    objectiveBank: mapStoredBankToAppBank(objectiveBank, "objective"),
    essayBank: mapStoredBankToAppBank(essayBank, "essay"),
    rightCount: submission.rightCount,
    essayScore: submission.essayScore,
    existingAnswers: parsedArchive.answers,
    existingEssayQuestionScores: essayQuestionScores,
  });

  await prisma.round1Submission.update({
    where: { id: submission.id },
    data: {
      answers: JSON.stringify(rebuiltArchive),
    },
  });

  return {
    ...rebuiltArchive,
    repaired: true,
  };
}

export async function ensureRound1SubmissionArchives<T extends SubmissionArchiveContext>(submissions: T[]) {
  await Promise.all(
    submissions.map(async (submission) => {
      await ensureRound1SubmissionArchive(submission);
    }),
  );
}
