import { TeamInvitationStatus, UserRole, type Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";
import { moderateMessageText } from "@/lib/message-moderation";
import type { ServiceResult } from "@/server/team-service";

const MESSAGE_MAX_LENGTH = 2000;

const messageUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  university: true,
  major: true,
  classYear: true,
  avatarTone: true,
  avatarImageSrc: true,
} satisfies Prisma.UserSelect;

type MessageUserRecord = Prisma.UserGetPayload<{ select: typeof messageUserSelect }>;

type ConversationRecord = Prisma.MessageConversationGetPayload<{
  include: {
    participants: {
      include: {
        user: {
          select: typeof messageUserSelect;
        };
      };
    };
    messages: true;
  };
}>;

function ok<T>(data: T, status = 200): ServiceResult<T> {
  return { ok: true, status, data };
}

function fail<T = never>(status: number, error: string): ServiceResult<T> {
  return { ok: false, status, error };
}

function mapRole(role: UserRole) {
  switch (role) {
    case UserRole.ADMIN:
      return "admin";
    case UserRole.MODERATOR:
      return "moderator";
    case UserRole.JUDGE:
      return "judge";
    case UserRole.STUDENT:
    default:
      return "student";
  }
}

function serializeMessageUser(user: MessageUserRecord) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: mapRole(user.role),
    university: user.university,
    major: user.major,
    classYear: user.classYear,
    avatarTone: user.avatarTone,
    avatarImageSrc: user.avatarImageSrc ?? undefined,
  };
}

function getOtherParticipant(conversation: ConversationRecord, actorId: string) {
  return conversation.participants.find((participant) => participant.userId !== actorId);
}

function serializeConversation(conversation: ConversationRecord, actorId: string) {
  const currentParticipant = conversation.participants.find((participant) => participant.userId === actorId);
  const otherParticipant = getOtherParticipant(conversation, actorId);
  const messages = conversation.messages
    .slice()
    .sort((left, right) => left.createdAt.getTime() - right.createdAt.getTime());
  const readAt = currentParticipant?.readAt ?? null;
  const unreadCount = messages.filter(
    (message) => message.senderId !== actorId && (!readAt || message.createdAt.getTime() > readAt.getTime()),
  ).length;
  const firstMessage = messages[0];
  const requestPending = messages.length === 1 && firstMessage?.senderId === actorId;
  const latestMessage = messages[messages.length - 1];

  return {
    id: conversation.id,
    participant: otherParticipant ? serializeMessageUser(otherParticipant.user) : null,
    createdAt: conversation.createdAt.toISOString(),
    updatedAt: conversation.updatedAt.toISOString(),
    lastMessageAt: conversation.lastMessageAt.toISOString(),
    readAt: readAt?.toISOString(),
    unreadCount,
    requestPending,
    canSendMessage: !requestPending,
    latestMessage: latestMessage
      ? {
          id: latestMessage.id,
          senderId: latestMessage.senderId,
          body: latestMessage.body,
          createdAt: latestMessage.createdAt.toISOString(),
        }
      : null,
    messages: messages.map((message) => ({
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      body: message.body,
      createdAt: message.createdAt.toISOString(),
    })),
  };
}

async function findDirectConversation(
  tx: Prisma.TransactionClient,
  firstUserId: string,
  secondUserId: string,
) {
  const conversations = await tx.messageConversation.findMany({
    where: {
      participants: {
        some: {
          userId: firstUserId,
        },
      },
    },
    include: {
      participants: true,
    },
    orderBy: {
      lastMessageAt: "desc",
    },
  });

  return conversations.find(
    (conversation) =>
      conversation.participants.length === 2 &&
      conversation.participants.some((participant) => participant.userId === secondUserId),
  );
}

