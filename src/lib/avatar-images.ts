export const MAX_AVATAR_IMAGE_BYTES = 1024 * 1024;

export const ALLOWED_AVATAR_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export function formatAvatarFileSize(bytes?: number) {
  if (!bytes) {
    return "";
  }

  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  }

  return `${Math.ceil(bytes / 1024)}KB`;
}

export function getAvatarImageValidationError(file: Pick<File, "type" | "size">) {
  if (!ALLOWED_AVATAR_IMAGE_TYPES.has(file.type)) {
    return "Only JPEG, PNG, WebP, or GIF images are allowed.";
  }

  if (file.size > MAX_AVATAR_IMAGE_BYTES) {
    return `Avatar images must be ${formatAvatarFileSize(MAX_AVATAR_IMAGE_BYTES)} or smaller.`;
  }

  return "";
}
