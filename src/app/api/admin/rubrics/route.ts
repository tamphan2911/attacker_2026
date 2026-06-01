import { NextResponse } from "next/server";

import {
  getRubricFileValidationError,
  isRubricFileId,
  MAX_RUBRIC_FILE_BYTES,
} from "@/lib/rubric-files";
import { getCurrentDbUser, hasElevatedRole } from "@/server/auth-helpers";
import {
  listRubricFileRecords,
  readRubricFileRecord,
  storeRubricFile,
} from "@/server/rubric-file-storage";

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentDbUser();
  if (!user || !hasElevatedRole(user.role)) {
    return NextResponse.json({ error: "Admin or moderator access required." }, { status: 403 });
  }

  return NextResponse.json({ rubrics: await listRubricFileRecords() }, { status: 200 });
}

export async function POST(request: Request) {
  const user = await getCurrentDbUser();
  if (!user || !hasElevatedRole(user.role)) {
    return NextResponse.json({ error: "Admin or moderator access required." }, { status: 403 });
  }

  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: "Invalid rubric upload form data." }, { status: 400 });
  }

  const rubricId = formData.get("rubricId");
  if (!isRubricFileId(rubricId)) {
    return NextResponse.json({ error: "Select a valid rubric slot before uploading." }, { status: 400 });
  }

  const rubricFile = formData.get("rubricFile");
  if (!(rubricFile instanceof File)) {
    return NextResponse.json({ error: "Upload a PDF file before saving." }, { status: 400 });
  }

  const validationError = getRubricFileValidationError(rubricFile);
  if (validationError === "type") {
    return NextResponse.json({ error: "Only PDF files are allowed." }, { status: 400 });
  }

  if (validationError === "size") {
    return NextResponse.json(
      { error: `The uploaded PDF must be ${Math.round(MAX_RUBRIC_FILE_BYTES / 1024 / 1024)}MB or smaller.` },
      { status: 400 },
    );
  }

  if (validationError === "missing") {
    return NextResponse.json({ error: "Upload a PDF file before saving." }, { status: 400 });
  }

  try {
    await storeRubricFile(rubricId, Buffer.from(await rubricFile.arrayBuffer()), {
      fileName: rubricFile.name,
      sizeBytes: rubricFile.size,
      updatedAt: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      { error: "The uploaded rubric could not be saved on the server." },
      { status: 500 },
    );
  }

  return NextResponse.json(
    { rubric: await readRubricFileRecord(rubricId) },
    { status: 201 },
  );
}
