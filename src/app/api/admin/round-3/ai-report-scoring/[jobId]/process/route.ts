import { NextResponse } from "next/server";

import { getCurrentDbUser, hasAdminRole } from "@/server/auth-helpers";
import { processNextEmergingAiReportScoringJobItem } from "@/server/emerging-ai-report-scoring";

export async function POST(
  _request: Request,
  context: { params: Promise<{ jobId: string }> },
) {
  const user = await getCurrentDbUser();
  if (!user || !hasAdminRole(user.role)) {
    return NextResponse.json({ error: "Only admin accounts can process Emerging GPT scoring." }, { status: 403 });
  }

  const { jobId } = await context.params;
  const result = await processNextEmergingAiReportScoringJobItem(jobId);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json(result.data, { status: result.status });
}
