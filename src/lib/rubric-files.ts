import type { LocalizedText } from "@/types/site";

export const MAX_RUBRIC_FILE_BYTES = 10 * 1024 * 1024;

export const rubricFileDefinitions = [
  {
    id: "round-1-essay",
    label: {
      en: "Round 1 essay rubric",
      vi: "Rubric tự luận Vòng 1",
    },
    publicDownloadLabel: {
      en: "Download Round 1 essay rubric PDF",
      vi: "Tải PDF rubric chấm tự luận Vòng 1",
    },
  },
  {
    id: "round-2-report",
    label: {
      en: "Round 2 report rubric",
      vi: "Rubric Vòng 2",
    },
    publicDownloadLabel: {
      en: "Download Round 2 report rubric PDF",
      vi: "Tải PDF rubric chấm báo cáo Vòng 2",
    },
  },
  {
    id: "round-3-final-presentation",
    label: {
      en: "Final presentation rubric",
      vi: "Rubric Chung kết",
    },
    publicDownloadLabel: {
      en: "Download final presentation rubric PDF",
      vi: "Tải PDF rubric chấm thuyết trình chung kết",
    },
  },
] as const satisfies ReadonlyArray<{
  id: string;
  label: LocalizedText;
  publicDownloadLabel: LocalizedText;
}>;

export type RubricFileId = (typeof rubricFileDefinitions)[number]["id"];

const allowedRubricMimeTypes = new Set([
  "application/pdf",
  "application/octet-stream",
]);

export function isRubricFileId(value: unknown): value is RubricFileId {
  return rubricFileDefinitions.some((definition) => definition.id === value);
}

export function getRubricFileDefinition(id: RubricFileId) {
  return rubricFileDefinitions.find((definition) => definition.id === id)!;
}

export function getRubricFileValidationError(file?: File | null) {
  if (!file) {
    return "missing";
  }

  const extension = file.name.trim().toLowerCase().slice(file.name.lastIndexOf("."));
  if (extension !== ".pdf") {
    return "type";
  }

  if (file.type && !allowedRubricMimeTypes.has(file.type)) {
    return "type";
  }

  if (file.size > MAX_RUBRIC_FILE_BYTES) {
    return "size";
  }

  return null;
}
