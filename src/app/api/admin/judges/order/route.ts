import { NextResponse } from "next/server";

import { getCurrentDbUser, hasElevatedRole } from "@/server/auth-helpers";
import { reorderJudgesByAdmin } from "@/server/admin-service";

export async function PATCH(request: Request) {
  const user = await getCurrentDbUser();
  if (!user || !hasElevatedRole(user.role)) {
    return NextResponse.json({ error: "Admin or moderator access required." }, { status: 403 });
  }

  const payload = (await request.json().catch(() => null)) as { judgeIds?: unknown } | null;
  if (!payload || !Array.isArray(payload.judgeIds)) {
    return NextResponse.json({ error: "Invalid judge order payload." }, { status: 400 });
  }

  const result = await reorderJudgesByAdmin(
    payload.judgeIds.filter((judgeId): judgeId is string => typeof judgeId === "string"),
  );
  if (result.ok) {
    return NextResponse.json(result.data, { status: result.status });
  }

  return NextResponse.json({ error: result.error }, { status: result.status });
}
