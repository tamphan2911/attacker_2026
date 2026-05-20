import type {
  Locale,
  LocalizedText,
  Round1PairingItem,
  Round1Question,
  Round1QuestionDifficulty,
  Round1QuestionOption,
  Round1Submission,
  Round1QuestionType,
  Round1TestBank,
  Round1TestBankType,
} from "@/types/site";
import { normalizeRound1Topics, ROUND1_TOPIC_LIMIT } from "@/lib/round1-topics";

export interface Round1PaperOption extends Round1QuestionOption {
  displayLabel: string;
}

export interface Round1PaperPairingItem extends Round1PairingItem {
  displayLabel: string;
}

export interface Round1PaperQuestion extends Omit<Round1Question, "options" | "pairingItems"> {
  paperOrder: number;
  options?: Round1PaperOption[];
  pairingItems?: Round1PaperPairingItem[];
}

export interface Round1QuestionResponse {
  selectedOptionIds?: string[];
  pairingMatches?: Record<string, string>;
  essayText?: string;
}

export const ROUND1_TOPIC_COUNT = ROUND1_TOPIC_LIMIT;
export const ROUND1_OBJECTIVE_DIFFICULTY_MIX: Record<Round1QuestionDifficulty, number> = {
  easy: 2,
  medium: 2,
  hard: 2,
};
export const ROUND1_OBJECTIVE_QUESTIONS_PER_TOPIC = Object.values(
  ROUND1_OBJECTIVE_DIFFICULTY_MIX,
).reduce((total, count) => total + count, 0);
export const ROUND1_OBJECTIVE_TOTAL = ROUND1_TOPIC_COUNT * ROUND1_OBJECTIVE_QUESTIONS_PER_TOPIC;
export const ROUND1_ESSAY_TOTAL = 2;
export const ROUND1_TOTAL_QUESTIONS = ROUND1_OBJECTIVE_TOTAL + ROUND1_ESSAY_TOTAL;
export const ROUND1_ESSAY_MIN_WORDS = 301;
export const ROUND1_ESSAY_WORD_LIMIT = 500;
export const ROUND1_DURATION_MINUTES = 60;
export const ROUND1_OBJECTIVE_POINT_VALUE = 2;
export const ROUND1_OBJECTIVE_MAX_SCORE = ROUND1_OBJECTIVE_TOTAL * ROUND1_OBJECTIVE_POINT_VALUE;
export const ROUND1_ESSAY_POINT_VALUE = 14;
export const ROUND1_ESSAY_MAX_SCORE = ROUND1_ESSAY_TOTAL * ROUND1_ESSAY_POINT_VALUE;
export const ROUND1_TOTAL_MAX_SCORE = ROUND1_OBJECTIVE_MAX_SCORE + ROUND1_ESSAY_MAX_SCORE;

export const round1QuestionTypeLabels: Record<Round1QuestionType, LocalizedText> = {
  "true-false": { en: "True / False", vi: "Đúng / Sai" },
  "single-choice": { en: "Single choice", vi: "Một đáp án" },
  "multiple-choice": { en: "Multiple choices", vi: "Nhiều đáp án" },
  pairing: { en: "Pairing", vi: "Nối cặp" },
  essay: { en: "Essay", vi: "Tự luận" },
};

const questionVariants: LocalizedText[] = [
  { en: "Scenario set 01", vi: "Bộ tình huống 01" },
  { en: "Scenario set 02", vi: "Bộ tình huống 02" },
  { en: "Scenario set 03", vi: "Bộ tình huống 03" },
  { en: "Scenario set 04", vi: "Bộ tình huống 04" },
  { en: "Scenario set 05", vi: "Bộ tình huống 05" },
  { en: "Scenario set 06", vi: "Bộ tình huống 06" },
  { en: "Scenario set 07", vi: "Bộ tình huống 07" },
  { en: "Scenario set 08", vi: "Bộ tình huống 08" },
  { en: "Scenario set 09", vi: "Bộ tình huống 09" },
  { en: "Scenario set 10", vi: "Bộ tình huống 10" },
];

function shuffleArray<T>(items: T[], random: () => number = Math.random) {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const nextIndex = Math.floor(random() * (index + 1));
    const current = copy[index];
    copy[index] = copy[nextIndex];
    copy[nextIndex] = current;
  }

  return copy;
}

function withVariantSuffix(value: LocalizedText, variantLabel: LocalizedText, variantIndex: number): LocalizedText {
  if (variantIndex === 0) {
    return value;
  }

  return {
    en: `${value.en} (${variantLabel.en})`,
    vi: `${value.vi} (${variantLabel.vi})`,
  };
}

