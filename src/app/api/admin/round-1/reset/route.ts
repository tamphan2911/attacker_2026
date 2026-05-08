import { NextResponse } from "next/server";

import { getCurrentDbUser, hasAdminRole } from "@/server/auth-helpers";
import { resetRound1SubmissionsToCanonicalSeed } from "@/server/admin-round1-reset";

export async function POST() {
  const user = await getCurrentDbUser();
  if (!user || !hasAdminRole(user.role)) {
    return NextResponse.json({ error: "Only admin accounts can reset Round 1 submissions." }, { status: 403 });
  }

  try {
    const result = await resetRound1SubmissionsToCanonicalSeed();
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not reset Round 1 submissions.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
