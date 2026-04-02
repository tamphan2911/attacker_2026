"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BookText,
  CheckCircle2,
  Clock3,
  FileQuestion,
  Play,
  ShieldCheck,
  Target,
} from "lucide-react";

import { useSiteState } from "@/components/providers/site-state-provider";
import { SectionHeading, StatusPill, Surface } from "@/components/site-ui";
import { TEAM_MIN_MEMBERS, contactInfo } from "@/data/site-content";
import {
  canTeamTakeRound1,
  getCompetitionRoundWindow,
  getTeamCompetitionState,
  isTeamRound1Locked,
  isRoundFinished,
  pickCompetitionStateLabel,
} from "@/lib/competition";
import {
  ROUND1_ESSAY_TOTAL,
  ROUND1_ESSAY_MAX_SCORE,
  ROUND1_ESSAY_WORD_LIMIT,
  ROUND1_OBJECTIVE_MAX_SCORE,
  ROUND1_OBJECTIVE_QUESTIONS_PER_TOPIC,
  ROUND1_OBJECTIVE_TOTAL,
  ROUND1_TOTAL_QUESTIONS,
  ROUND1_TOTAL_MAX_SCORE,
  ROUND1_TOPIC_COUNT,
  countWords,
  createRound1ExamPaper,
  getActiveRound1Bank,
  getRound1ObjectiveScore,
  isRound1QuestionAnswered,
  limitEssayToWordCount,
  pickRound1TypeLabel,
  scoreRound1Question,
  type Round1PaperQuestion,
  type Round1QuestionResponse,
} from "@/lib/round1";
import { formatDateRangeLabel, pickText } from "@/lib/site";

interface Round1ExamSession {
  bankId: string;
  startedAt: string;
  deadlineAt: string;
  currentQuestionIndex: number;
  answers: Record<string, Round1QuestionResponse>;
  questions: Round1PaperQuestion[];
}

const SESSION_STORAGE_PREFIX = "attacker-2026-round1-exam-session-v3";

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

