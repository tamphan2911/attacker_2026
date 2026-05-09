import { getCurrentDbUser } from "@/server/auth-helpers";
import { serviceResultToResponse, unauthorizedResponse } from "@/server/route-utils";
import { recallInvitation } from "@/server/team-service";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ invitationId: string }> },
) {
  const user = await getCurrentDbUser();
  if (!user) {
    return unauthorizedResponse();
  }

  const { invitationId } = await params;
  const result = await recallInvitation(user.id, invitationId);
  return serviceResultToResponse(result);
}
