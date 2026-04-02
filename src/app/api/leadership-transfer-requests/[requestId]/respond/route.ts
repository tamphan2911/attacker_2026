import { z } from "zod";

import { getCurrentDbUser } from "@/server/auth-helpers";
import { unauthorizedResponse, serviceResultToResponse } from "@/server/route-utils";
import { respondToLeadershipTransfer } from "@/server/team-service";

const transferResponseSchema = z.object({
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

  const payload = transferResponseSchema.safeParse(await request.json().catch(() => null));
  if (!payload.success) {
    return Response.json(
      { error: "Invalid leadership-transfer response payload.", issues: payload.error.flatten() },
      { status: 400 },
    );
  }

  const { requestId } = await params;
  const result = await respondToLeadershipTransfer(user.id, requestId, payload.data.decision);
  return serviceResultToResponse(result);
}
