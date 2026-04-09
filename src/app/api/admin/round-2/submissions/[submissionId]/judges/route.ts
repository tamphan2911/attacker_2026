import { NextResponse } from "next/server";

import { getCurrentDbUser, hasElevatedRole } from "@/server/auth-helpers";
import { assignJudgesToRound2Submission } from "@/server/admin-round2-submissions";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ submissionId: string }> },
) {
  const user = await getCurrentDbUser();
  if (!user || !hasElevatedRole(user.role)) {
    return NextResponse.json({ error: "Admin or moderator access required." }, { status: 403 });
  }

  const payload = (await request.json().catch(() => null)) as { judgeUserIds?: string[] } | null;
  if (!payload?.judgeUserIds || !Array.isArray(payload.judgeUserIds)) {
    return NextResponse.json({ error: "Invalid judge assignment payload." }, { status: 400 });
  }

  const { submissionId } = await params;
  const result = await assignJudgesToRound2Submission(submissionId, payload.judgeUserIds);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json(result.data, { status: result.status });
}
