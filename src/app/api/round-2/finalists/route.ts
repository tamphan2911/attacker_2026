import { NextResponse } from "next/server";

import { readRound2FinalistResults } from "@/server/round2-finalists";

export async function GET() {
  return NextResponse.json(await readRound2FinalistResults(), { status: 200 });
}
