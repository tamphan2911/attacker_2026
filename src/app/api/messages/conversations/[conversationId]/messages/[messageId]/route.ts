import { getCurrentDbUser } from "@/server/auth-helpers";
import {
  deleteOwnDirectMessage,
  getConversationAfterSend,
} from "@/server/message-service";
import { serviceResultToResponse, unauthorizedResponse } from "@/server/route-utils";

interface RouteContext {
  params: Promise<{ conversationId: string; messageId: string }>;
}

export async function DELETE(_request: Request, context: RouteContext) {
  const user = await getCurrentDbUser();
  if (!user) {
    return unauthorizedResponse();
  }

  const { conversationId, messageId } = await context.params;
  const result = await deleteOwnDirectMessage(user, conversationId, messageId);
  if (!result.ok) {
    return serviceResultToResponse(result);
  }

  const conversation = await getConversationAfterSend(user, result.data.conversationId);
  return Response.json(
    {
      conversationId: result.data.conversationId,
      messageId: result.data.messageId,
      conversation,
    },
    { status: result.status },
  );
}
