import { MessageConversationKind, TeamInvitationStatus, UserRole, type Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";
import { moderateMessageText } from "@/lib/message-moderation";
import type { ServiceResult } from "@/server/team-service";

const MESSAGE_MAX_LENGTH = 2000;
const ORGANIZER_USER_ID = "competition-organizer";
const TEAM_REMOVAL_NOTICE_PREFIX = "Team removal notice";

type MessageActor = {
  id: string;
  name?: string;
  role: UserRole;
};

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

const conversationInclude = {
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
    include: {
      sender: {
        select: messageUserSelect,
      },
    },
    orderBy: {
      createdAt: "asc",
    },
    take: 200,
  },
} satisfies Prisma.MessageConversationInclude;

type MessageUserRecord = Prisma.UserGetPayload<{ select: typeof messageUserSelect }>;
type ConversationRecord = Prisma.MessageConversationGetPayload<{ include: typeof conversationInclude }>;

function ok<T>(data: T, status = 200): ServiceResult<T> {
  return { ok: true, status, data };
}

function fail<T = never>(status: number, error: string): ServiceResult<T> {
  return { ok: false, status, error };
}

function isElevatedRole(role: UserRole) {
  return role === UserRole.ADMIN || role === UserRole.MODERATOR;
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

function serializeDirectMessage(
  message: ConversationRecord["messages"][number],
) {
  return {
    id: message.id,
    conversationId: message.conversationId,
    senderId: message.senderId,
    body: message.deletedAt ? "" : message.body,
    deletedAt: message.deletedAt?.toISOString(),
    deletedByName: message.deletedByName ?? undefined,
    createdAt: message.createdAt.toISOString(),
    sender: serializeMessageUser(message.sender),
  };
}

function serializeOrganizerUser() {
  return {
    id: ORGANIZER_USER_ID,
    name: "Competition Organizer",
    email: "attacker@uel.edu.vn",
    role: "organizer",
    university: "",
    major: "",
    classYear: "",
    avatarTone: "from-cyan-500 via-sky-500 to-indigo-500",
    avatarImageSrc: undefined,
  };
}

function getActorParticipant(conversation: ConversationRecord, actorId: string) {
  return conversation.participants.find((participant) => participant.userId === actorId);
}

function getDirectOtherParticipant(conversation: ConversationRecord, actorId: string) {
  return conversation.participants.find((participant) => participant.userId !== actorId);
}

function getRequesterParticipant(conversation: ConversationRecord) {
  return conversation.participants.find((participant) => participant.userId === conversation.requesterId);
}

function canAccessConversation(conversation: ConversationRecord, actor: MessageActor) {
  if (conversation.kind === MessageConversationKind.ORGANIZER) {
    return isElevatedRole(actor.role) || conversation.requesterId === actor.id;
  }

  return conversation.participants.some((participant) => participant.userId === actor.id);
}

function serializeConversation(conversation: ConversationRecord, actor: MessageActor) {
  const actorIsElevated = isElevatedRole(actor.role);
  const isOrganizer = conversation.kind === MessageConversationKind.ORGANIZER;
  const currentParticipant = getActorParticipant(conversation, actor.id);
  const messages = conversation.messages
    .slice()
    .sort((left, right) => left.createdAt.getTime() - right.createdAt.getTime());
  const hiddenAt = isOrganizer ? null : currentParticipant?.hiddenAt ?? null;
  const visibleMessages = hiddenAt
    ? messages.filter((message) => message.createdAt.getTime() > hiddenAt.getTime())
    : messages;
  const readAt = isOrganizer && actorIsElevated
    ? conversation.organizerReadAt
    : currentParticipant?.readAt ?? null;
  const unreadCount = visibleMessages.filter((message) => {
    const isUnreadSender = isOrganizer && actorIsElevated
      ? message.senderId === conversation.requesterId
      : message.senderId !== actor.id;

    return isUnreadSender && (!readAt || message.createdAt.getTime() > readAt.getTime());
  }).length;
  const firstMessage = visibleMessages[0];
  const latestMessage = visibleMessages[visibleMessages.length - 1];
  const requestPending = !isOrganizer && visibleMessages.length === 1 && firstMessage?.senderId === actor.id;
  const isMessageRequest = !isOrganizer && visibleMessages.length === 1 && firstMessage?.senderId !== actor.id;
  const directOtherParticipant = getDirectOtherParticipant(conversation, actor.id);
  const requesterParticipant = getRequesterParticipant(conversation);
  const participant = isOrganizer
    ? actorIsElevated
      ? requesterParticipant
        ? serializeMessageUser(requesterParticipant.user)
        : null
      : serializeOrganizerUser()
    : directOtherParticipant
      ? serializeMessageUser(directOtherParticipant.user)
      : null;

  return {
    id: conversation.id,
    kind: conversation.kind === MessageConversationKind.ORGANIZER ? "organizer" : "direct",
    isOrganizer,
    isPinned: false,
    canDelete: !isOrganizer,
    participant,
    showParticipantEmail: isOrganizer ? actorIsElevated : Boolean(currentParticipant?.showOtherEmail),
    createdAt: conversation.createdAt.toISOString(),
    updatedAt: conversation.updatedAt.toISOString(),
    lastMessageAt: conversation.lastMessageAt.toISOString(),
    readAt: readAt?.toISOString(),
    unreadCount,
    requestPending,
    isMessageRequest,
    canSendMessage: isOrganizer || !requestPending,
    latestMessage: latestMessage
      ? serializeDirectMessage(latestMessage)
      : null,
    messages: visibleMessages.map((message) => serializeDirectMessage(message)),
  };
}

async function ensureOrganizerConversationForUser(
  client: Prisma.TransactionClient | typeof prisma,
  userId: string,
) {
  const existingConversation = await client.messageConversation.findFirst({
    where: {
      kind: MessageConversationKind.ORGANIZER,
      requesterId: userId,
    },
  });

  if (existingConversation) {
    return existingConversation;
  }

  return client.messageConversation.create({
    data: {
      kind: MessageConversationKind.ORGANIZER,
      requesterId: userId,
      participants: {
        create: {
          userId,
          showOtherEmail: false,
        },
      },
    },
  });
}

async function findDirectConversation(
  tx: Prisma.TransactionClient,
  firstUserId: string,
  secondUserId: string,
) {
  const conversations = await tx.messageConversation.findMany({
    where: {
      kind: MessageConversationKind.DIRECT,
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
    include: conversationInclude,
  });
}

export async function listMessageConversations(actor: MessageActor) {
  if (!isElevatedRole(actor.role)) {
    await ensureOrganizerConversationForUser(prisma, actor.id);
  }

  const conversations = await prisma.messageConversation.findMany({
    where: isElevatedRole(actor.role)
      ? {
          OR: [
            {
              participants: {
                some: {
                  userId: actor.id,
                },
              },
            },
            {
              kind: MessageConversationKind.ORGANIZER,
              messages: {
                some: {},
              },
            },
          ],
        }
      : {
          participants: {
            some: {
              userId: actor.id,
            },
          },
        },
    include: conversationInclude,
    orderBy: [
      {
        lastMessageAt: "desc",
      },
      {
        updatedAt: "desc",
      },
    ],
  });

  const serializedConversations = conversations
    .filter((conversation) => canAccessConversation(conversation, actor))
    .map((conversation) => serializeConversation(conversation, actor))
    .filter((conversation) => conversation.isOrganizer || conversation.messages.length > 0);

  serializedConversations.sort(
    (left, right) => new Date(right.lastMessageAt).getTime() - new Date(left.lastMessageAt).getTime(),
  );

  return {
    conversations: serializedConversations,
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

export async function getMessageUserById(actorId: string, userId: string) {
  const normalizedUserId = userId.trim();
  if (!normalizedUserId || normalizedUserId === actorId) {
    return { user: null };
  }

  const user = await prisma.user.findUnique({
    where: {
      id: normalizedUserId,
    },
    select: messageUserSelect,
  });

  return {
    user: user ? serializeMessageUser(user) : null,
  };
}

export async function revealConversationEmail(
  actor: MessageActor,
  conversationId: string,
): Promise<ServiceResult<{ conversationId: string }>> {
  const conversation = await prisma.messageConversation.findUnique({
    where: { id: conversationId },
    include: conversationInclude,
  });

  if (!conversation || conversation.kind !== MessageConversationKind.DIRECT || !canAccessConversation(conversation, actor)) {
    return fail(404, "Conversation not found.");
  }

  await prisma.messageParticipant.update({
    where: {
      conversationId_userId: {
        conversationId,
        userId: actor.id,
      },
    },
    data: {
      showOtherEmail: true,
    },
  });

  return ok({ conversationId });
}

export async function sendDirectMessage(
  actor: MessageActor,
  payload: {
    conversationId?: string;
    recipientId?: string;
    recipientSource?: "email-search" | "profile";
    organizer?: boolean;
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
    let conversationKind: MessageConversationKind = MessageConversationKind.DIRECT;
    let actorParticipantHiddenAt: Date | null = null;

    if (!conversationId && payload.organizer) {
      const organizerConversation = await ensureOrganizerConversationForUser(tx, actor.id);
      conversationId = organizerConversation.id;
    }

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

      if (!conversation) {
        return fail(404, "Conversation not found.");
      }

      conversationKind = conversation.kind;
      const actorParticipant = conversation.participants.find((participant) => participant.userId === actor.id);
      const actorCanAccess = conversation.kind === MessageConversationKind.ORGANIZER
        ? isElevatedRole(actor.role) || conversation.requesterId === actor.id
        : Boolean(actorParticipant);

      if (!actorCanAccess) {
        return fail(404, "Conversation not found.");
      }

      actorParticipantHiddenAt = actorParticipant?.hiddenAt ?? null;

      if (conversation.kind === MessageConversationKind.DIRECT) {
        recipientId = conversation.participants.find((participant) => participant.userId !== actor.id)?.userId ?? "";
        const visibleMessages = actorParticipantHiddenAt
          ? conversation.messages.filter((message) => message.createdAt.getTime() > actorParticipantHiddenAt!.getTime())
          : conversation.messages;
        const firstMessage = visibleMessages[0];
        if (visibleMessages.length === 1 && firstMessage?.senderId === actor.id) {
          return fail(409, "Wait for the receiver to reply before sending another message.");
        }
      }
    } else {
      if (!recipientId || recipientId === actor.id) {
        return fail(400, "Choose another user before sending a message.");
      }

      const recipient = await tx.user.findUnique({
        where: { id: recipientId },
        select: { id: true },
      });
      if (!recipient) {
        return fail(404, "Recipient not found.");
      }

      const existingConversation = await findDirectConversation(tx, actor.id, recipientId);
      if (existingConversation) {
        conversationId = existingConversation.id;
        const actorParticipant = existingConversation.participants.find((participant) => participant.userId === actor.id);
        actorParticipantHiddenAt = actorParticipant?.hiddenAt ?? null;
        if (payload.recipientSource === "email-search") {
          await tx.messageParticipant.update({
            where: {
              conversationId_userId: {
                conversationId,
                userId: actor.id,
              },
            },
            data: {
              showOtherEmail: true,
            },
          });
        }

        const messages = await tx.directMessage.findMany({
          where: { conversationId },
          orderBy: { createdAt: "asc" },
        });
        const visibleMessages = actorParticipantHiddenAt
          ? messages.filter((message) => message.createdAt.getTime() > actorParticipantHiddenAt!.getTime())
          : messages;
        const firstMessage = visibleMessages[0];
        if (visibleMessages.length === 1 && firstMessage?.senderId === actor.id) {
          return fail(409, "Wait for the receiver to reply before sending another message.");
        }
      } else {
        const conversation = await tx.messageConversation.create({
          data: {
            kind: MessageConversationKind.DIRECT,
            lastMessageAt: now,
            participants: {
              create: [
                {
                  userId: actor.id,
                  readAt: now,
                  showOtherEmail: payload.recipientSource === "email-search",
                },
                {
                  userId: recipientId,
                  showOtherEmail: true,
                },
              ],
            },
          },
        });
        conversationId = conversation.id;
      }
    }

    await tx.directMessage.create({
      data: {
        conversationId,
        senderId: actor.id,
        body,
        createdAt: now,
      },
    });

    await tx.messageConversation.update({
      where: { id: conversationId },
      data: {
        lastMessageAt: now,
        ...(conversationKind === MessageConversationKind.ORGANIZER && isElevatedRole(actor.role)
          ? { organizerReadAt: now }
          : {}),
      },
    });

    await tx.messageParticipant.updateMany({
      where: {
        conversationId,
        userId: actor.id,
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
  actor: MessageActor,
  conversationId: string,
): Promise<ServiceResult<{ conversationId: string }>> {
  const conversation = await loadConversation(conversationId);
  if (!conversation || !canAccessConversation(conversation, actor)) {
    return fail(404, "Conversation not found.");
  }

  if (conversation.kind === MessageConversationKind.ORGANIZER && isElevatedRole(actor.role)) {
    await prisma.messageConversation.update({
      where: { id: conversationId },
      data: {
        organizerReadAt: new Date(),
      },
    });
    return ok({ conversationId });
  }

  const participant = getActorParticipant(conversation, actor.id);
  if (!participant) {
    return fail(404, "Conversation not found.");
  }

  await prisma.messageParticipant.update({
    where: {
      conversationId_userId: {
        conversationId,
        userId: actor.id,
      },
    },
    data: {
      readAt: new Date(),
    },
  });

  return ok({ conversationId });
}

export async function hideMessageConversation(
  actor: MessageActor,
  conversationId: string,
): Promise<ServiceResult<{ conversationId: string }>> {
  const conversation = await loadConversation(conversationId);
  if (!conversation || conversation.kind !== MessageConversationKind.DIRECT || !canAccessConversation(conversation, actor)) {
    return fail(404, "Conversation not found.");
  }

  const now = new Date();
  await prisma.messageParticipant.update({
    where: {
      conversationId_userId: {
        conversationId,
        userId: actor.id,
      },
    },
    data: {
      hiddenAt: now,
      readAt: now,
    },
  });

  return ok({ conversationId });
}

export async function deleteOwnDirectMessage(
  actor: MessageActor,
  conversationId: string,
  messageId: string,
): Promise<ServiceResult<{ conversationId: string; messageId: string }>> {
  const message = await prisma.directMessage.findUnique({
    where: { id: messageId },
    include: {
      conversation: {
        include: {
          participants: true,
        },
      },
      sender: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!message || message.conversationId !== conversationId) {
    return fail(404, "Message not found.");
  }

  const actorCanAccess = message.conversation.kind === MessageConversationKind.ORGANIZER
    ? isElevatedRole(actor.role) || message.conversation.requesterId === actor.id
    : message.conversation.participants.some((participant) => participant.userId === actor.id);

  if (!actorCanAccess) {
    return fail(404, "Message not found.");
  }

  if (message.senderId !== actor.id) {
    return fail(403, "You can delete only your own messages.");
  }

  if (!message.deletedAt) {
    await prisma.directMessage.update({
      where: { id: messageId },
      data: {
        body: "",
        deletedAt: new Date(),
        deletedByName: actor.name || message.sender.name,
      },
    });
  }

  return ok({ conversationId, messageId });
}

export async function getConversationAfterSend(actor: MessageActor, conversationId: string) {
  const conversation = await loadConversation(conversationId);
  if (!conversation || !canAccessConversation(conversation, actor)) {
    return null;
  }

  return serializeConversation(conversation, actor);
}

export async function listUnreadNotifications(actor: MessageActor) {
  const [conversationPayload, invitations] = await Promise.all([
    listMessageConversations(actor),
    prisma.teamInvitation.findMany({
      where: {
        toUserId: actor.id,
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
    .map((conversation) => {
      const latestMessage = conversation.latestMessage;
      const latestBody = latestMessage?.deletedAt
        ? `Message deleted by ${latestMessage.deletedByName ?? latestMessage.sender.name}`
        : latestMessage?.body ?? "";
      const isTeamRemoval = latestBody.startsWith(TEAM_REMOVAL_NOTICE_PREFIX);

      return {
        id: `message-${conversation.id}`,
        type: "message" as const,
        title: isTeamRemoval ? "Team removal notice" : conversation.participant?.name ?? "New message",
        description: latestBody,
        href: `/messages?conversation=${encodeURIComponent(conversation.id)}`,
        createdAt: conversation.latestMessage?.createdAt ?? conversation.lastMessageAt,
        count: conversation.unreadCount,
        meta: {
          senderName: conversation.participant?.name ?? "New message",
          isMessageRequest: conversation.isMessageRequest,
          isOrganizer: conversation.isOrganizer,
          isTeamRemoval,
        },
      };
    });

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
