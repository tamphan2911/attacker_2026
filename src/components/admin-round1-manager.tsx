"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowUpDown,
  Clock3,
  Download,
  FileQuestion,
  Filter,
  ListOrdered,
  ListFilter,
  Save,
  Search,
  Shuffle,
  Target,
  Trophy,
  UsersRound,
} from "lucide-react";
import * as XLSX from "xlsx";

import { ADMIN_TITLE_ID, useAdminTitleScroll } from "@/components/admin-title-scroll";
import {
  ADMIN_TABLE_PAGE_SIZE,
  AdminTablePagination,
  useAdminTablePagination,
} from "@/components/admin-table-pagination";
import { useSiteState } from "@/components/providers/site-state-provider";
import { SectionHeading, StatusPill, Surface } from "@/components/site-ui";
import { TEAM_MIN_MEMBERS } from "@/data/site-content";
import {
  ROUND1_ESSAY_TOTAL,
  ROUND1_ESSAY_MAX_SCORE,
  ROUND1_ESSAY_WORD_LIMIT,
  ROUND1_OBJECTIVE_DIFFICULTY_MIX,
  ROUND1_OBJECTIVE_MAX_SCORE,
  ROUND1_OBJECTIVE_QUESTIONS_PER_TOPIC,
  ROUND1_OBJECTIVE_TOTAL,
  ROUND1_TOTAL_MAX_SCORE,
  ROUND1_TOPIC_COUNT,
  getActiveRound1Bank,
  getRound1AnswerSummary,
  getRound1QuestionOptionPreview,
  getRound1QuestionStructureSummary,
  isRound1EssayPending,
  pickRound1QuestionText,
  pickRound1TypeLabel,
} from "@/lib/round1";
import { formatDateLabel, pickText } from "@/lib/site";
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
}

const fieldClassName =
  "theme-placeholder w-full rounded-2xl border theme-border theme-panel px-4 py-3 text-sm theme-text-strong outline-none";

function cn(...values: Array<string | undefined | false>) {
  return values.filter(Boolean).join(" ");
}

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
        createRound1Option("a", "A", { en: "True", vi: "Dung" }),
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
    placeholder: createLocalizedEmpty(),
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
    placeholder: question.placeholder ?? createLocalizedEmpty(),
  };
}

function createRound1QuestionDraftForBank(bank: Round1TestBank) {
  const questionType: Round1QuestionType = bank.bankType === "essay" ? "essay" : "single-choice";

  return createQuestionShapeForType(questionType, {
    topic: bank.questions[0]?.topic ?? "",
    difficulty: bank.bankType === "essay" ? "medium" : "easy",
    prompt: createLocalizedEmpty(),
  });
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
    const averageObjectiveScore = completedRows.length
      ? completedRows.reduce((total, row) => total + row.submission.objectiveScore, 0) / completedRows.length
      : 0;
    const averageEssayScore = reviewedRows.length
      ? reviewedRows.reduce((total, row) => total + row.submission.essayScore, 0) / reviewedRows.length
      : 0;
    const averageTotalScore = reviewedRows.length
      ? reviewedRows.reduce((total, row) => total + row.submission.totalScore, 0) / reviewedRows.length
      : 0;
    const averageRight = completedRows.length
      ? completedRows.reduce((total, row) => total + row.submission.rightCount, 0) / completedRows.length
      : 0;
    const averageWrong = completedRows.length
      ? completedRows.reduce((total, row) => total + row.submission.wrongCount, 0) / completedRows.length
      : 0;
    const hasPendingEssayReview = completedRows.some((row) => isRound1EssayPending(row.submission));
    const latestSubmittedAt = completedRows
      .map((row) => row.submission.submittedAt)
      .sort((left, right) => right.localeCompare(left))[0];

    return {
      team,
      memberRows,
      completedRows,
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

    const leftReviewed = left.completedRows.length > 0 && !left.hasPendingEssayReview;
    const rightReviewed = right.completedRows.length > 0 && !right.hasPendingEssayReview;

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
    if (group.completedRows.length === 0 || group.hasPendingEssayReview) {
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
      difficulty: question.difficulty,
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

type BankPreviewSortKey = "type" | "topic" | "difficulty" | "question" | "answerKey";
type SortDirection = "asc" | "desc";

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
    averageObjectiveScore: group.completedRows.length ? Number(group.averageObjectiveScore.toFixed(2)) : "",
    averageEssayScore:
      group.completedRows.length === 0 || group.hasPendingEssayReview ? "" : Number(group.averageEssayScore.toFixed(2)),
    averageTotalScore:
      group.completedRows.length === 0 || group.hasPendingEssayReview ? "" : Number(group.averageTotalScore.toFixed(2)),
    latestSubmittedAt: group.latestSubmittedAt ?? "",
    standing: group.completedRows.length === 0 ? "Awaiting attempts" : group.hasPendingEssayReview ? "Essay pending" : "Reviewed",
  }));
}

function getStandingTone(group: TeamResultGroup): "info" | "success" | "warning" {
  if (group.team.memberIds.length < TEAM_MIN_MEMBERS) {
    return "warning";
  }

  if (!group.rank) {
    if (group.hasPendingEssayReview) {
      return "warning";
    }

    return "info";
  }

  return group.rank <= 50 ? "success" : "info";
}