export function pickRound1TypeLabel(locale: Locale, type: Round1QuestionType) {
  return round1QuestionTypeLabels[type][locale];
}

export function pickRound1QuestionText(value?: LocalizedText | null) {
  if (!value) {
    return "";
  }

  return value.vi.trim() || value.en.trim();
}

export type Round1PairingValidationIssue =
  | "missing-structure"
  | "invalid-prompt-or-match"
  | "not-one-to-one";

export function getRound1PairingValidationIssue(
  question: Pick<Round1Question, "type" | "options" | "pairingItems">,
): Round1PairingValidationIssue | null {
  if (question.type !== "pairing") {
    return null;
  }

  const options = question.options ?? [];
  const pairingItems = question.pairingItems ?? [];
  const optionIds = new Set(options.map((option) => option.id).filter(Boolean));

  if (options.length < 2 || pairingItems.length < 2 || optionIds.size !== options.length) {
    return "missing-structure";
  }

  const matchedOptionIds = pairingItems.map((item) => item.correctOptionId).filter(Boolean);
  const uniqueMatchedOptionIds = new Set(matchedOptionIds);

  if (
    pairingItems.some(
      (item) =>
        !item.prompt.en.trim() ||
        !item.prompt.vi.trim() ||
        !optionIds.has(item.correctOptionId),
    )
  ) {
    return "invalid-prompt-or-match";
  }

  if (
    pairingItems.length !== options.length ||
    matchedOptionIds.length !== pairingItems.length ||
    uniqueMatchedOptionIds.size !== matchedOptionIds.length ||
    uniqueMatchedOptionIds.size !== optionIds.size ||
    options.some((option) => !uniqueMatchedOptionIds.has(option.id))
  ) {
    return "not-one-to-one";
  }

  return null;
}

export function getRound1PairingValidationMessage(issue: Round1PairingValidationIssue): LocalizedText {
  if (issue === "missing-structure") {
    return {
      en: "Pairing questions need at least 2 right-side options and 2 left-side prompts.",
      vi: "Câu nối cặp cần ít nhất 2 lựa chọn bên phải và 2 prompt bên trái.",
    };
  }

  if (issue === "invalid-prompt-or-match") {
    return {
      en: "Each left-side prompt must include content and choose a valid correct match.",
      vi: "Mỗi prompt bên trái cần có nội dung và chọn một đáp án ghép cặp hợp lệ.",
    };
  }

  return {
    en: "Pairing questions must be one-to-one: every option must be matched by exactly one left-side prompt, and no option can be used by two or more prompts.",
    vi: "Câu nối cặp phải ghép một-một: mỗi lựa chọn phải được nối với đúng một prompt bên trái, và không lựa chọn nào được dùng cho hai prompt trở lên.",
  };
}

export function getActiveRound1Bank(
  banks: Round1TestBank[],
  bankType: Round1TestBankType,
) {
  return (
    banks.find((bank) => bank.bankType === bankType && bank.status === "active") ??
    banks.find((bank) => bank.bankType === bankType)
  );
}

function cloneQuestionVariant(
  template: Round1Question,
  index: number,
  sourceSize: number,
) {
  const variantIndex = Math.floor(index / sourceSize);
  const variantLabel = questionVariants[variantIndex % questionVariants.length];

  return {
    ...template,
    id: `${template.id}-pool-${String(index + 1).padStart(3, "0")}`,
    prompt: withVariantSuffix(template.prompt, variantLabel, variantIndex),
  };
}

function expandQuestionPool(questions: Round1Question[], targetSize: number, random: () => number = Math.random) {
  if (!questions.length || targetSize <= 0) {
    return [];
  }

  if (questions.length >= targetSize) {
    return shuffleArray(questions, random).slice(0, targetSize);
  }

  return Array.from({ length: targetSize }, (_, index) =>
    cloneQuestionVariant(questions[index % questions.length], index, questions.length),
  );
}

export function buildRound1QuestionPool(bank: Round1TestBank) {
  return expandQuestionPool(bank.questions, bank.questionPoolSize);
}

function createPaperQuestion(
  question: Round1Question,
  questionIndex: number,
  shuffleOptions: boolean,
): Round1PaperQuestion {
  const options = question.options
    ? (shuffleOptions ? shuffleArray(question.options) : [...question.options]).map(
        (option, optionIndex) => ({
          ...option,
          displayLabel: String.fromCharCode(65 + optionIndex),
        }),
      )
    : undefined;

  const pairingItems = question.pairingItems?.map((item, itemIndex) => ({
    ...item,
    displayLabel: String.fromCharCode(65 + itemIndex),
  }));

  return {
    ...question,
    paperOrder: questionIndex + 1,
    options,
    pairingItems,
  };
}

