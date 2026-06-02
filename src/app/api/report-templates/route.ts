import { NextResponse } from "next/server";

import { listReportTemplateFileRecords } from "@/server/report-template-file-storage";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ templates: await listReportTemplateFileRecords() }, { status: 200 });
}