export function Round1ExamPage() {
  const {
    authStatus,
    isAuthenticated,
    locale,
    currentUser,
    currentTeam,
    round1TestBanks,
    round1Submissions,
    hasHydrated,
    submitRound1Attempt,
  } = useSiteState();
  const [session, setSession] = useState<Round1ExamSession | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const router = useRouter();

  const activeObjectiveBank = getActiveRound1Bank(round1TestBanks, "objective");
  const activeEssayBank = getActiveRound1Bank(round1TestBanks, "essay");
  const round1WordLimit = activeEssayBank?.wordLimit ?? ROUND1_ESSAY_WORD_LIMIT;
  const existingSubmission = getLatestSubmissionForUser(round1Submissions, currentUser.id);
  const isStudent = currentUser.role === "student";
  const currentCompetitionState = currentTeam ? getTeamCompetitionState(currentTeam) : undefined;
  const round1Window = getCompetitionRoundWindow("round-1");
  const round1Finished = isRoundFinished("round-1");
  const teamRound1Locked = Boolean(currentTeam && isTeamRound1Locked(currentTeam));
  const isEligibleForRound1 = Boolean(isStudent && currentTeam && canTeamTakeRound1(currentTeam));
  const sessionStorageKey = `${SESSION_STORAGE_PREFIX}:${currentUser.id}`;

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    if (existingSubmission) {
      window.localStorage.removeItem(sessionStorageKey);
      return;
    }

    let timeoutId: number | undefined;

    try {
      const raw = window.localStorage.getItem(sessionStorageKey);
      const nextSession = raw ? (JSON.parse(raw) as Round1ExamSession) : null;

      timeoutId = window.setTimeout(() => {
        setSession(nextSession);
      }, 0);
    } catch {
      window.localStorage.removeItem(sessionStorageKey);
      timeoutId = window.setTimeout(() => {
        setSession(null);
      }, 0);
    }

    return () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [existingSubmission, hasHydrated, sessionStorageKey]);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    if (!session) {
      window.localStorage.removeItem(sessionStorageKey);
      return;
    }

    window.localStorage.setItem(sessionStorageKey, JSON.stringify(session));
  }, [hasHydrated, session, sessionStorageKey]);

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

  const finalizeExam = useCallback(
    (targetSession: Round1ExamSession) => {
      const targetObjectiveBank = round1TestBanks.find((bank) => bank.id === targetSession.bankId);
      if (!targetObjectiveBank) {
        return;
      }

      const scoreSummary = targetSession.questions.reduce(
        (result, question) => {
          const questionScore = scoreRound1Question(question, targetSession.answers[question.id]);

          if (!questionScore.autoScored) {
            return result;
          }

          return {
            autoScoredCount: result.autoScoredCount + 1,
            rightCount: result.rightCount + (questionScore.isCorrect ? 1 : 0),
          };
        },
        { autoScoredCount: 0, rightCount: 0 },
      );
      const rightCount = scoreSummary.rightCount;
      const wrongCount = scoreSummary.autoScoredCount - rightCount;
      const elapsedMinutes = Math.max(
        1,
        Math.ceil((Date.now() - new Date(targetSession.startedAt).getTime()) / 60000),
      );

      const objectiveScore = getRound1ObjectiveScore(rightCount);
      submitRound1Attempt({
        bankId: targetSession.bankId,
        rightCount,
        wrongCount,
        objectiveScore,
        durationMinutes: Math.min(targetObjectiveBank.durationMinutes, elapsedMinutes),
      });

      setSession(null);
      window.localStorage.removeItem(sessionStorageKey);
      router.push("/dashboard#round1-result");
    },
    [round1TestBanks, router, sessionStorageKey, submitRound1Attempt],
  );

  const remainingSeconds = session
    ? Math.max(0, Math.ceil((new Date(session.deadlineAt).getTime() - nowMs) / 1000))
    : 0;

  useEffect(() => {
    if (!session || existingSubmission || remainingSeconds > 0) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      finalizeExam(session);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [existingSubmission, finalizeExam, remainingSeconds, session]);

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

  if (!activeObjectiveBank || !activeEssayBank) {
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
              : "Hãy yêu cầu ban tổ chức kích hoạt cả ngân hàng khách quan và ngân hàng tự luận trước khi mở bài thi."
          }
        />
      </Surface>
    );
  }

  const startExam = () => {
    const startedAt = new Date();
    const deadlineAt = new Date(startedAt.getTime() + activeObjectiveBank.durationMinutes * 60 * 1000);

    setSession({
      bankId: activeObjectiveBank.id,
      startedAt: startedAt.toISOString(),
      deadlineAt: deadlineAt.toISOString(),
      currentQuestionIndex: 0,
      answers: {},
      questions: createRound1ExamPaper({
        objectiveBank: activeObjectiveBank,
        essayBank: activeEssayBank,
      }),
    });
    setNowMs(startedAt.getTime());
  };

  const currentQuestion = session?.questions[session.currentQuestionIndex];
  const currentResponse = currentQuestion ? session?.answers[currentQuestion.id] : undefined;
  const answeredCount = session
    ? session.questions.filter((question) => isRound1QuestionAnswered(question, session.answers[question.id])).length
    : 0;
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
          {locale === "en" ? "Back to Team Workspace" : "Quay lại Không gian đội"}
        </Link>

        <Surface className="px-6 py-6 md:px-8 md:py-8">
          <SectionHeading
            eyebrow={locale === "en" ? "Round 1 submitted" : "Đã nộp Vòng 1"}
            title={
              locale === "en"
                ? "This attempt is locked. View the result in Team Workspace."
                : "Bài làm này đã được khóa. Hãy xem kết quả trong Không gian đội."
            }
            description={
              locale === "en"
                ? "Objective score is available immediately. Essay score remains pending until admin or moderator review finishes."
                : "Điểm phần khách quan có ngay. Điểm tự luận vẫn ở trạng thái chờ cho tới khi admin hoặc moderator chấm xong."
            }
          />
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-[1.5rem] border theme-border theme-panel-subtle px-4 py-4">
              <p className="text-xs uppercase tracking-[0.22em] theme-text-soft">
                {locale === "en" ? "Objective score" : "Điểm khách quan"}
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
              {locale === "en" ? "Open Round 1 result in Team Workspace" : "Mở kết quả Vòng 1 trong Không gian đội"}
            </Link>
            <Link href="/dashboard" className="rounded-full border theme-border theme-panel px-5 py-3 text-sm font-semibold theme-text-strong">
              {locale === "en" ? "Back to Team Workspace" : "Quay lại Không gian đội"}
            </Link>
          </div>
        </Surface>
      </div>
    );
  }

  if (!isStudent) {
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
            {locale === "en" ? "Open Team Workspace" : "Mở Không gian đội"}
          </Link>
          <Link href="/admin/round-1" className="rounded-full border theme-border theme-panel px-5 py-3 text-sm font-semibold theme-text-strong">
            {locale === "en" ? "Open Round 1 admin" : "Mở admin Vòng 1"}
          </Link>
        </div>
      </Surface>
    );
  }

  if (!currentTeam) {
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
          {locale === "en" ? "Go to Team Workspace" : "Đến Không gian đội"}
        </Link>
      </Surface>
    );
  }

  if (!isEligibleForRound1) {
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
                : `Doi nay hien dang o trang thai ${pickCompetitionStateLabel(locale, currentCompetitionState)}, vi vay bai thi moi cua Vong 1 da dong.`
            }
          />
          <div className="mt-6 flex flex-wrap gap-3">
            <StatusPill tone="success">{pickCompetitionStateLabel(locale, currentCompetitionState)}</StatusPill>
            <Link href="/dashboard" className="rounded-full border theme-border theme-panel px-5 py-3 text-sm font-semibold theme-text-strong">
              {locale === "en" ? "Back to Team Workspace" : "Quay lại Không gian đội"}
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
                {formatDateRangeLabel(locale, round1Window.startDate, round1Window.endDate)}
              </StatusPill>
            ) : null}
            <Link href="/dashboard" className="rounded-full border theme-border theme-panel px-5 py-3 text-sm font-semibold theme-text-strong">
              {locale === "en" ? "Back to Team Workspace" : "Quay lại Không gian đội"}
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
              : `Vong 1 chi mo cho cac doi co it nhat ${TEAM_MIN_MEMBERS} thanh vien.`
          }
        />
        <div className="mt-6 flex flex-wrap gap-3">
          <StatusPill tone="warning">
            {locale === "en"
              ? `${currentTeam.memberIds.length}/${TEAM_MIN_MEMBERS} required members`
              : `${currentTeam.memberIds.length}/${TEAM_MIN_MEMBERS} thanh vien bat buoc`}
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
      <div className="space-y-8">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold theme-accent">
          <ArrowLeft className="h-4 w-4" />
          {locale === "en" ? "Back to Team Workspace" : "Quay lại Không gian đội"}
        </Link>

        <SectionHeading
          eyebrow="Round 1"
          title={
            locale === "en"
              ? "Individual Round 1 exam with structured randomized delivery."
              : "Bài thi cá nhân Vòng 1 với cơ chế random theo cấu trúc."
          }
          description={
            locale === "en"
              ? "Each student gets 36 objective questions generated from 6 topics and 2 essay questions at the end. The timer runs for 60 minutes, the attempt cannot be paused, and the same account cannot re-do the exam."
              : "Mỗi thí sinh nhận 36 câu khách quan được tạo từ 6 chủ đề và 2 câu tự luận ở cuối đề. Đồng hồ chạy trong 60 phút, bài thi không thể tạm dừng và cùng một tài khoản không thể làm lại."
          }
        />

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            {
              icon: <FileQuestion className="h-5 w-5 text-cyan-300" />,
              label: locale === "en" ? "Objective bank" : "Bank khách quan",
              value: activeObjectiveBank.questionPoolSize.toString(),
            },
            {
              icon: <BookText className="h-5 w-5 text-emerald-300" />,
              label: locale === "en" ? "Essay bank" : "Bank tự luận",
              value: activeEssayBank.questionPoolSize.toString(),
            },
            {
              icon: <Target className="h-5 w-5 text-orange-300" />,
              label: locale === "en" ? "Paper structure" : "Cấu trúc đề",
              value: `${ROUND1_OBJECTIVE_TOTAL} + ${ROUND1_ESSAY_TOTAL}`,
            },
            {
              icon: <Clock3 className="h-5 w-5 text-amber-300" />,
              label: locale === "en" ? "Time limit" : "Giới hạn thời gian",
              value: `${activeObjectiveBank.durationMinutes}m`,
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

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <Surface className="px-6 py-6 md:px-8 md:py-8">
            <p className="theme-heading text-2xl font-semibold theme-text-strong">
              {locale === "en" ? "Before you start" : "Truoc khi bat dau"}
            </p>
            <div className="mt-6 space-y-4">
              {[
                locale === "en"
                  ? `The paper contains ${ROUND1_OBJECTIVE_TOTAL} objective questions: ${ROUND1_OBJECTIVE_QUESTIONS_PER_TOPIC} questions from each of ${ROUND1_TOPIC_COUNT} topics.`
                  : `Đề thi gồm ${ROUND1_OBJECTIVE_TOTAL} câu khách quan: ${ROUND1_OBJECTIVE_QUESTIONS_PER_TOPIC} câu trên mỗi chủ đề trong ${ROUND1_TOPIC_COUNT} chủ đề.`,
                locale === "en"
                  ? "Each topic contributes 2 easy, 2 medium, and 2 hard questions."
                  : "Mỗi chủ đề đóng góp 2 câu dễ, 2 câu trung bình và 2 câu khó.",
                locale === "en"
                  ? `Each correct objective answer is worth 2 points, for a maximum of ${ROUND1_OBJECTIVE_MAX_SCORE} objective points.`
                  : `Mỗi câu khách quan đúng được 2 điểm, tối đa ${ROUND1_OBJECTIVE_MAX_SCORE} điểm khách quan.`,
                locale === "en"
                  ? `The last ${ROUND1_ESSAY_TOTAL} questions are essay prompts with a ${round1WordLimit}-word limit per answer.`
                  : `${ROUND1_ESSAY_TOTAL} câu cuối là câu tự luận với giới hạn ${round1WordLimit} từ cho mỗi câu trả lời.`,
                locale === "en"
                  ? `The 2 essay questions are manually reviewed later for a maximum of ${ROUND1_ESSAY_MAX_SCORE} points, so the final total reaches ${ROUND1_TOTAL_MAX_SCORE}.`
                  : `2 câu tự luận sẽ được chấm thủ công sau đó với tối đa ${ROUND1_ESSAY_MAX_SCORE} điểm, để tổng điểm cuối cùng đạt ${ROUND1_TOTAL_MAX_SCORE}.`,
                locale === "en"
                  ? "Question order and answer-option order are both shuffled for the objective section."
                  : "Thứ tự câu hỏi và thứ tự đáp án đều được đảo ở phần khách quan.",
                locale === "en"
                  ? "Once started, the exam keeps running. Refreshing the page does not pause the timer and the attempt cannot be reset."
                  : "Khi đã bắt đầu, bài thi sẽ tiếp tục chạy. Tải lại trang không làm dừng đồng hồ và lượt thi không thể đặt lại.",
                locale === "en"
                  ? "Unanswered objective questions count as incorrect in this frontend prototype."
                  : "Các câu khách quan chưa trả lời sẽ được tính là sai trong prototype frontend này.",
                locale === "en"
                  ? `If any technical issue appears, contact the organizer at ${contactInfo.email} or ${contactInfo.phone}.`
                  : `Nếu có sự cố kỹ thuật, hãy liên hệ ban tổ chức qua ${contactInfo.email} hoặc ${contactInfo.phone}.`,
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-[1.5rem] border theme-border theme-panel-subtle px-4 py-4">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-300" />
                  <p className="text-sm leading-7 theme-text-muted">{item}</p>
                </div>
              ))}
            </div>
          </Surface>

          <Surface className="px-6 py-6">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] theme-text-soft">
              {locale === "en" ? "Ready to enter" : "San sang vao thi"}
            </p>
            <p className="mt-4 text-xl font-semibold theme-text-strong">
              {currentUser.name}
            </p>
            <p className="mt-2 text-sm theme-text-soft">
              {currentTeam.name} · {currentUser.university}
            </p>
            <p className="mt-3 text-sm theme-text-soft">
              {locale === "en"
                ? `Team ${currentTeam.tag} · ${ROUND1_TOTAL_QUESTIONS} questions total`
                : `Đội ${currentTeam.tag} · tổng cộng ${ROUND1_TOTAL_QUESTIONS} câu`}
            </p>
            <p className="mt-3 text-sm leading-7 theme-text-soft">
              {locale === "en"
                ? "You have one official attempt only. After submission, the result is shown in Team Workspace."
                : "Bạn chỉ có 1 lượt thi chính thức. Sau khi nộp, kết quả sẽ được hiển thị trong Không gian đội."}
            </p>
            <button
              type="button"
              onClick={startExam}
              className="theme-button-primary mt-6 inline-flex w-full items-center justify-center gap-2 rounded-[1.4rem] px-5 py-3.5 text-sm font-semibold"
            >
              <Play className="h-4 w-4" />
              {locale === "en" ? "Start Round 1 exam" : "Bắt đầu bài thi Vòng 1"}
            </button>
          </Surface>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Surface className="px-6 py-6 md:px-8 md:py-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="theme-eyebrow text-xs font-semibold uppercase tracking-[0.32em]">
                {locale === "en" ? "Round 1 in progress" : "Đang thi Vòng 1"}
              </p>
              <h1 className="theme-heading mt-4 text-3xl font-semibold theme-text-strong md:text-[2.8rem]">
                {locale === "en"
                  ? `Question ${session.currentQuestionIndex + 1} of ${session.questions.length}`
                  : `Cau ${session.currentQuestionIndex + 1} / ${session.questions.length}`}
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 theme-text-muted">
                {locale === "en"
                  ? "One question appears at a time. Use the arrows or the question-number navigator to jump anywhere in the paper. Objective questions are shuffled, while the 2 essay questions stay at the end."
                  : "Mỗi lần chỉ hiển thị 1 câu hỏi. Hãy dùng mũi tên hoặc bảng số câu hỏi để nhảy đến bất kỳ vị trí nào trong đề. Phần khách quan được đảo ngẫu nhiên, còn 2 câu tự luận luôn nằm ở cuối đề."}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <StatusPill>
                {answeredCount}/{session.questions.length} {locale === "en" ? "answered" : "đã trả lời"}
              </StatusPill>
              <StatusPill tone={currentQuestion?.type === "essay" ? "warning" : "default"}>
                {currentQuestion?.type === "essay"
                  ? locale === "en"
                    ? "Essay section"
                    : "Phần tự luận"
                  : locale === "en"
                    ? "Objective section"
                    : "Phần khách quan"}
              </StatusPill>
            </div>
          </div>
        </Surface>

        <div className="space-y-4 xl:sticky xl:top-28">
          <Surface className="overflow-hidden px-6 py-6">
            <div className={`rounded-[1.7rem] px-5 py-5 ${remainingSeconds <= 300 ? "bg-[linear-gradient(135deg,rgba(245,158,11,0.2),rgba(148,64,0,0.16))]" : "bg-[linear-gradient(135deg,rgba(23,114,208,0.2),rgba(8,47,73,0.18))]"}`}>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/72">
                {locale === "en" ? "Time left" : "Thời gian còn lại"}
              </p>
              <p className="mt-4 font-mono text-5xl font-semibold tracking-[0.14em] text-white">
                {formatRemainingTime(remainingSeconds)}
              </p>
              <p className="mt-4 text-sm leading-7 text-white/74">
                {locale === "en"
                  ? "The timer continues even if you refresh or navigate away. The attempt cannot be paused or restarted."
                  : "Đồng hồ vẫn tiếp tục chạy ngay cả khi bạn tải lại trang hoặc rời khỏi đây. Lượt thi không thể tạm dừng hoặc bắt đầu lại."}
              </p>
            </div>
          </Surface>

          <Surface className="px-6 py-6">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] theme-text-soft">
              {locale === "en" ? "Exam summary" : "Tổng quan bài thi"}
            </p>
            <div className="mt-5 space-y-4">
              <div className="rounded-[1.4rem] border theme-border theme-panel-subtle px-4 py-4">
                <p className="text-sm theme-text-muted">
                  {locale === "en" ? "Scoring model" : "Cách tính điểm"}
                </p>
                <p className="mt-3 text-sm leading-7 theme-text-muted">
                  {locale === "en"
                    ? `${ROUND1_OBJECTIVE_TOTAL} objective questions x 2 points = ${ROUND1_OBJECTIVE_MAX_SCORE}. Essay score is reviewed later for up to ${ROUND1_ESSAY_MAX_SCORE} points, so the final total reaches ${ROUND1_TOTAL_MAX_SCORE}.`
                    : `${ROUND1_OBJECTIVE_TOTAL} câu khách quan x 2 điểm = ${ROUND1_OBJECTIVE_MAX_SCORE}. Điểm tự luận sẽ được chấm sau với tối đa ${ROUND1_ESSAY_MAX_SCORE} điểm, nên tổng cuối cùng đạt ${ROUND1_TOTAL_MAX_SCORE}.`}
                </p>
              </div>
              <div className="rounded-[1.4rem] border theme-border theme-panel-subtle px-4 py-4">
                <p className="text-sm theme-text-muted">
                  {locale === "en" ? "Technical support" : "Hỗ trợ kỹ thuật"}
                </p>
                <p className="mt-3 text-sm leading-7 theme-text-muted">
                  {locale === "en"
                    ? `If anything goes wrong, contact the organizer immediately at ${contactInfo.email} or ${contactInfo.phone}.`
                    : `Nếu có sự cố, hãy liên hệ ban tổ chức ngay qua ${contactInfo.email} hoặc ${contactInfo.phone}.`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const confirmed = window.confirm(
                    locale === "en"
                      ? "Submit this Round 1 attempt now?"
                      : "Bạn có muốn nộp bài Vòng 1 ngay bây giờ không?",
                  );

                  if (!confirmed) {
                    return;
                  }

                  finalizeExam(session);
                }}
                className="theme-button-primary inline-flex w-full items-center justify-center gap-2 rounded-[1.4rem] px-5 py-3.5 text-sm font-semibold"
              >
                <ShieldCheck className="h-4 w-4" />
                {locale === "en" ? "Submit exam" : "Nộp bài thi"}
              </button>
            </div>
          </Surface>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Surface className="px-6 py-6 md:px-8 md:py-8">
          {currentQuestion ? (
            <>
              <div className="flex flex-wrap items-center gap-3">
                <StatusPill>{currentQuestion.topic}</StatusPill>
                <StatusPill>{pickRound1TypeLabel(locale, currentQuestion.type)}</StatusPill>
                <StatusPill
                  tone={
                    currentQuestion.difficulty === "hard"
                      ? "warning"
                      : currentQuestion.difficulty === "medium"
                        ? "success"
                        : "default"
                  }
                >
                  {currentQuestion.difficulty}
                </StatusPill>
              </div>

              <p className="mt-6 text-2xl font-semibold leading-10 theme-text-strong">
                {pickText(locale, currentQuestion.prompt)}
              </p>

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
                          <p className="text-sm leading-7 theme-text-body">
                            {pickText(locale, option.text)}
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
                            <p className="text-sm leading-7 theme-text-body">
                              {pickText(locale, option.text)}
                            </p>
                            {isSelected ? (
                              <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">
                                {locale === "en" ? "Selected" : "Da chon"}
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
                          <p className="text-sm leading-7 theme-text-body">
                            {pickText(locale, item.prompt)}
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
                              className="theme-placeholder w-full rounded-2xl border theme-border theme-panel px-4 py-3 text-sm theme-text-strong outline-none"
                            >
                              <option value="">
                                {locale === "en" ? "Choose one option" : "Chọn một lựa chọn"}
                              </option>
                              {(currentQuestion.options ?? []).map((option) => (
                                <option key={option.id} value={option.id}>
                                  {`${option.displayLabel}. ${pickText(locale, option.text)}`}
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
                  <div className="rounded-[1.5rem] border theme-border theme-panel-subtle px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] theme-text-soft">
                      {locale === "en" ? "Response guidance" : "Hướng dẫn trả lời"}
                    </p>
                    <p className="mt-3 text-sm leading-7 theme-text-muted">
                      {pickText(locale, currentQuestion.rubricNote ?? { en: "", vi: "" })}
                    </p>
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <StatusPill tone="warning">
                        {locale === "en"
                          ? `${countWords(currentResponse?.essayText ?? "")}/${round1WordLimit} words`
                          : `${countWords(currentResponse?.essayText ?? "")}/${round1WordLimit} từ`}
                      </StatusPill>
                      <span className="text-xs uppercase tracking-[0.18em] theme-text-soft">
                        {locale === "en"
                          ? "Essay questions stay at the end of the paper"
                          : "Các câu tự luận luôn nằm ở cuối đề"}
                      </span>
                    </div>
                  </div>
                  <textarea
                    rows={8}
                    value={currentResponse?.essayText ?? ""}
                    placeholder={pickText(
                      locale,
                      currentQuestion.placeholder ?? { en: "", vi: "" },
                    )}
                    onChange={(event) =>
                      setSession((current) =>
                        current
                          ? {
                              ...current,
                              answers: {
                                ...current.answers,
                                [currentQuestion.id]: {
                                  essayText: limitEssayToWordCount(event.target.value, round1WordLimit),
                                },
                              },
                            }
                          : current,
                      )
                    }
                    className="theme-placeholder w-full rounded-[1.5rem] border theme-border theme-panel px-5 py-4 text-sm leading-7 theme-text-strong outline-none"
                  />
                  <p className="text-sm leading-7 theme-text-soft">
                    {locale === "en"
                      ? "The system keeps only the first 200 words in this frontend prototype."
                      : "Hệ thống chỉ giữ lại 200 từ đầu tiên trong prototype frontend này."}
                  </p>
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
                      : "Xem bang dieu huong"
                    : locale === "en"
                      ? "Next question"
                      : "Cau tiep"}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </>
          ) : null}
        </Surface>

        <Surface className="px-6 py-6 xl:sticky xl:top-28 xl:self-start">
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
                        ? "border-emerald-300/24 bg-emerald-300/10 text-emerald-100"
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
          <div className="mt-5 space-y-2 text-xs theme-text-soft">
            <p className="inline-flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[rgba(23,114,208,0.65)]" />
              {locale === "en" ? "Current question" : "Cau hien tai"}
            </p>
            <p className="inline-flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
              {locale === "en" ? "Answered" : "Đã trả lời"}
            </p>
            <p className="inline-flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-white/30" />
              {locale === "en" ? "Not answered yet" : "Chưa trả lời"}
            </p>
          </div>
          {remainingSeconds <= 300 ? (
            <div className="mt-5 rounded-[1.4rem] border border-amber-300/24 bg-amber-300/10 px-4 py-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-200" />
                <p className="text-sm leading-6 text-amber-50">
                  {locale === "en"
                    ? "Less than 5 minutes remain. Unanswered questions will be counted as incorrect when the exam auto-submits."
                    : "Còn dưới 5 phút. Các câu chưa trả lời sẽ bị tính là sai khi bài thi tự động nộp."}
                </p>
              </div>
            </div>
          ) : null}
        </Surface>
      </section>
    </div>
  );
}