function getStandingLabel(locale: Locale, group: TeamResultGroup) {
  if (group.team.memberIds.length < TEAM_MIN_MEMBERS) {
    return locale === "en" ? "Below minimum size" : "Chưa đủ số thành viên";
  }

  if (group.completedRows.length === 0) {
    return locale === "en" ? "Awaiting attempts" : "Đang chờ bài làm";
  }

  if (group.completedRows.length < group.memberRows.length) {
    return locale === "en" ? "In progress" : "Đang diễn ra";
  }

  if (group.hasPendingEssayReview) {
    return locale === "en" ? "Essay review pending" : "Đang chờ chấm tự luận";
  }

  if ((group.rank ?? Number.POSITIVE_INFINITY) <= 50) {
    return locale === "en" ? "Top 50 provisional" : "Top 50 tam thoi";
  }

  return locale === "en" ? "Ranked" : "Da xep hang";
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
  const { locale, round1TestBanks } = useSiteState();
  useAdminTitleScroll();

  const activeObjectiveBank = getActiveRound1Bank(round1TestBanks, "objective");
  const activeEssayBank = getActiveRound1Bank(round1TestBanks, "essay");
  const bankExportRows = buildBankExportRows(round1TestBanks);
  const draftBankCount = round1TestBanks.filter((bank) => bank.status === "draft").length;
  const objectivePoolCount = activeObjectiveBank?.questions.length ?? 0;
  const essayPoolCount = activeEssayBank?.questions.length ?? 0;

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

      {activeObjectiveBank && activeEssayBank ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            icon={<FileQuestion className="h-5 w-5 text-cyan-300" />}
            label={locale === "en" ? "Configured banks" : "Số bank"}
            value={round1TestBanks.length.toString()}
            note={
              draftBankCount > 0
                ? locale === "en"
                  ? `${draftBankCount} draft bank ready`
                  : `${draftBankCount} bank nháp đang chờ`
                : locale === "en"
                  ? "All current banks are active or archived"
                  : "Tất cả bank hiện tại đang active hoặc archived"
            }
          />
          <MetricCard
            icon={<ListOrdered className="h-5 w-5 text-emerald-300" />}
            label={locale === "en" ? "Objective pool" : "Kho trắc nghiệm"}
            value={objectivePoolCount.toString()}
            note={
              locale === "en"
                ? "Live questions currently in the objective bank"
                : "Số câu hiện có trong ngân hàng trắc nghiệm"
            }
          />
          <MetricCard
            icon={<Shuffle className="h-5 w-5 text-orange-300" />}
            label={locale === "en" ? "Paper structure" : "Cấu trúc đề"}
            value={`${ROUND1_OBJECTIVE_TOTAL} + ${ROUND1_ESSAY_TOTAL}`}
            note={locale === "en" ? "36 objective + 2 essay" : "36 trắc nghiệm + 2 tự luận"}
          />
          <MetricCard
            icon={<Target className="h-5 w-5 text-amber-300" />}
            label={locale === "en" ? "Essay pool" : "Kho tự luận"}
            value={essayPoolCount.toString()}
            note={
              locale === "en"
                ? "Live questions currently in the essay bank"
                : "Số câu hiện có trong ngân hàng tự luận"
            }
          />
        </section>
      ) : null}

      {activeObjectiveBank && activeEssayBank ? (
        <Surface className="px-6 py-6 md:px-8 md:py-8">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="space-y-2">
              <p className="theme-heading text-3xl font-semibold theme-text-strong">
                {locale === "en" ? "Round 1 test bank" : "Ngân hàng đề Vòng 1"}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() =>
                  exportRowsToWorkbook("attacker-2026-round1-banks.xlsx", "Round1Banks", bankExportRows)
                }
                className="rounded-full border theme-border theme-panel px-5 py-3 text-sm font-semibold theme-text-strong"
              >
                <span className="inline-flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  {locale === "en" ? "Export banks.xlsx" : "Xuat banks.xlsx"}
                </span>
              </button>
            </div>
          </div>

          <div className="mt-8 space-y-6">
            {[activeObjectiveBank, activeEssayBank].map((bank) => (
              <div key={bank.id} className="rounded-[1.75rem] border theme-border theme-panel-subtle px-6 py-6">
                <div className="flex flex-wrap items-center gap-3">
                  <StatusPill tone={bank.status === "active" ? "success" : "default"}>
                    {bank.status}
                  </StatusPill>
                  <StatusPill>{getBankTypeLabel(locale, bank.bankType)}</StatusPill>
                  <span className="text-xs uppercase tracking-[0.22em] theme-text-soft">
                    {formatDateLabel(locale, bank.publishedAt)}
                  </span>
                </div>
                <p className="mt-4 text-2xl font-semibold theme-text-strong">
                  {pickText(locale, bank.title)}
                </p>
                <p className="mt-4 text-sm leading-7 theme-text-muted">
                  {pickText(locale, bank.description)}
                </p>
                <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-[1.5rem] border theme-border theme-panel-strong px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.22em] theme-text-soft">
                      {locale === "en" ? "Pool size" : "Quy mô kho"}
                    </p>
                    <p className="mt-2 text-2xl font-semibold theme-text-strong">
                      {bank.questionPoolSize}
                    </p>
                  </div>
                  <div className="rounded-[1.5rem] border theme-border theme-panel-strong px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.22em] theme-text-soft">
                      {locale === "en" ? "Per paper" : "Mỗi đề"}
                    </p>
                    <p className="mt-2 text-2xl font-semibold theme-text-strong">
                      {bank.bankType === "objective" ? ROUND1_OBJECTIVE_TOTAL : ROUND1_ESSAY_TOTAL}
                    </p>
                  </div>
                  <div className="rounded-[1.5rem] border theme-border theme-panel-strong px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.22em] theme-text-soft">
                      {locale === "en" ? "Preview items" : "Câu preview"}
                    </p>
                    <p className="mt-2 text-2xl font-semibold theme-text-strong">
                      {bank.questions.length}
                    </p>
                  </div>
                  <div className="rounded-[1.5rem] border theme-border theme-panel-strong px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.22em] theme-text-soft">
                      {locale === "en" ? "Word limit" : "Giới hạn từ"}
                    </p>
                    <p className="mt-2 text-2xl font-semibold theme-text-strong">
                      {bank.wordLimit ? `${bank.wordLimit}` : "--"}
                    </p>
                  </div>
                </div>
                <div className="mt-6 space-y-3">
                  {bank.bankType === "objective" ? (
                    <>
                      <div className="rounded-[1.4rem] border theme-border theme-panel-subtle px-4 py-4">
                        <p className="text-sm font-semibold theme-text-strong">
                          {locale === "en" ? "Topic mix per student" : "Cơ cấu theo chủ đề trên mỗi thí sinh"}
                        </p>
                        <p className="mt-2 text-sm leading-6 theme-text-muted">
                          {locale === "en"
                            ? `${ROUND1_TOPIC_COUNT} topics × ${ROUND1_OBJECTIVE_QUESTIONS_PER_TOPIC} questions each.`
                            : `${ROUND1_TOPIC_COUNT} chủ đề × ${ROUND1_OBJECTIVE_QUESTIONS_PER_TOPIC} câu mỗi chủ đề.`}
                        </p>
                      </div>
                      <div className="rounded-[1.4rem] border theme-border theme-panel-subtle px-4 py-4">
                        <p className="text-sm font-semibold theme-text-strong">
                          {locale === "en" ? "Difficulty rule" : "Quy tắc độ khó"}
                        </p>
                        <p className="mt-2 text-sm leading-6 theme-text-muted">
                          {locale === "en"
                            ? `${ROUND1_OBJECTIVE_DIFFICULTY_MIX.easy} easy, ${ROUND1_OBJECTIVE_DIFFICULTY_MIX.medium} medium, ${ROUND1_OBJECTIVE_DIFFICULTY_MIX.hard} hard per topic.`
                            : `${ROUND1_OBJECTIVE_DIFFICULTY_MIX.easy} dễ, ${ROUND1_OBJECTIVE_DIFFICULTY_MIX.medium} trung bình, ${ROUND1_OBJECTIVE_DIFFICULTY_MIX.hard} khó trên mỗi chủ đề.`}
                        </p>
                      </div>
                      <div className="rounded-[1.4rem] border theme-border theme-panel-subtle px-4 py-4">
                        <p className="text-sm font-semibold theme-text-strong">
                          {locale === "en" ? "Shuffle rule" : "Quy tắc đảo đề"}
                        </p>
                        <p className="mt-2 text-sm leading-6 theme-text-muted">
                          {locale === "en"
                            ? "Objective questions are reordered per student, and answer options are shuffled per question."
                            : "Các câu trắc nghiệm được đảo theo từng thí sinh và thứ tự đáp án được đảo trên từng câu."}
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="rounded-[1.4rem] border theme-border theme-panel-subtle px-4 py-4">
                        <p className="text-sm font-semibold theme-text-strong">
                          {locale === "en" ? "Essay draw" : "Cơ chế rút tự luận"}
                        </p>
                        <p className="mt-2 text-sm leading-6 theme-text-muted">
                          {locale === "en"
                            ? `${ROUND1_ESSAY_TOTAL} essay questions are randomly selected from the separate ${bank.questionPoolSize}-question essay bank.`
                            : `${ROUND1_ESSAY_TOTAL} câu tự luận được rút ngẫu nhiên từ ngân hàng tự luận riêng gồm ${bank.questionPoolSize} câu.`}
                        </p>
                      </div>
                      <div className="rounded-[1.4rem] border theme-border theme-panel-subtle px-4 py-4">
                        <p className="text-sm font-semibold theme-text-strong">
                          {locale === "en" ? "Position in paper" : "Vị trí trong đề"}
                        </p>
                        <p className="mt-2 text-sm leading-6 theme-text-muted">
                          {locale === "en"
                            ? "Essay prompts are appended as the last 2 questions after the objective section."
                            : "Các câu tự luận được đặt ở 2 vị trí cuối, sau khi kết thúc phần trắc nghiệm."}
                        </p>
                      </div>
                      <div className="rounded-[1.4rem] border theme-border theme-panel-subtle px-4 py-4">
                        <p className="text-sm font-semibold theme-text-strong">
                          {locale === "en" ? "Response cap" : "Giới hạn trả lời"}
                        </p>
                        <p className="mt-2 text-sm leading-6 theme-text-muted">
                          {locale === "en"
                            ? `Each essay answer is capped at ${bank.wordLimit ?? ROUND1_ESSAY_WORD_LIMIT} words.`
                            : `Mỗi câu trả lời tự luận được giới hạn ${bank.wordLimit ?? ROUND1_ESSAY_WORD_LIMIT} từ.`}
                        </p>
                      </div>
                    </>
                  )}
                </div>
                <div className="mt-6">
                  <Link
                    href={`/admin/round-1/banks/${bank.id}`}
                    className="theme-button-primary inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
                  >
                    {locale === "en" ? "Open bank detail" : "Mở chi tiết bank"}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </Surface>
      ) : (
        <NotFoundState
          title={locale === "en" ? "No Round 1 bank configured yet." : "Chưa có bank Vòng 1 nào được cấu hình."}
          description={
            locale === "en"
              ? "Seed or create a bank first before reviewing Round 1 delivery settings."
              : "Hãy seed hoặc tạo bank trước khi xem cấu hình phát đề Vòng 1."
          }
          href="/admin"
          actionLabel={locale === "en" ? "Back to admin" : "Quay lai admin"}
        />
      )}
    </div>
  );
}

