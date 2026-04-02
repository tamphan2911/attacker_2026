import { getCurrentDbUser } from "@/server/auth-helpers";
import { unauthorizedResponse, serviceResultToResponse } from "@/server/route-utils";
import { initiateRound1TeamLock } from "@/server/team-service";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ teamId: string }> },
) {
  const user = await getCurrentDbUser();
  if (!user) {
    return unauthorizedResponse();
  }

  const { teamId } = await params;
  const result = await initiateRound1TeamLock(user.id, teamId);
  return serviceResultToResponse(result);
}