function getRound1Topics(bank: Round1TestBank, configuredTopics: string[] = []) {
  const uniqueTopics = normalizeRound1Topics(configuredTopics).length
    ? normalizeRound1Topics(configuredTopics)
    : normalizeRound1Topics(bank.questions.map((question) => question.topic));

  if (!uniqueTopics.length) {
    return [];
  }

  return Array.from({ length: ROUND1_TOPIC_COUNT }, (_, index) => uniqueTopics[index % uniqueTopics.length]);
}

function pickObjectiveQuestions(
  bank: Round1TestBank,
  topic: string,
  difficulty: Round1QuestionDifficulty,
  count: number,
  random: () => number = Math.random,
) {
  const exactBucket = bank.questions.filter(
    (question) =>
      question.type !== "essay" &&
      question.topic === topic &&
      question.difficulty === difficulty,
  );
  const topicFallback = bank.questions.filter(
    (question) => question.type !== "essay" && question.topic === topic,
  );
  const difficultyFallback = bank.questions.filter(
    (question) => question.type !== "essay" && question.difficulty === difficulty,
  );
  const anyObjective = bank.questions.filter((question) => question.type !== "essay");
  const source =
    exactBucket.length > 0
      ? exactBucket
      : topicFallback.length > 0
        ? topicFallback
        : difficultyFallback.length > 0
          ? difficultyFallback
          : anyObjective;

  return shuffleArray(expandQuestionPool(source, count, random), random).slice(0, count);
}

function pickEssayQuestions(bank: Round1TestBank, count: number, random: () => number = Math.random) {
  const essayQuestions = bank.questions.filter((question) => question.type === "essay");
  return shuffleArray(expandQuestionPool(essayQuestions, count, random), random).slice(0, count);
}

export function createRound1EssayPaperQuestions({
  essayBank,
  count,
  startIndex,
  random,
}: {
  essayBank: Round1TestBank;
  count: number;
  startIndex: number;
  random?: () => number;
}) {
  const pickRandom = random ?? Math.random;
  return pickEssayQuestions(essayBank, count, pickRandom).map((question, index) =>
    createPaperQuestion(question, startIndex + index, false),
  );
}

export function createRound1ExamPaper({
  objectiveBank,
  essayBank,
  topics = [],
  random,
}: {
  objectiveBank: Round1TestBank;
  essayBank: Round1TestBank;
  topics?: string[];
  random?: () => number;
}): Round1PaperQuestion[] {
  const pickRandom = random ?? Math.random;
  const objectiveQuestions = getRound1Topics(objectiveBank, topics).flatMap((topic) =>
    (Object.entries(ROUND1_OBJECTIVE_DIFFICULTY_MIX) as Array<
      [Round1QuestionDifficulty, number]
    >).flatMap(([difficulty, count]) =>
      pickObjectiveQuestions(objectiveBank, topic, difficulty, count, pickRandom),
    ),
  );

  const orderedObjectiveQuestions = objectiveBank.shuffleQuestions
    ? shuffleArray(objectiveQuestions, pickRandom)
    : objectiveQuestions;
  const essayQuestions = createRound1EssayPaperQuestions({
    essayBank,
    count: ROUND1_ESSAY_TOTAL,
    startIndex: ROUND1_OBJECTIVE_TOTAL,
    random: pickRandom,
  });
  const paperQuestions = [
    ...orderedObjectiveQuestions.slice(0, ROUND1_OBJECTIVE_TOTAL),
    ...essayQuestions,
  ];

  return paperQuestions.map((question, questionIndex) =>
    createPaperQuestion(question, questionIndex, objectiveBank.shuffleOptions),
  );
}

export function countWords(value: string) {
  const normalized = value.trim();
  return normalized ? normalized.split(/\s+/).length : 0;
}

export function limitEssayToWordCount(value: string, wordLimit: number) {
  const matches = [...value.matchAll(/\S+/g)];
  if (matches.length <= wordLimit) {
    return value;
  }

  return value.slice(0, matches[wordLimit].index).trimEnd();
}

export function getRound1ObjectiveScore(rightCount: number) {
  return rightCount * ROUND1_OBJECTIVE_POINT_VALUE;
}

export function getRound1TotalScore(submission: Pick<Round1Submission, "objectiveScore" | "essayScore">) {
  return submission.essayScore == null ? null : submission.objectiveScore + submission.essayScore;
}

export function isRound1EssayPending(submission: Pick<Round1Submission, "essayScore" | "totalScore">) {
  return submission.essayScore == null || submission.totalScore == null;
}

