import { z } from "zod";

import { getCurrentDbUser } from "@/server/auth-helpers";
import { unauthorizedResponse, serviceResultToResponse } from "@/server/route-utils";
import { inviteUserToTeam } from "@/server/team-service";

const inviteSchema = z.object({
  userId: z.string().trim().min(1),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ teamId: string }> },
) {
  const user = await getCurrentDbUser();
  if (!user) {
    return unauthorizedResponse();
  }

  const payload = inviteSchema.safeParse(await request.json().catch(() => null));
  if (!payload.success) {
    return Response.json(
      { error: "Invalid invite payload.", issues: payload.error.flatten() },
      { status: 400 },
    );
  }

  const { teamId } = await params;
  const result = await inviteUserToTeam(user.id, teamId, payload.data.userId);
  return serviceResultToResponse(result);
}
