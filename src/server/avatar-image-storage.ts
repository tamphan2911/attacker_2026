import { randomUUID } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { ALLOWED_AVATAR_IMAGE_TYPES, MAX_AVATAR_IMAGE_BYTES, formatAvatarFileSize } from "@/lib/avatar-images";

type AvatarOwnerKind = "user" | "team";

function resolveAppStorageRoot() {
  const configuredRoot = process.env.APP_STORAGE_ROOT?.trim();

  if (!configuredRoot) {
    return path.resolve(/* turbopackIgnore: true */ process.cwd(), "storage");
  }

  return path.isAbsolute(configuredRoot)
    ? configuredRoot
    : path.resolve(/* turbopackIgnore: true */ process.cwd(), configuredRoot);
}

const AVATAR_IMAGE_STORAGE_ROOT = path.resolve(resolveAppStorageRoot(), "avatar-images");

function sanitizeStorageSegment(value: string) {
  const sanitized = value.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64);
  return sanitized || "avatar";
}

function resolveStoragePath(storageKey: string) {
  const resolvedPath = path.resolve(AVATAR_IMAGE_STORAGE_ROOT, storageKey);
  const allowedPrefix = `${AVATAR_IMAGE_STORAGE_ROOT}${path.sep}`;

  if (
    resolvedPath !== AVATAR_IMAGE_STORAGE_ROOT &&
    !resolvedPath.startsWith(allowedPrefix)
  ) {
    throw new Error("Invalid avatar image storage key.");
  }

  return resolvedPath;
}

function getAvatarExtensionFromMimeType(mimeType: string) {
  switch (mimeType) {
    case "image/png":
      return ".png";
    case "image/webp":
      return ".webp";
    case "image/gif":
      return ".gif";
    case "image/jpeg":
    default:
      return ".jpg";
  }
}

function decodeAvatarDataUrl(imageSrc: string) {
  const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,([a-zA-Z0-9+/=]+)$/u.exec(imageSrc);
  if (!match) {
    return null;
  }

  const mimeType = match[1] === "image/jpg" ? "image/jpeg" : match[1];
  if (!ALLOWED_AVATAR_IMAGE_TYPES.has(mimeType)) {
    throw new Error("Only JPEG, PNG, WebP, or GIF images are allowed.");
  }

  const fileBuffer = Buffer.from(match[2], "base64");
  if (fileBuffer.byteLength > MAX_AVATAR_IMAGE_BYTES) {
    throw new Error(`Avatar images must be ${formatAvatarFileSize(MAX_AVATAR_IMAGE_BYTES)} or smaller.`);
  }

  return {
    fileBuffer,
    mimeType,
    extension: getAvatarExtensionFromMimeType(mimeType),
  };
}

export function buildAvatarImageStorageKey(ownerKind: AvatarOwnerKind, ownerId: string, extension: string) {
  return `${ownerKind}-${sanitizeStorageSegment(ownerId)}-${sanitizeStorageSegment(Date.now().toString())}-${randomUUID()}${extension}`;
}

export function buildAvatarImageUrl(storageKey: string) {
  return `/api/avatar-images/${storageKey}`;
}

export function getAvatarImageStorageKeyFromUrl(imageUrl?: string | null) {
  if (!imageUrl?.startsWith("/api/avatar-images/")) {
    return null;
  }

  return imageUrl.slice("/api/avatar-images/".length).trim() || null;
}

export function guessAvatarImageMimeType(storageKey: string) {
  const extension = path.extname(storageKey).trim().toLowerCase();

  switch (extension) {
    case ".png":
      return "image/png";
    case ".webp":
      return "image/webp";
    case ".gif":
      return "image/gif";
    case ".jpg":
    case ".jpeg":
    default:
      return "image/jpeg";
  }
}

export async function storeAvatarImageFile(storageKey: string, fileBuffer: Buffer) {
  const targetPath = resolveStoragePath(storageKey);
  await mkdir(path.dirname(targetPath), { recursive: true });
  await writeFile(targetPath, fileBuffer);
}

export async function readAvatarImageFile(storageKey: string) {
  const targetPath = resolveStoragePath(storageKey);
  return readFile(targetPath);
}

export async function deleteAvatarImageFile(storageKey: string) {
  const targetPath = resolveStoragePath(storageKey);
  await rm(targetPath, { force: true });
}

export async function prepareAvatarImageReplacement({
  ownerKind,
  ownerId,
  previousImageSrc,
  nextImageSrc,
}: {
  ownerKind: AvatarOwnerKind;
  ownerId: string;
  previousImageSrc?: string | null;
  nextImageSrc?: string | null;
}) {
  const normalizedNextImageSrc = nextImageSrc?.trim() || null;
  const previousStorageKey = getAvatarImageStorageKeyFromUrl(previousImageSrc);
  const decodedImage = normalizedNextImageSrc ? decodeAvatarDataUrl(normalizedNextImageSrc) : null;

  if (!decodedImage) {
    return {
      imageSrc: normalizedNextImageSrc,
      cleanupNew: async () => {},
      deletePrevious: async () => {
        if (previousStorageKey && previousImageSrc !== normalizedNextImageSrc) {
          await deleteAvatarImageFile(previousStorageKey).catch(() => {});
        }
      },
    };
  }

  const storageKey = buildAvatarImageStorageKey(ownerKind, ownerId, decodedImage.extension);
  await storeAvatarImageFile(storageKey, decodedImage.fileBuffer);
  const storedImageSrc = buildAvatarImageUrl(storageKey);

  return {
    imageSrc: storedImageSrc,
    cleanupNew: async () => {
      await deleteAvatarImageFile(storageKey).catch(() => {});
    },
    deletePrevious: async () => {
      if (previousStorageKey) {
        await deleteAvatarImageFile(previousStorageKey).catch(() => {});
      }
    },
  };
}
