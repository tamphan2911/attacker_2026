import { NextResponse } from "next/server";

import {
  guessAvatarImageMimeType,
  readAvatarImageFile,
} from "@/server/avatar-image-storage";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ imageKey: string }> },
) {
  const { imageKey } = await params;

  try {
    const fileBuffer = await readAvatarImageFile(imageKey);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": guessAvatarImageMimeType(imageKey),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "Avatar image not found." }, { status: 404 });
  }
}
