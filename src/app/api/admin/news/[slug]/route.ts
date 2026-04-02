import { NextResponse } from "next/server";

import { getCurrentDbUser, hasElevatedRole } from "@/server/auth-helpers";
import { deleteNewsPostByAdmin, updateNewsPostByAdmin } from "@/server/admin-service";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const user = await getCurrentDbUser();
  if (!user || !hasElevatedRole(user.role)) {
    return NextResponse.json({ error: "Admin or moderator access required." }, { status: 403 });
  }

  const { slug } = await params;
  const payload = await request.json().catch(() => null);
  if (!payload) {
    return NextResponse.json({ error: "Invalid news payload." }, { status: 400 });
  }

  const result = await updateNewsPostByAdmin(slug, payload);
  if (result.ok) {
    return NextResponse.json(result.data, { status: result.status });
  }

  return NextResponse.json({ error: result.error }, { status: result.status });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const user = await getCurrentDbUser();
  if (!user || !hasElevatedRole(user.role)) {
    return NextResponse.json({ error: "Admin or moderator access required." }, { status: 403 });
  }

  const { slug } = await params;
  const result = await deleteNewsPostByAdmin(slug);
  if (result.ok) {
    return NextResponse.json(result.data, { status: result.status });
  }

  return NextResponse.json({ error: result.error }, { status: result.status });
}
