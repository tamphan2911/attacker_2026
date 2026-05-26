import { NextResponse } from "next/server";
import { SubmissionRound } from "@prisma/client";
import { z } from "zod";

import { getSubmissionValidationError } from "@/lib/submission-files";
import { getCurrentDbUser } from "@/server/auth-helpers";
import { unauthorizedResponse, serviceResultToResponse } from "@/server/route-utils";
import { buildTeamSubmissionStorageKey, deleteTeamSubmissionFile, storeTeamSubmissionFile } from "@/server/team-submission-storage";
import { sendRound2SubmissionUploadConfirmation } from "@/server/team-submission-email";
import { createTeamSubmission } from "@/server/team-service";

export const runtime = "nodejs";

const createSubmissionSchema = z.object({
  round: z.enum(["round-2", "round-3"]),
  title: z.string().trim().min(1),
  summary: z.string().trim().max(2000).optional().default(""),
});

export async function POST(request: Request) {
  const user = await getCurrentDbUser();
  if (!user) {
    return unauthorizedResponse();
  }

  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: "Invalid submission form data." }, { status: 400 });
  }

  const payload = createSubmissionSchema.safeParse({
    round: formData.get("round"),
    title: formData.get("title"),
    summary: formData.get("summary"),
  });

  if (!payload.success) {
    return NextResponse.json(
      { error: "Invalid submission payload.", issues: payload.error.flatten() },
      { status: 400 },
    );
  }

  const resourceFile = formData.get("resourceFile");
  if (!(resourceFile instanceof File)) {
    return NextResponse.json(
      { error: "Upload a PDF file before submitting." },
      { status: 400 },
    );
  }

  const validationError = getSubmissionValidationError(resourceFile);
  if (validationError === "type") {
    return NextResponse.json({ error: "Only PDF files are allowed." }, { status: 400 });
  }

  if (validationError === "size") {
    return NextResponse.json({ error: "The uploaded PDF must be 20MB or smaller." }, { status: 400 });
  }

  if (validationError === "missing") {
    return NextResponse.json(
      { error: "Upload a PDF file before submitting." },
      { status: 400 },
    );
  }

  const round =
    payload.data.round === "round-3"
      ? SubmissionRound.ROUND_3
      : SubmissionRound.ROUND_2;
  const storageKey = buildTeamSubmissionStorageKey(user.id, resourceFile.name);
  const fileBuffer = Buffer.from(await resourceFile.arrayBuffer());

  try {
    await storeTeamSubmissionFile(storageKey, fileBuffer);
  } catch {
    return NextResponse.json(
      { error: "The uploaded file could not be saved on the server." },
      { status: 500 },
    );
  }

  const result = await createTeamSubmission(user.id, {
    round,
    title: payload.data.title,
    summary: payload.data.summary,
    resourceLabel: resourceFile.name,
    resourceStorageKey: storageKey,
    resourceMimeType: resourceFile.type || undefined,
    resourceSizeBytes: resourceFile.size,
  });

  if (!result.ok) {
    await deleteTeamSubmissionFile(storageKey).catch(() => {});
  } else if (round === SubmissionRound.ROUND_2) {
    await sendRound2SubmissionUploadConfirmation({
      teamLeadEmail: user.email,
      teamLeadName: user.name,
      teamName: result.data.teamName,
      version: result.data.version,
      fileName: resourceFile.name,
      fileBuffer,
      mimeType: resourceFile.type || undefined,
    });
  }

  return serviceResultToResponse(result);
}
