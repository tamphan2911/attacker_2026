import {
  CompetitionStage,
  Round1QuestionDifficulty,
  Round1QuestionType,
  TeamFinalOutcome,
  TeamRound1LockStatus,
  UserRole,
} from "@prisma/client";
import { hash } from "bcryptjs";

import { DEMO_ADMIN_LOGIN_ID, defaultPageContent, judgeProfiles } from "@/data/site-content";
import { prisma } from "@/lib/db";
import { deleteJudgeImageFile, getJudgeImageStorageKeyFromUrl } from "@/server/judge-image-storage";
import { deleteNewsImageFile, getNewsImageStorageKeyFromUrl } from "@/server/news-image-storage";
import type {
  JudgeProfile,
  NewsPost,
  Round1Question,
  SitePageContent,
  TeamProfile,
  UserProfile,
} from "@/types/site";

import type { ServiceResult } from "@/server/team-service";

type ServiceSuccess<T> = {
  ok: true;
  status: number;
  data: T;
};

type ServiceFailure = {
  ok: false;
  status: number;
  error: string;
};

function ok<T>(data: T, status = 200): ServiceSuccess<T> {
  return { ok: true, status, data };
}

function fail(status: number, error: string): ServiceFailure {
  return { ok: false, status, error };
}

function mapUserRole(role: UserProfile["role"]) {
  switch (role) {
    case "admin":
      return UserRole.ADMIN;
    case "moderator":
      return UserRole.MODERATOR;
    case "judge":
      return UserRole.JUDGE;
    case "student":
    default:
      return UserRole.STUDENT;
  }
}

