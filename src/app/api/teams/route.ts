import { z } from "zod";

import { getCurrentDbUser } from "@/server/auth-helpers";
import { unauthorizedResponse, serviceResultToResponse } from "@/server/route-utils";
import { createTeamForUser } from "@/server/team-service";

const createTeamSchema = z.object({
  name: z.string().trim().min(1),
  tag: z.string().trim().min(1).max(8),
  avatarTone: z.string().trim().min(1),
  avatarImageSrc: z.string().trim().nullable().optional(),
  track: z.string().trim().min(1),
  bio: z.string().trim().min(1),
});

export async function POST(request: Request) {
  const user = await getCurrentDbUser();
  if (!user) {
    return unauthorizedResponse();
  }

  const payload = createTeamSchema.safeParse(await request.json().catch(() => null));
  if (!payload.success) {
    return Response.json(
      { error: "Invalid create-team payload.", issues: payload.error.flatten() },
      { status: 400 },
    );
  }

  const result = await createTeamForUser(user.id, payload.data);
  return serviceResultToResponse(result);
}
