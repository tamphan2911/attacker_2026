import { NextResponse } from "next/server";

import { getCurrentDbUser, hasElevatedRole } from "@/server/auth-helpers";
import { readAdminRound1ExamDetail } from "@/server/admin-round1-exams";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const user = await getCurrentDbUser();
  if (!user || !hasElevatedRole(user.role)) {
    return NextResponse.json({ error: "Admin or moderator access required." }, { status: 403 });
  }

  const { userId } = await params;
  const detail = await readAdminRound1ExamDetail(userId);
  if (!detail) {
    return NextResponse.json({ error: "Round 1 exam record not found." }, { status: 404 });
  }

  return NextResponse.json({ exam: detail }, { status: 200 });
}
