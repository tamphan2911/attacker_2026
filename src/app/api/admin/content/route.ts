import { NextResponse } from "next/server";

import { getCurrentDbUser, hasElevatedRole } from "@/server/auth-helpers";
import { savePageContentByAdmin } from "@/server/admin-service";

export async function PUT(request: Request) {
  const user = await getCurrentDbUser();
  if (!user || !hasElevatedRole(user.role)) {
    return NextResponse.json({ error: "Admin or moderator access required." }, { status: 403 });
  }

  const payload = await request.json().catch(() => null);
  if (!payload) {
    return NextResponse.json({ error: "Invalid content payload." }, { status: 400 });
  }

  const pageContent = payload.pageContent ?? payload;
  const scope = typeof payload.scope === "string" ? payload.scope : undefined;
  const result = await savePageContentByAdmin(pageContent, scope);
  if (result.ok) {
    return NextResponse.json(result.data, { status: result.status });
  }

  return NextResponse.json({ error: result.error }, { status: result.status });
}