function mapStage(stage: TeamProfile["stage"]) {
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

function mapTeamFinalOutcome(outcome?: TeamProfile["finalOutcome"]) {
  switch (outcome) {
    case "champion":
      return TeamFinalOutcome.CHAMPION;
    case "runner-up":
      return TeamFinalOutcome.RUNNER_UP;
    case "third-place":
      return TeamFinalOutcome.THIRD_PLACE;
    case "fourth-place":
      return TeamFinalOutcome.FOURTH_PLACE;
    case "emerging-team":
      return TeamFinalOutcome.EMERGING_TEAM;
    default:
      return null;
  }
}

function normalizeOrganizerLoginId(value: string) {
  return value.trim().toLowerCase();
}

function buildOrganizerEmail(loginId: string) {
  return `organizer+${loginId}@internal.attacker.local`;
}

export function buildJudgeEmail(loginId: string) {
  return `judge+${loginId}@internal.attacker.local`;
}

export async function savePageContentByAdmin(
  payload: SitePageContent,
): Promise<ServiceResult<{ saved: true }>> {
  await prisma.cmsEntry.upsert({
    where: { scope: "site-page-content" },
    update: { payload: JSON.stringify(payload) },
    create: {
      scope: "site-page-content",
      payload: JSON.stringify(payload),
    },
  });

  return ok({ saved: true });
}

const JUDGES_SCOPE = "site-judges";

export function getDefaultJudges() {
  return judgeProfiles;
}

export async function readStoredJudges() {
  const cmsEntry = await prisma.cmsEntry.findUnique({
    where: { scope: JUDGES_SCOPE },
    select: { payload: true },
  });

  return cmsEntry ? (JSON.parse(cmsEntry.payload) as JudgeProfile[]) : getDefaultJudges();
}

async function saveJudges(judges: JudgeProfile[]) {
  await prisma.cmsEntry.upsert({
    where: { scope: JUDGES_SCOPE },
    update: { payload: JSON.stringify(judges) },
    create: {
      scope: JUDGES_SCOPE,
      payload: JSON.stringify(judges),
    },
  });
}

export async function createJudgeByAdmin(
  payload: JudgeProfile,
): Promise<ServiceResult<{ judgeId: string }>> {
  const judges = await readStoredJudges();
  const judgeId = payload.id.trim();

  if (!judgeId) {
    return fail(400, "Judge ID is required.");
  }

  if (judges.some((judge) => judge.id === judgeId)) {
    return fail(409, "That judge ID already exists.");
  }

  await saveJudges([...judges, payload]);
  return ok({ judgeId }, 201);
}

export async function updateJudgeByAdmin(
  judgeId: string,
  payload: JudgeProfile,
): Promise<ServiceResult<{ judgeId: string }>> {
  const judges = await readStoredJudges();
  const existingJudge = judges.find((judge) => judge.id === judgeId);

  if (!existingJudge) {
    return fail(404, "Judge not found.");
  }

  const nextJudgeId = payload.id.trim();
  if (!nextJudgeId) {
    return fail(400, "Judge ID is required.");
  }

  if (judges.some((judge) => judge.id === nextJudgeId && judge.id !== judgeId)) {
    return fail(409, "That judge ID already exists.");
  }

  await saveJudges(
    judges.map((judge) => (judge.id === judgeId ? payload : judge)),
  );

  if (judgeId !== nextJudgeId) {
    const nextLoginId = nextJudgeId.trim().toLowerCase();
    await prisma.user.updateMany({
      where: { judgeProfileId: judgeId, role: UserRole.JUDGE },
      data: {
        judgeProfileId: nextJudgeId,
        loginId: nextLoginId,
        email: buildJudgeEmail(nextLoginId),
        name: payload.name,
        university: payload.organization,
        major: payload.role.en || payload.role.vi,
        avatarTone: payload.avatarTone,
        avatarImageSrc: payload.imageSrc || null,
      },
    });
  } else {
    await prisma.user.updateMany({
      where: { judgeProfileId: judgeId, role: UserRole.JUDGE },
      data: {
        name: payload.name,
        university: payload.organization,
        major: payload.role.en || payload.role.vi,
        avatarTone: payload.avatarTone,
        avatarImageSrc: payload.imageSrc || null,
      },
    });
  }

  if (existingJudge.imageSrc !== payload.imageSrc) {
    const previousStorageKey = getJudgeImageStorageKeyFromUrl(existingJudge.imageSrc);
    if (previousStorageKey) {
      await deleteJudgeImageFile(previousStorageKey).catch(() => {});
    }
  }

  return ok({ judgeId: nextJudgeId });
}

export async function deleteJudgeByAdmin(
  judgeId: string,
): Promise<ServiceResult<{ judgeId: string }>> {
  const judges = await readStoredJudges();
  const existingJudge = judges.find((judge) => judge.id === judgeId);

  if (!existingJudge) {
    return fail(404, "Judge not found.");
  }

  await saveJudges(judges.filter((judge) => judge.id !== judgeId));
  await prisma.user.deleteMany({
    where: {
      judgeProfileId: judgeId,
      role: UserRole.JUDGE,
    },
  });
  const storageKey = getJudgeImageStorageKeyFromUrl(existingJudge.imageSrc);
  if (storageKey) {
    await deleteJudgeImageFile(storageKey).catch(() => {});
  }
  return ok({ judgeId });
}

export async function createNewsPostByAdmin(
  payload: NewsPost,
): Promise<ServiceResult<{ slug: string }>> {
  const existing = await prisma.newsPost.findUnique({
    where: { slug: payload.slug },
    select: { slug: true },
  });

  if (existing) {
    return fail(409, "That article slug already exists.");
  }

  await prisma.newsPost.create({
    data: {
      slug: payload.slug,
      categoryEn: payload.category.en,
      categoryVi: payload.category.vi,
      titleEn: payload.title.en,
      titleVi: payload.title.vi,
      excerptEn: payload.excerpt.en,
      excerptVi: payload.excerpt.vi,
      author: payload.author,
      publishedAt: new Date(`${payload.publishedAt}T00:00:00+07:00`),
      readTime: payload.readTime,
      coverLabelEn: payload.coverLabel.en,
      coverLabelVi: payload.coverLabel.vi,
      coverImageSrc: payload.coverImageSrc,
      coverImageAltEn: payload.coverImageAlt.en,
      coverImageAltVi: payload.coverImageAlt.vi,
      highlights: JSON.stringify(payload.highlights),
      content: JSON.stringify(payload.content),
      tags: JSON.stringify(payload.tags),
    },
  });

  return ok({ slug: payload.slug }, 201);
}

export async function updateNewsPostByAdmin(
  slug: string,
  payload: NewsPost,
): Promise<ServiceResult<{ slug: string }>> {
  const existing = await prisma.newsPost.findUnique({
    where: { slug },
    select: { slug: true, coverImageSrc: true },
  });

  if (!existing) {
    return fail(404, "Article not found.");
  }

  const duplicate = await prisma.newsPost.findFirst({
    where: {
      slug: payload.slug,
      NOT: { slug },
    },
    select: { slug: true },
  });

  if (duplicate) {
    return fail(409, "That article slug already exists.");
  }

  await prisma.newsPost.update({
    where: { slug },
    data: {
      slug: payload.slug,
      categoryEn: payload.category.en,
      categoryVi: payload.category.vi,
      titleEn: payload.title.en,
      titleVi: payload.title.vi,
      excerptEn: payload.excerpt.en,
      excerptVi: payload.excerpt.vi,
      author: payload.author,
      publishedAt: new Date(`${payload.publishedAt}T00:00:00+07:00`),
      readTime: payload.readTime,
      coverLabelEn: payload.coverLabel.en,
      coverLabelVi: payload.coverLabel.vi,
      coverImageSrc: payload.coverImageSrc,
      coverImageAltEn: payload.coverImageAlt.en,
      coverImageAltVi: payload.coverImageAlt.vi,
      highlights: JSON.stringify(payload.highlights),
      content: JSON.stringify(payload.content),
      tags: JSON.stringify(payload.tags),
    },
  });

  if (existing.coverImageSrc !== payload.coverImageSrc) {
    const previousStorageKey = getNewsImageStorageKeyFromUrl(existing.coverImageSrc);
    if (previousStorageKey) {
      await deleteNewsImageFile(previousStorageKey).catch(() => {});
    }
  }

  return ok({ slug: payload.slug });
}

export async function deleteNewsPostByAdmin(slug: string): Promise<ServiceResult<{ slug: string }>> {
  const existing = await prisma.newsPost.findUnique({
    where: { slug },
    select: { slug: true, coverImageSrc: true },
  });

  if (!existing) {
    return fail(404, "Article not found.");
  }

  await prisma.newsPost.delete({ where: { slug } });

  const storageKey = getNewsImageStorageKeyFromUrl(existing.coverImageSrc);
  if (storageKey) {
    await deleteNewsImageFile(storageKey).catch(() => {});
  }

  return ok({ slug });
}

export async function updateUserByAdmin(
  actorRole: UserRole,
  userId: string,
  payload: Partial<UserProfile>,
): Promise<ServiceResult<{ userId: string }>> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, studentId: true, loginId: true },
  });

  if (!user) {
    return fail(404, "User not found.");
  }

  if (user.loginId === DEMO_ADMIN_LOGIN_ID) {
    return fail(403, "The fixed admin account cannot be edited.");
  }

  if (user.role !== UserRole.STUDENT) {
    if (actorRole !== UserRole.ADMIN) {
      return fail(403, "Only admin can manage organizer accounts.");
    }

    return fail(403, "Organizer accounts are managed from Organizer team.");
  }

  if (payload.role && payload.role !== "student") {
    return fail(403, "Participant records cannot change to organizer roles from this screen.");
  }

  const nextEmail = payload.email?.trim().toLowerCase();
  const nextStudentId = payload.studentId?.trim().toLowerCase();
  const nextPhoneNumber = payload.phoneNumber?.trim();

  if (nextEmail || nextStudentId) {
    const duplicate = await prisma.user.findFirst({
      where: {
        id: { not: userId },
        OR: [
          ...(nextEmail ? [{ email: nextEmail }] : []),
          ...(nextStudentId ? [{ studentId: nextStudentId }, { loginId: nextStudentId }] : []),
        ],
      },
      select: { id: true },
    });

    if (duplicate) {
      return fail(409, "Another account already uses that email or student ID.");
    }
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      name: payload.name?.trim(),
      email: nextEmail,
      role: payload.role ? mapUserRole(payload.role) : undefined,
      studentId: nextStudentId === undefined ? undefined : nextStudentId || null,
      loginId: nextStudentId || undefined,
      phoneNumber: nextPhoneNumber === undefined ? undefined : nextPhoneNumber || null,
      university: payload.university?.trim(),
      major: payload.major?.trim(),
      classYear: payload.classYear?.trim(),
      bio: payload.bio?.trim(),
      avatarTone: payload.avatarTone?.trim(),
      avatarImageSrc:
        payload.avatarImageSrc === undefined ? undefined : payload.avatarImageSrc || null,
    },
  });

  return ok({ userId });
}

