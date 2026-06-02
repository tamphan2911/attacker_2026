import { NextResponse } from "next/server";

import { isReportTemplateFileId } from "@/lib/report-template-files";
import {
  createReportTemplateContentDisposition,
  readReportTemplateFile,
  readReportTemplateFileRecord,
} from "@/server/report-template-file-storage";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  context: { params: Promise<{ templateId: string }> },
) {
  const { templateId } = await context.params;

  if (!isReportTemplateFileId(templateId)) {
    return NextResponse.json({ error: "Report template file not found." }, { status: 404 });
  }

  const record = await readReportTemplateFileRecord(templateId);
  if (!record) {
    return NextResponse.json({ error: "Report template file has not been uploaded yet." }, { status: 404 });
  }

  let fileBuffer: Buffer;

  try {
    fileBuffer = await readReportTemplateFile(templateId, record.extension);
  } catch {
    return NextResponse.json({ error: "The stored report template file is unavailable." }, { status: 404 });
  }

  return new Response(new Uint8Array(fileBuffer), {
    status: 200,
    headers: {
      "Content-Type": record.extension === ".docx"
        ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        : "application/msword",
      "Content-Length": String(fileBuffer.byteLength),
      "Content-Disposition": createReportTemplateContentDisposition(record.fileName),
      "Cache-Control": "public, max-age=60",
    },
  });
}
