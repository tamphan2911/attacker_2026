import { NextResponse } from "next/server";

import { getCurrentDbUser, hasElevatedRole } from "@/server/auth-helpers";
import { deleteJudgeByAdmin, updateJudgeByAdmin } from "@/server/admin-service";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ judgeId: string }> },
) {
  const user = await getCurrentDbUser();
  if (!user || !hasElevatedRole(user.role)) {
    return NextResponse.json({ error: "Admin or moderator access required." }, { status: 403 });
  }

  const { judgeId } = await params;
  const payload = await request.json().catch(() => null);
  if (!payload) {
    return NextResponse.json({ error: "Invalid judge payload." }, { status: 400 });
  }

  const result = await updateJudgeByAdmin(judgeId, payload);
  if (result.ok) {
    return NextResponse.json(result.data, { status: result.status });
  }

  return NextResponse.json({ error: result.error }, { status: result.status });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ judgeId: string }> },
) {
  const user = await getCurrentDbUser();
  if (!user || !hasElevatedRole(user.role)) {
    return NextResponse.json({ error: "Admin or moderator access required." }, { status: 403 });
  }

  const { judgeId } = await params;
  const result = await deleteJudgeByAdmin(judgeId);
  if (result.ok) {
    return NextResponse.json(result.data, { status: result.status });
  }

  return NextResponse.json({ error: result.error }, { status: result.status });
}
