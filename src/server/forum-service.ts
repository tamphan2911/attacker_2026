import {
  ForumThreadCategory,
  ForumThreadStatus,
  UserRole,
} from "@prisma/client";

import { prisma } from "@/lib/db";

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

export type ServiceResult<T> = ServiceSuccess<T> | ServiceFailure;

function ok<T>(data: T, status = 200): ServiceSuccess<T> {
  return { ok: true, status, data };
}

function fail(status: number, error: string): ServiceFailure {
  return { ok: false, status, error };
}

function trimInput(value: string) {
  return value.trim();
}

function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

function mapCategory(value: string): ForumThreadCategory | null {
  switch (value) {
    case "looking-for-team":
      return ForumThreadCategory.LOOKING_FOR_TEAM;
    case "team-looking-for-members":
      return ForumThreadCategory.TEAM_LOOKING_FOR_MEMBERS;
    case "general-discussion":
      return ForumThreadCategory.GENERAL_DISCUSSION;
    default:
      return null;
  }
}

function uniqueRoles(roles: string[]) {
  return Array.from(
    new Set(
      roles
        .map((role) => trimInput(role))
        .filter(Boolean),
    ),
  ).slice(0, 6);
}

async function createUniqueThreadSlug(title: string) {
  const base = slugify(title) || "forum-thread";
  let slug = base;
  let attempt = 1;

  while (await prisma.forumThread.findUnique({ where: { slug }, select: { id: true } })) {
    attempt += 1;
    slug = `${base}-${attempt}`;
  }

  return slug;
}

async function requireVerifiedStudentUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      emailVerifiedAt: true,
      university: true,
    },
  });

  if (!user) {
    return fail(404, "User not found.");
  }

  if (user.role !== UserRole.STUDENT) {
    return fail(403, "Only participant accounts can post on the forum.");
  }

  if (!user.emailVerifiedAt) {
    return fail(403, "Activate the account before posting on the forum.");
  }

  return ok(user);
}

export async function listForumThreads() {
  return prisma.forumThread.findMany({
    orderBy: { lastActivityAt: "desc" },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          role: true,
          university: true,
          avatarTone: true,
          avatarImageSrc: true,
        },
      },
      _count: {
        select: { replies: true },
      },
    },
  });
}

export async function getForumThreadBySlug(slug: string) {
  return prisma.forumThread.findUnique({
    where: { slug },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          role: true,
          university: true,
          avatarTone: true,
          avatarImageSrc: true,
        },
      },
      replies: {
        orderBy: { createdAt: "asc" },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              role: true,
              university: true,
              avatarTone: true,
              avatarImageSrc: true,
            },
          },
        },
      },
      _count: {
        select: { replies: true },
      },
    },
  });
}

export async function createForumThreadForUser(
  userId: string,
  payload: {
    title: string;
    summary: string;
    body: string;
    category: string;
    preferredRoles?: string[];
    contactNote?: string;
  },
): Promise<ServiceResult<{ slug: string }>> {
  const userResult = await requireVerifiedStudentUser(userId);
  if (!userResult.ok) {
    return userResult;
  }

  const title = trimInput(payload.title);
  const summary = trimInput(payload.summary);
  const body = trimInput(payload.body);
  const contactNote = trimInput(payload.contactNote ?? "");
  const category = mapCategory(payload.category);
  const preferredRoles = uniqueRoles(payload.preferredRoles ?? []);

  if (!title || !summary || !body) {
    return fail(400, "Title, summary, and thread body are required.");
  }

  if (!category) {
    return fail(400, "Invalid forum category.");
  }

  if (title.length > 120) {
    return fail(400, "Title is too long.");
  }

  if (summary.length > 240) {
    return fail(400, "Summary is too long.");
  }

  const slug = await createUniqueThreadSlug(title);

  const thread = await prisma.forumThread.create({
    data: {
      slug,
      authorId: userId,
      title,
      summary,
      body,
      category,
      status: ForumThreadStatus.OPEN,
      university: userResult.data.university,
      preferredRoles: JSON.stringify(preferredRoles),
      contactNote,
      lastActivityAt: new Date(),
    },
    select: { slug: true },
  });

  return ok({ slug: thread.slug }, 201);
}

export async function createForumReplyForUser(
  userId: string,
  slug: string,
  payload: {
    body: string;
  },
): Promise<ServiceResult<{ replyId: string }>> {
  const userResult = await requireVerifiedStudentUser(userId);
  if (!userResult.ok) {
    return userResult;
  }

  const body = trimInput(payload.body);
  if (!body) {
    return fail(400, "Reply content is required.");
  }

  const thread = await prisma.forumThread.findUnique({
    where: { slug },
    select: { id: true, status: true },
  });

  if (!thread) {
    return fail(404, "Forum thread not found.");
  }

  if (thread.status !== ForumThreadStatus.OPEN) {
    return fail(409, "This thread is currently closed.");
  }

  const reply = await prisma.$transaction(async (tx) => {
    const createdReply = await tx.forumReply.create({
      data: {
        threadId: thread.id,
        authorId: userId,
        body,
      },
      select: { id: true },
    });

    await tx.forumThread.update({
      where: { id: thread.id },
      data: { lastActivityAt: new Date() },
    });

    return createdReply;
  });

  return ok({ replyId: reply.id }, 201);
}
