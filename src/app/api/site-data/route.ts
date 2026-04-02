import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { serializeNewsPost, serializeRound1TestBank } from "@/server/site-serializers";
import { getDefaultJudges, getDefaultPageContent } from "@/server/admin-service";

export async function GET() {
  const [cmsEntry, judgesEntry, newsPosts, round1TestBanks] = await Promise.all([
    prisma.cmsEntry.findUnique({
      where: { scope: "site-page-content" },
      select: { payload: true },
    }),
    prisma.cmsEntry.findUnique({
      where: { scope: "site-judges" },
      select: { payload: true },
    }),
    prisma.newsPost.findMany({
      orderBy: { publishedAt: "desc" },
    }),
    prisma.round1TestBank.findMany({
      orderBy: { createdAt: "asc" },
    }),
  ]);

  return NextResponse.json(
    {
      pageContent: cmsEntry ? JSON.parse(cmsEntry.payload) : getDefaultPageContent(),
      judges: judgesEntry ? JSON.parse(judgesEntry.payload) : getDefaultJudges(),
      newsPosts: newsPosts.map(serializeNewsPost),
      round1TestBanks: round1TestBanks.map(serializeRound1TestBank),
    },
    { status: 200 },
  );
}
