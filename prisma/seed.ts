import {
  CompetitionStage,
  LeadershipTransferStatus,
  PrismaClient,
  Round1BankStatus,
  Round1QuestionDifficulty,
  Round1QuestionType,
  Round1TeamLockRequestStatus,
  Round1TestBankType,
  ForumThreadCategory,
  SubmissionRound,
  TeamInvitationStatus,
  TeamRound1LockStatus,
  TeamSubmissionResourceSource,
  UserRole,
} from "@prisma/client";
import { hash } from "bcryptjs";

import {
  DEMO_ADMIN_LOGIN_ID,
  DEMO_ADMIN_PASSWORD,
  defaultPageContent,
  judgeProfiles,
  mockInvitations,
  mockLeadershipTransferRequests,
  mockRound1TeamLockRequests,
  mockSubmissions,
  mockTeams,
  mockUsers,
  newsPosts,
  round1IndividualSubmissions,
  round1TestBanks,
} from "@/data/site-content";

const prisma = new PrismaClient();

const DEFAULT_STUDENT_PASSWORD = "Student@2026";
const DEFAULT_MODERATOR_PASSWORD = "Moderator@2026";

const forumSeedThreads = [
  {
    slug: "looking-for-product-and-data-partner",
    authorId: "u6",
    title: "Looking for a product or data teammate for Round 1 preparation",
    summary:
      "I already have a finance-heavy base and want one teammate who thinks clearly about product flow or data storytelling.",
    body:
      "I am from UEL and currently preparing for the team-lock stage. I am most comfortable with finance logic and presentation structure, so I am looking for someone who can strengthen the product or analytics side. If you are serious about joining and can commit to the first round timeline, reply here.",
    category: ForumThreadCategory.LOOKING_FOR_TEAM,
    university: "University of Economics and Law",
    preferredRoles: ["Product", "Data analysis", "Presentation"],
    contactNote: "Reply in-thread first. I usually check messages after 19:00.",
    createdAt: "2026-03-20T09:00:00+07:00",
    lastActivityAt: "2026-03-21T10:15:00+07:00",
  },
  {
    slug: "neo-ledger-needs-one-more-frontend-member",
    authorId: "u1",
    title: "Neo Ledger needs one more frontend-minded member",
    summary:
      "Our team already covers finance and PM work. We want one more member who can help with interface thinking and deck polish.",
    body:
      "We are aiming for a polished entry and need someone who can think visually, wire ideas quickly, and help the team communicate clearly in later rounds. Prior competition experience is welcome but not required. What matters most is reliability and willingness to work closely with the team.",
    category: ForumThreadCategory.TEAM_LOOKING_FOR_MEMBERS,
    university: "University of Economics and Law",
    preferredRoles: ["Frontend", "UI/UX", "Pitch deck"],
    contactNote: "Tell us your availability and your strongest skill in the reply.",
    createdAt: "2026-03-18T14:30:00+07:00",
    lastActivityAt: "2026-03-22T08:45:00+07:00",
  },
  {
    slug: "how-are-people-balancing-finance-and-product-roles",
    authorId: "u4",
    title: "How are people balancing finance and product roles in one student team?",
    summary:
      "Curious how teams divide ownership when nobody wants to be stuck in only one narrow function.",
    body:
      "I think many student teams struggle because everyone wants to help with everything, which sounds good but often slows the team down. If your team has found a workable structure between finance, product, data, and presentation, share how you split the work.",
    category: ForumThreadCategory.GENERAL_DISCUSSION,
    university: "UEH University",
    preferredRoles: ["Operations", "Team process"],
    contactNote: "",
    createdAt: "2026-03-16T11:10:00+07:00",
    lastActivityAt: "2026-03-19T16:00:00+07:00",
  },
] as const;

const forumSeedReplies = [
  {
    threadSlug: "looking-for-product-and-data-partner",
    authorId: "u5",
    body:
      "I can help on the product side and I am comfortable turning technical ideas into simpler user flows. I am from FTU HCMC and can join evening calls during weekdays.",
    createdAt: "2026-03-20T20:10:00+07:00",
  },
  {
    threadSlug: "neo-ledger-needs-one-more-frontend-member",
    authorId: "u3",
    body:
      "I am strongest in visual structure and presentation polish, but I can also support the team with early UI mocks if needed. Weekend collaboration is easiest for me.",
    createdAt: "2026-03-21T09:20:00+07:00",
  },
  {
    threadSlug: "neo-ledger-needs-one-more-frontend-member",
    authorId: "u2",
    body:
      "Not applying directly, but one suggestion: ask candidates how they explain product logic, not only whether they can design slides. It helps later in the final defense.",
    createdAt: "2026-03-22T08:45:00+07:00",
  },
  {
    threadSlug: "how-are-people-balancing-finance-and-product-roles",
    authorId: "u7",
    body:
      "Our best split last year was one person on finance logic, one on product framing, one on deck/storyline, and everyone reviewing the final narrative together.",
    createdAt: "2026-03-19T16:00:00+07:00",
  },
] as const;