export async function deleteUserByAdmin(
  actorRole: UserRole,
  userId: string,
): Promise<ServiceResult<{ userId: string }>> {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, loginId: true },
    });

    if (!user) {
      return fail(404, "User not found.");
    }

    if (user.loginId === DEMO_ADMIN_LOGIN_ID) {
      return fail(403, "The fixed admin account cannot be deleted.");
    }

    if (user.role !== UserRole.STUDENT) {
      if (actorRole !== UserRole.ADMIN) {
        return fail(403, "Only admin can manage organizer accounts.");
      }

      return fail(403, "Organizer accounts are managed from Organizer team.");
    }

    const membership = await tx.teamMember.findUnique({
      where: { userId },
      include: { team: true },
    });

    if (membership?.team.leaderId === userId) {
      await tx.team.delete({
        where: { id: membership.teamId },
      });
    } else if (membership) {
      await tx.teamMember.delete({
        where: { id: membership.id },
      });

      await tx.leadershipTransferRequest.updateMany({
        where: {
          OR: [{ fromUserId: userId }, { toUserId: userId }],
        },
        data: {
          status: "CANCELLED",
          respondedAt: new Date(),
        },
      });
    }

    await tx.user.delete({
      where: { id: userId },
    });

    return ok({ userId });
  });
}

