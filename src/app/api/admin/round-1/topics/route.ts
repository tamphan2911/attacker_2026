import { NextResponse } from "next/server";

import { saveRound1TopicsByAdmin } from "@/server/admin-service";
import { getCurrentDbUser, hasAdminRole } from "@/server/auth-helpers";

type Round1TopicsPayload =
  | string[]
  | {
      topics?: string[];
      rename?: {
        from?: string;
        to?: string;
      };
    };

export async function PUT(request: Request) {
  const user = await getCurrentDbUser();
  if (!user || !hasAdminRole(user.role)) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const payload = (await request.json().catch(() => null)) as Round1TopicsPayload | null;
  const topics = Array.isArray(payload) ? payload : payload?.topics;

  if (!Array.isArray(topics)) {
    return NextResponse.json({ error: "Invalid Round 1 topics payload." }, { status: 400 });
  }

  const rename = !Array.isArray(payload)
    ? {
        from: payload?.rename?.from ?? "",
        to: payload?.rename?.to ?? "",
      }
    : undefined;
  const result = await saveRound1TopicsByAdmin(topics, { rename });

  if (result.ok) {
    return NextResponse.json(result.data, { status: result.status });
  }

  return NextResponse.json({ error: result.error }, { status: result.status });
}
