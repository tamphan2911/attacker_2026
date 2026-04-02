export const MAX_NEWS_IMAGE_BYTES = 2 * 1024 * 1024;

const allowedNewsImageExtensions = [".jpg", ".jpeg", ".png", ".webp"];
const allowedNewsImageMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

function getNewsImageExtension(fileName: string) {
  const normalized = fileName.trim().toLowerCase();
  const index = normalized.lastIndexOf(".");
  return index >= 0 ? normalized.slice(index) : "";
}

export function isAllowedNewsImageFile(file: File) {
  const extension = getNewsImageExtension(file.name);
  const extensionAllowed = allowedNewsImageExtensions.includes(extension);
  const mimeAllowed = allowedNewsImageMimeTypes.has(file.type);

  if (!extensionAllowed) {
    return false;
  }

  if (file.type && !mimeAllowed) {
    return false;
  }

  return true;
}

export function getNewsImageValidationError(file?: File | null) {
  if (!file) {
    return "missing";
  }

  if (!isAllowedNewsImageFile(file)) {
    return "type";
  }

  if (file.size > MAX_NEWS_IMAGE_BYTES) {
    return "size";
  }

  return null;
}
