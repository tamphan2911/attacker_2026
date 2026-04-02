import { NextResponse } from "next/server";

import { guessJudgeImageMimeType, readJudgeImageFile } from "@/server/judge-image-storage";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ imageKey: string }> },
) {
  const { imageKey } = await params;

  try {
    const fileBuffer = await readJudgeImageFile(imageKey);
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": guessJudgeImageMimeType(imageKey),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "Judge image not found." }, { status: 404 });
  }
}
