import { NextResponse } from "next/server";

import { getTimelineEndDateTime, getTimelineStartDateTime, timelineTimePattern } from "@/lib/timeline-dates";
import { getCurrentDbUser, hasAdminRole } from "@/server/auth-helpers";
import { readTimelineItems, saveTimelineItems } from "@/server/timeline-items";
import type { TimelineItem } from "@/types/site";

export async function GET() {
  const user = await getCurrentDbUser();
  if (!user || !hasAdminRole(user.role)) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  return NextResponse.json({ timelineItems: await readTimelineItems() }, { status: 200 });
}

export async function PUT(request: Request) {
  const user = await getCurrentDbUser();
  if (!user || !hasAdminRole(user.role)) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const payload = (await request.json().catch(() => null)) as { timelineItems?: TimelineItem[] } | null;
  if (!payload?.timelineItems || !Array.isArray(payload.timelineItems)) {
    return NextResponse.json({ error: "Invalid timeline payload." }, { status: 400 });
  }

  const hasInvalidDate = payload.timelineItems.some((item) => {
    const startDate = item.startDate?.trim();
    const endDate = item.endDate?.trim();
    return !startDate || !endDate || !/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate);
  });

  if (hasInvalidDate) {
    return NextResponse.json({ error: "Every timeline step needs valid start and end dates." }, { status: 400 });
  }

  const hasInvalidTime = payload.timelineItems.some((item) => {
    const startTime = item.startTime?.trim();
    const endTime = item.endTime?.trim();
    return Boolean((startTime && !timelineTimePattern.test(startTime)) || (endTime && !timelineTimePattern.test(endTime)));
  });

  if (hasInvalidTime) {
    return NextResponse.json({ error: "Timeline times must use HH:mm format." }, { status: 400 });
  }

  const hasReversedDateTime = payload.timelineItems.some((item) => {
    return getTimelineStartDateTime(item).getTime() > getTimelineEndDateTime(item).getTime();
  });

  if (hasReversedDateTime) {
    return NextResponse.json({ error: "Start date and time cannot be after end date and time." }, { status: 400 });
  }

  await saveTimelineItems(payload.timelineItems);
  return NextResponse.json({ saved: true }, { status: 200 });
}
