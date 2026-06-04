import { timelineItems as defaultTimelineItems } from "@/data/site-content";
import { prisma } from "@/lib/db";
import { normalizeLocalizedText } from "@/lib/site";
import { normalizeTimelineTime } from "@/lib/timeline-dates";
import type { LocalizedText, NavItem, TimelineItem } from "@/types/site";

const TIMELINE_ITEMS_SCOPE = "site-timeline-items";

function cloneTimelineItems(items: TimelineItem[]) {
  return JSON.parse(JSON.stringify(items)) as TimelineItem[];
}

export function getDefaultTimelineItems() {
  return cloneTimelineItems(defaultTimelineItems);
}

function normalizeTimelineLocalizedText(value: LocalizedText | undefined, fallback: LocalizedText) {
  if (!value) {
    return fallback;
  }

  return {
    ...fallback,
    ...normalizeLocalizedText(value),
  };
}

function normalizeTimelineSupportLinks(value: NavItem[] | undefined, fallback?: NavItem[]) {
  if (!Array.isArray(value)) {
    return fallback;
  }

  return value.map((link, index) => {
    const fallbackLink = fallback?.[index];

    return {
      href: link.href || fallbackLink?.href || "",
      label: normalizeTimelineLocalizedText(link.label, fallbackLink?.label ?? { en: "", vi: "" }),
    };
  });
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
      id: storedItem.id || defaultItem.id,
      phase: storedItem.phase || defaultItem.phase,
      startDate: storedItem.startDate || defaultItem.startDate,
      endDate: storedItem.endDate || defaultItem.endDate,
      startTime: normalizeTimelineTime(storedItem.startTime) ?? defaultItem.startTime,
      endTime: normalizeTimelineTime(storedItem.endTime) ?? defaultItem.endTime,
      title: normalizeTimelineLocalizedText(storedItem.title, defaultItem.title),
      description: normalizeTimelineLocalizedText(storedItem.description, defaultItem.description),
      location: normalizeTimelineLocalizedText(storedItem.location, defaultItem.location),
      method: normalizeTimelineLocalizedText(storedItem.method, defaultItem.method),
      supportLinks: normalizeTimelineSupportLinks(storedItem.supportLinks, defaultItem.supportLinks),
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
