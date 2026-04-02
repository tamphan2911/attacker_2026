import { NextResponse } from "next/server";

import {
  guessNewsImageMimeType,
  readNewsImageFile,
} from "@/server/news-image-storage";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ imageKey: string }> },
) {
  const { imageKey } = await params;

  try {
    const fileBuffer = await readNewsImageFile(imageKey);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": guessNewsImageMimeType(imageKey),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "Image not found." }, { status: 404 });
  }
}
