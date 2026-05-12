import { getCurrentDbUser } from "@/server/auth-helpers";
import { markConversationRead } from "@/server/message-service";
import { serviceResultToResponse, unauthorizedResponse } from "@/server/route-utils";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ conversationId: string }> },
) {
  const user = await getCurrentDbUser();
  if (!user) {
    return unauthorizedResponse();
  }

  const { conversationId } = await params;
  const result = await markConversationRead(user, conversationId);
  return serviceResultToResponse(result);
}
