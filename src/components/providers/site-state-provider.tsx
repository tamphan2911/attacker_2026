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
  mergePageContentWithDefaults,
  judgeProfiles as seedJudgeProfiles,
  mockInvitations,
  mockLeadershipTransferRequests,
  mockRound1TeamLockRequests,
  newsPosts as seedNewsPosts,
  round1IndividualSubmissions as seedRound1Submissions,
  sponsorProfiles as seedSponsorProfiles,
  timelineItems as seedTimelineItems,
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
import { normalizeClassYearForRole } from "@/lib/class-year";
import {
  getMaxSubmissionFileBytes,
  getSubmissionValidationError,
} from "@/lib/submission-files";
import {
  getRound1PairingValidationIssue,
  getRound1PairingValidationMessage,
  ROUND1_DURATION_MINUTES,
  ROUND1_ESSAY_TOTAL,
  ROUND1_ESSAY_WORD_LIMIT,
  ROUND1_OBJECTIVE_TOTAL,
} from "@/lib/round1";
import { deriveRound1TopicsFromBanks, normalizeRound1Topics } from "@/lib/round1-topics";
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
  SponsorProfile,
  TeamInvitation,
  TeamProfile,
  TeamSubmission,
  Theme,
  TimelineItem,
  UserProfile,
} from "@/types/site";

const LEGACY_STORAGE_KEY = "attacker-2026-site-state-v18";
const PREFERENCES_STORAGE_KEY = "attacker-2026-client-preferences-v1";

interface ClientPreferencesSnapshot {
  locale?: Locale;
  theme?: Theme;
  activeUserId?: string;
}

const GUEST_USER: UserProfile = {
  id: "",
  loginId: "",
  name: "",
  email: "",
  emailVerified: false,
  role: "student",
  studentId: "",
  phoneNumber: "",
  university: "",
  major: "",
  classYear: "",
  bio: "",
  avatarTone: "from-sky-500 via-cyan-400 to-emerald-400",
  providers: [],
};

const seedRound1TestBanks: Round1TestBank[] = [
  {
    id: "bank-2026-official-a",
    bankType: "objective",
    title: {
      en: "Multiple choice test bank",
      vi: "Ngân hàng đề trắc nghiệm",
    },
    description: {
      en: "Public metadata for the Round 1 multiple-choice bank.",
      vi: "Thông tin công khai của ngân hàng đề trắc nghiệm Vòng 1.",
    },
    status: "active",
    questionPoolSize: 0,
    questionsPerAttempt: ROUND1_OBJECTIVE_TOTAL,
    shuffleQuestions: true,
    shuffleOptions: true,
    durationMinutes: ROUND1_DURATION_MINUTES,
    publishedAt: "2026-05-02T00:00:00.000Z",
    questions: [],
  },
  {
    id: "bank-2026-essay-a",
    bankType: "essay",
    title: {
      en: "Essay test bank",
      vi: "Ngân hàng đề tự luận",
    },
    description: {
      en: "Public metadata for the Round 1 essay bank.",
      vi: "Thông tin công khai của ngân hàng đề tự luận Vòng 1.",
    },
    status: "active",
    questionPoolSize: 0,
    questionsPerAttempt: ROUND1_ESSAY_TOTAL,
    shuffleQuestions: true,
    shuffleOptions: false,
    durationMinutes: ROUND1_DURATION_MINUTES,
    wordLimit: ROUND1_ESSAY_WORD_LIMIT,
    fixedEssayPrompt: { en: "", vi: "" },
    publishedAt: "2026-05-02T00:00:00.000Z",
    questions: [],
  },
];

function normalizeUserProfile(user: UserProfile): UserProfile {
  return {
    ...user,
    emailVerified: Boolean(user.emailVerified),
    loginId: user.loginId ?? user.studentId ?? user.email,
    phoneNumber: user.phoneNumber ?? "",
    classYear: normalizeClassYearForRole(user.classYear, user.role),
  };
}

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

