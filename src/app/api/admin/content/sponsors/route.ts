import { NextResponse } from "next/server";

import { getCurrentDbUser, hasElevatedRole } from "@/server/auth-helpers";
import { saveSponsorsByAdmin } from "@/server/admin-service";
import type { SponsorProfile } from "@/types/site";

export async function PUT(request: Request) {
  const user = await getCurrentDbUser();
  if (!user || !hasElevatedRole(user.role)) {
    return NextResponse.json({ error: "Admin or moderator access required." }, { status: 403 });
  }

  const payload = (await request.json().catch(() => null)) as SponsorProfile[] | null;
  if (!payload || !Array.isArray(payload)) {
    return NextResponse.json({ error: "Invalid sponsor payload." }, { status: 400 });
  }

  const result = await saveSponsorsByAdmin(payload);
  if (result.ok) {
    return NextResponse.json(result.data, { status: result.status });
  }

  return NextResponse.json({ error: result.error }, { status: result.status });
}
