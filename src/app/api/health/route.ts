import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    await prisma.$queryRawUnsafe("SELECT 1");

    return NextResponse.json(
      {
        ok: true,
        timestamp: new Date().toISOString(),
      },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      {
        ok: false,
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    );
  }
}
