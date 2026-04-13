import { NextResponse } from "next/server";

import { getCurrentDbUser } from "@/server/auth-helpers";
import { deleteForumReplyForUser, editForumReplyForUser } from "@/server/forum-service";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ slug: string; replyId: string }> },
) {
  const user = await getCurrentDbUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to edit this forum reply." }, { status: 401 });
  }

  const { slug, replyId } = await context.params;
  const payload = (await request.json()) as {
    body?: string;
  };

  const result = await editForumReplyForUser(user.id, slug, replyId, {
    body: payload.body ?? "",
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error, issues: result.issues }, { status: result.status });
  }

  return NextResponse.json(result.data, { status: result.status });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ slug: string; replyId: string }> },
) {
  const user = await getCurrentDbUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to delete this forum reply." }, { status: 401 });
  }

  const { slug, replyId } = await context.params;
  const result = await deleteForumReplyForUser(user.id, slug, replyId);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json(result.data, { status: result.status });
}
