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

const JUDGE_IMAGE_STORAGE_ROOT = path.resolve(resolveAppStorageRoot(), "judge-images");

function sanitizeStorageSegment(value: string) {
  const sanitized = value.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64);
  return sanitized || "judge";
}

function resolveStoragePath(storageKey: string) {
  const resolvedPath = path.resolve(JUDGE_IMAGE_STORAGE_ROOT, storageKey);
  const allowedPrefix = `${JUDGE_IMAGE_STORAGE_ROOT}${path.sep}`;

  if (
    resolvedPath !== JUDGE_IMAGE_STORAGE_ROOT &&
    !resolvedPath.startsWith(allowedPrefix)
  ) {
    throw new Error("Invalid judge image storage key.");
  }

  return resolvedPath;
}

export function buildJudgeImageStorageKey(fileName: string) {
  const normalizedExtension = path.extname(fileName).trim().toLowerCase();
  return `${sanitizeStorageSegment(Date.now().toString())}-${randomUUID()}${normalizedExtension}`;
}

export function buildJudgeImageUrl(storageKey: string) {
  return `/api/judge-images/${storageKey}`;
}

export function getJudgeImageStorageKeyFromUrl(imageUrl?: string | null) {
  if (!imageUrl?.startsWith("/api/judge-images/")) {
    return null;
  }

  return imageUrl.slice("/api/judge-images/".length).trim() || null;
}

export function guessJudgeImageMimeType(storageKey: string) {
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

export async function storeJudgeImageFile(storageKey: string, fileBuffer: Buffer) {
  const targetPath = resolveStoragePath(storageKey);
  await mkdir(path.dirname(targetPath), { recursive: true });
  await writeFile(targetPath, fileBuffer);
}

export async function readJudgeImageFile(storageKey: string) {
  const targetPath = resolveStoragePath(storageKey);
  return readFile(targetPath);
}

export async function deleteJudgeImageFile(storageKey: string) {
  const targetPath = resolveStoragePath(storageKey);
  await rm(targetPath, { force: true });
}
