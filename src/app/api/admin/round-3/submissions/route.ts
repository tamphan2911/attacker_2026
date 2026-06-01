import { NextResponse } from "next/server";
import { z } from "zod";

import {
  readAdminRound3SubmissionRows,
  saveAdminRound3FinalScore,
} from "@/server/admin-round3-submissions";
import { getCurrentDbUser, hasElevatedRole } from "@/server/auth-helpers";

const scoreSchema = z.object({
  teamId: z.string().min(1),
  finalScore: z.number().min(0).max(100).nullable(),
});

export async function GET() {
  const user = await getCurrentDbUser();
  if (!user || !hasElevatedRole(user.role)) {
    return NextResponse.json({ error: "Admin or moderator access required." }, { status: 403 });
  }

  return NextResponse.json(await readAdminRound3SubmissionRows(), { status: 200 });
}

export async function PATCH(request: Request) {
  const user = await getCurrentDbUser();
  if (!user || !hasElevatedRole(user.role)) {
    return NextResponse.json({ error: "Admin or moderator access required." }, { status: 403 });
  }

  const payload = scoreSchema.safeParse(await request.json().catch(() => null));
  if (!payload.success) {
    return NextResponse.json({ error: "Invalid final score payload." }, { status: 400 });
  }

  const result = await saveAdminRound3FinalScore(payload.data.teamId, payload.data.finalScore);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json(result.data, { status: result.status });
}
