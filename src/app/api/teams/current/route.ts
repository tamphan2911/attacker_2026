import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentDbUser } from "@/server/auth-helpers";
import { unauthorizedResponse } from "@/server/route-utils";
import { updateCurrentTeamProfile } from "@/server/team-service";

const updateCurrentTeamSchema = z.object({
  name: z.string().trim().min(1),
  tag: z.string().trim().min(1).max(8),
  avatarTone: z.string().trim().min(1),
  avatarImageSrc: z.string().trim().optional(),
  track: z.string().trim().min(1),
  bio: z.string().trim().min(1),
});

export async function PATCH(request: Request) {
  const user = await getCurrentDbUser();
  if (!user) {
    return unauthorizedResponse();
  }

  const payload = updateCurrentTeamSchema.safeParse(await request.json().catch(() => null));
  if (!payload.success) {
    return NextResponse.json(
      { error: "Invalid team payload.", issues: payload.error.flatten() },
      { status: 400 },
    );
  }

  const result = await updateCurrentTeamProfile(user.id, payload.data);
  if (result.ok) {
    return NextResponse.json(result.data, { status: result.status });
  }

  return NextResponse.json({ error: result.error }, { status: result.status });
}
