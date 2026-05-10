import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentDbUser, hasJudgeRole } from "@/server/auth-helpers";
import { saveJudgeTeamSubmissionReview } from "@/server/judge-service";

const payloadSchema = z.object({
  score: z.number().min(0).max(100).optional(),
  rubricScores: z.record(z.string(), z.number().min(0).max(100)).optional(),
  note: z.string().trim().max(2000).optional().default(""),
});

export async function PUT(
  request: Request,
  context: { params: Promise<{ submissionId: string }> },
) {
  const user = await getCurrentDbUser();
  if (!user || !hasJudgeRole(user.role)) {
    return NextResponse.json({ error: "Judge access required." }, { status: 403 });
  }

  const payload = payloadSchema.safeParse(await request.json().catch(() => null));
  if (!payload.success) {
    return NextResponse.json({ error: "Invalid review payload." }, { status: 400 });
  }

  const { submissionId } = await context.params;
  const result = await saveJudgeTeamSubmissionReview(user.id, submissionId, payload.data);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json(result.data, { status: result.status });
}
