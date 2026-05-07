import { NextResponse } from "next/server";

import {
  guessSponsorImageMimeType,
  readSponsorImageFile,
} from "@/server/sponsor-image-storage";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{
    imageKey: string;
  }>;
}

export async function GET(_: Request, context: RouteContext) {
  const { imageKey } = await context.params;

  try {
    const fileBuffer = await readSponsorImageFile(imageKey);
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": guessSponsorImageMimeType(imageKey),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "Sponsor image not found." }, { status: 404 });
  }
}
