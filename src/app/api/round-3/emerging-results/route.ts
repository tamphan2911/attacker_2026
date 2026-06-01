import { NextResponse } from "next/server";

import { readRound3EmergingResults } from "@/server/round3-emerging-results";

export async function GET() {
  return NextResponse.json(await readRound3EmergingResults(), { status: 200 });
}
