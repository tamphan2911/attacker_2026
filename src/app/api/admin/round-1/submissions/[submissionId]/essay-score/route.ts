import { NextResponse } from "next/server";

import { getCurrentDbUser, hasAdminRole } from "@/server/auth-helpers";
import { clearAdminRound1EssayScore } from "@/server/admin-round1-exams";

export async function PATCH() {
  return NextResponse.json(
    { error: "Round 1 essay scores are entered only by the assigned judge." },
    { status: 403 },
  );
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ submissionId: string }> },
) {
  const user = await getCurrentDbUser();
  if (!user || !hasAdminRole(user.role)) {
    return NextResponse.json({ error: "Only admin accounts can delete Round 1 essay scores." }, { status: 403 });
  }

  const { submissionId } = await context.params;
  const result = await clearAdminRound1EssayScore(submissionId);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json(result.data, { status: result.status });
}
