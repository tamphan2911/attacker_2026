"use client";

import { signOut, useSession } from "next-auth/react";
import {
  useCallback,
  createContext,
  useContext,
  useEffect,
  useEffectEvent,
  useState,
  type ReactNode,
} from "react";
import { CheckCircle2, Info, TriangleAlert, X } from "lucide-react";

import {
  DEMO_ADMIN_LOGIN_ID,
  TEAM_MAX_MEMBERS,
  TEAM_MIN_MEMBERS,
  defaultPageContent,
  judgeProfiles as seedJudgeProfiles,
  mockInvitations,
  mockLeadershipTransferRequests,
  mockRound1TeamLockRequests,
  newsPosts as seedNewsPosts,
  round1IndividualSubmissions as seedRound1Submissions,
  round1TestBanks as seedRound1TestBanks,
  mockSubmissions,
  mockTeams,
  mockUsers,
} from "@/data/site-content";
import {
  getPendingInvitesForTeam,
  getPendingInvitesForUser,
  getTeamForUser,
  pickText,
} from "@/lib/site";
import {
  canTeamSubmitForRound,
  canTeamTakeRound1,
  getTeamCompetitionState,
  isTeamRosterLocked,
  isTeamRound1Locked,
  pickCompetitionStateLabel,
  pickRoundLabel,
} from "@/lib/competition";
import {
  getSubmissionValidationError,
} from "@/lib/submission-files";
import type {
  AppSnapshot,
  CompetitionStage,
  JudgeProfile,
  LeadershipTransferRequest,
  Locale,
  LocalizedText,
  NewsPost,
  Round1Question,
  Round1Submission,
  Round1TeamLockRequest,
  Round1TestBank,
  SitePageContent,
  TeamInvitation,
  TeamProfile,
  TeamSubmission,
  Theme,
  UserProfile,
} from "@/types/site";

const STORAGE_KEY = "attacker-2026-site-state-v16";

const GUEST_USER: UserProfile = {
  id: "",
  name: "",
  email: "",
  role: "student",
  studentId: "",
  university: "",
  major: "",
  classYear: "",
  bio: "",
  avatarTone: "from-sky-500 via-cyan-400 to-emerald-400",
  providers: [],
};

interface WorkspaceApiPayload {
  currentUserId: string;
  users: UserProfile[];
  teams: TeamProfile[];
  invitations: TeamInvitation[];
  leadershipTransferRequests: LeadershipTransferRequest[];
  teamLockRequests: Round1TeamLockRequest[];
  submissions: TeamSubmission[];
  round1Submissions: Round1Submission[];
}

interface SiteDataApiPayload {
  pageContent: SitePageContent;
  judges: JudgeProfile[];
  newsPosts: NewsPost[];
  round1TestBanks: Round1TestBank[];
}

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type ToastTone = "success" | "warning" | "info";

interface ToastMessage {
  id: string;
  message: LocalizedText;
  tone: ToastTone;
}

interface SiteStateValue {
  authStatus: AuthStatus;
  isAuthenticated: boolean;
  locale: Locale;
  theme: Theme;
  activeUserId: string;
  users: UserProfile[];
  teams: TeamProfile[];
  invitations: TeamInvitation[];
  leadershipTransferRequests: LeadershipTransferRequest[];
  teamLockRequests: Round1TeamLockRequest[];
  submissions: TeamSubmission[];
  round1TestBanks: Round1TestBank[];
  round1Submissions: Round1Submission[];
  newsPosts: NewsPost[];
  judges: JudgeProfile[];
  pageContent: SitePageContent;
  currentUser: UserProfile;
  currentTeam?: TeamProfile;
  canAccessAdminMode: boolean;
  hasHydrated: boolean;
  setLocale: (locale: Locale) => void;
  setTheme: (theme: Theme) => void;
  setActiveUserId: (userId: string) => void;
  signOutCurrentUser: () => Promise<void>;
  resetDemoData: () => void;
  savePageContent: (nextPageContent: SitePageContent) => void;
  createNewsPostByAdmin: (payload: NewsPost) => void;
  updateNewsPostByAdmin: (slug: string, payload: NewsPost) => void;
  deleteNewsPostByAdmin: (slug: string) => void;
  createJudgeByAdmin: (payload: JudgeProfile) => Promise<boolean>;
  updateJudgeByAdmin: (judgeId: string, payload: JudgeProfile) => Promise<boolean>;
  deleteJudgeByAdmin: (judgeId: string) => Promise<boolean>;
  updateActiveUserProfile: (payload: Partial<UserProfile>) => void;
  updateUserByAdmin: (userId: string, payload: Partial<UserProfile>) => void;
  deleteUserByAdmin: (userId: string) => void;
  createTeam: (payload: Pick<TeamProfile, "name" | "tag" | "avatarTone" | "avatarImageSrc" | "track" | "bio">) => void;
  updateCurrentTeam: (payload: Partial<Pick<TeamProfile, "name" | "tag" | "avatarTone" | "avatarImageSrc" | "track" | "bio">>) => void;
  updateTeamByAdmin: (
    teamId: string,
    payload: Partial<Pick<TeamProfile, "name" | "tag" | "avatarTone" | "avatarImageSrc" | "track" | "bio" | "leaderId" | "stage">>,
  ) => void;
  deleteTeamByAdmin: (teamId: string) => void;
  updateRound1QuestionByAdmin: (bankId: string, questionId: string, payload: Round1Question) => void;
  updateRound1EssayScoreByAdmin: (submissionId: string, essayScore: number) => void;
  inviteUser: (userId: string) => void;
  respondToInvitation: (invitationId: string, decision: "accept" | "decline") => void;
  initiateRound1TeamLock: () => void;
  respondToRound1TeamLock: (requestId: string, decision: "accept" | "decline") => void;
  leaveCurrentTeam: () => void;
  transferLeadership: (nextLeaderId: string) => void;
  respondToLeadershipTransfer: (requestId: string, decision: "accept" | "decline") => void;
  submitRound1Attempt: (payload: Pick<Round1Submission, "bankId" | "rightCount" | "wrongCount" | "objectiveScore" | "durationMinutes">) => void;
  submitTeamSubmission: (payload: {
    round: TeamSubmission["round"];
    title: string;
    summary: string;
    resourceFile: File | null;
  }) => Promise<boolean>;
}

const SiteStateContext = createContext<SiteStateValue | null>(null);

function clonePageContent(content: SitePageContent): SitePageContent {
  return JSON.parse(JSON.stringify(content)) as SitePageContent;
}

function createInitialSnapshot(): AppSnapshot {
  return {
    locale: "vi",
    theme: "light",
    activeUserId: "",
    users: mockUsers,
    teams: mockTeams,
    invitations: mockInvitations,
    leadershipTransferRequests: mockLeadershipTransferRequests,
    teamLockRequests: mockRound1TeamLockRequests,
    submissions: mockSubmissions,
    round1TestBanks: seedRound1TestBanks,
    round1Submissions: seedRound1Submissions,
    newsPosts: seedNewsPosts,
    judges: seedJudgeProfiles,
    pageContent: clonePageContent(defaultPageContent),
  };
}

