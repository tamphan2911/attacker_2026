import { NextResponse } from "next/server";

import { readAdminRound3SubmissionRows } from "@/server/admin-round3-submissions";
import { getCurrentDbUser, hasElevatedRole } from "@/server/auth-helpers";

export async function GET() {
  const user = await getCurrentDbUser();
  if (!user || !hasElevatedRole(user.role)) {
    return NextResponse.json({ error: "Admin or moderator access required." }, { status: 403 });
  }

  return NextResponse.json(await readAdminRound3SubmissionRows(), { status: 200 });
}
