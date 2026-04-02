import { NextResponse } from "next/server";

import { getCurrentDbUser } from "@/server/auth-helpers";
import { createForumReplyForUser } from "@/server/forum-service";

export async function POST(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const user = await getCurrentDbUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to reply on the forum." }, { status: 401 });
  }

  const { slug } = await context.params;
  const payload = (await request.json()) as {
    body?: string;
  };

  const result = await createForumReplyForUser(user.id, slug, {
    body: payload.body ?? "",
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json(result.data, { status: result.status });
}