async function loadConversation(conversationId: string) {
  return prisma.messageConversation.findUnique({
    where: { id: conversationId },
    include: {
      participants: {
        include: {
          user: {
            select: messageUserSelect,
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      },
      messages: {
        orderBy: {
          createdAt: "asc",
        },
        take: 200,
      },
    },
  });
}

export async function listMessageConversations(actorId: string) {
  const conversations = await prisma.messageConversation.findMany({
    where: {
      participants: {
        some: {
          userId: actorId,
        },
      },
    },
    include: {
      participants: {
        include: {
          user: {
            select: messageUserSelect,
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      },
      messages: {
        orderBy: {
          createdAt: "asc",
        },
        take: 200,
      },
    },
    orderBy: [
      {
        lastMessageAt: "desc",
      },
      {
        updatedAt: "desc",
      },
    ],
  });

  return {
    conversations: conversations.map((conversation) => serializeConversation(conversation, actorId)),
  };
}

export async function searchMessageUserByExactEmail(actorId: string, email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || !normalizedEmail.includes("@")) {
    return { user: null };
  }

  const user = await prisma.user.findFirst({
    where: {
      email: normalizedEmail,
      id: {
        not: actorId,
      },
    },
    select: messageUserSelect,
  });

  return {
    user: user ? serializeMessageUser(user) : null,
  };
}

export async function sendDirectMessage(
  actorId: string,
  payload: {
    conversationId?: string;
    recipientId?: string;
    body: string;
  },
): Promise<ServiceResult<{ conversationId: string }>> {
  const rawBody = payload.body.trim();
  if (!rawBody) {
    return fail(400, "Message text is required.");
  }

  if (rawBody.length > MESSAGE_MAX_LENGTH) {
    return fail(400, `Message text must be ${MESSAGE_MAX_LENGTH} characters or fewer.`);
  }

  const body = moderateMessageText(rawBody);
  const now = new Date();

  const result = await prisma.$transaction(async (tx) => {
    let conversationId = payload.conversationId?.trim() || "";
    let recipientId = payload.recipientId?.trim() || "";

    if (conversationId) {
      const conversation = await tx.messageConversation.findUnique({
        where: { id: conversationId },
        include: {
          participants: true,
          messages: {
            orderBy: {
              createdAt: "asc",
            },
          },
        },
      });

      if (!conversation || !conversation.participants.some((participant) => participant.userId === actorId)) {
        return fail(404, "Conversation not found.");
      }

      recipientId = conversation.participants.find((participant) => participant.userId !== actorId)?.userId ?? "";
      const firstMessage = conversation.messages[0];
      if (conversation.messages.length === 1 && firstMessage?.senderId === actorId) {
        return fail(409, "Wait for the receiver to reply before sending another message.");
      }
    } else {
      if (!recipientId || recipientId === actorId) {
        return fail(400, "Choose another user before sending a message.");
      }

      const recipient = await tx.user.findUnique({
        where: { id: recipientId },
        select: { id: true },
      });
      if (!recipient) {
        return fail(404, "Recipient not found.");
      }

      const existingConversation = await findDirectConversation(tx, actorId, recipientId);
      if (existingConversation) {
        conversationId = existingConversation.id;
        const messages = await tx.directMessage.findMany({
          where: { conversationId },
          orderBy: { createdAt: "asc" },
        });
        const firstMessage = messages[0];
        if (messages.length === 1 && firstMessage?.senderId === actorId) {
          return fail(409, "Wait for the receiver to reply before sending another message.");
        }
      } else {
        const conversation = await tx.messageConversation.create({
          data: {
            lastMessageAt: now,
            participants: {
              create: [{ userId: actorId, readAt: now }, { userId: recipientId }],
            },
          },
        });
        conversationId = conversation.id;
      }
    }

    await tx.directMessage.create({
      data: {
        conversationId,
        senderId: actorId,
        body,
        createdAt: now,
      },
    });

    await tx.messageConversation.update({
      where: { id: conversationId },
      data: {
        lastMessageAt: now,
      },
    });

    await tx.messageParticipant.update({
      where: {
        conversationId_userId: {
          conversationId,
          userId: actorId,
        },
      },
      data: {
        readAt: now,
      },
    });

    return ok({ conversationId }, 201);
  });

  return result;
}

export async function markConversationRead(
  actorId: string,
  conversationId: string,
): Promise<ServiceResult<{ conversationId: string }>> {
  const participant = await prisma.messageParticipant.findUnique({
    where: {
      conversationId_userId: {
        conversationId,
        userId: actorId,
      },
    },
  });

  if (!participant) {
    return fail(404, "Conversation not found.");
  }

  await prisma.messageParticipant.update({
    where: {
      conversationId_userId: {
        conversationId,
        userId: actorId,
      },
    },
    data: {
      readAt: new Date(),
    },
  });

  return ok({ conversationId });
}

export async function getConversationAfterSend(actorId: string, conversationId: string) {
  const conversation = await loadConversation(conversationId);
  if (!conversation || !conversation.participants.some((participant) => participant.userId === actorId)) {
    return null;
  }

  return serializeConversation(conversation, actorId);
}

export async function listUnreadNotifications(actorId: string) {
  const [conversationPayload, invitations] = await Promise.all([
    listMessageConversations(actorId),
    prisma.teamInvitation.findMany({
      where: {
        toUserId: actorId,
        status: TeamInvitationStatus.PENDING,
      },
      include: {
        team: {
          select: {
            name: true,
            tag: true,
          },
        },
        fromUser: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
  ]);

  const messageNotifications = conversationPayload.conversations
    .filter((conversation) => conversation.unreadCount > 0 && conversation.latestMessage)
    .map((conversation) => ({
      id: `message-${conversation.id}`,
      type: "message" as const,
      title: conversation.participant?.name ?? "New message",
      description: conversation.latestMessage?.body ?? "",
      href: `/messages?conversation=${encodeURIComponent(conversation.id)}`,
      createdAt: conversation.latestMessage?.createdAt ?? conversation.lastMessageAt,
      count: conversation.unreadCount,
      meta: {
        senderName: conversation.participant?.name ?? "New message",
      },
    }));

  const invitationNotifications = invitations.map((invitation) => ({
    id: `team-invitation-${invitation.id}`,
    type: "team-invitation" as const,
    title: invitation.team.name,
    description: `${invitation.fromUser.name} invited you to join ${invitation.team.tag}.`,
    href: "/dashboard#team-actions",
    createdAt: invitation.createdAt.toISOString(),
    count: 1,
    meta: {
      senderName: invitation.fromUser.name,
      teamTag: invitation.team.tag,
    },
  }));

  const items = [...messageNotifications, ...invitationNotifications].sort(
    (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );

  return {
    unreadCount: items.reduce((total, item) => total + item.count, 0),
    items: items.slice(0, 8),
  };
}
