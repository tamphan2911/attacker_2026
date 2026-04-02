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

const TEAM_SUBMISSION_STORAGE_ROOT = path.resolve(resolveAppStorageRoot(), "team-submissions");

function sanitizeStorageSegment(value: string) {
  const sanitized = value.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64);
  return sanitized || "submission";
}

function resolveStoragePath(storageKey: string) {
  const resolvedPath = path.resolve(TEAM_SUBMISSION_STORAGE_ROOT, storageKey);
  const allowedPrefix = `${TEAM_SUBMISSION_STORAGE_ROOT}${path.sep}`;

  if (
    resolvedPath !== TEAM_SUBMISSION_STORAGE_ROOT &&
    !resolvedPath.startsWith(allowedPrefix)
  ) {
    throw new Error("Invalid team submission storage key.");
  }

  return resolvedPath;
}

export function buildTeamSubmissionStorageKey(ownerId: string, fileName: string) {
  const normalizedExtension = path.extname(fileName).trim().toLowerCase();
  const ownerSegment = sanitizeStorageSegment(ownerId);

  return path.posix.join(
    ownerSegment,
    `${Date.now()}-${randomUUID()}${normalizedExtension}`,
  );
}

export async function storeTeamSubmissionFile(
  storageKey: string,
  fileBuffer: Buffer,
) {
  const targetPath = resolveStoragePath(storageKey);
  await mkdir(path.dirname(targetPath), { recursive: true });
  await writeFile(targetPath, fileBuffer);
}

export async function readTeamSubmissionFile(storageKey: string) {
  const targetPath = resolveStoragePath(storageKey);
  return readFile(targetPath);
}

export async function deleteTeamSubmissionFile(storageKey: string) {
  const targetPath = resolveStoragePath(storageKey);
  await rm(targetPath, { force: true });
}
