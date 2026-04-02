import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { getCurrentDbUser, hasElevatedRole } from "@/server/auth-helpers";
import { readTeamSubmissionFile } from "@/server/team-submission-storage";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  context: { params: Promise<{ submissionId: string }> },
) {
  const currentUser = await getCurrentDbUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { submissionId } = await context.params;
  const submission = await prisma.teamSubmission.findUnique({
    where: { id: submissionId },
    include: {
      team: {
        include: {
          members: {
            select: { userId: true },
          },
        },
      },
    },
  });

  if (!submission) {
    return NextResponse.json({ error: "Submission file not found." }, { status: 404 });
  }

  const canAccessFile =
    hasElevatedRole(currentUser.role) ||
    submission.team.members.some((member) => member.userId === currentUser.id);

  if (!canAccessFile) {
    return NextResponse.json({ error: "You do not have access to this submission file." }, { status: 403 });
  }

  if (!submission.resourceStorageKey) {
    return NextResponse.json({ error: "No stored file exists for this submission." }, { status: 404 });
  }

  let fileBuffer: Buffer;

  try {
    fileBuffer = await readTeamSubmissionFile(submission.resourceStorageKey);
  } catch {
    return NextResponse.json({ error: "The stored submission file is unavailable." }, { status: 404 });
  }

  const safeFileName = submission.resourceLabel.replace(/"/g, "");

  return new Response(new Uint8Array(fileBuffer), {
    status: 200,
    headers: {
      "Content-Type": submission.resourceMimeType || "application/octet-stream",
      "Content-Length": String(fileBuffer.byteLength),
      "Content-Disposition": `attachment; filename="${safeFileName}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
