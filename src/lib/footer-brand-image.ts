export const MAX_FOOTER_BRAND_IMAGE_BYTES = 2 * 1024 * 1024;

const allowedFooterBrandImageExtensions = [".jpg", ".jpeg"];
const allowedFooterBrandImageMimeTypes = new Set(["image/jpeg"]);

function getFileExtension(fileName: string) {
  const normalized = fileName.trim().toLowerCase();
  const index = normalized.lastIndexOf(".");
  return index >= 0 ? normalized.slice(index) : "";
}

export function isAllowedFooterBrandImageFile(file: File) {
  const extension = getFileExtension(file.name);
  if (!allowedFooterBrandImageExtensions.includes(extension)) {
    return false;
  }

  if (file.type && !allowedFooterBrandImageMimeTypes.has(file.type)) {
    return false;
  }

  return true;
}

export function getFooterBrandImageValidationError(file?: File | null) {
  if (!file) {
    return "missing";
  }

  if (!isAllowedFooterBrandImageFile(file)) {
    return "type";
  }

  if (file.size > MAX_FOOTER_BRAND_IMAGE_BYTES) {
    return "size";
  }

  return null;
}