export function isRound1QuestionAnswered(
  question: Pick<Round1Question, "type" | "pairingItems">,
  response?: Round1QuestionResponse,
) {
  if (!response) {
    return false;
  }

  switch (question.type) {
    case "true-false":
    case "single-choice":
      return Boolean(response.selectedOptionIds?.[0]);
    case "multiple-choice":
      return Boolean(response.selectedOptionIds?.length);
    case "pairing":
      return Boolean(
        question.pairingItems?.length &&
          response.pairingMatches &&
          question.pairingItems.every((item) => Boolean(response.pairingMatches?.[item.id])),
      );
    case "essay":
      return Boolean(response.essayText?.trim());
    default:
      return false;
  }
}

export function getRound1AnswerSummary(question: Round1Question, locale: Locale) {
  switch (question.type) {
    case "true-false":
    case "single-choice":
    case "multiple-choice": {
      const options = question.options ?? [];
      const labels = (question.correctOptionIds ?? [])
        .map((optionId) => options.find((option) => option.id === optionId)?.label ?? optionId.toUpperCase())
        .join(", ");

      return labels || (locale === "en" ? "No answer key" : "Chưa có đáp án");
    }
    case "pairing":
      return locale === "en"
        ? `${question.pairingItems?.length ?? 0} pairing matches`
        : `${question.pairingItems?.length ?? 0} cặp nối`;
    case "essay":
      return locale === "en"
        ? `Manual review · max ${ROUND1_ESSAY_WORD_LIMIT} words`
        : `Chấm thủ công · tối đa ${ROUND1_ESSAY_WORD_LIMIT} từ`;
    default:
      return "--";
  }
}

export function getRound1QuestionStructureSummary(question: Round1Question, locale: Locale) {
  switch (question.type) {
    case "true-false":
      return locale === "en" ? "2 statements" : "2 lựa chọn";
    case "single-choice":
    case "multiple-choice":
      return locale === "en"
        ? `${question.options?.length ?? 0} answer options`
        : `${question.options?.length ?? 0} đáp án`;
    case "pairing":
      return locale === "en"
        ? `${question.pairingItems?.length ?? 0} prompts / ${question.options?.length ?? 0} matches`
        : `${question.pairingItems?.length ?? 0} vế trái / ${question.options?.length ?? 0} vế phải`;
    case "essay":
      return locale === "en"
        ? `Essay response (max ${ROUND1_ESSAY_WORD_LIMIT} words)`
        : `Câu trả lời tự luận (tối đa ${ROUND1_ESSAY_WORD_LIMIT} từ)`;
    default:
      return "--";
  }
}

export function getRound1QuestionOptionPreview(question: Round1Question, locale: Locale) {
  switch (question.type) {
    case "true-false":
    case "single-choice":
    case "multiple-choice":
      return (question.options ?? [])
        .map((option) => `${option.label}. ${pickRound1QuestionText(option.text)}`)
        .join(" · ");
    case "pairing":
      return locale === "en"
        ? `${question.pairingItems?.length ?? 0} left prompts paired against ${question.options?.length ?? 0} right-side choices`
        : `${question.pairingItems?.length ?? 0} vế trái được nối với ${question.options?.length ?? 0} lựa chọn bên phải`;
    case "essay":
      return (
        pickRound1QuestionText(question.rubricNote) ||
        (locale === "en" ? "Essay rubric" : "Hướng dẫn chấm")
      );
    default:
      return "";
  }
}

export function scoreRound1Question(question: Round1Question, response?: Round1QuestionResponse) {
  switch (question.type) {
    case "true-false":
    case "single-choice": {
      if (!question.correctOptionIds?.[0]) {
        return { autoScored: true, isCorrect: false };
      }

      return {
        autoScored: true,
        isCorrect: response?.selectedOptionIds?.[0] === question.correctOptionIds[0],
      };
    }
    case "multiple-choice": {
      const expected = [...(question.correctOptionIds ?? [])].sort();
      const actual = [...(response?.selectedOptionIds ?? [])].sort();

      return {
        autoScored: true,
        isCorrect: expected.length > 0 && expected.length === actual.length && expected.every((id, index) => id === actual[index]),
      };
    }
    case "pairing": {
      const pairingItems = question.pairingItems ?? [];
      const matches = response?.pairingMatches ?? {};

      return {
        autoScored: true,
        isCorrect:
          pairingItems.length > 0 &&
          pairingItems.every((item) => matches[item.id] === item.correctOptionId),
      };
    }
    case "essay":
      return { autoScored: false, isCorrect: false };
    default:
      return { autoScored: false, isCorrect: false };
  }
}
