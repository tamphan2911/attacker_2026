import { unstable_cache } from "next/cache";

import { mergePageContentWithDefaults } from "@/data/site-content";
import { prisma } from "@/lib/db";
import {
  getDefaultJudges,
  getDefaultPageContent,
  readRound1Topics,
  readStoredSponsors,
} from "@/server/admin-service";
import {
  SITE_DATA_CACHE_SECONDS,
  SITE_DATA_CACHE_TAG,
} from "@/server/site-data-cache";
import {
  serializeNewsPost,
  serializeRound1TestBankMetadata,
} from "@/server/site-serializers";
import { readTimelineItems } from "@/server/timeline-items";

async function readSiteDataFromDatabase() {
  const [cmsEntry, judgesEntry, sponsors, newsPosts, round1TestBanks, round1Topics, timelineItems] =
    await Promise.all([
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

  return {
    pageContent: mergePageContentWithDefaults(cmsEntry ? JSON.parse(cmsEntry.payload) : getDefaultPageContent()),
    sponsors,
    judges: judgesEntry ? JSON.parse(judgesEntry.payload) : getDefaultJudges(),
    newsPosts: newsPosts.map(serializeNewsPost),
    round1TestBanks: round1TestBanks.map(serializeRound1TestBankMetadata),
    round1Topics,
    timelineItems,
  };
}

export const readCachedSiteData = unstable_cache(
  readSiteDataFromDatabase,
  ["site-data"],
  {
    revalidate: SITE_DATA_CACHE_SECONDS,
    tags: [SITE_DATA_CACHE_TAG],
  },
);
