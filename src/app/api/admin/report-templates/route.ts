import { NextResponse } from "next/server";

import {
  getReportTemplateFileExtension,
  getReportTemplateFileValidationError,
  isReportTemplateFileId,
  MAX_REPORT_TEMPLATE_FILE_BYTES,
} from "@/lib/report-template-files";
import { getCurrentDbUser, hasElevatedRole } from "@/server/auth-helpers";
import {
  listReportTemplateFileRecords,
  readReportTemplateFileRecord,
  storeReportTemplateFile,
} from "@/server/report-template-file-storage";

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentDbUser();
  if (!user || !hasElevatedRole(user.role)) {
    return NextResponse.json({ error: "Admin or moderator access required." }, { status: 403 });
  }

  return NextResponse.json({ templates: await listReportTemplateFileRecords() }, { status: 200 });
}

export async function POST(request: Request) {
  const user = await getCurrentDbUser();
  if (!user || !hasElevatedRole(user.role)) {
    return NextResponse.json({ error: "Admin or moderator access required." }, { status: 403 });
  }

  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: "Invalid report template upload form data." }, { status: 400 });
  }

  const templateId = formData.get("templateId");
  if (!isReportTemplateFileId(templateId)) {
    return NextResponse.json({ error: "Select a valid report template slot before uploading." }, { status: 400 });
  }

  const templateFile = formData.get("templateFile");
  if (!(templateFile instanceof File)) {
    return NextResponse.json({ error: "Upload a Word file before saving." }, { status: 400 });
  }

  const validationError = getReportTemplateFileValidationError(templateFile);
  if (validationError === "type") {
    return NextResponse.json({ error: "Only Word files (.doc or .docx) are allowed." }, { status: 400 });
  }

  if (validationError === "size") {
    return NextResponse.json(
      { error: `The uploaded Word file must be ${Math.round(MAX_REPORT_TEMPLATE_FILE_BYTES / 1024 / 1024)}MB or smaller.` },
      { status: 400 },
    );
  }

  if (validationError === "missing") {
    return NextResponse.json({ error: "Upload a Word file before saving." }, { status: 400 });
  }

  const extension = getReportTemplateFileExtension(templateFile.name);
  if (!extension) {
    return NextResponse.json({ error: "Only Word files (.doc or .docx) are allowed." }, { status: 400 });
  }

  try {
    await storeReportTemplateFile(templateId, Buffer.from(await templateFile.arrayBuffer()), {
      extension,
      fileName: templateFile.name,
      sizeBytes: templateFile.size,
      updatedAt: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      { error: "The uploaded report template could not be saved on the server." },
      { status: 500 },
    );
  }

  return NextResponse.json(
    { template: await readReportTemplateFileRecord(templateId) },
    { status: 201 },
  );
}
