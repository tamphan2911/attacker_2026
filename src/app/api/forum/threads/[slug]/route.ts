import { NextResponse } from "next/server";

import { getForumThreadBySlug } from "@/server/forum-service";
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
