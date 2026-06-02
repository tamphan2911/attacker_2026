"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowUpDown,
  CirclePlus,
  Clock3,
  Download,
  Eye,
  Filter,
  ListOrdered,
  ListFilter,
  Save,
  Search,
  Shuffle,
  SquarePen,
  Target,
  Trash2,
  Trophy,
  UserRound,
  UsersRound,
} from "lucide-react";
import * as XLSX from "xlsx";

import { ADMIN_TITLE_ID, useAdminTitleScroll } from "@/components/admin-title-scroll";
import {
  ADMIN_LIST_TABLE_PAGE_SIZE,
  ADMIN_TABLE_PAGE_SIZE,
  AdminTablePagination,
  useAdminTablePagination,
} from "@/components/admin-table-pagination";
import { Round1EditorSelect, Round1QuestionTopicSelect, Round1TopicsManager } from "@/components/admin-round1-topics-manager";
import { useSiteState } from "@/components/providers/site-state-provider";
import { SectionHeading, StatusPill, Surface } from "@/components/site-ui";
import { TEAM_MIN_MEMBERS } from "@/data/site-content";
import {
  canApplyRound1Qualification,
  isRound1ResultAnnouncementReleased,
} from "@/lib/competition";
import {
  ROUND1_ESSAY_TOTAL,
  ROUND1_ESSAY_MAX_SCORE,
  ROUND1_ESSAY_WORD_LIMIT,
  ROUND1_OBJECTIVE_MAX_SCORE,
  ROUND1_OBJECTIVE_TOTAL,
  ROUND1_TOTAL_MAX_SCORE,
  getActiveRound1Bank,
  getRound1AnswerSummary,
  getRound1PairingValidationIssue,
  getRound1PairingValidationMessage,
  getRound1QuestionOptionPreview,
  getRound1QuestionStructureSummary,
  isRound1EssayPending,
  pickRound1QuestionText,
  pickRound1TypeLabel,
} from "@/lib/round1";
import { formatDateLabel } from "@/lib/site";
import type {
  Locale,
  LocalizedText,
  Round1PairingItem,
  Round1Question,
  Round1QuestionOption,
  Round1QuestionType,
  Round1Submission,
  Round1TestBank,
  TeamProfile,
  TimelineItem,
  UserProfile,
} from "@/types/site";

interface MemberResultRow {
  student: UserProfile;
  submission?: Round1Submission;
}

interface TeamResultGroup {
  team: TeamProfile;
  memberRows: MemberResultRow[];
  completedRows: Array<MemberResultRow & { submission: Round1Submission }>;
  scoredRows: Array<MemberResultRow & { submission: Round1Submission & { essayScore: number; totalScore: number } }>;
  averageObjectiveScore: number;
  averageEssayScore: number;
  averageTotalScore: number;
  averageRight: number;
  averageWrong: number;
  hasPendingEssayReview: boolean;
  latestSubmittedAt?: string;
  rank?: number;
}

interface IndividualScoreRow {
  submissionId: string;
  userId: string;
  studentName: string;
  studentLoginId?: string;
  teamId: string;
  teamName: string;
  teamTag: string;
  objectiveScore: number;
  essayScore: number | null;
  totalScore: number | null;
  submittedAt: string;
  reviewStatus: "pending" | "reviewed";
  judgeName?: string;
  judgeLoginId?: string;
  judgeScoredAt?: string;
}

const fieldClassName =
  "theme-placeholder w-full rounded-2xl border theme-border theme-panel px-4 py-3 text-sm theme-text-strong outline-none";

function cn(...values: Array<string | undefined | false>) {
  return values.filter(Boolean).join(" ");
}

const stickyFirstColumnClass = "theme-admin-sticky-cell sticky left-0 z-20";
const stickySecondColumnClass = "theme-admin-sticky-cell sticky z-10";
const stickyThirdColumnClass = "theme-admin-sticky-cell sticky z-10";
const stickyFirstHeadClass = "theme-admin-sticky-head sticky left-0 z-30";
const stickySecondHeadClass = "theme-admin-sticky-head sticky z-20";
const stickyThirdHeadClass = "theme-admin-sticky-head sticky z-20";
const stickyFirstStrongColumnClass = "theme-admin-sticky-cell-strong sticky left-0 z-20";
const stickySecondStrongColumnClass = "theme-admin-sticky-cell-strong sticky z-10";

function cloneRound1Question(question: Round1Question): Round1Question {
  return JSON.parse(JSON.stringify(question)) as Round1Question;
}

function QuestionContentFieldEditor({
  label,
  locale,
  value,
  rows = 3,
  onChange,
}: {
  label: string;
  locale: Locale;
  value: LocalizedText;
  rows?: number;
  onChange: (nextValue: string) => void;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm theme-text-muted">
        {`${label} (${locale === "en" ? "Vietnamese only" : "Chỉ tiếng Việt"})`}
      </span>
      <textarea
        rows={rows}
        value={pickRound1QuestionText(value)}
        onChange={(event) => onChange(event.target.value)}
        className={fieldClassName}
      />
    </label>
  );
}

function createLocalizedEmpty(): LocalizedText {
  return { en: "", vi: "" };
}

function createDefaultEssayPlaceholder(): LocalizedText {
  return {
    en: `Write your answer here. Maximum ${ROUND1_ESSAY_WORD_LIMIT} words.`,
    vi: `Nhập câu trả lời tại đây. Tối đa ${ROUND1_ESSAY_WORD_LIMIT} từ.`,
  };
}

function createRound1Option(id: string, label: string, text?: LocalizedText): Round1QuestionOption {
  return {
    id,
    label,
    text: text ?? createLocalizedEmpty(),
  };
}

function createRound1PairingItem(
  id: string,
  label: string,
  correctOptionId: string,
  prompt?: LocalizedText,
): Round1PairingItem {
  return {
    id,
    label,
    correctOptionId,
    prompt: prompt ?? createLocalizedEmpty(),
  };
}

function createQuestionShapeForType(type: Round1QuestionType, seed?: Partial<Round1Question>): Round1Question {
  const base = {
    id: seed?.id ?? "",
    topic: seed?.topic ?? "",
    difficulty: seed?.difficulty ?? "easy",
    prompt: seed?.prompt ?? createLocalizedEmpty(),
    type,
  } satisfies Pick<Round1Question, "id" | "topic" | "difficulty" | "prompt" | "type">;

  if (type === "true-false") {
    return {
      ...base,
      options: [
        createRound1Option("a", "A", { en: "True", vi: "Đúng" }),
        createRound1Option("b", "B", { en: "False", vi: "Sai" }),
      ],
      correctOptionIds: ["a"],
    };
  }

  if (type === "single-choice") {
    return {
      ...base,
      options: [
        createRound1Option("a", "A"),
        createRound1Option("b", "B"),
        createRound1Option("c", "C"),
        createRound1Option("d", "D"),
      ],
      correctOptionIds: ["a"],
    };
  }

  if (type === "multiple-choice") {
    return {
      ...base,
      options: [
        createRound1Option("a", "A"),
        createRound1Option("b", "B"),
        createRound1Option("c", "C"),
        createRound1Option("d", "D"),
      ],
      correctOptionIds: ["a", "b"],
    };
  }

  if (type === "pairing") {
    return {
      ...base,
      options: [
        createRound1Option("a", "A"),
        createRound1Option("b", "B"),
        createRound1Option("c", "C"),
      ],
      pairingItems: [
        createRound1PairingItem("pair-1", "1", "a"),
        createRound1PairingItem("pair-2", "2", "b"),
        createRound1PairingItem("pair-3", "3", "c"),
      ],
    };
  }

  return {
    ...base,
    rubricNote: createLocalizedEmpty(),
    placeholder: seed?.placeholder ?? createDefaultEssayPlaceholder(),
  };
}

function convertRound1QuestionType(question: Round1Question, nextType: Round1QuestionType): Round1Question {
  const seed: Partial<Round1Question> = {
    id: question.id,
    topic: question.topic,
    difficulty: question.difficulty,
    prompt: question.prompt,
  };

  if (nextType === "true-false") {
    return {
      ...createQuestionShapeForType(nextType, seed),
      correctOptionIds: [question.correctOptionIds?.[0] ?? "a"],
    };
  }

  if (nextType === "single-choice") {
    return {
      ...createQuestionShapeForType(nextType, seed),
      options: (question.options?.slice(0, 4) ?? createQuestionShapeForType(nextType).options)!,
      correctOptionIds: [question.correctOptionIds?.[0] ?? "a"],
    };
  }

  if (nextType === "multiple-choice") {
    return {
      ...createQuestionShapeForType(nextType, seed),
      options: (question.options?.slice(0, 4) ?? createQuestionShapeForType(nextType).options)!,
      correctOptionIds:
        question.correctOptionIds && question.correctOptionIds.length >= 2
          ? question.correctOptionIds
          : ["a", "b"],
    };
  }

  if (nextType === "pairing") {
    return {
      ...createQuestionShapeForType(nextType, seed),
      options: (question.options?.slice(0, 3) ?? createQuestionShapeForType(nextType).options)!,
      pairingItems: question.pairingItems?.length
        ? question.pairingItems
        : createQuestionShapeForType(nextType).pairingItems,
    };
  }

  return {
    ...createQuestionShapeForType("essay", seed),
    rubricNote: question.rubricNote ?? createLocalizedEmpty(),
    placeholder: question.placeholder ?? createDefaultEssayPlaceholder(),
  };
}

function createRound1QuestionDraftForBank(bank: Round1TestBank, topics: string[] = []) {
  const questionType: Round1QuestionType = bank.bankType === "essay" ? "essay" : "single-choice";

  return createQuestionShapeForType(questionType, {
    id: previewNextRound1QuestionId(bank),
    topic: topics[0] ?? bank.questions[0]?.topic ?? "",
    difficulty: bank.bankType === "essay" ? "medium" : "easy",
    prompt: createLocalizedEmpty(),
  });
}

function previewNextRound1QuestionId(bank: Round1TestBank) {
  const prefix = bank.bankType === "essay" ? "r1e-" : "r1q-";
  const nextIndex =
    bank.questions.reduce((highest, question) => {
      const match = question.id.match(new RegExp(`^${prefix}(\\d+)$`, "i"));
      if (!match) {
        return highest;
      }

      const value = Number.parseInt(match[1] ?? "0", 10);
      return Number.isFinite(value) ? Math.max(highest, value) : highest;
    }, 0) + 1;

  return `${prefix}${String(nextIndex).padStart(2, "0")}`;
}

function exportRowsToWorkbook(
  fileName: string,
  sheetName: string,
  rows: Record<string, string | number>[],
) {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, fileName);
}

function getLatestSubmissionMap(submissions: Round1Submission[]) {
  const latestByUserId = new Map<string, Round1Submission>();

  submissions.forEach((submission) => {
    const current = latestByUserId.get(submission.userId);
    if (!current || current.submittedAt < submission.submittedAt) {
      latestByUserId.set(submission.userId, submission);
    }
  });

  return latestByUserId;
}

function buildTeamResultGroups(
  submissions: Round1Submission[],
  teams: TeamProfile[],
  users: UserProfile[],
): TeamResultGroup[] {
  const latestByUserId = getLatestSubmissionMap(submissions);
  const userById = new Map(users.map((user) => [user.id, user]));

  const groups = teams.map((team) => {
    const submissionUserIds = submissions
      .filter((submission) => submission.teamId === team.id)
      .map((submission) => submission.userId);
    const memberIds = [...new Set([...team.memberIds, ...submissionUserIds])];

    const memberRows = memberIds.reduce<MemberResultRow[]>((result, memberId) => {
      const student = userById.get(memberId);
      if (!student) {
        return result;
      }

      const submission = latestByUserId.get(memberId);
      result.push({
        student,
        submission: submission?.teamId === team.id ? submission : undefined,
      });

      return result;
    }, []);

    const completedRows = memberRows.filter(
      (row): row is MemberResultRow & { submission: Round1Submission } => Boolean(row.submission),
    );

    const reviewedRows = completedRows.filter(
      (row): row is MemberResultRow & { submission: Round1Submission & { essayScore: number; totalScore: number } } =>
        row.submission.essayScore != null && row.submission.totalScore != null,
    );
    const averageObjectiveScore = reviewedRows.length
      ? reviewedRows.reduce((total, row) => total + row.submission.objectiveScore, 0) / reviewedRows.length
      : 0;
    const averageEssayScore = reviewedRows.length
      ? reviewedRows.reduce((total, row) => total + row.submission.essayScore, 0) / reviewedRows.length
      : 0;
    const averageTotalScore = reviewedRows.length
      ? reviewedRows.reduce((total, row) => total + row.submission.totalScore, 0) / reviewedRows.length
      : 0;
    const averageRight = reviewedRows.length
      ? reviewedRows.reduce((total, row) => total + row.submission.rightCount, 0) / reviewedRows.length
      : 0;
    const averageWrong = reviewedRows.length
      ? reviewedRows.reduce((total, row) => total + row.submission.wrongCount, 0) / reviewedRows.length
      : 0;
    const hasPendingEssayReview = completedRows.some((row) => isRound1EssayPending(row.submission));
    const latestSubmittedAt = completedRows
      .map((row) => row.submission.submittedAt)
      .sort((left, right) => right.localeCompare(left))[0];

    return {
      team,
      memberRows,
      completedRows,
      scoredRows: reviewedRows,
      averageObjectiveScore,
      averageEssayScore,
      averageTotalScore,
      averageRight,
      averageWrong,
      hasPendingEssayReview,
      latestSubmittedAt,
    };
  });

  const sorted = [...groups].sort((left, right) => {
    if (left.completedRows.length === 0 && right.completedRows.length > 0) {
      return 1;
    }
    if (left.completedRows.length > 0 && right.completedRows.length === 0) {
      return -1;
    }

    const leftReviewed = left.scoredRows.length > 0;
    const rightReviewed = right.scoredRows.length > 0;

    if (leftReviewed && !rightReviewed) {
      return -1;
    }

    if (!leftReviewed && rightReviewed) {
      return 1;
    }

    return (
      (leftReviewed && rightReviewed
        ? right.averageTotalScore - left.averageTotalScore
        : right.averageObjectiveScore - left.averageObjectiveScore) ||
      right.completedRows.length - left.completedRows.length ||
      left.team.name.localeCompare(right.team.name)
    );
  });

  let currentRank = 0;

  return sorted.map((group) => {
    if (group.scoredRows.length === 0) {
      return group;
    }

    currentRank += 1;
    return {
      ...group,
      rank: currentRank,
    };
  });
}

