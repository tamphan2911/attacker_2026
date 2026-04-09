"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  FileText,
  NotebookPen,
  Save,
  Scale,
  TimerReset,
  UserRound,
} from "lucide-react";

import { useSiteState } from "@/components/providers/site-state-provider";
import { Surface, StatusPill } from "@/components/site-ui";
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
            step="0.5"
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
  const [score, setScore] = useState(detail.review.score == null ? "" : String(detail.review.score));
  const [note, setNote] = useState(detail.review.note);
  const [scoredAt, setScoredAt] = useState(detail.review.scoredAt);
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async () => {
    const parsedScore = Number(score);
    if (!Number.isFinite(parsedScore)) {
      setMessage(locale === "en" ? "Please enter a valid score." : "Hãy nhập một mức điểm hợp lệ.");
      return;
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
        score: parsedScore,
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
    setMessage(locale === "en" ? "Judge score saved." : "Đã lưu điểm chấm.");
    setIsSaving(false);
    router.refresh();
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
        </div>
      </Surface>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <Surface className="px-6 py-6 md:px-8 md:py-8">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-[1.5rem] border theme-border theme-panel px-4 py-4">
                <div className="flex items-center gap-3">
                  <Scale className="h-5 w-5 text-sky-500" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] theme-text-soft">
                      {locale === "en" ? "Multiple choices score" : "Điểm trắc nghiệm"}
                    </p>
                    <p className="mt-2 text-lg font-semibold theme-text-strong">{detail.objectiveScore}</p>
                  </div>
                </div>
              </div>
              <div className="rounded-[1.5rem] border theme-border theme-panel px-4 py-4">
                <div className="flex items-center gap-3">
                  <TimerReset className="h-5 w-5 text-emerald-500" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] theme-text-soft">
                      {locale === "en" ? "Duration" : "Thời lượng"}
                    </p>
                    <p className="mt-2 text-lg font-semibold theme-text-strong">{`${detail.durationMinutes} ${locale === "en" ? "minutes" : "phút"}`}</p>
                  </div>
                </div>
              </div>
              <div className="rounded-[1.5rem] border theme-border theme-panel px-4 py-4">
                <div className="flex items-center gap-3">
                  <UserRound className="h-5 w-5 text-amber-500" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] theme-text-soft">
                      {locale === "en" ? "Participant" : "Thí sinh"}
                    </p>
                    <p className="mt-2 text-sm font-semibold theme-text-strong">{detail.participantUniversity}</p>
                  </div>
                </div>
              </div>
            </div>
          </Surface>

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
          title={locale === "en" ? "Round 1 essay score" : "Điểm tự luận Vòng 1"}
          description={
            locale === "en"
              ? "Save your score independently from other judges. This does not overwrite another judge's review."
              : "Điểm chấm của bạn được lưu độc lập với giám khảo khác. Thao tác này không ghi đè bài chấm của người khác."
          }
        />
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
  const [score, setScore] = useState(detail.review.score == null ? "" : String(detail.review.score));
  const [note, setNote] = useState(detail.review.note);
  const [scoredAt, setScoredAt] = useState(detail.review.scoredAt);
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async () => {
    const parsedScore = Number(score);
    if (!Number.isFinite(parsedScore)) {
      setMessage(locale === "en" ? "Please enter a valid score." : "Hãy nhập một mức điểm hợp lệ.");
      return;
    }

    setIsSaving(true);
    setMessage("");

    const response = await fetch(`/api/judge-dashboard/submissions/${detail.submissionId}/review`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "same-origin",
      body: JSON.stringify({
        score: parsedScore,
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
    setMessage(locale === "en" ? "Judge score saved." : "Đã lưu điểm chấm.");
    setIsSaving(false);
    router.refresh();
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
                  {locale === "en" ? "Download report" : "Tải hồ sơ"}
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
      </div>
    </div>
  );
}
