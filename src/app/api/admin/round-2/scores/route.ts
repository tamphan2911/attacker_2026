import { NextResponse } from "next/server";

import { getCurrentDbUser, hasElevatedRole } from "@/server/auth-helpers";
import { readAdminRound2ScoreRows } from "@/server/admin-round2-scores";

export async function GET() {
  const user = await getCurrentDbUser();
  if (!user || !hasElevatedRole(user.role)) {
    return NextResponse.json({ error: "Admin or moderator access required." }, { status: 403 });
  }

  return NextResponse.json({ scores: await readAdminRound2ScoreRows() }, { status: 200 });
}
