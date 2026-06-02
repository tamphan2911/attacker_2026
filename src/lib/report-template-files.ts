import type { LocalizedText } from "@/types/site";

export const MAX_REPORT_TEMPLATE_FILE_BYTES = 10 * 1024 * 1024;

export const reportTemplateFileDefinitions = [
  {
    id: "round-2-report-template",
    label: {
      en: "Round 2 report template",
      vi: "Mẫu báo cáo Vòng 2",
    },
    publicDownloadLabel: {
      en: "Download Round 2 report template",
      vi: "Tải mẫu báo cáo Vòng 2",
    },
  },
] as const satisfies ReadonlyArray<{
  id: string;
  label: LocalizedText;
  publicDownloadLabel: LocalizedText;
}>;

export type ReportTemplateFileId = (typeof reportTemplateFileDefinitions)[number]["id"];

const allowedReportTemplateMimeTypes = new Set([
  "application/msword",
  "application/octet-stream",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export function isReportTemplateFileId(value: unknown): value is ReportTemplateFileId {
  return reportTemplateFileDefinitions.some((definition) => definition.id === value);
}

export function getReportTemplateFileDefinition(id: ReportTemplateFileId) {
  return reportTemplateFileDefinitions.find((definition) => definition.id === id)!;
}

export function getReportTemplateFileExtension(fileName: string) {
  const normalizedName = fileName.trim().toLowerCase();
  const extension = normalizedName.slice(normalizedName.lastIndexOf("."));

  return extension === ".doc" || extension === ".docx" ? extension : null;
}

export function getReportTemplateFileValidationError(file?: File | null) {
  if (!file) {
    return "missing";
  }

  if (!getReportTemplateFileExtension(file.name)) {
    return "type";
  }

  if (file.type && !allowedReportTemplateMimeTypes.has(file.type)) {
    return "type";
  }

  if (file.size > MAX_REPORT_TEMPLATE_FILE_BYTES) {
    return "size";
  }

  return null;
}
