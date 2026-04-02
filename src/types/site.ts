export type Locale = "en" | "vi";
export type Theme = "dark" | "light";
export type SubmissionRound = "round-2" | "round-3";
export type UserRole = "student" | "moderator" | "admin";
export type CompetitionStage = "round-1" | "round-2" | "round-3";
export type CompetitionState = "not-eligible" | CompetitionStage;
export type CompetitionRoundKey = CompetitionStage;
export type TeamRound1LockStatus = "open" | "pending" | "locked" | "declined";

export type LocalizedText = Record<Locale, string>;

export interface NavItem {
  href: string;
  label: LocalizedText;
}

export interface MetricItem {
  value: string;
  label: LocalizedText;
  note: LocalizedText;
}

export interface SpotlightItem {
  title: LocalizedText;
  description: LocalizedText;
  accent: string;
}

export interface RoundItem {
  id: string;
  label: LocalizedText;
  title: LocalizedText;
  duration: LocalizedText;
  description: LocalizedText;
  deliverables: LocalizedText[];
}

export interface RewardItem {
  title: LocalizedText;
  amount: LocalizedText;
  note: LocalizedText;
}

export interface RuleItem {
  title: LocalizedText;
  description: LocalizedText;
}

export interface TimelineItem {
  phase: "general" | CompetitionRoundKey;
  startDate: string;
  endDate: string;
  title: LocalizedText;
  description: LocalizedText;
  location: LocalizedText;
  method: LocalizedText;
  supportLinks?: NavItem[];
}

export interface CompetitionRoundWindow {
  round: CompetitionRoundKey;
  title: LocalizedText;
  startDate: string;
  endDate: string;
}

export interface FAQItem {
  question: LocalizedText;
  answer: LocalizedText;
}

export interface SponsorProfile {
  name: string;
  logoSrc: string;
  tier: LocalizedText;
  category: LocalizedText;
  description: LocalizedText;
}

export interface JudgeProfile {
  id: string;
  name: string;
  imageSrc: string;
  role: LocalizedText;
  organization: string;
  bio: LocalizedText;
  expertise: LocalizedText[];
  avatarTone: string;
  rounds: CompetitionRoundKey[];
}

export interface TestimonialItem {
  name: string;
  competitionRole: LocalizedText;
  university: string;
  currentEmployment?: LocalizedText;
  avatarImageSrc: string;
  quote: LocalizedText;
}

export type ForumThreadCategory =
  | "looking-for-team"
  | "team-looking-for-members"
  | "general-discussion";

export type ForumThreadStatus = "open" | "closed";

export interface ForumAuthor {
  id: string;
  name: string;
  university: string;
  role: UserRole;
  avatarTone: string;
  avatarImageSrc?: string;
}

export interface ForumReply {
  id: string;
  threadId: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  author: ForumAuthor;
}

export interface ForumThread {
  id: string;
  slug: string;
  title: string;
  summary: string;
  body: string;
  category: ForumThreadCategory;
  status: ForumThreadStatus;
  university: string;
  preferredRoles: string[];
  contactNote: string;
  createdAt: string;
  updatedAt: string;
  lastActivityAt: string;
  replyCount: number;
  author: ForumAuthor;
  replies?: ForumReply[];
}

export type NewsContentBlock =
  | {
      type: "paragraph";
      body: LocalizedText;
    }
  | {
      type: "image";
      src: string;
      alt: LocalizedText;
      caption: LocalizedText;
      emphasis?: "standard" | "feature";
      origin?: "cover" | "body";
    };

export interface NewsPost {
  slug: string;
  category: LocalizedText;
  title: LocalizedText;
  excerpt: LocalizedText;
  author: string;
  publishedAt: string;
  readTime: string;
  coverLabel: LocalizedText;
  coverImageSrc: string;
  coverImageAlt: LocalizedText;
  highlights: LocalizedText[];
  content: NewsContentBlock[];
  tags: string[];
}

export interface Round1QuestionOption {
  id: string;
  label: string;
  text: LocalizedText;
}

export type Round1QuestionDifficulty = "easy" | "medium" | "hard";
export type Round1QuestionType =
  | "true-false"
  | "single-choice"
  | "multiple-choice"
  | "pairing"
  | "essay";
export type Round1TestBankType = "objective" | "essay";

export interface Round1PairingItem {
  id: string;
  label: string;
  prompt: LocalizedText;
  correctOptionId: string;
}

export interface Round1Question {
  id: string;
  prompt: LocalizedText;
  topic: string;
  difficulty: Round1QuestionDifficulty;
  type: Round1QuestionType;
  options?: Round1QuestionOption[];
  correctOptionIds?: string[];
  pairingItems?: Round1PairingItem[];
  rubricNote?: LocalizedText;
  placeholder?: LocalizedText;
}