function parseDate(value?: string | null) {
  if (!value) {
    return null;
  }

  if (value.includes("T")) {
    return new Date(value);
  }

  return new Date(`${value}T00:00:00+07:00`);
}

function mapUserRole(role: (typeof mockUsers)[number]["role"]) {
  switch (role) {
    case "admin":
      return UserRole.ADMIN;
    case "moderator":
      return UserRole.MODERATOR;
    case "student":
    default:
      return UserRole.STUDENT;
  }
}

function mapStage(stage: (typeof mockTeams)[number]["stage"]) {
  switch (stage) {
    case "round-2":
      return CompetitionStage.ROUND_2;
    case "round-3":
      return CompetitionStage.ROUND_3;
    case "round-1":
    default:
      return CompetitionStage.ROUND_1;
  }
}

function mapLockStatus(status: (typeof mockTeams)[number]["round1LockStatus"]) {
  switch (status) {
    case "pending":
      return TeamRound1LockStatus.PENDING;
    case "locked":
      return TeamRound1LockStatus.LOCKED;
    case "declined":
      return TeamRound1LockStatus.DECLINED;
    case "open":
    default:
      return TeamRound1LockStatus.OPEN;
  }
}

function mapInvitationStatus(status: (typeof mockInvitations)[number]["status"]) {
  switch (status) {
    case "accepted":
      return TeamInvitationStatus.ACCEPTED;
    case "declined":
      return TeamInvitationStatus.DECLINED;
    case "expired":
      return TeamInvitationStatus.EXPIRED;
    case "pending":
    default:
      return TeamInvitationStatus.PENDING;
  }
}

function mapLeadershipStatus(status: (typeof mockLeadershipTransferRequests)[number]["status"]) {
  switch (status) {
    case "accepted":
      return LeadershipTransferStatus.ACCEPTED;
    case "declined":
      return LeadershipTransferStatus.DECLINED;
    case "cancelled":
      return LeadershipTransferStatus.CANCELLED;
    case "pending":
    default:
      return LeadershipTransferStatus.PENDING;
  }
}

function mapRound1LockRequestStatus(status: (typeof mockRound1TeamLockRequests)[number]["status"]) {
  switch (status) {
    case "accepted":
      return Round1TeamLockRequestStatus.ACCEPTED;
    case "declined":
      return Round1TeamLockRequestStatus.DECLINED;
    case "cancelled":
      return Round1TeamLockRequestStatus.CANCELLED;
    case "pending":
    default:
      return Round1TeamLockRequestStatus.PENDING;
  }
}

function mapBankType(type: (typeof round1TestBanks)[number]["bankType"]) {
  return type === "essay" ? Round1TestBankType.ESSAY : Round1TestBankType.OBJECTIVE;
}

function mapBankStatus(status: (typeof round1TestBanks)[number]["status"]) {
  switch (status) {
    case "active":
      return Round1BankStatus.ACTIVE;
    case "archived":
      return Round1BankStatus.ARCHIVED;
    case "draft":
    default:
      return Round1BankStatus.DRAFT;
  }
}

function mapQuestionDifficulty(difficulty: "easy" | "medium" | "hard") {
  switch (difficulty) {
    case "medium":
      return Round1QuestionDifficulty.MEDIUM;
    case "hard":
      return Round1QuestionDifficulty.HARD;
    case "easy":
    default:
      return Round1QuestionDifficulty.EASY;
  }
}

function mapQuestionType(type: "true-false" | "single-choice" | "multiple-choice" | "pairing" | "essay") {
  switch (type) {
    case "true-false":
      return Round1QuestionType.TRUE_FALSE;
    case "multiple-choice":
      return Round1QuestionType.MULTIPLE_CHOICE;
    case "pairing":
      return Round1QuestionType.PAIRING;
    case "essay":
      return Round1QuestionType.ESSAY;
    case "single-choice":
    default:
      return Round1QuestionType.SINGLE_CHOICE;
  }
}

function mapSubmissionRound(round: (typeof mockSubmissions)[number]["round"]) {
  return round === "round-3" ? SubmissionRound.ROUND_3 : SubmissionRound.ROUND_2;
}

function mapSubmissionSource(source: (typeof mockSubmissions)[number]["resourceSource"]) {
  return source === "upload"
    ? TeamSubmissionResourceSource.UPLOAD
    : TeamSubmissionResourceSource.EXTERNAL;
}

