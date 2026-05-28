import { SubmissionRound, TeamSubmissionResourceSource } from "@prisma/client";

import { prisma } from "@/lib/db";
import type { AdminRound3SubmissionRow } from "@/types/admin-round3-submissions";

export async function readAdminRound3SubmissionRows(): Promise<{ rows: AdminRound3SubmissionRow[] }> {
  const submissions = await prisma.teamSubmission.findMany({
    where: {
      round: SubmissionRound.ROUND_3,
    },
    orderBy: [{ submittedAt: "desc" }, { version: "desc" }],
    include: {
      team: {
        select: {
          id: true,
          name: true,
          tag: true,
        },
      },
      submittedByUser: {
        select: {
          id: true,
          name: true,
          loginId: true,
        },
      },
    },
  });

  const latestByTeam = new Map<string, (typeof submissions)[number]>();
  for (const submission of submissions) {
    const currentLatest = latestByTeam.get(submission.teamId);
    if (
      !currentLatest ||
      submission.version > currentLatest.version ||
      (submission.version === currentLatest.version &&
        submission.submittedAt.getTime() > currentLatest.submittedAt.getTime())
    ) {
      latestByTeam.set(submission.teamId, submission);
    }
  }

  return {
    rows: submissions.map<AdminRound3SubmissionRow>((submission) => ({
      submissionId: submission.id,
      teamId: submission.team.id,
      teamName: submission.team.name,
      teamTag: submission.team.tag,
      title: submission.title,
      version: submission.version,
      isLatest: latestByTeam.get(submission.teamId)?.id === submission.id ? "valid latest" : "history only",
      resourceLabel: submission.resourceLabel,
      resourceUrl:
        submission.resourceSource === TeamSubmissionResourceSource.UPLOAD && submission.resourceStorageKey
          ? `/api/team-submissions/${submission.id}/file`
          : submission.resourceUrl ?? undefined,
      resourceSource: submission.resourceSource === TeamSubmissionResourceSource.UPLOAD ? "upload" : "external",
      resourceSizeBytes: submission.resourceSizeBytes ?? undefined,
      submittedAt: submission.submittedAt.toISOString(),
      submittedByUserId: submission.submittedByUser.id,
      submittedByName: submission.submittedByUser.name,
      submittedByLoginId: submission.submittedByUser.loginId,
    })),
  };
}