export function SiteStateProvider({ children }: { children: ReactNode }) {
  const { data: session, status: authStatus } = useSession();
  const [locale, setLocaleState] = useState<Locale>("vi");
  const [theme, setThemeState] = useState<Theme>("light");
  const [activeUserId, setActiveUserIdState] = useState("");
  const [users, setUsers] = useState<UserProfile[]>(mockUsers);
  const [teams, setTeams] = useState<TeamProfile[]>(mockTeams);
  const [invitations, setInvitations] = useState<TeamInvitation[]>(mockInvitations);
  const [leadershipTransferRequests, setLeadershipTransferRequests] =
    useState<LeadershipTransferRequest[]>(mockLeadershipTransferRequests);
  const [teamLockRequests, setTeamLockRequests] =
    useState<Round1TeamLockRequest[]>(mockRound1TeamLockRequests);
  const [submissions, setSubmissions] = useState<TeamSubmission[]>(mockSubmissions);
  const [round1TestBanks, setRound1TestBanks] = useState<Round1TestBank[]>(seedRound1TestBanks);
  const [round1Submissions, setRound1Submissions] = useState<Round1Submission[]>(seedRound1Submissions);
  const [newsPosts, setNewsPosts] = useState<NewsPost[]>(seedNewsPosts);
  const [judges, setJudges] = useState<JudgeProfile[]>(seedJudgeProfiles);
  const [pageContent, setPageContent] = useState<SitePageContent>(() => clonePageContent(defaultPageContent));
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [hasHydrated, setHasHydrated] = useState(false);
  const isAuthenticated = authStatus === "authenticated" && Boolean(session?.user?.id);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        setHasHydrated(true);
        return;
      }

      const snapshot = JSON.parse(raw) as AppSnapshot;
      setLocaleState(snapshot.locale);
      setThemeState(snapshot.theme ?? "light");
      setActiveUserIdState(snapshot.activeUserId);
      setUsers(snapshot.users);
      setTeams(snapshot.teams);
      setInvitations(snapshot.invitations);
      setLeadershipTransferRequests(
        snapshot.leadershipTransferRequests ?? mockLeadershipTransferRequests,
      );
      setTeamLockRequests(snapshot.teamLockRequests ?? mockRound1TeamLockRequests);
      setSubmissions(snapshot.submissions ?? mockSubmissions);
      setRound1TestBanks(snapshot.round1TestBanks ?? seedRound1TestBanks);
      setRound1Submissions(snapshot.round1Submissions ?? seedRound1Submissions);
      setNewsPosts(snapshot.newsPosts ?? seedNewsPosts);
      setJudges(snapshot.judges ?? seedJudgeProfiles);
      setPageContent(snapshot.pageContent ?? clonePageContent(defaultPageContent));
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    } finally {
      setHasHydrated(true);
    }
  }, []);

  const persistSnapshot = useEffectEvent((snapshot: AppSnapshot) => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  });

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    persistSnapshot({
      locale,
      theme,
      activeUserId,
      users,
      teams,
      invitations,
      leadershipTransferRequests,
      teamLockRequests,
      submissions,
      round1TestBanks,
      round1Submissions,
      newsPosts,
      judges,
      pageContent,
    });
  }, [activeUserId, hasHydrated, invitations, judges, leadershipTransferRequests, locale, newsPosts, pageContent, round1Submissions, round1TestBanks, submissions, teamLockRequests, theme, teams, users]);

  const pushToast = (message: LocalizedText, tone: ToastTone = "info") => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setToasts((current) => [...current, { id, message, tone }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 3400);
  };

  const extractResponseError = async (response: Response, fallback: string) => {
    try {
      const payload = (await response.json()) as { error?: string };
      return payload.error?.trim() || fallback;
    } catch {
      return fallback;
    }
  };

  const syncSiteData = useCallback(async () => {
    const response = await fetch("/api/site-data", {
      cache: "no-store",
      credentials: "same-origin",
    });

    if (!response.ok) {
      throw new Error("Unable to load the latest site data.");
    }

    const payload = (await response.json()) as SiteDataApiPayload;
    setPageContent(payload.pageContent);
    setJudges(payload.judges);
    setNewsPosts(payload.newsPosts);
    setRound1TestBanks(payload.round1TestBanks);
  }, []);

  const syncWorkspace = useCallback(async () => {
    if (!isAuthenticated || !session?.user?.id) {
      return;
    }

    const response = await fetch("/api/workspace", {
      cache: "no-store",
      credentials: "same-origin",
    });

    if (!response.ok) {
      if (response.status === 401) {
        setActiveUserIdState("");
        return;
      }

      throw new Error("Unable to sync the current workspace.");
    }

    const payload = (await response.json()) as WorkspaceApiPayload;
    setActiveUserIdState(payload.currentUserId);
    setUsers(payload.users);
    setTeams(payload.teams);
    setInvitations(payload.invitations);
    setLeadershipTransferRequests(payload.leadershipTransferRequests);
    setTeamLockRequests(payload.teamLockRequests);
    setRound1Submissions(payload.round1Submissions);
    setSubmissions(payload.submissions);
  }, [isAuthenticated, session?.user?.id]);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    void syncSiteData().catch(() => {
      pushToast(
        {
          en: "Could not load the latest public site data from the backend.",
          vi: "Không thể tải dữ liệu công khai mới nhất từ backend.",
        },
        "warning",
      );
    });
  }, [hasHydrated, syncSiteData]);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    if (!isAuthenticated) {
      setActiveUserIdState("");
      return;
    }

    void syncWorkspace().catch(() => {
      pushToast(
        {
          en: "Could not sync the latest account workspace from the backend.",
          vi: "Không thể đồng bộ workspace tài khoản mới nhất từ backend.",
        },
        "warning",
      );
    });
  }, [hasHydrated, isAuthenticated, session?.user?.id, syncWorkspace]);

  const currentUser = users.find((user) => user.id === activeUserId) ?? GUEST_USER;
  const currentTeam = currentUser.id ? getTeamForUser(activeUserId, teams) : undefined;
  const canAccessAdminMode =
    isAuthenticated && (currentUser.role === "admin" || currentUser.role === "moderator");

  const getPendingTeamLockRequests = (teamId: string, protocolId?: string) =>
    teamLockRequests.filter(
      (request) =>
        request.teamId === teamId &&
        request.status === "pending" &&
        (!protocolId || request.protocolId === protocolId),
    );

  const setLocale = (nextLocale: Locale) => {
    setLocaleState(nextLocale);
  };

  const setTheme = (nextTheme: Theme) => {
    setThemeState(nextTheme);
  };

  const setActiveUserId = (userId: string) => {
    if (isAuthenticated) {
      return;
    }

    setActiveUserIdState(userId);
  };

  const signOutCurrentUser = async () => {
    await signOut({ redirect: false });
    setActiveUserIdState("");
    window.location.assign("/");
  };

  const resetDemoData = () => {
    const snapshot = createInitialSnapshot();
    setLocaleState(snapshot.locale);
    setThemeState(snapshot.theme);
    setActiveUserIdState(snapshot.activeUserId);
    setUsers(snapshot.users);
    setTeams(snapshot.teams);
    setInvitations(snapshot.invitations);
    setLeadershipTransferRequests(snapshot.leadershipTransferRequests);
    setTeamLockRequests(snapshot.teamLockRequests);
    setSubmissions(snapshot.submissions);
    setRound1TestBanks(snapshot.round1TestBanks);
    setRound1Submissions(snapshot.round1Submissions);
    setNewsPosts(snapshot.newsPosts);
    setJudges(snapshot.judges);
    setPageContent(snapshot.pageContent);
    pushToast(
      {
        en: "Demo state reset to the default preview.",
        vi: "Đã đặt lại dữ liệu demo về trạng thái mặc định.",
      },
      "info",
    );
  };

  const savePageContent = (nextPageContent: SitePageContent) => {
    if (!canAccessAdminMode) {
      pushToast(
        {
          en: "Only admin and moderator accounts can update page content.",
          vi: "Chi tai khoan admin va moderator moi co the cap nhat noi dung trang.",
        },
        "warning",
      );
      return;
    }

    void (async () => {
      const response = await fetch("/api/admin/content", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify(nextPageContent),
      });

      if (!response.ok) {
        const error = await extractResponseError(response, "Could not save the page content.");
        pushToast({ en: error, vi: error }, "warning");
        return;
      }

      await syncSiteData();
      pushToast(
        {
          en: "Page content updated in admin mode.",
          vi: "Nội dung trang đã được cập nhật trong admin mode.",
        },
        "success",
      );
    })().catch(() => {
      pushToast(
        {
          en: "Could not save the page content right now.",
          vi: "Hiện không thể lưu nội dung trang.",
        },
        "warning",
      );
    });
  };

  const createNewsPostByAdmin = (payload: NewsPost) => {
    if (!canAccessAdminMode) {
      pushToast(
        {
          en: "Only admin and moderator accounts can create news posts here.",
          vi: "Chi tai khoan admin va moderator moi co the tao bai viet tai day.",
        },
        "warning",
      );
      return;
    }

    void (async () => {
      const response = await fetch("/api/admin/news", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await extractResponseError(response, "Could not create the news article.");
        pushToast({ en: error, vi: error }, "warning");
        return;
      }

      await syncSiteData();
      pushToast(
        {
          en: "News article created in admin mode.",
          vi: "Bài viết mới đã được tạo trong admin mode.",
        },
        "success",
      );
    })().catch(() => {
      pushToast(
        {
          en: "Could not create the news article right now.",
          vi: "Hiện không thể tạo bài viết mới.",
        },
        "warning",
      );
    });
  };

  const updateNewsPostByAdmin = (slug: string, payload: NewsPost) => {
    if (!canAccessAdminMode) {
      pushToast(
        {
          en: "Only admin and moderator accounts can edit news posts here.",
          vi: "Chi tai khoan admin va moderator moi co the sua bai viet tai day.",
        },
        "warning",
      );
      return;
    }

    void (async () => {
      const response = await fetch(`/api/admin/news/${slug}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await extractResponseError(response, "Could not update the news article.");
        pushToast({ en: error, vi: error }, "warning");
        return;
      }

      await syncSiteData();
      pushToast(
        {
          en: "News article updated in admin mode.",
          vi: "Bài viết đã được cập nhật trong admin mode.",
        },
        "success",
      );
    })().catch(() => {
      pushToast(
        {
          en: "Could not update the news article right now.",
          vi: "Hiện không thể cập nhật bài viết.",
        },
        "warning",
      );
    });
  };

  const deleteNewsPostByAdmin = (slug: string) => {
    if (!canAccessAdminMode) {
      pushToast(
        {
          en: "Only admin and moderator accounts can delete news posts here.",
          vi: "Chi tai khoan admin va moderator moi co the xoa bai viet tai day.",
        },
        "warning",
      );
      return;
    }

    void (async () => {
      const response = await fetch(`/api/admin/news/${slug}`, {
        method: "DELETE",
        credentials: "same-origin",
      });

      if (!response.ok) {
        const error = await extractResponseError(response, "Could not delete the news article.");
        pushToast({ en: error, vi: error }, "warning");
        return;
      }

      await syncSiteData();
      pushToast(
        {
          en: "News article deleted from the admin dataset.",
          vi: "Bài viết đã được xóa khỏi dữ liệu admin.",
        },
        "success",
      );
    })().catch(() => {
      pushToast(
        {
          en: "Could not delete the news article right now.",
          vi: "Hiện không thể xóa bài viết.",
        },
        "warning",
      );
    });
  };

  const createJudgeByAdmin = async (payload: JudgeProfile) => {
    if (!canAccessAdminMode) {
      pushToast(
        {
          en: "Only admin and moderator accounts can create judges here.",
          vi: "Chỉ tài khoản admin và moderator mới có thể tạo giám khảo tại đây.",
        },
        "warning",
      );
      return false;
    }

    try {
      const response = await fetch("/api/admin/judges", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await extractResponseError(response, "Could not create the judge.");
        pushToast({ en: error, vi: error }, "warning");
        return false;
      }

      await syncSiteData();
      pushToast(
        {
          en: "Judge profile created in admin mode.",
          vi: "Hồ sơ giám khảo đã được tạo trong admin mode.",
        },
        "success",
      );
      return true;
    } catch {
      pushToast(
        {
          en: "Could not create the judge right now.",
          vi: "Hiện không thể tạo giám khảo.",
        },
        "warning",
      );
      return false;
    }
  };

  const updateJudgeByAdmin = async (judgeId: string, payload: JudgeProfile) => {
    if (!canAccessAdminMode) {
      pushToast(
        {
          en: "Only admin and moderator accounts can edit judges here.",
          vi: "Chỉ tài khoản admin và moderator mới có thể sửa giám khảo tại đây.",
        },
        "warning",
      );
      return false;
    }

    try {
      const response = await fetch(`/api/admin/judges/${judgeId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await extractResponseError(response, "Could not update the judge.");
        pushToast({ en: error, vi: error }, "warning");
        return false;
      }

      await syncSiteData();
      pushToast(
        {
          en: "Judge profile updated in admin mode.",
          vi: "Hồ sơ giám khảo đã được cập nhật trong admin mode.",
        },
        "success",
      );
      return true;
    } catch {
      pushToast(
        {
          en: "Could not update the judge right now.",
          vi: "Hiện không thể cập nhật giám khảo.",
        },
        "warning",
      );
      return false;
    }
  };

  const deleteJudgeByAdmin = async (judgeId: string) => {
    if (!canAccessAdminMode) {
      pushToast(
        {
          en: "Only admin and moderator accounts can delete judges here.",
          vi: "Chỉ tài khoản admin và moderator mới có thể xóa giám khảo tại đây.",
        },
        "warning",
      );
      return false;
    }

    try {
      const response = await fetch(`/api/admin/judges/${judgeId}`, {
        method: "DELETE",
        credentials: "same-origin",
      });

      if (!response.ok) {
        const error = await extractResponseError(response, "Could not delete the judge.");
        pushToast({ en: error, vi: error }, "warning");
        return false;
      }

      await syncSiteData();
      pushToast(
        {
          en: "Judge profile removed from the admin dataset.",
          vi: "Hồ sơ giám khảo đã được xóa khỏi dữ liệu admin.",
        },
        "success",
      );
      return true;
    } catch {
      pushToast(
        {
          en: "Could not delete the judge right now.",
          vi: "Hiện không thể xóa giám khảo.",
        },
        "warning",
      );
      return false;
    }
  };

  const updateActiveUserProfile = (payload: Partial<UserProfile>) => {
    if (!isAuthenticated || !currentUser.id) {
      pushToast(
        {
          en: "Sign in before editing the profile.",
          vi: "Hãy đăng nhập trước khi chỉnh sửa hồ sơ.",
        },
        "warning",
      );
      return;
    }

    void (async () => {
      const response = await fetch("/api/me", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({
          name: payload.name ?? currentUser.name,
          email: payload.email ?? currentUser.email,
          studentId: payload.studentId ?? currentUser.studentId,
          university: payload.university ?? currentUser.university,
          major: payload.major ?? currentUser.major,
          classYear: payload.classYear ?? currentUser.classYear,
          bio: payload.bio ?? currentUser.bio,
          avatarImageSrc: payload.avatarImageSrc,
        }),
      });

      if (!response.ok) {
        const error = await extractResponseError(response, "Could not update the profile.");
        pushToast(
          {
            en: error,
            vi: error,
          },
          "warning",
        );
        return;
      }

      const result = (await response.json()) as { user: UserProfile };
      setUsers((current) =>
        current.some((user) => user.id === result.user.id)
          ? current.map((user) => (user.id === result.user.id ? result.user : user))
          : [result.user, ...current],
      );
      pushToast(
        {
          en: "Profile updated successfully.",
          vi: "Hồ sơ đã được cập nhật thành công.",
        },
        "success",
      );
    })().catch(() => {
      pushToast(
        {
          en: "Could not update the profile right now.",
          vi: "Hiện không thể cập nhật hồ sơ.",
        },
        "warning",
      );
    });
  };

  const updateUserByAdmin = (userId: string, payload: Partial<UserProfile>) => {
    if (!canAccessAdminMode) {
      pushToast(
        {
          en: "Only admin and moderator accounts can edit users here.",
          vi: "Chỉ tài khoản admin và moderator mới có thể sửa người dùng tại đây.",
        },
        "warning",
      );
      return;
    }

    if (userId === DEMO_ADMIN_LOGIN_ID) {
      pushToast(
        {
          en: "The fixed admin demo account is locked and cannot be edited.",
          vi: "Tài khoản admin demo cố định đã bị khóa và không thể chỉnh sửa.",
        },
        "warning",
      );
      return;
    }

    void (async () => {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await extractResponseError(response, "Could not update the user.");
        pushToast({ en: error, vi: error }, "warning");
        return;
      }

      await syncWorkspace();
      pushToast(
        {
          en: "User record updated in admin mode.",
          vi: "Hồ sơ người dùng đã được cập nhật trong admin mode.",
        },
        "success",
      );
    })().catch(() => {
      pushToast(
        {
          en: "Could not update the user right now.",
          vi: "Hiện không thể cập nhật người dùng.",
        },
        "warning",
      );
    });
  };

  const deleteUserByAdmin = (userId: string) => {
    if (!canAccessAdminMode) {
      pushToast(
        {
          en: "Only admin and moderator accounts can delete users here.",
          vi: "Chỉ tài khoản admin và moderator mới có thể xóa người dùng tại đây.",
        },
        "warning",
      );
      return;
    }

    if (userId === DEMO_ADMIN_LOGIN_ID) {
      pushToast(
        {
          en: "The fixed admin demo account cannot be deleted.",
          vi: "Tài khoản admin demo cố định không thể bị xóa.",
        },
        "warning",
      );
      return;
    }

    if (userId === activeUserId) {
      pushToast(
        {
          en: "You cannot delete the currently active preview account.",
          vi: "Bạn không thể xóa tài khoản preview đang được sử dụng.",
        },
        "warning",
      );
      return;
    }

    void (async () => {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
        credentials: "same-origin",
      });

      if (!response.ok) {
        const error = await extractResponseError(response, "Could not delete the user.");
        pushToast({ en: error, vi: error }, "warning");
        return;
      }

      await syncWorkspace();
      pushToast(
        {
          en: "User deleted from the admin dataset.",
          vi: "Người dùng đã được xóa khỏi dữ liệu admin.",
        },
        "success",
      );
    })().catch(() => {
      pushToast(
        {
          en: "Could not delete the user right now.",
          vi: "Hiện không thể xóa người dùng.",
        },
        "warning",
      );
    });
  };

  const createTeam = (
    payload: Pick<TeamProfile, "name" | "tag" | "avatarTone" | "avatarImageSrc" | "track" | "bio">,
  ) => {
    if (!isAuthenticated) {
      pushToast(
        {
          en: "Sign in before creating a team.",
          vi: "Hãy đăng nhập trước khi tạo đội.",
        },
        "warning",
      );
      return;
    }

    void (async () => {
      const response = await fetch("/api/teams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await extractResponseError(response, "Could not create the team.");
        pushToast({ en: error, vi: error }, "warning");
        return;
      }

      await syncWorkspace();
      pushToast(
        {
          en: "Team created. It now needs at least 3 members to become eligible.",
          vi: "Đội đã được tạo. Đội cần ít nhất 3 thành viên để đủ điều kiện.",
        },
        "success",
      );
    })().catch(() => {
      pushToast(
        {
          en: "Could not create the team right now.",
          vi: "Hiện không thể tạo đội.",
        },
        "warning",
      );
    });
  };

  const updateCurrentTeam = (
    payload: Partial<Pick<TeamProfile, "name" | "tag" | "avatarTone" | "avatarImageSrc" | "track" | "bio">>,
  ) => {
    const team = getTeamForUser(activeUserId, teams);

    if (!team || team.leaderId !== activeUserId) {
      pushToast(
        {
          en: "Only the current team leader can edit team settings.",
          vi: "Chỉ đội trưởng hiện tại mới có thể sửa thông tin đội.",
        },
        "warning",
      );
      return;
    }

    void (async () => {
      const response = await fetch("/api/teams/current", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({
          name: payload.name ?? team.name,
          tag: payload.tag ?? team.tag,
          avatarTone: payload.avatarTone ?? team.avatarTone,
          avatarImageSrc:
            payload.avatarImageSrc === undefined ? team.avatarImageSrc : payload.avatarImageSrc,
          track: payload.track ?? team.track,
          bio: payload.bio ?? team.bio,
        }),
      });

      if (!response.ok) {
        const error = await extractResponseError(response, "Could not update the team.");
        pushToast({ en: error, vi: error }, "warning");
        return;
      }

      await syncWorkspace();
      pushToast(
        {
          en: "Team profile updated.",
          vi: "Hồ sơ đội đã được cập nhật.",
        },
        "success",
      );
    })().catch(() => {
      pushToast(
        {
          en: "Could not update the team right now.",
          vi: "Hiện không thể cập nhật đội.",
        },
        "warning",
      );
    });
  };

  const updateTeamByAdmin = (
    teamId: string,
    payload: Partial<Pick<TeamProfile, "name" | "tag" | "avatarTone" | "avatarImageSrc" | "track" | "bio" | "leaderId" | "stage">>,
  ) => {
    if (!canAccessAdminMode) {
      pushToast(
        {
          en: "Only admin and moderator accounts can edit teams here.",
          vi: "Chỉ tài khoản admin và moderator mới có thể sửa đội thi tại đây.",
        },
        "warning",
      );
      return;
    }

    const team = teams.find((item) => item.id === teamId);
    if (!team) {
      return;
    }

    if (payload.leaderId && !team.memberIds.includes(payload.leaderId)) {
      pushToast(
        {
          en: "The selected leader must already be a member of the team.",
          vi: "Đội trưởng được chọn phải là thành viên hiện hữu của đội.",
        },
        "warning",
      );
      return;
    }

    void (async () => {
      const response = await fetch(`/api/admin/teams/${teamId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await extractResponseError(response, "Could not update the team.");
        pushToast({ en: error, vi: error }, "warning");
        return;
      }

      await syncWorkspace();
      pushToast(
        {
          en: "Team record updated in admin mode.",
          vi: "Hồ sơ đội thi đã được cập nhật trong admin mode.",
        },
        "success",
      );
    })().catch(() => {
      pushToast(
        {
          en: "Could not update the team right now.",
          vi: "Hiện không thể cập nhật đội thi.",
        },
        "warning",
      );
    });
  };

  const deleteTeamByAdmin = (teamId: string) => {
    if (!canAccessAdminMode) {
      pushToast(
        {
          en: "Only admin and moderator accounts can delete teams here.",
          vi: "Chỉ tài khoản admin và moderator mới có thể xóa đội thi tại đây.",
        },
        "warning",
      );
      return;
    }

    void (async () => {
      const response = await fetch(`/api/admin/teams/${teamId}`, {
        method: "DELETE",
        credentials: "same-origin",
      });

      if (!response.ok) {
        const error = await extractResponseError(response, "Could not delete the team.");
        pushToast({ en: error, vi: error }, "warning");
        return;
      }

      await syncWorkspace();
      pushToast(
        {
          en: "Team deleted from the admin dataset.",
          vi: "Đội thi đã được xóa khỏi dữ liệu admin.",
        },
        "success",
      );
    })().catch(() => {
      pushToast(
        {
          en: "Could not delete the team right now.",
          vi: "Hiện không thể xóa đội thi.",
        },
        "warning",
      );
    });
  };

  const updateRound1QuestionByAdmin = (
    bankId: string,
    questionId: string,
    payload: Round1Question,
  ) => {
    if (!canAccessAdminMode) {
      pushToast(
        {
          en: "Only admin and moderator accounts can edit Round 1 questions here.",
          vi: "Chỉ tài khoản admin và moderator mới có thể sửa câu hỏi Vòng 1 tại đây.",
        },
        "warning",
      );
      return;
    }

    if (!payload.topic.trim() || !payload.prompt.en.trim() || !payload.prompt.vi.trim()) {
      pushToast(
        {
          en: "Question topic and bilingual prompts are required.",
          vi: "Chu de cau hoi va prompt song ngu la bat buoc.",
        },
        "warning",
      );
      return;
    }

    const options = payload.options ?? [];
    const correctOptionIds = payload.correctOptionIds ?? [];
    const optionIds = new Set(options.map((option) => option.id));

    if (options.some((option) => !option.text.en.trim() || !option.text.vi.trim())) {
      pushToast(
        {
          en: "Each configured option must include both EN and VI text.",
          vi: "Mỗi lựa chọn được cấu hình phải có nội dung cả EN và VI.",
        },
        "warning",
      );
      return;
    }

    if (payload.type === "true-false" || payload.type === "single-choice") {
      if (options.length < 2 || correctOptionIds.length !== 1 || !optionIds.has(correctOptionIds[0])) {
        pushToast(
          {
            en: "True/False and single-choice questions need at least 2 options and exactly 1 correct answer.",
            vi: "Câu Đúng/Sai và một đáp án cần ít nhất 2 lựa chọn và đúng 1 đáp án đúng.",
          },
          "warning",
        );
        return;
      }
    }

    if (payload.type === "multiple-choice") {
      if (
        options.length < 2 ||
        correctOptionIds.length < 2 ||
        correctOptionIds.some((optionId) => !optionIds.has(optionId))
      ) {
        pushToast(
          {
            en: "Multiple-choice questions need at least 2 correct answers selected from the configured options.",
            vi: "Câu nhiều đáp án cần ít nhất 2 đáp án đúng nằm trong các lựa chọn đã cấu hình.",
          },
          "warning",
        );
        return;
      }
    }

    if (payload.type === "pairing") {
      const pairingItems = payload.pairingItems ?? [];
      if (
        options.length < 2 ||
        pairingItems.length < 2 ||
        pairingItems.some(
          (item) =>
            !item.prompt.en.trim() ||
            !item.prompt.vi.trim() ||
            !optionIds.has(item.correctOptionId),
        )
      ) {
        pushToast(
          {
            en: "Pairing questions need left-side prompts and valid right-side matches.",
            vi: "Cau noi cap can co ve trai day du va dap an ben phai hop le.",
          },
          "warning",
        );
        return;
      }
    }

    if (payload.type === "essay") {
      if (!payload.placeholder?.en.trim() || !payload.placeholder?.vi.trim() || !payload.rubricNote?.en.trim() || !payload.rubricNote?.vi.trim()) {
        pushToast(
          {
            en: "Essay questions need bilingual placeholder text and rubric notes.",
            vi: "Cau tu luan can co placeholder song ngu va ghi chu rubric song ngu.",
          },
          "warning",
        );
        return;
      }
    }

    void (async () => {
      const response = await fetch(`/api/admin/round-1/banks/${bankId}/questions/${questionId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await extractResponseError(response, "Could not update the Round 1 question.");
        pushToast({ en: error, vi: error }, "warning");
        return;
      }

      await syncSiteData();
      pushToast(
        {
          en: "Round 1 question updated in admin mode.",
          vi: "Câu hỏi Vòng 1 đã được cập nhật trong admin mode.",
        },
        "success",
      );
    })().catch(() => {
      pushToast(
        {
          en: "Could not update the Round 1 question right now.",
          vi: "Hiện không thể cập nhật câu hỏi Vòng 1.",
        },
        "warning",
      );
    });
  };

  const initiateRound1TeamLock = () => {
    const team = getTeamForUser(activeUserId, teams);

    if (!team || team.leaderId !== activeUserId) {
      pushToast(
        {
          en: "Only the team leader can start the Round 1 lock protocol.",
          vi: "Chỉ đội trưởng mới có thể khởi tạo quy trình khóa đội trước Vòng 1.",
        },
        "warning",
      );
      return;
    }

    if (team.stage !== "round-1") {
      pushToast(
        {
          en: `This team is currently in ${pickCompetitionStateLabel("en", team.stage)} and its roster can no longer change.`,
          vi: `Đội này hiện đang ở ${pickCompetitionStateLabel("vi", team.stage)} và đội hình không còn được thay đổi.`,
        },
        "warning",
      );
      return;
    }

    if (team.memberIds.length < TEAM_MIN_MEMBERS) {
      pushToast(
        {
          en: `Reach at least ${TEAM_MIN_MEMBERS} members before starting the Round 1 lock protocol.`,
          vi: `Hãy đạt ít nhất ${TEAM_MIN_MEMBERS} thành viên trước khi bắt đầu quy trình khóa đội cho Vòng 1.`,
        },
        "warning",
      );
      return;
    }

    if (team.round1LockStatus === "locked" || isTeamRound1Locked(team)) {
      pushToast(
        {
          en: "This team is already locked for Round 1.",
          vi: "Đội này đã được khóa để vào Vòng 1.",
        },
        "info",
      );
      return;
    }

    if (team.round1LockStatus === "pending") {
      pushToast(
        {
          en: "A lock protocol is already waiting for member approvals.",
          vi: "Một quy trình khóa đội đang chờ các thành viên xác nhận.",
        },
        "warning",
      );
      return;
    }

    if (getPendingTeamLockRequests(team.id).length > 0) {
      pushToast(
        {
          en: "There is already a pending lock workflow for this team.",
          vi: "Đã có một quy trình khóa đội đang chờ cho đội này.",
        },
        "warning",
      );
      return;
    }

    const pendingLeadershipTransfer = leadershipTransferRequests.find(
      (item) => item.teamId === team.id && item.status === "pending",
    );
    if (pendingLeadershipTransfer) {
      pushToast(
        {
          en: "Resolve the pending leadership transfer before locking the team.",
          vi: "Hãy xử lý xong yêu cầu chuyển đội trưởng đang chờ trước khi khóa đội.",
        },
        "warning",
      );
      return;
    }

    void (async () => {
      const response = await fetch(`/api/teams/${team.id}/round-1-lock`, {
        method: "POST",
        credentials: "same-origin",
      });

      if (!response.ok) {
        const error = await extractResponseError(response, "Could not start the Round 1 lock protocol.");
        pushToast({ en: error, vi: error }, "warning");
        return;
      }

      await syncWorkspace();
      pushToast(
        {
          en: "Round 1 lock protocol started. Every current member must approve before the team can enter the exam.",
          vi: "Quy trình khóa đội cho Vòng 1 đã bắt đầu. Tất cả thành viên hiện tại phải đồng ý trước khi đội được vào bài thi.",
        },
        "success",
      );
    })().catch(() => {
      pushToast(
        {
          en: "Could not start the Round 1 lock protocol right now.",
          vi: "Hiện không thể bắt đầu quy trình khóa đội cho Vòng 1.",
        },
        "warning",
      );
    });
  };

  const respondToRound1TeamLock = (
    requestId: string,
    decision: "accept" | "decline",
  ) => {
    const request = teamLockRequests.find(
      (item) => item.id === requestId && item.toUserId === activeUserId,
    );

    if (!request || request.status !== "pending") {
      return;
    }

    void (async () => {
      const response = await fetch(`/api/round-1-lock-requests/${request.id}/respond`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({ decision }),
      });

      if (!response.ok) {
        const error = await extractResponseError(response, "Could not respond to the team-lock request.");
        pushToast({ en: error, vi: error }, "warning");
        return;
      }

      await syncWorkspace();
      pushToast(
        decision === "accept"
          ? {
              en: "Approval recorded. The team will lock as soon as every member accepts.",
              vi: "Đã ghi nhận xác nhận của bạn. Đội sẽ được khóa ngay khi tất cả thành viên đồng ý.",
            }
          : {
              en: "You declined the team-lock request. The workflow has been cancelled and the leader must start it again later.",
              vi: "Bạn đã từ chối yêu cầu khóa đội. Quy trình đã bị hủy và đội trưởng phải khởi tạo lại vào lúc khác.",
            },
        decision === "accept" ? "success" : "info",
      );
    })().catch(() => {
      pushToast(
        {
          en: "Could not respond to the team-lock request right now.",
          vi: "Hiện không thể phản hồi yêu cầu khóa đội.",
        },
        "warning",
      );
    });
  };

  const inviteUser = (userId: string) => {
    const team = getTeamForUser(activeUserId, teams);
    const targetUser = users.find((user) => user.id === userId);

    if (!team) {
      pushToast(
        {
          en: "Create or join a team before sending invitations.",
          vi: "Hãy tạo hoặc tham gia đội trước khi gửi lời mời.",
        },
        "warning",
      );
      return;
    }

    if (!targetUser || targetUser.role !== "student") {
      pushToast(
        {
          en: "Only student accounts can receive team invitations.",
          vi: "Chỉ tài khoản sinh viên mới có thể nhận lời mời vào đội.",
        },
        "warning",
      );
      return;
    }

    if (team.leaderId !== activeUserId) {
      pushToast(
        {
          en: "Only the team leader can invite new members.",
          vi: "Chỉ đội trưởng mới có thể mời thành viên mới.",
        },
        "warning",
      );
      return;
    }

    if (isTeamRosterLocked(team)) {
      pushToast(
        {
          en:
            team.round1LockStatus === "pending"
              ? "This team is in the middle of the Round 1 lock workflow, so roster changes are paused."
              : "This team roster is locked and can no longer invite new members.",
          vi:
            team.round1LockStatus === "pending"
              ? "Đội này đang ở giữa quy trình khóa đội cho Vòng 1 nên các thay đổi đội hình đang tạm dừng."
              : "Đội hình của đội này đã bị khóa và không thể mời thêm thành viên mới nữa.",
        },
        "warning",
      );
      return;
    }

    if (team.memberIds.includes(userId)) {
      pushToast(
        {
          en: "That student is already in this team.",
          vi: "Sinh viên này đã ở trong đội.",
        },
        "warning",
      );
      return;
    }

    if (getTeamForUser(userId, teams)) {
      pushToast(
        {
          en: "That student is already in another team.",
          vi: "Sinh viên này đã ở một đội khác.",
        },
        "warning",
      );
      return;
    }

    const pendingInvites = getPendingInvitesForTeam(team.id, invitations);
    if (team.memberIds.length + pendingInvites.length >= TEAM_MAX_MEMBERS) {
      pushToast(
        {
          en: "You cannot send more invites because the team is at max capacity.",
          vi: "Bạn không thể gửi thêm lời mời vì đội đã đạt giới hạn tối đa.",
        },
        "warning",
      );
      return;
    }

    const existingInvite = invitations.find(
      (invitation) =>
        invitation.teamId === team.id &&
        invitation.toUserId === userId &&
        invitation.status === "pending",
    );

    if (existingInvite) {
      pushToast(
        {
          en: "There is already a pending invitation for this student.",
          vi: "Đã tồn tại một lời mời đang chờ cho sinh viên này.",
        },
        "warning",
      );
      return;
    }

    void (async () => {
      const response = await fetch(`/api/teams/${team.id}/invites`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({ targetUserId: userId }),
      });

      if (!response.ok) {
        const error = await extractResponseError(response, "Could not send the invitation.");
        pushToast({ en: error, vi: error }, "warning");
        return;
      }

      await syncWorkspace();
      pushToast(
        {
          en: "Invitation sent.",
          vi: "Đã gửi lời mời.",
        },
        "success",
      );
    })().catch(() => {
      pushToast(
        {
          en: "Could not send the invitation right now.",
          vi: "Hiện không thể gửi lời mời.",
        },
        "warning",
      );
    });
  };

  const respondToInvitation = (invitationId: string, decision: "accept" | "decline") => {
    const invitation = invitations.find(
      (item) => item.id === invitationId && item.toUserId === activeUserId,
    );

    if (!invitation || invitation.status !== "pending") {
      return;
    }

    void (async () => {
      const response = await fetch(`/api/invitations/${invitation.id}/respond`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({ decision }),
      });

      if (!response.ok) {
        const error = await extractResponseError(response, "Could not respond to the invitation.");
        pushToast({ en: error, vi: error }, "warning");
        if (error.toLowerCase().includes("full")) {
          setInvitations((current) =>
            current.map((item) =>
              item.id === invitation.id ? { ...item, status: "expired" } : item,
            ),
          );
        }
        return;
      }

      await syncWorkspace();
      pushToast(
        decision === "accept"
          ? {
              en: "Invitation accepted. You are now in the selected team.",
              vi: "Đã chấp nhận lời mời. Bạn đã vào đội được chọn.",
            }
          : {
              en: "Invitation declined.",
              vi: "Đã từ chối lời mời.",
            },
        decision === "accept" ? "success" : "info",
      );
    })().catch(() => {
      pushToast(
        {
          en: "Could not respond to the invitation right now.",
          vi: "Hiện không thể phản hồi lời mời.",
        },
        "warning",
      );
    });
  };

  const leaveCurrentTeam = () => {
    const team = getTeamForUser(activeUserId, teams);

    if (!team) {
      return;
    }

    if (isTeamRosterLocked(team)) {
      pushToast(
        {
          en:
            team.round1LockStatus === "pending"
              ? "This team is waiting for Round 1 lock approvals, so nobody can leave right now."
              : "This team roster is locked, so members can no longer leave.",
          vi:
            team.round1LockStatus === "pending"
              ? "Đội này đang chờ xác nhận khóa đội cho Vòng 1 nên hiện tại không ai có thể rời đội."
              : "Đội hình của đội này đã bị khóa nên các thành viên không thể rời đội nữa.",
        },
        "warning",
      );
      return;
    }

    if (team.leaderId === activeUserId) {
      const pendingTransfer = leadershipTransferRequests.find(
        (item) =>
          item.teamId === team.id &&
          item.fromUserId === activeUserId &&
          item.status === "pending",
      );
      pushToast(
        {
          en: pendingTransfer
            ? "The leader cannot leave until the pending leadership transfer is accepted."
            : "The leader cannot leave until leadership is transferred.",
          vi: pendingTransfer
            ? "Đội trưởng không thể rời đội cho đến khi yêu cầu chuyển quyền lãnh đạo được chấp nhận."
            : "Đội trưởng không thể rời đội cho đến khi đã chuyển quyền lãnh đạo.",
        },
        "warning",
      );
      return;
    }

    void (async () => {
      const response = await fetch("/api/teams/current/leave", {
        method: "POST",
        credentials: "same-origin",
      });

      if (!response.ok) {
        const error = await extractResponseError(response, "Could not leave the current team.");
        pushToast({ en: error, vi: error }, "warning");
        return;
      }

      await syncWorkspace();
      pushToast(
        {
          en: "You left the current team.",
          vi: "Bạn đã rời đội hiện tại.",
        },
        "info",
      );
    })().catch(() => {
      pushToast(
        {
          en: "Could not leave the current team right now.",
          vi: "Hiện không thể rời đội.",
        },
        "warning",
      );
    });
  };

  const transferLeadership = (nextLeaderId: string) => {
    const team = getTeamForUser(activeUserId, teams);

    if (!team || team.leaderId !== activeUserId) {
      pushToast(
        {
          en: "Only the current leader can transfer leadership.",
          vi: "Chỉ đội trưởng hiện tại mới có thể chuyển quyền lãnh đạo.",
        },
        "warning",
      );
      return;
    }

    if (isTeamRosterLocked(team)) {
      pushToast(
        {
          en:
            team.round1LockStatus === "pending"
              ? "Leadership cannot change while the Round 1 lock workflow is pending."
              : "Leadership can no longer change after the team roster is locked.",
          vi:
            team.round1LockStatus === "pending"
              ? "Không thể chuyển đội trưởng khi quy trình khóa đội cho Vòng 1 vẫn đang chờ xác nhận."
              : "Không thể thay đổi đội trưởng sau khi đội hình đã bị khóa.",
        },
        "warning",
      );
      return;
    }

    if (!team.memberIds.includes(nextLeaderId) || nextLeaderId === activeUserId) {
      pushToast(
        {
          en: "Choose another existing team member as the next leader.",
          vi: "Hãy chọn một thành viên hiện hữu khác làm đội trưởng tiếp theo.",
        },
        "warning",
      );
      return;
    }

    const existingPendingRequest = leadershipTransferRequests.find(
      (item) => item.teamId === team.id && item.status === "pending",
    );

    if (existingPendingRequest) {
      pushToast(
        {
          en: "There is already a pending leadership transfer request for this team.",
          vi: "Đã có một yêu cầu chuyển quyền đội trưởng đang chờ cho đội này.",
        },
        "warning",
      );
      return;
    }

    void (async () => {
      const response = await fetch(`/api/teams/${team.id}/leadership-transfer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({ nextLeaderId }),
      });

      if (!response.ok) {
        const error = await extractResponseError(response, "Could not send the leadership transfer request.");
        pushToast({ en: error, vi: error }, "warning");
        return;
      }

      await syncWorkspace();
      pushToast(
        {
          en: "Leadership transfer request sent. The selected member must accept it first.",
          vi: "Đã gửi yêu cầu chuyển quyền đội trưởng. Thành viên được chọn cần chấp nhận trước.",
        },
        "info",
      );
    })().catch(() => {
      pushToast(
        {
          en: "Could not send the leadership transfer request right now.",
          vi: "Hiện không thể gửi yêu cầu chuyển quyền đội trưởng.",
        },
        "warning",
      );
    });
  };

  const respondToLeadershipTransfer = (
    requestId: string,
    decision: "accept" | "decline",
  ) => {
    const request = leadershipTransferRequests.find(
      (item) => item.id === requestId && item.toUserId === activeUserId,
    );

    if (!request || request.status !== "pending") {
      return;
    }

    void (async () => {
      const response = await fetch(`/api/leadership-transfer-requests/${request.id}/respond`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({ decision }),
      });

      if (!response.ok) {
        const error = await extractResponseError(response, "Could not respond to the leadership transfer request.");
        pushToast({ en: error, vi: error }, "warning");
        return;
      }

      await syncWorkspace();
      pushToast(
        decision === "accept"
          ? {
              en: "Leadership transfer accepted. You are now the team leader.",
              vi: "Đã chấp nhận yêu cầu chuyển quyền. Bạn hiện là đội trưởng.",
            }
          : {
              en: "Leadership transfer request declined.",
              vi: "Đã từ chối yêu cầu chuyển quyền đội trưởng.",
            },
        decision === "accept" ? "success" : "info",
      );
    })().catch(() => {
      pushToast(
        {
          en: "Could not respond to the leadership transfer request right now.",
          vi: "Hiện không thể phản hồi yêu cầu chuyển quyền đội trưởng.",
        },
        "warning",
      );
    });
  };

  const updateRound1EssayScoreByAdmin = (submissionId: string, essayScore: number) => {
    if (!canAccessAdminMode) {
      pushToast(
        {
          en: "Only admin and moderator accounts can score Round 1 essays here.",
          vi: "Chỉ tài khoản admin và moderator mới có thể chấm phần tự luận Vòng 1 tại đây.",
        },
        "warning",
      );
      return;
    }

    if (!Number.isFinite(essayScore) || essayScore < 0 || essayScore > 28) {
      pushToast(
        {
          en: "Essay score must be a number between 0 and 28.",
          vi: "Điểm tự luận phải là một số từ 0 đến 28.",
        },
        "warning",
      );
      return;
    }

    void (async () => {
      const response = await fetch(`/api/admin/round-1/submissions/${submissionId}/essay-score`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({ essayScore }),
      });

      if (!response.ok) {
        const error = await extractResponseError(response, "Could not update the essay score.");
        pushToast({ en: error, vi: error }, "warning");
        return;
      }

      await syncWorkspace();
      pushToast(
        {
          en: "Essay score updated and the Round 1 total score has been recalculated.",
          vi: "Điểm tự luận đã được cập nhật và tổng điểm Vòng 1 đã được tính lại.",
        },
        "success",
      );
    })().catch(() => {
      pushToast(
        {
          en: "Could not update the essay score right now.",
          vi: "Hiện không thể cập nhật điểm tự luận.",
        },
        "warning",
      );
    });
  };

  const submitRound1Attempt = (
    payload: Pick<Round1Submission, "bankId" | "rightCount" | "wrongCount" | "objectiveScore" | "durationMinutes">,
  ) => {
    const team = getTeamForUser(activeUserId, teams);

    if (!team) {
      pushToast(
        {
          en: "Join a team before taking the Round 1 test.",
          vi: "Hãy vào một đội trước khi làm bài thi Vòng 1.",
        },
        "warning",
      );
      return;
    }

    if (team.memberIds.length < TEAM_MIN_MEMBERS) {
      const competitionState = getTeamCompetitionState(team);
      pushToast(
        {
          en:
            competitionState === "not-eligible"
              ? "This team is not eligible yet. Reach at least 3 members first."
              : `This team is currently marked as ${pickCompetitionStateLabel("en", competitionState)} and cannot enter Round 1.`,
          vi:
            competitionState === "not-eligible"
              ? "Đội này chưa đủ điều kiện. Hãy đạt ít nhất 3 thành viên trước."
              : `Đội này hiện đang ở trạng thái ${pickCompetitionStateLabel("vi", competitionState)} và không thể vào Vòng 1.`,
        },
        "warning",
      );
      return;
    }

    if (team.stage !== "round-1") {
      pushToast(
        {
          en: `This team is currently in ${pickCompetitionStateLabel("en", team.stage)} and can no longer submit Round 1.`,
          vi: `Đội này hiện đang ở ${pickCompetitionStateLabel("vi", team.stage)} và không thể nộp Vòng 1 nữa.`,
        },
        "warning",
      );
      return;
    }

    if (!isTeamRound1Locked(team)) {
      pushToast(
        {
          en: "The team must finish the Round 1 lock protocol before any member can start the exam.",
          vi: "Đội phải hoàn tất quy trình khóa đội cho Vòng 1 trước khi bất kỳ thành viên nào được bắt đầu bài thi.",
        },
        "warning",
      );
      return;
    }

    if (!canTeamTakeRound1(team)) {
      pushToast(
        {
          en: "Round 1 is finished. New Round 1 submissions are closed.",
          vi: "Vòng 1 đã kết thúc. Hệ thống đã đóng việc nộp bài Vòng 1 mới.",
        },
        "warning",
      );
      return;
    }

    if (currentUser.role !== "student") {
      pushToast(
        {
          en: "Only student accounts can submit Round 1 attempts.",
          vi: "Chỉ tài khoản sinh viên mới có thể nộp bài Vòng 1.",
        },
        "warning",
      );
      return;
    }

    if (round1Submissions.some((item) => item.userId === activeUserId)) {
      pushToast(
        {
          en: "This account has already submitted its Round 1 attempt.",
          vi: "Tài khoản này đã nộp bài Vòng 1 rồi.",
        },
        "warning",
      );
      return;
    }

    void (async () => {
      const response = await fetch("/api/round-1/submissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await extractResponseError(response, "Could not submit the Round 1 attempt.");
        pushToast({ en: error, vi: error }, "warning");
        return;
      }

      await syncWorkspace();
      pushToast(
        {
          en: "Round 1 attempt submitted successfully.",
          vi: "Đã nộp bài Vòng 1 thành công.",
        },
        "success",
      );
    })().catch(() => {
      pushToast(
        {
          en: "Could not submit the Round 1 attempt right now.",
          vi: "Hiện không thể nộp bài Vòng 1.",
        },
        "warning",
      );
    });
  };

  const submitTeamSubmission = async (payload: {
    round: TeamSubmission["round"];
    title: string;
    summary: string;
    resourceFile: File | null;
  }) => {
    const team = getTeamForUser(activeUserId, teams);

    if (!team) {
      pushToast(
        {
          en: "Join or create a team before submitting reports.",
          vi: "Hãy tham gia hoặc tạo đội trước khi nộp báo cáo.",
        },
        "warning",
      );
      return false;
    }

    if (team.leaderId !== activeUserId) {
      pushToast(
        {
          en: "Only the team leader can submit a report for the team.",
          vi: "Chỉ đội trưởng mới có thể nộp báo cáo cho đội.",
        },
        "warning",
      );
      return false;
    }

    const requiredStage = payload.round as CompetitionStage;

    if (team.stage !== requiredStage) {
      pushToast(
        {
          en:
            team.stage === "round-1"
              ? `This team has not advanced to ${pickRoundLabel("en", requiredStage)} yet.`
              : `This team is currently in ${pickCompetitionStateLabel("en", team.stage)}. ${pickRoundLabel("en", requiredStage)} submissions are no longer active.`,
          vi:
            team.stage === "round-1"
              ? `Đội này chưa vào ${pickRoundLabel("vi", requiredStage)}.`
              : `Đội này hiện đang ở ${pickCompetitionStateLabel("vi", team.stage)}. Submission cho ${pickRoundLabel("vi", requiredStage)} không còn đang hoạt động.`,
        },
        "warning",
      );
      return false;
    }

    if (!canTeamSubmitForRound(team, payload.round)) {
      pushToast(
        {
          en: `${pickRoundLabel("en", requiredStage)} is finished. New submissions are closed.`,
          vi: `${pickRoundLabel("vi", requiredStage)} đã kết thúc. Hệ thống đã đóng việc nộp bài mới.`,
        },
        "warning",
      );
      return false;
    }

    if (!payload.title.trim()) {
      pushToast(
        {
          en: "Add a submission title before uploading.",
          vi: "Hãy nhập tiêu đề trước khi tải tệp lên.",
        },
        "warning",
      );
      return false;
    }

    const validationError = getSubmissionValidationError(payload.resourceFile);

    if (validationError === "missing") {
      pushToast(
        {
          en: "Upload a PDF or RAR file before submitting.",
          vi: "Hay tai len tep PDF hoac RAR truoc khi nop.",
        },
        "warning",
      );
      return false;
    }

    if (validationError === "type") {
      pushToast(
        {
          en: "Only PDF and RAR files are allowed.",
          vi: "Chi cho phep tep PDF va RAR.",
        },
        "warning",
      );
      return false;
    }

    if (validationError === "size") {
      pushToast(
        {
          en: "The uploaded file must be 5MB or smaller.",
          vi: "Tep tai len phai nho hon hoac bang 5MB.",
        },
        "warning",
      );
      return false;
    }

    const resourceFile = payload.resourceFile;
    if (!resourceFile) {
      return false;
    }

    const formData = new FormData();
    formData.set("round", payload.round);
    formData.set("title", payload.title.trim());
    formData.set("summary", payload.summary.trim());
    formData.set("resourceFile", resourceFile);

    const response = await fetch("/api/teams/current/submissions", {
      method: "POST",
      body: formData,
      credentials: "same-origin",
    });

    if (!response.ok) {
      const error = await extractResponseError(response, "Could not submit the team report.");
      pushToast({ en: error, vi: error }, "warning");
      return false;
    }

    const result = (await response.json()) as { version?: number };
    await syncWorkspace();
    pushToast(
      {
        en: `Submitted version ${result.version ?? "new"} for ${payload.round === "round-2" ? "Round 2" : "Round 3"}. The latest version is now the valid one.`,
        vi: `Đã nộp phiên bản ${result.version ?? "mới"} cho ${payload.round === "round-2" ? "Vòng 2" : "Vòng 3"}. Phiên bản mới nhất hiện là phiên bản hợp lệ.`,
      },
      "success",
    );
    return true;
  };

  const value: SiteStateValue = {
    authStatus,
    isAuthenticated,
    locale,
    theme,
    activeUserId,
    users,
    teams,
    invitations,
    leadershipTransferRequests,
    teamLockRequests,
    submissions,
    round1TestBanks,
    round1Submissions,
    newsPosts,
    judges,
    pageContent,
    currentUser,
    currentTeam,
    canAccessAdminMode,
    hasHydrated,
    setLocale,
    setTheme,
    setActiveUserId,
    signOutCurrentUser,
    resetDemoData,
    savePageContent,
    createNewsPostByAdmin,
    updateNewsPostByAdmin,
    deleteNewsPostByAdmin,
    createJudgeByAdmin,
    updateJudgeByAdmin,
    deleteJudgeByAdmin,
    updateActiveUserProfile,
    updateUserByAdmin,
    deleteUserByAdmin,
    createTeam,
    updateCurrentTeam,
    updateTeamByAdmin,
    deleteTeamByAdmin,
    updateRound1QuestionByAdmin,
    updateRound1EssayScoreByAdmin,
    inviteUser,
    respondToInvitation,
    initiateRound1TeamLock,
    respondToRound1TeamLock,
    leaveCurrentTeam,
    transferLeadership,
    respondToLeadershipTransfer,
    submitRound1Attempt,
    submitTeamSubmission,
  };

  return (
    <SiteStateContext.Provider value={value}>
      {children}
      <ToastRail locale={locale} toasts={toasts} />
    </SiteStateContext.Provider>
  );
}

function ToastRail({
  locale,
  toasts,
}: {
  locale: Locale;
  toasts: ToastMessage[];
}) {
  return (
    <div className="pointer-events-none fixed right-4 bottom-4 z-50 flex max-w-sm flex-col gap-3">
      {toasts.map((toast) => {
        const icon =
          toast.tone === "success" ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-300" />
          ) : toast.tone === "warning" ? (
            <TriangleAlert className="h-4 w-4 text-amber-300" />
          ) : (
            <Info className="h-4 w-4 text-sky-300" />
          );

        return (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-start gap-3 rounded-3xl border border-white/12 bg-slate-950/88 px-4 py-3 text-sm text-white shadow-[0_24px_60px_rgba(2,6,23,0.35)] backdrop-blur-xl"
          >
            <span className="mt-0.5">{icon}</span>
            <span className="flex-1 leading-6">{pickText(locale, toast.message)}</span>
            <X className="mt-0.5 h-4 w-4 text-white/35" />
          </div>
        );
      })}
    </div>
  );
}

export function useSiteState() {
  const context = useContext(SiteStateContext);

  if (!context) {
    throw new Error("useSiteState must be used within SiteStateProvider");
  }

  return context;
}

export function useUserInvitations(userId: string) {
  const { invitations } = useSiteState();
  return getPendingInvitesForUser(userId, invitations);
}
