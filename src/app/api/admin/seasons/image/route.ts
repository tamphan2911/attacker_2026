import { NextResponse } from "next/server";

import { getCurrentDbUser, hasElevatedRole } from "@/server/auth-helpers";
import {
  buildHeroSlideImageStorageKey,
  buildHeroSlideImageUrl,
  storeHeroSlideImageFile,
} from "@/server/hero-slide-image-storage";

export const runtime = "nodejs";

const MAX_SEASON_IMAGE_BYTES = 10 * 1024 * 1024;
const allowedSeasonImageExtensions = [".jpg", ".jpeg", ".png", ".webp"];
const allowedSeasonImageMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

function getImageExtension(fileName: string) {
  const normalized = fileName.trim().toLowerCase();
  const index = normalized.lastIndexOf(".");
  return index >= 0 ? normalized.slice(index) : "";
}

function isAllowedSeasonImageFile(file: File) {
  const extension = getImageExtension(file.name);
  if (!allowedSeasonImageExtensions.includes(extension)) {
    return false;
  }

  return !file.type || allowedSeasonImageMimeTypes.has(file.type);
}

export async function POST(request: Request) {
  const user = await getCurrentDbUser();
  if (!user || !hasElevatedRole(user.role)) {
    return NextResponse.json(
      { error: "Admin or moderator access required." },
      { status: 403 },
    );
  }

  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json(
      { error: "Invalid image upload form data." },
      { status: 400 },
    );
  }

  const imageFile = formData.get("imageFile");
  if (!(imageFile instanceof File)) {
    return NextResponse.json(
      { error: "Upload an image file before saving." },
      { status: 400 },
    );
  }

  if (!isAllowedSeasonImageFile(imageFile)) {
    return NextResponse.json(
      { error: "Only JPG, PNG, and WEBP images are allowed." },
      { status: 400 },
    );
  }

  if (imageFile.size > MAX_SEASON_IMAGE_BYTES) {
    return NextResponse.json(
      { error: "The uploaded image must be 10MB or smaller." },
      { status: 400 },
    );
  }

  const storageKey = buildHeroSlideImageStorageKey(imageFile.name);
  const imageBuffer = Buffer.from(await imageFile.arrayBuffer());

  try {
    await storeHeroSlideImageFile(storageKey, imageBuffer);
  } catch {
    return NextResponse.json(
      { error: "The uploaded image could not be saved on the server." },
      { status: 500 },
    );
  }

  return NextResponse.json(
    { imageUrl: buildHeroSlideImageUrl(storageKey) },
    { status: 201 },
  );
}
