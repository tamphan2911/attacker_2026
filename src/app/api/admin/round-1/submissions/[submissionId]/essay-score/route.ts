import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentDbUser, hasElevatedRole } from "@/server/auth-helpers";
import { updateRound1EssayScoreByAdmin } from "@/server/admin-service";

const essayScoreSchema = z.object({
  essayScore: z.number().min(0).max(28),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ submissionId: string }> },
) {
  const user = await getCurrentDbUser();
  if (!user || !hasElevatedRole(user.role)) {
    return NextResponse.json({ error: "Admin or moderator access required." }, { status: 403 });
  }

  const payload = essayScoreSchema.safeParse(await request.json().catch(() => null));
  if (!payload.success) {
    return NextResponse.json({ error: "Invalid essay score payload." }, { status: 400 });
  }

  const { submissionId } = await params;
  const result = await updateRound1EssayScoreByAdmin(submissionId, payload.data.essayScore);
  if (result.ok) {
    return NextResponse.json(result.data, { status: result.status });
  }

  return NextResponse.json({ error: result.error }, { status: result.status });
}
