import { NextResponse } from "next/server";

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

  const hasReversedDate = payload.timelineItems.some((item) => item.startDate > item.endDate);
  if (hasReversedDate) {
    return NextResponse.json({ error: "Start date cannot be after end date." }, { status: 400 });
  }

  await saveTimelineItems(payload.timelineItems);
  return NextResponse.json({ saved: true }, { status: 200 });
}
