import { z } from "zod";

import { getCurrentDbUser } from "@/server/auth-helpers";
import { unauthorizedResponse, serviceResultToResponse } from "@/server/route-utils";
import { kickTeamMember } from "@/server/team-service";

const kickMemberSchema = z.object({
  reason: z.string().trim().min(1, "A removal reason is required.").max(1000),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ teamId: string; memberId: string }> },
) {
  const user = await getCurrentDbUser();
  if (!user) {
    return unauthorizedResponse();
  }

  const payload = kickMemberSchema.safeParse(await request.json().catch(() => null));
  if (!payload.success) {
    return Response.json(
      { error: "Invalid member-removal payload.", issues: payload.error.flatten() },
      { status: 400 },
    );
  }

  const { teamId, memberId } = await params;
  const result = await kickTeamMember(user.id, teamId, memberId, payload.data.reason);
  return serviceResultToResponse(result);
}
