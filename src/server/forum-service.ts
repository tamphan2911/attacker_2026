import {
  ForumThreadCategory,
  ForumThreadStatus,
  UserRole,
} from "@prisma/client";

import { prisma } from "@/lib/db";
import {
  detectForumModerationIssues,
  type ForumModerationIssue,
} from "@/server/forum-moderation";

type ServiceSuccess<T> = {
  ok: true;
  status: number;
  data: T;
};

type ServiceFailure = {
  ok: false;
  status: number;
  error: string;
  issues?: ForumModerationIssue[];
};

export type ServiceResult<T> = ServiceSuccess<T> | ServiceFailure;

function ok<T>(data: T, status = 200): ServiceSuccess<T> {
  return { ok: true, status, data };
}

function fail(status: number, error: string, issues?: ForumModerationIssue[]): ServiceFailure {
  return { ok: false, status, error, issues };
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

function buildThreadSummary(body: string) {
  const normalized = body.replace(/\s+/g, " ").trim();
  if (normalized.length <= 220) {
    return normalized;
  }

  return `${normalized.slice(0, 220).trimEnd()}...`;
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

function canUseForumActions(role: UserRole) {
  return role === UserRole.STUDENT || role === UserRole.ADMIN || role === UserRole.MODERATOR;
}

function canModerateForum(role: UserRole) {
  return role === UserRole.ADMIN || role === UserRole.MODERATOR;
}

async function requireForumActionUser(userId: string) {
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

  if (!canUseForumActions(user.role)) {
    return fail(403, "Only participant, admin, and moderator accounts can post on the forum.");
  }

  if (user.role === UserRole.STUDENT && !user.emailVerifiedAt) {
    return fail(403, "Activate the account before posting on the forum.");
  }

  return ok(user);
}

async function requireExistingForumActionUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      name: true,
    },
  });

  if (!user) {
    return fail(404, "User not found.");
  }

  if (!canUseForumActions(user.role)) {
    return fail(403, "Only participant, admin, and moderator accounts can manage forum content.");
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
      replies: {
        orderBy: { createdAt: "desc" },
        take: 1,
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
    body: string;
    category: string;
    contactNote?: string;
  },
): Promise<ServiceResult<{ slug: string }>> {
  const userResult = await requireForumActionUser(userId);
  if (!userResult.ok) {
    return userResult;
  }

  const title = trimInput(payload.title);
  const body = trimInput(payload.body);
  const contactNote = trimInput(payload.contactNote ?? "");
  const category = mapCategory(payload.category);
  const summary = buildThreadSummary(body);

  if (!title || !body) {
    return fail(400, "Title and thread body are required.");
  }

  if (!category) {
    return fail(400, "Invalid forum category.");
  }

  if (title.length > 120) {
    return fail(400, "Title is too long.");
  }

  const moderationIssues = detectForumModerationIssues([
    { field: "title", value: title },
    { field: "body", value: body },
    { field: "contactNote", value: contactNote },
  ]);

  if (moderationIssues.length > 0) {
    return fail(
      422,
      "Some parts of this thread contain wording that is not allowed in the forum community.",
      moderationIssues,
    );
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
      university:
        userResult.data.university ||
        (userResult.data.role === UserRole.ADMIN || userResult.data.role === UserRole.MODERATOR ? "Organizer team" : ""),
      preferredRoles: JSON.stringify([]),
      contactNote,
      lastActivityAt: new Date(),
    },
    select: { slug: true },
  });

  return ok({ slug: thread.slug }, 201);
}

export async function editForumThreadForUser(
  userId: string,
  slug: string,
  payload: {
    title: string;
    category: string;
    body: string;
    contactNote?: string;
  },
): Promise<ServiceResult<{ slug: string }>> {
  const userResult = await requireExistingForumActionUser(userId);
  if (!userResult.ok) {
    return userResult;
  }

  const title = trimInput(payload.title);
  const body = trimInput(payload.body);
  const contactNote = trimInput(payload.contactNote ?? "");
  const category = mapCategory(payload.category);
  const summary = buildThreadSummary(body);

  if (!title || !body) {
    return fail(400, "Title and thread body are required.");
  }

  if (!category) {
    return fail(400, "Invalid forum category.");
  }

  if (title.length > 120) {
    return fail(400, "Title is too long.");
  }

  const moderationIssues = detectForumModerationIssues([
    { field: "title", value: title },
    { field: "body", value: body },
    { field: "contactNote", value: contactNote },
  ]);

  if (moderationIssues.length > 0) {
    return fail(
      422,
      "This thread contains wording that is not allowed in the forum community.",
      moderationIssues,
    );
  }

  const thread = await prisma.forumThread.findUnique({
    where: { slug },
    select: { id: true, authorId: true, slug: true },
  });

  if (!thread) {
    return fail(404, "Forum thread not found.");
  }

  if (thread.authorId !== userResult.data.id) {
    return fail(403, "Only the thread owner can edit the main thread content.");
  }

  const editedAt = new Date();
  await prisma.forumThread.update({
    where: { id: thread.id },
    data: {
      title,
      summary,
      body,
      category,
      contactNote,
      preferredRoles: JSON.stringify([]),
      editedAt,
      editedByName: userResult.data.name,
      lastActivityAt: editedAt,
    },
  });

  return ok({ slug: thread.slug });
}

