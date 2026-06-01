import { NextResponse } from "next/server";

import { getNewsImageValidationError } from "@/lib/news-images";
import { getCurrentDbUser, hasElevatedRole } from "@/server/auth-helpers";
import {
  buildContentImageStorageKey,
  buildContentImageUrl,
  storeContentImageFile,
} from "@/server/content-image-storage";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await getCurrentDbUser();
  if (!user || !hasElevatedRole(user.role)) {
    return NextResponse.json({ error: "Admin or moderator access required." }, { status: 403 });
  }

  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: "Invalid image upload form data." }, { status: 400 });
  }

  const imageFile = formData.get("imageFile");
  if (!(imageFile instanceof File)) {
    return NextResponse.json({ error: "Upload an image file before saving." }, { status: 400 });
  }

  const validationError = getNewsImageValidationError(imageFile);
  if (validationError === "type") {
    return NextResponse.json(
      { error: "Only JPG, PNG, and WEBP images are allowed." },
      { status: 400 },
    );
  }

  if (validationError === "size") {
    return NextResponse.json(
      { error: "The uploaded image must be 2MB or smaller." },
      { status: 400 },
    );
  }

  if (validationError === "missing") {
    return NextResponse.json({ error: "Upload an image file before saving." }, { status: 400 });
  }

  const storageKey = buildContentImageStorageKey(imageFile.name, "competition-legacy");
  const imageBuffer = Buffer.from(await imageFile.arrayBuffer());

  try {
    await storeContentImageFile(storageKey, imageBuffer);
  } catch {
    return NextResponse.json(
      { error: "The uploaded image could not be saved on the server." },
      { status: 500 },
    );
  }

  return NextResponse.json(
    {
      imageUrl: buildContentImageUrl(storageKey),
    },
    { status: 201 },
  );
}
