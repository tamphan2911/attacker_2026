import { z } from "zod";

import { getCurrentDbUser } from "@/server/auth-helpers";
import { hideMessageConversation, revealConversationEmail } from "@/server/message-service";
import { serviceResultToResponse, unauthorizedResponse } from "@/server/route-utils";

interface RouteContext {
  params: Promise<{ conversationId: string }>;
}

export async function DELETE(_request: Request, context: RouteContext) {
  const user = await getCurrentDbUser();
  if (!user) {
    return unauthorizedResponse();
  }

  const { conversationId } = await context.params;
  const result = await hideMessageConversation(user, conversationId);
  return serviceResultToResponse(result);
}

const updateConversationSchema = z.object({
  showOtherEmail: z.boolean().optional(),
});

export async function PATCH(request: Request, context: RouteContext) {
  const user = await getCurrentDbUser();
  if (!user) {
    return unauthorizedResponse();
  }

  const payload = updateConversationSchema.safeParse(await request.json().catch(() => null));
  if (!payload.success) {
    return Response.json(
      { error: "Invalid conversation update payload.", issues: payload.error.flatten() },
      { status: 400 },
    );
  }

  const { conversationId } = await context.params;
  const result = payload.data.showOtherEmail
    ? await revealConversationEmail(user, conversationId)
    : { ok: true as const, status: 200, data: { conversationId } };
  return serviceResultToResponse(result);
}