export interface Round1TestBank {
  id: string;
  bankType: Round1TestBankType;
  title: LocalizedText;
  description: LocalizedText;
  status: "draft" | "active" | "archived";
  questionPoolSize: number;
  questionsPerAttempt: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  durationMinutes: number;
  wordLimit?: number;
  publishedAt: string;
  questions: Round1Question[];
}

export interface Round1Submission {
  id: string;
  bankId: string;
  teamId: string;
  userId: string;
  submittedAt: string;
  rightCount: number;
  wrongCount: number;
  score: number;
  objectiveScore: number;
  essayScore: number | null;
  totalScore: number | null;
  durationMinutes: number;
}

export interface UserProfile {
  id: string;
  loginId?: string;
  name: string;
  email: string;
  role: UserRole;
  studentId: string;
  phoneNumber: string;
  university: string;
  major: string;
  classYear: string;
  bio: string;
  avatarTone: string;
  avatarImageSrc?: string;
  providers: ("email" | "google")[];
}

export interface EditableSectionCopy {
  eyebrow: LocalizedText;
  title: LocalizedText;
  description: LocalizedText;
}

export interface SystemEmailTemplate {
  subject: LocalizedText;
  preview: LocalizedText;
  headline: LocalizedText;
  intro: LocalizedText;
  actionLabel: LocalizedText;
  actionHint: LocalizedText;
  footer: LocalizedText;
}

export interface SystemEmailTemplates {
  activation: SystemEmailTemplate;
  passwordReset: SystemEmailTemplate;
}

export interface EditableHeroSlide {
  id: string;
  image: string;
  eyebrow: LocalizedText;
  title: LocalizedText;
  description: LocalizedText;
}

export interface SitePageContent {
  home: {
    heroSlides: EditableHeroSlide[];
    news: EditableSectionCopy;
    sponsors: EditableSectionCopy;
    destinations: EditableSectionCopy;
    cta: EditableSectionCopy;
  };
  competition: {
    intro: EditableSectionCopy;
    rounds: EditableSectionCopy;
    rewards: EditableSectionCopy;
    mentors: EditableSectionCopy;
  };
  rules: {
    header: EditableSectionCopy;
    coreRules: EditableSectionCopy;
    timeline: EditableSectionCopy;
    faq: EditableSectionCopy;
  };
  news: {
    header: EditableSectionCopy;
    featured: EditableSectionCopy;
    latest: EditableSectionCopy;
    related: EditableSectionCopy;
  };
  sponsors: {
    header: EditableSectionCopy;
    partnership: EditableSectionCopy;
  };
  judges: {
    header: EditableSectionCopy;
    clarity: EditableSectionCopy;
  };
  auth: {
    header: EditableSectionCopy;
    registerNote: LocalizedText;
    signinNote: LocalizedText;
  };
  workspace: {
    header: EditableSectionCopy;
    noTeamTitle: LocalizedText;
    noTeamDescription: LocalizedText;
    teamDescription: LocalizedText;
  };
  organizer: {
    header: EditableSectionCopy;
    contentModules: EditableSectionCopy;
    flags: EditableSectionCopy;
  };
}

export interface TeamProfile {
  id: string;
  name: string;
  tag: string;
  leaderId: string;
  memberIds: string[];
  stage: CompetitionStage;
  round1LockStatus: TeamRound1LockStatus;
  round1LockProtocolId?: string;
  round1LockRequestedAt?: string;
  round1LockedAt?: string;
  round1LockDeclinedAt?: string;
  round1LockDeclinedByUserId?: string;
  avatarTone: string;
  avatarImageSrc?: string;
  track: string;
  bio: string;
  createdAt: string;
}

export interface TeamInvitation {
  id: string;
  teamId: string;
  fromUserId: string;
  toUserId: string;
  createdAt: string;
  status: "pending" | "accepted" | "declined" | "expired";
}

export interface LeadershipTransferRequest {
  id: string;
  teamId: string;
  fromUserId: string;
  toUserId: string;
  createdAt: string;
  status: "pending" | "accepted" | "declined" | "cancelled";
}

export interface Round1TeamLockRequest {
  id: string;
  protocolId: string;
  teamId: string;
  fromUserId: string;
  toUserId: string;
  createdAt: string;
  respondedAt?: string;
  status: "pending" | "accepted" | "declined" | "cancelled";
}

export interface TeamSubmission {
  id: string;
  teamId: string;
  round: SubmissionRound;
  version: number;
  title: string;
  summary: string;
  resourceSource: "external" | "upload";
  resourceLabel: string;
  resourceUrl?: string;
  resourceStorageKey?: string;
  resourceMimeType?: string;
  resourceSizeBytes?: number;
  submittedByUserId: string;
  submittedAt: string;
}

export interface AppSnapshot {
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
}
