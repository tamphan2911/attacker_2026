import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { getCurrentDbUser, hasElevatedRole } from "@/server/auth-helpers";
import { serializeRound1TestBank } from "@/server/site-serializers";

export async function GET() {
  const user = await getCurrentDbUser();
  if (!user || !hasElevatedRole(user.role)) {
    return NextResponse.json({ error: "Admin or moderator access required." }, { status: 403 });
  }

  const banks = await prisma.round1TestBank.findMany({
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(
    {
      round1TestBanks: banks.map(serializeRound1TestBank),
    },
    { status: 200 },
  );
}
