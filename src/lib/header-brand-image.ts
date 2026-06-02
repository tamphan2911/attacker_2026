export const MAX_HEADER_BRAND_IMAGE_BYTES = 2 * 1024 * 1024;

const allowedHeaderBrandImageExtensions = [".jpg", ".jpeg"];
const allowedHeaderBrandImageMimeTypes = new Set(["image/jpeg"]);

function getFileExtension(fileName: string) {
  const normalized = fileName.trim().toLowerCase();
  const index = normalized.lastIndexOf(".");
  return index >= 0 ? normalized.slice(index) : "";
}

export function isAllowedHeaderBrandImageFile(file: File) {
  const extension = getFileExtension(file.name);
  if (!allowedHeaderBrandImageExtensions.includes(extension)) {
    return false;
  }

  if (file.type && !allowedHeaderBrandImageMimeTypes.has(file.type)) {
    return false;
  }

  return true;
}

export function getHeaderBrandImageValidationError(file?: File | null) {
  if (!file) {
    return "missing";
  }

  if (!isAllowedHeaderBrandImageFile(file)) {
    return "type";
  }

  if (file.size > MAX_HEADER_BRAND_IMAGE_BYTES) {
    return "size";
  }

  return null;
}
