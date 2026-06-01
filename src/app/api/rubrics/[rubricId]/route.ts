import { NextResponse } from "next/server";

import { isRubricFileId } from "@/lib/rubric-files";
import {
  createRubricContentDisposition,
  readRubricFile,
  readRubricFileRecord,
} from "@/server/rubric-file-storage";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  context: { params: Promise<{ rubricId: string }> },
) {
  const { rubricId } = await context.params;

  if (!isRubricFileId(rubricId)) {
    return NextResponse.json({ error: "Rubric file not found." }, { status: 404 });
  }

  const record = await readRubricFileRecord(rubricId);
  if (!record) {
    return NextResponse.json({ error: "Rubric file has not been uploaded yet." }, { status: 404 });
  }

  let fileBuffer: Buffer;

  try {
    fileBuffer = await readRubricFile(rubricId);
  } catch {
    return NextResponse.json({ error: "The stored rubric file is unavailable." }, { status: 404 });
  }

  return new Response(new Uint8Array(fileBuffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Length": String(fileBuffer.byteLength),
      "Content-Disposition": createRubricContentDisposition(record.fileName),
      "Cache-Control": "public, max-age=60",
    },
  });
}