function buildBankExportRows(round1TestBanks: Round1TestBank[]) {
  return round1TestBanks.flatMap((bank) =>
    bank.questions.map((question, index) => ({
      bankId: bank.id,
      bankType: bank.bankType,
      bankTitle: bank.title.en,
      status: bank.status,
      questionPoolSize: bank.questions.length,
      questionsPerAttempt: bank.questionsPerAttempt,
      wordLimit: bank.wordLimit ?? "",
      shuffleQuestions: bank.shuffleQuestions ? "Yes" : "No",
      shuffleOptions: bank.shuffleOptions ? "Yes" : "No",
      previewQuestionOrder: index + 1,
      questionId: question.id,
      topic: question.topic,
      type: pickRound1TypeLabel("en", question.type),
      difficulty: bank.bankType === "essay" ? "" : question.difficulty,
      prompt: question.prompt.en,
      answerKey: getRound1AnswerSummary(question, "en"),
      structure: getRound1QuestionStructureSummary(question, "en"),
      options: getRound1QuestionOptionPreview(question, "en"),
    })),
  );
}

function getBankTypeLabel(locale: Locale, bankType: Round1TestBank["bankType"]) {
  if (bankType === "essay") {
    return locale === "en" ? "Essay bank" : "Ngân hàng tự luận";
  }

  return locale === "en" ? "Objective bank" : "Ngân hàng trắc nghiệm";
}

type BankTopicSummaryRow = {
  topic: string;
  typeLabel: string;
  easyCount: number;
  mediumCount: number;
  hardCount: number;
  totalCount: number;
};

function buildBankTopicSummaryRows(bank: Round1TestBank, locale: Locale) {
  const topicMap = new Map<
    string,
    {
      types: Set<string>;
      easyCount: number;
      mediumCount: number;
      hardCount: number;
    }
  >();

  bank.questions.forEach((question) => {
    const entry = topicMap.get(question.topic) ?? {
      types: new Set<string>(),
      easyCount: 0,
      mediumCount: 0,
      hardCount: 0,
    };

    entry.types.add(pickRound1TypeLabel(locale, question.type));
    if (bank.bankType === "essay") {
      entry.mediumCount += 1;
    } else if (question.difficulty === "easy") {
      entry.easyCount += 1;
    } else if (question.difficulty === "medium") {
      entry.mediumCount += 1;
    } else {
      entry.hardCount += 1;
    }

    topicMap.set(question.topic, entry);
  });

  return [...topicMap.entries()]
    .map<BankTopicSummaryRow>(([topic, entry]) => ({
      topic,
      typeLabel: [...entry.types].join(", "),
      easyCount: entry.easyCount,
      mediumCount: entry.mediumCount,
      hardCount: entry.hardCount,
      totalCount: entry.easyCount + entry.mediumCount + entry.hardCount,
    }))
    .sort((left, right) => createStringCompare(locale)(left.topic, right.topic));
}

type BankPreviewSortKey = "type" | "topic" | "difficulty" | "question" | "answerKey";
type SortDirection = "asc" | "desc";

const BANK_DETAIL_QUERY_KEYS = ["q", "type", "topic", "difficulty", "sort", "dir", "page"];
const ROUND1_QUESTION_TYPE_VALUES: Round1QuestionType[] = [
  "single-choice",
  "multiple-choice",
  "true-false",
  "pairing",
  "essay",
];
const ROUND1_DIFFICULTY_VALUES: Round1Question["difficulty"][] = ["easy", "medium", "hard"];
const BANK_PREVIEW_SORT_KEYS: BankPreviewSortKey[] = ["type", "topic", "difficulty", "question", "answerKey"];

function getInitialBankDetailSearchParams(bankId: string) {
  if (typeof window === "undefined") {
    return new URLSearchParams();
  }

  const currentParams = new URLSearchParams(window.location.search);
  if (BANK_DETAIL_QUERY_KEYS.some((key) => currentParams.has(key))) {
    return currentParams;
  }

  try {
    return new URLSearchParams(
      window.sessionStorage.getItem(`admin-round1-bank-detail:${bankId}`) ?? "",
    );
  } catch {
    return new URLSearchParams();
  }
}

function parseBankQuestionTypeFilter(value: string | null): "all" | Round1QuestionType {
  return ROUND1_QUESTION_TYPE_VALUES.includes(value as Round1QuestionType)
    ? (value as Round1QuestionType)
    : "all";
}

function parseBankDifficultyFilter(value: string | null): "all" | Round1Question["difficulty"] {
  return ROUND1_DIFFICULTY_VALUES.includes(value as Round1Question["difficulty"])
    ? (value as Round1Question["difficulty"])
    : "all";
}

function parseBankPreviewSortKey(value: string | null) {
  return BANK_PREVIEW_SORT_KEYS.includes(value as BankPreviewSortKey)
    ? (value as BankPreviewSortKey)
    : null;
}

function parseBankDetailPage(value: string | null) {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

function createStringCompare(locale: Locale) {
  const collator = new Intl.Collator(locale === "vi" ? "vi-VN" : "en-US", {
    numeric: true,
    sensitivity: "base",
  });

  return (left: string, right: string) => collator.compare(left, right);
}

function getDefaultBankPreviewSortDirection(sortKey: BankPreviewSortKey): SortDirection {
  switch (sortKey) {
    case "difficulty":
      return "asc";
    default:
      return "asc";
  }
}

function truncateQuestionPreview(value: string) {
  const words = value.trim().split(/\s+/).filter(Boolean);
  if (words.length <= 5) {
    return value;
  }

  return `${words.slice(0, 5).join(" ")}...`;
}

function pickRound1DifficultyLabel(locale: Locale, difficulty: Round1Question["difficulty"]) {
  if (locale === "en") {
    return difficulty;
  }

  switch (difficulty) {
    case "easy":
      return "Dễ";
    case "medium":
      return "Trung bình";
    case "hard":
      return "Khó";
    default:
      return difficulty;
  }
}

function SortableTableHeader({
  label,
  active,
  direction,
  onClick,
}: {
  label: string;
  active: boolean;
  direction: SortDirection;
  onClick: () => void;
}) {
  const Icon = active ? (direction === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 transition",
        active ? "theme-text-strong" : "hover:theme-text-strong",
      )}
    >
      <span>{label}</span>
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}

function WaitingEssayScoreBadge({ locale, label }: { locale: Locale; label?: string }) {
  const badgeLabel = label ?? (locale === "en" ? "Waiting for essay score" : "Chờ điểm tự luận");

  return (
    <span className="group relative inline-flex items-center justify-center">
      <span
        title={badgeLabel}
        aria-label={badgeLabel}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-amber-400/30 bg-amber-400/12 text-amber-700 shadow-[0_14px_30px_rgba(245,158,11,0.14)] dark:text-amber-200"
      >
        <UserRound className="h-4 w-4" />
      </span>
      <span className="theme-header-tooltip pointer-events-none absolute left-1/2 top-full z-30 mt-3 -translate-x-1/2 whitespace-nowrap rounded-full px-3 py-1.5 text-[0.68rem] font-semibold opacity-0 transition duration-200 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100">
        {badgeLabel}
      </span>
    </span>
  );
}

function buildIndividualScoreRows(
  submissions: Round1Submission[],
  teams: TeamProfile[],
  users: UserProfile[],
) {
  const latestByUserId = getLatestSubmissionMap(submissions);
  const teamById = new Map(teams.map((team) => [team.id, team]));
  const userById = new Map(users.map((user) => [user.id, user]));

  return Array.from(latestByUserId.values())
    .map<IndividualScoreRow | null>((submission) => {
      const team = teamById.get(submission.teamId);
      const user = userById.get(submission.userId);

      if (!team || !user) {
        return null;
      }

      const judgeReview =
        submission.judgeReviews?.find((review) => review.score != null || review.scoredAt) ??
        submission.judgeReviews?.[0];

      return {
        submissionId: submission.id,
        userId: user.id,
        studentName: user.name,
        studentLoginId: user.loginId,
        teamId: team.id,
        teamName: team.name,
        teamTag: team.tag,
        objectiveScore: submission.objectiveScore,
        essayScore: submission.essayScore,
        totalScore: submission.totalScore,
        submittedAt: submission.submittedAt,
        reviewStatus: isRound1EssayPending(submission) ? "pending" : "reviewed",
        judgeName: judgeReview?.judgeName,
        judgeLoginId: judgeReview?.judgeLoginId,
        judgeScoredAt: judgeReview?.scoredAt,
      };
    })
    .filter((row): row is IndividualScoreRow => Boolean(row))
    .sort((left, right) => {
      const leftReviewed = left.totalScore != null;
      const rightReviewed = right.totalScore != null;

      if (leftReviewed && rightReviewed) {
        return (
          (right.totalScore ?? 0) - (left.totalScore ?? 0) ||
          right.objectiveScore - left.objectiveScore ||
          right.submittedAt.localeCompare(left.submittedAt)
        );
      }

      if (leftReviewed !== rightReviewed) {
        return leftReviewed ? -1 : 1;
      }

      return right.objectiveScore - left.objectiveScore || right.submittedAt.localeCompare(left.submittedAt);
    });
}

function buildTeamScoreExportRows(teamGroups: TeamResultGroup[]) {
  return teamGroups.map((group) => ({
    rank: group.rank ?? "",
    team: group.team.name,
    teamTag: group.team.tag,
    members: group.memberRows.length,
    completedMembers: group.completedRows.length,
    scoredMembers: group.scoredRows.length,
    averageObjectiveScore: group.scoredRows.length ? Number(group.averageObjectiveScore.toFixed(2)) : "",
    averageEssayScore: group.scoredRows.length ? Number(group.averageEssayScore.toFixed(2)) : "",
    averageTotalScore: group.scoredRows.length ? Number(group.averageTotalScore.toFixed(2)) : "",
    latestSubmittedAt: group.latestSubmittedAt ?? "",
    standing: group.scoredRows.length === 0 ? "Waiting for score" : "Reviewed",
  }));
}

function getStandingTone(group: TeamResultGroup): "info" | "success" | "warning" {
  if (group.team.memberIds.length < TEAM_MIN_MEMBERS) {
    return "warning";
  }

  if (!group.rank) {
    if (group.scoredRows.length === 0) {
      return "warning";
    }

    return "info";
  }

  return group.rank <= 50 ? "success" : "info";
}

function getStandingLabel(locale: Locale, group: TeamResultGroup, timelineItems?: TimelineItem[]) {
  if (group.team.memberIds.length < TEAM_MIN_MEMBERS) {
    return locale === "en" ? "Below minimum size" : "Chưa đủ số thành viên";
  }

  if (group.completedRows.length === 0) {
    return locale === "en" ? "Awaiting attempts" : "Đang chờ bài làm";
  }

  if (group.scoredRows.length === 0) {
    return locale === "en" ? "Waiting for essay score" : "Chờ điểm tự luận";
  }

  if (group.completedRows.length < group.memberRows.length || group.hasPendingEssayReview) {
    return locale === "en" ? "Partially scored" : "Đã chấm một phần";
  }

  if ((group.rank ?? Number.POSITIVE_INFINITY) <= 50) {
    if (canApplyRound1Qualification(timelineItems)) {
      return locale === "en" ? "Qualified for Round 2" : "Đủ điều kiện Vòng 2";
    }

    if (isRound1ResultAnnouncementReleased(timelineItems)) {
      return locale === "en" ? "Top 50 confirmed" : "Top 50 chính thức";
    }

    return locale === "en" ? "Top 50 provisional" : "Top 50 tạm thời";
  }

  return locale === "en" ? "Ranked" : "Đã xếp hạng";
}

function MetricCard({
  icon,
  label,
  value,
  note,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <Surface className="px-5 py-5">
      <div className="inline-flex rounded-2xl border theme-border-strong theme-panel-strong p-3">
        {icon}
      </div>
      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.24em] text-sky-200/80">
        {label}
      </p>
      <p className="mt-4 text-4xl font-semibold theme-text-strong">{value}</p>
      {note ? <p className="mt-2 text-sm theme-text-soft">{note}</p> : null}
    </Surface>
  );
}

function NotFoundState({
  title,
  description,
  href,
  actionLabel,
}: {
  title: string;
  description: string;
  href: string;
  actionLabel: string;
}) {
  return (
    <Surface className="px-6 py-6 md:px-8 md:py-8">
      <SectionHeading
        id={ADMIN_TITLE_ID}
        className="scroll-mt-32"
        eyebrow="Admin / Round 1"
        title={title}
        description={description}
      />
      <Link href={href} className="mt-6 inline-flex items-center gap-2 text-sm font-semibold theme-accent">
        <ArrowLeft className="h-4 w-4" />
        {actionLabel}
      </Link>
    </Surface>
  );
}

