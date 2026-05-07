import { NextResponse } from "next/server";

import { mergePageContentWithDefaults } from "@/data/site-content";
import { prisma } from "@/lib/db";
import { serializeNewsPost, serializeRound1TestBank } from "@/server/site-serializers";
import { getDefaultJudges, getDefaultPageContent, readStoredSponsors } from "@/server/admin-service";
import { readTimelineItems } from "@/server/timeline-items";

export async function GET() {
  const [cmsEntry, judgesEntry, sponsors, newsPosts, round1TestBanks, timelineItems] = await Promise.all([
    prisma.cmsEntry.findUnique({
      where: { scope: "site-page-content" },
      select: { payload: true },
    }),
    prisma.cmsEntry.findUnique({
      where: { scope: "site-judges" },
      select: { payload: true },
    }),
    readStoredSponsors(),
    prisma.newsPost.findMany({
      orderBy: { publishedAt: "desc" },
    }),
    prisma.round1TestBank.findMany({
      orderBy: { createdAt: "asc" },
    }),
    readTimelineItems(),
  ]);

  return NextResponse.json(
    {
      pageContent: mergePageContentWithDefaults(cmsEntry ? JSON.parse(cmsEntry.payload) : getDefaultPageContent()),
      sponsors,
      judges: judgesEntry ? JSON.parse(judgesEntry.payload) : getDefaultJudges(),
      newsPosts: newsPosts.map(serializeNewsPost),
      round1TestBanks: round1TestBanks.map(serializeRound1TestBank),
      timelineItems,
    },
    { status: 200 },
  );
}