export async function closeForumThreadForUser(
  userId: string,
  slug: string,
): Promise<ServiceResult<{ slug: string }>> {
  const userResult = await requireExistingForumActionUser(userId);
  if (!userResult.ok) {
    return userResult;
  }

  const thread = await prisma.forumThread.findUnique({
    where: { slug },
    select: {
      id: true,
      authorId: true,
      slug: true,
      status: true,
    },
  });

  if (!thread) {
    return fail(404, "Forum thread not found.");
  }

  if (thread.authorId !== userResult.data.id) {
    return fail(403, "Only the thread owner can close this thread.");
  }

  if (thread.status === ForumThreadStatus.CLOSED) {
    return ok({ slug: thread.slug });
  }

  await prisma.forumThread.update({
    where: { id: thread.id },
    data: {
      status: ForumThreadStatus.CLOSED,
      lastActivityAt: new Date(),
    },
  });

  return ok({ slug: thread.slug });
}

export async function deleteForumThreadByAdmin(slug: string): Promise<ServiceResult<{ slug: string }>> {
  const thread = await prisma.forumThread.findUnique({
    where: { slug },
    select: { id: true, slug: true },
  });

  if (!thread) {
    return fail(404, "Forum thread not found.");
  }

  await prisma.forumThread.delete({
    where: { id: thread.id },
  });

  return ok({ slug: thread.slug });
}

export async function createForumReplyForUser(
  userId: string,
  slug: string,
  payload: {
    body: string;
  },
): Promise<ServiceResult<{ replyId: string }>> {
  const userResult = await requireForumActionUser(userId);
  if (!userResult.ok) {
    return userResult;
  }

  const body = trimInput(payload.body);
  if (!body) {
    return fail(400, "Reply content is required.");
  }

  const moderationIssues = detectForumModerationIssues([
    { field: "reply", value: body },
  ]);

  if (moderationIssues.length > 0) {
    return fail(
      422,
      "This reply contains wording that is not allowed in the forum community.",
      moderationIssues,
    );
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

export async function deleteForumReplyForUser(
  userId: string,
  slug: string,
  replyId: string,
): Promise<ServiceResult<{ replyId: string }>> {
  const userResult = await requireExistingForumActionUser(userId);
  if (!userResult.ok) {
    return userResult;
  }

  const reply = await prisma.forumReply.findUnique({
    where: { id: replyId },
    select: {
      id: true,
      authorId: true,
      deletedAt: true,
      thread: {
        select: {
          id: true,
          slug: true,
          authorId: true,
        },
      },
    },
  });

  if (!reply || reply.thread.slug !== slug) {
    return fail(404, "Forum reply not found.");
  }

  if (reply.deletedAt) {
    return ok({ replyId: reply.id });
  }

  const canDelete =
    reply.authorId === userResult.data.id ||
    reply.thread.authorId === userResult.data.id ||
    canModerateForum(userResult.data.role);

  if (!canDelete) {
    return fail(403, "You do not have permission to delete this reply.");
  }

  const deletedAt = new Date();
  await prisma.$transaction(async (tx) => {
    await tx.forumReply.update({
      where: { id: reply.id },
      data: {
        deletedAt,
        deletedByName: userResult.data.name,
      },
    });

    await tx.forumThread.update({
      where: { id: reply.thread.id },
      data: { lastActivityAt: deletedAt },
    });
  });

  return ok({ replyId: reply.id });
}

export async function editForumReplyForUser(
  userId: string,
  slug: string,
  replyId: string,
  payload: {
    body: string;
  },
): Promise<ServiceResult<{ replyId: string }>> {
  const userResult = await requireExistingForumActionUser(userId);
  if (!userResult.ok) {
    return userResult;
  }

  const body = trimInput(payload.body);
  if (!body) {
    return fail(400, "Reply content is required.");
  }

  const moderationIssues = detectForumModerationIssues([
    { field: "reply", value: body },
  ]);

  if (moderationIssues.length > 0) {
    return fail(
      422,
      "This reply contains wording that is not allowed in the forum community.",
      moderationIssues,
    );
  }

  const reply = await prisma.forumReply.findUnique({
    where: { id: replyId },
    select: {
      id: true,
      authorId: true,
      deletedAt: true,
      thread: {
        select: {
          id: true,
          slug: true,
        },
      },
    },
  });

  if (!reply || reply.thread.slug !== slug) {
    return fail(404, "Forum reply not found.");
  }

  if (reply.deletedAt) {
    return fail(409, "Deleted replies cannot be edited.");
  }

  if (reply.authorId !== userResult.data.id) {
    return fail(403, "Only the reply owner can edit this reply.");
  }

  const latestReply = await prisma.forumReply.findFirst({
    where: {
      threadId: reply.thread.id,
      authorId: userResult.data.id,
      deletedAt: null,
    },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });

  if (latestReply?.id !== reply.id) {
    return fail(403, "Only your latest reply in this thread can be edited.");
  }

  const editedAt = new Date();
  await prisma.$transaction(async (tx) => {
    await tx.forumReply.update({
      where: { id: reply.id },
      data: {
        body,
        editedAt,
        editedByName: userResult.data.name,
      },
    });

    await tx.forumThread.update({
      where: { id: reply.thread.id },
      data: { lastActivityAt: editedAt },
    });
  });

  return ok({ replyId: reply.id });
}
