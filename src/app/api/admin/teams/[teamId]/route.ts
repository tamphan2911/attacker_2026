import { NextResponse } from "next/server";

import { deleteTeamByAdmin, updateTeamByAdmin } from "@/server/admin-service";
import { getCurrentDbUser, hasElevatedRole } from "@/server/auth-helpers";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ teamId: string }> },
) {
  const user = await getCurrentDbUser();
  if (!user || !hasElevatedRole(user.role)) {
    return NextResponse.json({ error: "Admin or moderator access required." }, { status: 403 });
  }

  const { teamId } = await params;
  const payload = await request.json().catch(() => null);
  if (!payload) {
    return NextResponse.json({ error: "Invalid team payload." }, { status: 400 });
  }

  const result = await updateTeamByAdmin(teamId, payload);
  if (result.ok) {
    return NextResponse.json(result.data, { status: result.status });
  }

  return NextResponse.json({ error: result.error }, { status: result.status });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ teamId: string }> },
) {
  const user = await getCurrentDbUser();
  if (!user || !hasElevatedRole(user.role)) {
    return NextResponse.json({ error: "Admin or moderator access required." }, { status: 403 });
  }

  const { teamId } = await params;
  const result = await deleteTeamByAdmin(teamId);
  if (result.ok) {
    return NextResponse.json(result.data, { status: result.status });
  }

  return NextResponse.json({ error: result.error }, { status: result.status });
}
