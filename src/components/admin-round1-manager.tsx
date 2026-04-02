"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Clock3,
  Download,
  FileQuestion,
  ListOrdered,
  Save,
  Shuffle,
  Target,
  Trophy,
  UsersRound,
} from "lucide-react";
import * as XLSX from "xlsx";

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

const fieldClassName =
  "theme-placeholder w-full rounded-2xl border theme-border theme-panel px-4 py-3 text-sm theme-text-strong outline-none";

function cloneRound1Question(question: Round1Question): Round1Question {
  return JSON.parse(JSON.stringify(question)) as Round1Question;
}

function LocalizedFieldEditor({
  label,
  value,
  rows = 3,
  onChange,
}: {
  label: string;
  value: LocalizedText;
  rows?: number;
  onChange: (locale: Locale, nextValue: string) => void;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {(["en", "vi"] as Locale[]).map((locale) => (
        <label key={locale} className="space-y-2">
          <span className="text-sm theme-text-muted">
            {`${label} (${locale.toUpperCase()})`}
          </span>
          <textarea
            rows={rows}
            value={value[locale]}
            onChange={(event) => onChange(locale, event.target.value)}
            className={fieldClassName}
          />
        </label>
      ))}
    </div>
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
      questionPoolSize: bank.questionPoolSize,
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

  return locale === "en" ? "Objective bank" : "Ngân hàng khách quan";
}

function buildSubmissionExportRows(
  teamGroups: TeamResultGroup[],
  round1TestBanks: Round1TestBank[],
) {
  const bankTitleById = new Map(round1TestBanks.map((bank) => [bank.id, bank.title.en]));

  return teamGroups.flatMap((group) =>
    group.memberRows.map((row) => ({
      teamRank: group.rank ?? "",
      team: group.team.name,
      teamTag: group.team.tag,
      members: group.memberRows.length,
      completedMembers: group.completedRows.length,
      teamAverageObjectiveScore: Number(group.averageObjectiveScore.toFixed(2)),
      teamAverageEssayScore: group.hasPendingEssayReview ? "" : Number(group.averageEssayScore.toFixed(2)),
      teamAverageTotalScore: group.hasPendingEssayReview ? "" : Number(group.averageTotalScore.toFixed(2)),
      student: row.student.name,
      email: row.student.email,
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
      bank: row.submission ? bankTitleById.get(row.submission.bankId) ?? row.submission.bankId : "",
    })),
  );
}

function getStandingTone(group: TeamResultGroup): "default" | "success" | "warning" {
  if (group.team.memberIds.length < TEAM_MIN_MEMBERS) {
    return "warning";
  }

  if (!group.rank) {
    if (group.hasPendingEssayReview) {
      return "warning";
    }

    return "default";
  }

  return group.rank <= 50 ? "success" : "default";
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
      <SectionHeading eyebrow="Admin / Round 1" title={title} description={description} />
      <Link href={href} className="mt-6 inline-flex items-center gap-2 text-sm font-semibold theme-accent">
        <ArrowLeft className="h-4 w-4" />
        {actionLabel}
      </Link>
    </Surface>
  );
}