export interface SiteDataApiPayload {
  pageContent: SitePageContent;
  sponsors: SponsorProfile[];
  judges: JudgeProfile[];
  newsPosts: NewsPost[];
  round1TestBanks: Round1TestBank[];
  round1Topics: string[];
  timelineItems: TimelineItem[];
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
  round1Topics: string[];
  round1Submissions: Round1Submission[];
  newsPosts: NewsPost[];
  sponsors: SponsorProfile[];
  judges: JudgeProfile[];
  timelineItems: TimelineItem[];
  pageContent: SitePageContent;
  currentUser: UserProfile;
  currentTeam?: TeamProfile;
  canAccessAdminMode: boolean;
  hasHydrated: boolean;
  refreshWorkspace: () => Promise<void>;
  setLocale: (locale: Locale) => void;
  setTheme: (theme: Theme) => void;
  setActiveUserId: (userId: string) => void;
  signOutCurrentUser: () => Promise<void>;
  resetDemoData: () => void;
  savePageContent: (nextPageContent: SitePageContent, scope?: string) => Promise<boolean>;
  saveSeasonContent: (seasonContent: Pick<SitePageContent["organizer"], "seasonBadgeLabel" | "seasonStories" | "seasonArchives">) => Promise<boolean>;
  saveSponsorsByAdmin: (nextSponsors: SponsorProfile[]) => void;
  createNewsPostByAdmin: (payload: NewsPost) => void;
  updateNewsPostByAdmin: (slug: string, payload: NewsPost) => void;
  deleteNewsPostByAdmin: (slug: string) => void;
  createJudgeByAdmin: (payload: JudgeProfile) => Promise<boolean>;
  updateJudgeByAdmin: (judgeId: string, payload: JudgeProfile & { accountPassword?: string }) => Promise<boolean>;
  reorderJudgesByAdmin: (judgeIds: string[]) => Promise<boolean>;
  deleteJudgeByAdmin: (judgeId: string) => Promise<boolean>;
  updateTimelineItemsByAdmin: (timelineItems: TimelineItem[]) => void;
  createOrganizerAccountByAdmin: (payload: {
    loginId: string;
    name: string;
    password: string;
    role: "admin" | "moderator";
    avatarImageSrc?: string;
  }) => Promise<boolean>;
  updateOrganizerAccountByAdmin: (
    userId: string,
    payload: {
      loginId: string;
      name: string;
      password?: string;
      avatarImageSrc?: string | null;
    },
  ) => Promise<boolean>;
  deleteOrganizerAccountByAdmin: (userId: string) => Promise<boolean>;
  updateActiveUserProfile: (payload: Partial<UserProfile>) => void;
  updateUserByAdmin: (userId: string, payload: Partial<UserProfile>) => void;
  deleteUserByAdmin: (userId: string) => void;
  createTeam: (
    payload: Pick<TeamProfile, "name" | "tag" | "avatarTone" | "track" | "bio"> & { avatarImageSrc?: string | null },
  ) => void;
  updateCurrentTeam: (
    payload: Partial<Pick<TeamProfile, "name" | "tag" | "avatarTone" | "track" | "bio">> & { avatarImageSrc?: string | null },
  ) => void;
  updateTeamByAdmin: (
    teamId: string,
    payload: Partial<Pick<TeamProfile, "name" | "tag" | "avatarTone" | "avatarImageSrc" | "track" | "bio" | "leaderId" | "stage" | "finalOutcome">>,
  ) => void;
  deleteTeamByAdmin: (teamId: string) => void;
  createRound1QuestionByAdmin: (bankId: string, payload: Round1Question) => Promise<string | null>;
  updateRound1QuestionByAdmin: (bankId: string, questionId: string, payload: Round1Question) => Promise<string | null>;
  deleteRound1QuestionByAdmin: (bankId: string, questionId: string) => Promise<boolean>;
  updateRound1FixedEssayPromptByAdmin: (bankId: string, payload: LocalizedText) => Promise<boolean>;
  updateRound1TopicsByAdmin: (
    topics: string[],
    options?: { rename?: { from: string; to: string } },
  ) => Promise<boolean>;
  updateRound1EssayScoreByAdmin: (
    submissionId: string,
    payload: number | { questionScores: Record<string, number> },
  ) => Promise<{ essayScore: number | null; totalScore: number | null; essayQuestionScores: Record<string, number> } | null>;
  inviteUser: (userId: string) => void;
  recallInvitation: (invitationId: string) => void;
  respondToInvitation: (invitationId: string, decision: "accept" | "decline") => void;
  initiateRound1TeamLock: () => void;
  respondToRound1TeamLock: (requestId: string, decision: "accept" | "decline") => void;
  leaveCurrentTeam: () => void;
  kickTeamMember: (memberId: string, reason: string) => Promise<boolean>;
  transferLeadership: (nextLeaderId: string) => void;
  respondToLeadershipTransfer: (requestId: string, decision: "accept" | "decline") => void;
  submitRound1Attempt: (payload: Pick<Round1Submission, "bankId" | "rightCount" | "wrongCount" | "objectiveScore" | "durationMinutes">) => void;
  submitTeamSubmission: (payload: {
    round: TeamSubmission["round"];
    title: string;
    summary: string;
    resourceFile: File | null;
    allowRound3FinalistSubmission?: boolean;
    onUploadStart?: () => void;
    onUploadProgress?: (progress: number) => void;
  }) => Promise<boolean>;
}

const SiteStateContext = createContext<SiteStateValue | null>(null);

function clonePageContent(content: SitePageContent): SitePageContent {
  return JSON.parse(JSON.stringify(content)) as SitePageContent;
}

function normalizeSponsorProfile(sponsor: SponsorProfile): SponsorProfile {
  return {
    ...sponsor,
    contribution: sponsor.contribution ?? sponsor.description,
    hidden: sponsor.hidden ?? false,
  };
}

function normalizeSponsorProfiles(sponsors: SponsorProfile[]): SponsorProfile[] {
  return sponsors.map(normalizeSponsorProfile);
}

function mergeRound1BankMetadata(
  metadataBanks: Round1TestBank[],
  currentBanks: Round1TestBank[],
) {
  const currentBankById = new Map(currentBanks.map((bank) => [bank.id, bank]));

  return metadataBanks.map((bank) => {
    const currentBank = currentBankById.get(bank.id);
    return {
      ...bank,
      questions: currentBank?.questions.length ? currentBank.questions : bank.questions,
    };
  });
}

function isLocale(value: unknown): value is Locale {
  return value === "en" || value === "vi";
}

function isTheme(value: unknown): value is Theme {
  return value === "light" || value === "dark";
}

function removeLocalStorageItem(key: string) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Storage can be unavailable in private browsing or restricted WebKit contexts.
  }
}

function normalizeClientPreferences(snapshot: unknown): ClientPreferencesSnapshot {
  if (!snapshot || typeof snapshot !== "object") {
    return {};
  }

  const payload = snapshot as Partial<ClientPreferencesSnapshot>;
  return {
    locale: isLocale(payload.locale) ? payload.locale : undefined,
    theme: isTheme(payload.theme) ? payload.theme : undefined,
    activeUserId: typeof payload.activeUserId === "string" ? payload.activeUserId : undefined,
  };
}

function readClientPreferences(): ClientPreferencesSnapshot {
  try {
    const rawPreferences = window.localStorage.getItem(PREFERENCES_STORAGE_KEY);
    if (rawPreferences) {
      return normalizeClientPreferences(JSON.parse(rawPreferences));
    }

    const rawLegacySnapshot = window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!rawLegacySnapshot) {
      return {};
    }

    const preferences = normalizeClientPreferences(JSON.parse(rawLegacySnapshot));
    removeLocalStorageItem(LEGACY_STORAGE_KEY);
    return preferences;
  } catch {
    removeLocalStorageItem(PREFERENCES_STORAGE_KEY);
    removeLocalStorageItem(LEGACY_STORAGE_KEY);
    return {};
  }
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
    round1Topics: deriveRound1TopicsFromBanks(seedRound1TestBanks),
    round1Submissions: seedRound1Submissions,
    newsPosts: seedNewsPosts,
    sponsors: seedSponsorProfiles,
    judges: seedJudgeProfiles,
    timelineItems: seedTimelineItems,
    pageContent: clonePageContent(defaultPageContent),
  };
}

