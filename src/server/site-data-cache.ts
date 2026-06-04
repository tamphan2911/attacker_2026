import { revalidateTag } from "next/cache";

export const SITE_DATA_CACHE_TAG = "site-data";
export const SITE_DATA_CACHE_SECONDS = 60;

export function invalidateSiteDataCache() {
  revalidateTag(SITE_DATA_CACHE_TAG, "max");
}
