import type { Locale, LocalizedText } from "@/types/site";

export const DEFAULT_CLASS_YEAR = "Năm 3";

export const classYearOptions: Array<{ value: string; label: LocalizedText }> = [
  { value: "Năm 1", label: { en: "First year", vi: "Năm 1" } },
  { value: "Năm 2", label: { en: "Second year", vi: "Năm 2" } },
  { value: "Năm 3", label: { en: "Third year", vi: "Năm 3" } },
  { value: "Năm 4", label: { en: "Fourth year", vi: "Năm 4" } },
  { value: "Năm 5", label: { en: "Fifth year", vi: "Năm 5" } },
];

const allowedClassYears = new Set(classYearOptions.map((option) => option.value));

export function isAllowedClassYear(value?: string | null) {
  return allowedClassYears.has(value?.trim() ?? "");
}

export function normalizeStudentClassYear(value?: string | null) {
  const trimmed = value?.trim() ?? "";

  if (isAllowedClassYear(trimmed)) {
    return trimmed;
  }

  return DEFAULT_CLASS_YEAR;
}

export function normalizeClassYearForRole(value: string | undefined | null, role?: string | null) {
  return role?.toLowerCase() === "student" ? normalizeStudentClassYear(value) : (value?.trim() ?? "");
}

export function pickClassYearLabel(locale: Locale, value?: string | null) {
  const option = classYearOptions.find((item) => item.value === normalizeStudentClassYear(value));
  return option?.label[locale] ?? DEFAULT_CLASS_YEAR;
}
