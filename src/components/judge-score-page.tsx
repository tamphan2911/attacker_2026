"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  FileText,
  NotebookPen,
  Save,
  Scale,
  UserRound,
} from "lucide-react";

import { useSiteState } from "@/components/providers/site-state-provider";
import { Surface, StatusPill } from "@/components/site-ui";
import { estimateEssayAiLikelihood } from "@/lib/essay-ai-guard";
import { pickRound1QuestionText } from "@/lib/round1";
import { formatDateLabel } from "@/lib/site";
import type { JudgeRound1Detail, JudgeTeamSubmissionDetail, Locale } from "@/types/site";

function formatBytes(bytes?: number) {
  if (!bytes) {
    return "";
  }

  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${Math.ceil(bytes / 1024)} KB`;
}

function formatScoreNumber(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function pickLocalizedText(value: { en: string; vi: string }, locale: Locale) {
  return value[locale]?.trim() || value.en.trim() || value.vi.trim();
}

function EssayAiEstimatePanel({
  answerText,
  locale,
}: {
  answerText: string;
  locale: Locale;
}) {
  const estimate = estimateEssayAiLikelihood(answerText, locale);
  const hasSignal = estimate.score > 0 || estimate.reasons.length > 0;

  return (
    <div
      className={`mt-4 rounded-[1.35rem] border px-4 py-4 ${
        estimate.shouldWarn
          ? "border-amber-400/35 bg-amber-400/10"
          : "theme-border theme-panel-subtle"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] theme-text-soft">
            {locale === "en" ? "AI-like content estimate" : "Ước tính nội dung giống AI"}
          </p>
          <p className="mt-2 text-sm leading-6 theme-text-muted">
            {hasSignal
              ? locale === "en"
                ? "This is a heuristic signal for judge review, not an automatic decision."
                : "Đây là tín hiệu tham khảo cho giám khảo, không phải kết luận tự động."
              : locale === "en"
                ? "No strong AI-like writing signal was detected."
                : "Chưa phát hiện tín hiệu rõ ràng về cách viết giống AI."}
          </p>
        </div>
        <StatusPill tone={estimate.shouldWarn ? "warning" : "info"}>{`${estimate.score}%`}</StatusPill>
      </div>
      {estimate.reasons.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {estimate.reasons.map((reason) => (
            <span
              key={reason}
              className="inline-flex rounded-full border theme-border bg-white/60 px-3 py-1 text-xs font-medium theme-text-soft dark:bg-white/[0.04]"
            >
              {reason}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ReviewPanel({
  locale,
  maxScore,
  score,
  note,
  scoredAt,
  onScoreChange,
  onNoteChange,
  onSubmit,
  isSaving,
  message,
  title,
  description,
  scoreStep = "0.5",
}: {
  locale: Locale;
  maxScore: number;
  score: string;
  note: string;
  scoredAt?: string;
  onScoreChange: (value: string) => void;
  onNoteChange: (value: string) => void;
  onSubmit: () => Promise<void>;
  isSaving: boolean;
  message: string;
  title: string;
  description: string;
  scoreStep?: string;
}) {
  return (
    <Surface className="xl:sticky xl:top-24 px-5 py-5 md:px-6 md:py-6">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] theme-eyebrow">
        {locale === "en" ? "Judge scoring" : "Phiếu chấm"}
      </p>
      <h2 className="mt-3 text-2xl font-semibold theme-text-strong">{title}</h2>
      <p className="mt-3 text-sm leading-7 theme-text-muted">{description}</p>

      <div className="mt-5 space-y-4">
        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.22em] theme-text-soft">
            {locale === "en" ? `Score (0-${maxScore})` : `Điểm (0-${maxScore})`}
          </span>
          <input
            type="number"
            min={0}
            max={maxScore}
            step={scoreStep}
            value={score}
            onChange={(event) => onScoreChange(event.target.value)}
            className="theme-placeholder h-12 w-full rounded-2xl border theme-border theme-panel px-4 text-sm theme-text-strong outline-none"
          />
        </label>

        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.22em] theme-text-soft">
            {locale === "en" ? "Judge note" : "Ghi chú chấm"}
          </span>
          <textarea
            rows={6}
            value={note}
            onChange={(event) => onNoteChange(event.target.value)}
            className="theme-placeholder w-full rounded-2xl border theme-border theme-panel px-4 py-3 text-sm leading-7 theme-text-strong outline-none"
          />
        </label>

        {scoredAt ? (
          <div className="rounded-[1.4rem] border theme-border theme-panel-subtle px-4 py-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              <div>
                <p className="text-sm font-semibold theme-text-strong">
                  {locale === "en" ? "Saved review" : "Bản chấm đã lưu"}
                </p>
                <p className="mt-1 text-xs theme-text-soft">{formatDateLabel(locale, scoredAt)}</p>
              </div>
            </div>
          </div>
        ) : null}

        {message ? (
          <div className="rounded-[1.4rem] border theme-border theme-panel-subtle px-4 py-4">
            <p className="text-sm theme-text-soft">{message}</p>
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => void onSubmit()}
          disabled={isSaving}
          className="theme-button-primary inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold disabled:opacity-60"
        >
          <Save className="h-4 w-4" />
          {isSaving
            ? locale === "en"
              ? "Saving..."
              : "Đang lưu..."
            : locale === "en"
              ? "Save judge score"
              : "Lưu điểm chấm"}
        </button>
      </div>
    </Surface>
  );
}

export function JudgeRound1ScorePage({
  detail,
}: {
  detail: JudgeRound1Detail;
}) {
  const { locale } = useSiteState();
  const router = useRouter();
  const [questionScores, setQuestionScores] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      detail.essays.map((essay) => [
        essay.questionId,
        essay.score == null ? "" : String(essay.score),
      ]),
    ),
  );
  const [note, setNote] = useState(detail.review.note);
  const [scoredAt, setScoredAt] = useState(detail.review.scoredAt);
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const totalEssayScore = useMemo(
    () =>
      detail.essays.reduce((total, essay) => {
        const value = Number(questionScores[essay.questionId]);
        return total + (Number.isFinite(value) ? value : 0);
      }, 0),
    [detail.essays, questionScores],
  );

  const handleSubmit = async () => {
    const parsedQuestionScores: Record<string, number> = {};
    for (const essay of detail.essays) {
      const parsedScore = Number(questionScores[essay.questionId]);
      if (!Number.isFinite(parsedScore) || !Number.isInteger(parsedScore) || parsedScore < 0 || parsedScore > 14) {
        setMessage(
          locale === "en"
            ? "Each essay question score must be a whole number from 0 to 14."
            : "Mỗi câu tự luận cần có điểm nguyên từ 0 đến 14.",
        );
        return;
      }

      parsedQuestionScores[essay.questionId] = parsedScore;
    }

    setIsSaving(true);
    setMessage("");

    const response = await fetch(`/api/judge-dashboard/round-1/${detail.submissionId}/review`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "same-origin",
      body: JSON.stringify({
        questionScores: parsedQuestionScores,
        note,
      }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      setMessage(payload?.error || (locale === "en" ? "Could not save the judge score." : "Không thể lưu điểm chấm."));
      setIsSaving(false);
      return;
    }

    const now = new Date().toISOString();
    setScoredAt(now);
    setIsSaving(false);
    router.push(`/judge-dashboard?scored=${encodeURIComponent(detail.submissionId)}`);
  };

  return (
    <div className="space-y-8">
      <Surface className="px-6 py-6 md:px-8 md:py-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] theme-eyebrow">
              {locale === "en" ? "Judge dashboard / Round 1" : "Bảng chấm / Vòng 1"}
            </p>
            <h1 className="mt-3 text-3xl font-semibold theme-text-strong md:text-[2.6rem]">
              {detail.participantName}
            </h1>
            <p className="mt-3 text-sm leading-7 theme-text-muted">
              {locale === "en"
                ? "Review the essay answers below, then save your score and note on the right."
                : "Xem các câu trả lời tự luận bên dưới, sau đó lưu điểm và ghi chú chấm ở cột bên phải."}
            </p>
          </div>
          <Link
            href="/judge-dashboard"
            className="theme-button-secondary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
          >
            <ArrowLeft className="h-4 w-4" />
            {locale === "en" ? "Back to dashboard" : "Quay lại bảng chấm"}
          </Link>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <StatusPill tone="info">{detail.teamName}</StatusPill>
          <StatusPill>{detail.teamTag}</StatusPill>
          <StatusPill>{formatDateLabel(locale, detail.submittedAt)}</StatusPill>
          <StatusPill>
            {locale === "en"
              ? `Objective ${detail.objectiveScore}`
              : `Trắc nghiệm ${detail.objectiveScore}`}
          </StatusPill>
          <StatusPill>
            {`${detail.durationMinutes} ${locale === "en" ? "minutes" : "phút"}`}
          </StatusPill>
          <StatusPill>{detail.participantUniversity}</StatusPill>
        </div>
      </Surface>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <Surface className="px-6 py-6 md:px-8 md:py-8">
            <div className="flex items-center gap-3">
              <NotebookPen className="h-5 w-5 text-sky-500" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] theme-eyebrow">
                  {locale === "en" ? "Essay responses" : "Bài làm tự luận"}
                </p>
                <h2 className="mt-2 text-2xl font-semibold theme-text-strong">
                  {locale === "en" ? "Full essay answers" : "Toàn bộ câu trả lời tự luận"}
                </h2>
              </div>
            </div>

            <div className="mt-6 space-y-5">
              {detail.essays.length ? (
                detail.essays.map((essay) => (
                  <div key={essay.questionId} className="rounded-[1.8rem] border theme-border theme-panel px-5 py-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusPill tone="info">
                        {locale === "en" ? `Essay ${essay.order}` : `Tự luận ${essay.order}`}
                      </StatusPill>
                      <StatusPill>{`${essay.wordCount} ${locale === "en" ? "words" : "từ"}`}</StatusPill>
                    </div>
                    <p className="mt-4 text-lg font-semibold leading-8 theme-text-strong">{pickRound1QuestionText(essay.prompt)}</p>
                    {essay.rubricNote ? (
                      <div className="mt-4 rounded-[1.35rem] border theme-border theme-panel-subtle px-4 py-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] theme-text-soft">
                          {locale === "en" ? "Rubric note" : "Ghi chú rubric"}
                        </p>
                        <p className="mt-3 text-sm leading-7 theme-text-muted">{pickRound1QuestionText(essay.rubricNote)}</p>
                      </div>
                    ) : null}
                    <EssayAiEstimatePanel answerText={essay.answerText} locale={locale} />
                    <div className="mt-4 rounded-[1.5rem] border theme-border bg-white/78 px-4 py-4 dark:bg-white/[0.04]">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] theme-text-soft">
                        {locale === "en" ? "Candidate answer" : "Câu trả lời của thí sinh"}
                      </p>
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-8 theme-text-body">
                        {essay.answerText || (locale === "en" ? "No answer provided." : "Không có câu trả lời.")}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-[1.8rem] border theme-border theme-panel px-5 py-5">
                  <p className="text-sm leading-7 theme-text-muted">
                    {locale === "en"
                      ? "This submission does not have an archived essay payload yet. Newer Round 1 attempts store full essay content automatically."
                      : "Bài nộp này chưa có phần lưu trữ nội dung tự luận. Các lượt thi Vòng 1 mới sẽ tự động lưu đầy đủ phần trả lời tự luận."}
                  </p>
                </div>
              )}
            </div>
          </Surface>
        </div>

        <Surface className="xl:sticky xl:top-24 px-5 py-5 md:px-6 md:py-6">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] theme-eyebrow">
            {locale === "en" ? "Judge scoring" : "Phiếu chấm"}
          </p>
          <h2 className="mt-3 text-2xl font-semibold theme-text-strong">
            {locale === "en" ? "Round 1 essay score" : "Điểm tự luận Vòng 1"}
          </h2>
          <p className="mt-3 text-sm leading-7 theme-text-muted">
            {locale === "en"
              ? "Score each essay answer separately. The total essay score is calculated automatically."
              : "Chấm riêng từng câu tự luận. Tổng điểm tự luận được tự động cộng và không chỉnh sửa trực tiếp."}
          </p>

          <div className="mt-5 space-y-4">
            <div className="space-y-3">
              {detail.essays.map((essay) => (
                <label
                  key={essay.questionId}
                  className="flex items-center justify-between gap-3 rounded-[1.2rem] border theme-border theme-panel px-4 py-3"
                >
                  <span className="min-w-0">
                    <span className="block text-xs font-semibold uppercase tracking-[0.2em] theme-text-soft">
                      {locale === "en" ? `Essay ${essay.order}` : `Tự luận ${essay.order}`}
                    </span>
                    <span className="mt-1 block truncate text-sm font-semibold theme-text-strong">
                      {pickRound1QuestionText(essay.prompt)}
                    </span>
                    <span className="mt-1 block text-xs font-medium theme-text-soft">
                      {locale === "en" ? "Maximum 14 points" : "Tối đa 14 điểm"}
                    </span>
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={14}
                    step={1}
                    value={questionScores[essay.questionId] ?? ""}
                    onChange={(event) =>
                      setQuestionScores((current) => ({
                        ...current,
                        [essay.questionId]: event.target.value,
                      }))
                    }
                    className="theme-placeholder h-11 w-20 shrink-0 rounded-2xl border theme-border theme-panel px-3 text-center text-sm font-semibold theme-text-strong outline-none"
                  />
                </label>
              ))}
            </div>

            <div className="rounded-[1.4rem] border theme-border theme-panel-subtle px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] theme-text-soft">
                {locale === "en" ? "Auto total" : "Tổng tự động"}
              </p>
              <p className="mt-2 text-3xl font-semibold theme-text-strong">
                {`${formatScoreNumber(totalEssayScore)} / ${detail.maxScore}`}
              </p>
            </div>

            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.22em] theme-text-soft">
                {locale === "en" ? "Judge note" : "Ghi chú chấm"}
              </span>
              <textarea
                rows={5}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                className="theme-placeholder w-full rounded-2xl border theme-border theme-panel px-4 py-3 text-sm leading-7 theme-text-strong outline-none"
              />
            </label>

            {scoredAt ? (
              <div className="rounded-[1.4rem] border theme-border theme-panel-subtle px-4 py-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  <div>
                    <p className="text-sm font-semibold theme-text-strong">
                      {locale === "en" ? "Saved review" : "Bản chấm đã lưu"}
                    </p>
                    <p className="mt-1 text-xs theme-text-soft">{formatDateLabel(locale, scoredAt)}</p>
                  </div>
                </div>
              </div>
            ) : null}

            {message ? (
              <div className="rounded-[1.4rem] border theme-border theme-panel-subtle px-4 py-4">
                <p className="text-sm theme-text-soft">{message}</p>
              </div>
            ) : null}

            <button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={isSaving}
              className="theme-button-primary inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {isSaving
                ? locale === "en"
                  ? "Saving..."
                  : "Đang lưu..."
                : locale === "en"
                  ? "Save judge score"
                  : "Lưu điểm chấm"}
            </button>
          </div>
        </Surface>
      </div>
    </div>
  );
}

