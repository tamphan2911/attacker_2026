"use client";

import Link from "next/link";
import { useEffect, useState, type ChangeEvent } from "react";
import {
  ArrowRight,
  Check,
  Crown,
  FolderClock,
  LockKeyhole,
  LogOut,
  MailPlus,
  Search,
  ShieldCheck,
  Upload,
  UserPlus2,
} from "lucide-react";

import { TEAM_MAX_MEMBERS, TEAM_MIN_MEMBERS } from "@/data/site-content";
import {
  getCompetitionRoundWindow,
  getTeamCompetitionState,
  hasTeamPassedRound,
  hasTeamReachedRound,
  isRoundFinished,
  isTeamRosterLocked,
  isTeamRound1Locked,
  isTeamCurrentlyCompetingRound,
  pickCompetitionStateDescription,
  pickCompetitionStateLabel,
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
import { formatDateLabel, formatDateRangeLabel, getTeamForUser, pickText } from "@/lib/site";
import { useSiteState } from "@/components/providers/site-state-provider";
import {
  GradientAvatar,
  SectionHeading,
  StatusPill,
  Surface,
} from "@/components/site-ui";
import type {
  Locale,
  SubmissionRound,
  TeamProfile,
  TeamSubmission,
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

const MAX_AVATAR_FILE_BYTES = 1024 * 1024;

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
    authStatus,
    currentUser,
    currentTeam,
    activeUserId,
    isAuthenticated,
    canAccessAdminMode,
    signOutCurrentUser,
    createTeam,
    updateCurrentTeam,
    updateActiveUserProfile,
    inviteUser,
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
  const [userAvatarError, setUserAvatarError] = useState("");
  const [inviteSearch, setInviteSearch] = useState("");
  const [leadershipTargetId, setLeadershipTargetId] = useState("");
  const [submissionForms, setSubmissionForms] = useState<Record<SubmissionRound, SubmissionFormState>>({
    "round-2": createSubmissionFormState(),
    "round-3": createSubmissionFormState(),
  });

  useEffect(() => {
    setTeamForm(createTeamFormState(currentTeam));
  }, [currentTeam]);

  useEffect(() => {
    setTeamAvatarError("");
  }, [currentTeam?.id]);

  useEffect(() => {
    setUserAvatarError("");
  }, [activeUserId]);

  useEffect(() => {
    setLeadershipTargetId("");
  }, [currentTeam?.id]);

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
          {locale === "en" ? "Sign in to open the team workspace." : "Đăng nhập để mở không gian đội."}
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-7 theme-text-soft">
          {locale === "en"
            ? "Team management is now connected to backend sessions and APIs."
            : "Phần quản lý đội hiện đã được kết nối với session và API backend."}
        </p>
        <Link
          href="/auth"
          className="theme-button-primary mt-6 inline-flex rounded-[1.4rem] px-5 py-3 text-sm font-semibold"
        >
          {locale === "en" ? "Open sign in" : "Mở đăng nhập"}
        </Link>
      </Surface>
    );
  }

  const currentTeamMembers = currentTeam
    ? currentTeam.memberIds
        .map((memberId) => users.find((user) => user.id === memberId))
        .filter((user): user is UserProfile => Boolean(user))
    : [];

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

  const availableUsers = users.filter(
    (user) =>
      user.id !== activeUserId &&
      user.role === "student" &&
      !getTeamForUser(user.id, teams),
  );
  const isLeader = currentTeam?.leaderId === activeUserId;
  const teamReadinessCount = currentTeam?.memberIds.length ?? 0;
  const membersNeeded = Math.max(0, TEAM_MIN_MEMBERS - teamReadinessCount);
  const currentCompetitionState = currentTeam ? getTeamCompetitionState(currentTeam) : undefined;
  const teamRosterLocked = Boolean(currentTeam && isTeamRosterLocked(currentTeam));
  const teamRound1Locked = Boolean(currentTeam && isTeamRound1Locked(currentTeam));
  const isTeamFull = Boolean(currentTeam && currentTeam.memberIds.length >= TEAM_MAX_MEMBERS);
  const openSlots = currentTeam
    ? TEAM_MAX_MEMBERS - currentTeam.memberIds.length - sentInvitations.length
    : TEAM_MAX_MEMBERS;
  const currentStageWindow = currentTeam ? getCompetitionRoundWindow(currentTeam.stage) : undefined;
  const round1Window = getCompetitionRoundWindow("round-1");
  const round1Finished = isRoundFinished("round-1");
  const round2Finished = isRoundFinished("round-2");
  const round3Finished = isRoundFinished("round-3");
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
  const round1EssayPending = Boolean(
    currentRound1Submission &&
      (currentRound1Submission.essayScore == null || currentRound1Submission.totalScore == null),
  );
  const filteredAvailableUsers = availableUsers.filter((user) => {
    const keyword = inviteSearch.trim().toLowerCase();
    if (!keyword) {
      return true;
    }

    return [user.name, user.email, user.university, user.major]
      .join(" ")
      .toLowerCase()
      .includes(keyword);
  });

  const handleTeamSave = () => {
    if (currentTeam) {
      updateCurrentTeam({
        name: teamForm.name,
        tag: teamForm.tag,
        track: teamForm.track,
        avatarTone: teamForm.avatarTone,
        avatarImageSrc: teamForm.avatarImageSrc,
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

    if (file.size > MAX_AVATAR_FILE_BYTES) {
      setTeamAvatarError(
        locale === "en"
          ? `Avatar images must be ${formatFileSize(MAX_AVATAR_FILE_BYTES)} or smaller.`
          : `Ảnh avatar phải có dung lượng ${formatFileSize(MAX_AVATAR_FILE_BYTES)} trở xuống.`,
      );
      return;
    }

    try {
      const imageSrc = await readImageFileAsDataUrl(file);
      setTeamAvatarError("");
      setTeamForm((current) => ({ ...current, avatarImageSrc: imageSrc }));
    } catch {
      // Ignore failed local previews in the frontend-only prototype.
    }
  };

  const handleUserAvatarUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    if (file.size > MAX_AVATAR_FILE_BYTES) {
      setUserAvatarError(
        locale === "en"
          ? `Avatar images must be ${formatFileSize(MAX_AVATAR_FILE_BYTES)} or smaller.`
          : `Ảnh avatar phải có dung lượng ${formatFileSize(MAX_AVATAR_FILE_BYTES)} trở xuống.`,
      );
      return;
    }

    try {
      const imageSrc = await readImageFileAsDataUrl(file);
      setUserAvatarError("");
      updateActiveUserProfile({ avatarImageSrc: imageSrc });
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

  const competitionSummary = currentCompetitionState
    ? pickCompetitionStateDescription(locale, currentCompetitionState)
    : "";
  const competitionWindowLabel = currentStageWindow
    ? formatDateRangeLabel(locale, currentStageWindow.startDate, currentStageWindow.endDate)
    : undefined;
  const currentStageAlert = currentTeam
    ? currentCompetitionState === "not-eligible"
      ? locale === "en"
        ? `Add ${membersNeeded} more member${membersNeeded === 1 ? "" : "s"} to unlock Round 1 for this team.`
        : `Can them ${membersNeeded} thanh vien nua de mo Vong 1 cho doi nay.`
      : currentTeam.stage === "round-1" && currentTeam.round1LockStatus === "open"
        ? locale === "en"
          ? "Before anyone can enter Round 1, the leader must start the lock workflow and every current member must approve the fixed roster."
          : "Trước khi bất kỳ ai được vào Vòng 1, đội trưởng phải khởi động quy trình khóa đội và mọi thành viên hiện tại đều phải xác nhận đội hình cố định."
        : currentTeam.stage === "round-1" && currentTeam.round1LockStatus === "pending"
          ? locale === "en"
            ? "The Round 1 lock workflow is in progress. Invites, leaving, and leadership transfer are paused until every member responds."
            : "Quy trình khóa đội cho Vòng 1 đang diễn ra. Việc mời thêm người, rời đội và chuyển đội trưởng đều tạm dừng cho đến khi tất cả thành viên phản hồi."
          : currentTeam.stage === "round-1" && currentTeam.round1LockStatus === "declined"
            ? locale === "en"
              ? "A member declined the previous lock request. The leader must restart the workflow when the team is ready."
              : "Có thành viên đã từ chối yêu cầu khóa đội trước đó. Đội trưởng cần khởi động lại quy trình khi cả đội đã sẵn sàng."
            : currentTeam.stage === "round-1" && currentTeam.round1LockStatus === "locked" && !round1Finished
              ? locale === "en"
                ? "Team roster locked. Members can now start the individual Round 1 exam."
                : "Đội hình đã được khóa. Các thành viên giờ có thể bắt đầu bài thi cá nhân Vòng 1."
      : currentTeam.stage === "round-1" && round1Finished
        ? locale === "en"
          ? "Round 1 is finished. Team members can no longer submit the individual qualifier."
          : "Vòng 1 đã kết thúc. Thành viên đội không còn thể nộp bài thi cá nhân nữa."
        : currentTeam.stage === "round-2" && round2Finished
          ? locale === "en"
            ? "Round 2 is finished. The team leader can no longer submit Round 2 reports."
            : "Vòng 2 đã kết thúc. Đội trưởng không còn thể nộp báo cáo Vòng 2 nữa."
          : currentTeam.stage === "round-3" && round3Finished
            ? locale === "en"
              ? "Round 3 is finished. Final-round submissions are now closed."
              : "Vòng 3 đã kết thúc. Hệ thống đã đóng việc nộp bài của vòng chung kết."
            : currentTeam.stage === "round-1"
              ? locale === "en"
                ? "Round 1 progression is based on the team-average score of individual member results."
                : "Việc đi tiếp ở Vòng 1 được tính theo điểm trung bình đội từ kết quả cá nhân của từng thành viên."
              : currentTeam.stage === "round-2"
                ? locale === "en"
                  ? "This team passed Round 1 and is now in the judge-scored Round 2 submission stage."
                  : "Đội này đã qua Vòng 1 và đang ở giai đoạn nộp báo cáo Vòng 2 để giám khảo chấm điểm."
                : locale === "en"
                  ? "This team passed Round 2 and is now in the final presentation round."
                  : "Đội này đã qua Vòng 2 và hiện đang ở vòng chung kết thuyết trình."
    : "";
  const hasActionInbox =
    incomingInvitations.length > 0 ||
    incomingRound1TeamLockRequests.length > 0 ||
    incomingLeadershipTransfers.length > 0 ||
    Boolean(outgoingLeadershipTransfer) ||
    Boolean(currentTeam && currentTeam.round1LockStatus === "declined") ||
    Boolean(currentTeam && currentTeam.round1LockStatus === "pending" && isLeader);

  return (
    <div className="space-y-12">
      {hasActionInbox ? (
        <section className="space-y-4">
          <div className="rounded-[2rem] border border-sky-400/28 bg-[linear-gradient(135deg,rgba(24,92,188,0.18),rgba(14,165,233,0.08))] px-6 py-6 shadow-[0_24px_70px_rgba(15,23,42,0.18)] backdrop-blur-xl md:px-8">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-sky-200/85">
              {locale === "en" ? "Action inbox" : "Hop thu hanh dong"}
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
                          <StatusPill tone={isTargetTeamFull || isTargetTeamLocked ? "warning" : "success"}>
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
                                : "Loi moi vao doi"}
                          </StatusPill>
                          <StatusPill>{formatDateLabel(locale, invitation.createdAt)}</StatusPill>
                        </div>
                        <p className="mt-4 text-lg font-semibold theme-text-strong">{team.name}</p>
                        <p className="mt-2 text-sm leading-7 theme-text-muted">
                          {isTargetTeamFull
                            ? locale === "en"
                              ? `${team.name} has reached 5 members. If you try to accept now, the system will expire this invitation.`
                              : `${team.name} da dat 5 thanh vien. Neu ban thu chap nhan bay gio, he thong se ket thuc loi moi nay.`
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
                            {locale === "en" ? "Accept invite" : "Chap nhan loi moi"}
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
                          <StatusPill tone="success">
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
                        <div className="mt-4 flex flex-wrap gap-3">
                          <button
                            type="button"
                            onClick={() => respondToLeadershipTransfer(request.id, "accept")}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-950"
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
                          : `${users.find((user) => user.id === outgoingLeadershipTransfer.toUserId)?.name ?? "Thanh vien duoc chon"} phai chap nhan truoc khi ban co the roi doi.`}
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

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Surface className="px-6 py-6 md:px-8 md:py-8">
          <p className="theme-eyebrow text-xs font-semibold uppercase tracking-[0.32em]">
            {locale === "en" ? "Team workspace" : "Không gian đội"}
          </p>
          <h1 className="theme-heading mt-4 text-3xl font-semibold theme-text-strong md:text-[2.8rem]">
            {currentTeam
              ? currentTeam.name
              : pickText(locale, pageContent.workspace.noTeamTitle)}
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 theme-text-muted">
            {currentTeam
              ? pickText(locale, pageContent.workspace.teamDescription)
              : pickText(locale, pageContent.workspace.noTeamDescription)}
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <StatusPill
              tone={currentCompetitionState === "not-eligible" ? "warning" : "success"}
            >
              {currentTeam
                ? pickCompetitionStateLabel(locale, currentCompetitionState ?? "not-eligible")
                : locale === "en"
                  ? "No team yet"
                  : "Chưa có đội"}
            </StatusPill>
            <StatusPill>{`${teamReadinessCount}/${TEAM_MAX_MEMBERS} ${locale === "en" ? "members" : "thành viên"}`}</StatusPill>
            {currentTeam ? <StatusPill>{`${openSlots} ${locale === "en" ? "open slots" : "cho trong"}`}</StatusPill> : null}
            {currentTeam ? (
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
            ) : null}
            {currentTeam && competitionWindowLabel ? <StatusPill>{competitionWindowLabel}</StatusPill> : null}
          </div>
          {currentTeam ? (
            <p className="mt-4 max-w-3xl text-sm leading-7 theme-text-soft">
              {competitionSummary}
            </p>
          ) : null}
          {currentTeam ? (
            <div className="mt-4 rounded-[1.35rem] border theme-border theme-panel-subtle px-4 py-4 text-sm leading-7 theme-text-muted">
              {currentStageAlert}
            </div>
          ) : null}
          {currentTeam ? (
            <div className="mt-6 flex flex-wrap gap-3">
              {currentRound1Submission || currentCompetitionState === "round-1" ? (
                <Link
                  href={
                    currentRound1Submission
                      ? "/dashboard#round1-result"
                      : canStartRound1Exam
                        ? "/round-1"
                        : "/dashboard#round1-lock"
                  }
                  className="theme-button-primary inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
                >
                  <ArrowRight className="h-4 w-4" />
                  {currentRound1Submission
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
              <Link
                href="/rules"
                className="inline-flex items-center justify-center gap-2 rounded-full border theme-border theme-panel px-5 py-3 text-sm font-semibold theme-text-strong"
              >
                {locale === "en" ? "Review rules" : "Xem thể lệ"}
              </Link>
            </div>
          ) : null}
        </Surface>

        <Surface className="px-5 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-200/80">
            {locale === "en" ? "Your profile" : "Hồ sơ của bạn"}
          </p>
          <div className="mt-5 space-y-4">
            <div className="rounded-[1.5rem] border theme-border theme-panel px-4 py-4">
              <div className="flex items-start gap-4">
                <GradientAvatar
                  label={currentUser.name}
                  tone={currentUser.avatarTone}
                  imageSrc={currentUser.avatarImageSrc}
                  className="h-16 w-16 text-lg"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold theme-text-strong">{currentUser.name}</p>
                  <p className="mt-1 text-sm theme-text-soft">
                    {`${locale === "en" ? "Student ID" : "MSSV"} · ${currentUser.studentId}`}
                  </p>
                  <p className="mt-2 text-sm theme-text-soft">{currentUser.university}</p>
                  <p className="mt-2 text-xs theme-text-faint">{`${currentUser.major} · ${currentUser.classYear}`}</p>
                </div>
              </div>
              <div className="mt-4 rounded-[1.35rem] border theme-border theme-panel-subtle px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] theme-text-soft">
                  {locale === "en" ? "Bio" : "Giới thiệu"}
                </p>
                <p className="mt-3 text-sm leading-7 theme-text-muted">{currentUser.bio}</p>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border theme-border theme-panel-subtle px-4 py-2.5 text-sm font-semibold theme-text-strong">
                  <Upload className="h-4 w-4" />
                  {locale === "en" ? "Upload avatar" : "Tải avatar lên"}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => {
                      void handleUserAvatarUpload(event);
                    }}
                    className="hidden"
                  />
                </label>
                {currentUser.avatarImageSrc ? (
                  <button
                    type="button"
                    onClick={() => updateActiveUserProfile({ avatarImageSrc: undefined })}
                    className="rounded-2xl border theme-border theme-panel-subtle px-4 py-2.5 text-sm font-semibold theme-text-strong"
                  >
                    {locale === "en" ? "Remove photo" : "Gỡ ảnh"}
                  </button>
                ) : null}
              </div>
              {userAvatarError ? <p className="mt-3 text-xs leading-6 text-rose-300">{userAvatarError}</p> : null}
              <p className="mt-3 text-xs leading-6 theme-text-faint">
                {locale === "en"
                  ? `This avatar appears in your team member card and invite lists. Maximum size ${formatFileSize(MAX_AVATAR_FILE_BYTES)}.`
                  : `Avatar này sẽ hiện ở thẻ thành viên đội và danh sách lời mời. Dung lượng tối đa ${formatFileSize(MAX_AVATAR_FILE_BYTES)}.`}
              </p>
            </div>
            <div className="rounded-[1.5rem] border theme-border theme-panel px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-200/80">
                {locale === "en" ? "Account actions" : "Tác vụ tài khoản"}
              </p>
              <div className="mt-4 space-y-3">
                <Link
                  href="/profile"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border theme-border-strong theme-panel px-4 py-3 text-sm font-semibold theme-text-strong"
                >
                  <ArrowRight className="h-4 w-4" />
                    {locale === "en" ? "Open profile" : "Mở hồ sơ"}
                </Link>
                <button
                  type="button"
                  onClick={() => void signOutCurrentUser()}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border theme-border-strong theme-panel px-4 py-3 text-sm font-semibold theme-text-strong"
                >
                  <LogOut className="h-4 w-4" />
                  {locale === "en" ? "Sign out" : "Đăng xuất"}
                </button>
              </div>
            </div>
            {canAccessAdminMode ? (
              <Link
                href="/admin"
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border theme-border-strong theme-panel px-4 py-3 text-sm font-semibold theme-text-strong"
              >
                <ArrowRight className="h-4 w-4" />
                  {locale === "en" ? "Open admin mode" : "Mở admin mode"}
              </Link>
            ) : null}
          </div>
        </Surface>
      </section>

      {currentTeam ? (
        <>
          <section className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
            <Surface className="px-6 py-6 md:px-8 md:py-8">
              <div className="flex flex-wrap items-start justify-between gap-5">
                <div className="flex items-center gap-4">
                  <GradientAvatar
                    label={teamForm.name || currentTeam.name}
                    tone={teamForm.avatarTone}
                    imageSrc={teamForm.avatarImageSrc}
                    className="h-20 w-20 text-xl"
                  />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-200/80">
                      {locale === "en" ? "Team identity" : "Nhận diện đội"}
                    </p>
                    <p className="theme-heading mt-3 text-3xl font-semibold theme-text-strong">
                      {currentTeam.name}
                    </p>
                    <p className="mt-2 text-sm theme-text-soft">{currentTeam.track}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <StatusPill>{currentTeam.tag}</StatusPill>
                  <StatusPill tone={currentCompetitionState === "not-eligible" ? "warning" : "success"}>
                    {pickCompetitionStateLabel(locale, currentCompetitionState ?? currentTeam.stage)}
                  </StatusPill>
                  <StatusPill tone={isLeader ? "success" : "default"}>
                    {isLeader
                      ? locale === "en"
                        ? "You are the leader"
                        : "Bạn là đội trưởng"
                      : locale === "en"
                        ? "Member view"
                        : "Góc nhìn thành viên"}
                  </StatusPill>
                </div>
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm theme-text-muted">{locale === "en" ? "Team name" : "Tên đội"}</span>
                  <input
                    value={teamForm.name}
                    disabled={!isLeader}
                    onChange={(event) => setTeamForm((current) => ({ ...current, name: event.target.value }))}
                    className="theme-placeholder w-full rounded-2xl border theme-border theme-panel px-4 py-3 text-sm theme-text-strong outline-none disabled:opacity-60"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm theme-text-muted">{locale === "en" ? "Team tag" : "Mã đội"}</span>
                  <input
                    value={teamForm.tag}
                    disabled={!isLeader}
                    onChange={(event) =>
                      setTeamForm((current) => ({
                        ...current,
                        tag: event.target.value.toUpperCase().slice(0, 4),
                      }))
                    }
                    className="theme-placeholder w-full rounded-2xl border theme-border theme-panel px-4 py-3 text-sm theme-text-strong outline-none disabled:opacity-60"
                  />
                </label>
                <label className="space-y-2 md:col-span-2">
                  <span className="text-sm theme-text-muted">{locale === "en" ? "Track" : "Hướng thi"}</span>
                  <input
                    value={teamForm.track}
                    disabled={!isLeader}
                    onChange={(event) => setTeamForm((current) => ({ ...current, track: event.target.value }))}
                    className="theme-placeholder w-full rounded-2xl border theme-border theme-panel px-4 py-3 text-sm theme-text-strong outline-none disabled:opacity-60"
                  />
                </label>
                <label className="space-y-2 md:col-span-2">
                  <span className="text-sm theme-text-muted">{locale === "en" ? "Team bio" : "Bio của đội"}</span>
                  <textarea
                    value={teamForm.bio}
                    rows={5}
                    disabled={!isLeader}
                    onChange={(event) => setTeamForm((current) => ({ ...current, bio: event.target.value }))}
                    className="theme-placeholder w-full rounded-2xl border theme-border theme-panel px-4 py-3 text-sm theme-text-strong outline-none disabled:opacity-60"
                  />
                </label>
              </div>

              <div className="mt-6">
                <p className="text-sm theme-text-muted">{locale === "en" ? "Team avatar" : "Avatar đội"}</p>
                <div className="mt-3 flex flex-wrap gap-3">
                  <label
                    className={`inline-flex items-center gap-2 rounded-2xl border theme-border theme-panel-subtle px-4 py-2.5 text-sm font-semibold theme-text-strong ${isLeader ? "cursor-pointer" : "cursor-not-allowed opacity-60"}`}
                  >
                    <Upload className="h-4 w-4" />
                    {locale === "en" ? "Upload team photo" : "Tải ảnh đội lên"}
                    <input
                      type="file"
                      accept="image/*"
                      disabled={!isLeader}
                      onChange={(event) => {
                        void handleTeamAvatarUpload(event);
                      }}
                      className="hidden"
                    />
                  </label>
                  {teamForm.avatarImageSrc ? (
                    <button
                      type="button"
                      disabled={!isLeader}
                      onClick={() => setTeamForm((current) => ({ ...current, avatarImageSrc: undefined }))}
                      className="rounded-2xl border theme-border theme-panel-subtle px-4 py-2.5 text-sm font-semibold theme-text-strong disabled:opacity-60"
                    >
                      {locale === "en" ? "Remove photo" : "Gỡ ảnh"}
                    </button>
                  ) : null}
                </div>
                {teamAvatarError ? <p className="mt-3 text-xs leading-6 text-rose-300">{teamAvatarError}</p> : null}
                <p className="mt-3 text-xs leading-6 theme-text-faint">
                  {locale === "en"
                    ? `Uploaded team photos override the gradient. The selected tone remains as the fallback. Maximum size ${formatFileSize(MAX_AVATAR_FILE_BYTES)}.`
                    : `Ảnh đội tải lên sẽ hiển thị độc lập với avatar đội trưởng. Nếu chưa có ảnh, hệ thống dùng gradient và tông màu đã chọn làm phương án dự phòng. Dung lượng tối đa ${formatFileSize(MAX_AVATAR_FILE_BYTES)}.`}
                </p>
                <div className="mt-3 flex flex-wrap gap-3">
                  {avatarTones.map((tone) => (
                    <button
                      key={tone}
                      type="button"
                      disabled={!isLeader}
                      onClick={() => setTeamForm((current) => ({ ...current, avatarTone: tone }))}
                      className={`rounded-full border px-2 py-2 ${tone === teamForm.avatarTone ? "border-white/70" : "theme-border"} disabled:opacity-60`}
                    >
                      <GradientAvatar label={teamForm.name || currentTeam.name} tone={tone} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  disabled={!isLeader}
                  onClick={handleTeamSave}
                  className="theme-button-primary rounded-[1.4rem] px-5 py-3.5 text-sm font-semibold disabled:opacity-60"
                >
                  {locale === "en" ? "Save team profile" : "Lưu hồ sơ đội"}
                </button>
                <p className="self-center text-sm theme-text-soft">
                  {isLeader
                    ? locale === "en"
                      ? "Only the leader can edit and submit."
                      : "Chỉ đội trưởng mới có thể sửa và nộp."
                    : locale === "en"
                      ? "This account can review but not edit team submissions."
                      : "Tài khoản này có thể xem nhưng không thể sửa submission của đội."}
                </p>
              </div>
            </Surface>

            <Surface className="px-6 py-6 md:px-8 md:py-8">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-200/80">
                    {locale === "en" ? "Team members" : "Thành viên đội"}
                  </p>
                  <p className="mt-3 text-2xl font-semibold theme-text-strong">
                    {currentTeamMembers.length} / {TEAM_MAX_MEMBERS}
                  </p>
                </div>
                <StatusPill tone={currentCompetitionState === "not-eligible" ? "warning" : "success"}>
                  {pickCompetitionStateLabel(locale, currentCompetitionState ?? currentTeam.stage)}
                </StatusPill>
              </div>

              <div className="mt-6 space-y-3">
                {currentTeamMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between gap-3 rounded-[1.5rem] border theme-border theme-panel px-4 py-4"
                  >
                    <div className="flex items-center gap-3">
                      <GradientAvatar label={member.name} tone={member.avatarTone} imageSrc={member.avatarImageSrc} />
                      <div>
                        <p className="text-sm font-semibold theme-text-strong">{member.name}</p>
                        <p className="text-xs theme-text-soft">
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
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-[1.5rem] border theme-border theme-panel-subtle px-4 py-4">
                <p className="text-sm font-semibold theme-text-strong">
                  {locale === "en" ? "Current competition stage" : "Giai doan hien tai"}
                </p>
                <p className="mt-2 text-sm leading-7 theme-text-muted">{competitionSummary}</p>
                {competitionWindowLabel ? (
                  <p className="mt-3 text-xs uppercase tracking-[0.22em] theme-text-faint">
                    {competitionWindowLabel}
                  </p>
                ) : null}
              </div>

              <div className="mt-6 rounded-[1.5rem] border theme-border theme-panel-subtle px-4 py-4">
                <p className="text-sm font-semibold theme-text-strong">
                  {locale === "en" ? "Submission permission" : "Quyen nop bai"}
                </p>
                <p className="mt-2 text-sm leading-7 theme-text-muted">
                  {locale === "en"
                    ? "Only the team leader can submit Round 2 reports and final-round files. Teams may submit unlimited versions, but only the latest version is valid."
                    : "Chỉ đội trưởng mới có thể nộp báo cáo Vòng 2 và tệp của vòng chung kết. Đội có thể nộp không giới hạn phiên bản, nhưng chỉ phiên bản mới nhất mới hợp lệ."}
                </p>
              </div>
            </Surface>
          </section>

          <section id="round1-lock">
            <Surface className="px-6 py-6 md:px-8 md:py-8">
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
                          : "default"
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
                <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
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
                        className="rounded-[1.4rem] border theme-border theme-panel-subtle px-4 py-4"
                      >
                        <div className="flex items-center gap-3">
                          <GradientAvatar
                            label={member.name}
                            tone={member.avatarTone}
                            imageSrc={member.avatarImageSrc}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold theme-text-strong">{member.name}</p>
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

          {currentRound1Submission ? (
            <section id="round1-result">
              <Surface className="px-6 py-6 md:px-8 md:py-8">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                  <div className="max-w-3xl">
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-200/80">
                      {locale === "en" ? "Round 1 result" : "Kết quả Vòng 1"}
                    </p>
                    <p className="theme-heading mt-4 text-3xl font-semibold theme-text-strong">
                      {locale === "en"
                        ? "Your individual result is recorded."
                        : "Kết quả cá nhân của bạn đã được ghi nhận."}
                    </p>
                    <p className="mt-4 text-sm leading-7 theme-text-muted">
                      {round1EssayPending
                        ? locale === "en"
                          ? "The objective section is scored immediately. Essay score and total score remain pending until admin or moderator review is completed."
                          : "Phần khách quan được chấm ngay. Điểm tự luận và tổng điểm vẫn ở trạng thái chờ cho tới khi admin hoặc moderator chấm xong."
                        : locale === "en"
                          ? "Objective score, essay score, and final total are all complete for this Round 1 attempt."
                          : "Điểm khách quan, điểm tự luận và tổng điểm cuối cùng của bài Vòng 1 này đều đã hoàn tất."}
                    </p>
                  </div>
                  <StatusPill tone={round1EssayPending ? "warning" : "success"}>
                    {round1EssayPending
                      ? locale === "en"
                        ? "Essay review pending"
                        : "Đang chờ chấm tự luận"
                      : locale === "en"
                        ? "Fully reviewed"
                        : "Đã chấm hoàn tất"}
                  </StatusPill>
                </div>

                <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-[1.5rem] border theme-border theme-panel-subtle px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.22em] theme-text-soft">
                      {locale === "en" ? "Objective score" : "Điểm khách quan"}
                    </p>
                    <p className="mt-3 text-3xl font-semibold theme-text-strong">
                      {`${currentRound1Submission.objectiveScore} / ${ROUND1_OBJECTIVE_MAX_SCORE}`}
                    </p>
                    <p className="mt-2 text-sm theme-text-soft">
                      {locale === "en"
                        ? `${currentRound1Submission.rightCount} right · ${currentRound1Submission.wrongCount} wrong`
                        : `${currentRound1Submission.rightCount} đúng · ${currentRound1Submission.wrongCount} sai`}
                    </p>
                  </div>
                  <div className="rounded-[1.5rem] border theme-border theme-panel-subtle px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.22em] theme-text-soft">
                      {locale === "en" ? "Essay score" : "Điểm tự luận"}
                    </p>
                    <p className="mt-3 text-3xl font-semibold theme-text-strong">
                      {currentRound1Submission.essayScore == null
                        ? locale === "en"
                          ? "Pending"
                          : "Đang chờ"
                        : `${currentRound1Submission.essayScore} / ${ROUND1_ESSAY_MAX_SCORE}`}
                    </p>
                    <p className="mt-2 text-sm theme-text-soft">
                      {locale === "en"
                        ? "Manually reviewed by admin or moderator"
                        : "Được admin hoặc moderator chấm thủ công"}
                    </p>
                  </div>
                  <div className="rounded-[1.5rem] border theme-border theme-panel-subtle px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.22em] theme-text-soft">
                      {locale === "en" ? "Total score" : "Tổng điểm"}
                    </p>
                    <p className="mt-3 text-3xl font-semibold theme-text-strong">
                      {currentRound1Submission.totalScore == null
                        ? locale === "en"
                          ? "Pending"
                          : "Đang chờ"
                        : `${currentRound1Submission.totalScore} / ${ROUND1_TOTAL_MAX_SCORE}`}
                    </p>
                    <p className="mt-2 text-sm theme-text-soft">
                      {locale === "en"
                        ? "Confirmed after essay review"
                        : "Được xác nhận sau khi chấm tự luận"}
                    </p>
                  </div>
                  <div className="rounded-[1.5rem] border theme-border theme-panel-subtle px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.22em] theme-text-soft">
                      {locale === "en" ? "Submission info" : "Thông tin bài nộp"}
                    </p>
                    <p className="mt-3 text-lg font-semibold theme-text-strong">
                      {`${currentRound1Submission.durationMinutes} ${locale === "en" ? "minutes" : "phút"}`}
                    </p>
                    <p className="mt-2 text-sm theme-text-soft">
                      {formatDateLabel(locale, currentRound1Submission.submittedAt)}
                    </p>
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
                  isLeader={Boolean(isLeader)}
                  isCurrentRound={isTeamCurrentlyCompetingRound(currentTeam, "round-3")}
                  hasPassedRound={hasTeamPassedRound(currentTeam, "round-3")}
                  isRoundFinished={round3Finished}
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

          <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <Surface className="px-6 py-6 md:px-8 md:py-8">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-200/80">
                    {locale === "en" ? "Invite teammates" : "Mời thành viên"}
                  </p>
                  <p className="mt-4 text-2xl font-semibold theme-text-strong">
                    {locale === "en"
                      ? "Build the team around complementary skills."
                      : "Xây dựng đội với các kỹ năng bổ trợ cho nhau."}
                  </p>
                </div>
                <StatusPill>{`${openSlots} ${locale === "en" ? "slots left" : "cho trong"}`}</StatusPill>
              </div>

              <div className="mt-6 rounded-[1.5rem] border theme-border theme-panel-subtle px-4 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-semibold theme-text-strong">
                    {locale === "en" ? "Available students only" : "Chỉ hiện sinh viên chưa ở đội nào"}
                  </p>
                  {teamRosterLocked ? (
                    <StatusPill tone="warning">
                      {locale === "en" ? "Roster locked" : "Đội hình đã khóa"}
                    </StatusPill>
                  ) : isTeamFull ? (
                    <StatusPill tone="warning">
                      {locale === "en" ? "Team is full" : "Đội đã đủ thành viên"}
                    </StatusPill>
                  ) : null}
                </div>
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
                        ? "Search across students who are not currently members of any team."
                        : "Tìm trong danh sách sinh viên hiện chưa là thành viên của bất kỳ đội nào."}
                </p>
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
              </div>

              <div className="mt-6 space-y-3">
                {filteredAvailableUsers.map((user) => {
                  const alreadyInvited = sentInvitations.some((invitation) => invitation.toUserId === user.id);
                  const canInvite = Boolean(isLeader && !alreadyInvited && openSlots > 0 && !isTeamFull && !teamRosterLocked);

                  return (
                    <div
                      key={user.id}
                      className="flex flex-col gap-4 rounded-[1.5rem] border theme-border theme-panel px-4 py-4 md:flex-row md:items-center md:justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <GradientAvatar label={user.name} tone={user.avatarTone} imageSrc={user.avatarImageSrc} />
                        <div>
                          <p className="text-sm font-semibold theme-text-strong">{user.name}</p>
                          <p className="text-xs theme-text-soft">{user.university}</p>
                          <p className="mt-1 text-xs theme-text-faint">{user.major}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={!canInvite}
                        onClick={() => inviteUser(user.id)}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border theme-border-strong theme-panel px-4 py-3 text-sm font-semibold theme-text-strong disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <UserPlus2 className="h-4 w-4" />
                        {alreadyInvited
                          ? locale === "en"
                            ? "Invite pending"
                            : "Đang chờ"
                          : locale === "en"
                            ? "Invite"
                            : "Moi vao doi"}
                      </button>
                    </div>
                  );
                })}
                {filteredAvailableUsers.length === 0 ? (
                  <div className="rounded-[1.5rem] border theme-border theme-panel-subtle px-4 py-4 text-sm leading-7 theme-text-muted">
                    {teamRosterLocked
                      ? locale === "en"
                        ? "Roster changes are locked right now, so the invite list is intentionally disabled."
                        : "Đội hình hiện đang bị khóa nên danh sách mời thêm thành viên đang được tắt có chủ đích."
                      : inviteSearch.trim()
                      ? locale === "en"
                        ? "No available free-agent students match this search."
                        : "Không có sinh viên chưa vào đội nào phù hợp với từ khóa tìm kiếm này."
                      : locale === "en"
                        ? "No free-agent students are available right now."
                        : "Hiện không có sinh viên tự do nào để mời vào đội."}
                  </div>
                ) : null}
              </div>
            </Surface>

            <Surface className="px-6 py-6">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-200/80">
                {locale === "en" ? "Leader tools" : "Công cụ đội trưởng"}
              </p>
              <div className="mt-5 space-y-4">
                <label className="block space-y-2">
                  <span className="text-sm theme-text-muted">
                    {locale === "en" ? "Transfer leadership" : "Chuyển đội trưởng"}
                  </span>
                  <select
                    disabled={!isLeader || Boolean(outgoingLeadershipTransfer) || teamRosterLocked}
                    value={leadershipTargetId}
                    onChange={(event) => setLeadershipTargetId(event.target.value)}
                    className="w-full rounded-2xl border theme-border theme-panel px-4 py-3 text-sm theme-text-strong outline-none disabled:opacity-40"
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
                </label>
                <button
                  type="button"
                  disabled={!isLeader || !leadershipTargetId || Boolean(outgoingLeadershipTransfer) || teamRosterLocked}
                  onClick={() => {
                    transferLeadership(leadershipTargetId);
                    setLeadershipTargetId("");
                  }}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border theme-border-strong theme-panel px-4 py-3 text-sm font-semibold theme-text-strong disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Crown className="h-4 w-4" />
                  {locale === "en" ? "Send leadership request" : "Gửi yêu cầu đội trưởng"}
                </button>
                <button
                  type="button"
                  disabled={teamRosterLocked}
                  onClick={leaveCurrentTeam}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border theme-border-strong theme-panel px-4 py-3 text-sm font-semibold theme-text-strong disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <LogOut className="h-4 w-4" />
                  {locale === "en" ? "Leave current team" : "Rời đội hiện tại"}
                </button>
                <div className="rounded-[1.5rem] border theme-border theme-panel-subtle px-4 py-4 text-sm leading-7 theme-text-muted">
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
                  <div className="rounded-[1.5rem] border theme-border theme-panel-subtle px-4 py-4 text-sm leading-7 theme-text-muted">
                    {locale === "en"
                      ? `Waiting for ${users.find((user) => user.id === outgoingLeadershipTransfer.toUserId)?.name ?? "the selected member"} to accept the leadership transfer request.`
                      : `Đang chờ ${users.find((user) => user.id === outgoingLeadershipTransfer.toUserId)?.name ?? "thành viên được chọn"} chấp nhận yêu cầu chuyển đội trưởng.`}
                  </div>
                ) : null}
                {sentInvitations.length > 0 ? (
                  <div className="rounded-[1.5rem] border theme-border theme-panel-subtle px-4 py-4">
                    <p className="text-sm font-semibold theme-text-strong">
                      {locale === "en" ? "Pending sent invites" : "Loi moi da gui"}
                    </p>
                    <div className="mt-3 space-y-2">
                      {sentInvitations.map((invitation) => {
                        const targetUser = users.find((user) => user.id === invitation.toUserId);

                        return (
                          <div key={invitation.id} className="flex items-center gap-3 text-sm theme-text-muted">
                            <MailPlus className="h-4 w-4 text-sky-200" />
                            <span>{targetUser?.name ?? invitation.toUserId}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </div>
            </Surface>
          </section>
        </>
      ) : (
        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <Surface className="px-6 py-6 md:px-8 md:py-8">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-200/80">
              {locale === "en" ? "Create team" : "Tạo đội"}
            </p>
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
                <span className="text-sm theme-text-muted">{locale === "en" ? "Track" : "Hướng thi"}</span>
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
                  ? `The team avatar is independent from the leader avatar. If no image is uploaded, the team keeps its own gradient identity. Maximum size ${formatFileSize(MAX_AVATAR_FILE_BYTES)}.`
                  : `Avatar đội được tách riêng khỏi avatar đội trưởng. Nếu chưa tải ảnh, đội sẽ dùng nhận diện gradient riêng của mình. Dung lượng tối đa ${formatFileSize(MAX_AVATAR_FILE_BYTES)}.`}
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
              onClick={handleTeamSave}
              className="theme-button-primary mt-6 w-full rounded-[1.4rem] px-5 py-3.5 text-sm font-semibold"
            >
              {locale === "en" ? "Create team" : "Tạo đội"}
            </button>
          </Surface>

          <Surface className="px-6 py-6">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-200/80">
              {locale === "en" ? "Invitation inbox" : "Hop thu loi moi"}
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
                          {locale === "en" ? "Accept" : "Chap nhan"}
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

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Surface className="px-6 py-6 md:px-8 md:py-8">
          <SectionHeading
            eyebrow={locale === "en" ? "Team submission rules" : "Quy tac nop bai"}
            title={
              locale === "en"
                ? "Unlimited versions are allowed, but only the latest one is valid."
                : "Được phép nộp không giới hạn phiên bản, nhưng chỉ phiên bản mới nhất mới hợp lệ."
            }
            description={
              locale === "en"
                ? "The submission center above keeps the latest version in focus while preserving earlier versions for review history."
                : "Khu submission bên trên giữ trọng tâm vào phiên bản mới nhất, đồng thời vẫn lưu các phiên bản trước để đối chiếu lịch sử."
            }
          />
        </Surface>

        <Surface className="px-6 py-6">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-200/80">
            {locale === "en" ? "Next route" : "Route tiep theo"}
          </p>
          <p className="mt-4 text-2xl font-semibold theme-text-strong">
            {locale === "en" ? "Check the competition page." : "Xem lai trang cuoc thi."}
          </p>
          <p className="mt-4 text-sm leading-7 theme-text-muted">
            {locale === "en"
              ? "That page now presents the reward tiers more distinctly and still keeps the larger competition intro block."
              : "Trang do hien trinh bay cac hang muc giai thuong tach biet ro hon va van giu khoi intro lon cua cuoc thi."}
          </p>
          <Link href="/competition" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold theme-accent">
            {locale === "en" ? "Open competition page" : "Mở trang cuộc thi"}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Surface>
      </section>
    </div>
  );
}

function SubmissionRoundCard({
  locale,
  round,
  isLeader,
  isCurrentRound,
  hasPassedRound,
  isRoundFinished,
  submissions,
  users,
  form,
  onFormChange,
  onSubmit,
}: {
  locale: Locale;
  round: SubmissionRound;
  isLeader: boolean;
  isCurrentRound: boolean;
  hasPassedRound: boolean;
  isRoundFinished: boolean;
  submissions: TeamSubmission[];
  users: UserProfile[];
  form: SubmissionFormState;
  onFormChange: (payload: Partial<SubmissionFormState>) => void;
  onSubmit: () => void | Promise<void>;
}) {
  const sortedSubmissions = [...submissions].sort((a, b) => b.version - a.version);
  const latestSubmission = sortedSubmissions[0];
  const roundLabel =
    round === "round-2"
      ? locale === "en"
        ? "Round 2 report submission"
        : "Nộp báo cáo Vòng 2"
      : locale === "en"
        ? "Final round submission"
        : "Nộp bài vòng chung kết";
  const roundWindow = getCompetitionRoundWindow(round);
  const roundWindowLabel = roundWindow
    ? formatDateRangeLabel(locale, roundWindow.startDate, roundWindow.endDate)
    : undefined;
  const canSubmit = isLeader && isCurrentRound && !isRoundFinished;
  const statusPill = isRoundFinished
    ? locale === "en"
      ? `${pickRoundLabel(locale, round)} finished`
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
            : `v${latestSubmission.version} moi nhat hop le`
          : locale === "en"
            ? "No submission yet"
            : "Chưa có bài nộp";
  const lockMessage = isRoundFinished
    ? locale === "en"
      ? `${pickRoundLabel(locale, round)} is finished. You can no longer submit new versions for this round.`
      : `${pickRoundLabel(locale, round)} đã kết thúc. Bạn không còn thể nộp phiên bản mới cho vòng này.`
    : hasPassedRound
      ? locale === "en"
        ? `This team has already advanced past ${pickRoundLabel(locale, round)}. Submission history stays visible, but this round is no longer active.`
        : `Đội này đã vượt qua ${pickRoundLabel(locale, round)}. Lịch sử nộp bài vẫn được giữ lại, nhưng vòng này không còn đang hoạt động.`
      : locale === "en"
        ? "Only the team leader can submit a new version for this round."
        : "Chỉ đội trưởng mới có thể nộp phiên bản mới cho vòng này.";

  const latestSubmissionHref = latestSubmission
    ? latestSubmission.resourceUrl
    : undefined;

  return (
    <Surface className="px-6 py-6 md:px-8 md:py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <StatusPill tone={isRoundFinished ? "warning" : "success"}>
              {pickRoundLabel(locale, round)}
            </StatusPill>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-200/80">
              {locale === "en" ? "Submission center" : "Trung tam submission"}
            </p>
          </div>
          <p className="mt-4 text-3xl font-semibold theme-text-strong">{roundLabel}</p>
          {roundWindowLabel ? (
            <p className="mt-2 text-sm theme-text-soft">{roundWindowLabel}</p>
          ) : null}
        </div>
        <StatusPill tone={isRoundFinished ? "warning" : latestSubmission || isCurrentRound || hasPassedRound ? "success" : "warning"}>
          {statusPill}
        </StatusPill>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          {latestSubmission ? (
            <div className="rounded-[1.5rem] border theme-border theme-panel px-5 py-5">
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-200/80">
                  {locale === "en" ? "Current valid version" : "Phien ban hop le hien tai"}
                </p>
                <StatusPill tone="success">{`v${latestSubmission.version}`}</StatusPill>
              </div>
              <p className="mt-4 text-xl font-semibold theme-text-strong">{latestSubmission.title}</p>
              <p className="mt-3 text-sm leading-7 theme-text-muted">{latestSubmission.summary}</p>
              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm theme-text-soft">
                <span>{formatDateLabel(locale, latestSubmission.submittedAt)}</span>
                <span>·</span>
                <span>
                  {(users.find((user) => user.id === latestSubmission.submittedByUserId) ?? users[0]).name}
                </span>
              </div>
              {latestSubmissionHref ? (
                <a
                  href={latestSubmissionHref}
                  target={latestSubmission.resourceSource === "external" ? "_blank" : undefined}
                  rel={latestSubmission.resourceSource === "external" ? "noreferrer" : undefined}
                  download={latestSubmission.resourceSource === "upload" ? latestSubmission.resourceLabel : undefined}
                  className="mt-5 inline-flex items-center gap-2 text-sm font-semibold theme-accent"
                >
                  <FolderClock className="h-4 w-4" />
                  {latestSubmission.resourceLabel}
                </a>
              ) : (
                <p className="mt-5 text-sm theme-text-soft">{latestSubmission.resourceLabel}</p>
              )}
              {latestSubmission.resourceSizeBytes ? (
                <p className="mt-2 text-xs theme-text-faint">{formatFileSize(latestSubmission.resourceSizeBytes)}</p>
              ) : null}
            </div>
          ) : (
            <div className="rounded-[1.5rem] border theme-border theme-panel-subtle px-5 py-5 text-sm leading-7 theme-text-muted">
              {locale === "en"
                ? "No report has been submitted for this round yet."
                : "Chưa có báo cáo nào được nộp cho vòng này."}
            </div>
          )}

          <div className="rounded-[1.5rem] border theme-border theme-panel-subtle px-5 py-5">
            <p className="text-sm font-semibold theme-text-strong">
              {locale === "en" ? "Version history" : "Lich su phien ban"}
            </p>
            <div className="mt-4 space-y-3">
              {sortedSubmissions.length > 0 ? (
                sortedSubmissions.map((submission, index) => (
                  <div
                    key={submission.id}
                    className="rounded-[1.25rem] border theme-border theme-panel px-4 py-4"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold theme-text-strong">{submission.title}</p>
                        <p className="mt-1 text-xs theme-text-soft">
                          {formatDateLabel(locale, submission.submittedAt)}
                        </p>
                      </div>
                      <StatusPill tone={index === 0 ? "success" : "default"}>
                        {index === 0
                          ? locale === "en"
                            ? `Valid v${submission.version}`
                            : `v${submission.version} hop le`
                          : locale === "en"
                            ? `Archived v${submission.version}`
                            : `v${submission.version} cu`}
                      </StatusPill>
                    </div>
                    <p className="mt-3 text-sm leading-7 theme-text-muted">{submission.summary}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                      {submission.resourceUrl ? (
                        <a
                          href={submission.resourceUrl}
                          download={submission.resourceSource === "upload" ? submission.resourceLabel : undefined}
                          target={submission.resourceSource === "external" ? "_blank" : undefined}
                          rel={submission.resourceSource === "external" ? "noreferrer" : undefined}
                          className="font-semibold theme-accent"
                        >
                          {submission.resourceLabel}
                        </a>
                      ) : (
                        <span className="theme-text-soft">{submission.resourceLabel}</span>
                      )}
                      {submission.resourceSizeBytes ? (
                        <span className="theme-text-faint">{formatFileSize(submission.resourceSizeBytes)}</span>
                      ) : null}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm theme-text-soft">
                  {locale === "en" ? "Version history will appear after the first upload." : "Lich su phien ban se hien ra sau lan nop dau tien."}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-[1.5rem] border theme-border theme-panel px-5 py-5">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-200/80">
            {locale === "en" ? "Submit new version" : "Nop phien ban moi"}
          </p>
          {canSubmit ? (
            <div className="mt-5 space-y-4">
              <label className="space-y-2">
                <span className="text-sm theme-text-muted">{locale === "en" ? "Submission title" : "Tieu de submission"}</span>
                <input
                  value={form.title}
                  onChange={(event) => onFormChange({ title: event.target.value })}
                  className="theme-placeholder w-full rounded-2xl border theme-border theme-panel-subtle px-4 py-3 text-sm theme-text-strong outline-none"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm theme-text-muted">{locale === "en" ? "Submission file" : "Tep bai nop"}</span>
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
                    : `Cho phep: PDF hoac RAR. Dung luong toi da ${formatFileSize(MAX_SUBMISSION_FILE_BYTES)}.`}
                </p>
                {form.resourceFile ? (
                  <p className="text-xs theme-text-soft">
                    {formatFileSize(form.resourceFile.size)}
                  </p>
                ) : null}
              </label>
              <label className="space-y-2">
                <span className="text-sm theme-text-muted">{locale === "en" ? "Submission notes" : "Ghi chu submission"}</span>
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
                {locale === "en" ? "Submit new version" : "Nop phien ban moi"}
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
  );
}
