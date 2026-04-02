import { NextResponse } from "next/server";

import { getCurrentDbUser, hasElevatedRole } from "@/server/auth-helpers";
import { readSystemEmailTemplates, saveSystemEmailTemplates } from "@/server/system-email-templates";

export async function GET() {
  const user = await getCurrentDbUser();
  if (!user || !hasElevatedRole(user.role)) {
    return NextResponse.json({ error: "Admin or moderator access required." }, { status: 403 });
  }

  return NextResponse.json(
    { templates: await readSystemEmailTemplates() },
    { status: 200 },
  );
}

export async function PUT(request: Request) {
  const user = await getCurrentDbUser();
  if (!user || !hasElevatedRole(user.role)) {
    return NextResponse.json({ error: "Admin or moderator access required." }, { status: 403 });
  }

  const payload = await request.json().catch(() => null);
  if (!payload) {
    return NextResponse.json({ error: "Invalid email template payload." }, { status: 400 });
  }

  await saveSystemEmailTemplates(payload);
  return NextResponse.json({ saved: true }, { status: 200 });
}
