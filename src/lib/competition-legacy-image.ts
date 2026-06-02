export const MAX_COMPETITION_LEGACY_IMAGE_BYTES = 10 * 1024 * 1024;

const allowedCompetitionLegacyImageExtensions = [".jpg", ".jpeg"];
const allowedCompetitionLegacyImageMimeTypes = new Set(["image/jpeg"]);

function getFileExtension(fileName: string) {
  const normalized = fileName.trim().toLowerCase();
  const index = normalized.lastIndexOf(".");
  return index >= 0 ? normalized.slice(index) : "";
}

export function isAllowedCompetitionLegacyImageFile(file: File) {
  const extension = getFileExtension(file.name);
  if (!allowedCompetitionLegacyImageExtensions.includes(extension)) {
    return false;
  }

  if (file.type && !allowedCompetitionLegacyImageMimeTypes.has(file.type)) {
    return false;
  }

  return true;
}

export function getCompetitionLegacyImageValidationError(file?: File | null) {
  if (!file) {
    return "missing";
  }

  if (!isAllowedCompetitionLegacyImageFile(file)) {
    return "type";
  }

  if (file.size > MAX_COMPETITION_LEGACY_IMAGE_BYTES) {
    return "size";
  }

  return null;
}
