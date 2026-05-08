import { NextResponse } from "next/server";

import { getCurrentDbUser, hasAdminRole } from "@/server/auth-helpers";
import { deleteRound2SubmissionByAdmin } from "@/server/admin-round2-submissions";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ submissionId: string }> },
) {
  const user = await getCurrentDbUser();
  if (!user || !hasAdminRole(user.role)) {
    return NextResponse.json({ error: "Only admin accounts can delete Round 2 submissions." }, { status: 403 });
  }

  const { submissionId } = await params;
  const result = await deleteRound2SubmissionByAdmin(submissionId);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json(result.data, { status: result.status });
}