export function JudgeTeamSubmissionScorePage({
  detail,
}: {
  detail: JudgeTeamSubmissionDetail;
}) {
  const { locale } = useSiteState();
  const router = useRouter();
  const isRound2 = detail.round === "round-2";
  const [score, setScore] = useState(detail.review.score == null ? "" : String(detail.review.score));
  const [rubricScores, setRubricScores] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      (detail.rubric ?? []).map((criterion) => [
        criterion.id,
        detail.review.rubricScores?.[criterion.id] == null
          ? ""
          : String(detail.review.rubricScores[criterion.id]),
      ]),
    ),
  );
  const [note, setNote] = useState(detail.review.note);
  const [scoredAt, setScoredAt] = useState(detail.review.scoredAt);
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const rubricTotal = useMemo(
    () =>
      (detail.rubric ?? []).reduce((total, criterion) => {
        const value = Number(rubricScores[criterion.id]);
        return total + (Number.isFinite(value) ? value : 0);
      }, 0),
    [detail.rubric, rubricScores],
  );

  const handleSubmit = async () => {
    let requestBody: { score?: number; rubricScores?: Record<string, number>; note: string };

    if (isRound2) {
      const parsedRubricScores: Record<string, number> = {};
      for (const criterion of detail.rubric ?? []) {
        const parsedScore = Number(rubricScores[criterion.id]);
        if (!Number.isFinite(parsedScore) || parsedScore < 0 || parsedScore > criterion.maxScore) {
          setMessage(
            locale === "en"
              ? "Each rubric score must stay within its criterion maximum."
              : "Điểm từng tiêu chí phải nằm trong mức tối đa của tiêu chí đó.",
          );
          return;
        }

        parsedRubricScores[criterion.id] = parsedScore;
      }

      requestBody = {
        rubricScores: parsedRubricScores,
        note,
      };
    } else {
      const parsedScore = Number(score);
      if (!Number.isFinite(parsedScore)) {
        setMessage(locale === "en" ? "Please enter a valid score." : "Hãy nhập một mức điểm hợp lệ.");
        return;
      }

      requestBody = {
        score: parsedScore,
        note,
      };
    }

    setIsSaving(true);
    setMessage("");

    const response = await fetch(`/api/judge-dashboard/submissions/${detail.submissionId}/review`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "same-origin",
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      setMessage(payload?.error || (locale === "en" ? "Could not save the judge score." : "Không thể lưu điểm chấm."));
      setIsSaving(false);
      return;
    }

    const now = new Date().toISOString();
    setScoredAt(now);
    setIsSaving(false);
    router.push(`/judge-dashboard?scored=${encodeURIComponent(detail.submissionId)}`);
  };

  return (
    <div className="space-y-8">
      <Surface className="px-6 py-6 md:px-8 md:py-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] theme-eyebrow">
              {detail.round === "round-2"
                ? locale === "en"
                  ? "Judge dashboard / Round 2"
                  : "Bảng chấm / Vòng 2"
                : locale === "en"
                  ? "Judge dashboard / Final round"
                  : "Bảng chấm / Chung kết"}
            </p>
            <h1 className="mt-3 text-3xl font-semibold theme-text-strong md:text-[2.6rem]">
              {detail.teamName}
            </h1>
            <p className="mt-3 text-sm leading-7 theme-text-muted">
              {locale === "en"
                ? "Download the team file, review the summary, then save your score and judge note."
                : "Tải tệp bài nộp của đội, xem phần tóm tắt, sau đó lưu điểm và ghi chú chấm."}
            </p>
          </div>
          <Link
            href="/judge-dashboard"
            className="theme-button-secondary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
          >
            <ArrowLeft className="h-4 w-4" />
            {locale === "en" ? "Back to dashboard" : "Quay lại bảng chấm"}
          </Link>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <StatusPill tone={detail.round === "round-2" ? "success" : "warning"}>
            {detail.round === "round-2"
              ? locale === "en"
                ? "Round 2"
                : "Vòng 2"
              : locale === "en"
                ? "Final round"
                : "Chung kết"}
          </StatusPill>
          <StatusPill>{detail.teamTag}</StatusPill>
          <StatusPill>{formatDateLabel(locale, detail.submittedAt)}</StatusPill>
        </div>
      </Surface>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <Surface className="px-6 py-6 md:px-8 md:py-8">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-[1.5rem] border theme-border theme-panel px-4 py-4">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-sky-500" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] theme-text-soft">
                      {locale === "en" ? "Report title" : "Tên bài nộp"}
                    </p>
                    <p className="mt-2 text-sm font-semibold theme-text-strong">{detail.title}</p>
                  </div>
                </div>
              </div>
              <div className="rounded-[1.5rem] border theme-border theme-panel px-4 py-4">
                <div className="flex items-center gap-3">
                  <UserRound className="h-5 w-5 text-emerald-500" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] theme-text-soft">
                      {locale === "en" ? "Submitted by" : "Người nộp"}
                    </p>
                    <p className="mt-2 text-sm font-semibold theme-text-strong">{detail.submittedByName}</p>
                  </div>
                </div>
              </div>
              <div className="rounded-[1.5rem] border theme-border theme-panel px-4 py-4">
                <div className="flex items-center gap-3">
                  <Scale className="h-5 w-5 text-amber-500" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] theme-text-soft">
                      {locale === "en" ? "Version / file" : "Phiên bản / tệp"}
                    </p>
                    <p className="mt-2 text-sm font-semibold theme-text-strong">
                      {`${detail.version} · ${formatBytes(detail.resourceSizeBytes) || detail.resourceLabel}`}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Surface>

          <Surface className="px-6 py-6 md:px-8 md:py-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] theme-eyebrow">
                  {locale === "en" ? "Submission summary" : "Tóm tắt bài nộp"}
                </p>
                <h2 className="mt-2 text-2xl font-semibold theme-text-strong">{detail.title}</h2>
                <p className="mt-4 text-sm leading-8 theme-text-muted">{detail.summary}</p>
              </div>
              {detail.resourceUrl ? (
                <a
                  href={detail.resourceUrl}
                  className="theme-button-primary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
                >
                  <Download className="h-4 w-4" />
                  {locale === "en" ? "Download latest report" : "Tải báo cáo mới nhất"}
                </a>
              ) : null}
            </div>

            <div className="mt-6 rounded-[1.5rem] border theme-border theme-panel-subtle px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] theme-text-soft">
                {locale === "en" ? "Submission file" : "Tệp bài nộp"}
              </p>
              <p className="mt-3 text-sm font-semibold theme-text-strong">{detail.resourceLabel}</p>
              <p className="mt-2 text-sm theme-text-soft">
                {locale === "en"
                  ? `Submitted ${formatDateLabel(locale, detail.submittedAt)}`
                  : `Nộp ngày ${formatDateLabel(locale, detail.submittedAt)}`}
              </p>
            </div>
          </Surface>
        </div>

        {isRound2 ? (
          <Surface className="xl:sticky xl:top-24 px-5 py-5 md:px-6 md:py-6">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] theme-eyebrow">
              {locale === "en" ? "Round 2 rubric" : "Rubric Vòng 2"}
            </p>
            <h2 className="mt-3 text-2xl font-semibold theme-text-strong">
              {locale === "en" ? "Report score" : "Điểm báo cáo"}
            </h2>
            <p className="mt-3 text-sm leading-7 theme-text-muted">
              {locale === "en"
                ? "Score each criterion. The total is calculated automatically and cannot be edited directly."
                : "Chấm từng tiêu chí. Tổng điểm được tự động cộng và không chỉnh sửa trực tiếp."}
            </p>

            <div className="mt-5 overflow-hidden rounded-[1.4rem] border theme-border">
              <div className="grid grid-cols-[minmax(0,1fr)_88px] border-b theme-border theme-panel-subtle px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] theme-text-soft">
                <span>{locale === "en" ? "Criterion" : "Tiêu chí"}</span>
                <span className="text-right">{locale === "en" ? "Score" : "Điểm"}</span>
              </div>
              {(detail.rubric ?? []).map((criterion) => (
                <label
                  key={criterion.id}
                  className="grid grid-cols-[minmax(0,1fr)_88px] gap-3 border-b theme-border px-4 py-3 last:border-b-0"
                >
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold theme-text-strong">
                      {pickLocalizedText(criterion.label, locale)}
                    </span>
                    <span className="mt-1 block text-xs leading-5 theme-text-soft">
                      {pickLocalizedText(criterion.description, locale)}
                    </span>
                  </span>
                  <span className="flex items-center justify-end gap-2">
                    <input
                      type="number"
                      min={0}
                      max={criterion.maxScore}
                      step={0.5}
                      value={rubricScores[criterion.id] ?? ""}
                      onChange={(event) =>
                        setRubricScores((current) => ({
                          ...current,
                          [criterion.id]: event.target.value,
                        }))
                      }
                      className="theme-placeholder h-10 w-16 rounded-2xl border theme-border theme-panel px-2 text-center text-sm font-semibold theme-text-strong outline-none"
                    />
                  </span>
                </label>
              ))}
            </div>

            <div className="mt-4 rounded-[1.4rem] border theme-border theme-panel-subtle px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] theme-text-soft">
                {locale === "en" ? "Auto total" : "Tổng tự động"}
              </p>
              <p className="mt-2 text-3xl font-semibold theme-text-strong">
                {`${formatScoreNumber(rubricTotal)} / ${detail.maxScore}`}
              </p>
            </div>

            <label className="mt-4 block space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.22em] theme-text-soft">
                {locale === "en" ? "Judge note" : "Ghi chú chấm"}
              </span>
              <textarea
                rows={5}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                className="theme-placeholder w-full rounded-2xl border theme-border theme-panel px-4 py-3 text-sm leading-7 theme-text-strong outline-none"
              />
            </label>

            {scoredAt ? (
              <div className="mt-4 rounded-[1.4rem] border theme-border theme-panel-subtle px-4 py-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  <div>
                    <p className="text-sm font-semibold theme-text-strong">
                      {locale === "en" ? "Saved review" : "Bản chấm đã lưu"}
                    </p>
                    <p className="mt-1 text-xs theme-text-soft">{formatDateLabel(locale, scoredAt)}</p>
                  </div>
                </div>
              </div>
            ) : null}

            {message ? (
              <div className="mt-4 rounded-[1.4rem] border theme-border theme-panel-subtle px-4 py-4">
                <p className="text-sm theme-text-soft">{message}</p>
              </div>
            ) : null}

            <button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={isSaving}
              className="theme-button-primary mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {isSaving
                ? locale === "en"
                  ? "Saving..."
                  : "Đang lưu..."
                : locale === "en"
                  ? "Save rubric score"
                  : "Lưu điểm rubric"}
            </button>
          </Surface>
        ) : (
          <ReviewPanel
            locale={locale}
            maxScore={detail.maxScore}
            score={score}
            note={note}
            scoredAt={scoredAt}
            onScoreChange={setScore}
            onNoteChange={setNote}
            onSubmit={handleSubmit}
            isSaving={isSaving}
            message={message}
            title={locale === "en" ? "Judge submission score" : "Điểm chấm bài nộp"}
            description={
              locale === "en"
                ? "Use this side panel to save your independent round score and your own judge note."
                : "Dùng bảng bên này để lưu điểm vòng của bạn và ghi chú chấm riêng của chính bạn."
            }
          />
        )}
      </div>
    </div>
  );
}