export async function createOrganizerAccountByAdmin(payload: {
  loginId: string;
  name: string;
  password: string;
  role: "admin" | "moderator";
  avatarImageSrc?: string;
}): Promise<ServiceResult<{ userId: string }>> {
  const loginId = normalizeOrganizerLoginId(payload.loginId);
  const name = payload.name.trim();
  const password = payload.password.trim();
  const role = payload.role === "admin" ? UserRole.ADMIN : UserRole.MODERATOR;

  if (!loginId || !name || !password) {
    return fail(400, "Login ID, full name, role, and password are required.");
  }

  const generatedEmail = buildOrganizerEmail(loginId);
  const duplicate = await prisma.user.findFirst({
    where: {
      OR: [{ loginId }, { email: generatedEmail }, { studentId: loginId }],
    },
    select: { id: true },
  });

  if (duplicate) {
    return fail(409, "Another account already uses that login ID.");
  }

  const passwordHash = await hash(password, 12);
  const created = await prisma.user.create({
    data: {
      loginId,
      email: generatedEmail,
      emailVerifiedAt: new Date(),
      passwordHash,
      name,
      role,
      studentId: null,
      phoneNumber: null,
      university: "",
      major: "",
      classYear: "",
      bio: "",
      avatarTone: "from-emerald-500 via-cyan-400 to-blue-400",
      avatarImageSrc: payload.avatarImageSrc?.trim() || null,
    },
    select: { id: true },
  });

  return ok({ userId: created.id }, 201);
}

