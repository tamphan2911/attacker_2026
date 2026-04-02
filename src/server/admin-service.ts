import {
  CompetitionStage,
  Round1QuestionDifficulty,
  Round1QuestionType,
  TeamRound1LockStatus,
  UserRole,
} from "@prisma/client";

import { DEMO_ADMIN_LOGIN_ID, defaultPageContent } from "@/data/site-content";
import { prisma } from "@/lib/db";
import type {
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
    select: { slug: true },
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

  return ok({ slug: payload.slug });
}

export async function deleteNewsPostByAdmin(slug: string): Promise<ServiceResult<{ slug: string }>> {
  const existing = await prisma.newsPost.findUnique({
    where: { slug },
    select: { slug: true },
  });

  if (!existing) {
    return fail(404, "Article not found.");
  }

  await prisma.newsPost.delete({ where: { slug } });
  return ok({ slug });
}

export async function updateUserByAdmin(
  userId: string,
  payload: Partial<UserProfile>,
): Promise<ServiceResult<{ userId: string }>> {
  if (userId === DEMO_ADMIN_LOGIN_ID) {
    return fail(403, "The fixed admin account cannot be edited.");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, studentId: true },
  });

  if (!user) {
    return fail(404, "User not found.");
  }

  const nextEmail = payload.email?.trim().toLowerCase();
  const nextStudentId = payload.studentId?.trim().toLowerCase();

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

export async function deleteUserByAdmin(userId: string): Promise<ServiceResult<{ userId: string }>> {
  if (userId === DEMO_ADMIN_LOGIN_ID) {
    return fail(403, "The fixed admin account cannot be deleted.");
  }

  return prisma.$transaction(async (tx) => {
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

export async function updateTeamByAdmin(
  teamId: string,
  payload: Partial<Pick<TeamProfile, "name" | "tag" | "avatarTone" | "avatarImageSrc" | "track" | "bio" | "leaderId" | "stage">>,
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
  essayScore: number,
): Promise<ServiceResult<{ submissionId: string }>> {
  const submission = await prisma.round1Submission.findUnique({
    where: { id: submissionId },
    select: { id: true, objectiveScore: true },
  });

  if (!submission) {
    return fail(404, "Round 1 submission not found.");
  }

  await prisma.round1Submission.update({
    where: { id: submissionId },
    data: {
      essayScore,
      totalScore: submission.objectiveScore + essayScore,
    },
  });

  return ok({ submissionId });
}
