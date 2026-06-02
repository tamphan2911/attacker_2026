import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  getReportTemplateFileDefinition,
  getReportTemplateFileExtension,
  isReportTemplateFileId,
  reportTemplateFileDefinitions,
  type ReportTemplateFileId,
} from "@/lib/report-template-files";

interface StoredReportTemplateMetadata {
  extension: ".doc" | ".docx";
  fileName: string;
  sizeBytes: number;
  updatedAt: string;
}

export interface ReportTemplateFileRecord extends StoredReportTemplateMetadata {
  id: ReportTemplateFileId;
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

const REPORT_TEMPLATE_FILE_STORAGE_ROOT = path.resolve(resolveAppStorageRoot(), "report-templates");

function resolveReportTemplatePath(templateId: ReportTemplateFileId, extension: ".json" | ".doc" | ".docx") {
  const resolvedPath = path.resolve(REPORT_TEMPLATE_FILE_STORAGE_ROOT, `${templateId}${extension}`);
  const allowedPrefix = `${REPORT_TEMPLATE_FILE_STORAGE_ROOT}${path.sep}`;

  if (resolvedPath !== REPORT_TEMPLATE_FILE_STORAGE_ROOT && !resolvedPath.startsWith(allowedPrefix)) {
    throw new Error("Invalid report template file storage key.");
  }

  return resolvedPath;
}

export function buildReportTemplateDownloadUrl(templateId: ReportTemplateFileId) {
  return `/api/report-templates/${templateId}`;
}

export function createReportTemplateContentDisposition(fileName: string) {
  const sanitizedFileName = fileName.replace(/[\r\n"]/g, "").trim() || "report-template.docx";
  const fallbackFileName =
    sanitizedFileName
      .normalize("NFKD")
      .replace(/[^\x20-\x7E]/g, "")
      .replace(/[\\;]/g, "")
      .trim() || "report-template.docx";

  return `attachment; filename="${fallbackFileName}"; filename*=UTF-8''${encodeURIComponent(
    sanitizedFileName,
  )}`;
}

export async function storeReportTemplateFile(
  templateId: ReportTemplateFileId,
  fileBuffer: Buffer,
  metadata: Omit<StoredReportTemplateMetadata, "extension"> & { extension: ".doc" | ".docx" },
) {
  const filePath = resolveReportTemplatePath(templateId, metadata.extension);
  const metadataPath = resolveReportTemplatePath(templateId, ".json");
  const previousRecord = await readReportTemplateFileRecord(templateId);

  await mkdir(REPORT_TEMPLATE_FILE_STORAGE_ROOT, { recursive: true });
  await writeFile(filePath, fileBuffer);
  await writeFile(metadataPath, JSON.stringify(metadata, null, 2));

  if (previousRecord && previousRecord.extension !== metadata.extension) {
    await rm(resolveReportTemplatePath(templateId, previousRecord.extension), { force: true });
  }
}

export async function readReportTemplateFile(templateId: ReportTemplateFileId, extension: ".doc" | ".docx") {
  return readFile(resolveReportTemplatePath(templateId, extension));
}

export async function readReportTemplateFileRecord(
  templateId: ReportTemplateFileId,
): Promise<ReportTemplateFileRecord | null> {
  if (!isReportTemplateFileId(templateId)) {
    return null;
  }

  let metadata: StoredReportTemplateMetadata;

  try {
    metadata = JSON.parse(
      await readFile(resolveReportTemplatePath(templateId, ".json"), "utf8"),
    ) as StoredReportTemplateMetadata;
  } catch {
    return null;
  }

  if (
    !getReportTemplateFileExtension(metadata.fileName) ||
    (metadata.extension !== ".doc" && metadata.extension !== ".docx")
  ) {
    return null;
  }

  const definition = getReportTemplateFileDefinition(templateId);

  return {
    id: templateId,
    label: definition.label,
    extension: metadata.extension,
    fileName: metadata.fileName,
    sizeBytes: metadata.sizeBytes,
    updatedAt: metadata.updatedAt,
    downloadUrl: buildReportTemplateDownloadUrl(templateId),
  };
}

export async function listReportTemplateFileRecords() {
  const records = await Promise.all(
    reportTemplateFileDefinitions.map((definition) => readReportTemplateFileRecord(definition.id)),
  );

  return records.filter((record): record is ReportTemplateFileRecord => Boolean(record));
}
