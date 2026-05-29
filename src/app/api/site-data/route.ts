import { NextResponse } from "next/server";

import { mergePageContentWithDefaults } from "@/data/site-content";
import { prisma } from "@/lib/db";
import { serializeNewsPost, serializeRound1TestBankMetadata } from "@/server/site-serializers";
import { getDefaultJudges, getDefaultPageContent, readRound1Topics, readStoredSponsors } from "@/server/admin-service";
import { readTimelineItems } from "@/server/timeline-items";

export async function GET() {
  const [cmsEntry, judgesEntry, sponsors, newsPosts, round1TestBanks, round1Topics, timelineItems] = await Promise.all([
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
      select: {
        id: true,
        slug: true,
        bankType: true,
        status: true,
        titleEn: true,
        titleVi: true,
        descriptionEn: true,
        descriptionVi: true,
        questionPoolSize: true,
        questionsPerAttempt: true,
        shuffleQuestions: true,
        shuffleOptions: true,
        durationMinutes: true,
        wordLimit: true,
        fixedEssayPromptEn: true,
        fixedEssayPromptVi: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "asc" },
    }),
    readRound1Topics(),
    readTimelineItems(),
  ]);

  return NextResponse.json(
    {
      pageContent: mergePageContentWithDefaults(cmsEntry ? JSON.parse(cmsEntry.payload) : getDefaultPageContent()),
      sponsors,
      judges: judgesEntry ? JSON.parse(judgesEntry.payload) : getDefaultJudges(),
      newsPosts: newsPosts.map(serializeNewsPost),
      round1TestBanks: round1TestBanks.map(serializeRound1TestBankMetadata),
      round1Topics,
      timelineItems,
    },
    { status: 200 },
  );
}
