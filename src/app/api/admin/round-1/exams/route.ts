import { NextResponse } from "next/server";

import { getCurrentDbUser, hasElevatedRole } from "@/server/auth-helpers";
import { readAdminRound1ExamRows } from "@/server/admin-round1-exams";

export async function GET() {
  const user = await getCurrentDbUser();
  if (!user || !hasElevatedRole(user.role)) {
    return NextResponse.json({ error: "Admin or moderator access required." }, { status: 403 });
  }

  return NextResponse.json({ exams: await readAdminRound1ExamRows() }, { status: 200 });
}
