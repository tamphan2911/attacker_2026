"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BookText,
  Clock3,
  FileQuestion,
  LoaderCircle,
  Play,
  ShieldCheck,
  Target,
  X,
} from "lucide-react";

import { useSiteState } from "@/components/providers/site-state-provider";
import { SectionHeading, StatusPill, Surface } from "@/components/site-ui";
import { TEAM_MIN_MEMBERS, contactInfo } from "@/data/site-content";
import {
  canTeamTakeRound1,
  getCompetitionRoundPrimaryTimelineItem,
  getCompetitionRoundWindow,
  getTeamCompetitionState,
  isTimelineItemFinished,
  isTeamRound1Locked,
  pickCompetitionStateLabel,
} from "@/lib/competition";
import {
  ROUND1_ESSAY_TOTAL,
  ROUND1_ESSAY_MAX_SCORE,
  ROUND1_ESSAY_MIN_WORDS,
  ROUND1_ESSAY_WORD_LIMIT,
  ROUND1_OBJECTIVE_MAX_SCORE,
  ROUND1_OBJECTIVE_QUESTIONS_PER_TOPIC,
  ROUND1_OBJECTIVE_TOTAL,
  ROUND1_TOTAL_QUESTIONS,
  ROUND1_TOTAL_MAX_SCORE,
  ROUND1_TOPIC_COUNT,
  countWords,
  getActiveRound1Bank,
  isRound1QuestionAnswered,
  limitEssayToWordCount,
  pickRound1QuestionText,
  pickRound1TypeLabel,
  type Round1PaperQuestion,
  type Round1QuestionResponse,
} from "@/lib/round1";
import { estimateEssayAiLikelihood } from "@/lib/essay-ai-guard";
import { formatDateRangeLabel } from "@/lib/site";
import { getTimelineEndDateTime, getTimelineStartDateTime, type TimelineDateRange } from "@/lib/timeline-dates";
import type { Round1Submission } from "@/types/site";

interface Round1ExamSession {
  id: string;
  bankId: string;
  teamId: string;
  userId: string;
  startedAt: string;
  deadlineAt: string;
  currentQuestionIndex: number;
  answers: Record<string, Round1QuestionResponse>;
  questions: Round1PaperQuestion[];
}

type AttemptStateResponse = {
  attempt: Round1ExamSession | null;
  submission: Round1Submission | null;
  autoSubmitted?: boolean;
};

type DialogMode = "start" | "submit" | null;
type Round1WindowAvailability = "not-started" | "open" | "closed";

const ROUND1_SUBMITTED_DASHBOARD_URL = "/dashboard?round1=submitted";
const ESSAY_BLOCKED_INPUT_TYPES = new Set([
  "insertFromDrop",
  "insertFromPaste",
  "insertFromPasteAsQuotation",
  "insertFromYank",
]);

function isRound1EssayAnswerTarget(target: EventTarget | null) {
  return target instanceof HTMLElement && target.dataset.round1EssayAnswer === "true";
}

function getRound1WindowAvailability(
  round1Window: TimelineDateRange | undefined,
  nowMs: number,
): Round1WindowAvailability {
  if (!round1Window) {
    return "open";
  }

  const startsAt = getTimelineStartDateTime(round1Window).getTime();
  const endsAt = getTimelineEndDateTime(round1Window).getTime();

  if (nowMs < startsAt) {
    return "not-started";
  }

  if (nowMs > endsAt) {
    return "closed";
  }

  return "open";
}

function getRound1WindowWarning(
  locale: "en" | "vi",
  availability: Round1WindowAvailability,
  dateRangeLabel: string | null,
) {
  if (availability === "not-started") {
    return {
      title: locale === "en" ? "Round 1 is not open yet." : "Vòng 1 chưa mở.",
      body:
        locale === "en"
          ? `The official attempt can only start during the Round 1 exam window${dateRangeLabel ? `: ${dateRangeLabel}` : "."}`
          : `Lượt thi chính thức chỉ có thể bắt đầu trong thời gian mở bài Vòng 1${dateRangeLabel ? `: ${dateRangeLabel}` : "."}`,
    };
  }

  if (availability === "closed") {
    return {
      title: locale === "en" ? "Round 1 is closed." : "Vòng 1 đã đóng.",
      body:
        locale === "en"
          ? "The individual exam window has ended, so new official attempts are no longer accepted."
          : "Thời gian làm bài cá nhân đã kết thúc, vì vậy hệ thống không nhận lượt thi chính thức mới.",
    };
  }

  return null;
}

function getRound1StartErrorMessage(
  locale: "en" | "vi",
  status: number | null,
  serverMessage?: string,
) {
  const normalizedMessage = serverMessage?.trim() ?? "";

  if (normalizedMessage) {
    if (normalizedMessage.includes("Round 1 has not started yet")) {
      return locale === "en"
        ? "Round 1 has not opened yet. Please check the official timeline before starting the exam."
        : "Vòng 1 chưa mở theo lịch chính thức. Vui lòng kiểm tra lại mốc thời gian trước khi bắt đầu bài thi.";
    }

    if (normalizedMessage.includes("Round 1 is finished")) {
      return locale === "en"
        ? "Round 1 has already closed. New official attempts are no longer accepted."
        : "Vòng 1 đã kết thúc. Hệ thống không còn nhận lượt thi chính thức mới.";
    }

    if (normalizedMessage.includes("This account has already submitted")) {
      return locale === "en"
        ? "This account has already submitted Round 1, so a new attempt cannot be started."
        : "Tài khoản này đã nộp bài Vòng 1, vì vậy không thể bắt đầu lượt thi mới.";
    }

    if (normalizedMessage.includes("Join a team")) {
      return locale === "en"
        ? "You need to join an eligible team before starting the Round 1 exam."
        : "Bạn cần tham gia một đội đủ điều kiện trước khi bắt đầu bài thi Vòng 1.";
    }

    if (normalizedMessage.includes("at least")) {
      return locale === "en"
        ? "Your team does not have enough members for Round 1 yet. Please complete the team roster first."
        : "Đội của bạn chưa đủ số lượng thành viên để vào Vòng 1. Vui lòng hoàn tất đội hình trước.";
    }

    if (normalizedMessage.includes("no longer competing in Round 1")) {
      return locale === "en"
        ? "Your team is not currently in Round 1, so this account cannot start a Round 1 attempt."
        : "Đội của bạn hiện không ở Vòng 1, nên tài khoản này không thể bắt đầu lượt thi Vòng 1.";
    }

    if (normalizedMessage.includes("lock protocol")) {
      return locale === "en"
        ? "Your team must be locked for Round 1 before any member can start the exam."
        : "Đội của bạn cần hoàn tất khóa đội hình Vòng 1 trước khi thành viên bắt đầu bài thi.";
    }

    if (normalizedMessage.includes("bank configuration") || normalizedMessage.includes("test bank")) {
      return locale === "en"
        ? "The Round 1 test bank is not ready yet. Please contact the organizing team to activate the exam banks."
        : "Ngân hàng đề Vòng 1 chưa sẵn sàng. Vui lòng liên hệ ban tổ chức để kích hoạt ngân hàng đề.";
    }

    return normalizedMessage;
  }

  if (status === 401) {
    return locale === "en"
      ? "Your login session has expired. Please sign in again before starting the exam."
      : "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại trước khi bắt đầu bài thi.";
  }

  if (status === 403) {
    return locale === "en"
      ? "Only eligible participant accounts can start the Round 1 exam."
      : "Chỉ tài khoản thí sinh đủ điều kiện mới có thể bắt đầu bài thi Vòng 1.";
  }

  if (status === 409) {
    return locale === "en"
      ? "Your account or team is not currently eligible to start Round 1. Please check team status, roster lock, and the official exam window."
      : "Tài khoản hoặc đội của bạn hiện chưa đủ điều kiện bắt đầu Vòng 1. Vui lòng kiểm tra trạng thái đội, khóa đội hình và thời gian mở bài.";
  }

  return locale === "en"
    ? "The system could not start the Round 1 exam because the server did not return a usable response. Please try again or contact technical support."
    : "Hệ thống chưa thể bắt đầu bài thi Vòng 1 vì máy chủ không trả về phản hồi hợp lệ. Vui lòng thử lại hoặc liên hệ hỗ trợ kỹ thuật.";
}

function formatRemainingTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function getLatestSubmissionForUser<T extends { userId: string; submittedAt: string }>(
  rows: T[],
  userId: string,
) {
  return rows
    .filter((row) => row.userId === userId)
    .sort((left, right) => right.submittedAt.localeCompare(left.submittedAt))[0];
}

