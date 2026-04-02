import { z } from "zod";

import { getCurrentDbUser } from "@/server/auth-helpers";
import { unauthorizedResponse, serviceResultToResponse } from "@/server/route-utils";
import { transferLeadership } from "@/server/team-service";

const transferSchema = z.object({
  nextLeaderId: z.string().trim().min(1),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ teamId: string }> },
) {
  const user = await getCurrentDbUser();
  if (!user) {
    return unauthorizedResponse();
  }

  const payload = transferSchema.safeParse(await request.json().catch(() => null));
  if (!payload.success) {
    return Response.json(
      { error: "Invalid leadership-transfer payload.", issues: payload.error.flatten() },
      { status: 400 },
    );
  }

  const { teamId } = await params;
  const result = await transferLeadership(user.id, teamId, payload.data.nextLeaderId);
  return serviceResultToResponse(result);
}
