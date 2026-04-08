import { NextResponse } from "next/server";
import { z } from "zod";

import { hasAdminRole, getCurrentDbUser } from "@/server/auth-helpers";
import { createOrganizerAccountByAdmin } from "@/server/admin-service";

const createOrganizerSchema = z.object({
  loginId: z.string().trim().min(3).regex(/^[a-zA-Z0-9._-]+$/),
  name: z.string().trim().min(1),
  password: z.string().min(8),
  role: z.enum(["admin", "moderator"]),
  avatarImageSrc: z.string().trim().optional(),
});

export async function POST(request: Request) {
  const user = await getCurrentDbUser();
  if (!user || !hasAdminRole(user.role)) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const payload = createOrganizerSchema.safeParse(await request.json().catch(() => null));
  if (!payload.success) {
    return NextResponse.json(
      { error: "Invalid organizer account payload.", issues: payload.error.flatten() },
      { status: 400 },
    );
  }

  const result = await createOrganizerAccountByAdmin(payload.data);
  if (result.ok) {
    return NextResponse.json(result.data, { status: result.status });
  }

  return NextResponse.json({ error: result.error }, { status: result.status });
}
