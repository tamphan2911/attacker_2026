import { randomUUID } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
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

const SPONSOR_IMAGE_STORAGE_ROOT = path.resolve(resolveAppStorageRoot(), "sponsor-images");

function sanitizeStorageSegment(value: string) {
  const sanitized = value.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64);
  return sanitized || "sponsor";
}

function resolveStoragePath(storageKey: string) {
  const resolvedPath = path.resolve(SPONSOR_IMAGE_STORAGE_ROOT, storageKey);
  const allowedPrefix = `${SPONSOR_IMAGE_STORAGE_ROOT}${path.sep}`;

  if (resolvedPath !== SPONSOR_IMAGE_STORAGE_ROOT && !resolvedPath.startsWith(allowedPrefix)) {
    throw new Error("Invalid sponsor image storage key.");
  }

  return resolvedPath;
}

export function buildSponsorImageStorageKey(fileName: string) {
  const normalizedExtension = path.extname(fileName).trim().toLowerCase();
  return `${sanitizeStorageSegment(Date.now().toString())}-${randomUUID()}${normalizedExtension}`;
}

export function buildSponsorImageUrl(storageKey: string) {
  return `/api/sponsor-images/${storageKey}`;
}

export function guessSponsorImageMimeType(storageKey: string) {
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

export async function storeSponsorImageFile(storageKey: string, fileBuffer: Buffer) {
  const targetPath = resolveStoragePath(storageKey);
  await mkdir(path.dirname(targetPath), { recursive: true });
  await writeFile(targetPath, fileBuffer);
}

export async function readSponsorImageFile(storageKey: string) {
  const targetPath = resolveStoragePath(storageKey);
  return readFile(targetPath);
}

export async function deleteSponsorImageFile(storageKey: string) {
  const targetPath = resolveStoragePath(storageKey);
  await rm(targetPath, { force: true });
}
