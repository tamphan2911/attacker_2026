import { NextResponse } from "next/server";

import { SITE_DATA_CACHE_SECONDS } from "@/server/site-data-cache";
import { readCachedSiteData } from "@/server/site-data-service";

export async function GET() {
  return NextResponse.json(await readCachedSiteData(), {
    status: 200,
    headers: {
      "Cache-Control": `public, s-maxage=${SITE_DATA_CACHE_SECONDS}, stale-while-revalidate=300`,
    },
  });
}
