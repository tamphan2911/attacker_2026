import { NextResponse } from "next/server";
import { z } from "zod";

import { hasAdminRole, getCurrentDbUser } from "@/server/auth-helpers";
import {
  deleteModeratorAccountByAdmin,
  updateModeratorAccountByAdmin,
} from "@/server/admin-service";

const updateModeratorSchema = z.object({
  loginId: z.string().trim().min(3).regex(/^[a-zA-Z0-9._-]+$/),
  name: z.string().trim().min(1),
  password: z.string().min(8).optional().or(z.literal("")),
  avatarImageSrc: z.string().trim().nullable().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const user = await getCurrentDbUser();
  if (!user || !hasAdminRole(user.role)) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const payload = updateModeratorSchema.safeParse(await request.json().catch(() => null));
  if (!payload.success) {
    return NextResponse.json(
      { error: "Invalid organizer account payload.", issues: payload.error.flatten() },
      { status: 400 },
    );
  }

  const { userId } = await params;
  const result = await updateModeratorAccountByAdmin(userId, {
    ...payload.data,
    password: payload.data.password?.trim() || undefined,
  });
  if (result.ok) {
    return NextResponse.json(result.data, { status: result.status });
  }

  return NextResponse.json({ error: result.error }, { status: result.status });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const user = await getCurrentDbUser();
  if (!user || !hasAdminRole(user.role)) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const { userId } = await params;
  const result = await deleteModeratorAccountByAdmin(userId);
  if (result.ok) {
    return NextResponse.json(result.data, { status: result.status });
  }

  return NextResponse.json({ error: result.error }, { status: result.status });
}
