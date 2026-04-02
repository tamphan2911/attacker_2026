import {
  CompetitionStage,
  LeadershipTransferStatus,
  Round1QuestionDifficulty,
  Round1QuestionType,
  Round1TeamLockRequestStatus,
  Round1TestBankType,
  TeamInvitationStatus,
  TeamRound1LockStatus,
  TeamSubmissionResourceSource,
  UserRole,
  type Account,
  type NewsPost as PrismaNewsPost,
  type Round1Submission,
  type Round1TeamLockRequest,
  type Round1TestBank,
  type Team,
  type TeamInvitation,
  type TeamMember,
  type TeamSubmission,
  type User,
  type LeadershipTransferRequest,
  ForumThreadCategory,
  ForumThreadStatus,
  type ForumReply,
  type ForumThread,
} from "@prisma/client";

import type {
  ForumAuthor,
  ForumReply as AppForumReply,
  ForumThread as AppForumThread,
  Round1Question,
  Round1Submission as AppRound1Submission,
  Round1TeamLockRequest as AppRound1TeamLockRequest,
  Round1TestBank as AppRound1TestBank,
  TeamInvitation as AppTeamInvitation,
  NewsPost as AppNewsPost,
  TeamProfile,
  TeamSubmission as AppTeamSubmission,
  UserProfile,
  LeadershipTransferRequest as AppLeadershipTransferRequest,
} from "@/types/site";

type UserWithAccounts = User & {
  accounts?: Pick<Account, "provider">[];
};

type TeamWithMembers = Team & {
  members: Pick<TeamMember, "userId">[];
};

function mapUserRole(role: UserRole): UserProfile["role"] {
  switch (role) {
    case UserRole.ADMIN:
      return "admin";
    case UserRole.MODERATOR:
      return "moderator";
    case UserRole.STUDENT:
    default:
      return "student";
  }
}

function mapStage(stage: CompetitionStage): TeamProfile["stage"] {
  switch (stage) {
    case CompetitionStage.ROUND_2:
      return "round-2";
    case CompetitionStage.ROUND_3:
      return "round-3";
    case CompetitionStage.ROUND_1:
    default:
      return "round-1";
  }
}

function mapTeamLockStatus(status: TeamRound1LockStatus): TeamProfile["round1LockStatus"] {
  switch (status) {
    case TeamRound1LockStatus.PENDING:
      return "pending";
    case TeamRound1LockStatus.LOCKED:
      return "locked";
    case TeamRound1LockStatus.DECLINED:
      return "declined";
    case TeamRound1LockStatus.OPEN:
    default:
      return "open";
  }
}

function mapInvitationStatus(status: TeamInvitationStatus): AppTeamInvitation["status"] {
  switch (status) {
    case TeamInvitationStatus.ACCEPTED:
      return "accepted";
    case TeamInvitationStatus.DECLINED:
      return "declined";
    case TeamInvitationStatus.EXPIRED:
      return "expired";
    case TeamInvitationStatus.PENDING:
    default:
      return "pending";
  }
}

function mapLeadershipStatus(status: LeadershipTransferStatus): AppLeadershipTransferRequest["status"] {
  switch (status) {
    case LeadershipTransferStatus.ACCEPTED:
      return "accepted";
    case LeadershipTransferStatus.DECLINED:
      return "declined";
    case LeadershipTransferStatus.CANCELLED:
      return "cancelled";
    case LeadershipTransferStatus.PENDING:
    default:
      return "pending";
  }
}

function mapRound1LockRequestStatus(
  status: Round1TeamLockRequestStatus,
): AppRound1TeamLockRequest["status"] {
  switch (status) {
    case Round1TeamLockRequestStatus.ACCEPTED:
      return "accepted";
    case Round1TeamLockRequestStatus.DECLINED:
      return "declined";
    case Round1TeamLockRequestStatus.CANCELLED:
      return "cancelled";
    case Round1TeamLockRequestStatus.PENDING:
    default:
      return "pending";
  }
}

function mapSubmissionSource(
  source: TeamSubmissionResourceSource,
): AppTeamSubmission["resourceSource"] {
  return source === TeamSubmissionResourceSource.UPLOAD ? "upload" : "external";
}

function mapQuestionDifficulty(
  difficulty: Round1QuestionDifficulty,
): Round1Question["difficulty"] {
  switch (difficulty) {
    case Round1QuestionDifficulty.MEDIUM:
      return "medium";
    case Round1QuestionDifficulty.HARD:
      return "hard";
    case Round1QuestionDifficulty.EASY:
    default:
      return "easy";
  }
}

function mapQuestionType(type: Round1QuestionType): Round1Question["type"] {
  switch (type) {
    case Round1QuestionType.TRUE_FALSE:
      return "true-false";
    case Round1QuestionType.MULTIPLE_CHOICE:
      return "multiple-choice";
    case Round1QuestionType.PAIRING:
      return "pairing";
    case Round1QuestionType.ESSAY:
      return "essay";
    case Round1QuestionType.SINGLE_CHOICE:
    default:
      return "single-choice";
  }
}

