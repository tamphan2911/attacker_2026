import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

function resolveAppStorageRoot() {
  const configuredRoot = process.env.APP_STORAGE_ROOT?.trim();

  if (!configuredRoot) {
    return path.resolve(/* turbopackIgnore: true */ process.cwd(), "storage");
  }

  return path.isAbsolute(configuredRoot)
    ? configuredRoot
    : path.resolve(/* turbopackIgnore: true */ process.cwd(), configuredRoot);
}

const HERO_SLIDE_IMAGE_STORAGE_ROOT = path.resolve(resolveAppStorageRoot(), "hero-slide-images");

function sanitizeStorageSegment(value: string) {
  const sanitized = value.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64);
  return sanitized || "hero";
}

function resolveStoragePath(storageKey: string) {
  const resolvedPath = path.resolve(HERO_SLIDE_IMAGE_STORAGE_ROOT, storageKey);
  const allowedPrefix = `${HERO_SLIDE_IMAGE_STORAGE_ROOT}${path.sep}`;

  if (resolvedPath !== HERO_SLIDE_IMAGE_STORAGE_ROOT && !resolvedPath.startsWith(allowedPrefix)) {
    throw new Error("Invalid hero slide image storage key.");
  }

  return resolvedPath;
}

export function buildHeroSlideImageStorageKey(fileName: string) {
  const normalizedExtension = path.extname(fileName).trim().toLowerCase();
  return `${sanitizeStorageSegment(Date.now().toString())}-${randomUUID()}${normalizedExtension}`;
}

export function buildHeroSlideImageUrl(storageKey: string) {
  return `/api/hero-slide-images/${storageKey}`;
}

export function guessHeroSlideImageMimeType(storageKey: string) {
  const extension = path.extname(storageKey).trim().toLowerCase();

  switch (extension) {
    case ".png":
      return "image/png";
    case ".webp":
      return "image/webp";
    case ".jpg":
    case ".jpeg":
    default:
      return "image/jpeg";
  }
}

export async function storeHeroSlideImageFile(storageKey: string, fileBuffer: Buffer) {
  const targetPath = resolveStoragePath(storageKey);
  await mkdir(path.dirname(targetPath), { recursive: true });
  await writeFile(targetPath, fileBuffer);
}

export async function readHeroSlideImageFile(storageKey: string) {
  const targetPath = resolveStoragePath(storageKey);
  return readFile(targetPath);
}
