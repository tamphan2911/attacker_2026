import { NextResponse } from "next/server";

import { getCurrentDbUser, hasElevatedRole } from "@/server/auth-helpers";
import { deleteForumThreadByAdmin } from "@/server/forum-service";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const user = await getCurrentDbUser();
  if (!user || !hasElevatedRole(user.role)) {
    return NextResponse.json({ error: "Admin or moderator access required." }, { status: 403 });
  }

  const { slug } = await context.params;
  const result = await deleteForumThreadByAdmin(slug);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json(result.data, { status: result.status });
}