export function SiteStateProvider({
  children,
  initialSiteData,
}: {
  children: ReactNode;
  initialSiteData?: SiteDataApiPayload;
}) {
  const { data: session, status: authStatus, update: updateSession } = useSession();
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
  const [round1TestBanks, setRound1TestBanks] = useState<Round1TestBank[]>(
    () => initialSiteData?.round1TestBanks ?? seedRound1TestBanks,
  );
  const [round1Topics, setRound1Topics] = useState<string[]>(
    () => normalizeRound1Topics(initialSiteData?.round1Topics ?? deriveRound1TopicsFromBanks(seedRound1TestBanks)),
  );
  const [round1Submissions, setRound1Submissions] = useState<Round1Submission[]>(seedRound1Submissions);
  const [newsPosts, setNewsPosts] = useState<NewsPost[]>(() => initialSiteData?.newsPosts ?? seedNewsPosts);
  const [sponsors, setSponsors] = useState<SponsorProfile[]>(
    () => normalizeSponsorProfiles(initialSiteData?.sponsors ?? seedSponsorProfiles),
  );
  const [judges, setJudges] = useState<JudgeProfile[]>(() => initialSiteData?.judges ?? seedJudgeProfiles);
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>(() => initialSiteData?.timelineItems ?? seedTimelineItems);
  const [pageContent, setPageContent] = useState<SitePageContent>(() =>
    mergePageContentWithDefaults(initialSiteData?.pageContent ?? clonePageContent(defaultPageContent)),
  );
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [hasHydrated, setHasHydrated] = useState(false);
  const isAuthenticated = authStatus === "authenticated" && Boolean(session?.user?.id);

  useEffect(() => {
    const preferences = readClientPreferences();
    const timeoutId = window.setTimeout(() => {
      if (preferences.locale) {
        setLocaleState(preferences.locale);
      }

      if (preferences.theme) {
        setThemeState(preferences.theme);
      }

      if (preferences.activeUserId) {
        setActiveUserIdState(preferences.activeUserId);
      }

      setHasHydrated(true);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  const persistPreferences = useEffectEvent((snapshot: ClientPreferencesSnapshot) => {
    try {
      window.localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(snapshot));
      removeLocalStorageItem(LEGACY_STORAGE_KEY);
    } catch {
      removeLocalStorageItem(PREFERENCES_STORAGE_KEY);
      removeLocalStorageItem(LEGACY_STORAGE_KEY);
    }
  });

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    persistPreferences({
      locale,
      theme,
      activeUserId: isAuthenticated ? "" : activeUserId,
    });
  }, [activeUserId, hasHydrated, isAuthenticated, locale, theme]);

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
      credentials: "same-origin",
    });

    if (!response.ok) {
      throw new Error("Unable to load the latest site data.");
    }

    const payload = (await response.json()) as SiteDataApiPayload;
    setPageContent(mergePageContentWithDefaults(payload.pageContent));
    setSponsors(normalizeSponsorProfiles(payload.sponsors));
    setJudges(payload.judges);
    setNewsPosts(payload.newsPosts);
    setRound1TestBanks((current) => mergeRound1BankMetadata(payload.round1TestBanks, current));
    setRound1Topics(normalizeRound1Topics(payload.round1Topics ?? []));
    setTimelineItems(payload.timelineItems);
  }, []);

  const syncAdminRound1Banks = useCallback(async () => {
    const response = await fetch("/api/admin/round-1/banks", {
      cache: "no-store",
      credentials: "same-origin",
    });

    if (!response.ok) {
      throw new Error("Unable to load the full Round 1 bank data.");
    }

    const payload = (await response.json()) as { round1TestBanks: Round1TestBank[] };
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
    setUsers(payload.users.map(normalizeUserProfile));
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

    const timeoutId = window.setTimeout(() => {
      void syncSiteData().catch(() => {
        pushToast(
          {
            en: "Could not load the latest public site data from the backend.",
            vi: "Không thể tải dữ liệu công khai mới nhất từ backend.",
          },
          "warning",
        );
      });
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [hasHydrated, syncSiteData]);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    if (!isAuthenticated) {
      const timeoutId = window.setTimeout(() => {
        setActiveUserIdState("");
      }, 0);

      return () => window.clearTimeout(timeoutId);
    }

    const timeoutId = window.setTimeout(() => {
      void syncWorkspace().catch(() => {
        pushToast(
          {
            en: "Could not sync the latest account workspace from the backend.",
            vi: "Không thể đồng bộ workspace tài khoản mới nhất từ backend.",
          },
          "warning",
        );
      });
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [hasHydrated, isAuthenticated, session?.user?.id, syncWorkspace]);

  const currentUser = users.find((user) => user.id === activeUserId) ?? GUEST_USER;
  const currentTeam = currentUser.id ? getTeamForUser(activeUserId, teams) : undefined;
  const canAccessAdminMode =
    isAuthenticated && (currentUser.role === "admin" || currentUser.role === "moderator");

  useEffect(() => {
    if (!hasHydrated || !canAccessAdminMode) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void syncAdminRound1Banks().catch(() => {
        pushToast(
          {
            en: "Could not load the full Round 1 bank data for admin mode.",
            vi: "Không thể tải đầy đủ dữ liệu ngân hàng đề Vòng 1 cho admin mode.",
          },
          "warning",
        );
      });
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [canAccessAdminMode, hasHydrated, syncAdminRound1Banks]);

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
    setRound1Topics(snapshot.round1Topics);
    setRound1Submissions(snapshot.round1Submissions);
    setNewsPosts(snapshot.newsPosts);
    setSponsors(normalizeSponsorProfiles(snapshot.sponsors));
    setJudges(snapshot.judges);
    setTimelineItems(snapshot.timelineItems);
    setPageContent(mergePageContentWithDefaults(snapshot.pageContent));
    pushToast(
      {
        en: "Demo state reset to the default preview.",
        vi: "Đã đặt lại dữ liệu demo về trạng thái mặc định.",
      },
      "info",
    );
  };

  const savePageContent = async (nextPageContent: SitePageContent, scope?: string) => {
    if (!canAccessAdminMode) {
      pushToast(
        {
          en: "Only admin and moderator accounts can update page content.",
          vi: "Chi tai khoan admin va moderator moi co the cap nhat noi dung trang.",
        },
        "warning",
      );
      return false;
    }

    try {
      const response = await fetch("/api/admin/content", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify(scope ? { pageContent: nextPageContent, scope } : nextPageContent),
      });

      if (!response.ok) {
        const error = await extractResponseError(response, "Could not save the page content.");
        pushToast({ en: error, vi: error }, "warning");
        return false;
      }

      await syncSiteData();
      pushToast(
        {
          en: "Page content updated in admin mode.",
          vi: "Nội dung trang đã được cập nhật trong admin mode.",
        },
        "success",
      );
      return true;
    } catch {
      pushToast(
        {
          en: "Could not save the page content right now.",
          vi: "Hiện không thể lưu nội dung trang.",
        },
        "warning",
      );
      return false;
    }
  };

  const saveSeasonContent = async (
    seasonContent: Pick<SitePageContent["organizer"], "seasonBadgeLabel" | "seasonStories" | "seasonArchives">,
  ) => {
    if (!canAccessAdminMode) {
      pushToast(
        {
          en: "Only admin and moderator accounts can update season content.",
          vi: "Chỉ tài khoản admin và moderator mới có thể cập nhật nội dung mùa thi.",
        },
        "warning",
      );
      return false;
    }

    try {
      const response = await fetch("/api/admin/seasons-content", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify(seasonContent),
      });

      if (!response.ok) {
        const error = await extractResponseError(response, "Could not save season content.");
        pushToast({ en: error, vi: error }, "warning");
        return false;
      }

      await syncSiteData();
      pushToast(
        {
          en: "Season content updated independently.",
          vi: "Nội dung mùa thi đã được lưu độc lập.",
        },
        "success",
      );
      return true;
    } catch {
      pushToast(
        {
          en: "Could not save season content right now.",
          vi: "Hiện không thể lưu nội dung mùa thi.",
        },
        "warning",
      );
      return false;
    }
  };

  const saveSponsorsByAdmin = (nextSponsors: SponsorProfile[]) => {
    if (!canAccessAdminMode) {
      pushToast(
        {
          en: "Only admin and moderator accounts can update sponsors.",
          vi: "Chi tai khoan admin va moderator moi co the cap nhat nha tai tro.",
        },
        "warning",
      );
      return;
    }

    void (async () => {
      const response = await fetch("/api/admin/content/sponsors", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify(nextSponsors),
      });

      if (!response.ok) {
        const error = await extractResponseError(response, "Could not save sponsor records.");
        pushToast({ en: error, vi: error }, "warning");
        return;
      }

      await syncSiteData();
      pushToast(
        {
          en: "Sponsor records updated in admin mode.",
          vi: "Danh sach nha tai tro da duoc cap nhat trong admin mode.",
        },
        "success",
      );
    })().catch(() => {
      pushToast(
        {
          en: "Could not save sponsor records right now.",
          vi: "Hien khong the luu danh sach nha tai tro.",
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

  const updateJudgeByAdmin = async (judgeId: string, payload: JudgeProfile & { accountPassword?: string }) => {
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

  const reorderJudgesByAdmin = async (judgeIds: string[]) => {
    if (!canAccessAdminMode) {
      pushToast(
        {
          en: "Only admin and moderator accounts can reorder judges here.",
          vi: "Chỉ tài khoản admin và moderator mới có thể sắp xếp giám khảo tại đây.",
        },
        "warning",
      );
      return false;
    }

    try {
      const response = await fetch("/api/admin/judges/order", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({ judgeIds }),
      });

      if (!response.ok) {
        const error = await extractResponseError(response, "Could not save the judge order.");
        pushToast({ en: error, vi: error }, "warning");
        return false;
      }

      await syncSiteData();
      pushToast(
        {
          en: "Judge display order updated.",
          vi: "Thứ tự hiển thị giám khảo đã được cập nhật.",
        },
        "success",
      );
      return true;
    } catch {
      pushToast(
        {
          en: "Could not save the judge order right now.",
          vi: "Hiện không thể lưu thứ tự giám khảo.",
        },
        "warning",
      );
      return false;
    }
  };

  const createOrganizerAccountByAdmin = async (payload: {
    loginId: string;
    name: string;
    password: string;
    role: "admin" | "moderator";
    avatarImageSrc?: string;
  }) => {
    const roleLabel =
      payload.role === "admin"
        ? {
            en: "admin account",
            vi: "tài khoản admin",
          }
        : {
            en: "moderator account",
            vi: "tài khoản moderator",
          };
    if (currentUser.role !== "admin") {
      pushToast(
        {
          en: "Only admin accounts can create organizer accounts here.",
          vi: "Chỉ tài khoản admin mới có thể tạo tài khoản ban tổ chức tại đây.",
        },
        "warning",
      );
      return false;
    }

    try {
      const response = await fetch("/api/admin/organizer-team", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await extractResponseError(
          response,
          "Could not create the organizer account.",
        );
        pushToast({ en: error, vi: error }, "warning");
        return false;
      }

      await syncWorkspace();
      pushToast(
        {
          en: `${roleLabel.en.charAt(0).toUpperCase()}${roleLabel.en.slice(1)} created.`,
          vi: `${roleLabel.vi.charAt(0).toUpperCase()}${roleLabel.vi.slice(1)} đã được tạo.`,
        },
        "success",
      );
      return true;
    } catch {
      pushToast(
        {
          en: "Could not create the organizer account right now.",
          vi: "Hiện không thể tạo tài khoản ban tổ chức.",
        },
        "warning",
      );
      return false;
    }
  };

  const updateOrganizerAccountByAdmin = async (
    userId: string,
    payload: {
      loginId: string;
      name: string;
      password?: string;
      avatarImageSrc?: string | null;
    },
  ) => {
    if (currentUser.role !== "admin") {
      pushToast(
        {
          en: "Only admin accounts can edit organizer accounts here.",
          vi: "Chỉ tài khoản admin mới có thể chỉnh sửa tài khoản ban tổ chức tại đây.",
        },
        "warning",
      );
      return false;
    }

    try {
      const response = await fetch(`/api/admin/organizer-team/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await extractResponseError(
          response,
          "Could not update the organizer account.",
        );
        pushToast({ en: error, vi: error }, "warning");
        return false;
      }

      await syncWorkspace();
      pushToast(
        {
          en: "Organizer account updated.",
          vi: "Tài khoản ban tổ chức đã được cập nhật.",
        },
        "success",
      );
      return true;
    } catch {
      pushToast(
        {
          en: "Could not update the organizer account right now.",
          vi: "Hiện không thể cập nhật tài khoản ban tổ chức.",
        },
        "warning",
      );
      return false;
    }
  };

  const deleteOrganizerAccountByAdmin = async (userId: string) => {
    if (currentUser.role !== "admin") {
      pushToast(
        {
          en: "Only admin accounts can delete organizer accounts here.",
          vi: "Chỉ tài khoản admin mới có thể xóa tài khoản ban tổ chức tại đây.",
        },
        "warning",
      );
      return false;
    }

    try {
      const response = await fetch(`/api/admin/organizer-team/${userId}`, {
        method: "DELETE",
        credentials: "same-origin",
      });

      if (!response.ok) {
        const error = await extractResponseError(
          response,
          "Could not delete the organizer account.",
        );
        pushToast({ en: error, vi: error }, "warning");
        return false;
      }

      await syncWorkspace();
      pushToast(
        {
          en: "Organizer account deleted.",
          vi: "Tài khoản ban tổ chức đã được xóa.",
        },
        "success",
      );
      return true;
    } catch {
      pushToast(
        {
          en: "Could not delete the organizer account right now.",
          vi: "Hiện không thể xóa tài khoản ban tổ chức.",
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
          phoneNumber: payload.phoneNumber ?? currentUser.phoneNumber,
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
          ? current.map((user) => (user.id === result.user.id ? normalizeUserProfile(result.user) : user))
          : [normalizeUserProfile(result.user), ...current],
      );
      await updateSession();
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
    payload: Pick<TeamProfile, "name" | "tag" | "avatarTone" | "track" | "bio"> & { avatarImageSrc?: string | null },
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

    if (!currentUser.phoneNumber.trim()) {
      pushToast(
        {
          en: "Add a phone number in your profile before creating a team.",
          vi: "Hãy bổ sung số điện thoại trong hồ sơ trước khi tạo đội.",
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
    payload: Partial<Pick<TeamProfile, "name" | "tag" | "avatarTone" | "track" | "bio">> & { avatarImageSrc?: string | null },
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
    payload: Partial<Pick<TeamProfile, "name" | "tag" | "avatarTone" | "avatarImageSrc" | "track" | "bio" | "leaderId" | "stage" | "finalOutcome">>,
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

    if (payload.leaderId) {
      const selectedLeader = users.find((user) => user.id === payload.leaderId);
      if (!selectedLeader || selectedLeader.role !== "student") {
        pushToast(
          {
            en: "Organizing team members cannot be assigned as team leader.",
            vi: "Thành viên ban tổ chức không thể được gán làm đội trưởng.",
          },
          "warning",
        );
        return;
      }
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

  const validateRound1QuestionDraft = (payload: Round1Question) => {
    const questionId = payload.id.trim();
    if (!questionId) {
      return {
        en: "Question ID is required.",
        vi: "Mã câu hỏi là bắt buộc.",
      } satisfies LocalizedText;
    }

    if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$/.test(questionId)) {
      return {
        en: "Question ID can only contain letters, numbers, dots, underscores, and hyphens.",
        vi: "Mã câu hỏi chỉ được dùng chữ, số, dấu chấm, gạch dưới và gạch nối.",
      } satisfies LocalizedText;
    }

    if (!payload.topic.trim() || !payload.prompt.en.trim() || !payload.prompt.vi.trim()) {
      return {
        en: "Question topic and question content are required.",
        vi: "Chủ đề và nội dung câu hỏi là bắt buộc.",
      } satisfies LocalizedText;
    }

    if (
      round1Topics.length > 0 &&
      !round1Topics.some((topic) => topic.toLowerCase() === payload.topic.trim().toLowerCase())
    ) {
      return {
        en: "Choose the question topic from the managed Round 1 topic list.",
        vi: "Hãy chọn chủ đề câu hỏi từ danh sách chủ đề Vòng 1 đã quản lý.",
      } satisfies LocalizedText;
    }

    const options = payload.options ?? [];
    const correctOptionIds = payload.correctOptionIds ?? [];
    const optionIds = new Set(options.map((option) => option.id));

    if (options.some((option) => !option.text.en.trim() || !option.text.vi.trim())) {
      return {
        en: "Each configured option must include question content.",
        vi: "Mỗi lựa chọn được cấu hình phải có nội dung.",
      } satisfies LocalizedText;
    }

    if (payload.type === "true-false" || payload.type === "single-choice") {
      if (options.length < 2 || correctOptionIds.length !== 1 || !optionIds.has(correctOptionIds[0])) {
        return {
          en: "True/False and single-choice questions need at least 2 options and exactly 1 correct answer.",
          vi: "Câu Đúng/Sai và một đáp án cần ít nhất 2 lựa chọn và đúng 1 đáp án đúng.",
        } satisfies LocalizedText;
      }
    }

    if (payload.type === "multiple-choice") {
      if (
        options.length < 2 ||
        correctOptionIds.length < 2 ||
        correctOptionIds.some((optionId) => !optionIds.has(optionId))
      ) {
        return {
          en: "Multiple-choice questions need at least 2 correct answers selected from the configured options.",
          vi: "Câu nhiều đáp án cần ít nhất 2 đáp án đúng nằm trong các lựa chọn đã cấu hình.",
        } satisfies LocalizedText;
      }
    }

    if (payload.type === "pairing") {
      const pairingIssue = getRound1PairingValidationIssue(payload);
      if (pairingIssue) {
        return getRound1PairingValidationMessage(pairingIssue);
      }
    }

    if (payload.type === "essay") {
      if (
        !payload.placeholder?.en.trim() ||
        !payload.placeholder?.vi.trim() ||
        !payload.rubricNote?.en.trim() ||
        !payload.rubricNote?.vi.trim()
      ) {
        return {
          en: "Essay questions need a placeholder and rubric note.",
          vi: "Câu tự luận cần có placeholder và ghi chú rubric.",
        } satisfies LocalizedText;
      }
    }

    return null;
  };

  const createRound1QuestionByAdmin = async (
    bankId: string,
    payload: Round1Question,
  ) => {
    if (!canAccessAdminMode) {
      pushToast(
        {
          en: "Only admin and moderator accounts can create Round 1 questions here.",
          vi: "Chỉ tài khoản admin và moderator mới có thể tạo câu hỏi Vòng 1 tại đây.",
        },
        "warning",
      );
      return null;
    }

    const validationError = validateRound1QuestionDraft(payload);
    if (validationError) {
      pushToast(validationError, "warning");
      return null;
    }

    try {
      const response = await fetch(`/api/admin/round-1/banks/${bankId}/questions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await extractResponseError(response, "Could not create the Round 1 question.");
        pushToast({ en: error, vi: error }, "warning");
        return null;
      }

      const result = (await response.json().catch(() => null)) as { questionId?: string } | null;
      await Promise.all([syncSiteData(), syncAdminRound1Banks()]);
      pushToast(
        {
          en: "Round 1 question created in admin mode.",
          vi: "Câu hỏi Vòng 1 đã được tạo trong admin mode.",
        },
        "success",
      );
      return result?.questionId ?? null;
    } catch {
      pushToast(
        {
          en: "Could not create the Round 1 question right now.",
          vi: "Hiện không thể tạo câu hỏi Vòng 1.",
        },
        "warning",
      );
      return null;
    }
  };

  const updateRound1QuestionByAdmin = async (
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
      return null;
    }

    const validationError = validateRound1QuestionDraft(payload);
    if (validationError) {
      pushToast(validationError, "warning");
      return null;
    }

    try {
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
        return null;
      }

      const result = (await response.json().catch(() => null)) as { questionId?: string } | null;
      await Promise.all([syncSiteData(), syncAdminRound1Banks()]);
      pushToast(
        {
          en: "Round 1 question updated in admin mode.",
          vi: "Câu hỏi Vòng 1 đã được cập nhật trong admin mode.",
        },
        "success",
      );
      return result?.questionId ?? payload.id;
    } catch {
      pushToast(
        {
          en: "Could not update the Round 1 question right now.",
          vi: "Hiện không thể cập nhật câu hỏi Vòng 1.",
        },
        "warning",
      );
      return null;
    }
  };

  const deleteRound1QuestionByAdmin = async (bankId: string, questionId: string) => {
    if (!canAccessAdminMode) {
      pushToast(
        {
          en: "Only admin and moderator accounts can delete Round 1 questions here.",
          vi: "Chỉ tài khoản admin và moderator mới có thể xóa câu hỏi Vòng 1 tại đây.",
        },
        "warning",
      );
      return false;
    }

    try {
      const response = await fetch(`/api/admin/round-1/banks/${bankId}/questions/${questionId}`, {
        method: "DELETE",
        credentials: "same-origin",
      });

      if (!response.ok) {
        const error = await extractResponseError(response, "Could not delete the Round 1 question.");
        pushToast({ en: error, vi: error }, "warning");
        return false;
      }

      await Promise.all([syncSiteData(), syncAdminRound1Banks()]);
      pushToast(
        {
          en: "Round 1 question deleted from the admin dataset.",
          vi: "Câu hỏi Vòng 1 đã được xóa khỏi dữ liệu admin.",
        },
        "success",
      );
      return true;
    } catch {
      pushToast(
        {
          en: "Could not delete the Round 1 question right now.",
          vi: "Hiện không thể xóa câu hỏi Vòng 1.",
        },
        "warning",
      );
      return false;
    }
  };

  const updateRound1FixedEssayPromptByAdmin = async (bankId: string, payload: LocalizedText) => {
    if (!canAccessAdminMode) {
      pushToast(
        {
          en: "Only admin and moderator accounts can edit the fixed Round 1 essay question here.",
          vi: "Chỉ tài khoản admin và moderator mới có thể sửa câu tự luận cố định Vòng 1 tại đây.",
        },
        "warning",
      );
      return false;
    }

    try {
      const response = await fetch(`/api/admin/round-1/banks/${bankId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({ fixedEssayPrompt: payload }),
      });

      if (!response.ok) {
        const error = await extractResponseError(response, "Could not update the fixed Round 1 essay question.");
        pushToast({ en: error, vi: error }, "warning");
        return false;
      }

      await Promise.all([syncSiteData(), syncAdminRound1Banks()]);
      pushToast(
        {
          en: "Fixed Round 1 essay question updated.",
          vi: "Câu tự luận cố định Vòng 1 đã được cập nhật.",
        },
        "success",
      );
      return true;
    } catch {
      pushToast(
        {
          en: "Could not update the fixed Round 1 essay question right now.",
          vi: "Hiện không thể cập nhật câu tự luận cố định Vòng 1.",
        },
        "warning",
      );
      return false;
    }
  };

  const updateRound1TopicsByAdmin = async (
    topics: string[],
    options?: { rename?: { from: string; to: string } },
  ) => {
    if (currentUser.role !== "admin") {
      pushToast(
        {
          en: "Only admin accounts can manage Round 1 topics.",
          vi: "Chỉ tài khoản admin mới có thể quản lý chủ đề Vòng 1.",
        },
        "warning",
      );
      return false;
    }

    try {
      const response = await fetch("/api/admin/round-1/topics", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({
          topics,
          rename: options?.rename,
        }),
      });

      if (!response.ok) {
        const error = await extractResponseError(response, "Could not update Round 1 topics.");
        pushToast({ en: error, vi: error }, "warning");
        return false;
      }

      await Promise.all([syncSiteData(), syncAdminRound1Banks()]);
      pushToast(
        {
          en: "Round 1 topics updated successfully.",
          vi: "Đã cập nhật chủ đề Vòng 1 thành công.",
        },
        "success",
      );
      return true;
    } catch {
      pushToast(
        {
          en: "Could not update Round 1 topics right now.",
          vi: "Hiện không thể cập nhật chủ đề Vòng 1.",
        },
        "warning",
      );
      return false;
    }
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

    if (targetUser && targetUser.role !== "student") {
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
        body: JSON.stringify({ userId }),
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

  const recallInvitation = (invitationId: string) => {
    const invitation = invitations.find((item) => item.id === invitationId);
    const team = invitation ? teams.find((item) => item.id === invitation.teamId) : undefined;

    if (!invitation || invitation.status !== "pending") {
      return;
    }

    if (!team || (team.leaderId !== activeUserId && invitation.fromUserId !== activeUserId)) {
      pushToast(
        {
          en: "Only the sender or current team leader can recall this invitation.",
          vi: "Chỉ người gửi hoặc đội trưởng hiện tại mới có thể thu hồi lời mời này.",
        },
        "warning",
      );
      return;
    }

    void (async () => {
      const response = await fetch(`/api/invitations/${invitation.id}`, {
        method: "DELETE",
        credentials: "same-origin",
      });

      if (!response.ok) {
        const error = await extractResponseError(response, "Could not recall the invitation.");
        pushToast({ en: error, vi: error }, "warning");
        return;
      }

      await syncWorkspace();
      pushToast(
        {
          en: "Invitation recalled.",
          vi: "Đã thu hồi lời mời.",
        },
        "success",
      );
    })().catch(() => {
      pushToast(
        {
          en: "Could not recall the invitation right now.",
          vi: "Hiện không thể thu hồi lời mời.",
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

  const kickTeamMember = async (memberId: string, reason: string) => {
    const team = getTeamForUser(activeUserId, teams);
    const targetMember = users.find((user) => user.id === memberId);
    const trimmedReason = reason.trim();

	    if (!team || team.leaderId !== activeUserId) {
	      pushToast(
	        {
	          en: "Only the team leader can remove team members.",
          vi: "Chỉ đội trưởng mới có thể đưa thành viên ra khỏi đội.",
        },
        "warning",
      );
	      return false;
	    }

	    if (isTeamRosterLocked(team)) {
	      pushToast(
	        {
	          en:
	            team.round1LockStatus === "pending"
	              ? "Members cannot be removed while the Round 1 lock workflow is pending."
	              : "Members can no longer be removed after the team roster is locked.",
	          vi:
	            team.round1LockStatus === "pending"
	              ? "Không thể đưa thành viên ra khỏi đội khi quy trình khóa đội cho Vòng 1 vẫn đang chờ xác nhận."
	              : "Không thể đưa thành viên ra khỏi đội sau khi đội hình đã bị khóa.",
	        },
	        "warning",
	      );
	      return false;
	    }

	    if (!targetMember || !team.memberIds.includes(memberId) || memberId === team.leaderId) {
	      pushToast(
	        {
          en: "Choose a current non-leader member to remove.",
          vi: "Hãy chọn một thành viên hiện tại không phải đội trưởng.",
        },
        "warning",
      );
      return false;
    }

    if (!trimmedReason) {
      pushToast(
        {
          en: "A removal reason is required.",
          vi: "Vui lòng nhập lý do đưa thành viên ra khỏi đội.",
        },
        "warning",
      );
      return false;
    }

    try {
      const response = await fetch(`/api/teams/${team.id}/members/${memberId}/kick`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({ reason: trimmedReason }),
      });

      if (!response.ok) {
        const error = await extractResponseError(response, "Could not remove this member.");
        pushToast({ en: error, vi: error }, "warning");
        return false;
      }

      await syncWorkspace();
      pushToast(
        {
          en: `${targetMember.name} has been removed from the team.`,
          vi: `Đã đưa ${targetMember.name} ra khỏi đội.`,
        },
        "success",
      );
      window.dispatchEvent(new Event("attacker-notifications-refresh"));
      return true;
    } catch {
      pushToast(
        {
          en: "Could not remove this member right now.",
          vi: "Hiện không thể đưa thành viên này ra khỏi đội.",
        },
        "warning",
      );
      return false;
    }
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

    if (decision === "accept" && !currentUser.phoneNumber.trim()) {
      pushToast(
        {
          en: "Add a phone number in your profile before accepting leadership.",
          vi: "Hãy bổ sung số điện thoại trong hồ sơ trước khi nhận quyền đội trưởng.",
        },
        "warning",
      );
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

  const updateRound1EssayScoreByAdmin = async (
    submissionId: string,
    payload: number | { questionScores: Record<string, number> },
  ) => {
    if (!canAccessAdminMode) {
      pushToast(
        {
          en: "Only admin and moderator accounts can score Round 1 essays here.",
          vi: "Chỉ tài khoản admin và moderator mới có thể chấm phần tự luận Vòng 1 tại đây.",
        },
        "warning",
      );
      return null;
    }

    if (
      typeof payload === "number" &&
      (!Number.isFinite(payload) || payload < 0 || payload > 28)
    ) {
      pushToast(
        {
          en: "Essay score must be a number between 0 and 28.",
          vi: "Điểm tự luận phải là một số từ 0 đến 28.",
        },
        "warning",
      );
      return null;
    }

    try {
      const response = await fetch(`/api/admin/round-1/submissions/${submissionId}/essay-score`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify(
          typeof payload === "number" ? { essayScore: payload } : payload,
        ),
      });

      if (!response.ok) {
        const error = await extractResponseError(response, "Could not update the essay score.");
        pushToast({ en: error, vi: error }, "warning");
        return null;
      }

      const result = (await response.json()) as {
        essayScore: number | null;
        totalScore: number | null;
        essayQuestionScores: Record<string, number>;
      };

      setRound1Submissions((current) =>
        current.map((submission) =>
          submission.id === submissionId
            ? {
                ...submission,
                essayScore: result.essayScore,
                totalScore: result.totalScore,
              }
            : submission,
        ),
      );

      pushToast(
        {
          en:
            result.totalScore == null
              ? "Essay review was saved, but the final Round 1 total is still pending more essay scores."
              : typeof payload === "number"
                ? "Essay score updated and the Round 1 total score has been recalculated."
                : "Essay question scores updated and the Round 1 total score has been recalculated.",
          vi:
            result.totalScore == null
              ? "Đã lưu phần chấm tự luận, nhưng tổng điểm Vòng 1 vẫn đang chờ đủ điểm của các câu tự luận."
              : typeof payload === "number"
                ? "Điểm tự luận đã được cập nhật và tổng điểm Vòng 1 đã được tính lại."
                : "Điểm từng câu tự luận đã được cập nhật và tổng điểm Vòng 1 đã được tính lại.",
        },
        "success",
      );

      return result;
    } catch {
      pushToast(
        {
          en: "Could not update the essay score right now.",
          vi: "Hiện không thể cập nhật điểm tự luận.",
        },
        "warning",
      );
      return null;
    }
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

    if (!canTeamTakeRound1(team, new Date(), timelineItems)) {
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
    allowRound3FinalistSubmission?: boolean;
    onUploadStart?: () => void;
    onUploadProgress?: (progress: number) => void;
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
    const isRound3FinalistSubmission =
      payload.round === "round-3" && Boolean(payload.allowRound3FinalistSubmission);

    if (team.stage !== requiredStage && !isRound3FinalistSubmission) {
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

    const submissionEligibilityTeam = isRound3FinalistSubmission
      ? { ...team, stage: "round-3" as CompetitionStage }
      : team;

    if (!canTeamSubmitForRound(submissionEligibilityTeam, payload.round, new Date(), timelineItems)) {
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

    const maxSubmissionFileBytes = getMaxSubmissionFileBytes(payload.round);
    const validationError = getSubmissionValidationError(payload.resourceFile, maxSubmissionFileBytes);

    if (validationError === "missing") {
      pushToast(
        {
          en: "Upload a PDF file before submitting.",
          vi: "Hãy tải lên tệp PDF trước khi nộp.",
        },
        "warning",
      );
      return false;
    }

    if (validationError === "type") {
      pushToast(
        {
          en: "Only PDF files are allowed.",
          vi: "Chỉ cho phép tệp PDF.",
        },
        "warning",
      );
      return false;
    }

    if (validationError === "size") {
      pushToast(
        {
          en: `The uploaded PDF must be ${Math.round(maxSubmissionFileBytes / 1024 / 1024)}MB or smaller.`,
          vi: `Tệp PDF tải lên phải nhỏ hơn hoặc bằng ${Math.round(maxSubmissionFileBytes / 1024 / 1024)}MB.`,
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

    payload.onUploadStart?.();
    payload.onUploadProgress?.(4);
    pushToast(
      {
        en: "Your report is uploading. Please keep this page open and wait.",
        vi: "Báo cáo đang được tải lên. Vui lòng giữ trang này mở và chờ trong giây lát.",
      },
      "info",
    );

    const uploadResult = await new Promise<{
      ok: boolean;
      payload: { error?: string; version?: number } | null;
    }>((resolve) => {
      const request = new XMLHttpRequest();
      request.open("POST", "/api/teams/current/submissions");
      request.withCredentials = true;
      request.upload.onprogress = (event) => {
        if (!event.lengthComputable || event.total <= 0) {
          return;
        }

        const progress = Math.max(4, Math.min(96, Math.round((event.loaded / event.total) * 96)));
        payload.onUploadProgress?.(progress);
      };
      request.onload = () => {
        const responsePayload = (() => {
          try {
            return JSON.parse(request.responseText) as { error?: string; version?: number };
          } catch {
            return null;
          }
        })();
        resolve({
          ok: request.status >= 200 && request.status < 300,
          payload: responsePayload,
        });
      };
      request.onerror = () =>
        resolve({
          ok: false,
          payload: { error: "Could not submit the team report." },
        });
      request.send(formData);
    });

    if (!uploadResult.ok) {
      const error = uploadResult.payload?.error || "Could not submit the team report.";
      pushToast({ en: error, vi: error }, "warning");
      return false;
    }

    payload.onUploadProgress?.(100);
    const result = uploadResult.payload;
    await syncWorkspace();
    const uploadedRoundLabelEn = payload.round === "round-2" ? "Round 2" : "Final/Emerging round";
    const uploadedRoundLabelVi = payload.round === "round-2" ? "Vòng 2" : "chung kết/Vòng Đội Ươm mầm";
    pushToast(
      {
        en: `The report uploaded successfully. Version ${result?.version ?? "new"} is now the final valid version for ${uploadedRoundLabelEn}.`,
        vi: `Báo cáo đã tải lên thành công. Phiên bản ${result?.version ?? "mới"} hiện là phiên bản hợp lệ cuối cùng cho ${uploadedRoundLabelVi}.`,
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
    round1Topics,
    round1Submissions,
    newsPosts,
    sponsors,
    judges,
    timelineItems,
    pageContent,
    currentUser,
    currentTeam,
    canAccessAdminMode,
    hasHydrated,
    refreshWorkspace: syncWorkspace,
    setLocale,
    setTheme,
    setActiveUserId,
    signOutCurrentUser,
    resetDemoData,
    savePageContent,
    saveSeasonContent,
    saveSponsorsByAdmin,
    createNewsPostByAdmin,
    updateNewsPostByAdmin,
    deleteNewsPostByAdmin,
    createJudgeByAdmin,
    updateJudgeByAdmin,
    reorderJudgesByAdmin,
    deleteJudgeByAdmin,
    updateTimelineItemsByAdmin: setTimelineItems,
    createOrganizerAccountByAdmin,
    updateOrganizerAccountByAdmin,
    deleteOrganizerAccountByAdmin,
    updateActiveUserProfile,
    updateUserByAdmin,
    deleteUserByAdmin,
    createTeam,
    updateCurrentTeam,
    updateTeamByAdmin,
    deleteTeamByAdmin,
    createRound1QuestionByAdmin,
    updateRound1QuestionByAdmin,
    deleteRound1QuestionByAdmin,
    updateRound1FixedEssayPromptByAdmin,
    updateRound1TopicsByAdmin,
    updateRound1EssayScoreByAdmin,
    inviteUser,
    recallInvitation,
    respondToInvitation,
    initiateRound1TeamLock,
    respondToRound1TeamLock,
    leaveCurrentTeam,
    kickTeamMember,
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
