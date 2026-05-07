import { NextResponse } from "next/server";

import {
  guessHeroSlideImageMimeType,
  readHeroSlideImageFile,
} from "@/server/hero-slide-image-storage";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{
    imageKey: string;
  }>;
}

export async function GET(_: Request, context: RouteContext) {
  const { imageKey } = await context.params;

  try {
    const fileBuffer = await readHeroSlideImageFile(imageKey);
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": guessHeroSlideImageMimeType(imageKey),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "Hero slide image not found." }, { status: 404 });
  }
}