export async function updateOrganizerAccountByAdmin(
  userId: string,
  payload: {
    loginId: string;
    name: string;
    password?: string;
    avatarImageSrc?: string | null;
  },
): Promise<ServiceResult<{ userId: string }>> {
  const existing = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, loginId: true },
  });

  if (!existing) {
    return fail(404, "Organizer account not found.");
  }

  if (existing.role !== UserRole.MODERATOR && existing.role !== UserRole.ADMIN) {
    return fail(403, "Only organizer accounts can be edited here.");
  }

  if (existing.loginId === DEMO_ADMIN_LOGIN_ID) {
    return fail(403, "The fixed admin account cannot be edited here.");
  }

  const loginId = normalizeOrganizerLoginId(payload.loginId);
  const name = payload.name.trim();

  if (!loginId || !name) {
    return fail(400, "Login ID and full name are required.");
  }

  const generatedEmail = buildOrganizerEmail(loginId);
  const duplicate = await prisma.user.findFirst({
    where: {
      id: { not: userId },
      OR: [{ loginId }, { email: generatedEmail }, { studentId: loginId }],
    },
    select: { id: true },
  });

  if (duplicate) {
    return fail(409, "Another account already uses that login ID.");
  }

  const nextPassword = payload.password?.trim();
  await prisma.user.update({
    where: { id: userId },
    data: {
      loginId,
      email: generatedEmail,
      name,
      passwordHash: nextPassword ? await hash(nextPassword, 12) : undefined,
      avatarImageSrc:
        payload.avatarImageSrc === undefined ? undefined : payload.avatarImageSrc || null,
    },
  });

  return ok({ userId });
}

export async function deleteOrganizerAccountByAdmin(
  userId: string,
): Promise<ServiceResult<{ userId: string }>> {
  const existing = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, loginId: true },
  });

  if (!existing) {
    return fail(404, "Organizer account not found.");
  }

  if (existing.role !== UserRole.MODERATOR && existing.role !== UserRole.ADMIN) {
    return fail(403, "Only organizer accounts can be deleted here.");
  }

  if (existing.loginId === DEMO_ADMIN_LOGIN_ID) {
    return fail(403, "The fixed admin account cannot be deleted.");
  }

  if (existing.role === UserRole.ADMIN) {
    const adminCount = await prisma.user.count({
      where: { role: UserRole.ADMIN },
    });

    if (adminCount <= 1) {
      return fail(409, "At least one admin account must remain on the system.");
    }
  }

  await prisma.user.delete({
    where: { id: userId },
  });

  return ok({ userId });
}

export async function updateTeamByAdmin(
  teamId: string,
  payload: Partial<Pick<TeamProfile, "name" | "tag" | "avatarTone" | "avatarImageSrc" | "track" | "bio" | "leaderId" | "stage" | "finalOutcome">>,
): Promise<ServiceResult<{ teamId: string }>> {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      members: {
        select: { userId: true },
      },
    },
  });

  if (!team) {
    return fail(404, "Team not found.");
  }

  if (payload.leaderId && !team.members.some((member) => member.userId === payload.leaderId)) {
    return fail(400, "The selected leader must already be a member of the team.");
  }

  const nextTag = payload.tag?.trim().toUpperCase();
  if (nextTag) {
    const duplicate = await prisma.team.findFirst({
      where: {
        tag: nextTag,
        id: { not: teamId },
      },
      select: { id: true },
    });

    if (duplicate) {
      return fail(409, "That team tag already exists.");
    }
  }

  const nextStage = payload.stage ? mapStage(payload.stage) : team.stage;
  const shouldForceLock = nextStage !== CompetitionStage.ROUND_1;

  await prisma.team.update({
    where: { id: teamId },
    data: {
      name: payload.name?.trim(),
      tag: nextTag,
      avatarTone: payload.avatarTone?.trim(),
      avatarImageSrc:
        payload.avatarImageSrc === undefined ? undefined : payload.avatarImageSrc || null,
      track: payload.track?.trim(),
      bio: payload.bio?.trim(),
      leaderId: payload.leaderId,
      stage: nextStage,
      finalOutcome: payload.finalOutcome === undefined ? undefined : mapTeamFinalOutcome(payload.finalOutcome),
      round1LockStatus: shouldForceLock ? TeamRound1LockStatus.LOCKED : undefined,
      round1LockedAt: shouldForceLock ? team.round1LockedAt ?? new Date() : undefined,
      round1LockDeclinedAt: shouldForceLock ? null : undefined,
      round1LockDeclinedByUserId: shouldForceLock ? null : undefined,
    },
  });

  return ok({ teamId });
}

