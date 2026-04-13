import { NextResponse } from "next/server";

import { getCurrentDbUser } from "@/server/auth-helpers";
import { closeForumThreadForUser } from "@/server/forum-service";

export async function POST(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const user = await getCurrentDbUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to close this forum thread." }, { status: 401 });
  }

  const { slug } = await context.params;
  const result = await closeForumThreadForUser(user.id, slug);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json(result.data, { status: result.status });
}
