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

const CONTENT_IMAGE_STORAGE_ROOT = path.resolve(resolveAppStorageRoot(), "content-images");

function sanitizeStorageSegment(value: string) {
  const sanitized = value.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64);
  return sanitized || "content";
}

function resolveStoragePath(storageKey: string) {
  const resolvedPath = path.resolve(CONTENT_IMAGE_STORAGE_ROOT, storageKey);
  const allowedPrefix = `${CONTENT_IMAGE_STORAGE_ROOT}${path.sep}`;

  if (resolvedPath !== CONTENT_IMAGE_STORAGE_ROOT && !resolvedPath.startsWith(allowedPrefix)) {
    throw new Error("Invalid content image storage key.");
  }

  return resolvedPath;
}

export function buildContentImageStorageKey(fileName: string, prefix = "content") {
  const normalizedExtension = path.extname(fileName).trim().toLowerCase();
  return `${sanitizeStorageSegment(prefix)}-${Date.now()}-${randomUUID()}${normalizedExtension}`;
}

export function buildContentImageUrl(storageKey: string) {
  return `/api/content-images/${storageKey}`;
}

export function guessContentImageMimeType(storageKey: string) {
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

export async function storeContentImageFile(storageKey: string, fileBuffer: Buffer) {
  const targetPath = resolveStoragePath(storageKey);
  await mkdir(path.dirname(targetPath), { recursive: true });
  await writeFile(targetPath, fileBuffer);
}

export async function readContentImageFile(storageKey: string) {
  const targetPath = resolveStoragePath(storageKey);
  return readFile(targetPath);
}
