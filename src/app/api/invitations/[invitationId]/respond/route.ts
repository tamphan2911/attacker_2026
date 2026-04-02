import { z } from "zod";

import { getCurrentDbUser } from "@/server/auth-helpers";
import { unauthorizedResponse, serviceResultToResponse } from "@/server/route-utils";
import { respondToInvitation } from "@/server/team-service";

const invitationResponseSchema = z.object({
  decision: z.enum(["accept", "decline"]),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ invitationId: string }> },
) {
  const user = await getCurrentDbUser();
  if (!user) {
    return unauthorizedResponse();
  }

  const payload = invitationResponseSchema.safeParse(await request.json().catch(() => null));
  if (!payload.success) {
    return Response.json(
      { error: "Invalid invitation response payload.", issues: payload.error.flatten() },
      { status: 400 },
    );
  }

  const { invitationId } = await params;
  const result = await respondToInvitation(user.id, invitationId, payload.data.decision);
  return serviceResultToResponse(result);
}
