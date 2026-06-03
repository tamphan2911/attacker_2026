import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentDbUser, hasAdminRole } from "@/server/auth-helpers";
import {
  createEmergingAiReportScoringJob,
  readEmergingAiReportScoringOverview,
} from "@/server/emerging-ai-report-scoring";

const payloadSchema = z.object({
  mode: z.enum(["run-all", "retry-failed"]),
});

export async function GET() {
  const user = await getCurrentDbUser();
  if (!user || !hasAdminRole(user.role)) {
    return NextResponse.json({ error: "Only admin accounts can view Emerging GPT scoring." }, { status: 403 });
  }

  return NextResponse.json({ overview: await readEmergingAiReportScoringOverview() }, { status: 200 });
}

export async function POST(request: Request) {
  const user = await getCurrentDbUser();
  if (!user || !hasAdminRole(user.role)) {
    return NextResponse.json({ error: "Only admin accounts can start Emerging GPT scoring." }, { status: 403 });
  }

  const payload = payloadSchema.safeParse(await request.json().catch(() => null));
  if (!payload.success) {
    return NextResponse.json({ error: "Invalid Emerging GPT scoring mode." }, { status: 400 });
  }

  const result = await createEmergingAiReportScoringJob(payload.data.mode, user.id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json(result.data, { status: result.status });
}
