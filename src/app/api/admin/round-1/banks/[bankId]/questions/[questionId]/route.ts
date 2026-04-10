import { NextResponse } from "next/server";

import { getCurrentDbUser, hasElevatedRole } from "@/server/auth-helpers";
import { deleteRound1QuestionByAdmin, updateRound1QuestionByAdmin } from "@/server/admin-service";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ bankId: string; questionId: string }> },
) {
  const user = await getCurrentDbUser();
  if (!user || !hasElevatedRole(user.role)) {
    return NextResponse.json({ error: "Admin or moderator access required." }, { status: 403 });
  }

  const { bankId, questionId } = await params;
  const payload = await request.json().catch(() => null);
  if (!payload) {
    return NextResponse.json({ error: "Invalid Round 1 question payload." }, { status: 400 });
  }

  const result = await updateRound1QuestionByAdmin(bankId, questionId, payload);
  if (result.ok) {
    return NextResponse.json(result.data, { status: result.status });
  }

  return NextResponse.json({ error: result.error }, { status: result.status });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ bankId: string; questionId: string }> },
) {
  const user = await getCurrentDbUser();
  if (!user || !hasElevatedRole(user.role)) {
    return NextResponse.json({ error: "Admin or moderator access required." }, { status: 403 });
  }

  const { bankId, questionId } = await params;
  const result = await deleteRound1QuestionByAdmin(bankId, questionId);
  if (result.ok) {
    return NextResponse.json(result.data, { status: result.status });
  }

  return NextResponse.json({ error: result.error }, { status: result.status });
}
