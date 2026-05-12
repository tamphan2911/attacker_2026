"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import {
  ArrowRight,
  Camera,
  Check,
  ChevronDown,
  Crown,
  FolderClock,
  LockKeyhole,
  LogOut,
  MailPlus,
  Phone,
  Search,
  ShieldCheck,
  Undo2,
  Upload,
  UserPlus2,
  X,
} from "lucide-react";

import { TEAM_MAX_MEMBERS, TEAM_MIN_MEMBERS } from "@/data/site-content";
import {
  canTeamSubmitForRound,
  getCompetitionRoundWindow,
  getCompetitionRoundPrimaryTimelineItem,
  getSubmissionDeadlineTimelineItem,
  getTeamCompetitionState,
  hasTeamPassedRound,
  hasTeamReachedRound,
  isRoundFinished,
  isTimelineItemFinished,
  isTeamRosterLocked,
  isTeamRound1Locked,
  isTeamCurrentlyCompetingRound,
  pickTeamDisplayStatusLabel,
  pickRound1LockStatusLabel,
  pickRoundLabel,
} from "@/lib/competition";
import {
  ROUND1_ESSAY_MAX_SCORE,
  ROUND1_OBJECTIVE_MAX_SCORE,
  ROUND1_TOTAL_MAX_SCORE,
} from "@/lib/round1";
import {
  MAX_SUBMISSION_FILE_BYTES,
} from "@/lib/submission-files";
import { ALLOWED_AVATAR_IMAGE_TYPES, MAX_AVATAR_IMAGE_BYTES } from "@/lib/avatar-images";
import { formatDateLabel, formatDateRangeLabel, getTeamForUser, pickText } from "@/lib/site";
import { useSiteState } from "@/components/providers/site-state-provider";
import {
  GradientAvatar,
  StatusPill,
  Surface,
} from "@/components/site-ui";
import type {
  Locale,
  SubmissionRound,
  TeamProfile,
  TeamSubmission,
  TimelineItem,
  UserProfile,
} from "@/types/site";

const avatarTones = [
  "from-sky-500 via-cyan-400 to-emerald-400",
  "from-indigo-500 via-blue-400 to-cyan-300",
  "from-orange-500 via-rose-400 to-fuchsia-400",
  "from-emerald-500 via-teal-400 to-cyan-400",
  "from-violet-500 via-blue-400 to-cyan-300",
  "from-amber-500 via-orange-400 to-rose-400",
];

interface TeamFormState {
  name: string;
  tag: string;
  track: string;
  bio: string;
  avatarTone: string;
  avatarImageSrc?: string;
}

interface SubmissionFormState {
  title: string;
  summary: string;
  resourceFile: File | null;
}

function createTeamFormState(team?: TeamProfile): TeamFormState {
  return {
    name: team?.name ?? "",
    tag: team?.tag ?? "",
    track: team?.track ?? "",
    bio: team?.bio ?? "",
    avatarTone: team?.avatarTone ?? avatarTones[0],
    avatarImageSrc: team?.avatarImageSrc,
  };
}

function createSubmissionFormState(): SubmissionFormState {
  return {
    title: "",
    summary: "",
    resourceFile: null,
  };
}

function formatFileSize(bytes?: number) {
  if (!bytes) {
    return "";
  }

  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  }

  return `${Math.ceil(bytes / 1024)}KB`;
}

function averageNumbers(values: number[]) {
  if (values.length === 0) {
    return null;
  }

  return values.reduce((total, value) => total + value, 0) / values.length;
}

function formatAverageNumber(value: number) {
  return Number.isInteger(value) ? `${value}` : value.toFixed(1).replace(/\.0$/, "");
}

function formatAverageScore(value: number | null, maxScore: number, locale: Locale) {
  if (value == null) {
    return locale === "en" ? "Not decided yet" : "Chưa xác định";
  }

  return `${formatAverageNumber(value)} / ${maxScore}`;
}

function readImageFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("Unable to read image file."));
    };
    reader.onerror = () => reject(reader.error ?? new Error("Unable to read image file."));
    reader.readAsDataURL(file);
  });
}