async function main() {
  await prisma.account.deleteMany();
  await prisma.session.deleteMany();
  await prisma.verificationToken.deleteMany();
  await prisma.userActionToken.deleteMany();
  await prisma.forumReply.deleteMany();
  await prisma.forumThread.deleteMany();
  await prisma.round1Submission.deleteMany();
  await prisma.round1TestBank.deleteMany();
  await prisma.round1TeamLockRequest.deleteMany();
  await prisma.leadershipTransferRequest.deleteMany();
  await prisma.teamInvitation.deleteMany();
  await prisma.teamSubmission.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.team.deleteMany();
  await prisma.newsPost.deleteMany();
  await prisma.cmsEntry.deleteMany();
  await prisma.user.deleteMany();

  const adminPasswordHash = await hash(DEMO_ADMIN_PASSWORD, 12);
  const studentPasswordHash = await hash(DEFAULT_STUDENT_PASSWORD, 12);
  const moderatorPasswordHash = await hash(DEFAULT_MODERATOR_PASSWORD, 12);

  for (const user of mockUsers) {
    const loginId =
      user.id === "admin"
        ? DEMO_ADMIN_LOGIN_ID
        : (user.studentId || user.id).toLowerCase();

    await prisma.user.create({
      data: {
        id: user.id,
        loginId,
        email: user.email.toLowerCase(),
        emailVerifiedAt: new Date(),
        passwordHash:
          user.role === "admin"
            ? adminPasswordHash
            : user.role === "moderator"
              ? moderatorPasswordHash
              : studentPasswordHash,
        name: user.name,
        role: mapUserRole(user.role),
        studentId: user.role === "student" ? user.studentId.toLowerCase() : user.studentId,
        phoneNumber: user.phoneNumber || null,
        university: user.university,
        major: user.major,
        classYear: user.classYear,
        bio: user.bio,
        avatarTone: user.avatarTone,
        avatarImageSrc: user.avatarImageSrc,
      },
    });
  }

  for (const team of mockTeams) {
    await prisma.team.create({
      data: {
        id: team.id,
        name: team.name,
        tag: team.tag,
        leaderId: team.leaderId,
        stage: mapStage(team.stage),
        round1LockStatus: mapLockStatus(team.round1LockStatus),
        round1LockProtocolId: team.round1LockProtocolId,
        round1LockRequestedAt: parseDate(team.round1LockRequestedAt),
        round1LockedAt: parseDate(team.round1LockedAt),
        round1LockDeclinedAt: parseDate(team.round1LockDeclinedAt),
        round1LockDeclinedByUserId: team.round1LockDeclinedByUserId,
        avatarTone: team.avatarTone,
        avatarImageSrc: team.avatarImageSrc,
        track: team.track,
        bio: team.bio,
        createdAt: parseDate(team.createdAt) ?? new Date(),
      },
    });

    for (const memberId of team.memberIds) {
      await prisma.teamMember.create({
        data: {
          teamId: team.id,
          userId: memberId,
          joinedAt: parseDate(team.createdAt) ?? new Date(),
        },
      });
    }
  }

  for (const invitation of mockInvitations) {
    await prisma.teamInvitation.create({
      data: {
        id: invitation.id,
        teamId: invitation.teamId,
        fromUserId: invitation.fromUserId,
        toUserId: invitation.toUserId,
        status: mapInvitationStatus(invitation.status),
        createdAt: parseDate(invitation.createdAt) ?? new Date(),
      },
    });
  }

  for (const request of mockLeadershipTransferRequests) {
    await prisma.leadershipTransferRequest.create({
      data: {
        id: request.id,
        teamId: request.teamId,
        fromUserId: request.fromUserId,
        toUserId: request.toUserId,
        status: mapLeadershipStatus(request.status),
        createdAt: parseDate(request.createdAt) ?? new Date(),
      },
    });
  }

  for (const request of mockRound1TeamLockRequests) {
    await prisma.round1TeamLockRequest.create({
      data: {
        id: request.id,
        protocolId: request.protocolId,
        teamId: request.teamId,
        fromUserId: request.fromUserId,
        toUserId: request.toUserId,
        status: mapRound1LockRequestStatus(request.status),
        createdAt: parseDate(request.createdAt) ?? new Date(),
        respondedAt: parseDate(request.respondedAt),
      },
    });
  }

  for (const bank of round1TestBanks) {
    await prisma.round1TestBank.create({
      data: {
        id: bank.id,
        slug: bank.id,
        bankType: mapBankType(bank.bankType),
        status: mapBankStatus(bank.status),
        titleEn: bank.title.en,
        titleVi: bank.title.vi,
        descriptionEn: bank.description.en,
        descriptionVi: bank.description.vi,
        questionPoolSize: bank.questionPoolSize,
        questionsPerAttempt: bank.questionsPerAttempt,
        shuffleQuestions: bank.shuffleQuestions,
        shuffleOptions: bank.shuffleOptions,
        durationMinutes: bank.durationMinutes,
        wordLimit: bank.wordLimit,
        publishedAt: parseDate(bank.publishedAt),
        questions: JSON.stringify(
          bank.questions.map((question) => ({
            ...question,
            difficulty: mapQuestionDifficulty(question.difficulty),
            type: mapQuestionType(question.type),
          })),
        ),
      },
    });
  }

  for (const submission of round1IndividualSubmissions) {
    await prisma.round1Submission.create({
      data: {
        id: submission.id,
        bankId: submission.bankId,
        teamId: submission.teamId,
        userId: submission.userId,
        submittedAt: parseDate(submission.submittedAt) ?? new Date(),
        rightCount: submission.rightCount,
        wrongCount: submission.wrongCount,
        score: submission.score,
        objectiveScore: submission.objectiveScore,
        essayScore: submission.essayScore,
        totalScore: submission.totalScore,
        durationMinutes: submission.durationMinutes,
        answers: null,
      },
    });
  }

  for (const submission of mockSubmissions) {
    await prisma.teamSubmission.create({
      data: {
        id: submission.id,
        teamId: submission.teamId,
        round: mapSubmissionRound(submission.round),
        version: submission.version,
        title: submission.title,
        summary: submission.summary,
        resourceSource: mapSubmissionSource(submission.resourceSource),
        resourceLabel: submission.resourceLabel,
        resourceUrl: submission.resourceUrl,
        resourceStorageKey: submission.resourceStorageKey,
        resourceMimeType: submission.resourceMimeType,
        resourceSizeBytes: submission.resourceSizeBytes,
        submittedByUserId: submission.submittedByUserId,
        submittedAt: parseDate(submission.submittedAt) ?? new Date(),
      },
    });
  }

  for (const post of newsPosts) {
    await prisma.newsPost.create({
      data: {
        slug: post.slug,
        categoryEn: post.category.en,
        categoryVi: post.category.vi,
        titleEn: post.title.en,
        titleVi: post.title.vi,
        excerptEn: post.excerpt.en,
        excerptVi: post.excerpt.vi,
        author: post.author,
        publishedAt: parseDate(post.publishedAt) ?? new Date(),
        readTime: post.readTime,
        coverLabelEn: post.coverLabel.en,
        coverLabelVi: post.coverLabel.vi,
        coverImageSrc: post.coverImageSrc,
        coverImageAltEn: post.coverImageAlt.en,
        coverImageAltVi: post.coverImageAlt.vi,
        highlights: JSON.stringify(post.highlights),
        content: JSON.stringify(post.content),
        tags: JSON.stringify(post.tags),
      },
    });
  }

  for (const thread of forumSeedThreads) {
    await prisma.forumThread.create({
      data: {
        slug: thread.slug,
        authorId: thread.authorId,
        title: thread.title,
        summary: thread.summary,
        body: thread.body,
        category: thread.category,
        university: thread.university,
        preferredRoles: JSON.stringify(thread.preferredRoles),
        contactNote: thread.contactNote,
        createdAt: parseDate(thread.createdAt) ?? new Date(),
        lastActivityAt: parseDate(thread.lastActivityAt) ?? new Date(),
      },
    });
  }

  for (const reply of forumSeedReplies) {
    const thread = await prisma.forumThread.findUnique({
      where: { slug: reply.threadSlug },
      select: { id: true },
    });

    if (!thread) {
      continue;
    }

    await prisma.forumReply.create({
      data: {
        threadId: thread.id,
        authorId: reply.authorId,
        body: reply.body,
        createdAt: parseDate(reply.createdAt) ?? new Date(),
      },
    });
  }

  await prisma.cmsEntry.create({
    data: {
      scope: "site-page-content",
      payload: JSON.stringify(defaultPageContent),
    },
  });

  await prisma.cmsEntry.create({
    data: {
      scope: "site-judges",
      payload: JSON.stringify(judgeProfiles),
    },
  });

  console.log("Seeded backend data.");
  console.log(`Admin login: ${DEMO_ADMIN_LOGIN_ID} / ${DEMO_ADMIN_PASSWORD}`);
  console.log(`Student demo password: ${DEFAULT_STUDENT_PASSWORD}`);
  console.log(`Moderator demo password: ${DEFAULT_MODERATOR_PASSWORD}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
