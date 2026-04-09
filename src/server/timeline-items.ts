import { timelineItems as defaultTimelineItems } from "@/data/site-content";
import { prisma } from "@/lib/db";
import type { TimelineItem } from "@/types/site";

const TIMELINE_ITEMS_SCOPE = "site-timeline-items";

function cloneTimelineItems(items: TimelineItem[]) {
  return JSON.parse(JSON.stringify(items)) as TimelineItem[];
}

export function getDefaultTimelineItems() {
  return cloneTimelineItems(defaultTimelineItems);
}

function normalizeTimelineItems(items: TimelineItem[]) {
  const defaults = getDefaultTimelineItems();

  return defaults.map((defaultItem) => {
    const storedItem = items.find((item) => item.id === defaultItem.id);

    if (!storedItem) {
      return defaultItem;
    }

    return {
      ...defaultItem,
      ...storedItem,
      id: storedItem.id || defaultItem.id,
      phase: storedItem.phase || defaultItem.phase,
      startDate: storedItem.startDate || defaultItem.startDate,
      endDate: storedItem.endDate || defaultItem.endDate,
      supportLinks: storedItem.supportLinks ?? defaultItem.supportLinks,
    };
  });
}

export async function readTimelineItems() {
  const cmsEntry = await prisma.cmsEntry.findUnique({
    where: { scope: TIMELINE_ITEMS_SCOPE },
    select: { payload: true },
  });

  if (!cmsEntry) {
    return getDefaultTimelineItems();
  }

  try {
    const parsed = JSON.parse(cmsEntry.payload) as TimelineItem[];
    if (!Array.isArray(parsed)) {
      return getDefaultTimelineItems();
    }
    return normalizeTimelineItems(parsed);
  } catch {
    return getDefaultTimelineItems();
  }
}

export async function saveTimelineItems(items: TimelineItem[]) {
  const normalizedItems = normalizeTimelineItems(items);

  await prisma.cmsEntry.upsert({
    where: { scope: TIMELINE_ITEMS_SCOPE },
    update: { payload: JSON.stringify(normalizedItems) },
    create: {
      scope: TIMELINE_ITEMS_SCOPE,
      payload: JSON.stringify(normalizedItems),
    },
  });
}