export function AdminRound1Manager() {
  const { locale, round1Submissions, round1TestBanks, teams, users } = useSiteState();

  const activeObjectiveBank = getActiveRound1Bank(round1TestBanks, "objective");
  const activeEssayBank = getActiveRound1Bank(round1TestBanks, "essay");
  const teamGroups = buildTeamResultGroups(round1Submissions, teams, users);
  const bankExportRows = buildBankExportRows(round1TestBanks);
  const submissionExportRows = buildSubmissionExportRows(teamGroups, round1TestBanks);
  const draftBankCount = round1TestBanks.filter((bank) => bank.status === "draft").length;
  const rankedTeamCount = teamGroups.filter((group) => group.rank).length;

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow={locale === "en" ? "Admin / Round 1" : "Admin / Vòng 1"}
        title={
          locale === "en"
            ? "Round 1 now stays focused on one bank summary and one team-result summary."
            : "Vòng 1 giờ được tập trung vào một block tổng quan bank và một block tổng quan kết quả theo đội."
        }
        description={
          locale === "en"
            ? "Open the objective or essay bank detail page to review paper-generation settings, or open a team result page to inspect each member's Round 1 performance."
            : "Mở trang chi tiết ngân hàng khách quan hoặc tự luận để xem cấu hình tạo đề, hoặc mở trang chi tiết kết quả đội để xem kết quả Vòng 1 của từng thành viên."
        }
      />

      {activeObjectiveBank && activeEssayBank ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            icon={<FileQuestion className="h-5 w-5 text-cyan-300" />}
            label={locale === "en" ? "Configured banks" : "So bank"}
            value={round1TestBanks.length.toString()}
            note={
              draftBankCount > 0
                ? locale === "en"
                  ? `${draftBankCount} draft bank ready`
                  : `${draftBankCount} bank nhap dang cho`
                : locale === "en"
                  ? "All current banks are active or archived"
                  : "Tat ca bank hien tai dang active hoac archived"
            }
          />
          <MetricCard
            icon={<ListOrdered className="h-5 w-5 text-emerald-300" />}
            label={locale === "en" ? "Objective pool" : "Kho khách quan"}
            value={activeObjectiveBank.questionPoolSize.toString()}
            note={locale === "en" ? "Master 100-question bank" : "Ngân hàng gốc 100 câu"}
          />
          <MetricCard
            icon={<Shuffle className="h-5 w-5 text-orange-300" />}
            label={locale === "en" ? "Paper structure" : "Cấu trúc đề"}
            value={`${ROUND1_OBJECTIVE_TOTAL} + ${ROUND1_ESSAY_TOTAL}`}
            note={locale === "en" ? "36 objective + 2 essay" : "36 khách quan + 2 tự luận"}
          />
          <MetricCard
            icon={<Trophy className="h-5 w-5 text-amber-300" />}
            label={locale === "en" ? "Ranked teams" : "Đội đã xếp hạng"}
            value={rankedTeamCount.toString()}
            note={locale === "en" ? "Ordered by current average score" : "Sap xep theo diem trung binh hien tai"}
          />
        </section>
      ) : null}

      {activeObjectiveBank && activeEssayBank ? (
        <Surface className="px-6 py-6 md:px-8 md:py-8">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <p className="theme-heading text-3xl font-semibold theme-text-strong">
                {locale === "en" ? "Test bank summary" : "Tong quan test bank"}
              </p>
              <p className="mt-3 text-sm leading-7 theme-text-muted">
                {locale === "en"
                  ? "This summary now separates the active objective bank from the active essay bank. Open either detail page to inspect the authored preview set and delivery configuration."
                  : "Khối này tách riêng ngân hàng khách quan và ngân hàng tự luận đang active. Mở từng trang chi tiết để xem tập câu hỏi preview và cấu hình phát đề."}
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

          <div className="mt-8 grid gap-6 xl:grid-cols-2">
            {[activeObjectiveBank, activeEssayBank].map((bank) => (
              <div key={bank.id} className="rounded-[1.75rem] border theme-border theme-panel-subtle px-5 py-5">
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
                  <div className="rounded-[1.5rem] border theme-border bg-white/5 px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.22em] theme-text-soft">
                      {locale === "en" ? "Pool size" : "Quy mô kho"}
                    </p>
                    <p className="mt-2 text-2xl font-semibold theme-text-strong">
                      {bank.questionPoolSize}
                    </p>
                  </div>
                  <div className="rounded-[1.5rem] border theme-border bg-white/5 px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.22em] theme-text-soft">
                      {locale === "en" ? "Per paper" : "Mỗi đề"}
                    </p>
                    <p className="mt-2 text-2xl font-semibold theme-text-strong">
                      {bank.bankType === "objective" ? ROUND1_OBJECTIVE_TOTAL : ROUND1_ESSAY_TOTAL}
                    </p>
                  </div>
                  <div className="rounded-[1.5rem] border theme-border bg-white/5 px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.22em] theme-text-soft">
                      {locale === "en" ? "Preview items" : "Câu preview"}
                    </p>
                    <p className="mt-2 text-2xl font-semibold theme-text-strong">
                      {bank.questions.length}
                    </p>
                  </div>
                  <div className="rounded-[1.5rem] border theme-border bg-white/5 px-4 py-4">
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
                            : "Các câu khách quan được đảo theo từng thí sinh và thứ tự đáp án được đảo trên từng câu."}
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
                            : "Các câu tự luận được đặt ở 2 vị trí cuối, sau khi kết thúc phần khách quan."}
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

      <Surface className="px-6 py-6 md:px-8 md:py-8">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <p className="theme-heading text-3xl font-semibold theme-text-strong">
              {locale === "en" ? "Team result summary" : "Tong quan ket qua theo doi"}
            </p>
            <p className="mt-3 text-sm leading-7 theme-text-muted">
              {locale === "en"
                ? "Each row summarizes one team. Click the team name to open its admin record, or open the detail result page to inspect every member's Round 1 performance."
                : "Mỗi dòng tổng hợp một đội. Bấm tên đội để mở hồ sơ admin của đội, hoặc mở trang chi tiết kết quả để xem Vòng 1 của từng thành viên."}
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              exportRowsToWorkbook(
                "attacker-2026-round1-results.xlsx",
                "Round1Results",
                submissionExportRows,
              )
            }
            className="rounded-full border theme-border theme-panel px-5 py-3 text-sm font-semibold theme-text-strong"
          >
            <span className="inline-flex items-center gap-2">
              <Download className="h-4 w-4" />
              {locale === "en" ? "Export round1-results.xlsx" : "Xuat round1-results.xlsx"}
            </span>
          </button>
        </div>

        <div className="mt-8 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b theme-border bg-[var(--panel-strong)] theme-text-soft">
              <tr>
                {[
                  locale === "en" ? "Rank" : "Hang",
                  locale === "en" ? "Team" : "Đội",
                  locale === "en" ? "Completed" : "Da lam",
                  locale === "en" ? "Objective avg" : "TB khach quan",
                  locale === "en" ? "Essay avg" : "TB tu luan",
                  locale === "en" ? "Total avg" : "TB tong",
                  locale === "en" ? "Latest activity" : "Cap nhat gan nhat",
                  locale === "en" ? "Standing" : "Trang thai",
                  locale === "en" ? "Detail" : "Chi tiết",
                ].map((label) => (
                  <th key={label} className="px-4 py-3 font-medium">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {teamGroups.map((group) => (
                <tr key={group.team.id} className="border-b theme-border last:border-b-0">
                  <td className="px-4 py-4 theme-text-body">{group.rank ?? "-"}</td>
                  <td className="px-4 py-4">
                    <Link href={`/admin/teams/${group.team.id}`} className="font-semibold theme-accent">
                      {group.team.name}
                    </Link>
                    <p className="mt-1 text-xs theme-text-soft">
                      {group.team.tag} · {group.team.track}
                    </p>
                  </td>
                  <td className="px-4 py-4 theme-text-body">
                    {group.completedRows.length}/{group.memberRows.length}
                  </td>
                  <td className="px-4 py-4">
                    <StatusPill
                      tone={
                        group.averageObjectiveScore >= ROUND1_OBJECTIVE_MAX_SCORE * 0.8
                          ? "success"
                          : group.averageObjectiveScore > 0
                            ? "default"
                            : "warning"
                      }
                    >
                      {group.completedRows.length > 0 ? `${group.averageObjectiveScore.toFixed(2)} / ${ROUND1_OBJECTIVE_MAX_SCORE}` : "--"}
                    </StatusPill>
                  </td>
                  <td className="px-4 py-4 theme-text-body">
                    {group.completedRows.length === 0
                      ? "--"
                      : group.hasPendingEssayReview
                        ? locale === "en"
                          ? "Pending"
                          : "Đang chờ"
                        : `${group.averageEssayScore.toFixed(2)} / ${ROUND1_ESSAY_MAX_SCORE}`}
                  </td>
                  <td className="px-4 py-4">
                    {group.completedRows.length === 0 ? (
                      "--"
                    ) : group.hasPendingEssayReview ? (
                      <StatusPill tone="warning">
                        {locale === "en" ? "Pending" : "Đang chờ"}
                      </StatusPill>
                    ) : (
                      <StatusPill tone={group.averageTotalScore >= 80 ? "success" : group.averageTotalScore >= 65 ? "default" : "warning"}>
                        {`${group.averageTotalScore.toFixed(2)} / ${ROUND1_TOTAL_MAX_SCORE}`}
                      </StatusPill>
                    )}
                  </td>
                  <td className="px-4 py-4 theme-text-body">
                    {group.latestSubmittedAt ? formatDateLabel(locale, group.latestSubmittedAt) : "--"}
                  </td>
                  <td className="px-4 py-4">
                    <StatusPill tone={getStandingTone(group)}>
                      {getStandingLabel(locale, group)}
                    </StatusPill>
                  </td>
                  <td className="px-4 py-4">
                    <Link
                      href={`/admin/round-1/results/${group.team.id}`}
                      className="inline-flex items-center gap-2 rounded-full border theme-border theme-panel px-4 py-2 text-xs font-semibold theme-text-strong"
                    >
                      {locale === "en" ? "Open detail" : "Mo chi tiet"}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Surface>
    </div>
  );
}

export function AdminRound1BankDetail({ bankId }: { bankId: string }) {
  const { locale, round1TestBanks } = useSiteState();
  const bank = round1TestBanks.find((item) => item.id === bankId);

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

  const difficultyCounts = bank.questions.reduce(
    (result, question) => {
      result[question.difficulty] += 1;
      return result;
    },
    { easy: 0, medium: 0, hard: 0 },
  );
  const topicCount = new Set(bank.questions.map((question) => question.topic)).size;
  const bankExportRows = buildBankExportRows([bank]);
  const isObjectiveBank = bank.bankType === "objective";

  return (
    <div className="space-y-8">
      <Link href="/admin/round-1" className="inline-flex items-center gap-2 text-sm font-semibold theme-accent">
        <ArrowLeft className="h-4 w-4" />
        {locale === "en" ? "Back to Round 1" : "Quay lai Vong 1"}
      </Link>

      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <SectionHeading
          eyebrow={locale === "en" ? "Admin / Round 1 / Test bank" : "Admin / Vong 1 / Test bank"}
          title={pickText(locale, bank.title)}
          description={
            locale === "en"
              ? isObjectiveBank
                ? "This detail page shows the objective-bank configuration used to generate the first 36 questions of each student paper, plus a preview of the authored question set in the prototype."
                : "This detail page shows the separate essay-bank configuration used for the last 2 questions of each student paper, plus a preview of the authored prompts in the prototype."
              : isObjectiveBank
                ? "Trang này hiển thị cấu hình ngân hàng khách quan dùng để tạo 36 câu đầu của mỗi đề thi sinh viên, đồng thời preview tập câu hỏi đã được soạn trong prototype."
                : "Trang này hiển thị cấu hình ngân hàng tự luận riêng dùng cho 2 câu cuối của mỗi đề thi sinh viên, đồng thời preview các câu hỏi đã được soạn trong prototype."
          }
        />
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

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          icon={<FileQuestion className="h-5 w-5 text-cyan-300" />}
          label={locale === "en" ? "Status" : "Trang thai"}
          value={bank.status}
          note={formatDateLabel(locale, bank.publishedAt)}
        />
        <MetricCard
          icon={<ListOrdered className="h-5 w-5 text-emerald-300" />}
          label={locale === "en" ? "Question pool" : "Kho câu hỏi"}
          value={bank.questionPoolSize.toString()}
          note={locale === "en" ? "Configured master bank" : "Tổng kho được cấu hình"}
        />
        <MetricCard
          icon={<Shuffle className="h-5 w-5 text-orange-300" />}
          label={locale === "en" ? "Per attempt" : "Mỗi lượt thi"}
          value={bank.questionsPerAttempt.toString()}
          note={
            isObjectiveBank
              ? locale === "en"
                ? "Objective questions drawn per paper"
                : "Số câu khách quan rút cho mỗi đề"
              : locale === "en"
                ? "Essay prompts drawn per paper"
                : "Số câu tự luận rút cho mỗi đề"
          }
        />
        <MetricCard
          icon={<Clock3 className="h-5 w-5 text-violet-300" />}
          label={locale === "en" ? "Duration" : "Thoi gian"}
          value={`${bank.durationMinutes}m`}
          note={locale === "en" ? "Time limit" : "Gioi han thoi gian"}
        />
        <MetricCard
          icon={<Target className="h-5 w-5 text-amber-300" />}
          label={locale === "en" ? "Topics previewed" : "Số chủ đề preview"}
          value={topicCount.toString()}
          note={
            locale === "en"
              ? `${bank.questions.length} seeded sample questions`
              : `${bank.questions.length} câu preview đã seed`
          }
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Surface className="px-6 py-6 md:px-8 md:py-8">
          <p className="theme-heading text-2xl font-semibold theme-text-strong">
            {locale === "en" ? "Delivery logic" : "Logic phát đề"}
          </p>
          <p className="mt-3 text-sm leading-7 theme-text-muted">
            {locale === "en"
              ? isObjectiveBank
                ? "The live Round 1 paper is created from the master objective pool, not only from the preview list below. The prototype preview helps admin and moderator accounts inspect topic coverage, difficulty balance, and wording quality."
                : "The live Round 1 paper takes its last 2 questions from this separate essay pool, not only from the preview list below. The prototype preview helps admin and moderator accounts inspect prompt quality and rubric clarity."
              : isObjectiveBank
                ? "Đề thi Vòng 1 thực tế được tạo từ kho khách quan gốc, không chỉ từ danh sách preview bên dưới. Phần preview trong prototype giúp admin và moderator kiểm tra độ phủ chủ đề, cân bằng độ khó và chất lượng diễn đạt."
                : "Đề thi Vòng 1 thực tế lấy 2 câu cuối từ kho tự luận riêng này, không chỉ từ danh sách preview bên dưới. Phần preview trong prototype giúp admin và moderator kiểm tra chất lượng prompt và độ rõ của rubric."}
          </p>
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <div className="rounded-[1.5rem] border theme-border theme-panel-subtle px-4 py-4">
              <p className="text-xs uppercase tracking-[0.22em] theme-text-soft">
                {locale === "en" ? "Questions draw" : "Lấy câu hỏi"}
              </p>
              <p className="mt-2 text-sm font-semibold theme-text-strong">
                {isObjectiveBank
                  ? locale === "en"
                    ? `${ROUND1_TOPIC_COUNT} topics × ${ROUND1_OBJECTIVE_QUESTIONS_PER_TOPIC} objective questions`
                    : `${ROUND1_TOPIC_COUNT} chủ đề × ${ROUND1_OBJECTIVE_QUESTIONS_PER_TOPIC} câu khách quan`
                  : locale === "en"
                    ? `Random ${ROUND1_ESSAY_TOTAL} / ${bank.questionPoolSize} essay prompts`
                    : `Rút ngẫu nhiên ${ROUND1_ESSAY_TOTAL} / ${bank.questionPoolSize} câu tự luận`}
              </p>
            </div>
            <div className="rounded-[1.5rem] border theme-border theme-panel-subtle px-4 py-4">
              <p className="text-xs uppercase tracking-[0.22em] theme-text-soft">
                {locale === "en" ? "Question order" : "Thứ tự câu hỏi"}
              </p>
              <p className="mt-2 text-sm font-semibold theme-text-strong">
                {isObjectiveBank
                  ? bank.shuffleQuestions
                    ? locale === "en"
                      ? "Objective section reordered per student"
                      : "Phần khách quan được đảo theo từng thí sinh"
                    : locale === "en"
                      ? "Fixed order"
                      : "Thứ tự cố định"
                  : locale === "en"
                    ? "Essay questions are appended at the end"
                    : "Các câu tự luận luôn nằm ở cuối đề"}
              </p>
            </div>
            <div className="rounded-[1.5rem] border theme-border theme-panel-subtle px-4 py-4">
              <p className="text-xs uppercase tracking-[0.22em] theme-text-soft">
                {locale === "en" ? "Option / response rule" : "Quy tắc đáp án / trả lời"}
              </p>
              <p className="mt-2 text-sm font-semibold theme-text-strong">
                {isObjectiveBank
                  ? bank.shuffleOptions
                    ? locale === "en"
                      ? "Answer options reorder per question"
                      : "Đáp án được đảo trên từng câu"
                    : locale === "en"
                      ? "Fixed option order"
                      : "Thứ tự đáp án cố định"
                  : locale === "en"
                    ? `Maximum ${bank.wordLimit ?? ROUND1_ESSAY_WORD_LIMIT} words per answer`
                    : `Tối đa ${bank.wordLimit ?? ROUND1_ESSAY_WORD_LIMIT} từ cho mỗi câu trả lời`}
              </p>
            </div>
          </div>
        </Surface>

        <Surface className="px-6 py-6">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] theme-text-soft">
            {locale === "en" ? "Question mix preview" : "Preview cơ cấu"}
          </p>
          {isObjectiveBank ? (
            <div className="mt-5 space-y-3">
              {[
                {
                  label: locale === "en" ? "Easy" : "Dễ",
                  value: difficultyCounts.easy,
                  note:
                    locale === "en"
                      ? `${ROUND1_OBJECTIVE_DIFFICULTY_MIX.easy} drawn per topic`
                      : `${ROUND1_OBJECTIVE_DIFFICULTY_MIX.easy} câu / chủ đề`,
                  tone: "default" as const,
                },
                {
                  label: locale === "en" ? "Medium" : "Trung bình",
                  value: difficultyCounts.medium,
                  note:
                    locale === "en"
                      ? `${ROUND1_OBJECTIVE_DIFFICULTY_MIX.medium} drawn per topic`
                      : `${ROUND1_OBJECTIVE_DIFFICULTY_MIX.medium} câu / chủ đề`,
                  tone: "success" as const,
                },
                {
                  label: locale === "en" ? "Hard" : "Khó",
                  value: difficultyCounts.hard,
                  note:
                    locale === "en"
                      ? `${ROUND1_OBJECTIVE_DIFFICULTY_MIX.hard} drawn per topic`
                      : `${ROUND1_OBJECTIVE_DIFFICULTY_MIX.hard} câu / chủ đề`,
                  tone: "warning" as const,
                },
              ].map((item) => (
                <div key={item.label} className="rounded-[1.4rem] border theme-border theme-panel-subtle px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm theme-text-strong">{item.label}</span>
                    <StatusPill tone={item.tone}>{item.value}</StatusPill>
                  </div>
                  <p className="mt-2 text-xs uppercase tracking-[0.18em] theme-text-soft">{item.note}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              <div className="rounded-[1.4rem] border theme-border theme-panel-subtle px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm theme-text-strong">
                    {locale === "en" ? "Essay topics previewed" : "Số chủ đề tự luận preview"}
                  </span>
                  <StatusPill>{topicCount}</StatusPill>
                </div>
              </div>
              <div className="rounded-[1.4rem] border theme-border theme-panel-subtle px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm theme-text-strong">
                    {locale === "en" ? "Essay prompts per paper" : "Số câu tự luận mỗi đề"}
                  </span>
                  <StatusPill tone="warning">{ROUND1_ESSAY_TOTAL}</StatusPill>
                </div>
              </div>
              <div className="rounded-[1.4rem] border theme-border theme-panel-subtle px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm theme-text-strong">
                    {locale === "en" ? "Word cap per answer" : "Giới hạn từ mỗi câu"}
                  </span>
                  <StatusPill tone="success">{bank.wordLimit ?? ROUND1_ESSAY_WORD_LIMIT}</StatusPill>
                </div>
              </div>
            </div>
          )}
        </Surface>
      </section>

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

        <div className="mt-8 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b theme-border bg-[var(--panel-strong)] theme-text-soft">
              <tr>
                {[
                  "#",
                  locale === "en" ? "Type" : "Loai",
                  locale === "en" ? "Topic" : "Chu de",
                  locale === "en" ? "Difficulty" : "Do kho",
                  locale === "en" ? "Question" : "Cau hoi",
                  locale === "en" ? "Answer key" : "Dap an",
                  locale === "en" ? "Edit" : "Chinh sua",
                ].map((label) => (
                  <th key={label} className="px-4 py-3 font-medium">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bank.questions.map((question, index) => (
                <tr key={question.id} className="border-b theme-border last:border-b-0">
                  <td className="px-4 py-4 theme-text-body">{index + 1}</td>
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
                    <p>{pickText(locale, question.prompt)}</p>
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
                      className="inline-flex items-center gap-2 rounded-full border theme-border theme-panel px-4 py-2 text-xs font-semibold theme-text-strong"
                    >
                      {locale === "en" ? "Open editor" : "Mo editor"}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Surface>
    </div>
  );
}

export function AdminRound1TeamResultDetail({ teamId }: { teamId: string }) {
  const { locale, round1Submissions, round1TestBanks, teams, users, updateRound1EssayScoreByAdmin } = useSiteState();
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

  if (!team || !group) {
    return (
      <NotFoundState
        title={locale === "en" ? "Team result not found." : "Khong tim thay ket qua doi."}
        description={
          locale === "en"
            ? "This team may no longer exist in the current admin dataset."
            : "Doi nay co the khong con ton tai trong bo du lieu admin hien tai."
        }
        href="/admin/round-1"
        actionLabel={locale === "en" ? "Back to Round 1" : "Quay lai Vong 1"}
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
      <Link href="/admin/round-1" className="inline-flex items-center gap-2 text-sm font-semibold theme-accent">
        <ArrowLeft className="h-4 w-4" />
        {locale === "en" ? "Back to Round 1" : "Quay lai Vong 1"}
      </Link>

      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <SectionHeading
          eyebrow={locale === "en" ? "Admin / Round 1 / Team result" : "Admin / Vong 1 / Ket qua doi"}
          title={`${group.team.name} · ${group.team.tag}`}
          description={
            locale === "en"
              ? "This page breaks Round 1 down by member so the committee can review each student's objective result, assign essay points manually, and confirm the final team average after review."
              : "Trang này tách kết quả Vòng 1 theo từng thành viên để ban tổ chức xem điểm khách quan của từng sinh viên, nhập điểm tự luận thủ công và chốt điểm trung bình đội sau khi chấm."
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
          label={locale === "en" ? "Objective average" : "Điểm trung bình khách quan"}
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
                {locale === "en" ? "Track" : "Track"}
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
                  : "Vòng 1 được làm bài theo cá nhân. Điểm phần khách quan có ngay, điểm tự luận được bổ sung sau khi chấm thủ công, và chỉ khi đó tổng điểm cuối cùng mới được xác nhận."}
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
              {group.memberRows.map((row) => (
                <tr key={row.student.id} className="border-b theme-border last:border-b-0">
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
      </Surface>
    </div>
  );
}

export function AdminRound1QuestionEditor({ bankId, questionId }: { bankId: string; questionId: string }) {
  const { hasHydrated } = useSiteState();

  if (!hasHydrated) {
    return (
      <Surface className="px-6 py-6 md:px-8 md:py-8">
        <SectionHeading
          eyebrow="Admin / Round 1 / Question"
          title="Loading question..."
          description="Waiting for the local admin dataset to hydrate before opening the question editor."
        />
      </Surface>
    );
  }

  return <AdminRound1QuestionEditorInner bankId={bankId} questionId={questionId} />;
}

function AdminRound1QuestionEditorInner({ bankId, questionId }: { bankId: string; questionId: string }) {
  const { locale, round1TestBanks, updateRound1QuestionByAdmin } = useSiteState();
  const bank = round1TestBanks.find((item) => item.id === bankId);
  const sourceQuestion = bank?.questions.find((item) => item.id === questionId);
  const questionIndex = bank?.questions.findIndex((item) => item.id === questionId) ?? -1;
  const [draft, setDraft] = useState<Round1Question | null>(() =>
    sourceQuestion ? cloneRound1Question(sourceQuestion) : null,
  );

  const isDirty = useMemo(() => {
    if (!sourceQuestion || !draft) {
      return false;
    }

    return JSON.stringify(sourceQuestion) !== JSON.stringify(draft);
  }, [draft, sourceQuestion]);

  if (!bank || !sourceQuestion || !draft) {
    return (
      <NotFoundState
        title={locale === "en" ? "Round 1 question not found." : "Khong tim thay cau hoi Vong 1."}
        description={
          locale === "en"
            ? "This question may not exist in the current bank dataset."
            : "Cau hoi nay co the khong ton tai trong du lieu bank hien tai."
        }
        href={bank ? `/admin/round-1/banks/${bank.id}` : "/admin/round-1"}
        actionLabel={locale === "en" ? "Back to test bank" : "Quay lai test bank"}
      />
    );
  }

  const saveDraft = () => {
    updateRound1QuestionByAdmin(bank.id, sourceQuestion.id, draft);
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
          eyebrow={locale === "en" ? "Admin / Round 1 / Edit question" : "Admin / Vong 1 / Sua cau hoi"}
          title={
            locale === "en"
              ? `Question ${questionIndex + 1} editor`
              : `Editor cau hoi ${questionIndex + 1}`
          }
          description={
            locale === "en"
              ? "Update the bilingual prompt, topic, difficulty, question type, and response structure for this question inside the selected test bank."
              : "Cap nhat prompt song ngu, chu de, do kho, loai cau hoi va cau truc tra loi cho cau hoi nay trong test bank da chon."
          }
        />
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setDraft(cloneRound1Question(sourceQuestion))}
            className="rounded-full border theme-border theme-panel px-5 py-3 text-sm font-semibold theme-text-strong"
          >
            {locale === "en" ? "Reset draft" : "Dat lai ban nhap"}
          </button>
          <button
            type="button"
            disabled={!isDirty}
            onClick={saveDraft}
            className="theme-button-primary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {locale === "en" ? "Save question" : "Luu cau hoi"}
          </button>
        </div>
      </div>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
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
            <LocalizedFieldEditor
              label={locale === "en" ? "Question prompt" : "Prompt cau hoi"}
              rows={5}
              value={draft.prompt}
              onChange={(language, value) =>
                setDraft((current) =>
                  current
                    ? { ...current, prompt: { ...current.prompt, [language]: value } }
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
                          <LocalizedFieldEditor
                            label={locale === "en" ? `Option ${option.label} text` : `Noi dung ${option.label}`}
                            rows={3}
                            value={option.text}
                            onChange={(language, value) =>
                              setDraft((current) =>
                                current
                                  ? {
                                      ...current,
                                      options: (current.options ?? []).map((item) =>
                                        item.id === option.id
                                          ? { ...item, text: { ...item.text, [language]: value } }
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
                          <LocalizedFieldEditor
                            label={locale === "en" ? `Prompt ${item.label}` : `Noi dung ${item.label}`}
                            rows={3}
                            value={item.prompt}
                            onChange={(language, value) =>
                              setDraft((current) =>
                                current
                                  ? {
                                      ...current,
                                      pairingItems: (current.pairingItems ?? []).map((pairingItem) =>
                                        pairingItem.id === item.id
                                          ? {
                                              ...pairingItem,
                                              prompt: { ...pairingItem.prompt, [language]: value },
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
              <LocalizedFieldEditor
                label={locale === "en" ? "Essay placeholder" : "Placeholder bai viet"}
                rows={3}
                value={draft.placeholder ?? createLocalizedEmpty()}
                onChange={(language, value) =>
                  setDraft((current) =>
                    current
                      ? {
                          ...current,
                          placeholder: {
                            ...(current.placeholder ?? createLocalizedEmpty()),
                            [language]: value,
                          },
                        }
                      : current,
                  )
                }
              />
              <LocalizedFieldEditor
                label={locale === "en" ? "Rubric note" : "Ghi chu rubric"}
                rows={4}
                value={draft.rubricNote ?? createLocalizedEmpty()}
                onChange={(language, value) =>
                  setDraft((current) =>
                    current
                      ? {
                          ...current,
                          rubricNote: {
                            ...(current.rubricNote ?? createLocalizedEmpty()),
                            [language]: value,
                          },
                        }
                      : current,
                  )
                }
              />
            </div>
          )}
        </Surface>

        <div className="space-y-6">
          <Surface className="px-6 py-6">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] theme-text-soft">
              {locale === "en" ? "Question context" : "Thong tin cau hoi"}
            </p>
            <div className="mt-5 space-y-4">
              <div className="rounded-[1.4rem] border theme-border theme-panel-subtle px-4 py-4">
                <p className="text-sm theme-text-muted">{locale === "en" ? "Bank" : "Test bank"}</p>
                <p className="mt-2 text-lg font-semibold theme-text-strong">
                  {pickText(locale, bank.title)}
                </p>
              </div>
              <div className="rounded-[1.4rem] border theme-border theme-panel-subtle px-4 py-4">
                <p className="text-sm theme-text-muted">{locale === "en" ? "Question id" : "Ma cau hoi"}</p>
                <p className="mt-2 text-sm font-semibold theme-text-strong">{sourceQuestion.id}</p>
              </div>
              <div className="rounded-[1.4rem] border theme-border theme-panel-subtle px-4 py-4">
                <p className="text-sm theme-text-muted">{locale === "en" ? "Question type" : "Loai cau hoi"}</p>
                <p className="mt-2 text-lg font-semibold theme-text-strong">
                  {pickRound1TypeLabel(locale, draft.type)}
                </p>
              </div>
            </div>
          </Surface>

          <Surface className="px-6 py-6">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] theme-text-soft">
              {locale === "en" ? "Live preview" : "Preview"}
            </p>
            <p className="mt-5 text-lg font-semibold leading-8 theme-text-strong">
              {pickText(locale, draft.prompt)}
            </p>
            <div className="mt-3">
              <StatusPill>{pickRound1TypeLabel(locale, draft.type)}</StatusPill>
            </div>
            {draft.type !== "essay" && draft.options?.length ? (
              <div className="mt-5 space-y-3">
                {draft.options.map((option) => (
                  <div key={option.id} className="rounded-[1.4rem] border theme-border theme-panel-subtle px-4 py-4">
                    <div className="flex items-start gap-3">
                      <div className="theme-panel-strong flex h-8 w-8 shrink-0 items-center justify-center rounded-full border theme-border text-sm font-semibold theme-text-strong">
                        {option.label}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm leading-6 theme-text-body">
                          {pickText(locale, option.text)}
                        </p>
                        {draft.correctOptionIds?.includes(option.id) ? (
                          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">
                            {locale === "en" ? "Correct answer" : "Dap an dung"}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
            {draft.type === "pairing" && draft.pairingItems?.length ? (
              <div className="mt-5 space-y-3">
                {draft.pairingItems.map((item) => {
                  const matchedOption = draft.options?.find((option) => option.id === item.correctOptionId);

                  return (
                    <div key={item.id} className="rounded-[1.4rem] border theme-border theme-panel-subtle px-4 py-4">
                      <p className="text-sm font-semibold theme-text-strong">
                        {`${item.label}. ${pickText(locale, item.prompt)}`}
                      </p>
                      <p className="mt-2 text-sm theme-text-muted">
                        {locale === "en" ? "Correct match" : "Cap dung"}: {matchedOption ? `${matchedOption.label}. ${pickText(locale, matchedOption.text)}` : "--"}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : null}
            {draft.type === "essay" ? (
              <div className="mt-5 space-y-3">
                <div className="rounded-[1.4rem] border theme-border theme-panel-subtle px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.18em] theme-text-soft">
                    {locale === "en" ? "Placeholder" : "Placeholder"}
                  </p>
                  <p className="mt-2 text-sm leading-6 theme-text-body">
                    {pickText(locale, draft.placeholder ?? createLocalizedEmpty())}
                  </p>
                </div>
                <div className="rounded-[1.4rem] border theme-border theme-panel-subtle px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.18em] theme-text-soft">
                    {locale === "en" ? "Rubric note" : "Rubric"}
                  </p>
                  <p className="mt-2 text-sm leading-6 theme-text-body">
                    {pickText(locale, draft.rubricNote ?? createLocalizedEmpty())}
                  </p>
                </div>
              </div>
            ) : null}
            <button
              type="button"
              onClick={saveDraft}
              className="theme-button-primary mt-6 inline-flex w-full items-center justify-center gap-2 rounded-[1.4rem] px-5 py-3.5 text-sm font-semibold"
            >
              <Save className="h-4 w-4" />
              {locale === "en" ? "Save question" : "Luu cau hoi"}
            </button>
          </Surface>
        </div>
      </section>
    </div>
  );
}
