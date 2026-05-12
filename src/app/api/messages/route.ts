import { z } from "zod";

import { getCurrentDbUser } from "@/server/auth-helpers";
import {
  getConversationAfterSend,
  listMessageConversations,
  sendDirectMessage,
} from "@/server/message-service";
import { serviceResultToResponse, unauthorizedResponse } from "@/server/route-utils";

const sendMessageSchema = z.object({
  conversationId: z.string().trim().min(1).optional(),
  recipientId: z.string().trim().min(1).optional(),
  recipientSource: z.enum(["email-search", "profile"]).optional(),
  organizer: z.boolean().optional(),
  body: z.string().trim().min(1).max(2000),
});

export async function GET() {
  const user = await getCurrentDbUser();
  if (!user) {
    return unauthorizedResponse();
  }

  return Response.json(await listMessageConversations(user), { status: 200 });
}

export async function POST(request: Request) {
  const user = await getCurrentDbUser();
  if (!user) {
    return unauthorizedResponse();
  }

  const payload = sendMessageSchema.safeParse(await request.json().catch(() => null));
  if (!payload.success) {
    return Response.json(
      { error: "Invalid message payload.", issues: payload.error.flatten() },
      { status: 400 },
    );
  }

  const result = await sendDirectMessage(user, payload.data);
  if (!result.ok) {
    return serviceResultToResponse(result);
  }

  const conversation = await getConversationAfterSend(user, result.data.conversationId);
  return Response.json(
    {
      conversationId: result.data.conversationId,
      conversation,
    },
    { status: result.status },
  );
}
