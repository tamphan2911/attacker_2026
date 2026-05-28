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
  TriangleAlert,
  UserRound,
} from "lucide-react";

import { useSiteState } from "@/components/providers/site-state-provider";
import { Surface, StatusPill } from "@/components/site-ui";
import { estimateEssayAiLikelihood } from "@/lib/essay-ai-guard";
import { ROUND1_ESSAY_POINT_VALUE, pickRound1QuestionText } from "@/lib/round1";
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

  const handleQuestionScoreChange = (questionId: string, value: string) => {
    if (value === "") {
      setQuestionScores((current) => ({
        ...current,
        [questionId]: "",
      }));
      return;
    }

    const parsedValue = Number(value);
    if (!Number.isFinite(parsedValue)) {
      return;
    }

    const boundedScore = Math.max(0, Math.min(ROUND1_ESSAY_POINT_VALUE, Math.trunc(parsedValue)));
    setQuestionScores((current) => ({
      ...current,
      [questionId]: String(boundedScore),
    }));
  };

  const handleSubmit = async () => {
    const parsedQuestionScores: Record<string, number> = {};
    for (const essay of detail.essays) {
      const parsedScore = Number(questionScores[essay.questionId]);
      if (!Number.isFinite(parsedScore) || !Number.isInteger(parsedScore) || parsedScore < 0 || parsedScore > ROUND1_ESSAY_POINT_VALUE) {
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
                    max={ROUND1_ESSAY_POINT_VALUE}
                    step={1}
                    value={questionScores[essay.questionId] ?? ""}
                    onChange={(event) => handleQuestionScoreChange(essay.questionId, event.target.value)}
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
  const [messageTone, setMessageTone] = useState<"warning" | "error">("warning");
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
        const rawScore = rubricScores[criterion.id]?.trim() ?? "";
        const parsedScore = Number(rawScore);
        const criterionLabel = pickLocalizedText(criterion.label, locale);

        if (!rawScore) {
          setMessageTone("warning");
          setMessage(
            locale === "en"
              ? `${criterionLabel} score is required. Enter a number from 0 to ${criterion.maxScore}.`
              : `Tiêu chí ${criterionLabel} chưa có điểm. Hãy nhập một số từ 0 đến ${criterion.maxScore}.`,
          );
          return;
        }

        if (!Number.isFinite(parsedScore)) {
          setMessageTone("warning");
          setMessage(
            locale === "en"
              ? `${criterionLabel} score must be a number from 0 to ${criterion.maxScore}. Current value: "${rawScore}".`
              : `Điểm tiêu chí ${criterionLabel} phải là một số từ 0 đến ${criterion.maxScore}. Giá trị hiện tại: "${rawScore}".`,
          );
          return;
        }

        if (parsedScore < 0 || parsedScore > criterion.maxScore) {
          setMessageTone("warning");
          setMessage(
            locale === "en"
              ? `${criterionLabel} score is ${formatScoreNumber(parsedScore)}, but the allowed range is 0 to ${criterion.maxScore}.`
              : `Điểm tiêu chí ${criterionLabel} đang là ${formatScoreNumber(parsedScore)}, nhưng khoảng hợp lệ là 0 đến ${criterion.maxScore}.`,
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
        setMessageTone("warning");
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
      setMessageTone("warning");
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

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <Surface className="px-6 py-6 md:px-8 md:py-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] theme-eyebrow">
                {locale === "en" ? "Submission summary" : "Tóm tắt bài nộp"}
              </p>
              <h2 className="mt-2 text-2xl font-semibold theme-text-strong">{detail.title}</h2>
              <p className="mt-4 text-sm leading-7 theme-text-muted">{detail.summary}</p>
            </div>
          </Surface>

          {isRound2 ? (
            <Surface className="px-4 py-4 md:px-5 md:py-5">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] theme-text-soft">
                {locale === "en" ? "Round 2 rubric table" : "Bảng rubric Vòng 2"}
              </p>
              <div className="mt-3 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                  <h2 className="text-2xl font-semibold theme-text-strong">
                    {locale === "en" ? "Report scoring" : "Chấm điểm báo cáo"}
                  </h2>
                  <p className="mt-2 max-w-3xl text-sm leading-7 theme-text-muted">
                    {locale === "en"
                      ? "Use the guide bands from the official Round 2 rubric. Each score must stay within the maximum for its own criterion."
                      : "Dùng các mức hướng dẫn từ rubric chính thức Vòng 2. Điểm từng tiêu chí phải nằm trong mức tối đa riêng của tiêu chí đó."}
                  </p>
                </div>
                <div className="rounded-[1.2rem] border theme-border theme-panel-subtle px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] theme-text-soft">
                    {locale === "en" ? "Auto total" : "Tổng tự động"}
                  </p>
                  <p className="mt-1 text-2xl font-semibold theme-text-strong">
                    {`${formatScoreNumber(rubricTotal)} / ${detail.maxScore}`}
                  </p>
                </div>
              </div>

              <div className="mt-5 overflow-x-auto rounded-[1.35rem] border theme-border">
                <table className="min-w-[1120px] w-full text-left text-xs">
                  <thead className="theme-panel-subtle">
                    <tr className="border-b theme-border">
                      <th className="w-[190px] px-4 py-3 font-semibold uppercase tracking-[0.16em] theme-text-soft">
                        {locale === "en" ? "Criterion" : "Tiêu chí"}
                      </th>
                      {["weak", "average", "good", "excellent"].map((level, index) => (
                        <th key={level} className="w-[190px] px-4 py-3 font-semibold uppercase tracking-[0.16em] theme-text-soft">
                          {pickLocalizedText(
                            (detail.rubric?.[0]?.levels[index]?.label ?? {
                              en: level,
                              vi: level,
                            }),
                            locale,
                          )}
                        </th>
                      ))}
                      <th className="w-[116px] px-4 py-3 text-right font-semibold uppercase tracking-[0.16em] theme-text-soft">
                        {locale === "en" ? "Score" : "Điểm"}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {(detail.rubric ?? []).map((criterion) => (
                      <tr key={criterion.id} className="border-b theme-border align-top last:border-b-0">
                        <td className="px-4 py-4">
                          <p className="font-semibold theme-text-strong">
                            {pickLocalizedText(criterion.label, locale)}
                          </p>
                          <p className="mt-2 text-[0.72rem] leading-5 theme-text-soft">
                            {pickLocalizedText(criterion.description, locale)}
                          </p>
                          <StatusPill tone="default">{`Max ${criterion.maxScore}`}</StatusPill>
                        </td>
                        {Array.from({ length: 4 }, (_, levelIndex) => {
                          const level = criterion.levels[levelIndex];

                          return (
                            <td key={`${criterion.id}-${levelIndex}`} className="px-4 py-4">
                              {level ? (
                                <>
                                  <p className="font-semibold theme-text-strong">{level.range}</p>
                                  <p className="mt-2 text-[0.72rem] leading-5 theme-text-muted">
                                    {pickLocalizedText(level.guide, locale)}
                                  </p>
                                </>
                              ) : (
                                <span className="theme-text-faint">--</span>
                              )}
                            </td>
                          );
                        })}
                        <td className="px-4 py-4 text-right">
                          <input
                            type="number"
                            min={0}
                            max={criterion.maxScore}
                            step={0.25}
                            value={rubricScores[criterion.id] ?? ""}
                            onChange={(event) =>
                              setRubricScores((current) => ({
                                ...current,
                                [criterion.id]: event.target.value,
                              }))
                            }
                            className="theme-placeholder h-10 w-20 rounded-2xl border theme-border theme-panel px-2 text-center text-sm font-semibold theme-text-strong outline-none"
                            aria-label={`${pickLocalizedText(criterion.label, locale)} score, 0 to ${criterion.maxScore}`}
                          />
                          <p className="mt-2 text-[0.68rem] font-semibold uppercase tracking-[0.16em] theme-text-soft">
                            {`0-${criterion.maxScore}`}
                          </p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Surface>
          ) : null}
        </div>

        {isRound2 ? (
          <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
            <Surface className="px-5 py-5">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] theme-eyebrow">
                {locale === "en" ? "Submission info" : "Thông tin bài nộp"}
              </p>
              <div className="mt-4 space-y-3">
                <div className="rounded-[1.25rem] border theme-border theme-panel-subtle px-4 py-3">
                  <div className="flex items-start gap-3">
                    <FileText className="mt-0.5 h-4 w-4 shrink-0 text-sky-500" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] theme-text-soft">
                        {locale === "en" ? "Report title" : "Tên bài nộp"}
                      </p>
                      <p className="mt-1 text-sm font-semibold leading-6 theme-text-strong">{detail.title}</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-[1.25rem] border theme-border theme-panel-subtle px-4 py-3">
                  <div className="flex items-start gap-3">
                    <UserRound className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] theme-text-soft">
                        {locale === "en" ? "Submitted by" : "Người nộp"}
                      </p>
                      <p className="mt-1 text-sm font-semibold theme-text-strong">{detail.submittedByName}</p>
                      <p className="mt-1 text-xs theme-text-soft">{formatDateLabel(locale, detail.submittedAt)}</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-[1.25rem] border theme-border theme-panel-subtle px-4 py-3">
                  <div className="flex items-start gap-3">
                    <Scale className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] theme-text-soft">
                        {locale === "en" ? "Version / file" : "Phiên bản / tệp"}
                      </p>
                      <p className="mt-1 text-sm font-semibold theme-text-strong">{`Version ${detail.version}`}</p>
                      <p className="mt-1 break-words text-xs leading-5 theme-text-soft">{detail.resourceLabel}</p>
                      {detail.resourceSizeBytes ? (
                        <p className="mt-1 text-xs theme-text-faint">{formatBytes(detail.resourceSizeBytes)}</p>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>

              {detail.resourceUrl ? (
                <a
                  href={detail.resourceUrl}
                  className="theme-button-primary mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold"
                >
                  <Download className="h-4 w-4" />
                  {locale === "en" ? "Download report" : "Tải báo cáo"}
                </a>
              ) : null}
            </Surface>

            <Surface className="px-5 py-5">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] theme-eyebrow">
                {locale === "en" ? "Review controls" : "Điều khiển chấm"}
              </p>
              <div className="mt-4 rounded-[1.25rem] border theme-border theme-panel-subtle px-4 py-4">
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
                  placeholder={locale === "en" ? "Explain bonus points or key scoring rationale." : "Nêu lý do điểm thưởng hoặc lập luận chấm chính."}
                  className="theme-placeholder w-full rounded-2xl border theme-border theme-panel px-4 py-3 text-sm leading-7 theme-text-strong outline-none"
                />
              </label>

              {scoredAt ? (
                <div className="mt-4 rounded-[1.25rem] border theme-border theme-panel-subtle px-4 py-4">
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
                <div
                  className={`mt-4 rounded-[1.25rem] border px-4 py-4 ${
                    messageTone === "warning"
                      ? "border-amber-300/45 bg-amber-400/12 text-amber-900 dark:border-amber-200/25 dark:bg-amber-300/12 dark:text-amber-100"
                      : "border-rose-300/45 bg-rose-500/10 text-rose-900 dark:border-rose-200/25 dark:bg-rose-300/12 dark:text-rose-100"
                  }`}
                >
                  <div className="flex gap-3">
                    <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                    <p className="text-sm font-medium leading-6">{message}</p>
                  </div>
                </div>
              ) : null}

              <button
                type="button"
                onClick={() => void handleSubmit()}
                disabled={isSaving}
                className="theme-button-primary mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold disabled:opacity-60"
              >
                <Save className="h-4 w-4" />
                {locale === "en"
                  ? isSaving
                    ? "Saving..."
                    : "Save rubric score"
                  : isSaving
                    ? "Đang lưu..."
                    : "Lưu điểm rubric"}
              </button>
            </Surface>
          </aside>
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
