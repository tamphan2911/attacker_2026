import { z } from "zod";

import { getCurrentDbUser } from "@/server/auth-helpers";
import { unauthorizedResponse, serviceResultToResponse } from "@/server/route-utils";
import { respondToRound1TeamLock } from "@/server/team-service";

const round1LockResponseSchema = z.object({
  decision: z.enum(["accept", "decline"]),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ requestId: string }> },
) {
  const user = await getCurrentDbUser();
  if (!user) {
    return unauthorizedResponse();
  }

  const payload = round1LockResponseSchema.safeParse(await request.json().catch(() => null));
  if (!payload.success) {
    return Response.json(
      { error: "Invalid team-lock response payload.", issues: payload.error.flatten() },
      { status: 400 },
    );
  }

  const { requestId } = await params;
  const result = await respondToRound1TeamLock(user.id, requestId, payload.data.decision);
  return serviceResultToResponse(result);
}