export async function deleteTeamByAdmin(teamId: string): Promise<ServiceResult<{ teamId: string }>> {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { id: true },
  });

  if (!team) {
    return fail(404, "Team not found.");
  }

  await prisma.team.delete({
    where: { id: teamId },
  });

  return ok({ teamId });
}

export function getDefaultPageContent() {
  return defaultPageContent;
}

function mapQuestionDifficulty(
  difficulty: Round1Question["difficulty"],
): Round1QuestionDifficulty {
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

function mapQuestionType(type: Round1Question["type"]): Round1QuestionType {
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

function normalizeQuestionForStorage(question: Round1Question) {
  return {
    ...question,
    difficulty: mapQuestionDifficulty(question.difficulty),
    type: mapQuestionType(question.type),
  };
}

function createNextRound1QuestionId(
  bankType: "objective" | "essay",
  questions: Round1Question[],
) {
  const prefix = bankType === "essay" ? "r1e-" : "r1q-";
  const nextIndex =
    questions.reduce((highest, question) => {
      const match = question.id.match(new RegExp(`^${prefix}(\\d+)$`, "i"));
      if (!match) {
        return highest;
      }

      const value = Number.parseInt(match[1] ?? "0", 10);
      return Number.isFinite(value) ? Math.max(highest, value) : highest;
    }, 0) + 1;

  return `${prefix}${String(nextIndex).padStart(2, "0")}`;
}

export async function createRound1QuestionByAdmin(
  bankId: string,
  payload: Round1Question,
): Promise<ServiceResult<{ bankId: string; questionId: string }>> {
  const bank = await prisma.round1TestBank.findUnique({
    where: { id: bankId },
    select: { id: true, bankType: true, questions: true },
  });

  if (!bank) {
    return fail(404, "Round 1 bank not found.");
  }

  const questions = JSON.parse(bank.questions) as Round1Question[];
  const questionId = createNextRound1QuestionId(
    bank.bankType === "ESSAY" ? "essay" : "objective",
    questions,
  );

  await prisma.round1TestBank.update({
    where: { id: bankId },
    data: {
      questions: JSON.stringify([
        ...questions,
        normalizeQuestionForStorage({ ...payload, id: questionId }),
      ]),
    },
  });

  return ok({ bankId, questionId }, 201);
}

export async function updateRound1QuestionByAdmin(
  bankId: string,
  questionId: string,
  payload: Round1Question,
): Promise<ServiceResult<{ bankId: string; questionId: string }>> {
  const bank = await prisma.round1TestBank.findUnique({
    where: { id: bankId },
    select: { id: true, questions: true },
  });

  if (!bank) {
    return fail(404, "Round 1 bank not found.");
  }

  const questions = JSON.parse(bank.questions) as Round1Question[];
  const questionExists = questions.some((question) => question.id === questionId);
  if (!questionExists) {
    return fail(404, "Round 1 question not found.");
  }

  const nextQuestions = questions.map((question) =>
    question.id === questionId
      ? normalizeQuestionForStorage({ ...payload, id: questionId })
      : question,
  );

  await prisma.round1TestBank.update({
    where: { id: bankId },
    data: {
      questions: JSON.stringify(nextQuestions),
    },
  });

  return ok({ bankId, questionId });
}

export async function updateRound1EssayScoreByAdmin(
  submissionId: string,
  payload: {
    essayScore?: number;
    questionScores?: Record<string, number>;
  },
): Promise<
  ServiceResult<{
    submissionId: string;
    essayScore: number | null;
    totalScore: number | null;
    essayQuestionScores: Record<string, number>;
  }>
> {
  const submission = await prisma.round1Submission.findUnique({
    where: { id: submissionId },
    select: { id: true, objectiveScore: true, answers: true },
  });

  if (!submission) {
    return fail(404, "Round 1 submission not found.");
  }

  const archive = (() => {
    try {
      const parsed = submission.answers
        ? (JSON.parse(submission.answers) as {
            questions?: Array<{ id?: string; type?: string }>;
            answers?: unknown;
            essayQuestionScores?: Record<string, number>;
          })
        : null;

      return {
        questions: Array.isArray(parsed?.questions) ? parsed.questions : [],
        answers: parsed?.answers && typeof parsed.answers === "object" ? parsed.answers : {},
        essayQuestionScores:
          parsed?.essayQuestionScores && typeof parsed.essayQuestionScores === "object"
            ? Object.fromEntries(
                Object.entries(parsed.essayQuestionScores).filter(
                  ([, value]) => typeof value === "number" && Number.isFinite(value),
                ),
              )
            : {},
      };
    } catch {
      return {
        questions: [] as Array<{ id?: string; type?: string }>,
        answers: {},
        essayQuestionScores: {} as Record<string, number>,
      };
    }
  })();

  const essayQuestionIds = archive.questions
    .filter((question) => String(question.type ?? "").toLowerCase() === "essay" && question.id)
    .map((question) => String(question.id));

  if (essayQuestionIds.length === 0) {
    return fail(409, "No archived essay questions were found for this Round 1 submission.");
  }

  let nextEssayQuestionScores: Record<string, number> = {};
  let nextEssayScore: number | null = null;
  let nextTotalScore: number | null = null;

  if (typeof payload.essayScore === "number") {
    nextEssayScore = payload.essayScore;
    nextTotalScore = submission.objectiveScore + payload.essayScore;
  } else {
    const submittedQuestionScores = payload.questionScores ?? {};
    const invalidQuestionId = Object.keys(submittedQuestionScores).find(
      (questionId) => !essayQuestionIds.includes(questionId),
    );

    if (invalidQuestionId) {
      return fail(400, "One or more essay scores do not belong to this submission.");
    }

    nextEssayQuestionScores = Object.fromEntries(
      essayQuestionIds.flatMap((questionId) => {
        const value = submittedQuestionScores[questionId];
        return typeof value === "number" && Number.isFinite(value) ? [[questionId, value]] : [];
      }),
    );

    if (Object.keys(nextEssayQuestionScores).length === essayQuestionIds.length) {
      nextEssayScore = Object.values(nextEssayQuestionScores).reduce((total, value) => total + value, 0);
      nextTotalScore = submission.objectiveScore + nextEssayScore;
    }
  }

  await prisma.round1Submission.update({
    where: { id: submissionId },
    data: {
      essayScore: nextEssayScore,
      totalScore: nextTotalScore,
      answers: JSON.stringify({
        questions: archive.questions,
        answers: archive.answers,
        essayQuestionScores: nextEssayQuestionScores,
      }),
    },
  });

  return ok({
    submissionId,
    essayScore: nextEssayScore,
    totalScore: nextTotalScore,
    essayQuestionScores: nextEssayQuestionScores,
  });
}