function PhoneRequirementNotice({
  title,
  description,
  actionLabel,
}: {
  title: string;
  description: string;
  actionLabel: string;
}) {
  return (
    <div className="rounded-[1.45rem] border border-amber-300/30 bg-[linear-gradient(135deg,rgba(251,191,36,0.14),rgba(255,255,255,0.78))] px-4 py-4 shadow-[0_18px_38px_rgba(120,53,15,0.08)] dark:bg-[linear-gradient(135deg,rgba(251,191,36,0.16),rgba(15,23,42,0.74))]">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-400/18 text-amber-700 dark:text-amber-100">
          <Phone className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold theme-text-strong">{title}</p>
          <p className="mt-2 text-sm leading-7 theme-text-muted">{description}</p>
          <Link
            href="/profile/edit"
            className="mt-3 inline-flex items-center gap-2 rounded-full border border-amber-400/35 bg-white/80 px-4 py-2 text-sm font-semibold text-amber-800 transition hover:bg-white dark:bg-white/8 dark:text-amber-100 dark:hover:bg-white/12"
          >
            {actionLabel}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export function DashboardPage() {
  const {
    locale,
    users,
    teams,
    invitations,
    leadershipTransferRequests,
    teamLockRequests,
    submissions,
    round1Submissions,
    pageContent,
    timelineItems,
    authStatus,
    currentUser,
    currentTeam,
    activeUserId,
    isAuthenticated,
    canAccessAdminMode,
    createTeam,
    updateCurrentTeam,
    inviteUser,
    recallInvitation,
    respondToInvitation,
    initiateRound1TeamLock,
    respondToRound1TeamLock,
    leaveCurrentTeam,
    transferLeadership,
    respondToLeadershipTransfer,
    submitTeamSubmission,
  } = useSiteState();
  const [teamForm, setTeamForm] = useState<TeamFormState>(() => createTeamFormState(currentTeam));
  const [teamAvatarError, setTeamAvatarError] = useState("");
  const [inviteSearch, setInviteSearch] = useState("");
  const [pendingInviteUserId, setPendingInviteUserId] = useState<string | null>(null);
  const [pendingRecallInvitationId, setPendingRecallInvitationId] = useState<string | null>(null);
  const [leadershipTargetId, setLeadershipTargetId] = useState("");
  const [isLeadershipMenuOpen, setIsLeadershipMenuOpen] = useState(false);
  const leadershipMenuRef = useRef<HTMLDivElement | null>(null);
  const [submissionForms, setSubmissionForms] = useState<Record<SubmissionRound, SubmissionFormState>>({
    "round-2": createSubmissionFormState(),
    "round-3": createSubmissionFormState(),
  });

  useEffect(() => {
    setTeamForm(createTeamFormState(currentTeam));
  }, [currentTeam]);

  useEffect(() => {
    setTeamAvatarError("");
    setPendingInviteUserId(null);
    setPendingRecallInvitationId(null);
  }, [currentTeam?.id]);

  useEffect(() => {
    setLeadershipTargetId("");
    setIsLeadershipMenuOpen(false);
  }, [currentTeam?.id]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!leadershipMenuRef.current?.contains(event.target as Node)) {
        setIsLeadershipMenuOpen(false);
      }
    };

    window.addEventListener("mousedown", handlePointerDown);
    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
    };
  }, []);

  if (authStatus === "loading") {
    return (
      <Surface className="mx-auto max-w-3xl px-6 py-10 text-center">
        <p className="text-sm theme-text-soft">{locale === "en" ? "Loading workspace..." : "Đang tải workspace..."}</p>
      </Surface>
    );
  }

  if (!isAuthenticated) {
    return (
      <Surface className="mx-auto max-w-3xl px-6 py-10 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-200/80">
          {locale === "en" ? "Sign in required" : "Cần đăng nhập"}
        </p>
        <h1 className="theme-heading mt-4 text-3xl font-semibold theme-text-strong">
          {locale === "en" ? "Sign in to open the team workspace." : "Đăng nhập để mở Đội thi."}
        </h1>
        <Link
          href="/auth"
          className="mt-7 inline-flex items-center justify-center gap-2 rounded-full border border-sky-300/45 bg-[linear-gradient(135deg,rgba(56,189,248,0.95),rgba(37,99,235,0.95))] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_42px_rgba(37,99,235,0.22)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_48px_rgba(37,99,235,0.28)] active:translate-y-0 dark:border-white/12"
        >
          <LockKeyhole className="h-4 w-4" />
          {locale === "en" ? "Open sign in" : "Mở đăng nhập"}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </Surface>
    );
  }

  if (currentUser.role !== "student") {
    return (
      <Surface className="mx-auto max-w-4xl px-6 py-10 md:px-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="max-w-2xl">
            <p className="theme-eyebrow text-xs font-semibold uppercase tracking-[0.28em]">
              {currentUser.role === "judge"
                ? locale === "en"
                  ? "Judge dashboard"
                  : "Bảng chấm giám khảo"
                : locale === "en"
                  ? "Organizer workspace"
                  : "Workspace vận hành"}
            </p>
            <h1 className="theme-heading mt-4 text-3xl font-semibold theme-text-strong md:text-[2.7rem]">
              {currentUser.role === "judge"
                ? locale === "en"
                  ? "Judge accounts review scoring tasks instead of joining teams."
                  : "Tài khoản giám khảo dùng để chấm điểm, không tham gia đội thi."
                : locale === "en"
                  ? "Admin and moderator accounts do not join teams or competition rounds."
                  : "Tài khoản admin và moderator không tham gia đội thi hoặc các vòng thi."}
            </h1>
            <p className="mt-4 text-sm leading-7 theme-text-soft">
              {currentUser.role === "judge"
                ? locale === "en"
                  ? "Open the judge dashboard to review essay responses, download team reports, and save your own score for the rounds assigned to you."
                  : "Hãy mở bảng chấm giám khảo để xem phần tự luận, tải báo cáo đội thi và lưu điểm chấm của riêng bạn cho các vòng được phân công."
                : locale === "en"
                  ? "This account is reserved for moderation. Use admin mode to manage the platform, and use the profile page only for internal identity details."
                  : "Tài khoản này chỉ dùng cho công tác điều phối. Hãy dùng admin mode để vận hành hệ thống, và chỉ dùng trang hồ sơ cho thông tin định danh nội bộ."}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {currentUser.role === "judge" ? (
              <Link
                href="/judge-dashboard"
                className="theme-button-primary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
              >
                <ShieldCheck className="h-4 w-4" />
                {locale === "en" ? "Open judge dashboard" : "Mở bảng chấm giám khảo"}
              </Link>
            ) : null}
            {canAccessAdminMode ? (
              <Link
                href="/admin"
                className="theme-button-primary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
              >
                <ShieldCheck className="h-4 w-4" />
                {locale === "en" ? "Open admin mode" : "Mở admin mode"}
              </Link>
            ) : null}
            <Link
              href="/profile"
              className="theme-button-secondary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
            >
              {locale === "en" ? "Open profile" : "Mở hồ sơ"}
            </Link>
          </div>
        </div>
      </Surface>
    );
  }

  const currentTeamMembers = currentTeam
    ? currentTeam.memberIds
        .map((memberId) => users.find((user) => user.id === memberId))
        .filter((user): user is UserProfile => Boolean(user))
    : [];
  const leadershipTransferOptions = currentTeamMembers.filter((member) => member.id !== activeUserId);
  const selectedLeadershipTarget = leadershipTransferOptions.find((member) => member.id === leadershipTargetId);

  const incomingInvitations = invitations.filter(
    (invitation) => invitation.toUserId === activeUserId && invitation.status === "pending",
  );
  const incomingRound1TeamLockRequests = teamLockRequests.filter(
    (request) => request.toUserId === activeUserId && request.status === "pending",
  );
  const incomingLeadershipTransfers = leadershipTransferRequests.filter(
    (request) => request.toUserId === activeUserId && request.status === "pending",
  );

  const sentInvitations = currentTeam
    ? invitations.filter(
        (invitation) => invitation.teamId === currentTeam.id && invitation.status === "pending",
      )
    : [];
  const outgoingLeadershipTransfer = currentTeam
    ? leadershipTransferRequests.find(
        (request) =>
          request.teamId === currentTeam.id &&
          request.fromUserId === activeUserId &&
          request.status === "pending",
      )
    : undefined;

  const inviteCandidateUsers = users.filter(
    (user) =>
      user.id !== activeUserId &&
      user.role === "student" &&
      !(currentTeam?.memberIds.includes(user.id) ?? false),
  );
  const isLeader = currentTeam?.leaderId === activeUserId;
  const teamReadinessCount = currentTeam?.memberIds.length ?? 0;
  const membersNeeded = Math.max(0, TEAM_MIN_MEMBERS - teamReadinessCount);
  const hasProfilePhoneNumber = Boolean(currentUser.phoneNumber.trim());
  const currentCompetitionState = currentTeam ? getTeamCompetitionState(currentTeam) : undefined;
  const teamRosterLocked = Boolean(currentTeam && isTeamRosterLocked(currentTeam));
  const teamRound1Locked = Boolean(currentTeam && isTeamRound1Locked(currentTeam));
  const isTeamFull = Boolean(currentTeam && currentTeam.memberIds.length >= TEAM_MAX_MEMBERS);
  const openSlots = currentTeam
    ? TEAM_MAX_MEMBERS - currentTeam.memberIds.length - sentInvitations.length
    : TEAM_MAX_MEMBERS;
  const round1Window =
    getCompetitionRoundPrimaryTimelineItem("round-1", timelineItems) ??
    getCompetitionRoundWindow("round-1", timelineItems);
  const round1Finished = isTimelineItemFinished("round-1-individual-qualifier", timelineItems, new Date());
  const round2Finished = isRoundFinished("round-2", new Date(), timelineItems);
  const round3Finished = isRoundFinished("round-3", new Date(), timelineItems);
  const round3SubmissionDeadlineItem = getSubmissionDeadlineTimelineItem("round-3", timelineItems);
  const round3SubmissionClosed = Boolean(
    currentTeam &&
      round3SubmissionDeadlineItem &&
      !canTeamSubmitForRound(currentTeam, "round-3", new Date(), timelineItems),
  );
  const round3SubmissionWindowLabel = round3SubmissionDeadlineItem
    ? formatDateRangeLabel(locale, round3SubmissionDeadlineItem.startDate, round3SubmissionDeadlineItem.endDate)
    : undefined;
  const showRound2Submission = currentTeam ? hasTeamReachedRound(currentTeam, "round-2") : false;
  const showRound3Submission = currentTeam ? hasTeamReachedRound(currentTeam, "round-3") : false;

  const teamSubmissions = currentTeam
    ? submissions.filter((submission) => submission.teamId === currentTeam.id)
    : [];
  const currentRound1Submission = round1Submissions.find((submission) => submission.userId === activeUserId);
  const currentTeamRound1LockRequests =
    currentTeam?.round1LockProtocolId
      ? teamLockRequests.filter(
          (request) =>
            request.teamId === currentTeam.id &&
            request.protocolId === currentTeam.round1LockProtocolId,
        )
      : [];
  const currentTeamRound1LockRequestByUserId = new Map(
    currentTeamRound1LockRequests.map((request) => [request.toUserId, request]),
  );
  const pendingTeamLockApprovals = currentTeamRound1LockRequests.filter(
    (request) => request.status === "pending",
  );
  const declinedLockUser = currentTeam?.round1LockDeclinedByUserId
    ? users.find((user) => user.id === currentTeam.round1LockDeclinedByUserId)
    : undefined;
  const canStartRound1Exam = Boolean(
    currentTeam &&
      currentCompetitionState === "round-1" &&
      teamRound1Locked &&
      !round1Finished &&
      !currentRound1Submission,
  );
  const canInitiateTeamLock = Boolean(
    currentTeam &&
      isLeader &&
      currentTeam.stage === "round-1" &&
      currentTeam.memberIds.length >= TEAM_MIN_MEMBERS &&
      !round1Finished &&
      currentTeam.round1LockStatus !== "pending" &&
      !teamRound1Locked &&
      !outgoingLeadershipTransfer,
  );
  const currentTeamRound1Results = currentTeam
    ? currentTeamMembers.map((member) => {
        const submission = round1Submissions.find((item) => item.userId === member.id && item.teamId === currentTeam.id);

        return {
          member,
          submission,
        };
      })
    : [];
  const submittedTeamRound1Results = currentTeamRound1Results.flatMap(({ submission }) =>
    submission ? [submission] : [],
  );
  const hasAnyTeamRound1Result = submittedTeamRound1Results.length > 0;
  const hasCompleteTeamRound1Results =
    currentTeamRound1Results.length > 0 &&
    submittedTeamRound1Results.length === currentTeamRound1Results.length;
  const teamRound1ObjectiveAverage = hasCompleteTeamRound1Results
    ? averageNumbers(submittedTeamRound1Results.map((submission) => submission.objectiveScore))
    : null;
  const teamRound1EssayAverage =
    hasCompleteTeamRound1Results && submittedTeamRound1Results.every((submission) => submission.essayScore != null)
      ? averageNumbers(submittedTeamRound1Results.map((submission) => submission.essayScore ?? 0))
      : null;
  const teamRound1TotalAverage =
    hasCompleteTeamRound1Results && submittedTeamRound1Results.every((submission) => submission.totalScore != null)
      ? averageNumbers(submittedTeamRound1Results.map((submission) => submission.totalScore ?? 0))
      : null;
  const teamRound1DurationAverage = hasCompleteTeamRound1Results
    ? averageNumbers(submittedTeamRound1Results.map((submission) => submission.durationMinutes))
    : null;
  const teamRound1ResultPending =
    !hasCompleteTeamRound1Results ||
    teamRound1EssayAverage == null ||
    teamRound1TotalAverage == null ||
    teamRound1DurationAverage == null;
  const filteredAvailableUsers = inviteCandidateUsers.filter((user) => {
    const keyword = inviteSearch.trim().toLowerCase();
    if (!keyword) {
      return false;
    }

    return [user.name, user.email, user.university, user.major]
      .join(" ")
      .toLowerCase()
      .includes(keyword);
  });
  const pendingInviteUser = pendingInviteUserId
    ? users.find((user) => user.id === pendingInviteUserId)
    : undefined;
  const pendingInviteUserTeam = pendingInviteUser ? getTeamForUser(pendingInviteUser.id, teams) : undefined;
  const pendingInviteAlreadyInvited = Boolean(
    pendingInviteUser && sentInvitations.some((invitation) => invitation.toUserId === pendingInviteUser.id),
  );
  const pendingInviteUserInCurrentTeam = Boolean(
    pendingInviteUser && currentTeam?.memberIds.includes(pendingInviteUser.id),
  );
  const pendingInviteUserInAnotherTeam = Boolean(
    pendingInviteUserTeam && (!currentTeam || pendingInviteUserTeam.id !== currentTeam.id),
  );
  const pendingInviteTeamLeader = pendingInviteUserTeam
    ? users.find((user) => user.id === pendingInviteUserTeam.leaderId)
    : undefined;
  const inviteConfirmBlockingReason = pendingInviteUserInAnotherTeam
    ? locale === "en"
      ? `${pendingInviteUser?.name ?? "This student"} is already a member of ${pendingInviteUserTeam?.name ?? "another team"}.`
      : `${pendingInviteUser?.name ?? "Sinh viên này"} đã là thành viên của ${pendingInviteUserTeam?.name ?? "một đội khác"}.`
    : pendingInviteUserInCurrentTeam
      ? locale === "en"
        ? "This student is already in your team."
        : "Sinh viên này đã ở trong đội của bạn."
      : pendingInviteAlreadyInvited
        ? locale === "en"
          ? "There is already a pending invitation for this student."
          : "Đã có lời mời đang chờ cho sinh viên này."
        : !isLeader
          ? locale === "en"
            ? "Only the team leader can send invitations."
            : "Chỉ đội trưởng mới có thể gửi lời mời."
          : teamRosterLocked
            ? locale === "en"
              ? "This team roster is locked, so new invitations are paused."
              : "Đội hình đã được khóa nên không thể gửi thêm lời mời."
            : isTeamFull || openSlots <= 0
              ? locale === "en"
                ? "This team has no open invitation slots right now."
                : "Đội hiện không còn chỗ trống để gửi lời mời."
              : "";
  const canConfirmPendingInvite = Boolean(pendingInviteUser && !inviteConfirmBlockingReason);
  const pendingRecallInvitation = pendingRecallInvitationId
    ? sentInvitations.find((invitation) => invitation.id === pendingRecallInvitationId)
    : undefined;
  const pendingRecallTargetUser = pendingRecallInvitation
    ? users.find((user) => user.id === pendingRecallInvitation.toUserId)
    : undefined;
  const pendingRecallSender = pendingRecallInvitation
    ? users.find((user) => user.id === pendingRecallInvitation.fromUserId)
    : undefined;
  const canConfirmRecallInvitation = Boolean(
    pendingRecallInvitation &&
      currentTeam &&
      (currentTeam.leaderId === activeUserId || pendingRecallInvitation.fromUserId === activeUserId),
  );

  const roundJumpTargets = currentTeam
    ? [
        {
          round: "round-1" as const,
          sectionId: "round-1-section",
          icon: ShieldCheck,
          buttonClass:
            "border-sky-600/24 bg-[linear-gradient(135deg,rgba(14,165,233,0.18),rgba(59,130,246,0.12))] text-sky-800 hover:border-sky-600/34 hover:bg-[linear-gradient(135deg,rgba(14,165,233,0.24),rgba(59,130,246,0.16))] dark:border-sky-300/22 dark:bg-sky-300/[0.12] dark:text-sky-100",
        },
        ...(hasTeamReachedRound(currentTeam, "round-2")
          ? [
              {
                round: "round-2" as const,
                sectionId: "round-2-section",
                icon: FolderClock,
                buttonClass:
                  "border-emerald-600/24 bg-[linear-gradient(135deg,rgba(16,185,129,0.18),rgba(52,211,153,0.12))] text-emerald-800 hover:border-emerald-600/34 hover:bg-[linear-gradient(135deg,rgba(16,185,129,0.24),rgba(52,211,153,0.16))] dark:border-emerald-300/22 dark:bg-emerald-300/[0.12] dark:text-emerald-100",
              },
            ]
          : []),
        ...(hasTeamReachedRound(currentTeam, "round-3")
          ? [
              {
                round: "round-3" as const,
                sectionId: "round-3-section",
                icon: Crown,
                buttonClass:
                  "border-amber-600/24 bg-[linear-gradient(135deg,rgba(245,158,11,0.18),rgba(249,115,22,0.12))] text-amber-800 hover:border-amber-600/34 hover:bg-[linear-gradient(135deg,rgba(245,158,11,0.24),rgba(249,115,22,0.16))] dark:border-amber-300/22 dark:bg-amber-300/[0.12] dark:text-amber-100",
              },
            ]
          : []),
      ]
    : [];

  const scrollToDashboardSection = (sectionId: string) => {
    const target = document.getElementById(sectionId);
    if (!target) {
      return;
    }

    target.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleTeamSave = () => {
    if (!currentTeam && !hasProfilePhoneNumber) {
      return;
    }

    if (currentTeam) {
      updateCurrentTeam({
        name: teamForm.name,
        tag: teamForm.tag,
        track: teamForm.track,
        avatarTone: teamForm.avatarTone,
        avatarImageSrc: teamForm.avatarImageSrc ?? null,
        bio: teamForm.bio,
      });
      return;
    }

    createTeam({
      name: teamForm.name,
      tag: teamForm.tag,
      track: teamForm.track,
      avatarTone: teamForm.avatarTone,
      avatarImageSrc: teamForm.avatarImageSrc,
      bio: teamForm.bio,
    });
  };

  const handleTeamAvatarUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    if (!ALLOWED_AVATAR_IMAGE_TYPES.has(file.type)) {
      setTeamAvatarError(
        locale === "en"
          ? "Only JPEG, PNG, WebP, or GIF images are allowed."
          : "Chỉ chấp nhận ảnh JPEG, PNG, WebP hoặc GIF.",
      );
      return;
    }

    if (file.size > MAX_AVATAR_IMAGE_BYTES) {
      setTeamAvatarError(
        locale === "en"
          ? `Avatar images must be ${formatFileSize(MAX_AVATAR_IMAGE_BYTES)} or smaller.`
          : `Ảnh avatar phải có dung lượng ${formatFileSize(MAX_AVATAR_IMAGE_BYTES)} trở xuống.`,
      );
      return;
    }

    try {
      const imageSrc = await readImageFileAsDataUrl(file);
      setTeamAvatarError("");
      setTeamForm((current) => ({ ...current, avatarImageSrc: imageSrc }));
      if (currentTeam && isLeader) {
        updateCurrentTeam({
          name: teamForm.name,
          tag: teamForm.tag,
          track: teamForm.track,
          avatarTone: teamForm.avatarTone,
          avatarImageSrc: imageSrc,
          bio: teamForm.bio,
        });
      }
    } catch {
      // Ignore failed local previews in the frontend-only prototype.
    }
  };

  const handleSubmission = async (round: SubmissionRound) => {
    const form = submissionForms[round];

    const wasSubmitted = await submitTeamSubmission({
      round,
      title: form.title,
      summary: form.summary,
      resourceFile: form.resourceFile,
    });

    if (!wasSubmitted) {
      return;
    }

    setSubmissionForms((current) => ({
      ...current,
      [round]: createSubmissionFormState(),
    }));
  };

  const handleConfirmInvite = () => {
    if (!pendingInviteUser || !canConfirmPendingInvite) {
      return;
    }

    const userId = pendingInviteUser.id;
    setPendingInviteUserId(null);
    inviteUser(userId);
  };

  const handleConfirmRecallInvitation = () => {
    if (!pendingRecallInvitation || !canConfirmRecallInvitation) {
      return;
    }

    const invitationId = pendingRecallInvitation.id;
    setPendingRecallInvitationId(null);
    recallInvitation(invitationId);
  };

  const hasActionInbox =
    incomingInvitations.length > 0 ||
    incomingRound1TeamLockRequests.length > 0 ||
    incomingLeadershipTransfers.length > 0 ||
    Boolean(outgoingLeadershipTransfer) ||
    Boolean(currentTeam && currentTeam.round1LockStatus === "declined") ||
    Boolean(currentTeam && currentTeam.round1LockStatus === "pending" && isLeader);

  return (
    <div className="space-y-8">
      {hasActionInbox ? (
        <section id="team-actions" className="scroll-mt-28 space-y-4">
          <div className="rounded-[2rem] border border-sky-400/28 bg-[linear-gradient(135deg,rgba(24,92,188,0.18),rgba(14,165,233,0.08))] px-6 py-6 shadow-[0_24px_70px_rgba(15,23,42,0.18)] backdrop-blur-xl md:px-8">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-sky-200/85">
              {locale === "en" ? "Action inbox" : "Hộp thư hành động"}
            </p>
            <p className="mt-4 theme-heading text-2xl font-semibold theme-text-strong md:text-[2.1rem]">
              {locale === "en"
                ? "Invitations, lock approvals, and leadership actions need your response."
                : "Các lời mời, yêu cầu khóa đội và yêu cầu đội trưởng đang chờ bạn phản hồi."}
            </p>
            <p className="mt-3 max-w-3xl text-sm leading-7 theme-text-muted">
              {locale === "en"
                ? "These requests stay pinned here so the current user can resolve team-critical actions before editing the rest of the workspace."
                : "Những yêu cầu này được ghim tại đây để người dùng hiện tại xử lý các việc quan trọng của đội trước khi thao tác những phần khác trong workspace."}
            </p>
            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              {incomingInvitations.map((invitation) => {
                const team = teams.find((item) => item.id === invitation.teamId);
                const inviter = users.find((user) => user.id === invitation.fromUserId);
                const isTargetTeamFull = Boolean(team && team.memberIds.length >= TEAM_MAX_MEMBERS);
                const isTargetTeamLocked = Boolean(team && isTeamRosterLocked(team));

                if (!team) {
                  return null;
                }

                return (
                  <Surface key={invitation.id} className="border border-sky-300/20 px-5 py-5">
                    <div className="flex items-start gap-4">
                      <GradientAvatar
                        label={team.name}
                        tone={team.avatarTone}
                        imageSrc={team.avatarImageSrc}
                        className="h-14 w-14 text-base"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusPill tone={isTargetTeamFull || isTargetTeamLocked ? "warning" : "info"}>
                            {isTargetTeamFull
                              ? locale === "en"
                                ? "Team full"
                                : "Đội đã đủ"
                              : isTargetTeamLocked
                                ? locale === "en"
                                  ? "Roster locked"
                                  : "Đội hình đã khóa"
                              : locale === "en"
                                ? "Team invite"
                                : "Lời mời vào đội"}
                          </StatusPill>
                          <StatusPill>{formatDateLabel(locale, invitation.createdAt)}</StatusPill>
                        </div>
                        <p className="mt-4 text-lg font-semibold theme-text-strong">{team.name}</p>
                        <p className="mt-2 text-sm leading-7 theme-text-muted">
                          {isTargetTeamFull
                            ? locale === "en"
                              ? `${team.name} has reached 5 members. If you try to accept now, the system will expire this invitation.`
                              : `${team.name} đã đạt 5 thành viên. Nếu bạn thử chấp nhận bây giờ, hệ thống sẽ kết thúc lời mời này.`
                            : isTargetTeamLocked
                              ? locale === "en"
                                ? `${team.name} has already frozen its roster for Round 1, so this invitation is no longer joinable.`
                                : `${team.name} đã đóng đội hình cho Vòng 1 nên lời mời này không còn dùng để vào đội nữa.`
                            : locale === "en"
                              ? `${inviter?.name ?? "A team leader"} invited you to join ${team.name}.`
                              : `${inviter?.name ?? "Một đội trưởng"} đã mời bạn vào đội ${team.name}.`}
                        </p>
                        <div className="mt-4 flex flex-wrap gap-3">
                          <button
                            type="button"
                            disabled={isTargetTeamFull || isTargetTeamLocked}
                            onClick={() => respondToInvitation(invitation.id, "accept")}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Check className="h-4 w-4" />
                            {locale === "en" ? "Accept invite" : "Chấp nhận lời mời"}
                          </button>
                          <button
                            type="button"
                            onClick={() => respondToInvitation(invitation.id, "decline")}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl border theme-border-strong theme-panel px-4 py-3 text-sm font-semibold theme-text-strong"
                          >
                            {locale === "en" ? "Decline" : "Tu choi"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </Surface>
                );
              })}

              {incomingRound1TeamLockRequests.map((request) => {
                const team = teams.find((item) => item.id === request.teamId);
                const requester = users.find((user) => user.id === request.fromUserId);

                if (!team) {
                  return null;
                }

                return (
                  <Surface key={request.id} className="border border-cyan-300/20 px-5 py-5">
                    <div className="flex items-start gap-4">
                      <GradientAvatar
                        label={team.name}
                        tone={team.avatarTone}
                        imageSrc={team.avatarImageSrc}
                        className="h-14 w-14 text-base"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusPill tone="info">
                            {locale === "en" ? "Team lock request" : "Yêu cầu khóa đội"}
                          </StatusPill>
                          <StatusPill>{formatDateLabel(locale, request.createdAt)}</StatusPill>
                        </div>
                        <p className="mt-4 text-lg font-semibold theme-text-strong">{team.name}</p>
                        <p className="mt-2 text-sm leading-7 theme-text-muted">
                          {locale === "en"
                            ? `${requester?.name ?? "The team leader"} wants to lock this roster before Round 1. Once everyone accepts, invites, leaving the team, and leadership transfer all stop.`
                            : `${requester?.name ?? "Đội trưởng"} muốn khóa đội hình này trước Vòng 1. Khi mọi người cùng đồng ý, việc mời thêm người, rời đội và chuyển đội trưởng đều sẽ dừng lại.`}
                        </p>
                        <div className="mt-4 flex flex-wrap gap-3">
                          <button
                            type="button"
                            onClick={() => respondToRound1TeamLock(request.id, "accept")}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-950"
                          >
                            <ShieldCheck className="h-4 w-4" />
                            {locale === "en" ? "Approve lock" : "Đồng ý khóa đội"}
                          </button>
                          <button
                            type="button"
                            onClick={() => respondToRound1TeamLock(request.id, "decline")}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl border theme-border-strong theme-panel px-4 py-3 text-sm font-semibold theme-text-strong"
                          >
                            {locale === "en" ? "Decline" : "Từ chối"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </Surface>
                );
              })}

              {incomingLeadershipTransfers.map((request) => {
                const team = teams.find((item) => item.id === request.teamId);
                const requester = users.find((user) => user.id === request.fromUserId);
                const acceptLeadershipDisabled = !hasProfilePhoneNumber;

                if (!team) {
                  return null;
                }

                return (
                  <Surface key={request.id} className="border border-amber-300/20 px-5 py-5">
                    <div className="flex items-start gap-4">
                      <GradientAvatar
                        label={team.name}
                        tone={team.avatarTone}
                        imageSrc={team.avatarImageSrc}
                        className="h-14 w-14 text-base"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusPill tone="warning">{locale === "en" ? "Leadership request" : "Yêu cầu đội trưởng"}</StatusPill>
                          <StatusPill>{formatDateLabel(locale, request.createdAt)}</StatusPill>
                        </div>
                        <p className="mt-4 text-lg font-semibold theme-text-strong">{team.name}</p>
                        <p className="mt-2 text-sm leading-7 theme-text-muted">
                          {locale === "en"
                            ? `${requester?.name ?? "The current leader"} wants to transfer leadership of ${team.name} to you.`
                            : `${requester?.name ?? "Đội trưởng hiện tại"} muốn chuyển quyền đội trưởng của ${team.name} cho bạn.`}
                        </p>
                        {!hasProfilePhoneNumber ? (
                          <div className="mt-4">
                            <PhoneRequirementNotice
                              title={
                                locale === "en"
                                  ? "Phone number required before accepting leadership"
                                  : "Cần có số điện thoại trước khi nhận quyền đội trưởng"
                              }
                              description={
                                locale === "en"
                                  ? "Update your profile with a phone number first. The platform only lets members with a recorded phone number accept leadership transfer."
                                  : "Hãy cập nhật hồ sơ với số điện thoại trước. Hệ thống chỉ cho phép thành viên đã có số điện thoại nhận quyền đội trưởng."
                              }
                              actionLabel={locale === "en" ? "Update profile" : "Cập nhật hồ sơ"}
                            />
                          </div>
                        ) : null}
                        <div className="mt-4 flex flex-wrap gap-3">
                          <button
                            type="button"
                            disabled={acceptLeadershipDisabled}
                            onClick={() => respondToLeadershipTransfer(request.id, "accept")}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Crown className="h-4 w-4" />
                            {locale === "en" ? "Accept leadership" : "Chấp nhận đội trưởng"}
                          </button>
                          <button
                            type="button"
                            onClick={() => respondToLeadershipTransfer(request.id, "decline")}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl border theme-border-strong theme-panel px-4 py-3 text-sm font-semibold theme-text-strong"
                          >
                            {locale === "en" ? "Decline" : "Tu choi"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </Surface>
                );
              })}

              {outgoingLeadershipTransfer ? (
                <Surface className="border border-violet-300/20 px-5 py-5">
                  <div className="flex items-start gap-4">
                    <div className="theme-brand-gradient flex h-14 w-14 items-center justify-center rounded-2xl text-white">
                      <Crown className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusPill>{locale === "en" ? "Awaiting response" : "Đang chờ phản hồi"}</StatusPill>
                        <StatusPill>{formatDateLabel(locale, outgoingLeadershipTransfer.createdAt)}</StatusPill>
                      </div>
                      <p className="mt-4 text-lg font-semibold theme-text-strong">
                        {locale === "en" ? "Leadership transfer request sent" : "Đã gửi yêu cầu chuyển đội trưởng"}
                      </p>
                      <p className="mt-2 text-sm leading-7 theme-text-muted">
                        {locale === "en"
                          ? `${users.find((user) => user.id === outgoingLeadershipTransfer.toUserId)?.name ?? "The selected member"} must accept before you can leave the team.`
                          : `${users.find((user) => user.id === outgoingLeadershipTransfer.toUserId)?.name ?? "Thành viên được chọn"} phải chấp nhận trước khi bạn có thể rời đội.`}
                      </p>
                    </div>
                  </div>
                </Surface>
              ) : null}

              {currentTeam && currentTeam.round1LockStatus === "pending" && isLeader ? (
                <Surface className="border border-cyan-300/20 px-5 py-5">
                  <div className="flex items-start gap-4">
                    <div className="theme-brand-gradient flex h-14 w-14 items-center justify-center rounded-2xl text-white">
                      <LockKeyhole className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusPill>{locale === "en" ? "Awaiting approvals" : "Đang chờ xác nhận"}</StatusPill>
                        {currentTeam.round1LockRequestedAt ? (
                          <StatusPill>{formatDateLabel(locale, currentTeam.round1LockRequestedAt)}</StatusPill>
                        ) : null}
                      </div>
                      <p className="mt-4 text-lg font-semibold theme-text-strong">
                        {locale === "en" ? "Round 1 team lock is in progress" : "Quy trình khóa đội cho Vòng 1 đang diễn ra"}
                      </p>
                      <p className="mt-2 text-sm leading-7 theme-text-muted">
                        {pendingTeamLockApprovals.length > 0
                          ? locale === "en"
                            ? `Still waiting for ${pendingTeamLockApprovals.map((request) => users.find((user) => user.id === request.toUserId)?.name ?? "a teammate").join(", ")}.`
                            : `Đội vẫn đang chờ ${pendingTeamLockApprovals.map((request) => users.find((user) => user.id === request.toUserId)?.name ?? "một đồng đội").join(", ")} xác nhận.`
                          : locale === "en"
                            ? "All member approvals have been collected. The roster will lock immediately."
                            : "Đã thu đủ xác nhận của các thành viên. Đội hình sẽ được khóa ngay."}
                      </p>
                    </div>
                  </div>
                </Surface>
              ) : null}

              {currentTeam && currentTeam.round1LockStatus === "declined" ? (
                <Surface className="border border-rose-300/20 px-5 py-5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/14 text-rose-200">
                      <LockKeyhole className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusPill tone="warning">
                          {locale === "en" ? "Lock workflow stopped" : "Quy trình khóa đội đã dừng"}
                        </StatusPill>
                        {currentTeam.round1LockDeclinedAt ? (
                          <StatusPill>{formatDateLabel(locale, currentTeam.round1LockDeclinedAt)}</StatusPill>
                        ) : null}
                      </div>
                      <p className="mt-4 text-lg font-semibold theme-text-strong">
                        {locale === "en" ? "A member declined the previous lock request" : "Có thành viên đã từ chối yêu cầu khóa đội trước đó"}
                      </p>
                      <p className="mt-2 text-sm leading-7 theme-text-muted">
                        {locale === "en"
                          ? `${declinedLockUser?.name ?? "A team member"} declined the previous lock request. The leader must restart the workflow before anyone can enter Round 1.`
                          : `${declinedLockUser?.name ?? "Một thành viên"} đã từ chối yêu cầu khóa đội trước đó. Đội trưởng cần khởi động lại quy trình trước khi bất kỳ ai được vào Vòng 1.`}
                      </p>
                    </div>
                  </div>
                </Surface>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      <section>
        <Surface className="px-5 py-5 md:px-6 md:py-6">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
            <div className="min-w-0">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                {currentTeam ? (
                  <div className="relative w-fit shrink-0">
                    <GradientAvatar
                      label={teamForm.name || currentTeam.name}
                      tone={teamForm.avatarTone}
                      imageSrc={teamForm.avatarImageSrc}
                      className="h-16 w-16 rounded-[1.35rem] text-lg md:h-20 md:w-20"
                    />
                    {isLeader ? (
                      <label
                        className="theme-button-primary absolute -bottom-2 -right-2 inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-white/50 p-0 shadow-[0_14px_30px_rgba(14,165,233,0.28)] transition hover:-translate-y-0.5"
                        aria-label={locale === "en" ? "Upload team avatar" : "Tải avatar đội"}
                        title={locale === "en" ? "Upload team avatar" : "Tải avatar đội"}
                      >
                        <Camera className="h-4 w-4" />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(event) => {
                            void handleTeamAvatarUpload(event);
                          }}
                          className="hidden"
                        />
                      </label>
                    ) : null}
                  </div>
                ) : null}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="theme-heading text-3xl font-semibold theme-text-strong md:text-[2.35rem]">
                      {currentTeam ? currentTeam.name : pickText(locale, pageContent.workspace.noTeamTitle)}
                    </h1>
                    {currentTeam ? (
                      <span className="inline-flex items-center rounded-full border theme-border theme-panel px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] theme-text-soft">
                        {locale === "en" ? "Team code" : "Mã đội"} · {currentTeam.tag}
                      </span>
                    ) : null}
                    {currentTeam ? (
                      <>
                        <StatusPill>{`${teamReadinessCount}/${TEAM_MAX_MEMBERS} ${locale === "en" ? "members" : "thành viên"}`}</StatusPill>
                        <StatusPill
                          tone={
                            currentTeam.round1LockStatus === "locked"
                              ? "success"
                              : currentTeam.round1LockStatus === "pending" || currentTeam.round1LockStatus === "declined"
                                ? "warning"
                                : "info"
                          }
                        >
                          {pickRound1LockStatusLabel(locale, currentTeam.round1LockStatus)}
                        </StatusPill>
                      </>
                    ) : null}
                  </div>
                  <p className="mt-3 max-w-3xl text-sm leading-6 theme-text-muted">
                    {currentTeam
                      ? currentTeam.bio || pickText(locale, pageContent.workspace.teamDescription)
                      : pickText(locale, pageContent.workspace.noTeamDescription)}
                  </p>
                  {teamAvatarError ? <p className="mt-3 text-xs leading-6 text-rose-300">{teamAvatarError}</p> : null}
                  {!currentTeam ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      <StatusPill tone="default">
                        {locale === "en" ? "No team yet" : "Chưa có đội"}
                      </StatusPill>
                      <StatusPill>{`${teamReadinessCount}/${TEAM_MAX_MEMBERS} ${locale === "en" ? "members" : "thành viên"}`}</StatusPill>
                    </div>
                  ) : null}

                  {currentTeam ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {hasAnyTeamRound1Result || currentCompetitionState === "round-1" ? (
                        <Link
                          href={
                            hasAnyTeamRound1Result
                              ? "/dashboard#round1-result"
                              : canStartRound1Exam
                                ? "/round-1"
                                : "/dashboard#round1-lock"
                          }
                          className="theme-button-primary inline-flex items-center justify-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold"
                        >
                          <ArrowRight className="h-3.5 w-3.5" />
                          {hasAnyTeamRound1Result
                            ? locale === "en"
                              ? "View Round 1 result"
                              : "Xem kết quả Vòng 1"
                            : canStartRound1Exam
                              ? locale === "en"
                                ? "Open Round 1 exam"
                                : "Mở bài thi Vòng 1"
                              : locale === "en"
                                ? "Review team lock"
                                : "Xem khóa đội"}
                        </Link>
                      ) : null}
                      {canAccessAdminMode ? (
                        <Link
                          href="/admin"
                          className="inline-flex items-center justify-center gap-1.5 rounded-full border theme-border theme-panel px-3.5 py-2 text-xs font-semibold theme-text-strong"
                        >
                          Admin
                        </Link>
                      ) : null}
                      {roundJumpTargets.length > 0 ? (
                        <div className="inline-flex flex-wrap items-center gap-1.5 rounded-[1.1rem] border theme-border theme-panel px-1 py-1">
                          {roundJumpTargets.map((target) => {
                            const Icon = target.icon;
                            const roundLabel = pickRoundLabel(locale, target.round);

                            return (
                              <div key={target.round} className="group relative">
                                <button
                                  type="button"
                                  aria-label={
                                    locale === "en"
                                      ? `Scroll to ${pickRoundLabel(locale, target.round)}`
                                      : `Cuộn tới ${pickRoundLabel(locale, target.round)}`
                                  }
                                  onClick={() => scrollToDashboardSection(target.sectionId)}
                                  className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-1.5 text-[0.72rem] font-semibold transition hover:-translate-y-0.5 active:translate-y-0 ${target.buttonClass}`}
                                >
                                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/58 dark:bg-white/12">
                                    <Icon className="h-3.5 w-3.5" />
                                  </span>
                                  <span>{roundLabel}</span>
                                </button>
                                <span className="theme-header-tooltip pointer-events-none absolute left-1/2 top-full z-30 mt-3 -translate-x-1/2 whitespace-nowrap rounded-full px-3 py-1.5 text-[0.68rem] font-medium opacity-0 transition duration-200 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100">
                                  {locale === "en"
                                    ? `Scroll to ${roundLabel}`
                                    : `Cuộn tới ${roundLabel}`}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="grid gap-3">
              <div className="rounded-[1.35rem] border theme-border theme-panel-subtle px-4 py-4">
                <div className="flex items-center gap-3">
                  <div className="theme-brand-gradient flex h-11 w-11 shrink-0 items-center justify-center rounded-[1rem] text-sm font-semibold text-white">
                    {currentTeam ? <ShieldCheck className="h-6 w-6" /> : teamReadinessCount}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[0.68rem] uppercase tracking-[0.2em] theme-text-soft">
                      {locale === "en" ? "Current stage" : "Vị trí hiện tại"}
                    </p>
                    <p className="mt-2 whitespace-nowrap text-base font-semibold leading-6 theme-text-strong">
                      {currentTeam ? pickTeamDisplayStatusLabel(locale, currentTeam, new Date(), timelineItems) : "--"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Surface>
      </section>

      {currentTeam ? (
        <>
          <section className="space-y-6">
            <Surface className="px-6 py-6 md:px-8 md:py-8">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-200/80">
                  {locale === "en" ? "Roster & actions" : "Đội hình và thao tác"}
                </p>
              </div>

              <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(360px,1.1fr)_minmax(0,0.9fr)]">
                <div className="space-y-4 xl:order-2">
                  <div className="rounded-[1.5rem] border theme-border theme-panel-subtle px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-200/80">
                      {locale === "en" ? "Official roster" : "Đội hình chính thức"}
                    </p>
                    <p className="mt-2 text-sm font-semibold theme-text-strong">
                      {locale === "en" ? "Official team member list" : "Danh sách thành viên chính thức"}
                    </p>
                    <div className="mt-4 space-y-3">
                      {currentTeamMembers.map((member) => (
                        <Link
                          key={member.id}
                          href={`/users/${member.id}`}
                          className="flex items-center justify-between gap-3 rounded-[1.5rem] border theme-border theme-panel px-4 py-4 transition hover:-translate-y-0.5 hover:border-sky-400/40"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <GradientAvatar label={member.name} tone={member.avatarTone} imageSrc={member.avatarImageSrc} />
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold theme-text-strong">{member.name}</p>
                              <p className="truncate text-xs theme-text-soft">
                                {member.major} · {member.university}
                              </p>
                            </div>
                          </div>
                          <StatusPill tone={member.id === currentTeam.leaderId ? "success" : "default"}>
                            {member.id === currentTeam.leaderId
                              ? locale === "en"
                                ? "Leader"
                                : "Đội trưởng"
                              : locale === "en"
                                ? "Member"
                                : "Thành viên"}
                          </StatusPill>
                        </Link>
                      ))}
                    </div>
                  </div>

                  {sentInvitations.length > 0 ? (
                    <div className="rounded-[1.5rem] border theme-border theme-panel-subtle px-4 py-4">
                      <p className="text-sm font-semibold theme-text-strong">
                        {locale === "en" ? "Pending sent invites" : "Lời mời đã gửi"}
                      </p>
                      <div className="mt-3 space-y-2">
                        {sentInvitations.map((invitation) => {
                          const targetUser = users.find((user) => user.id === invitation.toUserId);
                          const canRecallThisInvite = Boolean(
                            isLeader || invitation.fromUserId === activeUserId,
                          );

                          return (
                            <div
                              key={invitation.id}
                              className="flex items-center justify-between gap-3 rounded-[1.2rem] border theme-border bg-white/60 px-3 py-3 text-sm dark:bg-white/4"
                            >
                              <div className="flex min-w-0 items-center gap-3">
                                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-sky-400/24 bg-sky-400/12 text-sky-700 dark:text-sky-100">
                                  <MailPlus className="h-4 w-4" />
                                </span>
                                <div className="min-w-0">
                                  <p className="truncate font-semibold theme-text-strong">
                                    {targetUser?.name ?? invitation.toUserId}
                                  </p>
                                  <p className="mt-1 truncate text-xs theme-text-soft">
                                    {targetUser?.email ?? (locale === "en" ? "Pending student" : "Sinh viên đang chờ")} · {formatDateLabel(locale, invitation.createdAt)}
                                  </p>
                                </div>
                              </div>
                              <button
                                type="button"
                                disabled={!canRecallThisInvite}
                                onClick={() => setPendingRecallInvitationId(invitation.id)}
                                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-rose-400/24 bg-rose-400/10 text-rose-700 transition hover:bg-rose-400/16 disabled:cursor-not-allowed disabled:opacity-40 dark:text-rose-100"
                                aria-label={locale === "en" ? "Recall invitation" : "Thu hồi lời mời"}
                                title={locale === "en" ? "Recall invitation" : "Thu hồi lời mời"}
                              >
                                <Undo2 className="h-4 w-4" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="space-y-4 xl:order-1">
              <div className="rounded-[1.5rem] border theme-border theme-panel-subtle px-4 py-4">
                <p className="text-sm font-semibold theme-text-strong">
                  {locale === "en" ? "Team actions" : "Thao tác của đội"}
                </p>
                <p className="mt-2 text-sm leading-7 theme-text-muted">
                  {locale === "en"
                    ? "Only the team leader can submit Round 2 reports and final-round files. Teams may submit unlimited versions, but only the latest version is valid."
                    : "Chỉ đội trưởng mới có thể nộp báo cáo Vòng 2 và tệp của vòng chung kết. Đội có thể nộp không giới hạn phiên bản, nhưng chỉ phiên bản mới nhất mới hợp lệ."}
                </p>

                <div className="mt-4 grid gap-3">
                  <label className="block space-y-2">
                    <span className="text-sm theme-text-muted">
                      {locale === "en" ? "Transfer leadership" : "Chuyển đội trưởng"}
                    </span>
                    <div ref={leadershipMenuRef} className="relative">
                      <button
                        type="button"
                        disabled={!isLeader || Boolean(outgoingLeadershipTransfer) || teamRosterLocked}
                        onClick={() => setIsLeadershipMenuOpen((current) => !current)}
                        className="flex w-full items-center justify-between gap-3 rounded-2xl border theme-border theme-panel px-4 py-3.5 text-left text-sm font-semibold theme-text-strong outline-none transition hover:border-sky-400/34 hover:bg-white/78 focus:border-sky-400/50 focus:ring-4 focus:ring-sky-400/12 disabled:cursor-not-allowed disabled:opacity-45 dark:hover:bg-white/8"
                      >
                        <span className="min-w-0">
                          <span className="block truncate">
                            {selectedLeadershipTarget?.name ?? (locale === "en" ? "Select teammate" : "Chọn thành viên")}
                          </span>
                          {selectedLeadershipTarget ? (
                            <span className="mt-1 block truncate text-xs font-medium theme-text-soft">
                              {selectedLeadershipTarget.major} · {selectedLeadershipTarget.university}
                            </span>
                          ) : null}
                        </span>
                        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border theme-border bg-white/65 theme-text-soft dark:bg-white/8">
                          <ChevronDown className={`h-4 w-4 transition-transform ${isLeadershipMenuOpen ? "rotate-180" : ""}`} />
                        </span>
                      </button>

                      {isLeadershipMenuOpen ? (
                        <div className="theme-auth-university-menu theme-panel-strong absolute left-0 right-0 top-[calc(100%+0.55rem)] z-30 rounded-[1.35rem] border theme-border p-2 shadow-[0_22px_55px_rgba(15,23,42,0.14)]">
                          <div className="max-h-64 space-y-1 overflow-y-auto pr-1">
                            {leadershipTransferOptions.length > 0 ? (
                              leadershipTransferOptions.map((member) => (
                                <button
                                  key={member.id}
                                  type="button"
                                  onMouseDown={(event) => event.preventDefault()}
                                  onClick={() => {
                                    setLeadershipTargetId(member.id);
                                    setIsLeadershipMenuOpen(false);
                                  }}
                                  className={`flex w-full items-center justify-between gap-3 rounded-[1rem] px-3 py-3 text-left text-sm transition hover:bg-[rgba(23,114,208,0.06)] ${
                                    leadershipTargetId === member.id ? "bg-sky-500/10" : ""
                                  }`}
                                >
                                  <span className="min-w-0">
                                    <span className="block truncate font-semibold theme-text-strong">{member.name}</span>
                                    <span className="mt-1 block truncate text-xs theme-text-soft">
                                      {member.major} · {member.university}
                                    </span>
                                  </span>
                                  <span className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.22em] theme-text-faint">
                                    {locale === "en" ? "Pick" : "Chọn"}
                                  </span>
                                </button>
                              ))
                            ) : (
                              <div className="rounded-[1rem] px-3 py-3 text-sm leading-6 theme-text-muted">
                                {locale === "en" ? "No teammate is available for transfer." : "Chưa có thành viên phù hợp để chuyển quyền."}
                              </div>
                            )}
                          </div>
                        </div>
                      ) : null}
                      <select
                        disabled={!isLeader || Boolean(outgoingLeadershipTransfer) || teamRosterLocked}
                        value={leadershipTargetId}
                        onChange={(event) => setLeadershipTargetId(event.target.value)}
                        className="sr-only"
                      >
                        <option value="" className="bg-slate-950">
                          {locale === "en" ? "Select teammate" : "Chọn thành viên"}
                        </option>
                        {currentTeamMembers
                          .filter((member) => member.id !== activeUserId)
                          .map((member) => (
                            <option key={member.id} value={member.id} className="bg-slate-950">
                              {member.name}
                            </option>
                          ))}
                      </select>
                      <span className="hidden">
                        <ChevronDown className="h-4 w-4" />
                      </span>
                    </div>
                  </label>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      disabled={!isLeader || !leadershipTargetId || Boolean(outgoingLeadershipTransfer) || teamRosterLocked}
                      onClick={() => {
                        transferLeadership(leadershipTargetId);
                        setLeadershipTargetId("");
                        setIsLeadershipMenuOpen(false);
                      }}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border theme-border-strong theme-panel px-4 py-3 text-sm font-semibold theme-text-strong disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Crown className="h-4 w-4" />
                      {locale === "en" ? "Send leadership request" : "Gửi yêu cầu đội trưởng"}
                    </button>
                    <button
                      type="button"
                      disabled={teamRosterLocked}
                      onClick={leaveCurrentTeam}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border theme-border-strong theme-panel px-4 py-3 text-sm font-semibold theme-text-strong disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <LogOut className="h-4 w-4" />
                      {locale === "en" ? "Leave current team" : "Rời đội hiện tại"}
                    </button>
                  </div>
                </div>

                <div className="mt-4 rounded-[1.25rem] border theme-border bg-white/60 px-4 py-4 text-sm leading-7 theme-text-muted dark:bg-white/4">
                  {teamRosterLocked
                    ? currentTeam.round1LockStatus === "pending"
                      ? locale === "en"
                        ? "Roster changes are frozen while the Round 1 lock workflow is pending."
                        : "Mọi thay đổi đội hình đang bị đóng băng trong khi quy trình khóa đội cho Vòng 1 còn chờ phản hồi."
                      : locale === "en"
                        ? "This team roster is already locked, so leadership transfer and leaving the team are no longer available."
                        : "Đội hình của đội này đã bị khóa nên việc chuyển đội trưởng và rời đội đều không còn khả dụng."
                    : isLeader
                      ? locale === "en"
                        ? "The leader must send a transfer request and wait for the selected member to accept before leaving."
                        : "Đội trưởng phải gửi yêu cầu chuyển quyền và chờ thành viên được chọn chấp nhận trước khi rời đội."
                      : locale === "en"
                        ? "As a regular member, this account can leave immediately."
                        : "Với vai trò thành viên thường, tài khoản này có thể rời đội ngay."}
                </div>

                {outgoingLeadershipTransfer ? (
                  <div className="mt-4 rounded-[1.25rem] border theme-border bg-white/60 px-4 py-4 text-sm leading-7 theme-text-muted dark:bg-white/4">
                    {locale === "en"
                      ? `Waiting for ${users.find((user) => user.id === outgoingLeadershipTransfer.toUserId)?.name ?? "the selected member"} to accept the leadership transfer request.`
                      : `Đang chờ ${users.find((user) => user.id === outgoingLeadershipTransfer.toUserId)?.name ?? "thành viên được chọn"} chấp nhận yêu cầu chuyển đội trưởng.`}
                  </div>
                ) : null}
              </div>

              <div className="rounded-[1.5rem] border theme-border theme-panel-subtle px-4 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold theme-text-strong">
                      {locale === "en" ? "Invite teammates" : "Mời thành viên"}
                    </p>
                    <p className="mt-2 text-sm leading-7 theme-text-muted">
                      {teamRosterLocked
                        ? currentTeam.round1LockStatus === "pending"
                          ? locale === "en"
                            ? "The Round 1 lock workflow is running, so invites are paused until every current member responds."
                            : "Quy trình khóa đội cho Vòng 1 đang diễn ra nên việc mời thêm người tạm dừng cho tới khi toàn bộ thành viên hiện tại phản hồi."
                          : locale === "en"
                            ? "This roster is already locked, so the team can no longer invite additional members."
                            : "Đội hình này đã được khóa nên đội không thể mời thêm thành viên mới nữa."
                        : isTeamFull
                          ? isLeader
                            ? locale === "en"
                              ? "Your team already has 5 members, so new invitations are disabled."
                              : "Đội của bạn đã có 5 thành viên, vì vậy hệ thống đã tắt việc mời thêm người."
                            : locale === "en"
                              ? "This team already has 5 members, so the invite list is locked."
                              : "Đội này đã có 5 thành viên, vì vậy danh sách mời đã bị khóa."
                          : openSlots <= 0
                            ? locale === "en"
                              ? "All remaining slots are currently reserved by pending invites."
                              : "Tất cả chỗ trống còn lại hiện đang được giữ bởi các lời mời đang chờ."
                            : locale === "en"
                              ? "Search student accounts, then confirm eligibility before sending an invitation."
                              : "Tìm tài khoản sinh viên và xác nhận điều kiện trước khi gửi lời mời."}
                    </p>
                  </div>
                  <StatusPill tone={teamRosterLocked || isTeamFull ? "warning" : "info"}>
                    {teamRosterLocked
                      ? locale === "en"
                        ? "Roster locked"
                        : "Đội hình đã khóa"
                      : `${openSlots} ${locale === "en" ? "slots left" : "chỗ trống"}`}
                  </StatusPill>
                </div>

                <label className="mt-4 block">
                  <span className="sr-only">
                    {locale === "en" ? "Search available students" : "Tìm sinh viên còn trống"}
                  </span>
                  <div className="flex items-center gap-3 rounded-2xl border theme-border theme-panel px-4 py-3">
                    <Search className="h-4 w-4 theme-text-faint" />
                    <input
                      value={inviteSearch}
                      disabled={isTeamFull || teamRosterLocked}
                      onChange={(event) => setInviteSearch(event.target.value)}
                      placeholder={locale === "en" ? "Search by name, email, university..." : "Tìm theo tên, email, trường..."}
                      className="theme-placeholder w-full bg-transparent text-sm theme-text-strong outline-none disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </div>
                </label>

                <div className="mt-4 max-h-[420px] space-y-3 overflow-y-auto pr-1">
                  {filteredAvailableUsers.map((user) => {
                    const userTeam = getTeamForUser(user.id, teams);
                    const isInAnotherTeam = Boolean(userTeam && userTeam.id !== currentTeam.id);
                    const alreadyInvited = sentInvitations.some((invitation) => invitation.toUserId === user.id);
                    const canOpenInviteConfirm = Boolean(
                      isLeader && !alreadyInvited && openSlots > 0 && !isTeamFull && !teamRosterLocked,
                    );

                    return (
                      <div
                        key={user.id}
                        className="flex flex-col gap-4 rounded-[1.35rem] border theme-border bg-white/60 px-4 py-4 dark:bg-white/4 md:flex-row md:items-center md:justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <GradientAvatar label={user.name} tone={user.avatarTone} imageSrc={user.avatarImageSrc} />
                          <div>
                            <p className="text-sm font-semibold theme-text-strong">{user.name}</p>
                            <p className="text-xs theme-text-soft">{user.university}</p>
                            <p className="mt-1 text-xs theme-text-faint">{user.major}</p>
                            {isInAnotherTeam ? (
                              <p className="mt-2 text-xs font-semibold text-amber-700 dark:text-amber-200">
                                {locale === "en"
                                  ? `Already in ${userTeam?.name ?? "another team"}`
                                  : `Đã ở ${userTeam?.name ?? "một đội khác"}`}
                              </p>
                            ) : null}
                          </div>
                        </div>
                        <button
                          type="button"
                          disabled={!canOpenInviteConfirm}
                          onClick={() => setPendingInviteUserId(user.id)}
                          className="inline-flex items-center justify-center gap-2 rounded-2xl border theme-border-strong theme-panel px-4 py-3 text-sm font-semibold theme-text-strong disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <UserPlus2 className="h-4 w-4" />
                          {alreadyInvited
                            ? locale === "en"
                              ? "Invite pending"
                              : "Đang chờ"
                            : isInAnotherTeam
                              ? locale === "en"
                                ? "Review"
                                : "Xem thông tin"
                            : locale === "en"
                              ? "Invite"
                              : "Mời vào đội"}
                        </button>
                      </div>
                    );
                  })}

                  {filteredAvailableUsers.length === 0 ? (
                    <div className="rounded-[1.35rem] border theme-border bg-white/60 px-4 py-4 text-sm leading-7 theme-text-muted dark:bg-white/4">
                      {teamRosterLocked
                        ? locale === "en"
                          ? "Roster changes are locked right now, so the invite list is intentionally disabled."
                          : "Đội hình hiện đang bị khóa nên danh sách mời thêm thành viên đang được tắt có chủ đích."
                        : !inviteSearch.trim()
                          ? locale === "en"
                            ? "Start typing in the search box to look for student accounts."
                            : "Hãy bắt đầu gõ trong ô tìm kiếm để tìm tài khoản sinh viên."
                        : inviteSearch.trim()
                          ? locale === "en"
                            ? "No student accounts match this search."
                            : "Không có tài khoản sinh viên phù hợp với từ khóa tìm kiếm này."
                          : locale === "en"
                            ? "No student accounts are available right now."
                            : "Hiện không có tài khoản sinh viên nào để hiển thị."}
                    </div>
                  ) : null}
                </div>
              </div>
                </div>
              </div>
            </Surface>
          </section>

          <section id="round-1-section" className="scroll-mt-36">
            <Surface className="px-6 py-6 md:px-8 md:py-8">
              <div id="round1-lock" />
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-3xl">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-200/80">
                    {locale === "en" ? "Round 1 team lock" : "Khóa đội cho Vòng 1"}
                  </p>
                  <p className="theme-heading mt-4 text-3xl font-semibold theme-text-strong">
                    {locale === "en"
                      ? "Freeze the roster before anyone enters the individual exam."
                      : "Chốt đội hình trước khi bất kỳ ai bước vào bài thi cá nhân."}
                  </p>
                  <p className="mt-4 text-sm leading-7 theme-text-muted">
                    {currentTeam.stage !== "round-1"
                      ? locale === "en"
                        ? "This team has already moved beyond Round 1, so its roster is now treated as fixed."
                        : "Đội này đã đi qua Vòng 1 nên đội hình hiện được xem là cố định."
                      : currentTeam.round1LockStatus === "open"
                        ? locale === "en"
                          ? "The leader must start the lock workflow, then every current member has to approve the fixed roster. Until that happens, nobody can start Round 1."
                          : "Đội trưởng phải khởi động quy trình khóa đội, sau đó toàn bộ thành viên hiện tại phải cùng xác nhận đội hình cố định. Trước khi hoàn tất bước này, chưa ai được bắt đầu Vòng 1."
                        : currentTeam.round1LockStatus === "pending"
                          ? locale === "en"
                            ? "The lock workflow is live. Team invites, leaving the team, and leadership transfer are all paused until every current member responds."
                            : "Quy trình khóa đội đang hoạt động. Việc mời thêm người, rời đội và chuyển đội trưởng đều tạm dừng cho đến khi tất cả thành viên hiện tại phản hồi."
                          : currentTeam.round1LockStatus === "declined"
                            ? locale === "en"
                              ? "A previous lock request was declined. The team must align again, then the leader can restart the workflow."
                              : "Một yêu cầu khóa đội trước đó đã bị từ chối. Cả đội cần thống nhất lại, sau đó đội trưởng mới có thể khởi động lại quy trình."
                            : locale === "en"
                              ? "The roster is locked. No more member changes are allowed, and members can now continue into the Round 1 exam window."
                              : "Đội hình đã được khóa. Không còn được thay đổi thành viên, và các thành viên giờ có thể tiếp tục vào khung bài thi Vòng 1."}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <StatusPill
                    tone={
                      currentTeam.round1LockStatus === "locked"
                        ? "success"
                        : currentTeam.round1LockStatus === "pending" || currentTeam.round1LockStatus === "declined"
                          ? "warning"
                          : "info"
                    }
                  >
                    {pickRound1LockStatusLabel(locale, currentTeam.round1LockStatus)}
                  </StatusPill>
                  {round1Window ? (
                    <StatusPill>{formatDateRangeLabel(locale, round1Window.startDate, round1Window.endDate)}</StatusPill>
                  ) : null}
                </div>
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-[1.5rem] border theme-border theme-panel-subtle px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.22em] theme-text-soft">
                    {locale === "en" ? "Current members" : "Thành viên hiện tại"}
                  </p>
                  <p className="mt-3 text-3xl font-semibold theme-text-strong">
                    {currentTeam.memberIds.length}
                  </p>
                  <p className="mt-2 text-sm theme-text-soft">
                    {locale === "en"
                      ? "The full current roster must approve this lock."
                      : "Toàn bộ đội hình hiện tại phải cùng đồng ý khóa đội."}
                  </p>
                </div>
                <div className="rounded-[1.5rem] border theme-border theme-panel-subtle px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.22em] theme-text-soft">
                    {locale === "en" ? "Leader action" : "Thao tác đội trưởng"}
                  </p>
                  <p className="mt-3 text-lg font-semibold theme-text-strong">
                    {currentTeam.leaderId === activeUserId
                      ? locale === "en"
                        ? "You control this step"
                        : "Bạn là người điều phối bước này"
                      : locale === "en"
                        ? `${users.find((user) => user.id === currentTeam.leaderId)?.name ?? "Leader"} starts the workflow`
                        : `${users.find((user) => user.id === currentTeam.leaderId)?.name ?? "Đội trưởng"} sẽ khởi động quy trình`}
                  </p>
                  <p className="mt-2 text-sm theme-text-soft">
                    {locale === "en"
                      ? "Only the current leader can start or restart the team lock."
                      : "Chỉ đội trưởng hiện tại mới có thể bắt đầu hoặc khởi động lại bước khóa đội."}
                  </p>
                </div>
                <div className="rounded-[1.5rem] border theme-border theme-panel-subtle px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.22em] theme-text-soft">
                    {locale === "en" ? "Approval progress" : "Tiến độ xác nhận"}
                  </p>
                  <p className="mt-3 text-3xl font-semibold theme-text-strong">
                    {currentTeam.round1LockStatus === "locked"
                      ? currentTeam.memberIds.length
                      : 1 + currentTeamRound1LockRequests.filter((request) => request.status === "accepted").length}
                    <span className="ml-2 text-base theme-text-soft">/ {currentTeam.memberIds.length}</span>
                  </p>
                  <p className="mt-2 text-sm theme-text-soft">
                    {locale === "en"
                      ? "Leader initiation counts first, then every teammate must approve."
                      : "Đội trưởng khởi tạo được tính trước, sau đó từng đồng đội còn lại phải xác nhận."}
                  </p>
                </div>
                <div className="rounded-[1.5rem] border theme-border theme-panel-subtle px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.22em] theme-text-soft">
                    {locale === "en" ? "Round 1 access" : "Quyền vào Vòng 1"}
                  </p>
                  <p className="mt-3 text-lg font-semibold theme-text-strong">
                    {teamRound1Locked && !round1Finished
                      ? locale === "en"
                        ? "Ready for exam"
                        : "Sẵn sàng vào thi"
                      : round1Finished
                        ? locale === "en"
                          ? "Round 1 closed"
                          : "Vòng 1 đã đóng"
                        : locale === "en"
                          ? "Blocked until lock"
                          : "Chặn cho tới khi khóa đội"}
                  </p>
                  <p className="mt-2 text-sm theme-text-soft">
                    {teamRound1Locked && !round1Finished
                      ? locale === "en"
                        ? "Members can enter the exam one time each."
                        : "Các thành viên có thể vào bài thi, mỗi người một lần."
                      : locale === "en"
                        ? "Nobody can start Round 1 while the team is still unlocked."
                        : "Chưa thành viên nào được vào Vòng 1 khi đội vẫn chưa khóa."}
                  </p>
                </div>
              </div>

              <div className="mt-8 rounded-[1.8rem] border theme-border theme-panel px-5 py-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-semibold theme-text-strong">
                    {locale === "en" ? "Member approval board" : "Bảng xác nhận thành viên"}
                  </p>
                  <StatusPill
                    tone={
                      currentTeam.round1LockStatus === "locked"
                        ? "success"
                        : currentTeam.round1LockStatus === "pending" || currentTeam.round1LockStatus === "declined"
                          ? "warning"
                          : "default"
                    }
                  >
                    {pickRound1LockStatusLabel(locale, currentTeam.round1LockStatus)}
                  </StatusPill>
                </div>
                <div className="mt-5 overflow-x-auto pb-2 [scrollbar-width:thin]">
                  <div className="flex min-w-max gap-3">
                    {currentTeamMembers.map((member) => {
                      const lockRequest = currentTeamRound1LockRequestByUserId.get(member.id);
                      const approvalStatus =
                        member.id === currentTeam.leaderId
                          ? currentTeam.round1LockStatus === "open" || currentTeam.round1LockStatus === "declined"
                            ? "standby"
                            : "initiated"
                          : lockRequest?.status ?? (currentTeam.round1LockStatus === "locked" ? "accepted" : "standby");
                      const approvalTone =
                        approvalStatus === "accepted" || approvalStatus === "initiated"
                          ? "success"
                          : approvalStatus === "declined"
                            ? "warning"
                            : approvalStatus === "pending"
                              ? "warning"
                              : "default";

                      return (
                        <div
                          key={member.id}
                          className="w-[260px] shrink-0 rounded-[1.4rem] border theme-border theme-panel-subtle px-4 py-4"
                        >
                          <div className="flex items-center gap-3">
                            <GradientAvatar
                              label={member.name}
                              tone={member.avatarTone}
                              imageSrc={member.avatarImageSrc}
                            />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold theme-text-strong">{member.name}</p>
                              <p className="text-xs theme-text-soft">
                                {member.id === currentTeam.leaderId
                                  ? locale === "en"
                                    ? "Current leader"
                                    : "Đội trưởng hiện tại"
                                  : locale === "en"
                                    ? "Team member"
                                    : "Thành viên đội"}
                              </p>
                            </div>
                          </div>
                          <div className="mt-4 flex flex-wrap items-center gap-2">
                            <StatusPill tone={approvalTone}>
                              {approvalStatus === "accepted"
                                ? locale === "en"
                                  ? "Approved"
                                  : "Đã đồng ý"
                                : approvalStatus === "pending"
                                  ? locale === "en"
                                    ? "Awaiting response"
                                    : "Đang chờ phản hồi"
                                  : approvalStatus === "declined"
                                    ? locale === "en"
                                      ? "Declined"
                                      : "Đã từ chối"
                                    : approvalStatus === "initiated"
                                      ? locale === "en"
                                        ? "Initiated by leader"
                                        : "Đội trưởng đã khởi tạo"
                                      : locale === "en"
                                        ? "Standby"
                                        : "Đang chờ bắt đầu"}
                            </StatusPill>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                {currentTeam.stage === "round-1" ? (
                  <button
                    type="button"
                    disabled={!canInitiateTeamLock}
                    onClick={initiateRound1TeamLock}
                    className="theme-button-primary inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <LockKeyhole className="h-4 w-4" />
                    {currentTeam.round1LockStatus === "declined"
                      ? locale === "en"
                        ? "Restart team lock"
                        : "Khởi động lại khóa đội"
                      : locale === "en"
                        ? "Start team lock"
                        : "Bắt đầu khóa đội"}
                  </button>
                ) : null}

                {canStartRound1Exam ? (
                  <Link
                    href="/round-1"
                    className="inline-flex items-center justify-center gap-2 rounded-full border theme-border theme-panel px-5 py-3 text-sm font-semibold theme-text-strong"
                  >
                    <ArrowRight className="h-4 w-4" />
                    {locale === "en" ? "Enter Round 1 exam" : "Vào bài thi Vòng 1"}
                  </Link>
                ) : null}
              </div>

              {currentTeam.stage === "round-1" ? (
                <p className="mt-4 text-sm leading-7 theme-text-soft">
                  {outgoingLeadershipTransfer
                    ? locale === "en"
                      ? "Resolve the pending leadership transfer first, then start the team lock workflow."
                      : "Hãy xử lý xong yêu cầu chuyển đội trưởng đang chờ trước, rồi mới bắt đầu quy trình khóa đội."
                    : !isLeader
                      ? locale === "en"
                        ? "You can review the status here, but only the current leader can start or restart the workflow."
                        : "Bạn có thể theo dõi trạng thái tại đây, nhưng chỉ đội trưởng hiện tại mới có thể bắt đầu hoặc khởi động lại quy trình."
                      : currentTeam.memberIds.length < TEAM_MIN_MEMBERS
                        ? locale === "en"
                          ? `The team still needs ${membersNeeded} more member${membersNeeded === 1 ? "" : "s"} before lock can start.`
                          : `Đội vẫn cần thêm ${membersNeeded} thành viên nữa trước khi có thể bắt đầu khóa đội.`
                        : round1Finished
                          ? locale === "en"
                            ? "Round 1 is already closed, so no new team-lock workflow can be started."
                            : "Vòng 1 đã đóng nên không thể khởi tạo thêm quy trình khóa đội mới."
                          : locale === "en"
                            ? "If any member declines, the whole lock workflow stops and the leader has to restart it later."
                            : "Nếu có bất kỳ thành viên nào từ chối, toàn bộ quy trình khóa đội sẽ dừng lại và đội trưởng phải khởi động lại vào lúc khác."}
                </p>
              ) : null}
            </Surface>
          </section>

          {hasAnyTeamRound1Result ? (
            <section id="round1-result" className="scroll-mt-36">
              <Surface className="px-6 py-6 md:px-8 md:py-8">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                  <div className="max-w-3xl">
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-200/80">
                      {locale === "en" ? "Round 1 result" : "Kết quả Vòng 1"}
                    </p>
                    <p className="theme-heading mt-4 text-3xl font-semibold theme-text-strong">
                      {locale === "en"
                        ? "Team average result is recorded."
                        : "Kết quả trung bình của đội đã được ghi nhận."}
                    </p>
                    <p className="mt-4 text-sm leading-7 theme-text-muted">
                      {teamRound1ResultPending
                        ? locale === "en"
                          ? "Some team-level averages are not decided yet because at least one member is missing a submission, essay score, or total score."
                          : "Một số trung bình của đội chưa xác định vì vẫn còn thành viên thiếu bài nộp, điểm tự luận hoặc tổng điểm."
                        : locale === "en"
                          ? "Multiple-choice average, essay average, total average, and average completion time are complete for this team."
                          : "Trung bình trắc nghiệm, trung bình tự luận, tổng điểm trung bình và thời gian làm bài trung bình của đội đã hoàn tất."}
                    </p>
                  </div>
                  <StatusPill tone={teamRound1ResultPending ? "warning" : "success"}>
                    {teamRound1ResultPending
                      ? locale === "en"
                        ? "Not decided yet"
                        : "Chưa xác định"
                      : locale === "en"
                        ? "Team average complete"
                        : "Trung bình đội hoàn tất"}
                  </StatusPill>
                </div>

                <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-[1.5rem] border theme-border theme-panel-subtle px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.22em] theme-text-soft">
                      {locale === "en" ? "Multiple-choice average" : "Trung bình trắc nghiệm"}
                    </p>
                    <p className="mt-3 text-3xl font-semibold theme-text-strong">
                      {formatAverageScore(teamRound1ObjectiveAverage, ROUND1_OBJECTIVE_MAX_SCORE, locale)}
                    </p>
                  </div>
                  <div className="rounded-[1.5rem] border theme-border theme-panel-subtle px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.22em] theme-text-soft">
                      {locale === "en" ? "Essay average" : "Trung bình tự luận"}
                    </p>
                    <p className="mt-3 text-3xl font-semibold theme-text-strong">
                      {formatAverageScore(teamRound1EssayAverage, ROUND1_ESSAY_MAX_SCORE, locale)}
                    </p>
                  </div>
                  <div className="rounded-[1.5rem] border theme-border theme-panel-subtle px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.22em] theme-text-soft">
                      {locale === "en" ? "Total score" : "Tổng điểm"}
                    </p>
                    <p className="mt-3 text-3xl font-semibold theme-text-strong">
                      {formatAverageScore(teamRound1TotalAverage, ROUND1_TOTAL_MAX_SCORE, locale)}
                    </p>
                  </div>
                  <div className="rounded-[1.5rem] border theme-border theme-panel-subtle px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.22em] theme-text-soft">
                      {locale === "en" ? "Average time" : "Thời gian trung bình"}
                    </p>
                    <p className="mt-3 text-lg font-semibold theme-text-strong">
                      {teamRound1DurationAverage == null
                        ? locale === "en"
                          ? "Not decided yet"
                          : "Chưa xác định"
                        : `${formatAverageNumber(teamRound1DurationAverage)} ${locale === "en" ? "minutes" : "phút"}`}
                    </p>
                  </div>
                </div>

                <div className="mt-8 overflow-hidden rounded-[1.7rem] border theme-border">
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                      <thead className="border-b theme-border bg-[var(--panel-strong)] theme-text-soft">
                        <tr>
                          {[
                            "#",
                            locale === "en" ? "Member" : "Thành viên",
                            locale === "en" ? "Multiple choices" : "Trắc nghiệm",
                            locale === "en" ? "Essay" : "Tự luận",
                            locale === "en" ? "Total" : "Tổng điểm",
                            locale === "en" ? "Right / wrong" : "Đúng / sai",
                            locale === "en" ? "Duration" : "Thời gian",
                            locale === "en" ? "Submitted" : "Đã nộp",
                            locale === "en" ? "Status" : "Trạng thái",
                          ].map((label) => (
                            <th key={label} className="px-4 py-3 font-medium">
                              {label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {currentTeamRound1Results.map(({ member, submission }, index) => {
                          const resultPending = Boolean(
                            submission && (submission.essayScore == null || submission.totalScore == null),
                          );

                          return (
                            <tr key={member.id} className="border-b theme-border last:border-b-0">
                              <td className="px-4 py-4 text-xs font-semibold theme-text-soft">{index + 1}</td>
                              <td className="px-4 py-4">
                                <div className="flex items-center gap-3">
                                  <GradientAvatar
                                    label={member.name}
                                    tone={member.avatarTone}
                                    imageSrc={member.avatarImageSrc}
                                    className="h-10 w-10 rounded-[1rem]"
                                  />
                                  <div className="min-w-0">
                                    <p className="font-semibold theme-text-strong">{member.name}</p>
                                    <p className="text-xs theme-text-soft">{member.studentId}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-4 theme-text-body">
                                {submission ? `${submission.objectiveScore} / ${ROUND1_OBJECTIVE_MAX_SCORE}` : "—"}
                              </td>
                              <td className="px-4 py-4 theme-text-body">
                                {!submission
                                  ? "—"
                                  : submission.essayScore == null
                                    ? locale === "en"
                                      ? "Pending"
                                      : "Đang chờ"
                                    : `${submission.essayScore} / ${ROUND1_ESSAY_MAX_SCORE}`}
                              </td>
                              <td className="px-4 py-4 theme-text-body">
                                {!submission
                                  ? "—"
                                  : submission.totalScore == null
                                    ? locale === "en"
                                      ? "Pending"
                                      : "Đang chờ"
                                    : `${submission.totalScore} / ${ROUND1_TOTAL_MAX_SCORE}`}
                              </td>
                              <td className="px-4 py-4 theme-text-body">
                                {submission
                                  ? locale === "en"
                                    ? `${submission.rightCount} / ${submission.wrongCount}`
                                    : `${submission.rightCount} / ${submission.wrongCount}`
                                  : "—"}
                              </td>
                              <td className="px-4 py-4 theme-text-body">
                                {submission
                                  ? `${submission.durationMinutes} ${locale === "en" ? "min" : "phút"}`
                                  : "—"}
                              </td>
                              <td className="px-4 py-4 theme-text-body">
                                {submission ? formatDateLabel(locale, submission.submittedAt) : "—"}
                              </td>
                              <td className="px-4 py-4 text-center">
                                <StatusPill
                                  tone={
                                    !submission
                                      ? "default"
                                      : resultPending
                                        ? "warning"
                                        : "success"
                                  }
                                >
                                  {!submission
                                    ? locale === "en"
                                      ? "Not submitted"
                                      : "Chưa nộp"
                                    : resultPending
                                      ? locale === "en"
                                        ? "Essay review pending"
                                        : "Đang chờ chấm tự luận"
                                      : locale === "en"
                                        ? "Complete"
                                        : "Hoàn tất"}
                                </StatusPill>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </Surface>
            </section>
          ) : null}

          {showRound2Submission || showRound3Submission ? (
            <section className="space-y-6">
              {showRound2Submission ? (
                <SubmissionRoundCard
                  locale={locale}
                  round="round-2"
                  timelineItems={timelineItems}
                  isLeader={Boolean(isLeader)}
                  isCurrentRound={isTeamCurrentlyCompetingRound(currentTeam, "round-2")}
                  hasPassedRound={hasTeamPassedRound(currentTeam, "round-2")}
                  isRoundFinished={round2Finished}
                  submissions={teamSubmissions.filter((submission) => submission.round === "round-2")}
                  users={users}
                  form={submissionForms["round-2"]}
                  onFormChange={(payload) =>
                    setSubmissionForms((current) => ({
                      ...current,
                      "round-2": { ...current["round-2"], ...payload },
                    }))
                  }
                  onSubmit={() => handleSubmission("round-2")}
                />
              ) : null}
              {showRound3Submission ? (
                <SubmissionRoundCard
                  locale={locale}
                  round="round-3"
                  timelineItems={timelineItems}
                  isLeader={Boolean(isLeader)}
                  isCurrentRound={isTeamCurrentlyCompetingRound(currentTeam, "round-3")}
                  hasPassedRound={hasTeamPassedRound(currentTeam, "round-3")}
                  isRoundFinished={round3Finished}
                  isSubmissionClosed={round3SubmissionClosed || round3Finished}
                  submissionWindowLabel={round3SubmissionWindowLabel}
                  submissions={teamSubmissions.filter((submission) => submission.round === "round-3")}
                  users={users}
                  form={submissionForms["round-3"]}
                  onFormChange={(payload) =>
                    setSubmissionForms((current) => ({
                      ...current,
                      "round-3": { ...current["round-3"], ...payload },
                    }))
                  }
                  onSubmit={() => handleSubmission("round-3")}
                />
              ) : null}
            </section>
          ) : null}

        </>
      ) : (
        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <Surface className="px-6 py-6 md:px-8 md:py-8">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-200/80">
              {locale === "en" ? "Create team" : "Tạo đội"}
            </p>
            {!hasProfilePhoneNumber ? (
              <div className="mt-5">
                <PhoneRequirementNotice
                  title={locale === "en" ? "Add a phone number before creating a team" : "Hãy thêm số điện thoại trước khi tạo đội"}
                  description={
                    locale === "en"
                      ? "Team creation is available only after the account profile has a phone number. Add it once, then come back to continue."
                      : "Tính năng tạo đội chỉ mở khi hồ sơ tài khoản đã có số điện thoại. Hãy bổ sung một lần rồi quay lại tiếp tục."
                  }
                  actionLabel={locale === "en" ? "Open profile edit" : "Mở trang chỉnh sửa hồ sơ"}
                />
              </div>
            ) : null}
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm theme-text-muted">{locale === "en" ? "Team name" : "Tên đội"}</span>
                <input
                  value={teamForm.name}
                  onChange={(event) => setTeamForm((current) => ({ ...current, name: event.target.value }))}
                  className="theme-placeholder w-full rounded-2xl border theme-border theme-panel px-4 py-3 text-sm theme-text-strong outline-none"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm theme-text-muted">{locale === "en" ? "Team tag" : "Mã đội"}</span>
                <input
                  value={teamForm.tag}
                  onChange={(event) =>
                    setTeamForm((current) => ({
                      ...current,
                      tag: event.target.value.toUpperCase().slice(0, 4),
                    }))
                  }
                  className="theme-placeholder w-full rounded-2xl border theme-border theme-panel px-4 py-3 text-sm theme-text-strong outline-none"
                />
              </label>
              <label className="space-y-2 md:col-span-2">
                <span className="text-sm theme-text-muted">{locale === "en" ? "Keyword" : "Từ khóa"}</span>
                <input
                  value={teamForm.track}
                  onChange={(event) => setTeamForm((current) => ({ ...current, track: event.target.value }))}
                  className="theme-placeholder w-full rounded-2xl border theme-border theme-panel px-4 py-3 text-sm theme-text-strong outline-none"
                />
              </label>
              <label className="space-y-2 md:col-span-2">
                <span className="text-sm theme-text-muted">{locale === "en" ? "Team bio" : "Bio của đội"}</span>
                <textarea
                  value={teamForm.bio}
                  rows={5}
                  onChange={(event) => setTeamForm((current) => ({ ...current, bio: event.target.value }))}
                  className="theme-placeholder w-full rounded-2xl border theme-border theme-panel px-4 py-3 text-sm theme-text-strong outline-none"
                />
              </label>
            </div>
            <div className="mt-6">
              <p className="text-sm theme-text-muted">{locale === "en" ? "Team avatar" : "Avatar đội"}</p>
              <div className="mt-3 flex flex-wrap gap-3">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border theme-border theme-panel-subtle px-4 py-2.5 text-sm font-semibold theme-text-strong">
                  <Upload className="h-4 w-4" />
                  {locale === "en" ? "Upload team photo" : "Tải ảnh đội lên"}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => {
                      void handleTeamAvatarUpload(event);
                    }}
                    className="hidden"
                  />
                </label>
                {teamForm.avatarImageSrc ? (
                  <button
                    type="button"
                    onClick={() => setTeamForm((current) => ({ ...current, avatarImageSrc: undefined }))}
                    className="rounded-2xl border theme-border theme-panel-subtle px-4 py-2.5 text-sm font-semibold theme-text-strong"
                  >
                    {locale === "en" ? "Remove photo" : "Gỡ ảnh"}
                  </button>
                ) : null}
              </div>
              {teamAvatarError ? <p className="mt-3 text-xs leading-6 text-rose-300">{teamAvatarError}</p> : null}
              <p className="mt-3 text-xs leading-6 theme-text-faint">
                {locale === "en"
                  ? `The team avatar is independent from the leader avatar. If no image is uploaded, the team keeps its own gradient identity. Maximum size ${formatFileSize(MAX_AVATAR_IMAGE_BYTES)}.`
                  : `Avatar đội được tách riêng khỏi avatar đội trưởng. Nếu chưa tải ảnh, đội sẽ dùng nhận diện gradient riêng của mình. Dung lượng tối đa ${formatFileSize(MAX_AVATAR_IMAGE_BYTES)}.`}
              </p>
              <div className="mt-3 flex flex-wrap gap-3">
                {avatarTones.map((tone) => (
                  <button
                    key={tone}
                    type="button"
                    onClick={() => setTeamForm((current) => ({ ...current, avatarTone: tone }))}
                    className={`rounded-full border px-2 py-2 ${tone === teamForm.avatarTone ? "border-white/70" : "theme-border"}`}
                  >
                    <GradientAvatar label={teamForm.name || "Team"} tone={tone} />
                  </button>
                ))}
              </div>
            </div>
            <button
              type="button"
              disabled={!hasProfilePhoneNumber}
              onClick={handleTeamSave}
              className="theme-button-primary mt-6 w-full rounded-[1.4rem] px-5 py-3.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
            >
              {locale === "en" ? "Create team" : "Tạo đội"}
            </button>
          </Surface>

          <Surface className="px-6 py-6">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-200/80">
              {locale === "en" ? "Invitation inbox" : "Hộp thư lời mời"}
            </p>
            <div className="mt-6 space-y-4">
              {incomingInvitations.length > 0 ? (
                incomingInvitations.map((invitation) => {
                  const team = teams.find((item) => item.id === invitation.teamId);
                  const isTargetTeamFull = Boolean(team && team.memberIds.length >= TEAM_MAX_MEMBERS);

                  if (!team) {
                    return null;
                  }

                  return (
                    <div key={invitation.id} className="rounded-[1.5rem] border theme-border theme-panel px-4 py-4">
                      <div className="flex items-center gap-3">
                        <GradientAvatar label={team.name} tone={team.avatarTone} imageSrc={team.avatarImageSrc} />
                        <div>
                          <p className="text-sm font-semibold theme-text-strong">{team.name}</p>
                          <p className="text-xs theme-text-soft">{formatDateLabel(locale, invitation.createdAt)}</p>
                        </div>
                      </div>
                      <p className="mt-4 text-sm leading-7 theme-text-muted">
                        {isTargetTeamFull
                          ? locale === "en"
                            ? "This team is now full. If you try to accept, the invitation will expire and you will not enter the team."
                            : "Đội này hiện đã đủ thành viên. Nếu bạn thử chấp nhận, lời mời sẽ hết hiệu lực và bạn sẽ không vào được đội."
                          : locale === "en"
                            ? "Accepting works only if this account is not already in another team."
                            : "Chỉ có thể chấp nhận nếu tài khoản này hiện không ở đội nào khác."}
                      </p>
                      <div className="mt-4 flex gap-3">
                        <button
                          type="button"
                          onClick={() => respondToInvitation(invitation.id, "accept")}
                          className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-950"
                        >
                          <Check className="h-4 w-4" />
                          {locale === "en" ? "Accept" : "Chấp nhận"}
                        </button>
                        <button
                          type="button"
                          onClick={() => respondToInvitation(invitation.id, "decline")}
                          className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border theme-border-strong theme-panel px-4 py-3 text-sm font-semibold theme-text-strong"
                        >
                          {locale === "en" ? "Decline" : "Tu choi"}
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-[1.5rem] border theme-border theme-panel-subtle px-4 py-4 text-sm leading-7 theme-text-muted">
                  {locale === "en"
                    ? "No invitations yet. Create your team or switch preview users to test invite behavior."
                    : "Chưa có lời mời nào. Hãy tạo đội hoặc đổi tài khoản preview để kiểm tra hành vi lời mời."}
                </div>
              )}
            </div>
          </Surface>
        </section>
      )}
      {pendingInviteUser ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="invite-confirm-title"
        >
          <div className="theme-panel theme-card-shadow w-full max-w-2xl overflow-hidden rounded-[2rem] border theme-border">
            <div className="flex items-start justify-between gap-4 border-b theme-border px-5 py-5 md:px-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-600 dark:text-sky-200/80">
                  {locale === "en" ? "Invite confirmation" : "Xác nhận lời mời"}
                </p>
                <h2 id="invite-confirm-title" className="mt-2 theme-heading text-2xl font-semibold theme-text-strong">
                  {locale === "en" ? "Confirm this teammate before sending" : "Kiểm tra thành viên trước khi gửi"}
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-7 theme-text-muted">
                  {locale === "en"
                    ? "Review the selected student and their current team status. The final invite button is available only for students who are not already in another team."
                    : "Xem lại thông tin sinh viên và trạng thái đội hiện tại. Nút gửi lời mời chỉ mở khi sinh viên chưa thuộc đội khác."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPendingInviteUserId(null)}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border theme-border theme-panel-subtle theme-text-soft transition hover:bg-white/75 dark:hover:bg-white/8"
                aria-label={locale === "en" ? "Close invite confirmation" : "Đóng xác nhận lời mời"}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-4 px-5 py-5 md:grid-cols-[minmax(0,1fr)_260px] md:px-6">
              <div className="rounded-[1.5rem] border theme-border bg-white/60 px-4 py-4 dark:bg-white/4">
                <div className="flex items-start gap-4">
                  <GradientAvatar
                    label={pendingInviteUser.name}
                    tone={pendingInviteUser.avatarTone}
                    imageSrc={pendingInviteUser.avatarImageSrc}
                    className="h-16 w-16 text-base"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-lg font-semibold theme-text-strong">{pendingInviteUser.name}</p>
                    <p className="mt-1 truncate text-sm theme-text-muted">{pendingInviteUser.email}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <StatusPill>{pendingInviteUser.studentId || (locale === "en" ? "No student ID" : "Chưa có mã sinh viên")}</StatusPill>
                      <StatusPill>{pendingInviteUser.classYear || (locale === "en" ? "No class year" : "Chưa có năm học")}</StatusPill>
                    </div>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
                  <div className="rounded-[1.15rem] border theme-border theme-panel-subtle px-3 py-3">
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] theme-text-soft">
                      {locale === "en" ? "University" : "Trường"}
                    </p>
                    <p className="mt-2 font-semibold theme-text-strong">{pendingInviteUser.university || "—"}</p>
                  </div>
                  <div className="rounded-[1.15rem] border theme-border theme-panel-subtle px-3 py-3">
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] theme-text-soft">
                      {locale === "en" ? "Major" : "Ngành"}
                    </p>
                    <p className="mt-2 font-semibold theme-text-strong">{pendingInviteUser.major || "—"}</p>
                  </div>
                </div>
              </div>

              <div
                className={`rounded-[1.5rem] border px-4 py-4 ${
                  pendingInviteUserInAnotherTeam
                    ? "border-amber-400/35 bg-amber-400/12"
                    : "border-emerald-400/30 bg-emerald-400/12"
                }`}
              >
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] theme-text-soft">
                  {locale === "en" ? "Team status" : "Trạng thái đội"}
                </p>
                <p className="mt-3 text-lg font-semibold theme-text-strong">
                  {pendingInviteUserInAnotherTeam
                    ? locale === "en"
                      ? "Already in another team"
                      : "Đã thuộc đội khác"
                    : locale === "en"
                      ? "Available to invite"
                      : "Có thể mời"}
                </p>
                <p className="mt-3 text-sm leading-7 theme-text-muted">
                  {pendingInviteUserInAnotherTeam
                    ? locale === "en"
                      ? `${pendingInviteUser.name} is currently listed in ${pendingInviteUserTeam?.name ?? "another team"}.`
                      : `${pendingInviteUser.name} hiện đang thuộc ${pendingInviteUserTeam?.name ?? "một đội khác"}.`
                    : locale === "en"
                      ? "This student is not attached to another team in the current workspace."
                      : "Sinh viên này hiện chưa thuộc đội khác trong workspace."}
                </p>
                {pendingInviteUserInAnotherTeam && pendingInviteUserTeam ? (
                  <div className="mt-4 rounded-[1.15rem] border theme-border bg-white/55 px-3 py-3 text-sm dark:bg-white/5">
                    <p className="font-semibold theme-text-strong">{pendingInviteUserTeam.name}</p>
                    <p className="mt-1 theme-text-soft">
                      {locale === "en" ? "Team code" : "Mã đội"} · {pendingInviteUserTeam.tag}
                    </p>
                    <p className="mt-1 theme-text-soft">
                      {locale === "en" ? "Leader" : "Đội trưởng"} · {pendingInviteTeamLeader?.name ?? "—"}
                    </p>
                  </div>
                ) : null}
              </div>
            </div>

            {inviteConfirmBlockingReason ? (
              <div className="mx-5 rounded-[1.25rem] border border-amber-400/35 bg-amber-400/12 px-4 py-3 text-sm leading-7 text-amber-800 dark:text-amber-100 md:mx-6">
                {inviteConfirmBlockingReason}
              </div>
            ) : null}

            <div className="flex flex-col-reverse gap-3 px-5 py-5 md:flex-row md:justify-end md:px-6">
              <button
                type="button"
                onClick={() => setPendingInviteUserId(null)}
                className="inline-flex items-center justify-center rounded-2xl border theme-border-strong theme-panel px-5 py-3 text-sm font-semibold theme-text-strong"
              >
                {locale === "en" ? "Cancel" : "Hủy"}
              </button>
              <button
                type="button"
                disabled={!canConfirmPendingInvite}
                onClick={handleConfirmInvite}
                className="theme-button-primary inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-45"
              >
                <UserPlus2 className="h-4 w-4" />
                {locale === "en" ? "Send invitation" : "Gửi lời mời"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {pendingRecallInvitation ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="recall-invite-title"
        >
          <div className="theme-panel theme-card-shadow w-full max-w-2xl overflow-hidden rounded-[2rem] border theme-border">
            <div className="flex items-start justify-between gap-4 border-b theme-border px-5 py-5 md:px-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-rose-600 dark:text-rose-200/85">
                  {locale === "en" ? "Recall invitation" : "Thu hồi lời mời"}
                </p>
                <h2 id="recall-invite-title" className="mt-2 theme-heading text-2xl font-semibold theme-text-strong">
                  {locale === "en" ? "Recall this pending invitation?" : "Thu hồi lời mời đang chờ?"}
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-7 theme-text-muted">
                  {locale === "en"
                    ? "The selected student will no longer see this invite in their invitation inbox."
                    : "Sinh viên được chọn sẽ không còn thấy lời mời này trong hộp thư lời mời."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPendingRecallInvitationId(null)}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border theme-border theme-panel-subtle theme-text-soft transition hover:bg-white/75 dark:hover:bg-white/8"
                aria-label={locale === "en" ? "Close recall confirmation" : "Đóng xác nhận thu hồi"}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-4 px-5 py-5 md:grid-cols-[minmax(0,1fr)_260px] md:px-6">
              <div className="rounded-[1.5rem] border theme-border bg-white/60 px-4 py-4 dark:bg-white/4">
                <div className="flex items-start gap-4">
                  <GradientAvatar
                    label={pendingRecallTargetUser?.name ?? pendingRecallInvitation.toUserId}
                    tone={pendingRecallTargetUser?.avatarTone ?? "from-sky-500 via-cyan-400 to-emerald-400"}
                    imageSrc={pendingRecallTargetUser?.avatarImageSrc}
                    className="h-16 w-16 text-base"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-lg font-semibold theme-text-strong">
                      {pendingRecallTargetUser?.name ?? pendingRecallInvitation.toUserId}
                    </p>
                    <p className="mt-1 truncate text-sm theme-text-muted">
                      {pendingRecallTargetUser?.email ?? (locale === "en" ? "No email available" : "Chưa có email")}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <StatusPill tone="warning">{locale === "en" ? "Pending invite" : "Lời mời đang chờ"}</StatusPill>
                      <StatusPill>{formatDateLabel(locale, pendingRecallInvitation.createdAt)}</StatusPill>
                    </div>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
                  <div className="rounded-[1.15rem] border theme-border theme-panel-subtle px-3 py-3">
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] theme-text-soft">
                      {locale === "en" ? "University" : "Trường"}
                    </p>
                    <p className="mt-2 font-semibold theme-text-strong">{pendingRecallTargetUser?.university || "—"}</p>
                  </div>
                  <div className="rounded-[1.15rem] border theme-border theme-panel-subtle px-3 py-3">
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] theme-text-soft">
                      {locale === "en" ? "Major" : "Ngành"}
                    </p>
                    <p className="mt-2 font-semibold theme-text-strong">{pendingRecallTargetUser?.major || "—"}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-rose-400/28 bg-rose-400/10 px-4 py-4">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] theme-text-soft">
                  {locale === "en" ? "Invitation details" : "Thông tin lời mời"}
                </p>
                <div className="mt-4 space-y-3 text-sm">
                  <div className="rounded-[1.15rem] border theme-border bg-white/55 px-3 py-3 dark:bg-white/5">
                    <p className="text-xs uppercase tracking-[0.2em] theme-text-soft">
                      {locale === "en" ? "Team" : "Đội"}
                    </p>
                    <p className="mt-2 font-semibold theme-text-strong">{currentTeam?.name ?? pendingRecallInvitation.teamId}</p>
                    <p className="mt-1 theme-text-soft">
                      {locale === "en" ? "Team code" : "Mã đội"} · {currentTeam?.tag ?? "—"}
                    </p>
                  </div>
                  <div className="rounded-[1.15rem] border theme-border bg-white/55 px-3 py-3 dark:bg-white/5">
                    <p className="text-xs uppercase tracking-[0.2em] theme-text-soft">
                      {locale === "en" ? "Sent by" : "Người gửi"}
                    </p>
                    <p className="mt-2 font-semibold theme-text-strong">{pendingRecallSender?.name ?? pendingRecallInvitation.fromUserId}</p>
                  </div>
                </div>
              </div>
            </div>

            {!canConfirmRecallInvitation ? (
              <div className="mx-5 rounded-[1.25rem] border border-amber-400/35 bg-amber-400/12 px-4 py-3 text-sm leading-7 text-amber-800 dark:text-amber-100 md:mx-6">
                {locale === "en"
                  ? "Only the sender or current team leader can recall this invitation."
                  : "Chỉ người gửi hoặc đội trưởng hiện tại mới có thể thu hồi lời mời này."}
              </div>
            ) : null}

            <div className="flex flex-col-reverse gap-3 px-5 py-5 md:flex-row md:justify-end md:px-6">
              <button
                type="button"
                onClick={() => setPendingRecallInvitationId(null)}
                className="inline-flex items-center justify-center rounded-2xl border theme-border-strong theme-panel px-5 py-3 text-sm font-semibold theme-text-strong"
              >
                {locale === "en" ? "Cancel" : "Hủy"}
              </button>
              <button
                type="button"
                disabled={!canConfirmRecallInvitation}
                onClick={handleConfirmRecallInvitation}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-400/30 bg-rose-500 px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(244,63,94,0.22)] transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-45"
              >
                <Undo2 className="h-4 w-4" />
                {locale === "en" ? "Recall invitation" : "Thu hồi lời mời"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SubmissionRoundCard({
  locale,
  round,
  timelineItems,
  isLeader,
  isCurrentRound,
  hasPassedRound,
  isRoundFinished,
  isSubmissionClosed,
  submissionWindowLabel,
  submissions,
  users,
  form,
  onFormChange,
  onSubmit,
}: {
  locale: Locale;
  round: SubmissionRound;
  timelineItems: TimelineItem[];
  isLeader: boolean;
  isCurrentRound: boolean;
  hasPassedRound: boolean;
  isRoundFinished: boolean;
  isSubmissionClosed?: boolean;
  submissionWindowLabel?: string;
  submissions: TeamSubmission[];
  users: UserProfile[];
  form: SubmissionFormState;
  onFormChange: (payload: Partial<SubmissionFormState>) => void;
  onSubmit: () => void | Promise<void>;
}) {
  const sectionId = round === "round-2" ? "round-2-section" : "round-3-section";
  const sortedSubmissions = [...submissions].sort((a, b) => b.version - a.version);
  const latestSubmission = sortedSubmissions[0];
  const roundLabel =
    round === "round-2"
      ? locale === "en"
        ? "Round 2 report submission"
        : "Nộp báo cáo Vòng 2"
      : locale === "en"
        ? "Final report submission"
        : "Nộp báo cáo chung kết";
  const roundWindow = getSubmissionDeadlineTimelineItem(round, timelineItems) ?? getCompetitionRoundWindow(round, timelineItems);
  const roundWindowLabel = submissionWindowLabel ?? (roundWindow
    ? formatDateRangeLabel(locale, roundWindow.startDate, roundWindow.endDate)
    : undefined);
  const submissionClosed = isSubmissionClosed ?? isRoundFinished;
  const canSubmit = isLeader && isCurrentRound && !submissionClosed;
  const statusPill = submissionClosed
    ? locale === "en"
      ? round === "round-3"
        ? "Final report deadline closed"
        : `${pickRoundLabel(locale, round)} finished`
      : round === "round-3"
        ? "Đã đóng hạn báo cáo chung kết"
        : `${pickRoundLabel(locale, round)} da ket thuc`
    : hasPassedRound
      ? locale === "en"
        ? `${pickRoundLabel(locale, round)} passed`
        : `Da qua ${pickRoundLabel(locale, round)}`
      : isCurrentRound
        ? locale === "en"
          ? `Currently competing in ${pickRoundLabel(locale, round)}`
          : `Đang thi đấu ${pickRoundLabel(locale, round)}`
        : latestSubmission
          ? locale === "en"
            ? `Latest v${latestSubmission.version} valid`
            : `v${latestSubmission.version} mới nhất hợp lệ`
          : locale === "en"
            ? "No submission yet"
            : "Chưa có bài nộp";
  const lockMessage = submissionClosed
    ? locale === "en"
      ? round === "round-3"
        ? "The final report deadline has passed. New finalist report versions are now closed."
        : `${pickRoundLabel(locale, round)} is finished. You can no longer submit new versions for this round.`
      : round === "round-3"
        ? "Hạn nộp báo cáo chung kết đã kết thúc. Bạn không còn thể nộp phiên bản mới cho giai đoạn này."
        : `${pickRoundLabel(locale, round)} đã kết thúc. Bạn không còn thể nộp phiên bản mới cho vòng này.`
    : hasPassedRound
      ? locale === "en"
        ? `This team has already advanced past ${pickRoundLabel(locale, round)}. Submission history stays visible, but this round is no longer active.`
        : `Đội này đã vượt qua ${pickRoundLabel(locale, round)}. Lịch sử nộp bài vẫn được giữ lại, nhưng vòng này không còn đang hoạt động.`
      : locale === "en"
        ? "Only the team leader can submit a new version for this round."
        : "Chỉ đội trưởng mới có thể nộp phiên bản mới cho vòng này.";

  return (
    <section id={sectionId} className="scroll-mt-36">
      <Surface className="px-6 py-6 md:px-8 md:py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <StatusPill tone={submissionClosed ? "warning" : "success"}>
              {pickRoundLabel(locale, round)}
            </StatusPill>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-200/80">
              {locale === "en"
                ? "Submission center"
                : round === "round-2"
                  ? "Trung tâm quản lý báo cáo Vòng 2"
                  : "Trung tâm quản lý báo cáo chung kết"}
            </p>
          </div>
          <p className="mt-4 text-3xl font-semibold theme-text-strong">{roundLabel}</p>
          {roundWindowLabel ? (
            <p className="mt-2 text-sm theme-text-soft">{roundWindowLabel}</p>
          ) : null}
        </div>
        <StatusPill tone={submissionClosed ? "warning" : latestSubmission || isCurrentRound || hasPassedRound ? "success" : "warning"}>
          {statusPill}
        </StatusPill>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          {latestSubmission ? (
            <div className="rounded-[1.35rem] border theme-border theme-panel px-4 py-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-200/80">
                  {locale === "en" ? "Current valid version" : "Phiên bản hợp lệ hiện tại"}
                </p>
                <StatusPill tone="success">{`v${latestSubmission.version}`}</StatusPill>
              </div>
              <div className="mt-3 flex min-w-0 flex-col gap-2 text-sm md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                  <p className="truncate font-semibold theme-text-strong">{latestSubmission.title}</p>
                  <p className="mt-1 text-xs theme-text-soft">
                    {formatDateLabel(locale, latestSubmission.submittedAt)} · {(users.find((user) => user.id === latestSubmission.submittedByUserId) ?? users[0]).name}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2 text-xs">
                  <FolderClock className="h-4 w-4 theme-text-soft" />
                  <span className="max-w-[180px] truncate theme-text-soft">{latestSubmission.resourceLabel}</span>
                  {latestSubmission.resourceSizeBytes ? (
                    <span className="theme-text-faint">{formatFileSize(latestSubmission.resourceSizeBytes)}</span>
                  ) : null}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-[1.5rem] border theme-border theme-panel-subtle px-5 py-5 text-sm leading-7 theme-text-muted">
              {locale === "en"
                ? "No report has been submitted for this round yet."
                : "Chưa có báo cáo nào được nộp cho vòng này."}
            </div>
          )}

          <div className="rounded-[1.35rem] border theme-border theme-panel-subtle px-4 py-4">
            <p className="text-sm font-semibold theme-text-strong">
              {locale === "en" ? "Version history" : "Lịch sử phiên bản"}
            </p>
            <div className="mt-3 space-y-2">
              {sortedSubmissions.length > 0 ? (
                sortedSubmissions.map((submission, index) => (
                  <div
                    key={submission.id}
                    className="overflow-x-auto rounded-[1.15rem] border theme-border theme-panel px-3 py-3"
                  >
                    <div className="grid min-w-[760px] grid-cols-[120px_minmax(180px,1fr)_116px_140px_minmax(150px,0.8fr)_72px] items-center gap-3 text-sm">
                      <div className="min-w-0">
                        <StatusPill tone={index === 0 ? "success" : "default"}>
                          {index === 0
                            ? locale === "en"
                              ? `Valid v${submission.version}`
                              : `v${submission.version} hợp lệ`
                            : locale === "en"
                              ? `Archived v${submission.version}`
                              : `v${submission.version} cũ`}
                        </StatusPill>
                      </div>
                      <p className="truncate font-semibold theme-text-strong">{submission.title}</p>
                      <span className="truncate text-xs theme-text-soft">{formatDateLabel(locale, submission.submittedAt)}</span>
                      <span className="truncate text-xs theme-text-soft">
                        {(users.find((user) => user.id === submission.submittedByUserId) ?? users[0]).name}
                      </span>
                      <span className="truncate text-xs theme-text-soft">{submission.resourceLabel}</span>
                      <span className="text-right text-xs theme-text-faint">
                        {submission.resourceSizeBytes ? formatFileSize(submission.resourceSizeBytes) : "—"}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm theme-text-soft">
                  {locale === "en" ? "Version history will appear after the first upload." : "Lịch sử phiên bản sẽ hiện ra sau lần nộp đầu tiên."}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-[1.5rem] border theme-border theme-panel px-5 py-5">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-200/80">
            {locale === "en" ? "Submit new version" : "Nộp phiên bản mới"}
          </p>
          {canSubmit ? (
            <div className="mt-5 space-y-4">
              <label className="space-y-2">
                <span className="text-sm theme-text-muted">{locale === "en" ? "Submission title" : "Tiêu đề báo cáo"}</span>
                <input
                  value={form.title}
                  onChange={(event) => onFormChange({ title: event.target.value })}
                  className="theme-placeholder w-full rounded-2xl border theme-border theme-panel-subtle px-4 py-3 text-sm theme-text-strong outline-none"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm theme-text-muted">{locale === "en" ? "Submission file" : "Tệp báo cáo"}</span>
                <label className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border theme-border theme-panel-subtle px-4 py-3 text-sm theme-text-strong">
                  <span className="truncate">
                    {form.resourceFile
                      ? form.resourceFile.name
                      : locale === "en"
                        ? "Choose a PDF or RAR file"
                        : "Chọn tệp PDF hoặc RAR"}
                  </span>
                  <span className="rounded-full border theme-border px-3 py-1 text-xs font-semibold theme-text-soft">
                    {locale === "en" ? "Browse" : "Chọn tệp"}
                  </span>
                  <input
                    type="file"
                    accept=".pdf,.rar,application/pdf,application/x-rar-compressed,application/vnd.rar"
                    onChange={(event) =>
                      onFormChange({ resourceFile: event.target.files?.[0] ?? null })
                    }
                    className="hidden"
                  />
                </label>
                <p className="text-xs leading-6 theme-text-faint">
                  {locale === "en"
                    ? `Allowed: PDF or RAR. Maximum size ${formatFileSize(MAX_SUBMISSION_FILE_BYTES)}.`
                    : `Cho phép: PDF hoặc RAR. Dung lượng tối đa ${formatFileSize(MAX_SUBMISSION_FILE_BYTES)}.`}
                </p>
                {form.resourceFile ? (
                  <p className="text-xs theme-text-soft">
                    {formatFileSize(form.resourceFile.size)}
                  </p>
                ) : null}
              </label>
              <label className="space-y-2">
                <span className="text-sm theme-text-muted">{locale === "en" ? "Submission notes" : "Ghi chú báo cáo"}</span>
                <textarea
                  value={form.summary}
                  rows={4}
                  onChange={(event) => onFormChange({ summary: event.target.value })}
                  className="theme-placeholder w-full rounded-2xl border theme-border theme-panel-subtle px-4 py-3 text-sm theme-text-strong outline-none"
                />
              </label>
              <button
                type="button"
                onClick={onSubmit}
                className="theme-button-primary inline-flex w-full items-center justify-center gap-2 rounded-[1.4rem] px-5 py-3.5 text-sm font-semibold"
              >
                <Upload className="h-4 w-4" />
                {locale === "en" ? "Submit new version" : "Nộp phiên bản mới"}
              </button>
            </div>
          ) : (
            <div className="mt-5 rounded-[1.25rem] border theme-border theme-panel-subtle px-4 py-4 text-sm leading-7 theme-text-muted">
              {lockMessage}
            </div>
          )}
        </div>
      </div>
      </Surface>
    </section>
  );
}
