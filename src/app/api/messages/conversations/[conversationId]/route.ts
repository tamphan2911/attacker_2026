import { getCurrentDbUser } from "@/server/auth-helpers";
import { hideMessageConversation } from "@/server/message-service";
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
  const result = await hideMessageConversation(user.id, conversationId);
  return serviceResultToResponse(result);
}
