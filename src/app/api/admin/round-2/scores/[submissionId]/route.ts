import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentDbUser, hasAdminRole, hasElevatedRole } from "@/server/auth-helpers";
import { deleteAdminRound2ScoreRow, saveAdminRound2ScoreRow } from "@/server/admin-round2-scores";

const payloadSchema = z.object({
  judges: z
    .array(
      z.object({
        judgeUserId: z.string().trim().min(1),
        score: z.number().min(0).max(100).nullable().optional(),
      }),
    )
    .length(2),
});

export async function PUT(
  request: Request,
  context: { params: Promise<{ submissionId: string }> },
) {
  const user = await getCurrentDbUser();
  if (!user || !hasElevatedRole(user.role)) {
    return NextResponse.json({ error: "Admin or moderator access required." }, { status: 403 });
  }

  const payload = payloadSchema.safeParse(await request.json().catch(() => null));
  if (!payload.success) {
    return NextResponse.json({ error: "Invalid Round 2 score payload." }, { status: 400 });
  }

  const { submissionId } = await context.params;
  const result = await saveAdminRound2ScoreRow(submissionId, payload.data);
  return NextResponse.json({ error: result.error }, { status: result.status });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ submissionId: string }> },
) {
  const user = await getCurrentDbUser();
  if (!user || !hasAdminRole(user.role)) {
    return NextResponse.json({ error: "Only admin accounts can delete Round 2 scores." }, { status: 403 });
  }

  const { submissionId } = await context.params;
  const result = await deleteAdminRound2ScoreRow(submissionId);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json(result.data, { status: result.status });
}