function mapBankType(type: Round1TestBankType): AppRound1TestBank["bankType"] {
  return type === Round1TestBankType.ESSAY ? "essay" : "objective";
}

function mapForumCategory(category: ForumThreadCategory): AppForumThread["category"] {
  switch (category) {
    case ForumThreadCategory.TEAM_LOOKING_FOR_MEMBERS:
      return "team-looking-for-members";
    case ForumThreadCategory.GENERAL_DISCUSSION:
      return "general-discussion";
    case ForumThreadCategory.LOOKING_FOR_TEAM:
    default:
      return "looking-for-team";
  }
}

function mapForumStatus(status: ForumThreadStatus): AppForumThread["status"] {
  return status === ForumThreadStatus.CLOSED ? "closed" : "open";
}

export function serializeUser(user: UserWithAccounts): UserProfile {
  const providerSet = new Set<"email" | "google">();

  if (user.passwordHash) {
    providerSet.add("email");
  }

  for (const account of user.accounts ?? []) {
    if (account.provider === "google") {
      providerSet.add("google");
    }
  }

  return {
    id: user.id,
    loginId: user.loginId,
    name: user.name,
    email: user.email,
    role: mapUserRole(user.role),
    studentId: user.studentId ?? "",
    phoneNumber: user.phoneNumber ?? "",
    university: user.university,
    major: user.major,
    classYear: user.classYear,
    bio: user.bio,
    avatarTone: user.avatarTone,
    avatarImageSrc: user.avatarImageSrc ?? undefined,
    providers: Array.from(providerSet),
  };
}

function serializeForumAuthor(
  user: Pick<User, "id" | "name" | "role" | "university" | "avatarTone" | "avatarImageSrc">,
): ForumAuthor {
  return {
    id: user.id,
    name: user.name,
    role: mapUserRole(user.role),
    university: user.university,
    avatarTone: user.avatarTone,
    avatarImageSrc: user.avatarImageSrc ?? undefined,
  };
}

export function serializeForumReply(
  reply: ForumReply & {
    author: Pick<User, "id" | "name" | "role" | "university" | "avatarTone" | "avatarImageSrc">;
  },
): AppForumReply {
  return {
    id: reply.id,
    threadId: reply.threadId,
    body: reply.body,
    createdAt: reply.createdAt.toISOString(),
    updatedAt: reply.updatedAt.toISOString(),
    author: serializeForumAuthor(reply.author),
  };
}

export function serializeForumThread(
  thread: ForumThread & {
    author: Pick<User, "id" | "name" | "role" | "university" | "avatarTone" | "avatarImageSrc">;
    replies?: Array<
      ForumReply & {
        author: Pick<User, "id" | "name" | "role" | "university" | "avatarTone" | "avatarImageSrc">;
      }
    >;
    _count?: {
      replies: number;
    };
  },
): AppForumThread {
  return {
    id: thread.id,
    slug: thread.slug,
    title: thread.title,
    summary: thread.summary,
    body: thread.body,
    category: mapForumCategory(thread.category),
    status: mapForumStatus(thread.status),
    university: thread.university,
    preferredRoles: JSON.parse(thread.preferredRoles || "[]") as string[],
    contactNote: thread.contactNote,
    createdAt: thread.createdAt.toISOString(),
    updatedAt: thread.updatedAt.toISOString(),
    lastActivityAt: thread.lastActivityAt.toISOString(),
    replyCount: thread._count?.replies ?? thread.replies?.length ?? 0,
    author: serializeForumAuthor(thread.author),
    replies: thread.replies?.map(serializeForumReply),
  };
}

export function serializeTeam(team: TeamWithMembers): TeamProfile {
  return {
    id: team.id,
    name: team.name,
    tag: team.tag,
    leaderId: team.leaderId,
    memberIds: team.members.map((member) => member.userId),
    stage: mapStage(team.stage),
    round1LockStatus: mapTeamLockStatus(team.round1LockStatus),
    round1LockProtocolId: team.round1LockProtocolId ?? undefined,
    round1LockRequestedAt: team.round1LockRequestedAt?.toISOString(),
    round1LockedAt: team.round1LockedAt?.toISOString(),
    round1LockDeclinedAt: team.round1LockDeclinedAt?.toISOString(),
    round1LockDeclinedByUserId: team.round1LockDeclinedByUserId ?? undefined,
    avatarTone: team.avatarTone,
    avatarImageSrc: team.avatarImageSrc ?? undefined,
    track: team.track,
    bio: team.bio,
    createdAt: team.createdAt.toISOString(),
  };
}

