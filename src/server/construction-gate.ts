import { cookies } from "next/headers";

import {
  getTimelineItemById,
  isWebsiteAnnouncementReleased,
  WEBSITE_ANNOUNCEMENT_TIMELINE_ID,
} from "@/lib/competition";
import { defaultPageContent, timelineItems as defaultTimelineItems } from "@/data/site-content";
import { getTimelineStartDateTime } from "@/lib/timeline-dates";
import { readPageContent } from "@/server/admin-service";
import { readTimelineItems } from "@/server/timeline-items";

const CONSTRUCTION_ACCESS_COOKIE = "attacker_construction_access";

export async function readConstructionGateState(now = new Date()) {
  const hasDatabase = Boolean(process.env.DATABASE_URL);
  const [timelineItems, pageContent, cookieStore] = await Promise.all([
    hasDatabase ? readTimelineItems() : Promise.resolve(defaultTimelineItems),
    hasDatabase ? readPageContent() : Promise.resolve(defaultPageContent),
    cookies(),
  ]);
  const announcementItem = getTimelineItemById(WEBSITE_ANNOUNCEMENT_TIMELINE_ID, timelineItems);
  const hasAccess = cookieStore.get(CONSTRUCTION_ACCESS_COOKIE)?.value === "1";
  const isReleased = isWebsiteAnnouncementReleased(timelineItems, now);
  const targetAt = announcementItem ? getTimelineStartDateTime(announcementItem).toISOString() : now.toISOString();

  return {
    constructionContent: pageContent.construction,
    hasAccess,
    isReleased,
    shouldGate: !isReleased && !hasAccess,
    targetAt,
  };
}
