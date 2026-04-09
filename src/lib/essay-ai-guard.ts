import { countWords } from "@/lib/round1";
import type { Locale } from "@/types/site";

const EN_TRANSITION_PHRASES = [
  "moreover",
  "furthermore",
  "in addition",
  "therefore",
  "as a result",
  "in conclusion",
  "overall",
  "consequently",
  "in this context",
  "from this perspective",
];

const VI_TRANSITION_PHRASES = [
  "hơn nữa",
  "bên cạnh đó",
  "ngoài ra",
  "do đó",
  "vì vậy",
  "nhìn chung",
  "trong bối cảnh đó",
  "từ góc độ này",
  "đồng thời",
  "từ đó",
];

const EN_TEMPLATE_PHRASES = [
  "it is important to note",
  "plays a crucial role",
  "a comprehensive approach",
  "in order to",
  "not only",
  "this demonstrates",
  "can be considered",
  "the following",
];

const VI_TEMPLATE_PHRASES = [
  "điều quan trọng là",
  "đóng vai trò quan trọng",
  "cách tiếp cận toàn diện",
  "nhằm mục đích",
  "không chỉ",
  "điều này cho thấy",
  "có thể được xem là",
  "như sau",
];

export type EssayAiGuardResult = {
  score: number;
  shouldWarn: boolean;
  reasons: string[];
};

function normalizeText(value: string) {
  return value
    .replace(/\s+/g, " ")
    .trim();
}

function countPhraseHits(text: string, phrases: string[]) {
  return phrases.reduce((total, phrase) => {
    const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const matches = text.match(new RegExp(`\\b${escaped}\\b`, "gi"));
    return total + (matches?.length ?? 0);
  }, 0);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function createReason(locale: Locale, key: "template" | "uniform" | "repeated") {
  switch (key) {
    case "template":
      return locale === "en"
        ? "the answer uses many polished transition or template phrases"
        : "câu trả lời dùng khá nhiều cụm chuyển ý hoặc cụm diễn đạt theo khuôn";
    case "uniform":
      return locale === "en"
        ? "the sentence structure is unusually even and repetitive"
        : "cấu trúc câu đang khá đều và lặp lại bất thường";
    case "repeated":
    default:
      return locale === "en"
        ? "several word patterns repeat too often"
        : "một số cụm từ đang lặp lại quá nhiều";
  }
}

export function estimateEssayAiLikelihood(value: string, locale: Locale): EssayAiGuardResult {
  const normalized = normalizeText(value);
  const wordCount = countWords(normalized);

  if (wordCount < 40) {
    return {
      score: 0,
      shouldWarn: false,
      reasons: [],
    };
  }

  const lowercase = normalized.toLowerCase();
  const sentences = normalized
    .split(/(?<=[.!?…])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
  const words = lowercase.match(/\p{L}[\p{L}\p{N}'’-]*/gu) ?? [];

  const uniqueRatio = words.length > 0 ? new Set(words).size / words.length : 1;
  const sentenceLengths = sentences.map((sentence) => countWords(sentence));
  const averageSentenceLength =
    sentenceLengths.length > 0
      ? sentenceLengths.reduce((total, length) => total + length, 0) / sentenceLengths.length
      : 0;
  const sentenceVariance =
    sentenceLengths.length > 0
      ? sentenceLengths.reduce((total, length) => total + (length - averageSentenceLength) ** 2, 0) /
        sentenceLengths.length
      : 0;
  const sentenceStdDev = Math.sqrt(sentenceVariance);
  const sentenceUniformity =
    averageSentenceLength > 0 ? 1 - clamp(sentenceStdDev / averageSentenceLength, 0, 1) : 0;

  const transitions =
    countPhraseHits(lowercase, EN_TRANSITION_PHRASES) + countPhraseHits(lowercase, VI_TRANSITION_PHRASES);
  const templateHits =
    countPhraseHits(lowercase, EN_TEMPLATE_PHRASES) + countPhraseHits(lowercase, VI_TEMPLATE_PHRASES);

  const bigrams = Array.from({ length: Math.max(words.length - 1, 0) }, (_, index) => `${words[index]} ${words[index + 1]}`);
  const repeatedBigramCount = bigrams.length - new Set(bigrams).size;
  const repeatedBigramRatio = bigrams.length > 0 ? repeatedBigramCount / bigrams.length : 0;

  const sentenceStarts = sentences
    .map((sentence) => (sentence.toLowerCase().match(/\p{L}[\p{L}\p{N}'’-]*/gu) ?? []).slice(0, 2).join(" "))
    .filter(Boolean);
  const repeatedSentenceStarts = sentenceStarts.length - new Set(sentenceStarts).size;

  let score = 0;
  const reasons: string[] = [];

  if (transitions + templateHits >= 3) {
    score += clamp((transitions + templateHits) * 6, 0, 28);
    reasons.push(createReason(locale, "template"));
  }

  if (sentences.length >= 3 && sentenceUniformity >= 0.62 && averageSentenceLength >= 10) {
    score += Math.round(sentenceUniformity * 22);
    reasons.push(createReason(locale, "uniform"));
  }

  if (repeatedBigramRatio >= 0.08 || repeatedSentenceStarts >= 1) {
    score += clamp(Math.round(repeatedBigramRatio * 120) + repeatedSentenceStarts * 8, 0, 24);
    reasons.push(createReason(locale, "repeated"));
  }

  if (uniqueRatio <= 0.52 && wordCount >= 80) {
    score += 12;
    if (!reasons.includes(createReason(locale, "repeated"))) {
      reasons.push(createReason(locale, "repeated"));
    }
  }

  score = clamp(score, 0, 100);

  return {
    score,
    shouldWarn: score >= 50,
    reasons: reasons.slice(0, 3),
  };
}
