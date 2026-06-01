import { NextResponse } from "next/server";

import { listRubricFileRecords } from "@/server/rubric-file-storage";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ rubrics: await listRubricFileRecords() }, { status: 200 });
}
