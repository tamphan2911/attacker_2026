import { NextResponse } from "next/server";

import { getCurrentDbUser } from "@/server/auth-helpers";
import { editForumThreadBodyForUser, getForumThreadBySlug } from "@/server/forum-service";
import { serializeForumThread } from "@/server/site-serializers";

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const thread = await getForumThreadBySlug(slug);

  if (!thread) {
    return NextResponse.json({ error: "Forum thread not found." }, { status: 404 });
  }

  return NextResponse.json(
    {
      thread: serializeForumThread(thread),
    },
    { status: 200 },
  );
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const user = await getCurrentDbUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to edit this forum thread." }, { status: 401 });
  }

  const { slug } = await context.params;
  const payload = (await request.json()) as {
    body?: string;
  };

  const result = await editForumThreadBodyForUser(user.id, slug, {
    body: payload.body ?? "",
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error, issues: result.issues }, { status: result.status });
  }

  return NextResponse.json(result.data, { status: result.status });
}
