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

  try {
    return NextResponse.json({ overview: await readEmergingAiReportScoringOverview() }, { status: 200 });
  } catch (error) {
    console.error("[admin/round-3/ai-report-scoring] Failed to load Emerging GPT scoring overview", error);
    const detail = error instanceof Error ? error.message : "Unknown server error.";

    return NextResponse.json(
      {
        error: `Could not load Emerging GPT scoring progress. Server detail: ${detail}`,
      },
      { status: 500 },
    );
  }
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

  try {
    const result = await createEmergingAiReportScoringJob(payload.data.mode, user.id);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json(result.data, { status: result.status });
  } catch (error) {
    console.error("[admin/round-3/ai-report-scoring] Failed to start Emerging GPT scoring", error);
    const detail = error instanceof Error ? error.message : "Unknown server error.";

    return NextResponse.json(
      {
        error: `Could not start Emerging GPT scoring. Server detail: ${detail}`,
      },
      { status: 500 },
    );
  }
}
