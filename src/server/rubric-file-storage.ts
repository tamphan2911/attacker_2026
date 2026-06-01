import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  getRubricFileDefinition,
  isRubricFileId,
  rubricFileDefinitions,
  type RubricFileId,
} from "@/lib/rubric-files";

interface StoredRubricMetadata {
  fileName: string;
  sizeBytes: number;
  updatedAt: string;
}

export interface RubricFileRecord extends StoredRubricMetadata {
  id: RubricFileId;
  label: {
    en: string;
    vi: string;
  };
  downloadUrl: string;
}

function resolveAppStorageRoot() {
  const configuredRoot = process.env.APP_STORAGE_ROOT?.trim();

  if (!configuredRoot) {
    return path.resolve(/* turbopackIgnore: true */ process.cwd(), "storage");
  }

  return path.isAbsolute(configuredRoot)
    ? configuredRoot
    : path.resolve(/* turbopackIgnore: true */ process.cwd(), configuredRoot);
}

const RUBRIC_FILE_STORAGE_ROOT = path.resolve(resolveAppStorageRoot(), "rubrics");

function resolveRubricPath(rubricId: RubricFileId, extension: ".json" | ".pdf") {
  const resolvedPath = path.resolve(RUBRIC_FILE_STORAGE_ROOT, `${rubricId}${extension}`);
  const allowedPrefix = `${RUBRIC_FILE_STORAGE_ROOT}${path.sep}`;

  if (resolvedPath !== RUBRIC_FILE_STORAGE_ROOT && !resolvedPath.startsWith(allowedPrefix)) {
    throw new Error("Invalid rubric file storage key.");
  }

  return resolvedPath;
}

export function buildRubricDownloadUrl(rubricId: RubricFileId) {
  return `/api/rubrics/${rubricId}`;
}

export function createRubricContentDisposition(fileName: string) {
  const sanitizedFileName = fileName.replace(/[\r\n"]/g, "").trim() || "rubric.pdf";
  const fallbackFileName =
    sanitizedFileName
      .normalize("NFKD")
      .replace(/[^\x20-\x7E]/g, "")
      .replace(/[\\;]/g, "")
      .trim() || "rubric.pdf";

  return `attachment; filename="${fallbackFileName}"; filename*=UTF-8''${encodeURIComponent(
    sanitizedFileName,
  )}`;
}

export async function storeRubricFile(
  rubricId: RubricFileId,
  fileBuffer: Buffer,
  metadata: StoredRubricMetadata,
) {
  const filePath = resolveRubricPath(rubricId, ".pdf");
  const metadataPath = resolveRubricPath(rubricId, ".json");

  await mkdir(RUBRIC_FILE_STORAGE_ROOT, { recursive: true });
  await writeFile(filePath, fileBuffer);
  await writeFile(metadataPath, JSON.stringify(metadata, null, 2));
}

export async function readRubricFile(rubricId: RubricFileId) {
  return readFile(resolveRubricPath(rubricId, ".pdf"));
}

export async function readRubricFileRecord(rubricId: RubricFileId): Promise<RubricFileRecord | null> {
  if (!isRubricFileId(rubricId)) {
    return null;
  }

  let metadata: StoredRubricMetadata;

  try {
    metadata = JSON.parse(await readFile(resolveRubricPath(rubricId, ".json"), "utf8")) as StoredRubricMetadata;
  } catch {
    return null;
  }

  const definition = getRubricFileDefinition(rubricId);

  return {
    id: rubricId,
    label: definition.label,
    fileName: metadata.fileName,
    sizeBytes: metadata.sizeBytes,
    updatedAt: metadata.updatedAt,
    downloadUrl: buildRubricDownloadUrl(rubricId),
  };
}

export async function listRubricFileRecords() {
  const records = await Promise.all(
    rubricFileDefinitions.map((definition) => readRubricFileRecord(definition.id)),
  );

  return records.filter((record): record is RubricFileRecord => Boolean(record));
}
