import { NextResponse } from "next/server";

import { listAdminMessageConversations } from "@/server/message-service";
import { getCurrentDbUser, hasElevatedRole } from "@/server/auth-helpers";

export async function GET() {
  const user = await getCurrentDbUser();
  if (!user || !hasElevatedRole(user.role)) {
    return NextResponse.json({ error: "Admin or moderator access required." }, { status: 403 });
  }

  return NextResponse.json(await listAdminMessageConversations(), { status: 200 });
}