function Round1ConfirmDialog({
  locale,
  mode,
  open,
  pending,
  error,
  answeredCount,
  totalCount,
  unansweredCount,
  essayWarning,
  blockingWarning,
  onClose,
  onConfirm,
}: {
  locale: "en" | "vi";
  mode: Exclude<DialogMode, null>;
  open: boolean;
  pending: boolean;
  error: string | null;
  answeredCount: number;
  totalCount: number;
  unansweredCount: number;
  essayWarning: boolean;
  blockingWarning?: { title: string; body: string } | null;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!open) {
    return null;
  }

  const isStart = mode === "start";

  return (
    <div className="fixed inset-0 z-[90] overflow-y-auto bg-[rgba(7,18,35,0.56)] px-4 py-5 backdrop-blur-sm md:px-6 md:py-8">
      <div className="mx-auto flex min-h-full w-full max-w-xl items-center justify-center">
        <div className="theme-card-shadow flex w-full max-h-[calc(100vh-2.5rem)] flex-col overflow-hidden rounded-[2rem] border theme-border bg-[rgba(255,255,255,0.98)] shadow-[0_28px_70px_rgba(10,22,40,0.2)] dark:bg-[rgba(10,20,36,0.98)] md:max-h-[calc(100vh-4rem)]">
        <div className="flex items-start justify-between gap-4 border-b theme-border bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(234,244,255,0.94))] px-6 py-5 dark:bg-[linear-gradient(135deg,rgba(12,26,47,0.98),rgba(15,39,72,0.92))]">
          <div className="space-y-3">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-[1.2rem] border border-sky-700/16 bg-[linear-gradient(135deg,rgba(37,99,235,0.14),rgba(14,165,233,0.16))] text-sky-700 dark:border-sky-300/16 dark:bg-[linear-gradient(135deg,rgba(56,189,248,0.22),rgba(37,99,235,0.18))] dark:text-sky-100">
              {isStart ? <Play className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
            </span>
            <div>
              <p className="theme-eyebrow text-[0.68rem] font-semibold uppercase tracking-[0.3em]">
                {isStart
                  ? locale === "en"
                    ? "Round 1 check"
                    : "Xác nhận Vòng 1"
                  : locale === "en"
                    ? "Submit attempt"
                    : "Nộp bài"}
              </p>
              <h2 className="theme-heading mt-2 text-2xl font-semibold theme-text-strong">
                {isStart
                  ? locale === "en"
                    ? "Start the official Round 1 exam?"
                    : "Bắt đầu lượt thi Vòng 1 chính thức?"
                  : locale === "en"
                    ? "Submit the current Round 1 attempt?"
                    : "Nộp lượt thi Vòng 1 hiện tại?"}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border theme-border theme-panel text-sm theme-text-strong"
            aria-label={locale === "en" ? "Close dialog" : "Đóng cửa sổ"}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto px-6 py-6">
          {blockingWarning ? (
            <div className="rounded-[1.5rem] border border-amber-700/24 bg-[linear-gradient(135deg,rgba(255,251,235,0.98),rgba(254,243,199,0.94))] px-4 py-4 text-amber-950 shadow-[0_16px_38px_rgba(245,158,11,0.12)] dark:border-amber-300/24 dark:bg-[linear-gradient(135deg,rgba(120,53,15,0.38),rgba(113,63,18,0.28))] dark:text-amber-100">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-amber-700/18 bg-amber-400/20 dark:border-amber-200/20 dark:bg-amber-300/14">
                  <AlertTriangle className="h-4.5 w-4.5" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{blockingWarning.title}</p>
                  <p className="mt-1 text-sm leading-7">{blockingWarning.body}</p>
                </div>
              </div>
            </div>
          ) : null}

          {error ? (
            <div className="rounded-[1.5rem] border border-rose-700/24 bg-[linear-gradient(135deg,rgba(255,241,242,0.98),rgba(255,228,230,0.94))] px-4 py-4 text-rose-950 shadow-[0_16px_38px_rgba(225,29,72,0.1)] dark:border-rose-300/22 dark:bg-[linear-gradient(135deg,rgba(127,29,29,0.34),rgba(136,19,55,0.24))] dark:text-rose-100">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-rose-700/18 bg-rose-400/18 dark:border-rose-200/18 dark:bg-rose-300/12">
                  <AlertTriangle className="h-4.5 w-4.5" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold">
                    {locale === "en" ? "Cannot start yet" : "Chưa thể bắt đầu"}
                  </p>
                  <p className="mt-1 text-sm leading-7">{error}</p>
                </div>
              </div>
            </div>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-[1.4rem] border theme-border theme-panel-subtle px-4 py-4">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] theme-text-soft">
                {locale === "en" ? "Answered" : "Đã trả lời"}
              </p>
              <p className="mt-2 text-2xl font-semibold theme-text-strong">{answeredCount}</p>
            </div>
            <div className="rounded-[1.4rem] border theme-border theme-panel-subtle px-4 py-4">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] theme-text-soft">
                {locale === "en" ? "Remaining" : "Chưa trả lời"}
              </p>
              <p className="mt-2 text-2xl font-semibold theme-text-strong">{unansweredCount}</p>
            </div>
            <div className="rounded-[1.4rem] border theme-border theme-panel-subtle px-4 py-4">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] theme-text-soft">
                {locale === "en" ? "Question total" : "Tổng số câu"}
              </p>
              <p className="mt-2 text-2xl font-semibold theme-text-strong">{totalCount}</p>
            </div>
          </div>

          <div className="space-y-3">
            {(isStart
              ? [
                  locale === "en"
                    ? "The timer starts immediately and keeps running across refresh, tab close, sign out, and re-login."
                    : "Đồng hồ bắt đầu ngay lập tức và vẫn tiếp tục chạy dù bạn tải lại trang, đóng tab, đăng xuất hay đăng nhập lại.",
                  locale === "en"
                    ? "This is one official attempt only. The paper order is fixed for this attempt and cannot be regenerated."
                    : "Đây là lượt thi chính thức duy nhất. Thứ tự câu hỏi của lượt thi này được cố định và không thể tạo lại.",
                  locale === "en"
                    ? "If time expires, the latest saved answers will be submitted automatically."
                    : "Khi hết giờ, các câu trả lời đã lưu gần nhất sẽ được tự động nộp.",
                ]
              : [
                  locale === "en"
                    ? "After submission, this account cannot reopen or redo the Round 1 exam."
                    : "Sau khi nộp, tài khoản này không thể mở lại hoặc làm lại bài thi Vòng 1.",
                  locale === "en"
                    ? "Unanswered objective questions will be counted as incorrect."
                    : "Các câu trắc nghiệm chưa trả lời sẽ được tính là sai.",
                  locale === "en"
                    ? "Essay responses remain pending manual review by admin or moderator."
                    : "Phần tự luận sẽ tiếp tục chờ admin hoặc moderator chấm thủ công.",
                ]
            ).map((item) => (
              <div
                key={item}
                className="flex items-start gap-3 rounded-[1.4rem] border theme-border theme-panel px-4 py-3.5 text-sm leading-7 theme-text-body"
              >
                <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-[linear-gradient(135deg,#1772d0,#0ea5e9)]" />
                <span>{item}</span>
              </div>
            ))}
          </div>

          {essayWarning ? (
            <div className="rounded-[1.4rem] border border-amber-500/35 bg-amber-500/12 px-4 py-3.5 text-sm leading-7 text-amber-900 shadow-[0_14px_32px_rgba(245,158,11,0.08)] dark:border-amber-300/24 dark:bg-amber-300/14 dark:text-amber-100">
              {locale === "en"
                ? `Each essay answer must be more than ${ROUND1_ESSAY_MIN_WORDS - 1} words and no more than ${ROUND1_ESSAY_WORD_LIMIT} words before manual submission.`
                : `Mỗi câu tự luận cần dài hơn ${ROUND1_ESSAY_MIN_WORDS - 1} từ và không vượt quá ${ROUND1_ESSAY_WORD_LIMIT} từ trước khi nộp thủ công.`}
            </div>
          ) : null}

          <div className="rounded-[1.4rem] border theme-border theme-panel-subtle px-4 py-3.5 text-sm leading-7 theme-text-muted">
            {locale === "en"
              ? `Technical support: ${contactInfo.email} · ${contactInfo.phone}`
              : `Hỗ trợ kỹ thuật: ${contactInfo.email} hoặc hotline: ${contactInfo.phone}`}
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t theme-border px-6 py-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="inline-flex items-center justify-center rounded-full border theme-border theme-panel px-5 py-3 text-sm font-semibold theme-text-strong disabled:cursor-not-allowed disabled:opacity-50"
          >
            {locale === "en" ? "Cancel" : "Hủy"}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending || Boolean(blockingWarning)}
            className="theme-button-primary inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : isStart ? <Play className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
            {isStart
              ? locale === "en"
                ? "Start official attempt"
                : "Bắt đầu lượt thi chính thức"
              : locale === "en"
                ? "Submit now"
                : "Nộp ngay"}
          </button>
        </div>
        </div>
      </div>
    </div>
  );
}

export function Round1ExamPage() {
  const {
    authStatus,
    isAuthenticated,
    locale,
    currentUser,
    currentTeam,
    theme,
    round1TestBanks,
    round1Submissions,
    timelineItems,
    hasHydrated,
  } = useSiteState();
  const [session, setSession] = useState<Round1ExamSession | null>(null);
  const [attemptState, setAttemptState] = useState<"idle" | "loading" | "ready">("idle");
  const [resolvedSubmission, setResolvedSubmission] = useState<Round1Submission | null>(null);
  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [dialogPending, setDialogPending] = useState(false);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const [captureWarning, setCaptureWarning] = useState<string | null>(null);
  const [essayPasteWarning, setEssayPasteWarning] = useState<string | null>(null);
  const [essayWordLimitWarning, setEssayWordLimitWarning] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const sessionRef = useRef<Round1ExamSession | null>(null);
  const submissionRef = useRef<Round1Submission | null>(null);
  const submitInFlightRef = useRef(false);
  const captureWarningTimeoutRef = useRef<number | null>(null);
  const essayPasteWarningTimeoutRef = useRef<number | null>(null);
  const essayWordLimitWarningTimeoutRef = useRef<number | null>(null);

  const activeObjectiveBank = getActiveRound1Bank(round1TestBanks, "objective");
  const activeEssayBank = getActiveRound1Bank(round1TestBanks, "essay");
  const round1WordLimit = activeEssayBank?.wordLimit ?? ROUND1_ESSAY_WORD_LIMIT;
  const providerSubmission = getLatestSubmissionForUser(round1Submissions, currentUser.id);
  const existingSubmission = resolvedSubmission ?? providerSubmission;
  const isStudent = currentUser.role === "student";
  const currentCompetitionState = currentTeam ? getTeamCompetitionState(currentTeam) : undefined;
  const round1Window =
    getCompetitionRoundPrimaryTimelineItem("round-1", timelineItems) ??
    getCompetitionRoundWindow("round-1", timelineItems);
  const round1WindowDateRangeLabel = round1Window
    ? formatDateRangeLabel(locale, round1Window.startDate, round1Window.endDate, round1Window.startTime, round1Window.endTime)
    : null;
  const round1WindowAvailability = getRound1WindowAvailability(round1Window, nowMs);
  const round1StartWarning = getRound1WindowWarning(
    locale,
    round1WindowAvailability,
    round1WindowDateRangeLabel,
  );
  const round1Finished = isTimelineItemFinished("round-1-individual-qualifier", timelineItems, new Date());
  const teamRound1Locked = Boolean(currentTeam && isTeamRound1Locked(currentTeam));
  const isEligibleForRound1 = Boolean(
    isStudent && currentTeam && canTeamTakeRound1(currentTeam, new Date(), timelineItems),
  );
  const progressSnapshot = session
    ? JSON.stringify({
        currentQuestionIndex: session.currentQuestionIndex,
        answers: session.answers,
      })
    : "";

  const showEssayPasteWarning = useCallback(() => {
    if (essayPasteWarningTimeoutRef.current) {
      window.clearTimeout(essayPasteWarningTimeoutRef.current);
    }

    setEssayPasteWarning(
      locale === "en"
        ? "Pasting is prohibited for essay answers. Please type your response directly in this field."
        : "Không được dán nội dung vào câu tự luận. Vui lòng tự nhập câu trả lời trực tiếp trong ô này.",
    );

    essayPasteWarningTimeoutRef.current = window.setTimeout(() => {
      setEssayPasteWarning(null);
      essayPasteWarningTimeoutRef.current = null;
    }, 4200);
  }, [locale]);

  const handleEssayBeforeInput = useCallback(
    (event: FormEvent<HTMLTextAreaElement>) => {
      const inputType = (event.nativeEvent as InputEvent).inputType;

      if (ESSAY_BLOCKED_INPUT_TYPES.has(inputType)) {
        event.preventDefault();
        showEssayPasteWarning();
      }
    },
    [showEssayPasteWarning],
  );

  const showEssayWordLimitWarning = useCallback(() => {
    if (essayWordLimitWarningTimeoutRef.current) {
      window.clearTimeout(essayWordLimitWarningTimeoutRef.current);
    }

    setEssayWordLimitWarning(
      locale === "en"
        ? `Essay answers are limited to ${round1WordLimit} words. Extra words cannot be added.`
        : `Câu trả lời tự luận giới hạn ${round1WordLimit} từ. Bạn không thể nhập thêm vượt quá giới hạn này.`,
    );

    essayWordLimitWarningTimeoutRef.current = window.setTimeout(() => {
      setEssayWordLimitWarning(null);
      essayWordLimitWarningTimeoutRef.current = null;
    }, 4200);
  }, [locale, round1WordLimit]);

  useEffect(
    () => () => {
      if (essayPasteWarningTimeoutRef.current) {
        window.clearTimeout(essayPasteWarningTimeoutRef.current);
      }
      if (essayWordLimitWarningTimeoutRef.current) {
        window.clearTimeout(essayWordLimitWarningTimeoutRef.current);
      }
    },
    [],
  );

  const applyAttemptPayload = useCallback(
    (payload: AttemptStateResponse) => {
      if (payload.submission) {
        setResolvedSubmission(payload.submission);
        window.location.assign(ROUND1_SUBMITTED_DASHBOARD_URL);
        return true;
      }

      if (!payload.attempt || payload.attempt.questions.length === 0) {
        return false;
      }

      setResolvedSubmission(null);
      setPageError(null);
      setAttemptState("ready");
      setSession(payload.attempt);
      setNowMs(Date.now());
      setDialogMode(null);
      return true;
    },
    [],
  );

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  useEffect(() => {
    return () => {
      if (captureWarningTimeoutRef.current) {
        window.clearTimeout(captureWarningTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    submissionRef.current = existingSubmission ?? null;
  }, [existingSubmission]);

  useEffect(() => {
    if (hasHydrated && isAuthenticated && isStudent && existingSubmission && !session) {
      window.location.replace(ROUND1_SUBMITTED_DASHBOARD_URL);
    }
  }, [existingSubmission, hasHydrated, isAuthenticated, isStudent, session]);

  const showCaptureWarning = useCallback(() => {
    const message =
      locale === "en"
        ? "Screen capture and print shortcuts are restricted during the active Round 1 exam."
        : "Trong thời gian làm bài Vòng 1, các phím tắt chụp màn hình và in nội dung sẽ bị hạn chế.";

    setCaptureWarning(message);

    if (captureWarningTimeoutRef.current) {
      window.clearTimeout(captureWarningTimeoutRef.current);
    }

    captureWarningTimeoutRef.current = window.setTimeout(() => {
      setCaptureWarning(null);
      captureWarningTimeoutRef.current = null;
    }, 3600);
  }, [locale]);

  useEffect(() => {
    if (!hasHydrated || !isAuthenticated || !currentUser.id || existingSubmission || !isStudent) {
      setAttemptState((current) => (current === "ready" ? current : "ready"));
      return;
    }

    let cancelled = false;

    const loadAttemptState = async () => {
      setAttemptState("loading");
      setPageError(null);

      try {
        const response = await fetch("/api/round-1/attempt", {
          cache: "no-store",
          credentials: "same-origin",
        });

        if (!response.ok) {
          throw new Error();
        }

        const payload = (await response.json()) as AttemptStateResponse;
        if (cancelled) {
          return;
        }

        setResolvedSubmission(payload.submission);
        setSession(payload.attempt);
        setAttemptState("ready");

        if (payload.submission && (payload.autoSubmitted || !providerSubmission)) {
          window.location.assign(ROUND1_SUBMITTED_DASHBOARD_URL);
        }
      } catch {
        if (!cancelled) {
          setSession(null);
          setAttemptState("ready");
          setPageError(
            locale === "en"
              ? "Could not restore the current Round 1 attempt right now."
              : "Hiện không thể khôi phục lượt thi Vòng 1 đang diễn ra.",
          );
        }
      }
    };

    void loadAttemptState();

    return () => {
      cancelled = true;
    };
  }, [currentUser.id, existingSubmission, hasHydrated, isAuthenticated, isStudent, locale, providerSubmission]);

  const persistAttemptProgress = useCallback(
    async (
      targetSession: Round1ExamSession,
      options?: { keepalive?: boolean; silent?: boolean },
    ) => {
      const response = await fetch("/api/round-1/attempt", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        cache: "no-store",
        keepalive: options?.keepalive,
        body: JSON.stringify({
          currentQuestionIndex: targetSession.currentQuestionIndex,
          answers: targetSession.answers,
        }),
      });

      if (!response.ok) {
        if (!options?.silent) {
          setPageError(
            locale === "en"
              ? "Could not save the current Round 1 progress."
              : "Hiện không thể lưu tiến độ làm bài Vòng 1.",
          );
        }
        return;
      }

      const payload = (await response.json()) as AttemptStateResponse;
      setPageError(null);
      if (payload.submission) {
        setResolvedSubmission(payload.submission);
        setSession(null);
        window.location.assign(ROUND1_SUBMITTED_DASHBOARD_URL);
      }
    },
    [locale],
  );

  useEffect(() => {
    if (!session || attemptState !== "ready" || existingSubmission) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void persistAttemptProgress(session);
    }, 700);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [attemptState, existingSubmission, persistAttemptProgress, progressSnapshot, session]);

  useEffect(() => {
    if (!session) {
      return;
    }

    const timer = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [session]);

  useEffect(() => {
    if (session) {
      return;
    }

    const timer = window.setInterval(() => {
      setNowMs(Date.now());
    }, 30000);

    return () => {
      window.clearInterval(timer);
    };
  }, [session]);

  useEffect(() => {
    if (!session) {
      return;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [session]);

  useEffect(() => {
    if (!session) {
      return;
    }

    const flushProgress = () => {
      if (!sessionRef.current || submissionRef.current) {
        return;
      }

      void persistAttemptProgress(sessionRef.current, { keepalive: true, silent: true });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        flushProgress();
      }
    };

    window.addEventListener("pagehide", flushProgress);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("pagehide", flushProgress);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [persistAttemptProgress, session]);

  useEffect(() => {
    if (!session || existingSubmission) {
      return;
    }

    document.documentElement.classList.add("theme-round1-exam-locked");
    document.body.classList.add("theme-round1-exam-locked");

    const blockEvent = (event: Event) => {
      event.preventDefault();
    };

    const handlePaste = (event: ClipboardEvent) => {
      event.preventDefault();
      if (isRound1EssayAnswerTarget(event.target)) {
        showEssayPasteWarning();
      }
    };

    const handleDrop = (event: DragEvent) => {
      event.preventDefault();
      if (isRound1EssayAnswerTarget(event.target)) {
        showEssayPasteWarning();
      }
    };

    const handleBeforeInput = (event: InputEvent) => {
      if (
        ESSAY_BLOCKED_INPUT_TYPES.has(event.inputType) &&
        isRound1EssayAnswerTarget(event.target)
      ) {
        event.preventDefault();
        showEssayPasteWarning();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const isCommandModifier = event.ctrlKey || event.metaKey;
      const isWindowsPrintScreen = key === "printscreen";
      const isMacScreenshotShortcut =
        event.metaKey && event.shiftKey && (key === "3" || key === "4" || key === "5");
      const isPrintShortcut = isCommandModifier && key === "p";

      if (isWindowsPrintScreen || isMacScreenshotShortcut || isPrintShortcut) {
        event.preventDefault();
        showCaptureWarning();
        return;
      }

      if (!(event.ctrlKey || event.metaKey)) {
        return;
      }
      if (key === "a" || key === "c" || key === "v" || key === "x") {
        if (
          key === "v" &&
          isRound1EssayAnswerTarget(event.target)
        ) {
          showEssayPasteWarning();
        }
        event.preventDefault();
      }
    };

    const handleBeforePrint = (event: Event) => {
      event.preventDefault();
      showCaptureWarning();
    };

    document.addEventListener("copy", blockEvent);
    document.addEventListener("cut", blockEvent);
    document.addEventListener("paste", handlePaste);
    document.addEventListener("drop", handleDrop);
    document.addEventListener("beforeinput", handleBeforeInput);
    document.addEventListener("selectstart", blockEvent);
    document.addEventListener("dragstart", blockEvent);
    document.addEventListener("contextmenu", blockEvent);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("beforeprint", handleBeforePrint);

    return () => {
      document.documentElement.classList.remove("theme-round1-exam-locked");
      document.body.classList.remove("theme-round1-exam-locked");
      document.removeEventListener("copy", blockEvent);
      document.removeEventListener("cut", blockEvent);
      document.removeEventListener("paste", handlePaste);
      document.removeEventListener("drop", handleDrop);
      document.removeEventListener("beforeinput", handleBeforeInput);
      document.removeEventListener("selectstart", blockEvent);
      document.removeEventListener("dragstart", blockEvent);
      document.removeEventListener("contextmenu", blockEvent);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("beforeprint", handleBeforePrint);
    };
  }, [existingSubmission, session, showCaptureWarning, showEssayPasteWarning]);

  const submitExamAttempt = useCallback(
    async (targetSession: Round1ExamSession) => {
      if (submitInFlightRef.current) {
        return;
      }

      submitInFlightRef.current = true;
      setDialogPending(true);
      setDialogError(null);

      try {
        const response = await fetch("/api/round-1/attempt/submit", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "same-origin",
          cache: "no-store",
          body: JSON.stringify({
            currentQuestionIndex: targetSession.currentQuestionIndex,
            answers: targetSession.answers,
          }),
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as { error?: string } | null;
          throw new Error(
            payload?.error ||
              (locale === "en"
                ? "Could not submit the Round 1 attempt right now."
                : "Hiện không thể nộp bài Vòng 1."),
          );
        }

        window.location.assign(ROUND1_SUBMITTED_DASHBOARD_URL);
      } catch (error) {
        setDialogError(
          error instanceof Error
            ? error.message
            : locale === "en"
              ? "Could not submit the Round 1 attempt right now."
              : "Hiện không thể nộp bài Vòng 1.",
        );
      } finally {
        submitInFlightRef.current = false;
        setDialogPending(false);
      }
    },
    [locale],
  );

  const getEssayWordRequirementError = useCallback(
    (targetSession: Round1ExamSession) => {
      const essayQuestions = targetSession.questions.slice(ROUND1_OBJECTIVE_TOTAL);

      for (const question of essayQuestions) {
        const wordCount = countWords(targetSession.answers[question.id]?.essayText ?? "");
        const questionNumber = question.paperOrder;

        if (wordCount < ROUND1_ESSAY_MIN_WORDS) {
          return locale === "en"
            ? `Essay question ${questionNumber} needs more than ${ROUND1_ESSAY_MIN_WORDS - 1} words before submission. It currently has ${wordCount} words.`
            : `Câu tự luận ${questionNumber} cần dài hơn ${ROUND1_ESSAY_MIN_WORDS - 1} từ trước khi nộp. Hiện câu này có ${wordCount} từ.`;
        }

        if (wordCount > round1WordLimit) {
          return locale === "en"
            ? `Essay question ${questionNumber} is above the ${round1WordLimit}-word maximum. Please shorten it before submitting.`
            : `Câu tự luận ${questionNumber} đang vượt quá giới hạn ${round1WordLimit} từ. Vui lòng rút gọn trước khi nộp.`;
        }
      }

      return null;
    },
    [locale, round1WordLimit],
  );

  const remainingSeconds = session
    ? Math.max(0, Math.ceil((new Date(session.deadlineAt).getTime() - nowMs) / 1000))
    : 0;

  useEffect(() => {
    if (!session || existingSubmission || remainingSeconds > 0) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void submitExamAttempt(session);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [existingSubmission, remainingSeconds, session, submitExamAttempt]);

  const startExam = useCallback(async () => {
    if (round1StartWarning) {
      setDialogError(null);
      return;
    }

    setDialogPending(true);
    setDialogError(null);
    setAttemptState("loading");

    try {
      const response = await fetch("/api/round-1/attempt", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(getRound1StartErrorMessage(locale, response.status, payload?.error));
      }

      const payload = (await response.json()) as AttemptStateResponse;
      if (applyAttemptPayload(payload)) {
        return;
      }

      const restoreResponse = await fetch("/api/round-1/attempt", {
        cache: "no-store",
        credentials: "same-origin",
      });

      if (!restoreResponse.ok) {
        throw new Error(
          locale === "en"
            ? "The exam was started, but the current attempt could not be restored."
            : "Bài thi đã được bắt đầu nhưng hệ thống không thể khôi phục lượt thi hiện tại.",
        );
      }

      const restoredPayload = (await restoreResponse.json()) as AttemptStateResponse;
      if (!applyAttemptPayload(restoredPayload)) {
        throw new Error(
          locale === "en"
            ? "The exam was started, but the current attempt is not ready to display yet."
            : "Bài thi đã được bắt đầu nhưng lượt thi hiện tại chưa sẵn sàng để hiển thị.",
        );
      }
    } catch (error) {
      setAttemptState("ready");
      setDialogError(
        error instanceof Error
          ? error.message
          : getRound1StartErrorMessage(locale, null),
      );
    } finally {
      setDialogPending(false);
    }
  }, [applyAttemptPayload, locale, round1StartWarning]);

  const handleConfirmSubmit = async () => {
    if (!session) {
      return;
    }

    if (remainingSeconds > 0) {
      const essayRequirementError = getEssayWordRequirementError(session);
      if (essayRequirementError) {
        setDialogError(essayRequirementError);
        return;
      }
    }

    await submitExamAttempt(session);
  };
  const currentQuestion = session?.questions[session.currentQuestionIndex];
  const currentResponse = currentQuestion ? session?.answers[currentQuestion.id] : undefined;
  const currentEssayAiGuard = useMemo(
    () =>
      currentQuestion?.type === "essay"
        ? estimateEssayAiLikelihood(currentResponse?.essayText ?? "", locale)
        : { score: 0, shouldWarn: false, reasons: [] },
    [currentQuestion?.type, currentResponse?.essayText, locale],
  );

  if (authStatus === "loading" || !hasHydrated) {
    return (
      <Surface className="px-6 py-6 md:px-8 md:py-8">
        <SectionHeading
          eyebrow="Round 1"
          title={locale === "en" ? "Loading Round 1 exam..." : "Đang tải bài thi Vòng 1..."}
        />
      </Surface>
    );
  }

  if (isAuthenticated && !currentUser.id) {
    return (
      <Surface className="px-6 py-6 md:px-8 md:py-8">
        <SectionHeading
          eyebrow="Round 1"
          title={locale === "en" ? "Loading your Round 1 workspace..." : "Đang tải không gian Vòng 1 của bạn..."}
        />
      </Surface>
    );
  }

  if (!isAuthenticated) {
    return (
      <Surface className="px-6 py-6 md:px-8 md:py-8">
        <SectionHeading
          eyebrow="Round 1"
          title={locale === "en" ? "Sign in before taking Round 1." : "Đăng nhập trước khi làm bài Vòng 1."}
          description={
            locale === "en"
              ? "The exam session is now connected to your backend account and team state."
              : "Phiên làm bài hiện đã được kết nối với tài khoản backend và trạng thái đội của bạn."
          }
        />
        <Link
          href="/auth"
          className="theme-button-primary mt-6 inline-flex rounded-[1.4rem] px-5 py-3 text-sm font-semibold"
        >
          {locale === "en" ? "Open sign in" : "Mở đăng nhập"}
        </Link>
      </Surface>
    );
  }

  if (!session && !existingSubmission && (!activeObjectiveBank || !activeEssayBank)) {
    return (
      <Surface className="px-6 py-6 md:px-8 md:py-8">
        <SectionHeading
          eyebrow="Round 1"
          title={
            locale === "en"
              ? "Round 1 bank configuration is incomplete."
              : "Cấu hình ngân hàng câu hỏi Vòng 1 chưa đầy đủ."
          }
          description={
            locale === "en"
              ? "Ask the organizing team to activate both the objective bank and the essay bank before opening the exam."
              : "Hãy yêu cầu ban tổ chức kích hoạt cả ngân hàng trắc nghiệm và ngân hàng tự luận trước khi mở bài thi."
          }
        />
      </Surface>
    );
  }

  if (session && !currentTeam) {
    return (
      <Surface className="px-6 py-6 md:px-8 md:py-8">
        <SectionHeading
          eyebrow="Round 1"
          title={locale === "en" ? "Restoring the current team context..." : "Đang khôi phục ngữ cảnh đội hiện tại..."}
        />
      </Surface>
    );
  }

  if (!existingSubmission && isStudent && attemptState === "loading") {
    return (
      <Surface className="px-6 py-6 md:px-8 md:py-8">
        <SectionHeading
          eyebrow="Round 1"
          title={locale === "en" ? "Restoring your current Round 1 attempt..." : "Đang khôi phục lượt thi Vòng 1 của bạn..."}
          description={
            locale === "en"
              ? "Your saved answers and timer are being synced from the backend."
              : "Câu trả lời đã lưu và thời gian còn lại đang được đồng bộ từ backend."
          }
        />
      </Surface>
    );
  }

  const answeredCount = session
    ? session.questions.filter((question) => isRound1QuestionAnswered(question, session.answers[question.id])).length
    : 0;
  const completionPercent = session ? Math.round((answeredCount / session.questions.length) * 100) : 0;
  const objectiveAnsweredCount = session
    ? session.questions
        .slice(0, ROUND1_OBJECTIVE_TOTAL)
        .filter((question) => isRound1QuestionAnswered(question, session.answers[question.id])).length
    : 0;
  const essayAnsweredCount = session
    ? session.questions
        .slice(ROUND1_OBJECTIVE_TOTAL)
        .filter((question) => isRound1QuestionAnswered(question, session.answers[question.id])).length
    : 0;
  const currentQuestionPointValue =
    currentQuestion?.type === "essay"
      ? Math.round(ROUND1_ESSAY_MAX_SCORE / ROUND1_ESSAY_TOTAL)
      : 2;
  const currentEssayWordCount =
    currentQuestion?.type === "essay"
      ? countWords(currentResponse?.essayText ?? "")
      : 0;
  const currentEssayRemainingWords = Math.max(0, round1WordLimit - currentEssayWordCount);
  const currentEssayMeetsMinimum =
    currentQuestion?.type === "essay" && currentEssayWordCount >= ROUND1_ESSAY_MIN_WORDS;
  const currentEssayExceedsLimit = currentQuestion?.type === "essay" && currentEssayWordCount > round1WordLimit;
  const participantTeamRoleLabel = currentTeam
    ? locale === "en"
      ? `${currentTeam.leaderId === currentUser.id ? "Team leader" : "Team member"} of ${currentTeam.name}`
      : `${currentTeam.leaderId === currentUser.id ? "Đội trưởng đội" : "Thành viên đội"} ${currentTeam.name}`
    : "";
  const navigateToQuestion = (index: number) => {
    setSession((current) =>
      current
        ? {
            ...current,
            currentQuestionIndex: Math.max(0, Math.min(current.questions.length - 1, index)),
          }
        : current,
    );
  };

  if (existingSubmission) {
    return (
      <div className="space-y-8">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold theme-accent">
          <ArrowLeft className="h-4 w-4" />
          {locale === "en" ? "Back to Team Workspace" : "Quay lại Đội thi"}
        </Link>

        <Surface className="px-6 py-6 md:px-8 md:py-8">
          <SectionHeading
            eyebrow={locale === "en" ? "Round 1 submitted" : "Đã nộp Vòng 1"}
            title={
              locale === "en"
                ? "This attempt is locked. View the result in Team Workspace."
                : "Bài làm này đã được khóa. Hãy xem kết quả trong Đội thi."
            }
            description={
              locale === "en"
                ? "Objective score is available immediately. Essay score remains pending until admin or moderator review finishes."
                : "Điểm phần trắc nghiệm có ngay. Điểm tự luận vẫn ở trạng thái chờ cho tới khi admin hoặc moderator chấm xong."
            }
          />
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-[1.5rem] border theme-border theme-panel-subtle px-4 py-4">
              <p className="text-xs uppercase tracking-[0.22em] theme-text-soft">
                {locale === "en" ? "Objective score" : "Điểm trắc nghiệm"}
              </p>
              <p className="mt-2 text-2xl font-semibold theme-text-strong">
                {`${existingSubmission.objectiveScore} / ${ROUND1_OBJECTIVE_MAX_SCORE}`}
              </p>
            </div>
            <div className="rounded-[1.5rem] border theme-border theme-panel-subtle px-4 py-4">
              <p className="text-xs uppercase tracking-[0.22em] theme-text-soft">
                {locale === "en" ? "Essay score" : "Điểm tự luận"}
              </p>
              <p className="mt-2 text-2xl font-semibold theme-text-strong">
                {existingSubmission.essayScore == null ? (locale === "en" ? "Pending" : "Đang chờ") : `${existingSubmission.essayScore} / ${ROUND1_ESSAY_MAX_SCORE}`}
              </p>
            </div>
            <div className="rounded-[1.5rem] border theme-border theme-panel-subtle px-4 py-4">
              <p className="text-xs uppercase tracking-[0.22em] theme-text-soft">
                {locale === "en" ? "Total score" : "Tổng điểm"}
              </p>
              <p className="mt-2 text-2xl font-semibold theme-text-strong">
                {existingSubmission.totalScore == null ? (locale === "en" ? "Pending" : "Đang chờ") : `${existingSubmission.totalScore} / ${ROUND1_TOTAL_MAX_SCORE}`}
              </p>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/dashboard#round1-result" className="theme-button-primary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold">
              <ArrowRight className="h-4 w-4" />
              {locale === "en" ? "Open Round 1 result in Team Workspace" : "Mở kết quả Vòng 1 trong Đội thi"}
            </Link>
            <Link href="/dashboard" className="rounded-full border theme-border theme-panel px-5 py-3 text-sm font-semibold theme-text-strong">
              {locale === "en" ? "Back to Team Workspace" : "Quay lại Đội thi"}
            </Link>
          </div>
        </Surface>
      </div>
    );
  }

  if (!session && !isStudent) {
    return (
      <Surface className="px-6 py-6 md:px-8 md:py-8">
        <SectionHeading
          eyebrow="Round 1"
          title={locale === "en" ? "This route is only for student accounts." : "Route này chỉ dành cho tài khoản sinh viên."}
          description={
            locale === "en"
              ? "Admin and moderator accounts should review Round 1 from the restricted admin mode instead."
              : "Tài khoản admin và moderator nên xem Vòng 1 từ admin mode giới hạn."
          }
        />
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/dashboard" className="theme-button-primary rounded-full px-5 py-3 text-sm font-semibold">
            {locale === "en" ? "Open Team Workspace" : "Mở Đội thi"}
          </Link>
          <Link href="/admin/round-1" className="rounded-full border theme-border theme-panel px-5 py-3 text-sm font-semibold theme-text-strong">
            {locale === "en" ? "Open Round 1 admin" : "Mở admin Vòng 1"}
          </Link>
        </div>
      </Surface>
    );
  }

  if (!session && !currentTeam) {
    return (
      <Surface className="px-6 py-6 md:px-8 md:py-8">
        <SectionHeading
          eyebrow="Round 1"
          title={locale === "en" ? "Join a team before taking Round 1." : "Hãy vào một đội trước khi thi Vòng 1."}
          description={
            locale === "en"
              ? "Round 1 is an individual exam, but only members or leaders of a team can enter it."
              : "Vòng 1 là bài thi cá nhân, nhưng chỉ thành viên hoặc đội trưởng của một đội mới được tham gia."
          }
        />
        <Link href="/dashboard" className="theme-button-primary mt-6 inline-flex rounded-full px-5 py-3 text-sm font-semibold">
          {locale === "en" ? "Go to Team Workspace" : "Đến Đội thi"}
        </Link>
      </Surface>
    );
  }

  if (!session && !isEligibleForRound1) {
    if (currentCompetitionState && currentCompetitionState !== "not-eligible" && currentCompetitionState !== "round-1") {
      return (
        <Surface className="px-6 py-6 md:px-8 md:py-8">
          <SectionHeading
            eyebrow="Round 1"
            title={
              locale === "en"
                ? "This team is no longer competing in Round 1."
                : "Đội này không còn thi đấu ở Vòng 1 nữa."
            }
            description={
              locale === "en"
                ? `The team is currently marked as ${pickCompetitionStateLabel(locale, currentCompetitionState)}, so new Round 1 attempts are closed.`
                : `Đội này hiện đang ở trạng thái ${pickCompetitionStateLabel(locale, currentCompetitionState)}, vì vậy bài thi mới của Vòng 1 đã đóng.`
            }
          />
          <div className="mt-6 flex flex-wrap gap-3">
            <StatusPill tone="success">{pickCompetitionStateLabel(locale, currentCompetitionState)}</StatusPill>
            <Link href="/dashboard" className="rounded-full border theme-border theme-panel px-5 py-3 text-sm font-semibold theme-text-strong">
              {locale === "en" ? "Back to Team Workspace" : "Quay lại Đội thi"}
            </Link>
          </div>
        </Surface>
      );
    }

    if (round1Finished) {
      return (
        <Surface className="px-6 py-6 md:px-8 md:py-8">
          <SectionHeading
            eyebrow="Round 1"
            title={
              locale === "en"
                ? "Round 1 is finished."
                : "Vòng 1 đã kết thúc."
            }
            description={
              locale === "en"
                ? "The individual qualifier window has closed, so new Round 1 attempts are no longer accepted."
                : "Khung thời gian của bài thi cá nhân đã đóng, vì vậy hệ thống không nhận thêm bài Vòng 1 mới."
            }
          />
          <div className="mt-6 flex flex-wrap gap-3">
            {round1Window ? (
              <StatusPill tone="warning">
                {formatDateRangeLabel(locale, round1Window.startDate, round1Window.endDate, round1Window.startTime, round1Window.endTime)}
              </StatusPill>
            ) : null}
            <Link href="/dashboard" className="rounded-full border theme-border theme-panel px-5 py-3 text-sm font-semibold theme-text-strong">
              {locale === "en" ? "Back to Team Workspace" : "Quay lại Đội thi"}
            </Link>
          </div>
        </Surface>
      );
    }

    if (currentCompetitionState === "round-1" && !teamRound1Locked) {
      return (
        <Surface className="px-6 py-6 md:px-8 md:py-8">
          <SectionHeading
            eyebrow="Round 1"
            title={
              locale === "en"
                ? "Lock the team before starting Round 1."
                : "Hãy khóa đội trước khi bắt đầu Vòng 1."
            }
            description={
              locale === "en"
                ? "The team leader must start the lock workflow, and every current member has to approve the fixed roster. Until that happens, nobody in the team can enter the exam."
                : "Đội trưởng phải khởi động quy trình khóa đội và toàn bộ thành viên hiện tại phải cùng xác nhận đội hình cố định. Trước khi hoàn tất bước này, không ai trong đội được vào bài thi."
            }
          />
          <div className="mt-6 flex flex-wrap gap-3">
            <StatusPill tone="warning">
              {locale === "en"
                ? "Team lock required"
                : "Bắt buộc khóa đội"}
            </StatusPill>
            <Link href="/dashboard#round1-lock" className="rounded-full border theme-border theme-panel px-5 py-3 text-sm font-semibold theme-text-strong">
              {locale === "en" ? "Open team lock" : "Mở phần khóa đội"}
            </Link>
          </div>
        </Surface>
      );
    }

    return (
      <Surface className="px-6 py-6 md:px-8 md:py-8">
        <SectionHeading
          eyebrow="Round 1"
          title={
            locale === "en"
              ? "This team is not eligible for Round 1 yet."
              : "Đội này chưa đủ điều kiện vào Vòng 1."
          }
          description={
            locale === "en"
              ? `Round 1 only opens for teams with at least ${TEAM_MIN_MEMBERS} members.`
              : `Vòng 1 chỉ mở cho các đội có ít nhất ${TEAM_MIN_MEMBERS} thành viên.`
          }
        />
        <div className="mt-6 flex flex-wrap gap-3">
          <StatusPill tone="warning">
            {locale === "en"
              ? `${currentTeam?.memberIds.length ?? 0}/${TEAM_MIN_MEMBERS} required members`
              : `${currentTeam?.memberIds.length ?? 0}/${TEAM_MIN_MEMBERS} thanh vien bat buoc`}
          </StatusPill>
          <Link href="/dashboard" className="rounded-full border theme-border theme-panel px-5 py-3 text-sm font-semibold theme-text-strong">
            {locale === "en" ? "Invite more members" : "Mời thêm thành viên"}
          </Link>
        </div>
      </Surface>
    );
  }

  if (!session) {
    return (
      <>
        <div className="space-y-8">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold theme-accent">
            <ArrowLeft className="h-4 w-4" />
            {locale === "en" ? "Back to Team Workspace" : "Quay lại Đội thi"}
          </Link>

          {pageError ? (
            <div className="rounded-[1.5rem] border border-amber-700/22 bg-[linear-gradient(135deg,rgba(255,251,235,0.98),rgba(254,243,199,0.94))] px-5 py-4 text-sm leading-7 text-amber-950 dark:border-amber-300/22 dark:bg-amber-300/12 dark:text-amber-100">
              {pageError}
            </div>
          ) : null}

          <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <Surface className="overflow-hidden px-0 py-0">
            <div className="border-b theme-border bg-[linear-gradient(135deg,rgba(8,47,73,0.18),rgba(23,114,208,0.14),rgba(14,165,233,0.08))] px-6 py-8 md:px-8 md:py-9">
              <p className="theme-eyebrow text-xs font-semibold uppercase tracking-[0.32em]">
                {locale === "en" ? "Round 1 individual test" : "Bài thi cá nhân Vòng 1"}
              </p>
              <h1 className="theme-heading mt-4 max-w-4xl text-3xl font-semibold theme-text-strong md:text-[3rem] md:leading-[1.06]">
                {locale === "en"
                  ? "Structured randomized delivery with one official attempt per student."
                  : "Bài thi ngẫu nhiên theo cấu trúc, mỗi sinh viên chỉ có một lượt chính thức."}
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 theme-text-muted md:text-base">
                {locale === "en"
                  ? "Each student receives 40 objective questions generated from the topic mix plus 4 extra random bank questions, and 2 essay questions placed at the end. The timer runs for 60 minutes, the exam cannot be paused, and the result returns to Team Workspace after submission."
                  : "Mỗi thí sinh nhận 40 câu trắc nghiệm gồm phần theo chủ đề và 4 câu ngẫu nhiên bổ sung từ ngân hàng, cùng 2 câu tự luận luôn đặt ở cuối đề. Đồng hồ chạy trong 60 phút, bài thi không thể tạm dừng và kết quả sẽ quay về Đội thi sau khi nộp."}
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                <StatusPill>{`${ROUND1_OBJECTIVE_TOTAL} + ${ROUND1_ESSAY_TOTAL} ${locale === "en" ? "questions" : "câu hỏi"}`}</StatusPill>
                <StatusPill>{`${activeObjectiveBank!.durationMinutes} ${locale === "en" ? "minutes" : "phút"}`}</StatusPill>
                <StatusPill>{locale === "en" ? "One official attempt" : "1 lượt thi chính thức"}</StatusPill>
                {round1Window ? (
                  <StatusPill>
                    {formatDateRangeLabel(locale, round1Window.startDate, round1Window.endDate, round1Window.startTime, round1Window.endTime)}
                  </StatusPill>
                ) : null}
              </div>
            </div>

            <div className="grid gap-5 px-6 py-6 md:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(250px,0.82fr)]">
              <div className="space-y-4">
                {[
                  {
                    icon: <FileQuestion className="h-5 w-5 text-cyan-300" />,
                    title:
                      locale === "en"
                        ? "Objective block"
                        : "Khối trắc nghiệm",
                    body:
                      locale === "en"
                        ? `${ROUND1_OBJECTIVE_TOTAL} questions: ${ROUND1_OBJECTIVE_QUESTIONS_PER_TOPIC} per topic across ${ROUND1_TOPIC_COUNT} topics, with 2 easy, 2 medium, and 2 hard questions in each topic, plus 4 extra random questions from the full bank.`
                        : `${ROUND1_OBJECTIVE_TOTAL} câu: ${ROUND1_OBJECTIVE_QUESTIONS_PER_TOPIC} câu trên mỗi chủ đề trong ${ROUND1_TOPIC_COUNT} chủ đề, gồm 2 câu dễ, 2 câu trung bình, 2 câu khó, cộng thêm 4 câu ngẫu nhiên từ toàn bộ ngân hàng.`,
                  },
                  {
                    icon: <BookText className="h-5 w-5 text-emerald-300" />,
                    title:
                      locale === "en"
                        ? "Essay block"
                        : "Khối tự luận",
                    body:
                      locale === "en"
                        ? `${ROUND1_ESSAY_TOTAL} essay questions stay at the end of the paper. Each answer must be more than ${ROUND1_ESSAY_MIN_WORDS - 1} words, cannot exceed ${round1WordLimit} words, and is reviewed manually later.`
                        : `Gồm ${ROUND1_ESSAY_TOTAL} câu ở cuối đề, yêu cầu trình bày ý tưởng rõ ràng trong khoảng ${ROUND1_ESSAY_MIN_WORDS - 1}–${round1WordLimit} từ mỗi câu.`,
                  },
                  {
                    icon: <ShieldCheck className="h-5 w-5 text-amber-300" />,
                    title:
                      locale === "en"
                        ? "Attempt policy"
                        : "Quy định lượt thi",
                    body:
                      locale === "en"
                        ? "Once started, the timer keeps running. Refreshing the page does not pause the exam, and the same student cannot reset or re-do the attempt."
                        : "Khi đã bắt đầu, đồng hồ vẫn tiếp tục chạy. Tải lại trang không làm dừng bài thi và cùng một sinh viên không thể đặt lại hay làm lại lượt thi.",
                  },
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-4 rounded-[1.6rem] border theme-border theme-panel px-5 py-5">
                    <div className="theme-panel-strong rounded-[1.1rem] border theme-border p-3">
                      {item.icon}
                    </div>
                    <div className="min-w-0">
                      <p className="text-base font-semibold theme-text-strong">{item.title}</p>
                      <p className="mt-2 text-sm leading-7 theme-text-muted">{item.body}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-[1.8rem] border theme-border theme-panel-subtle px-5 py-5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] theme-text-soft">
                  {locale === "en" ? "Exam flow" : "Lưu ý"}
                </p>
                <div className="mt-5 space-y-4">
                  {[
                    {
                      step: "01",
                      title: locale === "en" ? "Enter with a locked team" : "Vào thi khi đội đã khóa",
                      body:
                        locale === "en"
                          ? "Only team members in a locked Round 1 roster can open the exam."
                          : "Chỉ thành viên thuộc đội đã khóa cho Vòng 1 mới có thể mở bài thi.",
                    },
                    {
                      step: "02",
                      title: locale === "en" ? "Navigate freely" : "Di chuyển tự do",
                      body:
                        locale === "en"
                          ? "Use arrows or the question-number panel to answer in any order."
                          : "Dùng mũi tên hoặc bảng số câu hỏi để làm bài theo bất kỳ thứ tự nào.",
                    },
                    {
                      step: "03",
                      title: locale === "en" ? "Submit once" : "Nộp một lần",
                      body:
                        locale === "en"
                          ? "Objective score is shown immediately, while essay score stays pending moderator review."
                          : "Điểm trắc nghiệm có ngay, còn điểm tự luận sẽ chờ giám khảo chấm.",
                    },
                  ].map((item) => (
                    <div key={item.step} className="flex gap-4">
                      <div className="theme-brand-gradient flex h-11 w-11 shrink-0 items-center justify-center rounded-[1rem] text-sm font-semibold text-white">
                        {item.step}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold theme-text-strong">{item.title}</p>
                        <p className="mt-1 text-sm leading-7 theme-text-muted">{item.body}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Surface>

          <Surface className="px-6 py-6 md:px-7 md:py-7">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] theme-text-soft">
              {locale === "en" ? "Ready to enter" : "Sẵn sàng vào thi"}
            </p>
            <div className="mt-5 rounded-[1.8rem] border theme-border theme-panel px-5 py-5">
              <p className="text-lg font-semibold theme-text-strong">{currentUser.name}</p>
              <p className="mt-2 text-sm theme-text-soft">
                {participantTeamRoleLabel} · {currentUser.university}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <StatusPill>{`#${currentTeam!.tag}`}</StatusPill>
                <StatusPill>{`${ROUND1_TOTAL_QUESTIONS} ${locale === "en" ? "questions" : "câu hỏi"}`}</StatusPill>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <div className="rounded-[1.45rem] border theme-border theme-panel-subtle px-4 py-4">
                <p className="text-xs uppercase tracking-[0.2em] theme-text-soft">
                  {locale === "en" ? "Objective scoring" : "Điểm trắc nghiệm"}
                </p>
                <p className="mt-3 text-2xl font-semibold theme-text-strong">
                  {ROUND1_OBJECTIVE_MAX_SCORE}
                </p>
                <p className="mt-2 text-sm leading-7 theme-text-muted">
                  {locale === "en"
                    ? `${ROUND1_OBJECTIVE_TOTAL} questions x 2 points`
                    : `${ROUND1_OBJECTIVE_TOTAL} câu x 2 điểm`}
                </p>
              </div>
              <div className="rounded-[1.45rem] border theme-border theme-panel-subtle px-4 py-4">
                <p className="text-xs uppercase tracking-[0.2em] theme-text-soft">
                  {locale === "en" ? "Essay scoring" : "Điểm tự luận"}
                </p>
                <p className="mt-3 text-2xl font-semibold theme-text-strong">
                  {ROUND1_ESSAY_MAX_SCORE}
                </p>
                <p className="mt-2 text-sm leading-7 theme-text-muted">
                  {locale === "en"
                    ? `${ROUND1_ESSAY_TOTAL} questions reviewed later`
                    : `${ROUND1_ESSAY_TOTAL} câu được chấm sau`}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setDialogError(null);
                setDialogMode("start");
              }}
              disabled={dialogPending}
              className="theme-button-primary mt-6 inline-flex w-full items-center justify-center gap-2 rounded-[1.5rem] px-5 py-3.5 text-sm font-semibold"
            >
              {dialogPending && dialogMode === "start" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              {locale === "en" ? "Start Round 1 exam" : "Bắt đầu bài thi Vòng 1"}
            </button>
            <p className="mt-4 text-sm leading-7 theme-text-muted">
              {locale === "en"
                ? "You have one official attempt only. If a technical problem appears after the exam starts, contact the organizer immediately."
                : "Bạn chỉ có một lượt thi chính thức. Nếu có sự cố kỹ thuật sau khi bài thi bắt đầu, hãy liên hệ ban tổ chức ngay."}
            </p>
            <div className="mt-4 rounded-[1.5rem] border theme-border theme-panel-subtle px-4 py-4 text-sm leading-7 theme-text-muted">
              {locale === "en"
                ? `Technical support: ${contactInfo.email} · ${contactInfo.phone}`
                : `Hỗ trợ kỹ thuật: ${contactInfo.email} hoặc hotline: ${contactInfo.phone}`}
            </div>
          </Surface>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            {
              icon: <FileQuestion className="h-5 w-5 text-cyan-300" />,
              label: locale === "en" ? "Objective bank" : "Ngân hàng trắc nghiệm",
              value: activeObjectiveBank!.questionPoolSize.toString(),
            },
            {
              icon: <BookText className="h-5 w-5 text-emerald-300" />,
              label: locale === "en" ? "Essay bank" : "Ngân hàng tự luận",
              value: activeEssayBank!.questionPoolSize.toString(),
            },
            {
              icon: <Target className="h-5 w-5 text-orange-300" />,
              label: locale === "en" ? "Total score" : "Tổng điểm",
              value: ROUND1_TOTAL_MAX_SCORE.toString(),
            },
            {
              icon: <Clock3 className="h-5 w-5 text-amber-300" />,
              label: locale === "en" ? "Time limit" : "Thời lượng",
              value: `${activeObjectiveBank!.durationMinutes}m`,
            },
          ].map((item) => (
            <Surface key={item.label} className="px-5 py-5">
              <div className="inline-flex rounded-2xl border theme-border-strong theme-panel-strong p-3">
                {item.icon}
              </div>
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.24em] text-sky-200/80">
                {item.label}
              </p>
              <p className="mt-4 text-4xl font-semibold theme-text-strong">{item.value}</p>
            </Surface>
          ))}
          </section>
        </div>

        <Round1ConfirmDialog
          locale={locale}
          mode="start"
          open={dialogMode === "start"}
          pending={dialogPending}
          error={dialogError}
          answeredCount={0}
          totalCount={ROUND1_TOTAL_QUESTIONS}
          unansweredCount={ROUND1_TOTAL_QUESTIONS}
          essayWarning={false}
          blockingWarning={round1StartWarning}
          onClose={() => {
            if (!dialogPending) {
              setDialogMode(null);
            }
          }}
          onConfirm={() => {
            void startExam();
          }}
        />
      </>
    );
  }

  return (
    <>
      {session && !existingSubmission ? (
        <>
          {captureWarning ? (
            <div className="pointer-events-none fixed bottom-5 right-5 z-[75] max-w-sm rounded-[1.4rem] border border-amber-700/24 bg-[linear-gradient(135deg,rgba(255,249,219,0.98),rgba(255,237,213,0.96))] px-4 py-3.5 text-sm leading-7 text-amber-950 shadow-[0_18px_44px_rgba(122,74,12,0.16)] dark:border-amber-300/22 dark:bg-[linear-gradient(135deg,rgba(120,53,15,0.42),rgba(113,63,18,0.34))] dark:text-amber-100">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-4.5 w-4.5 shrink-0" />
                <p>{captureWarning}</p>
              </div>
            </div>
          ) : null}
        </>
      ) : null}
      <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold theme-accent">
          <ArrowLeft className="h-4 w-4" />
          {locale === "en" ? "Back to Team Workspace" : "Quay lại Đội thi"}
        </Link>
        <div className="flex flex-wrap gap-2">
          <StatusPill>{`#${currentTeam!.tag}`}</StatusPill>
          <StatusPill>{`${answeredCount}/${session.questions.length} ${locale === "en" ? "answered" : "đã trả lời"}`}</StatusPill>
          <StatusPill tone={currentQuestion?.type === "essay" ? "warning" : "default"}>
            {currentQuestion?.type === "essay"
              ? locale === "en"
                ? "Essay section"
                : "Phần tự luận"
              : locale === "en"
                ? "Objective section"
                : "Phần trắc nghiệm"}
          </StatusPill>
        </div>
      </div>

      {pageError ? (
        <div className="rounded-[1.5rem] border border-amber-700/22 bg-[linear-gradient(135deg,rgba(255,251,235,0.98),rgba(254,243,199,0.94))] px-5 py-4 text-sm leading-7 text-amber-950 dark:border-amber-300/22 dark:bg-amber-300/12 dark:text-amber-100">
          {pageError}
        </div>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Surface className="px-6 py-6 md:px-8 md:py-8">
          <div className="border-b theme-border pb-6">
            <p className="theme-eyebrow text-xs font-semibold uppercase tracking-[0.32em]">
              {locale === "en" ? "Round 1 in progress" : "Đang thi Vòng 1"}
            </p>
            <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="theme-heading text-3xl font-semibold theme-text-strong md:text-[2.9rem]">
                  {locale === "en"
                    ? `Question ${session.currentQuestionIndex + 1} of ${session.questions.length}`
                    : `Câu ${session.currentQuestionIndex + 1} / ${session.questions.length}`}
                </h1>
                <p className="mt-4 max-w-3xl text-sm leading-7 theme-text-muted">
                  {locale === "en"
                    ? "One question appears at a time. Use the arrows or the question-number navigator to jump anywhere in the paper. Objective questions are shuffled, while the 2 essay questions stay at the end."
                    : "Mỗi lần chỉ hiển thị 1 câu hỏi. Hãy dùng mũi tên hoặc bảng số câu hỏi để nhảy đến bất kỳ vị trí nào trong đề. Phần trắc nghiệm được đảo ngẫu nhiên, còn 2 câu tự luận luôn nằm ở cuối đề."}
                </p>
              </div>
              <div className="rounded-[1.5rem] border theme-border theme-panel-subtle px-4 py-4">
                <p className="text-xs uppercase tracking-[0.22em] theme-text-soft">
                  {locale === "en" ? "Completion" : "Tiến độ"}
                </p>
                <p className="mt-3 text-3xl font-semibold theme-text-strong">{completionPercent}%</p>
              </div>
            </div>
            <div className="mt-6">
              <div className="h-2.5 overflow-hidden rounded-full bg-[rgba(23,114,208,0.08)]">
                <div
                  className="theme-brand-gradient h-full rounded-full transition-[width] duration-300"
                  style={{ width: `${completionPercent}%` }}
                />
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs uppercase tracking-[0.2em] theme-text-soft">
                <span>{locale === "en" ? "Objective block" : "Khối trắc nghiệm"} · {objectiveAnsweredCount}/{ROUND1_OBJECTIVE_TOTAL}</span>
                <span>{locale === "en" ? "Essay block" : "Khối tự luận"} · {essayAnsweredCount}/{ROUND1_ESSAY_TOTAL}</span>
              </div>
            </div>
          </div>

	              {currentQuestion ? (
	            <div className="pt-6">
	              <div className="flex flex-wrap items-center gap-3">
	                <StatusPill>{pickRound1TypeLabel(locale, currentQuestion.type)}</StatusPill>
	                <StatusPill tone={currentQuestion.type === "essay" ? "warning" : "success"}>
	                  {locale === "en"
                    ? `${currentQuestionPointValue} points`
                    : `${currentQuestionPointValue} điểm`}
                </StatusPill>
              </div>

	              <p className="mt-6 text-2xl font-semibold leading-10 theme-text-strong">
	                {pickRound1QuestionText(currentQuestion.prompt)}
	              </p>

	              {currentQuestion.type === "essay" ? (
	                <div className="mt-5 rounded-[1.35rem] border border-sky-700/18 bg-[linear-gradient(135deg,rgba(224,242,254,0.9),rgba(219,234,254,0.72))] px-4 py-3.5 text-sm leading-7 text-slate-900 shadow-[0_14px_34px_rgba(14,116,144,0.08)] dark:border-sky-300/18 dark:bg-[linear-gradient(135deg,rgba(56,189,248,0.16),rgba(37,99,235,0.12))] dark:text-sky-100">
	                  {locale === "en"
	                    ? `The essay answer must be more than ${ROUND1_ESSAY_MIN_WORDS - 1} words and no more than ${round1WordLimit} words.`
	                    : `Câu trả lời tự luận cần dài hơn ${ROUND1_ESSAY_MIN_WORDS - 1} từ và không vượt quá ${round1WordLimit} từ.`}
	                </div>
	              ) : null}

	              {(currentQuestion.type === "true-false" || currentQuestion.type === "single-choice") &&
	              currentQuestion.options ? (
                <div className="mt-8 space-y-3">
                  {currentQuestion.options.map((option) => {
                    const isSelected = currentResponse?.selectedOptionIds?.[0] === option.id;

                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() =>
                          setSession((current) =>
                            current
                              ? {
                                  ...current,
                                  answers: {
                                    ...current.answers,
                                    [currentQuestion.id]: {
                                      selectedOptionIds: [option.id],
                                    },
                                  },
                                }
                              : current,
                          )
                        }
                        className={`w-full rounded-[1.5rem] border px-5 py-4 text-left transition ${
                          isSelected
                            ? "border-[rgba(23,114,208,0.45)] bg-[rgba(23,114,208,0.12)]"
                            : "theme-border theme-panel hover:bg-[rgba(23,114,208,0.05)]"
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div className="theme-panel-strong flex h-9 w-9 shrink-0 items-center justify-center rounded-full border theme-border text-sm font-semibold theme-text-strong">
                            {option.displayLabel}
                          </div>
                          <p className="text-lg leading-8 theme-text-body">
                            {pickRound1QuestionText(option.text)}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : null}

              {currentQuestion.type === "multiple-choice" && currentQuestion.options ? (
                <div className="mt-8 space-y-3">
                  <p className="text-sm leading-7 theme-text-soft">
                    {locale === "en"
                      ? "Select all answers you believe are correct."
                      : "Hãy chọn tất cả đáp án bạn cho là đúng."}
                  </p>
                  {currentQuestion.options.map((option) => {
                    const selectedOptionIds = currentResponse?.selectedOptionIds ?? [];
                    const isSelected = selectedOptionIds.includes(option.id);

                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() =>
                          setSession((current) => {
                            if (!current) {
                              return current;
                            }

                            const currentSelected = current.answers[currentQuestion.id]?.selectedOptionIds ?? [];
                            const nextSelected = currentSelected.includes(option.id)
                              ? currentSelected.filter((optionId) => optionId !== option.id)
                              : [...currentSelected, option.id];

                            return {
                              ...current,
                              answers: {
                                ...current.answers,
                                [currentQuestion.id]: {
                                  selectedOptionIds: nextSelected,
                                },
                              },
                            };
                          })
                        }
                        className={`w-full rounded-[1.5rem] border px-5 py-4 text-left transition ${
                          isSelected
                            ? "border-[rgba(23,114,208,0.45)] bg-[rgba(23,114,208,0.12)]"
                            : "theme-border theme-panel hover:bg-[rgba(23,114,208,0.05)]"
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div className="theme-panel-strong flex h-9 w-9 shrink-0 items-center justify-center rounded-full border theme-border text-sm font-semibold theme-text-strong">
                            {option.displayLabel}
                          </div>
                          <div className="min-w-0">
                            <p className="text-lg leading-8 theme-text-body">
                              {pickRound1QuestionText(option.text)}
                            </p>
                            {isSelected ? (
                              <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">
                                {locale === "en" ? "Selected" : "Đã chọn"}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : null}

              {currentQuestion.type === "pairing" &&
              currentQuestion.options &&
              currentQuestion.pairingItems ? (
                <div className="mt-8 space-y-4">
                  <p className="text-sm leading-7 theme-text-soft">
                    {locale === "en"
                      ? "Match each item on the left with the most suitable item on the right."
                      : "Hãy nối mỗi mục bên trái với mục phù hợp nhất ở bên phải."}
                  </p>
                  {currentQuestion.pairingItems.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-[1.5rem] border theme-border theme-panel px-5 py-5"
                    >
                      <div className="flex items-start gap-4">
                        <div className="theme-panel-strong flex h-9 w-9 shrink-0 items-center justify-center rounded-full border theme-border text-sm font-semibold theme-text-strong">
                          {item.displayLabel}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[0.95rem] leading-7 theme-text-body">
                            {pickRound1QuestionText(item.prompt)}
                          </p>
                          <label className="mt-4 block space-y-2">
                            <span className="text-xs uppercase tracking-[0.18em] theme-text-soft">
                              {locale === "en" ? "Select a match" : "Chọn cặp phù hợp"}
                            </span>
                            <select
                              value={currentResponse?.pairingMatches?.[item.id] ?? ""}
                              onChange={(event) =>
                                setSession((current) =>
                                  current
                                    ? {
                                        ...current,
                                        answers: {
                                          ...current.answers,
                                          [currentQuestion.id]: {
                                            pairingMatches: {
                                              ...(current.answers[currentQuestion.id]?.pairingMatches ?? {}),
                                              [item.id]: event.target.value,
                                            },
                                          },
                                        },
                                      }
                                    : current,
                                )
                              }
                              className="theme-admin-select theme-placeholder w-full rounded-2xl border theme-border theme-panel px-4 py-3 text-sm theme-text-strong outline-none"
                            >
                              <option value="">
                                {locale === "en" ? "Choose one option" : "Chọn một lựa chọn"}
                              </option>
                              {(currentQuestion.options ?? []).map((option) => (
                                <option key={option.id} value={option.id}>
                                  {`${option.displayLabel}. ${pickRound1QuestionText(option.text)}`}
                                </option>
                              ))}
                            </select>
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}

	              {currentQuestion.type === "essay" ? (
	                <div className="mt-8 space-y-4">
	                  <textarea
	                    data-round1-essay-answer="true"
                    rows={8}
                    value={currentResponse?.essayText ?? ""}
                    placeholder={pickRound1QuestionText(
                      currentQuestion.placeholder ?? { en: "", vi: "" },
                    )}
                    onChange={(event) => {
                      const typedValue = event.target.value;
                      const limitedValue =
                        countWords(typedValue) > round1WordLimit
                          ? limitEssayToWordCount(typedValue, round1WordLimit)
                          : typedValue;

                      if (limitedValue !== typedValue) {
                        showEssayWordLimitWarning();
                      }

                      setSession((current) =>
                        current
                          ? {
                              ...current,
                              answers: {
                                ...current.answers,
                                [currentQuestion.id]: {
                                  essayText: limitedValue,
                                },
                              },
                            }
                          : current,
                      );
                    }}
                    onBeforeInput={handleEssayBeforeInput}
                    onPaste={(event) => {
                      event.preventDefault();
                      showEssayPasteWarning();
                    }}
                    onDrop={(event) => {
                      event.preventDefault();
                      showEssayPasteWarning();
                    }}
                    className="theme-placeholder w-full rounded-[1.5rem] border theme-border theme-panel px-5 py-4 text-sm leading-7 theme-text-strong outline-none"
                  />
                  {essayPasteWarning ? (
                    <div className="rounded-[1.35rem] border border-amber-700/24 bg-[linear-gradient(135deg,rgba(255,249,219,0.96),rgba(255,237,213,0.92))] px-4 py-3.5 text-sm leading-7 text-amber-950 dark:border-amber-300/22 dark:bg-amber-300/12 dark:text-amber-100">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="mt-0.5 h-4.5 w-4.5 shrink-0" />
                        <p className="font-medium">{essayPasteWarning}</p>
                      </div>
                    </div>
                  ) : null}
                  {essayWordLimitWarning ? (
                    <div className="rounded-[1.35rem] border border-amber-700/24 bg-[linear-gradient(135deg,rgba(255,249,219,0.96),rgba(255,237,213,0.92))] px-4 py-3.5 text-sm leading-7 text-amber-950 dark:border-amber-300/22 dark:bg-amber-300/12 dark:text-amber-100">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="mt-0.5 h-4.5 w-4.5 shrink-0" />
                        <p className="font-medium">{essayWordLimitWarning}</p>
                      </div>
                    </div>
                  ) : null}
                  <div className="flex flex-col gap-3 text-sm leading-7 sm:flex-row sm:items-center sm:justify-between">
                    <p
                      className={
                        currentEssayMeetsMinimum
                          ? "theme-text-soft"
                          : "font-medium text-amber-800 dark:text-amber-100"
                      }
                    >
                      {currentEssayMeetsMinimum
                        ? locale === "en"
                          ? "Minimum length met for this essay answer."
                          : "Câu trả lời đã đạt yêu cầu độ dài tối thiểu."
                        : locale === "en"
                          ? `Write more than ${ROUND1_ESSAY_MIN_WORDS - 1} words before submitting.`
                          : `Hãy viết dài hơn ${ROUND1_ESSAY_MIN_WORDS - 1} từ trước khi nộp.`}
                    </p>
                    <div
                      className={`inline-flex items-center justify-end gap-2 self-end rounded-full border px-3.5 py-2 text-xs font-semibold shadow-[0_10px_24px_rgba(15,23,42,0.06)] ${
                        currentEssayRemainingWords === 0 || currentEssayExceedsLimit
                          ? "border-amber-500/28 bg-amber-500/12 text-amber-900 dark:border-amber-300/22 dark:bg-amber-300/12 dark:text-amber-100"
                          : "border-sky-500/20 bg-white/76 text-slate-800 dark:border-sky-300/18 dark:bg-white/8 dark:text-sky-100"
                      }`}
                    >
                      <span>
                        {locale === "en"
                          ? `${currentEssayRemainingWords} words remaining`
                          : `Còn ${currentEssayRemainingWords} từ`}
                      </span>
                      <span className="opacity-70">
                        {`${Math.min(currentEssayWordCount, round1WordLimit)}/${round1WordLimit}`}
                      </span>
                    </div>
                  </div>
                  {currentEssayAiGuard.shouldWarn ? (
                    <div className="rounded-[1.35rem] border border-amber-700/24 bg-[linear-gradient(135deg,rgba(255,249,219,0.96),rgba(255,237,213,0.92))] px-4 py-3.5 text-sm leading-7 text-amber-950 dark:border-amber-300/22 dark:bg-amber-300/12 dark:text-amber-100">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="mt-0.5 h-4.5 w-4.5 shrink-0" />
                        <div className="space-y-1.5">
                          <p className="font-semibold">
                            {locale === "en"
                              ? `AI-like wording warning (${currentEssayAiGuard.score}%)`
                              : `Cảnh báo nội dung giống AI (${currentEssayAiGuard.score}%)`}
                          </p>
                          <p>
                            {locale === "en"
                              ? "This answer currently looks more than 50% AI-like based on phrasing patterns. Please revise it into your own wording before you continue."
                              : "Câu trả lời này hiện có mức biểu hiện giống nội dung AI trên 50% theo mẫu diễn đạt. Hãy chỉnh lại bằng cách viết và lập luận của chính bạn trước khi tiếp tục."}
                          </p>
                          {currentEssayAiGuard.reasons.length > 0 ? (
                            <p className="text-xs font-medium opacity-85">
                              {locale === "en" ? "Signals detected:" : "Dấu hiệu được phát hiện:"}{" "}
                              {currentEssayAiGuard.reasons.join(locale === "en" ? "; " : "; ")}.
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-between">
                <button
                  type="button"
                  disabled={session.currentQuestionIndex === 0}
                  onClick={() => navigateToQuestion(session.currentQuestionIndex - 1)}
                  className="rounded-full border theme-border theme-panel px-5 py-3 text-sm font-semibold theme-text-strong disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {locale === "en" ? "Previous question" : "Câu trước"}
                </button>
                <button
                  type="button"
                  onClick={() => navigateToQuestion(session.currentQuestionIndex + 1)}
                  className="theme-button-primary inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
                >
                  {session.currentQuestionIndex === session.questions.length - 1
                    ? locale === "en"
                      ? "Review navigator"
                      : "Xem bảng điều hướng"
                    : locale === "en"
                      ? "Next question"
                      : "Câu tiếp"}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : null}
        </Surface>

        <div className="space-y-4 xl:sticky xl:top-28 xl:self-start">
          <Surface className="overflow-hidden px-6 py-6">
            <div
              className={`rounded-[1.8rem] border px-5 py-5 ${
                theme === "dark"
                  ? remainingSeconds <= 300
                    ? "border-amber-300/18 bg-[linear-gradient(135deg,rgba(245,158,11,0.24),rgba(148,64,0,0.18))]"
                    : "border-sky-300/18 bg-[linear-gradient(135deg,rgba(23,114,208,0.22),rgba(8,47,73,0.2))]"
                  : remainingSeconds <= 300
                    ? "border-amber-700/16 bg-[linear-gradient(135deg,rgba(255,251,235,0.98),rgba(254,243,199,0.96),rgba(251,191,36,0.22))]"
                    : "border-sky-700/14 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(224,242,254,0.96),rgba(191,219,254,0.86))]"
              }`}
            >
              <p className={`text-xs font-semibold uppercase tracking-[0.28em] ${
                theme === "dark" ? "text-white/72" : "text-slate-700"
              }`}>
                {locale === "en" ? "Time left" : "Thời gian còn lại"}
              </p>
              <p className={`mt-4 font-mono text-5xl font-semibold tracking-[0.14em] ${
                theme === "dark" ? "text-white" : "text-slate-950"
              }`}>
                {formatRemainingTime(remainingSeconds)}
              </p>
              <p className={`mt-4 text-sm leading-7 ${
                theme === "dark" ? "text-white/74" : "text-slate-700"
              }`}>
                {locale === "en"
                  ? "The timer continues even if you refresh or navigate away. The attempt cannot be paused or restarted."
                  : "Đồng hồ vẫn tiếp tục chạy ngay cả khi bạn tải lại trang hoặc rời khỏi đây. Lượt thi không thể tạm dừng hoặc bắt đầu lại."}
              </p>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <div className="rounded-[1.4rem] border theme-border theme-panel-subtle px-4 py-4">
                <p className="text-xs uppercase tracking-[0.22em] theme-text-soft">
                  {locale === "en" ? "Candidate" : "Thí sinh"}
                </p>
                <p className="mt-3 text-base font-semibold theme-text-strong">{currentUser.name}</p>
                <p className="mt-2 text-sm theme-text-muted">{participantTeamRoleLabel}</p>
              </div>
              <div className="rounded-[1.4rem] border theme-border theme-panel-subtle px-4 py-4">
                <p className="text-xs uppercase tracking-[0.22em] theme-text-soft">
                  {locale === "en" ? "Scoring model" : "Cách tính điểm"}
                </p>
                <p className="mt-3 text-sm leading-7 theme-text-muted">
                  {locale === "en"
                    ? `${ROUND1_OBJECTIVE_TOTAL} objective questions x 2 points, plus ${ROUND1_ESSAY_TOTAL} essay questions x ${Math.round(ROUND1_ESSAY_MAX_SCORE / ROUND1_ESSAY_TOTAL)} points reviewed later.`
                    : `${ROUND1_OBJECTIVE_TOTAL} câu trắc nghiệm x 2 điểm, cộng với ${ROUND1_ESSAY_TOTAL} câu tự luận x ${Math.round(ROUND1_ESSAY_MAX_SCORE / ROUND1_ESSAY_TOTAL)} điểm được chấm sau.`}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setDialogError(null);
                setDialogMode("submit");
              }}
              disabled={dialogPending}
              className="theme-button-primary mt-5 inline-flex w-full items-center justify-center gap-2 rounded-[1.5rem] px-5 py-3.5 text-sm font-semibold"
            >
              {dialogPending && dialogMode === "submit" ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <ShieldCheck className="h-4 w-4" />
              )}
              {locale === "en" ? "Submit exam" : "Nộp bài thi"}
            </button>
            <p className="mt-4 text-sm leading-7 theme-text-muted">
              {locale === "en"
                ? `If anything goes wrong, contact the organizer immediately at ${contactInfo.email} or ${contactInfo.phone}.`
                : `Nếu có sự cố, hãy liên hệ ban tổ chức ngay qua ${contactInfo.email} hoặc ${contactInfo.phone}.`}
            </p>
          </Surface>

          <Surface className="px-6 py-6">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] theme-text-soft">
                {locale === "en" ? "Question navigator" : "Bảng điều hướng câu hỏi"}
              </p>
              <StatusPill>{answeredCount}</StatusPill>
            </div>
            <div className="mt-5 grid grid-cols-5 gap-2">
              {session.questions.map((question, index) => {
                const isCurrent = index === session.currentQuestionIndex;
                const isAnswered = isRound1QuestionAnswered(question, session.answers[question.id]);

                return (
                  <button
                    key={question.id}
                    type="button"
                    onClick={() => navigateToQuestion(index)}
                    className={`rounded-2xl border px-3 py-3 text-sm font-semibold transition ${
                      isCurrent
                        ? "border-[rgba(23,114,208,0.42)] bg-[rgba(23,114,208,0.14)] theme-text-strong"
                        : isAnswered
                          ? "border-emerald-300/24 bg-emerald-300/10 text-slate-950 dark:text-emerald-100"
                          : "theme-border theme-panel theme-text-soft hover:bg-[rgba(23,114,208,0.05)]"
                    }`}
                  >
                    <span className="block">{index + 1}</span>
                    {index >= ROUND1_OBJECTIVE_TOTAL ? (
                      <span className="mt-1 block text-[0.62rem] uppercase tracking-[0.18em] theme-text-faint">
                        {locale === "en" ? "Essay" : "TL"}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-3 text-xs">
              <p className="inline-flex items-center gap-3 text-slate-600 dark:text-slate-300">
                <span className="h-2.5 w-2.5 rounded-full bg-[rgba(23,114,208,0.65)]" />
                {locale === "en" ? "Current question" : "Câu hiện tại"}
              </p>
              <p className="inline-flex items-center gap-3 text-slate-700 dark:text-emerald-100">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 dark:bg-emerald-300" />
                {locale === "en" ? "Answered" : "Đã trả lời"}
              </p>
              <p className="inline-flex items-center gap-3 text-slate-600 dark:text-slate-300">
                <span className="h-2.5 w-2.5 rounded-full bg-slate-300 dark:bg-white/30" />
                {locale === "en" ? "Not answered yet" : "Chưa trả lời"}
              </p>
            </div>
            {remainingSeconds <= 300 ? (
              <div className="mt-5 rounded-[1.4rem] border border-amber-300/24 bg-amber-300/10 px-4 py-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-700 dark:text-amber-200" />
                  <p className="text-sm leading-6 text-slate-950 dark:text-amber-50">
                    {locale === "en"
                      ? "Less than 5 minutes remain. Unanswered questions will be counted as incorrect when the exam auto-submits."
                      : "Còn dưới 5 phút. Các câu chưa trả lời sẽ bị tính là sai khi bài thi tự động nộp."}
                  </p>
                </div>
              </div>
            ) : null}
          </Surface>
        </div>
      </section>
      </div>

      <Round1ConfirmDialog
        locale={locale}
        mode="submit"
        open={dialogMode === "submit"}
        pending={dialogPending}
        error={dialogError}
        answeredCount={answeredCount}
        totalCount={session.questions.length}
        unansweredCount={session.questions.length - answeredCount}
        essayWarning={Boolean(
          session.questions
            .slice(ROUND1_OBJECTIVE_TOTAL)
            .some((question) => {
              const wordCount = countWords(session.answers[question.id]?.essayText ?? "");
              return wordCount < ROUND1_ESSAY_MIN_WORDS || wordCount > round1WordLimit;
            }),
        )}
        blockingWarning={null}
        onClose={() => {
          if (!dialogPending) {
            setDialogMode(null);
          }
        }}
        onConfirm={() => {
          void handleConfirmSubmit();
        }}
      />
    </>
  );
}
