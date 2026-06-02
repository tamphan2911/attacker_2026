import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentDbUser, hasElevatedRole } from "@/server/auth-helpers";
import {
  createRound2AiReportScoringJob,
  readRound2AiReportScoringOverview,
} from "@/server/round2-ai-report-scoring";

const payloadSchema = z.object({
  mode: z.enum(["run-all", "retry-failed"]).default("run-all"),
});

export async function GET() {
  const user = await getCurrentDbUser();
  if (!user || !hasElevatedRole(user.role)) {
    return NextResponse.json({ error: "Admin or moderator access required." }, { status: 403 });
  }

  return NextResponse.json({ overview: await readRound2AiReportScoringOverview() }, { status: 200 });
}

export async function POST(request: Request) {
  const user = await getCurrentDbUser();
  if (!user || !hasElevatedRole(user.role)) {
    return NextResponse.json({ error: "Admin or moderator access required." }, { status: 403 });
  }

  const payload = payloadSchema.safeParse(await request.json().catch(() => null));
  if (!payload.success) {
    return NextResponse.json({ error: "Invalid Round 2 GPT scoring request." }, { status: 400 });
  }

  const result = await createRound2AiReportScoringJob(payload.data.mode, user.id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json(result.data, { status: result.status });
}