export function AdminRound1Manager() {
  const { locale, round1TestBanks, currentUser } = useSiteState();
  useAdminTitleScroll();
  const [resetPending, setResetPending] = useState(false);
  const [resetMessage, setResetMessage] = useState<{
    tone: "success" | "warning";
    text: string;
  } | null>(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  const activeObjectiveBank = getActiveRound1Bank(round1TestBanks, "objective");
  const activeEssayBank = getActiveRound1Bank(round1TestBanks, "essay");
  const bankExportRows = buildBankExportRows(round1TestBanks);
  const objectivePoolCount = activeObjectiveBank?.questions.length ?? 0;
  const essayPoolCount = activeEssayBank?.questions.length ?? 0;
  const objectiveTopicRows = activeObjectiveBank
    ? buildBankTopicSummaryRows(activeObjectiveBank, locale)
    : [];
  const essayTopicRows = activeEssayBank
    ? buildBankTopicSummaryRows(activeEssayBank, locale)
    : [];

  const canResetRound1Submissions = currentUser.role === "admin";

  useEffect(() => {
    if (!isResetConfirmOpen || resetPending) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsResetConfirmOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isResetConfirmOpen, resetPending]);

  const handleResetRound1Submissions = async () => {
    setResetPending(true);
    setResetMessage(null);

    try {
      const response = await fetch("/api/admin/round-1/reset", {
        method: "POST",
        credentials: "same-origin",
      });
      const payload = (await response.json().catch(() => null)) as
        | { error?: string; createdSubmissionCount?: number }
        | null;

      if (!response.ok) {
        throw new Error(
          payload?.error ??
            (locale === "en"
              ? "Could not reset Round 1 submissions."
              : "Không thể làm mới dữ liệu bài nộp Vòng 1."),
        );
      }

      setResetMessage({
        tone: "success",
        text:
          locale === "en"
            ? `Round 1 submissions were rebuilt successfully (${payload?.createdSubmissionCount ?? 0} canonical submissions). Reloading...`
            : `Dữ liệu bài nộp Vòng 1 đã được dựng lại thành công (${payload?.createdSubmissionCount ?? 0} bài nộp chuẩn). Đang tải lại...`,
      });

      window.setTimeout(() => {
        window.location.reload();
      }, 900);
    } catch (error) {
      setResetMessage({
        tone: "warning",
        text:
          error instanceof Error
            ? error.message
            : locale === "en"
              ? "Could not reset Round 1 submissions."
              : "Không thể làm mới dữ liệu bài nộp Vòng 1.",
      });
    } finally {
      setResetPending(false);
    }
  };

  return (
    <div className="space-y-8">
      <div id={ADMIN_TITLE_ID} className="scroll-mt-32 space-y-2">
        <p className="theme-eyebrow text-xs font-semibold uppercase tracking-[0.28em]">
          {locale === "en" ? "Admin / Round 1" : "Admin / Vòng 1"}
        </p>
        <h1 className="theme-heading text-3xl font-semibold theme-text-strong md:text-[2.6rem]">
          {locale === "en" ? "Round 1" : "Vòng 1"}
        </h1>
      </div>

      {canResetRound1Submissions ? (
        <Surface className="px-6 py-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] theme-eyebrow">
                {locale === "en" ? "Round 1 reset" : "Làm mới dữ liệu Vòng 1"}
              </p>
              <p className="mt-2 text-sm leading-7 theme-text-muted">
                {locale === "en"
                  ? "Use this once to delete legacy Round 1 submissions, attempts, and judge reviews, then recreate a clean canonical set from the current banks."
                  : "Dùng thao tác này một lần để xóa bài nộp, lượt thi và phiếu chấm Vòng 1 cũ, rồi dựng lại bộ dữ liệu chuẩn từ các bank hiện tại."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setResetMessage(null);
                setIsResetConfirmOpen(true);
              }}
              disabled={resetPending}
              className="theme-button-danger inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-55"
            >
              <Trash2 className={`h-4 w-4 ${resetPending ? "animate-pulse" : ""}`} />
              {locale === "en" ? "Rebuild Round 1 submissions" : "Dựng lại bài nộp Vòng 1"}
            </button>
          </div>
          {resetMessage ? (
            <div className="mt-4">
              <StatusPill tone={resetMessage.tone === "success" ? "success" : "warning"}>
                {resetMessage.text}
              </StatusPill>
            </div>
          ) : null}
        </Surface>
      ) : null}

      {isResetConfirmOpen ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center px-4 py-6">
          <button
            type="button"
            aria-label={locale === "en" ? "Close rebuild confirmation" : "Đóng xác nhận dựng lại"}
            className="absolute inset-0 cursor-default bg-slate-950/55 backdrop-blur-sm"
            onClick={() => {
              if (!resetPending) {
                setIsResetConfirmOpen(false);
              }
            }}
          />
          <div
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-xl overflow-hidden rounded-[2rem] border border-white/20 bg-[var(--panel)] shadow-[0_32px_90px_rgba(15,23,42,0.34)]"
          >
            <div className="border-b theme-border bg-[linear-gradient(135deg,rgba(239,68,68,0.14),rgba(59,130,246,0.08))] px-6 py-5">
              <div className="flex items-start gap-4">
                <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-500/12 text-red-500 ring-1 ring-red-500/20">
                  <Trash2 className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="theme-heading text-xl font-semibold theme-text-strong">
                    {locale === "en" ? "Rebuild Round 1 submissions?" : "Dựng lại bài nộp Vòng 1?"}
                  </p>
                  <p className="mt-2 text-sm leading-6 theme-text-muted">
                    {locale === "en"
                      ? "This deletes existing Round 1 submissions, attempts, and judge reviews, then recreates a clean canonical submission set from the current test banks."
                      : "Thao tác này xóa toàn bộ bài nộp, lượt thi và phiếu chấm Vòng 1 hiện có, rồi tạo lại bộ bài nộp chuẩn từ các test bank hiện tại."}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4 px-6 py-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[1.25rem] border theme-border theme-panel-subtle p-4">
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] theme-eyebrow">
                    {locale === "en" ? "Will be removed" : "Sẽ bị xóa"}
                  </p>
                  <p className="mt-2 text-sm leading-6 theme-text-body">
                    {locale === "en"
                      ? "Submissions, attempts, and judge reviews"
                      : "Bài nộp, lượt thi và phiếu chấm"}
                  </p>
                </div>
                <div className="rounded-[1.25rem] border theme-border theme-panel-subtle p-4">
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] theme-eyebrow">
                    {locale === "en" ? "Will be created" : "Sẽ được tạo lại"}
                  </p>
                  <p className="mt-2 text-sm leading-6 theme-text-body">
                    {locale === "en"
                      ? "Canonical Round 1 submission set"
                      : "Bộ bài nộp Vòng 1 chuẩn"}
                  </p>
                </div>
              </div>

              <div className="rounded-[1.25rem] border border-amber-400/24 bg-amber-400/12 px-4 py-3 text-sm leading-6 text-amber-800 dark:text-amber-100">
                {locale === "en"
                  ? "Use this only when you are intentionally rebuilding the Round 1 dataset."
                  : "Chỉ dùng thao tác này khi bạn thật sự muốn dựng lại dữ liệu Vòng 1."}
              </div>

              {resetMessage?.tone === "warning" ? (
                <div className="rounded-[1.25rem] border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-500">
                  {resetMessage.text}
                </div>
              ) : null}
            </div>

            <div className="flex flex-col-reverse gap-3 border-t theme-border bg-[var(--panel-strong)] px-6 py-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={resetPending}
                onClick={() => setIsResetConfirmOpen(false)}
                className="theme-button-secondary rounded-full border px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
              >
                {locale === "en" ? "Cancel" : "Hủy"}
              </button>
              <button
                type="button"
                disabled={resetPending}
                onClick={() => {
                  void handleResetRound1Submissions();
                }}
                className="theme-button-danger inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Trash2 className={cn("h-4 w-4", resetPending ? "animate-pulse" : "")} />
                {resetPending
                  ? locale === "en"
                    ? "Rebuilding..."
                    : "Đang dựng lại..."
                  : locale === "en"
                    ? "Rebuild submissions"
                    : "Dựng lại bài nộp"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {activeObjectiveBank && activeEssayBank ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <MetricCard
            icon={<ListOrdered className="h-5 w-5 text-emerald-300" />}
            label={locale === "en" ? "Multiple choice pool" : "Kho trắc nghiệm"}
            value={objectivePoolCount.toString()}
            note={
              locale === "en"
                ? "Live questions currently in the multiple-choice bank"
                : "Số câu hiện có trong ngân hàng trắc nghiệm"
            }
          />
          <MetricCard
            icon={<Target className="h-5 w-5 text-cyan-300" />}
            label={locale === "en" ? "Essay pool" : "Kho tự luận"}
            value={essayPoolCount.toString()}
            note={
              locale === "en"
                ? "Live questions currently in the essay bank"
                : "Số câu hiện có trong ngân hàng tự luận"
            }
          />
          <MetricCard
            icon={<Shuffle className="h-5 w-5 text-orange-300" />}
            label={locale === "en" ? "Exam structure" : "Cấu trúc bài thi"}
            value={`${ROUND1_OBJECTIVE_TOTAL} + ${ROUND1_ESSAY_TOTAL}`}
            note={locale === "en" ? "40 multiple-choice + 2 essay" : "40 trắc nghiệm + 2 tự luận"}
          />
        </section>
      ) : null}

      {activeObjectiveBank && activeEssayBank ? (
        <>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() =>
                exportRowsToWorkbook("attacker-2026-round1-banks.xlsx", "Round1Banks", bankExportRows)
              }
              className="rounded-full border theme-border theme-panel px-5 py-3 text-sm font-semibold theme-text-strong"
            >
              <span className="inline-flex items-center gap-2">
                <Download className="h-4 w-4" />
                {locale === "en" ? "Export banks.xlsx" : "Xuất banks.xlsx"}
              </span>
            </button>
          </div>

          <section className="space-y-6">
            {[
              {
                bank: activeObjectiveBank,
                title: locale === "en" ? "Multiple choice test bank" : "Ngân hàng đề trắc nghiệm",
                rows: objectiveTopicRows,
                note:
                  locale === "en"
                    ? `${ROUND1_OBJECTIVE_TOTAL} questions are drawn for each official attempt.`
                    : `${ROUND1_OBJECTIVE_TOTAL} câu được rút cho mỗi lượt thi chính thức.`,
              },
              {
                bank: activeEssayBank,
                title: locale === "en" ? "Essay test bank" : "Ngân hàng đề tự luận",
                rows: essayTopicRows,
                note:
                  locale === "en"
                    ? "1 prompt is drawn from this bank; essay 2 uses the fixed question."
                    : "1 câu được rút từ ngân hàng này; câu tự luận 2 dùng câu cố định.",
              },
            ].map(({ bank, title, rows, note }) => {
              const isEssayBank = bank.bankType === "essay";
              const totals = rows.reduce(
                (result, row) => ({
                  easy: result.easy + row.easyCount,
                  medium: result.medium + row.mediumCount,
                  hard: result.hard + row.hardCount,
                  total: result.total + row.totalCount,
                }),
                { easy: 0, medium: 0, hard: 0, total: 0 },
              );

              return (
                <Surface key={bank.id} className="px-6 py-6 md:px-8 md:py-8">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <StatusPill tone={bank.status === "active" ? "success" : "default"}>
                          {bank.status}
                        </StatusPill>
                        <StatusPill>{getBankTypeLabel(locale, bank.bankType)}</StatusPill>
                        <span className="text-xs uppercase tracking-[0.22em] theme-text-soft">
                          {formatDateLabel(locale, bank.publishedAt)}
                        </span>
                      </div>
                      <p className="theme-heading text-3xl font-semibold theme-text-strong">{title}</p>
                      <p className="text-sm leading-7 theme-text-muted">
                        {note}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <StatusPill>{`${locale === "en" ? "Pool" : "Kho"}: ${bank.questions.length}`}</StatusPill>
                      <StatusPill tone="info">
                        {`${locale === "en" ? "Per attempt" : "Mỗi đề"}: ${
                          bank.bankType === "objective" ? ROUND1_OBJECTIVE_TOTAL : ROUND1_ESSAY_TOTAL
                        }`}
                      </StatusPill>
                      {bank.wordLimit ? (
                        <StatusPill tone="warning">
                          {`${locale === "en" ? "Word limit" : "Giới hạn từ"}: ${bank.wordLimit}`}
                        </StatusPill>
                      ) : null}
	                      <Link
	                        href={`/admin/round-1/banks/${bank.id}/questions/new`}
	                        className="theme-button-secondary inline-flex items-center justify-center gap-2 rounded-full border px-5 py-3 text-sm font-semibold"
	                      >
	                        <CirclePlus className="h-4 w-4" />
	                        {locale === "en" ? "Add question" : "Thêm câu hỏi"}
	                      </Link>
	                      <Link
	                        href={`/admin/round-1/banks/${bank.id}`}
	                        className="theme-button-primary inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
	                      >
                        {locale === "en" ? "Open bank detail" : "Mở chi tiết bank"}
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>

                  <div className="mt-8 overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                      <thead className="border-b theme-border bg-[var(--panel-strong)] theme-text-soft">
                        <tr>
                          {[
                            locale === "en" ? "Topic" : "Chủ đề",
                            locale === "en" ? "Type" : "Loại",
                            ...(isEssayBank
                              ? [locale === "en" ? "Total" : "Tổng số"]
                              : [
                                  locale === "en" ? "Easy" : "Dễ",
                                  locale === "en" ? "Medium" : "Trung bình",
                                  locale === "en" ? "Hard" : "Khó",
                                  locale === "en" ? "Total" : "Tổng số",
                                ]),
                          ].map((label, columnIndex) => (
                            <th
                              key={label}
                              style={
                                columnIndex === 0
                                  ? { left: 0, minWidth: 240 }
                                  : columnIndex === 1
                                    ? { left: 240, minWidth: 160 }
                                    : undefined
                              }
                              className={cn(
                                "px-4 py-3 font-medium",
                                columnIndex === 0 ? stickyFirstHeadClass : "",
                                columnIndex === 1 ? stickySecondHeadClass : "",
                              )}
                            >
                              {label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row) => (
                          <tr key={`${bank.id}-${row.topic}`} className="border-b theme-border last:border-b-0">
                            <td
                              style={{ left: 0, minWidth: 240 }}
                              className={cn("px-4 py-4 font-semibold theme-text-strong", stickyFirstColumnClass)}
                            >
                              {row.topic}
                            </td>
                            <td
                              style={{ left: 240, minWidth: 160 }}
                              className={cn("px-4 py-4 theme-text-body", stickySecondColumnClass)}
                            >
                              {row.typeLabel}
                            </td>
                            {isEssayBank ? null : (
                              <>
                                <td className="px-4 py-4 text-center">
                                  <StatusPill>{row.easyCount}</StatusPill>
                                </td>
                                <td className="px-4 py-4 text-center">
                                  <StatusPill tone="success">{row.mediumCount}</StatusPill>
                                </td>
                                <td className="px-4 py-4 text-center">
                                  <StatusPill tone="warning">{row.hardCount}</StatusPill>
                                </td>
                              </>
                            )}
                            <td className="px-4 py-4 text-center">
                              <StatusPill tone="info">{row.totalCount}</StatusPill>
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-[var(--panel-strong)]">
                          <td
                            style={{ left: 0, minWidth: 240 }}
                            className={cn("px-4 py-4 font-semibold theme-text-strong", stickyFirstStrongColumnClass)}
                          >
                            {locale === "en" ? "Total" : "Tổng cộng"}
                          </td>
                          <td
                            style={{ left: 240, minWidth: 160 }}
                            className={cn("px-4 py-4 theme-text-body", stickySecondStrongColumnClass)}
                          >
                            {locale === "en" ? `${rows.length} topics` : `${rows.length} chủ đề`}
                          </td>
                          {isEssayBank ? null : (
                            <>
                              <td className="px-4 py-4 text-center font-semibold theme-text-strong">{totals.easy}</td>
                              <td className="px-4 py-4 text-center font-semibold theme-text-strong">{totals.medium}</td>
                              <td className="px-4 py-4 text-center font-semibold theme-text-strong">{totals.hard}</td>
                            </>
                          )}
                          <td className="px-4 py-4 text-center font-semibold theme-text-strong">{totals.total}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </Surface>
              );
            })}
          </section>
        </>
      ) : (
        <NotFoundState
          title={locale === "en" ? "No Round 1 bank configured yet." : "Chưa có bank Vòng 1 nào được cấu hình."}
          description={
            locale === "en"
              ? "Seed or create a bank first before reviewing Round 1 delivery settings."
              : "Hãy seed hoặc tạo bank trước khi xem cấu hình phát đề Vòng 1."
          }
          href="/admin"
          actionLabel={locale === "en" ? "Back to admin" : "Quay lại admin"}
        />
      )}

      <Round1TopicsManager />
    </div>
  );
}

export function AdminRound1ScoresManager() {
  const { locale, round1Submissions, teams, timelineItems, users } = useSiteState();
  useAdminTitleScroll();
  const [activeScoreView, setActiveScoreView] = useState<"team" | "individual">("team");

  const teamGroups = useMemo(
    () => buildTeamResultGroups(round1Submissions, teams, users),
    [round1Submissions, teams, users],
  );
  const individualRows = useMemo(
    () => buildIndividualScoreRows(round1Submissions, teams, users),
    [round1Submissions, teams, users],
  );
  const individualExportRows = useMemo(
    () =>
      individualRows.map((row) => ({
        participant: row.studentName,
        loginId: row.studentLoginId ?? "",
        team: row.teamName,
        teamTag: row.teamTag,
        objectiveScore: row.objectiveScore,
        essayScore: row.essayScore ?? "",
        totalScore: row.totalScore ?? "",
        judge: row.judgeName ?? "",
        judgeLoginId: row.judgeLoginId ?? "",
        judgeScoredAt: row.judgeScoredAt ?? "",
        submittedAt: row.submittedAt,
        reviewStatus: row.reviewStatus,
      })),
    [individualRows],
  );
  const teamExportRows = useMemo(() => buildTeamScoreExportRows(teamGroups), [teamGroups]);
  const {
    page: individualPage,
    setPage: setIndividualPage,
    pageCount: individualPageCount,
    startIndex: individualStartIndex,
    paginatedRows: paginatedIndividualRows,
  } = useAdminTablePagination(individualRows, ADMIN_LIST_TABLE_PAGE_SIZE);
  const {
    page: teamPage,
    setPage: setTeamPage,
    pageCount: teamPageCount,
    startIndex: teamStartIndex,
    paginatedRows: paginatedTeamRows,
  } = useAdminTablePagination(teamGroups, ADMIN_LIST_TABLE_PAGE_SIZE);

  return (
    <div className="space-y-8">
      <div id={ADMIN_TITLE_ID} className="scroll-mt-32 space-y-2">
        <p className="theme-eyebrow text-xs font-semibold uppercase tracking-[0.28em]">
          {locale === "en" ? "Admin / Round 1 / Scores" : "Admin / Vòng 1 / Điểm số"}
        </p>
        <h1 className="theme-heading text-3xl font-semibold theme-text-strong md:text-[2.6rem]">
          {locale === "en" ? "Round 1 scores" : "Điểm Vòng 1"}
        </h1>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={<UsersRound className="h-5 w-5 text-cyan-300" />}
          label={locale === "en" ? "Submitted participants" : "Thí sinh đã nộp"}
          value={individualRows.length.toString()}
          note={
            locale === "en"
              ? "Latest official attempt per participant"
              : "Bài làm chính thức mới nhất của từng thí sinh"
          }
        />
        <MetricCard
          icon={<Target className="h-5 w-5 text-emerald-300" />}
          label={locale === "en" ? "Reviewed essays" : "Bài tự luận đã chấm"}
          value={individualRows.filter((row) => row.reviewStatus === "reviewed").length.toString()}
          note={
            locale === "en"
              ? "Essay and total score confirmed"
              : "Đã xác nhận điểm tự luận và tổng điểm"
          }
        />
        <MetricCard
          icon={<Trophy className="h-5 w-5 text-amber-300" />}
          label={locale === "en" ? "Ranked teams" : "Đội đã xếp hạng"}
          value={teamGroups.filter((group) => group.rank).length.toString()}
          note={
            locale === "en"
              ? "Based on reviewed team averages"
              : "Tính theo điểm trung bình đội đã chấm"
          }
        />
        <MetricCard
          icon={<Clock3 className="h-5 w-5 text-orange-300" />}
          label={locale === "en" ? "Teams with attempts" : "Đội đã có bài"}
          value={teamGroups.filter((group) => group.completedRows.length > 0).length.toString()}
          note={
            locale === "en"
              ? "At least one completed member attempt"
              : "Có ít nhất một thành viên đã nộp bài"
          }
        />
      </section>

      <Surface className="px-6 py-6 md:px-8 md:py-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <p className="theme-heading text-2xl font-semibold theme-text-strong">
              {locale === "en" ? "Score table view" : "Chế độ xem bảng điểm"}
            </p>
            <p className="text-sm leading-7 theme-text-muted">
              {locale === "en"
                ? "Switch between the team-average table and the participant-level score table."
                : "Chuyển giữa bảng điểm trung bình theo đội và bảng điểm chi tiết theo từng thí sinh."}
            </p>
          </div>

          <div className="relative inline-grid grid-cols-2 rounded-[1.4rem] border theme-border theme-panel p-1.5">
            <span
              className={cn(
                "pointer-events-none absolute bottom-1.5 top-1.5 w-[calc(50%-0.375rem)] rounded-[1rem] bg-[linear-gradient(135deg,#58c4ff,#418bca,#2d75c5)] shadow-[0_18px_40px_rgba(45,117,197,0.24)] transition-transform duration-300",
                activeScoreView === "team" ? "translate-x-0 left-1.5" : "translate-x-full left-1.5",
              )}
            />
            {[
              {
                id: "team" as const,
                label: locale === "en" ? "Team score" : "Điểm đội",
              },
              {
                id: "individual" as const,
                label: locale === "en" ? "Individual score" : "Điểm cá nhân",
              },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveScoreView(item.id)}
                className={cn(
                  "relative z-10 inline-flex min-w-[152px] items-center justify-center rounded-[1rem] px-4 py-3 text-sm font-semibold transition",
                  activeScoreView === item.id ? "text-white" : "theme-text-muted",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </Surface>

      {activeScoreView === "individual" ? (
      <Surface className="px-6 py-6 md:px-8 md:py-8">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-2">
            <p className="theme-heading text-3xl font-semibold theme-text-strong">
              {locale === "en" ? "Round 1 individual score" : "Điểm cá nhân Vòng 1"}
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              exportRowsToWorkbook(
                "attacker-2026-round1-individual-scores.xlsx",
                "Round1IndividualScores",
                individualExportRows,
              )
            }
            className="rounded-full border theme-border theme-panel px-5 py-3 text-sm font-semibold theme-text-strong"
          >
            <span className="inline-flex items-center gap-2">
              <Download className="h-4 w-4" />
              {locale === "en" ? "Export individual scores" : "Xuất điểm cá nhân"}
            </span>
          </button>
        </div>

        <div className="mt-8 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b theme-border bg-[var(--panel-strong)] theme-text-soft">
              <tr>
                {[
                  "#",
                  locale === "en" ? "Participant" : "Thí sinh",
                  locale === "en" ? "Team" : "Đội thi",
                  locale === "en" ? "Multiple choice score" : "Điểm trắc nghiệm",
                  locale === "en" ? "Essay score" : "Điểm tự luận",
                  locale === "en" ? "Total score" : "Tổng điểm",
                  locale === "en" ? "Judge" : "Giám khảo",
                  locale === "en" ? "Submitted at" : "Thời điểm nộp",
                  locale === "en" ? "Review" : "Chấm điểm",
                  locale === "en" ? "Detail" : "Chi tiết",
                ].map((label, columnIndex) => (
                  <th
                    key={label}
                    style={
                      columnIndex === 0
                        ? { left: 0, width: 72, minWidth: 72 }
                        : columnIndex === 1
                          ? { left: 72, minWidth: 260 }
                          : undefined
                    }
                    className={cn(
                      "px-4 py-3 font-medium",
                      columnIndex === 0 ? stickyFirstHeadClass : "",
                      columnIndex === 1 ? stickySecondHeadClass : "",
                    )}
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedIndividualRows.map((row, index) => (
                <tr key={row.submissionId} className="border-b theme-border last:border-b-0">
                  <td
                    style={{ left: 0, width: 72, minWidth: 72 }}
                    className={cn("px-4 py-4 text-xs font-semibold theme-text-soft", stickyFirstColumnClass)}
                  >
                    {individualStartIndex + index + 1}
                  </td>
                  <td
                    style={{ left: 72, minWidth: 260 }}
                    className={cn("px-4 py-4", stickySecondColumnClass)}
                  >
                    <Link href={`/admin/users/${row.userId}/profile`} className="font-semibold theme-accent">
                      {row.studentName}
                    </Link>
                    <p className="mt-1 text-xs theme-text-soft">{row.studentLoginId || row.userId}</p>
                  </td>
                  <td className="px-4 py-4">
                    <Link href={`/admin/teams/${row.teamId}`} className="font-semibold theme-accent">
                      {row.teamName}
                    </Link>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <StatusPill
                      tone={
                        row.objectiveScore >= ROUND1_OBJECTIVE_MAX_SCORE * 0.8
                          ? "success"
                          : row.objectiveScore > 0
                            ? "info"
                            : "warning"
                      }
                    >
                      {`${row.objectiveScore.toFixed(2)} / ${ROUND1_OBJECTIVE_MAX_SCORE}`}
                    </StatusPill>
                  </td>
                  <td className="px-4 py-4 text-center">
                    {row.essayScore == null ? (
                      <WaitingEssayScoreBadge locale={locale} />
                    ) : (
                      <StatusPill tone="info">{`${row.essayScore.toFixed(2)} / ${ROUND1_ESSAY_MAX_SCORE}`}</StatusPill>
                    )}
                  </td>
                  <td className="px-4 py-4 text-center">
                    {row.totalScore == null ? (
                      <WaitingEssayScoreBadge locale={locale} />
                    ) : (
                      <StatusPill
                        tone={row.totalScore >= 80 ? "success" : row.totalScore >= 65 ? "info" : "warning"}
                      >
                        {`${row.totalScore.toFixed(2)} / ${ROUND1_TOTAL_MAX_SCORE}`}
                      </StatusPill>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    {row.judgeName ? (
                      <div className="space-y-1">
                        <p className="font-semibold theme-text-strong">{row.judgeName}</p>
                        <p className="text-xs theme-text-soft">
                          {row.judgeScoredAt
                            ? locale === "en"
                              ? `Scored ${formatDateLabel(locale, row.judgeScoredAt)}`
                              : `Đã chấm ${formatDateLabel(locale, row.judgeScoredAt)}`
                            : locale === "en"
                              ? "Assigned, pending score"
                              : "Đã phân công, chờ chấm"}
                        </p>
                      </div>
                    ) : (
                      <StatusPill tone="warning">{locale === "en" ? "Not assigned" : "Chưa phân công"}</StatusPill>
                    )}
                  </td>
                  <td className="px-4 py-4 theme-text-body">{formatDateLabel(locale, row.submittedAt)}</td>
                  <td className="px-4 py-4 text-center">
                    <StatusPill tone={row.reviewStatus === "reviewed" ? "success" : "warning"}>
                      {row.reviewStatus === "reviewed"
                        ? locale === "en"
                          ? "Reviewed"
                          : "Đã chấm"
                        : locale === "en"
                          ? "Essay pending"
                          : "Chờ chấm tự luận"}
                    </StatusPill>
                  </td>
                  <td className="px-4 py-4">
                    <Link
                      href={`/admin/round-1/exams/${row.userId}`}
                      className="inline-flex items-center gap-2 rounded-full border theme-border theme-panel px-4 py-2 text-xs font-semibold theme-text-strong"
                    >
                      {locale === "en" ? "Open detail" : "Mở chi tiết"}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <AdminTablePagination
          locale={locale}
          page={individualPage}
          pageCount={individualPageCount}
          pageSize={ADMIN_LIST_TABLE_PAGE_SIZE}
          totalRows={individualRows.length}
          onPageChange={setIndividualPage}
        />
      </Surface>
      ) : null}

      {activeScoreView === "team" ? (
      <Surface className="px-6 py-6 md:px-8 md:py-8">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-2">
            <p className="theme-heading text-3xl font-semibold theme-text-strong">
              {locale === "en" ? "Round 1 team score" : "Điểm đội Vòng 1"}
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              exportRowsToWorkbook(
                "attacker-2026-round1-team-scores.xlsx",
                "Round1TeamScores",
                teamExportRows,
              )
            }
            className="rounded-full border theme-border theme-panel px-5 py-3 text-sm font-semibold theme-text-strong"
          >
            <span className="inline-flex items-center gap-2">
              <Download className="h-4 w-4" />
              {locale === "en" ? "Export team scores" : "Xuất điểm đội"}
            </span>
          </button>
        </div>

        <div className="mt-8 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b theme-border bg-[var(--panel-strong)] theme-text-soft">
              <tr>
                {[
                  "#",
                  locale === "en" ? "Rank" : "Hạng",
                  locale === "en" ? "Team" : "Đội",
                  locale === "en" ? "Scored" : "Đã chấm",
                  locale === "en" ? "Objective avg" : "TB trắc nghiệm",
                  locale === "en" ? "Essay avg" : "TB tự luận",
                  locale === "en" ? "Total avg" : "TB tổng",
                  locale === "en" ? "Latest activity" : "Cập nhật gần nhất",
                  locale === "en" ? "Standing" : "Trạng thái",
                  locale === "en" ? "Detail" : "Chi tiết",
                ].map((label, columnIndex) => (
                  <th
                    key={label}
                    style={
                      columnIndex === 0
                        ? { left: 0, width: 72, minWidth: 72 }
                        : columnIndex === 1
                          ? { left: 72, minWidth: 96 }
                          : columnIndex === 2
                            ? { left: 168, minWidth: 260 }
                            : undefined
                    }
                    className={cn(
                      "px-4 py-3 font-medium",
                      columnIndex === 0 ? stickyFirstHeadClass : "",
                      columnIndex === 1 ? stickySecondHeadClass : "",
                      columnIndex === 2 ? stickyThirdHeadClass : "",
                    )}
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedTeamRows.map((group, index) => (
                <tr key={group.team.id} className="border-b theme-border last:border-b-0">
                  <td
                    style={{ left: 0, width: 72, minWidth: 72 }}
                    className={cn("px-4 py-4 text-xs font-semibold theme-text-soft", stickyFirstColumnClass)}
                  >
                    {teamStartIndex + index + 1}
                  </td>
                  <td
                    style={{ left: 72, minWidth: 96 }}
                    className={cn("px-4 py-4 theme-text-body", stickySecondColumnClass)}
                  >
                    {group.rank ?? "-"}
                  </td>
                  <td
                    style={{ left: 168, minWidth: 260 }}
                    className={cn("px-4 py-4", stickyThirdColumnClass)}
                  >
                    <Link href={`/admin/teams/${group.team.id}`} className="font-semibold theme-accent">
                      {group.team.name}
                    </Link>
                  </td>
                  <td className="px-4 py-4 theme-text-body">
                    {group.scoredRows.length}/{group.memberRows.length}
                  </td>
                  <td className="px-4 py-4 text-center">
                    {group.scoredRows.length === 0 ? (
                      <WaitingEssayScoreBadge
                        locale={locale}
                        label={locale === "en" ? "Waiting for score" : "Chờ điểm"}
                      />
                    ) : (
                      <StatusPill
                        tone={
                          group.averageObjectiveScore >= ROUND1_OBJECTIVE_MAX_SCORE * 0.8
                            ? "success"
                            : group.averageObjectiveScore > 0
                              ? "info"
                              : "warning"
                        }
                      >
                        {`${group.averageObjectiveScore.toFixed(2)} / ${ROUND1_OBJECTIVE_MAX_SCORE}`}
                      </StatusPill>
                    )}
                  </td>
                  <td className="px-4 py-4 text-center">
                    {group.scoredRows.length === 0 ? (
                      <WaitingEssayScoreBadge
                        locale={locale}
                        label={locale === "en" ? "Waiting for score" : "Chờ điểm"}
                      />
                    ) : (
                      <StatusPill tone="info">{`${group.averageEssayScore.toFixed(2)} / ${ROUND1_ESSAY_MAX_SCORE}`}</StatusPill>
                    )}
                  </td>
                  <td className="px-4 py-4 text-center">
                    {group.scoredRows.length === 0 ? (
                      <WaitingEssayScoreBadge
                        locale={locale}
                        label={locale === "en" ? "Waiting for score" : "Chờ điểm"}
                      />
                    ) : (
                      <StatusPill
                        tone={
                          group.averageTotalScore >= 80
                            ? "success"
                            : group.averageTotalScore >= 65
                              ? "info"
                              : "warning"
                        }
                      >
                        {`${group.averageTotalScore.toFixed(2)} / ${ROUND1_TOTAL_MAX_SCORE}`}
                      </StatusPill>
                    )}
                  </td>
                  <td className="px-4 py-4 theme-text-body">
                    {group.latestSubmittedAt ? formatDateLabel(locale, group.latestSubmittedAt) : "--"}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <StatusPill tone={getStandingTone(group)}>
                      {getStandingLabel(locale, group, timelineItems)}
                    </StatusPill>
                  </td>
                  <td className="px-4 py-4">
                    <Link
                      href={`/admin/round-1/scores/${group.team.id}`}
                      className="inline-flex items-center gap-2 rounded-full border theme-border theme-panel px-4 py-2 text-xs font-semibold theme-text-strong"
                    >
                      {locale === "en" ? "Open detail" : "Mở chi tiết"}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <AdminTablePagination
          locale={locale}
          page={teamPage}
          pageCount={teamPageCount}
          pageSize={ADMIN_LIST_TABLE_PAGE_SIZE}
          totalRows={teamGroups.length}
          onPageChange={setTeamPage}
        />
      </Surface>
      ) : null}
    </div>
  );
}

export function AdminRound1BankDetail({ bankId }: { bankId: string }) {
  const { locale, round1TestBanks, deleteRound1QuestionByAdmin, updateRound1FixedEssayPromptByAdmin } = useSiteState();
  useAdminTitleScroll();
  const bank = round1TestBanks.find((item) => item.id === bankId);
  const questionList = useMemo(() => bank?.questions ?? [], [bank]);
  const isEssayBank = bank?.bankType === "essay";
  const initialQueryRef = useRef<URLSearchParams | null>(null);
  if (!initialQueryRef.current) {
    initialQueryRef.current = getInitialBankDetailSearchParams(bankId);
  }
  const [questionSearch, setQuestionSearch] = useState(() => initialQueryRef.current?.get("q") ?? "");
  const [typeFilter, setTypeFilter] = useState<"all" | Round1QuestionType>(() =>
    parseBankQuestionTypeFilter(initialQueryRef.current?.get("type") ?? null),
  );
  const [topicFilter, setTopicFilter] = useState(() => initialQueryRef.current?.get("topic") ?? "all");
  const [difficultyFilter, setDifficultyFilter] = useState<"all" | Round1Question["difficulty"]>(() =>
    parseBankDifficultyFilter(initialQueryRef.current?.get("difficulty") ?? null),
  );
  const [sortKey, setSortKey] = useState<BankPreviewSortKey | null>(() =>
    parseBankPreviewSortKey(initialQueryRef.current?.get("sort") ?? null),
  );
  const [sortDirection, setSortDirection] = useState<SortDirection>(() =>
    initialQueryRef.current?.get("dir") === "desc" ? "desc" : "asc",
  );
  const [deletePendingQuestionId, setDeletePendingQuestionId] = useState<string | null>(null);
  const [pendingDeleteQuestion, setPendingDeleteQuestion] = useState<Round1Question | null>(null);
  const [deleteQuestionError, setDeleteQuestionError] = useState("");
  const [fixedEssayPromptDraft, setFixedEssayPromptDraft] = useState<LocalizedText>({
    en: bank?.fixedEssayPrompt?.en ?? "",
    vi: bank?.fixedEssayPrompt?.vi ?? "",
  });
  const [isSavingFixedEssayPrompt, setIsSavingFixedEssayPrompt] = useState(false);
  const [fixedEssayPromptError, setFixedEssayPromptError] = useState("");
  const didMountFilterStateRef = useRef(false);

  const bankExportRows = bank ? buildBankExportRows([bank]) : [];
  const topicOptions = useMemo(
    () => [...new Set(questionList.map((question) => question.topic))].sort(createStringCompare(locale)),
    [questionList, locale],
  );
  const filteredQuestions = useMemo(
    () =>
      questionList.filter((question) => {
        const searchSource = [
          question.id,
          pickRound1TypeLabel(locale, question.type),
          question.topic,
          ...(isEssayBank ? [] : [question.difficulty]),
          pickRound1QuestionText(question.prompt),
          getRound1AnswerSummary(question, locale),
          getRound1QuestionOptionPreview(question, locale),
        ].join(" ");

        if (questionSearch.trim() && !searchSource.toLowerCase().includes(questionSearch.trim().toLowerCase())) {
          return false;
        }

        if (typeFilter !== "all" && question.type !== typeFilter) {
          return false;
        }

        if (topicFilter !== "all" && question.topic !== topicFilter) {
          return false;
        }

        if (!isEssayBank && difficultyFilter !== "all" && question.difficulty !== difficultyFilter) {
          return false;
        }

        return true;
      }),
    [difficultyFilter, isEssayBank, locale, questionList, questionSearch, topicFilter, typeFilter],
  );
  const sortedQuestions = useMemo(() => {
    if (!sortKey) {
      return filteredQuestions;
    }

    const compareStrings = createStringCompare(locale);
    const difficultyRank: Record<Round1Question["difficulty"], number> = {
      easy: 1,
      medium: 2,
      hard: 3,
    };

    return [...filteredQuestions].sort((left, right) => {
      let comparison = 0;

      switch (sortKey) {
        case "type":
          comparison = compareStrings(pickRound1TypeLabel(locale, left.type), pickRound1TypeLabel(locale, right.type));
          break;
        case "topic":
          comparison = compareStrings(left.topic, right.topic);
          break;
        case "difficulty":
          comparison = difficultyRank[left.difficulty] - difficultyRank[right.difficulty];
          break;
        case "question":
          comparison = compareStrings(pickRound1QuestionText(left.prompt), pickRound1QuestionText(right.prompt));
          break;
        case "answerKey":
          comparison = compareStrings(getRound1AnswerSummary(left, locale), getRound1AnswerSummary(right, locale));
          break;
      }

      if (comparison === 0) {
        comparison = compareStrings(left.topic, right.topic);
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [filteredQuestions, locale, sortDirection, sortKey]);
  const {
    page,
    setPage,
    pageCount,
    startIndex,
    paginatedRows,
  } = useAdminTablePagination(
    sortedQuestions,
    ADMIN_LIST_TABLE_PAGE_SIZE,
    parseBankDetailPage(initialQueryRef.current?.get("page") ?? null),
  );

  useEffect(() => {
    if (!didMountFilterStateRef.current) {
      didMountFilterStateRef.current = true;
      return;
    }

    setPage(1);
  }, [difficultyFilter, questionSearch, setPage, sortDirection, sortKey, topicFilter, typeFilter]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const trimmedSearch = questionSearch.trim();

    if (trimmedSearch) {
      params.set("q", trimmedSearch);
    } else {
      params.delete("q");
    }

    if (typeFilter === "all") {
      params.delete("type");
    } else {
      params.set("type", typeFilter);
    }

    if (topicFilter === "all") {
      params.delete("topic");
    } else {
      params.set("topic", topicFilter);
    }

    if (isEssayBank || difficultyFilter === "all") {
      params.delete("difficulty");
    } else {
      params.set("difficulty", difficultyFilter);
    }

    if (sortKey) {
      params.set("sort", sortKey);
      params.set("dir", sortDirection);
    } else {
      params.delete("sort");
      params.delete("dir");
    }

    if (page > 1) {
      params.set("page", page.toString());
    } else {
      params.delete("page");
    }

    const nextSearch = params.toString();
    const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ""}`;
    const currentUrl = `${window.location.pathname}${window.location.search}`;

    try {
      window.sessionStorage.setItem(`admin-round1-bank-detail:${bankId}`, nextSearch);
    } catch {
      // Session storage is only a convenience for returning from editor pages.
    }

    if (nextUrl !== currentUrl) {
      window.history.replaceState(window.history.state, "", nextUrl);
    }
  }, [
    bankId,
    difficultyFilter,
    isEssayBank,
    page,
    questionSearch,
    sortDirection,
    sortKey,
    topicFilter,
    typeFilter,
  ]);

  useEffect(() => {
    if (!pendingDeleteQuestion || deletePendingQuestionId) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setPendingDeleteQuestion(null);
        setDeleteQuestionError("");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [deletePendingQuestionId, pendingDeleteQuestion]);

  useEffect(() => {
    if (!bank || !isEssayBank || isSavingFixedEssayPrompt) {
      return;
    }

    setFixedEssayPromptDraft({
      en: bank.fixedEssayPrompt?.en ?? "",
      vi: bank.fixedEssayPrompt?.vi ?? "",
    });
  }, [bank, isEssayBank, isSavingFixedEssayPrompt]);

  const toggleSort = (nextSortKey: BankPreviewSortKey) => {
    if (sortKey === nextSortKey) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(nextSortKey);
    setSortDirection(getDefaultBankPreviewSortDirection(nextSortKey));
  };

  const handleDeleteQuestion = async () => {
    if (!bank || !pendingDeleteQuestion) {
      return;
    }

    const questionId = pendingDeleteQuestion.id;

    setDeletePendingQuestionId(questionId);
    setDeleteQuestionError("");

    try {
      const deleted = await deleteRound1QuestionByAdmin(bank.id, questionId);
      if (deleted) {
        setPendingDeleteQuestion(null);
        return;
      }

      setDeleteQuestionError(
        locale === "en"
          ? "Could not delete this question. Please review the latest admin data and try again."
          : "Không thể xóa câu hỏi này. Vui lòng kiểm tra dữ liệu admin mới nhất và thử lại.",
      );
    } finally {
      setDeletePendingQuestionId((current) =>
        current === questionId ? null : current,
      );
    }
  };

  const handleSaveFixedEssayPrompt = async () => {
    if (!bank || !isEssayBank) {
      return;
    }

    if (!fixedEssayPromptDraft.en.trim() && !fixedEssayPromptDraft.vi.trim()) {
      setFixedEssayPromptError(
        locale === "en"
          ? "Enter the fixed second essay question content before saving."
          : "Vui lòng nhập nội dung câu tự luận cố định số 2 trước khi lưu.",
      );
      return;
    }

    setIsSavingFixedEssayPrompt(true);
    setFixedEssayPromptError("");
    const saved = await updateRound1FixedEssayPromptByAdmin(bank.id, fixedEssayPromptDraft);
    if (!saved) {
      setFixedEssayPromptError(
        locale === "en"
          ? "Could not save the fixed second essay question. Please check the latest admin data and try again."
          : "Không thể lưu câu tự luận cố định số 2. Vui lòng kiểm tra dữ liệu admin mới nhất và thử lại.",
      );
    }
    setIsSavingFixedEssayPrompt(false);
  };

  if (!bank) {
    return (
      <NotFoundState
        title={locale === "en" ? "Round 1 bank not found." : "Không tìm thấy bank Vòng 1."}
        description={
          locale === "en"
            ? "This bank may not exist in the current browser dataset."
            : "Bank này có thể không tồn tại trong bộ dữ liệu hiện tại của trình duyệt."
        }
        href="/admin/round-1"
        actionLabel={locale === "en" ? "Back to Round 1" : "Quay lại Vòng 1"}
      />
    );
  }

  const bankDetailTitle =
    bank.bankType === "objective"
      ? locale === "en"
        ? "Multiple choice test bank"
        : "Ngân hàng đề trắc nghiệm"
      : locale === "en"
        ? "Essay test bank"
        : "Ngân hàng đề tự luận";

  return (
    <div className="space-y-8">
      <Link href="/admin/round-1" className="inline-flex items-center gap-2 text-sm font-semibold theme-accent">
        <ArrowLeft className="h-4 w-4" />
        {locale === "en" ? "Back to Round 1" : "Quay lại Vòng 1"}
      </Link>

      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <SectionHeading
          id={ADMIN_TITLE_ID}
          className="scroll-mt-32"
          eyebrow={locale === "en" ? "Admin / Round 1 / Test bank" : "Admin / Vòng 1 / Test bank"}
          title={bankDetailTitle}
        />
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/admin/round-1/banks/${bank.id}/questions/new`}
            className="theme-button-primary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
          >
            <CirclePlus className="h-4 w-4" />
            {locale === "en" ? "Add question" : "Thêm câu hỏi"}
          </Link>
          <button
            type="button"
            onClick={() =>
              exportRowsToWorkbook("attacker-2026-round1-bank-detail.xlsx", "Round1Bank", bankExportRows)
            }
            className="rounded-full border theme-border theme-panel px-5 py-3 text-sm font-semibold theme-text-strong"
          >
            <span className="inline-flex items-center gap-2">
              <Download className="h-4 w-4" />
              {locale === "en" ? "Export bank detail" : "Xuất chi tiết bank"}
            </span>
          </button>
        </div>
      </div>

      {isEssayBank ? (
        <Surface className="px-6 py-6 md:px-8 md:py-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] theme-eyebrow">
                {locale === "en" ? "Fixed essay question" : "Câu tự luận cố định"}
              </p>
              <h2 className="mt-2 text-xl font-semibold theme-text-strong">
                {locale === "en" ? "Second essay question for every Round 1 test" : "Câu tự luận số 2 cho mọi bài thi Vòng 1"}
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-7 theme-text-muted">
                {locale === "en"
                  ? "The first essay is still randomized from the essay bank below. The second essay always uses this fixed content."
                  : "Câu tự luận đầu tiên vẫn được rút ngẫu nhiên từ ngân hàng bên dưới. Câu tự luận thứ hai luôn dùng nội dung cố định này."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void handleSaveFixedEssayPrompt()}
              disabled={isSavingFixedEssayPrompt}
              className="theme-button-primary inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {isSavingFixedEssayPrompt
                ? locale === "en"
                  ? "Saving..."
                  : "Đang lưu..."
                : locale === "en"
                  ? "Save fixed question"
                  : "Lưu câu cố định"}
            </button>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.22em] theme-text-soft">
                {locale === "en" ? "Question content (English)" : "Nội dung câu hỏi (English)"}
              </span>
              <textarea
                rows={6}
                value={fixedEssayPromptDraft.en}
                onChange={(event) =>
                  setFixedEssayPromptDraft((current) => ({ ...current, en: event.target.value }))
                }
                className="theme-placeholder w-full rounded-2xl border theme-border theme-panel px-4 py-3 text-sm leading-7 theme-text-strong outline-none"
                placeholder={locale === "en" ? "Enter the fixed second essay question..." : "Nhập câu tự luận cố định số 2..."}
              />
            </label>
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.22em] theme-text-soft">
                {locale === "en" ? "Question content (Vietnamese)" : "Nội dung câu hỏi (Tiếng Việt)"}
              </span>
              <textarea
                rows={6}
                value={fixedEssayPromptDraft.vi}
                onChange={(event) =>
                  setFixedEssayPromptDraft((current) => ({ ...current, vi: event.target.value }))
                }
                className="theme-placeholder w-full rounded-2xl border theme-border theme-panel px-4 py-3 text-sm leading-7 theme-text-strong outline-none"
                placeholder={locale === "en" ? "Enter the Vietnamese version..." : "Nhập phiên bản tiếng Việt..."}
              />
            </label>
          </div>

          {fixedEssayPromptError ? (
            <div className="mt-5 rounded-[1.25rem] border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900 dark:border-amber-300/30 dark:bg-amber-400/10 dark:text-amber-100">
              {fixedEssayPromptError}
            </div>
          ) : null}
        </Surface>
      ) : null}

      <Surface className="px-6 py-6 md:px-8 md:py-8">
        <div
          className={cn(
            "grid gap-3",
            isEssayBank
              ? "xl:grid-cols-[minmax(0,1.35fr)_220px_220px]"
              : "xl:grid-cols-[minmax(0,1.35fr)_220px_220px_220px]",
          )}
        >
          <label className="space-y-2">
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] theme-eyebrow">
              <Search className="h-3.5 w-3.5" />
              {locale === "en" ? "Search" : "Tìm kiếm"}
            </span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 theme-text-soft" />
              <input
                value={questionSearch}
                onChange={(event) => setQuestionSearch(event.target.value)}
                placeholder={locale === "en" ? "Search by Question ID, prompt, topic..." : "Tìm theo mã câu hỏi, nội dung, chủ đề..."}
                className="theme-field h-12 w-full rounded-[1rem] border pl-10 pr-4 text-sm outline-none"
              />
            </div>
          </label>

          <label className="space-y-2">
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] theme-eyebrow">
              <Filter className="h-3.5 w-3.5" />
              {locale === "en" ? "Type" : "Loại"}
            </span>
            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value as "all" | Round1QuestionType)}
              className="theme-admin-select theme-field h-12 w-full rounded-[1rem] border px-4 text-sm outline-none"
            >
              <option value="all">{locale === "en" ? "All types" : "Tất cả loại"}</option>
              {(["single-choice", "multiple-choice", "true-false", "pairing", "essay"] as Round1QuestionType[]).map((value) => (
                <option key={value} value={value}>
                  {pickRound1TypeLabel(locale, value)}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] theme-eyebrow">
              <ListFilter className="h-3.5 w-3.5" />
              {locale === "en" ? "Topic" : "Chủ đề"}
            </span>
            <select
              value={topicFilter}
              onChange={(event) => setTopicFilter(event.target.value)}
              className="theme-admin-select theme-field h-12 w-full rounded-[1rem] border px-4 text-sm outline-none"
            >
              <option value="all">{locale === "en" ? "All topics" : "Tất cả chủ đề"}</option>
              {topicOptions.map((topic) => (
                <option key={topic} value={topic}>
                  {topic}
                </option>
              ))}
            </select>
          </label>

          {isEssayBank ? null : (
            <label className="space-y-2">
              <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] theme-eyebrow">
                <Filter className="h-3.5 w-3.5" />
                {locale === "en" ? "Difficulty" : "Độ khó"}
              </span>
              <select
                value={difficultyFilter}
                onChange={(event) => setDifficultyFilter(event.target.value as "all" | Round1Question["difficulty"])}
                className="theme-admin-select theme-field h-12 w-full rounded-[1rem] border px-4 text-sm outline-none"
              >
                <option value="all">{locale === "en" ? "All levels" : "Tất cả mức độ"}</option>
                <option value="easy">{locale === "en" ? "Easy" : "Dễ"}</option>
                <option value="medium">{locale === "en" ? "Medium" : "Trung bình"}</option>
                <option value="hard">{locale === "en" ? "Hard" : "Khó"}</option>
              </select>
            </label>
          )}
        </div>

        <div className="mt-8 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b theme-border bg-[var(--panel-strong)] theme-text-soft">
              <tr>
                <th
                  style={{ left: 0, width: 72, minWidth: 72 }}
                  className={cn("px-4 py-3 font-medium", stickyFirstHeadClass)}
                >
                  #
                </th>
                <th
                  style={{ left: 72, minWidth: 180 }}
                  className={cn("px-4 py-3 font-medium", stickySecondHeadClass)}
                >
                  {locale === "en" ? "Question ID" : "Mã câu hỏi"}
                </th>
                <th className="px-4 py-3 font-medium">
                  <SortableTableHeader
                    label={locale === "en" ? "Type" : "Loại"}
                    active={sortKey === "type"}
                    direction={sortDirection}
                    onClick={() => toggleSort("type")}
                  />
                </th>
                <th className="px-4 py-3 font-medium">
                  <SortableTableHeader
                    label={locale === "en" ? "Topic" : "Chủ đề"}
                    active={sortKey === "topic"}
                    direction={sortDirection}
                    onClick={() => toggleSort("topic")}
                  />
                </th>
                {isEssayBank ? null : (
                  <th className="px-4 py-3 text-center font-medium">
                    <SortableTableHeader
                      label={locale === "en" ? "Difficulty" : "Độ khó"}
                      active={sortKey === "difficulty"}
                      direction={sortDirection}
                      onClick={() => toggleSort("difficulty")}
                    />
                  </th>
                )}
                <th className="px-4 py-3 font-medium">
                  <SortableTableHeader
                    label={locale === "en" ? "Question" : "Câu hỏi"}
                    active={sortKey === "question"}
                    direction={sortDirection}
                    onClick={() => toggleSort("question")}
                  />
                </th>
                {isEssayBank ? null : (
                  <th className="px-4 py-3 text-center font-medium">
                    <SortableTableHeader
                      label={locale === "en" ? "Answer key" : "Đáp án"}
                      active={sortKey === "answerKey"}
                      direction={sortDirection}
                      onClick={() => toggleSort("answerKey")}
                    />
                  </th>
                )}
                <th className="px-4 py-3 font-medium">{locale === "en" ? "Actions" : "Thao tác"}</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((question, index) => (
                <tr key={question.id} className="border-b theme-border last:border-b-0">
                  <td
                    style={{ left: 0, width: 72, minWidth: 72 }}
                    className={cn("px-4 py-4 theme-text-body", stickyFirstColumnClass)}
                  >
                    {startIndex + index + 1}
                  </td>
                  <td
                    style={{ left: 72, minWidth: 180 }}
                    className={cn("px-4 py-4", stickySecondColumnClass)}
                  >
                    <StatusPill tone="info">{question.id}</StatusPill>
                  </td>
                  <td className="px-4 py-4">
                    <StatusPill>{pickRound1TypeLabel(locale, question.type)}</StatusPill>
                  </td>
                  <td className="px-4 py-4 theme-text-body">{question.topic}</td>
                  {isEssayBank ? null : (
                    <td className="px-4 py-4">
                      <StatusPill
                        tone={
                          question.difficulty === "hard"
                            ? "warning"
                            : question.difficulty === "medium"
                              ? "success"
                              : "default"
                        }
                      >
                        {pickRound1DifficultyLabel(locale, question.difficulty)}
                      </StatusPill>
                    </td>
                  )}
                  <td className="px-4 py-4 theme-text-body">
                    <p title={pickRound1QuestionText(question.prompt)}>
                      {truncateQuestionPreview(pickRound1QuestionText(question.prompt))}
                    </p>
                  </td>
                  {isEssayBank ? null : (
                    <td className="px-4 py-4 text-center">
                      <StatusPill tone="info">{getRound1AnswerSummary(question, locale)}</StatusPill>
                    </td>
                  )}
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/round-1/banks/${bank.id}/questions/${question.id}`}
                        title={locale === "en" ? "Edit question" : "Chỉnh sửa câu hỏi"}
                        aria-label={locale === "en" ? "Edit question" : "Chỉnh sửa câu hỏi"}
                        className="theme-button-secondary inline-flex h-9 w-9 items-center justify-center rounded-full"
                      >
                        <SquarePen className="h-3.5 w-3.5" />
                        <span className="sr-only">{locale === "en" ? "Edit question" : "Chỉnh sửa câu hỏi"}</span>
                      </Link>
                      <button
                        type="button"
                        disabled={deletePendingQuestionId === question.id}
                        onClick={() => {
                          setPendingDeleteQuestion(question);
                          setDeleteQuestionError("");
                        }}
                        title={locale === "en" ? "Delete question" : "Xóa câu hỏi"}
                        aria-label={locale === "en" ? "Delete question" : "Xóa câu hỏi"}
                        className="theme-button-danger inline-flex h-9 w-9 items-center justify-center rounded-full disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span className="sr-only">{locale === "en" ? "Delete question" : "Xóa câu hỏi"}</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <AdminTablePagination
          locale={locale}
          page={page}
          pageCount={pageCount}
          pageSize={ADMIN_LIST_TABLE_PAGE_SIZE}
          totalRows={sortedQuestions.length}
          onPageChange={setPage}
        />
      </Surface>

      {pendingDeleteQuestion ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center px-4 py-6">
          <button
            type="button"
            aria-label={locale === "en" ? "Close delete confirmation" : "Đóng xác nhận xóa"}
            className="absolute inset-0 cursor-default bg-slate-950/55 backdrop-blur-sm"
            onClick={() => {
              if (!deletePendingQuestionId) {
                setPendingDeleteQuestion(null);
                setDeleteQuestionError("");
              }
            }}
          />
          <div
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-xl overflow-hidden rounded-[2rem] border border-white/20 bg-[var(--panel)] shadow-[0_32px_90px_rgba(15,23,42,0.34)]"
          >
            <div className="border-b theme-border bg-[linear-gradient(135deg,rgba(239,68,68,0.14),rgba(59,130,246,0.08))] px-6 py-5">
              <div className="flex items-start gap-4">
                <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-500/12 text-red-500 ring-1 ring-red-500/20">
                  <Trash2 className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="theme-heading text-xl font-semibold theme-text-strong">
                    {locale === "en" ? "Delete Round 1 question?" : "Xóa câu hỏi Vòng 1?"}
                  </p>
                  <p className="mt-2 text-sm leading-6 theme-text-muted">
                    {locale === "en"
                      ? "This removes the question from the selected test bank. Existing archived submissions keep their saved question snapshot."
                      : "Thao tác này xóa câu hỏi khỏi test bank đã chọn. Các bài nộp đã lưu vẫn giữ bản chụp câu hỏi trong kho lưu trữ."}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4 px-6 py-5">
              <div className="rounded-[1.4rem] border theme-border theme-panel-subtle p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusPill tone="info">{pendingDeleteQuestion.id}</StatusPill>
                  <StatusPill>{pickRound1TypeLabel(locale, pendingDeleteQuestion.type)}</StatusPill>
                  <span className="theme-chip inline-flex rounded-full px-3 py-1 text-[0.68rem] font-semibold">
                    {pendingDeleteQuestion.topic}
                  </span>
                </div>
                <p className="mt-4 text-sm leading-7 theme-text-body">
                  {pickRound1QuestionText(pendingDeleteQuestion.prompt)}
                </p>
              </div>

              {deleteQuestionError ? (
                <div className="rounded-2xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-500">
                  {deleteQuestionError}
                </div>
              ) : null}
            </div>

            <div className="flex flex-col-reverse gap-3 border-t theme-border bg-[var(--panel-strong)] px-6 py-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={Boolean(deletePendingQuestionId)}
                onClick={() => {
                  setPendingDeleteQuestion(null);
                  setDeleteQuestionError("");
                }}
                className="theme-button-secondary rounded-full border px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
              >
                {locale === "en" ? "Cancel" : "Hủy"}
              </button>
              <button
                type="button"
                disabled={Boolean(deletePendingQuestionId)}
                onClick={() => {
                  void handleDeleteQuestion();
                }}
                className="theme-button-danger inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Trash2 className={cn("h-4 w-4", deletePendingQuestionId ? "animate-pulse" : "")} />
                {deletePendingQuestionId
                  ? locale === "en"
                    ? "Deleting..."
                    : "Đang xóa..."
                  : locale === "en"
                    ? "Delete question"
                    : "Xóa câu hỏi"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function AdminRound1TeamResultDetail({ teamId }: { teamId: string }) {
  const { locale, round1Submissions, round1TestBanks, teams, timelineItems, users } = useSiteState();
  useAdminTitleScroll();
  const team = teams.find((item) => item.id === teamId);
  const teamGroups = buildTeamResultGroups(round1Submissions, teams, users);
  const group = teamGroups.find((item) => item.team.id === teamId);
  const leader = team ? users.find((user) => user.id === team.leaderId) : undefined;
  const bankTitleById = new Map(round1TestBanks.map((bank) => [bank.id, bank.title]));
  const {
    page,
    setPage,
    pageCount,
    startIndex,
    paginatedRows,
  } = useAdminTablePagination(group?.memberRows ?? [], ADMIN_TABLE_PAGE_SIZE);

  if (!team || !group) {
    return (
      <NotFoundState
        title={locale === "en" ? "Team result not found." : "Không tìm thấy kết quả đội."}
        description={
          locale === "en"
            ? "This team may no longer exist in the current admin dataset."
            : "Đội này có thể không còn tồn tại trong bộ dữ liệu admin hiện tại."
        }
        href="/admin/round-1/scores"
        actionLabel={locale === "en" ? "Back to Round 1 scores" : "Quay lại điểm Vòng 1"}
      />
    );
  }

  const detailExportRows = group.memberRows.map((row) => ({
    team: group.team.name,
    teamTag: group.team.tag,
    teamRank: group.rank ?? "",
    student: row.student.name,
    email: row.student.email,
    teamRole: row.student.id === group.team.leaderId ? "leader" : "member",
    university: row.student.university,
    major: row.student.major,
    classYear: row.student.classYear,
    right: row.submission?.rightCount ?? "",
    wrong: row.submission?.wrongCount ?? "",
    objectiveScore: row.submission?.objectiveScore ?? "",
    essayScore: row.submission?.essayScore ?? "",
    totalScore: row.submission?.totalScore ?? "",
    durationMinutes: row.submission?.durationMinutes ?? "",
    submittedAt: row.submission?.submittedAt ?? "",
    reviewStatus: row.submission ? (isRound1EssayPending(row.submission) ? "Essay pending" : "Reviewed") : "",
    bank: row.submission ? bankTitleById.get(row.submission.bankId)?.en ?? row.submission.bankId : "",
  }));
  return (
    <div className="space-y-8">
      <Link href="/admin/round-1/scores" className="inline-flex items-center gap-2 text-sm font-semibold theme-accent">
        <ArrowLeft className="h-4 w-4" />
        {locale === "en" ? "Back to Round 1 scores" : "Quay lại điểm Vòng 1"}
      </Link>

      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <SectionHeading
          id={ADMIN_TITLE_ID}
          className="scroll-mt-32"
          eyebrow={locale === "en" ? "Admin / Round 1 / Team score" : "Admin / Vòng 1 / Điểm đội"}
          title={`${group.team.name} · ${group.team.tag}`}
          description={
            locale === "en"
              ? "This page breaks Round 1 down by member so the committee can review each student's objective result, assign essay points manually, and confirm the final team average after review."
              : "Trang này tách kết quả Vòng 1 theo từng thành viên để ban tổ chức xem điểm trắc nghiệm của từng sinh viên, nhập điểm tự luận thủ công và chốt điểm trung bình đội sau khi chấm."
          }
        />
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/admin/teams/${group.team.id}`}
            className="rounded-full border theme-border theme-panel px-5 py-3 text-sm font-semibold theme-text-strong"
          >
            {locale === "en" ? "Open team record" : "Mở hồ sơ đội"}
          </Link>
          <button
            type="button"
            onClick={() =>
              exportRowsToWorkbook(
                `attacker-2026-round1-${group.team.tag.toLowerCase()}-detail.xlsx`,
                "Round1TeamDetail",
                detailExportRows,
              )
            }
            className="theme-button-primary rounded-full px-5 py-3 text-sm font-semibold"
          >
            <span className="inline-flex items-center gap-2">
              <Download className="h-4 w-4" />
              {locale === "en" ? "Export team detail" : "Xuất chi tiết đội"}
            </span>
          </button>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={<Trophy className="h-5 w-5 text-amber-300" />}
          label={locale === "en" ? "Current rank" : "Hạng hiện tại"}
          value={group.rank ? `#${group.rank}` : "--"}
          note={getStandingLabel(locale, group, timelineItems)}
        />
        <MetricCard
          icon={<UsersRound className="h-5 w-5 text-cyan-300" />}
          label={locale === "en" ? "Scored members" : "Thành viên đã chấm"}
          value={`${group.scoredRows.length}/${group.memberRows.length}`}
          note={
            locale === "en"
              ? "Only submissions with essay scores count into the current team average"
              : "Chỉ các bài đã có điểm tự luận mới được tính vào điểm trung bình đội"
          }
        />
        <MetricCard
          icon={<Target className="h-5 w-5 text-emerald-300" />}
          label={locale === "en" ? "Objective average" : "Điểm trung bình trắc nghiệm"}
          value={group.scoredRows.length ? `${group.averageObjectiveScore.toFixed(2)} / ${ROUND1_OBJECTIVE_MAX_SCORE}` : "--"}
          note={
            group.scoredRows.length
              ? `${group.averageRight.toFixed(1)} / ${group.averageWrong.toFixed(1)}`
              : locale === "en"
                ? "Waiting for score"
                : "Chờ điểm"
          }
        />
        <MetricCard
          icon={<Clock3 className="h-5 w-5 text-orange-300" />}
          label={locale === "en" ? "Total average" : "Điểm trung bình tổng"}
          value={
            group.scoredRows.length === 0
              ? "--"
              : `${group.averageTotalScore.toFixed(2)} / ${ROUND1_TOTAL_MAX_SCORE}`
          }
          note={
            locale === "en"
              ? group.latestSubmittedAt
                ? `Latest activity ${formatDateLabel(locale, group.latestSubmittedAt)}`
                : "No completed attempt yet"
              : group.latestSubmittedAt
                ? `Cập nhật gần nhất ${formatDateLabel(locale, group.latestSubmittedAt)}`
                : "Chưa có bài làm nào"
          }
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Surface className="px-6 py-6 md:px-8 md:py-8">
          <p className="theme-heading text-2xl font-semibold theme-text-strong">
            {locale === "en" ? "Team context" : "Thông tin đội"}
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-[minmax(min(100%,24rem),max-content)_minmax(14rem,1fr)]">
            <div className="min-w-0 rounded-[1.5rem] border theme-border theme-panel-subtle px-4 py-4">
              <p className="text-xs uppercase tracking-[0.22em] theme-text-soft">
                {locale === "en" ? "Leader" : "Đội trưởng"}
              </p>
              <p className="mt-2 text-lg font-semibold theme-text-strong">
                {leader?.name ?? "--"}
              </p>
              {leader ? (
                <Link
                  href={`/admin/users/${leader.id}`}
                  className="mt-2 inline-flex max-w-full break-all text-sm font-semibold leading-6 theme-accent sm:break-normal sm:whitespace-nowrap"
                >
                  {leader.email}
                </Link>
              ) : null}
            </div>
            <div className="min-w-0 rounded-[1.5rem] border theme-border theme-panel-subtle px-4 py-4">
              <p className="text-xs uppercase tracking-[0.22em] theme-text-soft">
                {locale === "en" ? "Keyword" : "Từ khóa"}
              </p>
              <p className="mt-2 text-lg font-semibold theme-text-strong break-words">{team.track}</p>
            </div>
            <div className="rounded-[1.5rem] border theme-border theme-panel-subtle px-4 py-4 md:col-span-2">
              <p className="text-xs uppercase tracking-[0.22em] theme-text-soft">
                {locale === "en" ? "Team bio" : "Bio của đội"}
              </p>
              <p className="mt-2 text-sm leading-7 theme-text-muted">
                {team.bio || "--"}
              </p>
            </div>
          </div>
        </Surface>

        <Surface className="px-6 py-6">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] theme-text-soft">
            {locale === "en" ? "Round 1 standing" : "Trạng thái Vòng 1"}
          </p>
          <div className="mt-5 space-y-4">
            <div className="rounded-[1.4rem] border theme-border theme-panel-subtle px-4 py-4">
              <p className="text-sm theme-text-muted">
                {locale === "en" ? "Current status" : "Trạng thái hiện tại"}
              </p>
              <div className="mt-3">
                <StatusPill tone={getStandingTone(group)}>
                  {getStandingLabel(locale, group, timelineItems)}
                </StatusPill>
              </div>
            </div>
            <div className="rounded-[1.4rem] border theme-border theme-panel-subtle px-4 py-4">
              <p className="text-sm theme-text-muted">
                {locale === "en" ? "Scoring rule" : "Quy tắc tính điểm"}
              </p>
              <p className="mt-3 text-sm leading-7 theme-text-muted">
                {locale === "en"
                  ? "Round 1 stays individual at the student level. Objective score is available immediately, essay score is added after manual review, and only then is the final total score confirmed."
                  : "Vòng 1 được làm bài theo cá nhân. Điểm phần trắc nghiệm có ngay, điểm tự luận được bổ sung sau khi chấm thủ công, và chỉ khi đó tổng điểm cuối cùng mới được xác nhận."}
              </p>
            </div>
          </div>
        </Surface>
      </section>

      <Surface className="px-6 py-6 md:px-8 md:py-8">
        <div className="max-w-3xl">
          <p className="theme-heading text-3xl font-semibold theme-text-strong">
            {locale === "en" ? "Member-by-member Round 1 results" : "Kết quả Vòng 1 theo từng thành viên"}
          </p>
          <p className="mt-3 text-sm leading-7 theme-text-muted">
            {locale === "en"
              ? "This table shows every current member in the team. Pending members remain visible so admin and moderator accounts can see completion gaps immediately."
              : "Bảng này hiện tất cả thành viên hiện tại của đội. Thành viên chưa nộp bài vẫn được hiện để admin và moderator thấy ngay các khoảng trống về tiến độ."}
          </p>
        </div>

        <div className="mt-8 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b theme-border bg-[var(--panel-strong)] theme-text-soft">
              <tr>
                {[
                  "#",
                  locale === "en" ? "Member" : "Thành viên",
                  locale === "en" ? "Role" : "Vai trò",
                  locale === "en" ? "University / Major" : "Trường / Ngành",
                  locale === "en" ? "Right" : "Đúng",
                  locale === "en" ? "Wrong" : "Sai",
                  locale === "en" ? "Objective" : "Trắc nghiệm",
                  locale === "en" ? "Essay" : "Tự luận",
                  locale === "en" ? "Total" : "Tổng",
                  locale === "en" ? "Duration" : "Thời gian",
                  locale === "en" ? "Submitted at" : "Thời điểm nộp",
                  locale === "en" ? "Review" : "Chấm điểm",
                ].map((label) => (
                  <th key={label} className="px-4 py-3 font-medium">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((row, index) => (
                <tr key={row.student.id} className="border-b theme-border last:border-b-0">
                  <td className="px-4 py-4 text-xs font-semibold theme-text-soft">{startIndex + index + 1}</td>
                  <td className="px-4 py-4">
                    <Link href={`/admin/users/${row.student.id}`} className="font-semibold theme-accent">
                      {row.student.name}
                    </Link>
                    <p className="mt-1 text-xs theme-text-soft">{row.student.email}</p>
                  </td>
                  <td className="px-4 py-4 theme-text-body">
                    {row.student.id === group.team.leaderId
                      ? locale === "en"
                        ? "Leader"
                        : "Đội trưởng"
                      : locale === "en"
                        ? "Member"
	                        : "Thành viên"}
                  </td>
                  <td className="px-4 py-4 theme-text-body">
                    <p>{row.student.university}</p>
                    <p className="mt-1 text-xs theme-text-soft">{row.student.major}</p>
                  </td>
                  <td className="px-4 py-4 theme-text-body">{row.submission?.rightCount ?? "--"}</td>
                  <td className="px-4 py-4 theme-text-body">{row.submission?.wrongCount ?? "--"}</td>
                  <td className="px-4 py-4">
                    {row.submission ? (
                      <StatusPill
                        tone={
                          row.submission.objectiveScore >= ROUND1_OBJECTIVE_MAX_SCORE * 0.8
                            ? "success"
                            : row.submission.objectiveScore >= ROUND1_OBJECTIVE_MAX_SCORE * 0.65
                              ? "default"
                              : "warning"
                        }
                      >
                        {`${row.submission.objectiveScore} / ${ROUND1_OBJECTIVE_MAX_SCORE}`}
                      </StatusPill>
                    ) : (
                      "--"
                    )}
                  </td>
                  <td className="px-4 py-4">
                    {row.submission ? (
                      row.submission.essayScore == null ? (
                        <StatusPill tone="warning">
                          {locale === "en" ? "Pending" : "Đang chờ"}
                        </StatusPill>
                      ) : (
                        <StatusPill tone="default">{`${row.submission.essayScore} / ${ROUND1_ESSAY_MAX_SCORE}`}</StatusPill>
                      )
                    ) : (
                      "--"
                    )}
                  </td>
                  <td className="px-4 py-4">
                    {row.submission ? (
                      row.submission.totalScore == null ? (
                        <StatusPill tone="warning">
                          {locale === "en" ? "Pending" : "Đang chờ"}
                        </StatusPill>
                      ) : (
                        <StatusPill tone={row.submission.totalScore >= 80 ? "success" : row.submission.totalScore >= 65 ? "default" : "warning"}>
                          {`${row.submission.totalScore} / ${ROUND1_TOTAL_MAX_SCORE}`}
                        </StatusPill>
                      )
                    ) : (
                      "--"
                    )}
                  </td>
                  <td className="px-4 py-4 theme-text-body">
                    {row.submission ? `${row.submission.durationMinutes}m` : "--"}
                  </td>
                  <td className="px-4 py-4 theme-text-body">
                    {row.submission ? formatDateLabel(locale, row.submission.submittedAt) : "--"}
                  </td>
                  <td className="px-4 py-4">
                    {row.submission ? (
                      <Link
                        href={`/admin/round-1/exams/${row.student.id}`}
                        className="theme-button-secondary inline-flex h-10 w-10 items-center justify-center rounded-full border"
                        title={locale === "en" ? "Open submission detail" : "Mở chi tiết bài nộp"}
                        aria-label={locale === "en" ? "Open submission detail" : "Mở chi tiết bài nộp"}
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                    ) : (
                      <StatusPill tone="default">
                        {locale === "en" ? "Pending" : "Đang chờ"}
                      </StatusPill>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <AdminTablePagination
          locale={locale}
          page={page}
          pageCount={pageCount}
          pageSize={ADMIN_TABLE_PAGE_SIZE}
          totalRows={group.memberRows.length}
          onPageChange={setPage}
        />
      </Surface>
    </div>
  );
}

export function AdminRound1QuestionEditor({ bankId, questionId }: { bankId: string; questionId: string }) {
  const { hasHydrated } = useSiteState();
  useAdminTitleScroll();

  if (!hasHydrated) {
    return (
      <Surface className="px-6 py-6 md:px-8 md:py-8">
        <SectionHeading
          id={ADMIN_TITLE_ID}
          className="scroll-mt-32"
          eyebrow="Admin / Round 1 / Question"
          title="Loading question..."
          description="Waiting for the local admin dataset to hydrate before opening the question editor."
        />
      </Surface>
    );
  }

  return <AdminRound1QuestionEditorInner bankId={bankId} questionId={questionId} mode="edit" />;
}

export function AdminRound1QuestionCreator({ bankId }: { bankId: string }) {
  const { hasHydrated } = useSiteState();
  useAdminTitleScroll();

  if (!hasHydrated) {
    return (
      <Surface className="px-6 py-6 md:px-8 md:py-8">
        <SectionHeading
          id={ADMIN_TITLE_ID}
          className="scroll-mt-32"
          eyebrow="Admin / Round 1 / Question"
          title="Loading question form..."
          description="Waiting for the local admin dataset to hydrate before opening the question editor."
        />
      </Surface>
    );
  }

  return <AdminRound1QuestionEditorInner bankId={bankId} mode="create" />;
}

function AdminRound1QuestionEditorInner({
  bankId,
  questionId,
  mode,
}: {
  bankId: string;
  questionId?: string;
  mode: "edit" | "create";
}) {
  const router = useRouter();
  const { locale, round1TestBanks, round1Topics, createRound1QuestionByAdmin, updateRound1QuestionByAdmin } = useSiteState();
  const bank = round1TestBanks.find((item) => item.id === bankId);
  const sourceQuestion = mode === "edit" ? bank?.questions.find((item) => item.id === questionId) : undefined;
  const questionIndex = mode === "edit" ? bank?.questions.findIndex((item) => item.id === questionId) ?? -1 : -1;
  const pristineQuestion = useMemo(() => {
    if (!bank) {
      return null;
    }

    if (mode === "create") {
      return createRound1QuestionDraftForBank(bank, round1Topics);
    }

    return sourceQuestion ? cloneRound1Question(sourceQuestion) : null;
  }, [bank, mode, round1Topics, sourceQuestion]);
  const [draft, setDraft] = useState<Round1Question | null>(() =>
    pristineQuestion ? cloneRound1Question(pristineQuestion) : null,
  );
  const [savePending, setSavePending] = useState(false);
  const [validationMessage, setValidationMessage] = useState<LocalizedText | null>(null);
  const isEssayBank = bank?.bankType === "essay";
  const usesDifficulty = !isEssayBank && draft?.type !== "essay";

  const isDirty = useMemo(() => {
    if (!pristineQuestion || !draft) {
      return false;
    }

    return JSON.stringify(pristineQuestion) !== JSON.stringify(draft);
  }, [draft, pristineQuestion]);

  if (!bank || !draft || (mode === "edit" && !sourceQuestion)) {
    return (
      <NotFoundState
        title={
          mode === "create"
            ? locale === "en"
              ? "Round 1 bank not found."
              : "Không tìm thấy bank Vòng 1."
            : locale === "en"
              ? "Round 1 question not found."
              : "Không tìm thấy câu hỏi Vòng 1."
        }
        description={
          mode === "create"
            ? locale === "en"
              ? "This bank may not exist in the current browser dataset."
              : "Bank này có thể không tồn tại trong bộ dữ liệu hiện tại của trình duyệt."
            : locale === "en"
              ? "This question may not exist in the current bank dataset."
              : "Câu hỏi này có thể không tồn tại trong dữ liệu bank hiện tại."
        }
        href={bank ? `/admin/round-1/banks/${bank.id}` : "/admin/round-1"}
        actionLabel={locale === "en" ? "Back to test bank" : "Quay lại test bank"}
      />
    );
  }

  const saveDraft = async () => {
    const pairingIssue = getRound1PairingValidationIssue(draft);
    if (pairingIssue) {
      setValidationMessage(getRound1PairingValidationMessage(pairingIssue));
      return;
    }

    setValidationMessage(null);
    const draftWithoutName = { ...draft };
    delete draftWithoutName.name;
    const normalizedDraft =
      draft.type === "essay"
        ? {
            ...draftWithoutName,
            difficulty: "medium" as Round1Question["difficulty"],
          }
        : draftWithoutName;

    if (mode === "create") {
      setSavePending(true);
      const createdQuestionId = await createRound1QuestionByAdmin(bank.id, normalizedDraft);
      setSavePending(false);

      if (createdQuestionId) {
        router.push(`/admin/round-1/banks/${bank.id}/questions/${createdQuestionId}`);
      }
      return;
    }

    if (sourceQuestion) {
      setSavePending(true);
      const updatedQuestionId = await updateRound1QuestionByAdmin(bank.id, sourceQuestion.id, normalizedDraft);
      setSavePending(false);

      if (updatedQuestionId && updatedQuestionId !== sourceQuestion.id) {
        router.replace(`/admin/round-1/banks/${bank.id}/questions/${updatedQuestionId}`);
      }
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-3 text-sm font-semibold">
        <Link href="/admin/round-1" className="inline-flex items-center gap-2 theme-accent">
          <ArrowLeft className="h-4 w-4" />
          {locale === "en" ? "Back to Round 1" : "Quay lại Vòng 1"}
        </Link>
        <span className="theme-text-soft">/</span>
        <Link href={`/admin/round-1/banks/${bank.id}`} className="theme-accent">
          {locale === "en" ? "Back to bank detail" : "Quay lại chi tiết bank"}
        </Link>
      </div>

      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <SectionHeading
          id={ADMIN_TITLE_ID}
          className="scroll-mt-32"
          eyebrow={
            mode === "create"
              ? locale === "en"
                ? "Admin / Round 1 / Add question"
                : "Admin / Vòng 1 / Thêm câu hỏi"
              : locale === "en"
                ? "Admin / Round 1 / Edit question"
                : "Admin / Vòng 1 / Sửa câu hỏi"
          }
          title={
            mode === "create"
              ? locale === "en"
                ? "New question draft"
                : "Bản nháp câu hỏi mới"
              : locale === "en"
                ? `Question ${questionIndex + 1} editor`
                : `Editor câu hỏi ${questionIndex + 1}`
          }
          description={
            mode === "create"
              ? locale === "en"
                ? "Create a new question for this test bank. You can keep the suggested Question ID or change it before saving."
                : "Tạo câu hỏi mới cho test bank này. Bạn có thể giữ mã câu hỏi được gợi ý hoặc đổi trước khi lưu."
              : locale === "en"
                ? usesDifficulty
                  ? "Update the Question ID, prompt, topic, difficulty, and response structure for this question inside the selected test bank."
                  : "Update the Question ID, prompt, topic, and response structure for this question inside the selected test bank."
                : usesDifficulty
                  ? "Cập nhật mã câu hỏi, prompt, chủ đề, độ khó và cấu trúc trả lời cho câu hỏi này trong test bank đã chọn."
                  : "Cập nhật mã câu hỏi, prompt, chủ đề và cấu trúc trả lời cho câu hỏi này trong test bank đã chọn."
          }
        />
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => pristineQuestion && setDraft(cloneRound1Question(pristineQuestion))}
            className="rounded-full border theme-border theme-panel px-5 py-3 text-sm font-semibold theme-text-strong"
          >
            {locale === "en" ? "Reset draft" : "Đặt lại bản nháp"}
          </button>
          <button
            type="button"
            disabled={savePending || !isDirty}
            onClick={() => void saveDraft()}
            className="theme-button-primary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {mode === "create"
              ? locale === "en"
                ? "Create question"
                : "Tạo câu hỏi"
              : locale === "en"
                ? "Save question"
                : "Lưu câu hỏi"}
          </button>
        </div>
      </div>

      {validationMessage ? (
        <div className="rounded-[1.35rem] border border-amber-400/30 bg-amber-400/12 px-5 py-4 text-sm font-semibold leading-7 text-amber-800 shadow-[0_18px_45px_rgba(245,158,11,0.12)] dark:border-amber-300/25 dark:bg-amber-300/10 dark:text-amber-100">
          {validationMessage[locale]}
        </div>
      ) : null}

      <section>
        <Surface className="px-6 py-6 md:px-8 md:py-8">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <label className="space-y-2">
              <span className="text-sm theme-text-muted">
                {locale === "en" ? "Question ID" : "Mã câu hỏi"}
              </span>
              <input
                value={draft.id}
                onChange={(event) =>
                  setDraft((current) =>
                    current ? { ...current, id: event.target.value } : current,
                  )
                }
                placeholder={isEssayBank ? "r1e-01" : "r1q-01"}
                className={fieldClassName}
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm theme-text-muted">
                {locale === "en" ? "Topic" : "Chủ đề"}
              </span>
              <Round1QuestionTopicSelect
                locale={locale}
                value={draft.topic}
                topics={round1Topics}
                onChange={(topic) =>
                  setDraft((current) =>
                    current ? { ...current, topic } : current,
                  )
                }
                placeholder={locale === "en" ? "Enter topic" : "Nhập chủ đề"}
                className={fieldClassName}
              />
            </label>
            {usesDifficulty ? (
              <label className="space-y-2">
                <span className="text-sm theme-text-muted">
                  {locale === "en" ? "Difficulty" : "Độ khó"}
                </span>
                <Round1EditorSelect
                  value={draft.difficulty}
                  onChange={(value) =>
                    setDraft((current) =>
                      current
                        ? {
                            ...current,
                            difficulty: value as Round1Question["difficulty"],
                          }
                        : current,
                    )
                  }
                  ariaLabel={locale === "en" ? "Difficulty" : "Độ khó"}
                >
                  <option value="easy">{pickRound1DifficultyLabel(locale, "easy")}</option>
                  <option value="medium">{pickRound1DifficultyLabel(locale, "medium")}</option>
                  <option value="hard">{pickRound1DifficultyLabel(locale, "hard")}</option>
                </Round1EditorSelect>
              </label>
            ) : null}
            <label className="space-y-2">
              <span className="text-sm theme-text-muted">
                {locale === "en" ? "Question type" : "Loại câu hỏi"}
              </span>
              <Round1EditorSelect
                value={draft.type}
                onChange={(value) =>
                  setDraft((current) =>
                    current
                      ? convertRound1QuestionType(
                          current,
                          value as Round1QuestionType,
                        )
                      : current,
                  )
                }
                disabled={mode === "edit" || isEssayBank}
                ariaLabel={locale === "en" ? "Question type" : "Loại câu hỏi"}
              >
                {(isEssayBank
                  ? (["essay"] as Round1QuestionType[])
                  : ([
                      "true-false",
                      "single-choice",
                      "multiple-choice",
                      "pairing",
                    ] as Round1QuestionType[])).map((type) => (
                  <option key={type} value={type}>
                    {pickRound1TypeLabel(locale, type)}
                  </option>
                ))}
              </Round1EditorSelect>
            </label>
          </div>

          <div className="mt-6">
            <QuestionContentFieldEditor
              label={locale === "en" ? "Question prompt" : "Prompt câu hỏi"}
              locale={locale}
              rows={5}
              value={draft.prompt}
              onChange={(value) =>
                setDraft((current) =>
                  current
                    ? { ...current, prompt: { en: value, vi: value } }
                    : current,
                )
              }
            />
          </div>

          {draft.type !== "essay" ? (
            <div className="mt-8">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="theme-heading text-2xl font-semibold theme-text-strong">
                    {draft.type === "pairing"
                      ? locale === "en"
                        ? "Pairing structure"
                        : "Cấu trúc nối cặp"
                      : locale === "en"
                        ? "Answer options"
                        : "Các đáp án"}
                  </p>
                  <p className="mt-2 text-sm leading-7 theme-text-muted">
                    {draft.type === "multiple-choice"
                      ? locale === "en"
                        ? "Edit the answer options, then mark all correct answers."
                        : "Chỉnh sửa các lựa chọn, sau đó đánh dấu tất cả đáp án đúng."
                      : draft.type === "pairing"
                        ? locale === "en"
                          ? "Configure the right-side answer list, then map each left-side prompt to its correct match."
                          : "Cấu hình danh sách bên phải, sau đó nối mỗi prompt bên trái với đáp án đúng."
                        : locale === "en"
                          ? "Edit the answer options, then mark the correct answer."
                          : "Chỉnh sửa các lựa chọn, sau đó đánh dấu đáp án đúng."}
                  </p>
                </div>
              </div>

              {draft.options?.length ? (
                <div className="mt-6 grid gap-4">
                  {draft.options.map((option) => {
                    const isCorrectSingle = Boolean(draft.correctOptionIds?.includes(option.id));

                    return (
                      <div
                        key={option.id}
                        className="rounded-[1.75rem] border theme-border theme-panel-subtle px-5 py-5"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <p className="text-lg font-semibold theme-text-strong">
                            {locale === "en" ? `Option ${option.label}` : `Lựa chọn ${option.label}`}
                          </p>
                          {draft.type !== "pairing" ? (
                            <label className="inline-flex items-center gap-2 text-sm font-semibold theme-text-strong">
                              <input
                                type={draft.type === "multiple-choice" ? "checkbox" : "radio"}
                                name={`question-${draft.id}-correct`}
                                checked={isCorrectSingle}
                                onChange={() =>
                                  setDraft((current) => {
                                    if (!current) {
                                      return current;
                                    }

                                    if (current.type === "multiple-choice") {
                                      const nextCorrect = current.correctOptionIds?.includes(option.id)
                                        ? (current.correctOptionIds ?? []).filter((item) => item !== option.id)
                                        : [...(current.correctOptionIds ?? []), option.id];

                                      return {
                                        ...current,
                                        correctOptionIds: nextCorrect,
                                      };
                                    }

                                    return {
                                      ...current,
                                      correctOptionIds: [option.id],
                                    };
                                  })
                                }
                              />
                              <span>
                                {draft.type === "multiple-choice"
                                  ? locale === "en"
                                    ? "Correct choice"
                                    : "Đáp án đúng"
                                  : locale === "en"
                                    ? "Correct answer"
                                    : "Đáp án đúng"}
                              </span>
                            </label>
                          ) : null}
                        </div>

                        <div className="mt-4">
                          <QuestionContentFieldEditor
                            label={locale === "en" ? `Option ${option.label} text` : `Nội dung ${option.label}`}
                            locale={locale}
                            rows={3}
                            value={option.text}
                            onChange={(value) =>
                              setDraft((current) =>
                                current
                                  ? {
                                      ...current,
                                      options: (current.options ?? []).map((item) =>
                                        item.id === option.id
                                          ? { ...item, text: { en: value, vi: value } }
                                          : item,
                                      ),
                                    }
                                  : current,
                              )
                            }
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : null}

              {draft.type === "pairing" && draft.pairingItems?.length ? (
                <div className="mt-8">
                  <p className="theme-heading text-2xl font-semibold theme-text-strong">
	                    {locale === "en" ? "Left-side prompts" : "Các mục bên trái"}
                  </p>
                  <div className="mt-6 grid gap-4">
                    {draft.pairingItems.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-[1.75rem] border theme-border theme-panel-subtle px-5 py-5"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <p className="text-lg font-semibold theme-text-strong">
	                            {locale === "en" ? `Prompt ${item.label}` : `Mục ${item.label}`}
                          </p>
                          <label className="space-y-2">
                            <span className="text-sm theme-text-muted">
	                              {locale === "en" ? "Correct match" : "Cặp nội dung"}
                            </span>
                            <Round1EditorSelect
                              value={item.correctOptionId}
                              onChange={(value) =>
                                setDraft((current) =>
                                  current
                                    ? {
                                        ...current,
                                        pairingItems: (current.pairingItems ?? []).map((pairingItem) =>
                                          pairingItem.id === item.id
                                            ? { ...pairingItem, correctOptionId: value }
                                            : pairingItem,
                                        ),
                                      }
                                    : current,
                                )
                              }
                              ariaLabel={locale === "en" ? "Correct match" : "Cặp nội dung"}
                            >
                              {(draft.options ?? []).map((option) => (
                                <option key={option.id} value={option.id}>
                                  {option.label}
                                </option>
                              ))}
                            </Round1EditorSelect>
                          </label>
                        </div>
                        <div className="mt-4">
                          <QuestionContentFieldEditor
	                            label={locale === "en" ? `Prompt ${item.label}` : `Nội dung ${item.label}`}
                            locale={locale}
                            rows={3}
                            value={item.prompt}
                            onChange={(value) =>
                              setDraft((current) =>
                                current
                                  ? {
                                      ...current,
                                      pairingItems: (current.pairingItems ?? []).map((pairingItem) =>
                                        pairingItem.id === item.id
                                          ? {
                                              ...pairingItem,
                                              prompt: { en: value, vi: value },
                                            }
                                          : pairingItem,
                                      ),
                                    }
                                  : current,
                              )
                            }
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="mt-8 space-y-6">
              <div>
                <p className="theme-heading text-2xl font-semibold theme-text-strong">
                  {locale === "en" ? "Essay settings" : "Cấu hình tự luận"}
                </p>
                <p className="mt-2 text-sm leading-7 theme-text-muted">
                  {locale === "en"
                    ? "Define what students see inside the text area and what moderators should use to review the response."
                    : "Xác định nội dung sinh viên nhìn thấy trong ô nhập và ghi chú để moderator dùng khi xem bài."}
                </p>
              </div>
              <QuestionContentFieldEditor
                label={locale === "en" ? "Essay placeholder" : "Placeholder bài viết"}
                locale={locale}
                rows={3}
                value={draft.placeholder ?? createLocalizedEmpty()}
                onChange={(value) =>
                  setDraft((current) =>
                    current
                      ? {
                          ...current,
                          placeholder: {
                            en: value,
                            vi: value,
                          },
                        }
                      : current,
                  )
                }
              />
              <QuestionContentFieldEditor
	                label={locale === "en" ? "Rubric note" : "Ghi chú rubric"}
                locale={locale}
                rows={4}
                value={draft.rubricNote ?? createLocalizedEmpty()}
                onChange={(value) =>
                  setDraft((current) =>
                    current
                      ? {
                          ...current,
                          rubricNote: {
                            en: value,
                            vi: value,
                          },
                        }
                      : current,
                  )
                }
              />
            </div>
          )}
        </Surface>

      </section>
    </div>
  );
}
