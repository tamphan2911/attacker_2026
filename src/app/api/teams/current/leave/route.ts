import { getCurrentDbUser } from "@/server/auth-helpers";
import { unauthorizedResponse, serviceResultToResponse } from "@/server/route-utils";
import { leaveCurrentTeam } from "@/server/team-service";

export async function POST() {
  const user = await getCurrentDbUser();
  if (!user) {
    return unauthorizedResponse();
  }

  const result = await leaveCurrentTeam(user.id);
  return serviceResultToResponse(result);
}