export function AdminRound1ScoresManager() {
  const { locale, round1Submissions, teams, users } = useSiteState();
  useAdminTitleScroll();

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
  } = useAdminTablePagination(individualRows, ADMIN_TABLE_PAGE_SIZE);
  const {
    page: teamPage,
    setPage: setTeamPage,
    pageCount: teamPageCount,
    startIndex: teamStartIndex,
    paginatedRows: paginatedTeamRows,
  } = useAdminTablePagination(teamGroups, ADMIN_TABLE_PAGE_SIZE);

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
                  locale === "en" ? "Submitted at" : "Thời điểm nộp",
                  locale === "en" ? "Review" : "Chấm điểm",
                  locale === "en" ? "Detail" : "Chi tiết",
                ].map((label) => (
                  <th key={label} className="px-4 py-3 font-medium">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedIndividualRows.map((row, index) => (
                <tr key={row.submissionId} className="border-b theme-border last:border-b-0">
                  <td className="px-4 py-4 text-xs font-semibold theme-text-soft">
                    {individualStartIndex + index + 1}
                  </td>
                  <td className="px-4 py-4">
                    <Link href={`/admin/users/${row.userId}/profile`} className="font-semibold theme-accent">
                      {row.studentName}
                    </Link>
                    <p className="mt-1 text-xs theme-text-soft">{row.studentLoginId || row.userId}</p>
                  </td>
                  <td className="px-4 py-4">
                    <Link href={`/admin/teams/${row.teamId}`} className="font-semibold theme-accent">
                      {row.teamName}
                    </Link>
                    <p className="mt-1 text-xs theme-text-soft">{row.teamTag}</p>
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
                      <StatusPill tone="warning">{locale === "en" ? "Pending" : "Đang chờ"}</StatusPill>
                    ) : (
                      <StatusPill tone="info">{`${row.essayScore.toFixed(2)} / ${ROUND1_ESSAY_MAX_SCORE}`}</StatusPill>
                    )}
                  </td>
                  <td className="px-4 py-4 text-center">
                    {row.totalScore == null ? (
                      <StatusPill tone="warning">{locale === "en" ? "Pending" : "Đang chờ"}</StatusPill>
                    ) : (
                      <StatusPill
                        tone={row.totalScore >= 80 ? "success" : row.totalScore >= 65 ? "info" : "warning"}
                      >
                        {`${row.totalScore.toFixed(2)} / ${ROUND1_TOTAL_MAX_SCORE}`}
                      </StatusPill>
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
          pageSize={ADMIN_TABLE_PAGE_SIZE}
          totalRows={individualRows.length}
          onPageChange={setIndividualPage}
        />
      </Surface>

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
                  locale === "en" ? "Completed" : "Đã làm",
                  locale === "en" ? "Objective avg" : "TB trắc nghiệm",
                  locale === "en" ? "Essay avg" : "TB tự luận",
                  locale === "en" ? "Total avg" : "TB tổng",
                  locale === "en" ? "Latest activity" : "Cập nhật gần nhất",
                  locale === "en" ? "Standing" : "Trạng thái",
                  locale === "en" ? "Detail" : "Chi tiết",
                ].map((label) => (
                  <th key={label} className="px-4 py-3 font-medium">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedTeamRows.map((group, index) => (
                <tr key={group.team.id} className="border-b theme-border last:border-b-0">
                  <td className="px-4 py-4 text-xs font-semibold theme-text-soft">{teamStartIndex + index + 1}</td>
                  <td className="px-4 py-4 theme-text-body">{group.rank ?? "-"}</td>
                  <td className="px-4 py-4">
                    <Link href={`/admin/teams/${group.team.id}`} className="font-semibold theme-accent">
                      {group.team.name}
                    </Link>
                    <p className="mt-1 text-xs theme-text-soft">
                      {group.team.tag} · {locale === "en" ? `Keyword: ${group.team.track}` : `Từ khóa: ${group.team.track}`}
                    </p>
                  </td>
                  <td className="px-4 py-4 theme-text-body">
                    {group.completedRows.length}/{group.memberRows.length}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <StatusPill
                      tone={
                        group.averageObjectiveScore >= ROUND1_OBJECTIVE_MAX_SCORE * 0.8
                          ? "success"
                          : group.averageObjectiveScore > 0
                            ? "info"
                            : "warning"
                      }
                    >
                      {group.completedRows.length > 0
                        ? `${group.averageObjectiveScore.toFixed(2)} / ${ROUND1_OBJECTIVE_MAX_SCORE}`
                        : "--"}
                    </StatusPill>
                  </td>
                  <td className="px-4 py-4 text-center">
                    {group.completedRows.length === 0 ? (
                      "--"
                    ) : group.hasPendingEssayReview ? (
                      <StatusPill tone="warning">{locale === "en" ? "Pending" : "Đang chờ"}</StatusPill>
                    ) : (
                      <StatusPill tone="info">{`${group.averageEssayScore.toFixed(2)} / ${ROUND1_ESSAY_MAX_SCORE}`}</StatusPill>
                    )}
                  </td>
                  <td className="px-4 py-4 text-center">
                    {group.completedRows.length === 0 ? (
                      "--"
                    ) : group.hasPendingEssayReview ? (
                      <StatusPill tone="warning">{locale === "en" ? "Pending" : "Đang chờ"}</StatusPill>
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
                      {getStandingLabel(locale, group)}
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
          pageSize={ADMIN_TABLE_PAGE_SIZE}
          totalRows={teamGroups.length}
          onPageChange={setTeamPage}
        />
      </Surface>
    </div>
  );
}

export function AdminRound1BankDetail({ bankId }: { bankId: string }) {
  const { locale, round1TestBanks } = useSiteState();
  useAdminTitleScroll();
  const bank = round1TestBanks.find((item) => item.id === bankId);
  const questionList = useMemo(() => bank?.questions ?? [], [bank]);
  const [questionSearch, setQuestionSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | Round1QuestionType>("all");
  const [topicFilter, setTopicFilter] = useState("all");
  const [difficultyFilter, setDifficultyFilter] = useState<"all" | Round1Question["difficulty"]>("all");
  const [sortKey, setSortKey] = useState<BankPreviewSortKey | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const bankExportRows = bank ? buildBankExportRows([bank]) : [];
  const topicOptions = useMemo(
    () => [...new Set(questionList.map((question) => question.topic))].sort(createStringCompare(locale)),
    [questionList, locale],
  );
  const filteredQuestions = useMemo(
    () =>
      questionList.filter((question) => {
        const searchSource = [
          pickRound1TypeLabel(locale, question.type),
          question.topic,
          question.difficulty,
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

        if (difficultyFilter !== "all" && question.difficulty !== difficultyFilter) {
          return false;
        }

        return true;
      }),
    [difficultyFilter, locale, questionList, questionSearch, topicFilter, typeFilter],
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
  } = useAdminTablePagination(sortedQuestions, ADMIN_TABLE_PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [difficultyFilter, questionSearch, setPage, sortDirection, sortKey, topicFilter, typeFilter]);

  const toggleSort = (nextSortKey: BankPreviewSortKey) => {
    if (sortKey === nextSortKey) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(nextSortKey);
    setSortDirection(getDefaultBankPreviewSortDirection(nextSortKey));
  };

  if (!bank) {
    return (
      <NotFoundState
        title={locale === "en" ? "Round 1 bank not found." : "Khong tim thay bank Vong 1."}
        description={
          locale === "en"
            ? "This bank may not exist in the current browser dataset."
            : "Bank nay co the khong ton tai trong bo du lieu hien tai cua trinh duyet."
        }
        href="/admin/round-1"
        actionLabel={locale === "en" ? "Back to Round 1" : "Quay lai Vong 1"}
      />
    );
  }

  return (
    <div className="space-y-8">
      <Link href="/admin/round-1" className="inline-flex items-center gap-2 text-sm font-semibold theme-accent">
        <ArrowLeft className="h-4 w-4" />
        {locale === "en" ? "Back to Round 1" : "Quay lai Vong 1"}
      </Link>

      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <SectionHeading
          id={ADMIN_TITLE_ID}
          className="scroll-mt-32"
          eyebrow={locale === "en" ? "Admin / Round 1 / Test bank" : "Admin / Vong 1 / Test bank"}
          title={pickText(locale, bank.title)}
        />
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/admin/round-1/banks/${bank.id}/questions/new`}
            className="theme-button-primary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
          >
            <FileQuestion className="h-4 w-4" />
            {locale === "en" ? "Add question" : "Them cau hoi"}
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
              {locale === "en" ? "Export bank detail" : "Xuat chi tiet bank"}
            </span>
          </button>
        </div>
      </div>

      <Surface className="px-6 py-6 md:px-8 md:py-8">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="theme-heading text-3xl font-semibold theme-text-strong">
              {locale === "en" ? "Previewed question set" : "Tap cau hoi preview"}
            </p>
            <p className="mt-3 text-sm leading-7 theme-text-muted">
              {locale === "en"
                ? "These are the authored preview items available in the frontend dataset. They help the committee validate wording, topic spread, and structure before the real bank is finalized."
                : "Đây là các câu hỏi preview đang có trong dataset frontend. Chúng giúp ban tổ chức kiểm tra wording, độ phủ chủ đề và cấu trúc trước khi bank thực tế được chốt."}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 xl:grid-cols-[minmax(0,1.35fr)_220px_220px_220px]">
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
                placeholder={locale === "en" ? "Search by prompt, topic, type..." : "Tìm theo câu hỏi, chủ đề, loại..."}
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
              className="theme-field h-12 w-full rounded-[1rem] border px-4 text-sm outline-none"
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
              className="theme-field h-12 w-full rounded-[1rem] border px-4 text-sm outline-none"
            >
              <option value="all">{locale === "en" ? "All topics" : "Tất cả chủ đề"}</option>
              {topicOptions.map((topic) => (
                <option key={topic} value={topic}>
                  {topic}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] theme-eyebrow">
              <Filter className="h-3.5 w-3.5" />
              {locale === "en" ? "Difficulty" : "Độ khó"}
            </span>
            <select
              value={difficultyFilter}
              onChange={(event) => setDifficultyFilter(event.target.value as "all" | Round1Question["difficulty"])}
              className="theme-field h-12 w-full rounded-[1rem] border px-4 text-sm outline-none"
            >
              <option value="all">{locale === "en" ? "All levels" : "Tất cả mức độ"}</option>
              <option value="easy">{locale === "en" ? "Easy" : "Dễ"}</option>
              <option value="medium">{locale === "en" ? "Medium" : "Trung bình"}</option>
              <option value="hard">{locale === "en" ? "Hard" : "Khó"}</option>
            </select>
          </label>
        </div>

        <div className="mt-8 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b theme-border bg-[var(--panel-strong)] theme-text-soft">
              <tr>
                <th className="px-4 py-3 font-medium">#</th>
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
                <th className="px-4 py-3 font-medium">
                  <SortableTableHeader
                    label={locale === "en" ? "Difficulty" : "Độ khó"}
                    active={sortKey === "difficulty"}
                    direction={sortDirection}
                    onClick={() => toggleSort("difficulty")}
                  />
                </th>
                <th className="px-4 py-3 font-medium">
                  <SortableTableHeader
                    label={locale === "en" ? "Question" : "Câu hỏi"}
                    active={sortKey === "question"}
                    direction={sortDirection}
                    onClick={() => toggleSort("question")}
                  />
                </th>
                <th className="px-4 py-3 font-medium">
                  <SortableTableHeader
                    label={locale === "en" ? "Answer key" : "Đáp án"}
                    active={sortKey === "answerKey"}
                    direction={sortDirection}
                    onClick={() => toggleSort("answerKey")}
                  />
                </th>
                <th className="px-4 py-3 font-medium">
                  {locale === "en" ? "Edit" : "Chỉnh sửa"}
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((question, index) => (
                <tr key={question.id} className="border-b theme-border last:border-b-0">
                  <td className="px-4 py-4 theme-text-body">{startIndex + index + 1}</td>
                  <td className="px-4 py-4">
                    <StatusPill>{pickRound1TypeLabel(locale, question.type)}</StatusPill>
                  </td>
                  <td className="px-4 py-4 theme-text-body">{question.topic}</td>
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
                      {question.difficulty}
                    </StatusPill>
                  </td>
                  <td className="px-4 py-4 theme-text-body">
                    <p>{pickRound1QuestionText(question.prompt)}</p>
                    <p className="mt-2 text-xs theme-text-soft">
                      {getRound1QuestionOptionPreview(question, locale)}
                    </p>
                  </td>
                  <td className="px-4 py-4 theme-text-body">
                    {getRound1AnswerSummary(question, locale)}
                  </td>
                  <td className="px-4 py-4">
                    <Link
                      href={`/admin/round-1/banks/${bank.id}/questions/${question.id}`}
                      title={locale === "en" ? "Open question editor" : "Mở trang sửa câu hỏi"}
                      aria-label={locale === "en" ? "Open question editor" : "Mở trang sửa câu hỏi"}
                      className="theme-button-secondary inline-flex h-9 w-9 items-center justify-center rounded-full"
                    >
                      <ArrowRight className="h-3.5 w-3.5" />
                      <span className="sr-only">{locale === "en" ? "Open question editor" : "Mở trang sửa câu hỏi"}</span>
                    </Link>
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
          totalRows={sortedQuestions.length}
          onPageChange={setPage}
        />
      </Surface>
    </div>
  );
}

export function AdminRound1TeamResultDetail({ teamId }: { teamId: string }) {
  const { locale, round1Submissions, round1TestBanks, teams, users, updateRound1EssayScoreByAdmin } = useSiteState();
  useAdminTitleScroll();
  const team = teams.find((item) => item.id === teamId);
  const teamGroups = buildTeamResultGroups(round1Submissions, teams, users);
  const group = teamGroups.find((item) => item.team.id === teamId);
  const leader = team ? users.find((user) => user.id === team.leaderId) : undefined;
  const bankTitleById = new Map(round1TestBanks.map((bank) => [bank.id, bank.title]));
  const [essayDrafts, setEssayDrafts] = useState<Record<string, string>>(() =>
    round1Submissions.reduce<Record<string, string>>((result, submission) => {
      result[submission.id] = submission.essayScore == null ? "" : String(submission.essayScore);
      return result;
    }, {}),
  );
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
        title={locale === "en" ? "Team result not found." : "Khong tim thay ket qua doi."}
        description={
          locale === "en"
            ? "This team may no longer exist in the current admin dataset."
            : "Doi nay co the khong con ton tai trong bo du lieu admin hien tai."
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
            {locale === "en" ? "Open team record" : "Mo ho so doi"}
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
              {locale === "en" ? "Export team detail" : "Xuat chi tiet doi"}
            </span>
          </button>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={<Trophy className="h-5 w-5 text-amber-300" />}
          label={locale === "en" ? "Current rank" : "Hang hien tai"}
          value={group.rank ? `#${group.rank}` : "--"}
          note={getStandingLabel(locale, group)}
        />
        <MetricCard
          icon={<UsersRound className="h-5 w-5 text-cyan-300" />}
          label={locale === "en" ? "Completed members" : "Thanh vien da lam"}
          value={`${group.completedRows.length}/${group.memberRows.length}`}
          note={
            locale === "en"
              ? "Only completed attempts count into the current average"
              : "Chi cac bai da nop moi duoc tinh vao diem trung binh hien tai"
          }
        />
        <MetricCard
          icon={<Target className="h-5 w-5 text-emerald-300" />}
          label={locale === "en" ? "Objective average" : "Điểm trung bình trắc nghiệm"}
          value={group.completedRows.length ? `${group.averageObjectiveScore.toFixed(2)} / ${ROUND1_OBJECTIVE_MAX_SCORE}` : "--"}
          note={
            group.completedRows.length
              ? `${group.averageRight.toFixed(1)} / ${group.averageWrong.toFixed(1)}`
              : locale === "en"
                ? "No completed attempt yet"
                : "Chua co bai lam nao"
          }
        />
        <MetricCard
          icon={<Clock3 className="h-5 w-5 text-orange-300" />}
          label={locale === "en" ? "Total average" : "Điểm trung bình tổng"}
          value={
            group.completedRows.length === 0
              ? "--"
              : group.hasPendingEssayReview
                ? locale === "en"
                  ? "Pending"
                  : "Đang chờ"
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
            {locale === "en" ? "Team context" : "Thong tin doi"}
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-[1.5rem] border theme-border theme-panel-subtle px-4 py-4">
              <p className="text-xs uppercase tracking-[0.22em] theme-text-soft">
                {locale === "en" ? "Leader" : "Doi truong"}
              </p>
              <p className="mt-2 text-lg font-semibold theme-text-strong">
                {leader?.name ?? "--"}
              </p>
              {leader ? (
                <Link href={`/admin/users/${leader.id}`} className="mt-2 inline-flex text-sm font-semibold theme-accent">
                  {leader.email}
                </Link>
              ) : null}
            </div>
            <div className="rounded-[1.5rem] border theme-border theme-panel-subtle px-4 py-4">
              <p className="text-xs uppercase tracking-[0.22em] theme-text-soft">
                {locale === "en" ? "Keyword" : "Từ khóa"}
              </p>
              <p className="mt-2 text-lg font-semibold theme-text-strong">{team.track}</p>
            </div>
            <div className="rounded-[1.5rem] border theme-border theme-panel-subtle px-4 py-4 md:col-span-2">
              <p className="text-xs uppercase tracking-[0.22em] theme-text-soft">
                {locale === "en" ? "Team bio" : "Bio cua doi"}
              </p>
              <p className="mt-2 text-sm leading-7 theme-text-muted">
                {team.bio || "--"}
              </p>
            </div>
          </div>
        </Surface>

        <Surface className="px-6 py-6">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] theme-text-soft">
            {locale === "en" ? "Round 1 standing" : "Trang thai Vong 1"}
          </p>
          <div className="mt-5 space-y-4">
            <div className="rounded-[1.4rem] border theme-border theme-panel-subtle px-4 py-4">
              <p className="text-sm theme-text-muted">
                {locale === "en" ? "Current status" : "Trang thai hien tai"}
              </p>
              <div className="mt-3">
                <StatusPill tone={getStandingTone(group)}>
                  {getStandingLabel(locale, group)}
                </StatusPill>
              </div>
            </div>
            <div className="rounded-[1.4rem] border theme-border theme-panel-subtle px-4 py-4">
              <p className="text-sm theme-text-muted">
                {locale === "en" ? "Scoring rule" : "Quy tac tinh diem"}
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
            {locale === "en" ? "Member-by-member Round 1 results" : "Ket qua Vong 1 theo tung thanh vien"}
          </p>
          <p className="mt-3 text-sm leading-7 theme-text-muted">
            {locale === "en"
              ? "This table shows every current member in the team. Pending members remain visible so admin and moderator accounts can see completion gaps immediately."
              : "Bang nay hien tat ca thanh vien hien tai cua doi. Thanh vien chua nop bai van duoc hien de admin va moderator thay ngay cac khoang trong ve tien do."}
          </p>
        </div>

        <div className="mt-8 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b theme-border bg-[var(--panel-strong)] theme-text-soft">
              <tr>
                {[
                  "#",
                  locale === "en" ? "Member" : "Thanh vien",
                  locale === "en" ? "Role" : "Vai tro",
                  locale === "en" ? "University / Major" : "Truong / Nganh",
                  locale === "en" ? "Right" : "Dung",
                  locale === "en" ? "Wrong" : "Sai",
                  locale === "en" ? "Objective" : "Khach quan",
                  locale === "en" ? "Essay" : "Tu luan",
                  locale === "en" ? "Total" : "Tong",
                  locale === "en" ? "Duration" : "Thoi gian",
                  locale === "en" ? "Submitted at" : "Thoi diem nop",
                  locale === "en" ? "Review" : "Cham diem",
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
                        : "Doi truong"
                      : locale === "en"
                        ? "Member"
                        : "Thanh vien"}
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
                          {locale === "en" ? "Pending" : "Dang cho"}
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
                          {locale === "en" ? "Pending" : "Dang cho"}
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
                      <div className="space-y-2">
                        <input
                          type="number"
                          min={0}
                          max={ROUND1_ESSAY_MAX_SCORE}
                          step="1"
                          value={essayDrafts[row.submission.id] ?? ""}
                          onChange={(event) =>
                            setEssayDrafts((current) => ({
                              ...current,
                              [row.submission!.id]: event.target.value,
                            }))
                          }
                          placeholder="0-28"
                          className="theme-placeholder w-24 rounded-xl border theme-border theme-panel px-3 py-2 text-sm theme-text-strong outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const value = Number(essayDrafts[row.submission!.id]);
                            if (Number.isFinite(value)) {
                              updateRound1EssayScoreByAdmin(row.submission!.id, value);
                            }
                          }}
                          className="rounded-full border theme-border theme-panel px-3 py-2 text-xs font-semibold theme-text-strong"
                        >
                          {locale === "en" ? "Save essay" : "Luu diem tu luan"}
                        </button>
                      </div>
                    ) : (
                      <StatusPill tone="default">
                        {locale === "en" ? "Pending" : "Dang cho"}
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
  const { locale, round1TestBanks, createRound1QuestionByAdmin, updateRound1QuestionByAdmin } = useSiteState();
  const bank = round1TestBanks.find((item) => item.id === bankId);
  const sourceQuestion = mode === "edit" ? bank?.questions.find((item) => item.id === questionId) : undefined;
  const questionIndex = mode === "edit" ? bank?.questions.findIndex((item) => item.id === questionId) ?? -1 : -1;
  const pristineQuestion = useMemo(() => {
    if (!bank) {
      return null;
    }

    if (mode === "create") {
      return createRound1QuestionDraftForBank(bank);
    }

    return sourceQuestion ? cloneRound1Question(sourceQuestion) : null;
  }, [bank, mode, sourceQuestion]);
  const [draft, setDraft] = useState<Round1Question | null>(() =>
    pristineQuestion ? cloneRound1Question(pristineQuestion) : null,
  );
  const [savePending, setSavePending] = useState(false);

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
              : "Khong tim thay bank Vong 1."
            : locale === "en"
              ? "Round 1 question not found."
              : "Khong tim thay cau hoi Vong 1."
        }
        description={
          mode === "create"
            ? locale === "en"
              ? "This bank may not exist in the current browser dataset."
              : "Bank nay co the khong ton tai trong bo du lieu hien tai cua trinh duyet."
            : locale === "en"
              ? "This question may not exist in the current bank dataset."
              : "Cau hoi nay co the khong ton tai trong du lieu bank hien tai."
        }
        href={bank ? `/admin/round-1/banks/${bank.id}` : "/admin/round-1"}
        actionLabel={locale === "en" ? "Back to test bank" : "Quay lai test bank"}
      />
    );
  }

  const saveDraft = async () => {
    if (mode === "create") {
      setSavePending(true);
      const createdQuestionId = await createRound1QuestionByAdmin(bank.id, draft);
      setSavePending(false);

      if (createdQuestionId) {
        router.push(`/admin/round-1/banks/${bank.id}/questions/${createdQuestionId}`);
      }
      return;
    }

    if (sourceQuestion) {
      updateRound1QuestionByAdmin(bank.id, sourceQuestion.id, draft);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-3 text-sm font-semibold">
        <Link href="/admin/round-1" className="inline-flex items-center gap-2 theme-accent">
          <ArrowLeft className="h-4 w-4" />
          {locale === "en" ? "Back to Round 1" : "Quay lai Vong 1"}
        </Link>
        <span className="theme-text-soft">/</span>
        <Link href={`/admin/round-1/banks/${bank.id}`} className="theme-accent">
          {locale === "en" ? "Back to bank detail" : "Quay lai chi tiet bank"}
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
                : "Admin / Vong 1 / Them cau hoi"
              : locale === "en"
                ? "Admin / Round 1 / Edit question"
                : "Admin / Vong 1 / Sua cau hoi"
          }
          title={
            mode === "create"
              ? locale === "en"
                ? "New question draft"
                : "Bản nháp câu hỏi mới"
              : locale === "en"
                ? `Question ${questionIndex + 1} editor`
                : `Editor cau hoi ${questionIndex + 1}`
          }
          description={
            mode === "create"
              ? locale === "en"
                ? "Create a new question for this test bank. The question ID is generated automatically when you save."
                : "Tạo câu hỏi mới cho test bank này. Mã câu hỏi sẽ được tạo tự động khi bạn lưu."
              : locale === "en"
                ? "Update the question prompt, topic, difficulty, question type, and response structure for this question inside the selected test bank."
                : "Cap nhat prompt, chu de, do kho, loai cau hoi va cau truc tra loi cho cau hoi nay trong test bank da chon."
          }
        />
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => pristineQuestion && setDraft(cloneRound1Question(pristineQuestion))}
            className="rounded-full border theme-border theme-panel px-5 py-3 text-sm font-semibold theme-text-strong"
          >
            {locale === "en" ? "Reset draft" : "Dat lai ban nhap"}
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
                : "Tao cau hoi"
              : locale === "en"
                ? "Save question"
                : "Luu cau hoi"}
          </button>
        </div>
      </div>

      <section>
        <Surface className="px-6 py-6 md:px-8 md:py-8">
          <div className="grid gap-4 md:grid-cols-3">
            <label className="space-y-2">
              <span className="text-sm theme-text-muted">
                {locale === "en" ? "Topic" : "Chu de"}
              </span>
              <input
                value={draft.topic}
                onChange={(event) => setDraft((current) => (current ? { ...current, topic: event.target.value } : current))}
                className={fieldClassName}
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm theme-text-muted">
                {locale === "en" ? "Difficulty" : "Do kho"}
              </span>
              <select
                value={draft.difficulty}
                onChange={(event) =>
                  setDraft((current) =>
                    current
                      ? {
                          ...current,
                          difficulty: event.target.value as Round1Question["difficulty"],
                        }
                      : current,
                  )
                }
                className={fieldClassName}
              >
                <option value="easy">easy</option>
                <option value="medium">medium</option>
                <option value="hard">hard</option>
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm theme-text-muted">
                {locale === "en" ? "Question type" : "Loai cau hoi"}
              </span>
              <select
                value={draft.type}
                onChange={(event) =>
                  setDraft((current) =>
                    current
                      ? convertRound1QuestionType(
                          current,
                          event.target.value as Round1QuestionType,
                        )
                      : current,
                  )
                }
                className={fieldClassName}
              >
                {(
                  [
                    "true-false",
                    "single-choice",
                    "multiple-choice",
                    "pairing",
                    "essay",
                  ] as Round1QuestionType[]
                ).map((type) => (
                  <option key={type} value={type}>
                    {pickRound1TypeLabel(locale, type)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-6">
            <QuestionContentFieldEditor
              label={locale === "en" ? "Question prompt" : "Prompt cau hoi"}
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
                        : "Cau truc noi cap"
                      : locale === "en"
                        ? "Answer options"
                        : "Cac dap an"}
                  </p>
                  <p className="mt-2 text-sm leading-7 theme-text-muted">
                    {draft.type === "multiple-choice"
                      ? locale === "en"
                        ? "Edit the answer options, then mark all correct answers."
                        : "Chinh sua cac lua chon, sau do danh dau tat ca dap an dung."
                      : draft.type === "pairing"
                        ? locale === "en"
                          ? "Configure the right-side answer list, then map each left-side prompt to its correct match."
                          : "Cau hinh danh sach ben phai, sau do noi moi prompt ben trai voi dap an dung."
                        : locale === "en"
                          ? "Edit the answer options, then mark the correct answer."
                          : "Chinh sua cac lua chon, sau do danh dau dap an dung."}
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
                            {locale === "en" ? `Option ${option.label}` : `Lua chon ${option.label}`}
                          </p>
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
                                  : "Dap an dung"
                                : locale === "en"
                                  ? "Correct answer"
                                  : "Dap an dung"}
                            </span>
                          </label>
                        </div>

                        <div className="mt-4">
                          <QuestionContentFieldEditor
                            label={locale === "en" ? `Option ${option.label} text` : `Noi dung ${option.label}`}
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
                    {locale === "en" ? "Left-side prompts" : "Cac muc ben trai"}
                  </p>
                  <div className="mt-6 grid gap-4">
                    {draft.pairingItems.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-[1.75rem] border theme-border theme-panel-subtle px-5 py-5"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <p className="text-lg font-semibold theme-text-strong">
                            {locale === "en" ? `Prompt ${item.label}` : `Muc ${item.label}`}
                          </p>
                          <label className="space-y-2">
                            <span className="text-sm theme-text-muted">
                              {locale === "en" ? "Correct match" : "Cap noi dung"}
                            </span>
                            <select
                              value={item.correctOptionId}
                              onChange={(event) =>
                                setDraft((current) =>
                                  current
                                    ? {
                                        ...current,
                                        pairingItems: (current.pairingItems ?? []).map((pairingItem) =>
                                          pairingItem.id === item.id
                                            ? { ...pairingItem, correctOptionId: event.target.value }
                                            : pairingItem,
                                        ),
                                      }
                                    : current,
                                )
                              }
                              className={fieldClassName}
                            >
                              {(draft.options ?? []).map((option) => (
                                <option key={option.id} value={option.id}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </label>
                        </div>
                        <div className="mt-4">
                          <QuestionContentFieldEditor
                            label={locale === "en" ? `Prompt ${item.label}` : `Noi dung ${item.label}`}
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
                  {locale === "en" ? "Essay settings" : "Cau hinh tu luan"}
                </p>
                <p className="mt-2 text-sm leading-7 theme-text-muted">
                  {locale === "en"
                    ? "Define what students see inside the text area and what moderators should use to review the response."
                    : "Xac dinh noi dung sinh vien nhin thay trong o nhap va ghi chu de moderator dung khi xem bai."}
                </p>
              </div>
              <QuestionContentFieldEditor
                label={locale === "en" ? "Essay placeholder" : "Placeholder bai viet"}
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
                label={locale === "en" ? "Rubric note" : "Ghi chu rubric"}
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
