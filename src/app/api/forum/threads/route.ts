import { NextResponse } from "next/server";

import { getCurrentDbUser } from "@/server/auth-helpers";
import { createForumThreadForUser, listForumThreads } from "@/server/forum-service";
import { serializeForumThread } from "@/server/site-serializers";

export async function GET() {
  const threads = await listForumThreads();

  return NextResponse.json(
    {
      threads: threads.map(serializeForumThread),
    },
    { status: 200 },
  );
}

export async function POST(request: Request) {
  const user = await getCurrentDbUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to create a forum thread." }, { status: 401 });
  }

  const payload = (await request.json()) as {
    title?: string;
    summary?: string;
    body?: string;
    category?: string;
    preferredRoles?: string[];
    contactNote?: string;
  };

  const result = await createForumThreadForUser(user.id, {
    title: payload.title ?? "",
    summary: payload.summary ?? "",
    body: payload.body ?? "",
    category: payload.category ?? "",
    preferredRoles: payload.preferredRoles ?? [],
    contactNote: payload.contactNote ?? "",
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error, issues: result.issues }, { status: result.status });
  }

  return NextResponse.json(result.data, { status: result.status });
}