export function serializeInvitation(invitation: TeamInvitation): AppTeamInvitation {
  return {
    id: invitation.id,
    teamId: invitation.teamId,
    fromUserId: invitation.fromUserId,
    toUserId: invitation.toUserId,
    createdAt: invitation.createdAt.toISOString(),
    status: mapInvitationStatus(invitation.status),
  };
}

export function serializeLeadershipTransferRequest(
  request: LeadershipTransferRequest,
): AppLeadershipTransferRequest {
  return {
    id: request.id,
    teamId: request.teamId,
    fromUserId: request.fromUserId,
    toUserId: request.toUserId,
    createdAt: request.createdAt.toISOString(),
    status: mapLeadershipStatus(request.status),
  };
}

export function serializeRound1LockRequest(
  request: Round1TeamLockRequest,
): AppRound1TeamLockRequest {
  return {
    id: request.id,
    protocolId: request.protocolId,
    teamId: request.teamId,
    fromUserId: request.fromUserId,
    toUserId: request.toUserId,
    createdAt: request.createdAt.toISOString(),
    respondedAt: request.respondedAt?.toISOString(),
    status: mapRound1LockRequestStatus(request.status),
  };
}

export function serializeRound1Submission(
  submission: Round1Submission,
): AppRound1Submission {
  return {
    id: submission.id,
    bankId: submission.bankId,
    teamId: submission.teamId,
    userId: submission.userId,
    submittedAt: submission.submittedAt.toISOString(),
    rightCount: submission.rightCount,
    wrongCount: submission.wrongCount,
    score: submission.score,
    objectiveScore: submission.objectiveScore,
    essayScore: submission.essayScore,
    totalScore: submission.totalScore,
    durationMinutes: submission.durationMinutes,
  };
}

export function serializeTeamSubmission(
  submission: TeamSubmission,
): AppTeamSubmission {
  return {
    id: submission.id,
    teamId: submission.teamId,
    round: submission.round === "ROUND_3" ? "round-3" : "round-2",
    version: submission.version,
    title: submission.title,
    summary: submission.summary,
    resourceSource: mapSubmissionSource(submission.resourceSource),
    resourceLabel: submission.resourceLabel,
    resourceUrl:
      submission.resourceSource === TeamSubmissionResourceSource.UPLOAD
        ? `/api/team-submissions/${submission.id}/file`
        : submission.resourceUrl ?? undefined,
    resourceStorageKey: submission.resourceStorageKey ?? undefined,
    resourceMimeType: submission.resourceMimeType ?? undefined,
    resourceSizeBytes: submission.resourceSizeBytes ?? undefined,
    submittedByUserId: submission.submittedByUserId,
    submittedAt: submission.submittedAt.toISOString(),
  };
}

export function serializeRound1TestBank(bank: Round1TestBank): AppRound1TestBank {
  const parsedQuestions = JSON.parse(bank.questions) as Array<
    Omit<Round1Question, "difficulty" | "type"> & {
      difficulty: Round1QuestionDifficulty;
      type: Round1QuestionType;
    }
  >;

  return {
    id: bank.id,
    bankType: mapBankType(bank.bankType),
    title: {
      en: bank.titleEn,
      vi: bank.titleVi,
    },
    description: {
      en: bank.descriptionEn,
      vi: bank.descriptionVi,
    },
    status: bank.status.toLowerCase() as AppRound1TestBank["status"],
    questionPoolSize: bank.questionPoolSize,
    questionsPerAttempt: bank.questionsPerAttempt,
    shuffleQuestions: bank.shuffleQuestions,
    shuffleOptions: bank.shuffleOptions,
    durationMinutes: bank.durationMinutes,
    wordLimit: bank.wordLimit ?? undefined,
    publishedAt: bank.publishedAt?.toISOString() ?? bank.createdAt.toISOString(),
    questions: parsedQuestions.map((question) => ({
      ...question,
      difficulty: mapQuestionDifficulty(question.difficulty),
      type: mapQuestionType(question.type),
    })),
  };
}

export function serializeNewsPost(post: PrismaNewsPost): AppNewsPost {
  return {
    slug: post.slug,
    category: {
      en: post.categoryEn,
      vi: post.categoryVi,
    },
    title: {
      en: post.titleEn,
      vi: post.titleVi,
    },
    excerpt: {
      en: post.excerptEn,
      vi: post.excerptVi,
    },
    author: post.author,
    publishedAt: post.publishedAt.toISOString().slice(0, 10),
    readTime: post.readTime,
    coverLabel: {
      en: post.coverLabelEn,
      vi: post.coverLabelVi,
    },
    coverImageSrc: post.coverImageSrc,
    coverImageAlt: {
      en: post.coverImageAltEn,
      vi: post.coverImageAltVi,
    },
    highlights: JSON.parse(post.highlights) as AppNewsPost["highlights"],
    content: JSON.parse(post.content) as AppNewsPost["content"],
    tags: JSON.parse(post.tags) as AppNewsPost["tags"],
  };
}
