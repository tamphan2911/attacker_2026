import { SubmissionRound, TeamSubmissionResourceSource, UserRole } from "@prisma/client";

import { prisma } from "@/lib/db";
import { getTimelineItemById } from "@/lib/competition";
import { getTimelineEndDateTime } from "@/lib/timeline-dates";
import { syncJudgeAccounts } from "@/server/judge-accounts";
import { readStoredJudges } from "@/server/admin-service";
import { ensureRound2JudgeAssignments } from "@/server/round2-judge-assignment";
import { deleteTeamSubmissionFile } from "@/server/team-submission-storage";
import { readTimelineItems } from "@/server/timeline-items";
import type {
  AdminRound2AssignedJudgeRecord,
  AdminRound2AssignmentStatus,
  AdminRound2JudgeOption,
  AdminRound2SubmissionRow,
} from "@/types/admin-round2-submissions";

type ServiceSuccess<T> = {
  ok: true;
  status: number;
  data: T;
};

type ServiceFailure = {
  ok: false;
  status: number;
  error: string;
};

type ServiceResult<T> = ServiceSuccess<T> | ServiceFailure;

function ok<T>(data: T, status = 200): ServiceSuccess<T> {
  return { ok: true, status, data };
}

function fail(status: number, error: string): ServiceFailure {
  return { ok: false, status, error };
}

function createAssignmentStatus(count: number): AdminRound2AssignmentStatus {
  if (count >= 2) {
    return "fully-assigned";
  }

  if (count === 1) {
    return "partially-assigned";
  }

  return "unassigned";
}

export async function readAdminRound2JudgeOptions(): Promise<AdminRound2JudgeOption[]> {
  await syncJudgeAccounts();
  const storedJudges = await readStoredJudges();
  const round2JudgeProfileIds = storedJudges
    .filter((judge) => judge.rounds.includes("round-2"))
    .map((judge) => judge.id);

  if (round2JudgeProfileIds.length === 0) {
    return [];
  }

  const users = await prisma.user.findMany({
    where: {
      role: UserRole.JUDGE,
      judgeProfileId: {
        in: round2JudgeProfileIds,
      },
    },
    select: {
      id: true,
      name: true,
      loginId: true,
      judgeProfileId: true,
      university: true,
    },
    orderBy: [{ name: "asc" }],
  });

  return users.map((user) => {
    const profile = storedJudges.find((judge) => judge.id === user.judgeProfileId);

    return {
      judgeUserId: user.id,
      judgeName: user.name,
      judgeLoginId: user.loginId,
      judgeProfileId: user.judgeProfileId ?? undefined,
      organization: profile?.organization ?? user.university,
    };
  });
}

export async function readAdminRound2SubmissionRows(): Promise<{
  rows: AdminRound2SubmissionRow[];
  availableJudges: AdminRound2JudgeOption[];
  round2Closed: boolean;
}> {
  const timelineItems = await readTimelineItems();
  const round2DeadlineItem = getTimelineItemById("round-2-report-submission", timelineItems);
  const round2Closed = round2DeadlineItem
    ? new Date().getTime() > getTimelineEndDateTime(round2DeadlineItem).getTime()
    : false;

  if (round2Closed) {
    await ensureRound2JudgeAssignments(prisma);
  }

  const [submissions, availableJudges] = await Promise.all([
    prisma.teamSubmission.findMany({
      where: {
        round: SubmissionRound.ROUND_2,
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
        judgeReviews: {
          orderBy: [{ createdAt: "asc" }],
          include: {
            judgeUser: {
              select: {
                id: true,
                role: true,
                name: true,
                loginId: true,
                judgeProfileId: true,
                university: true,
              },
            },
          },
        },
      },
    }),
    readAdminRound2JudgeOptions(),
  ]);

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

  const availableJudgeByUserId = new Map(availableJudges.map((judge) => [judge.judgeUserId, judge]));

  const rows = submissions.map<AdminRound2SubmissionRow>((submission) => {
    const isLatest = latestByTeam.get(submission.teamId)?.id === submission.id;
    const visibleJudgeReviews = isLatest && round2Closed ? submission.judgeReviews : [];
    const assignedJudges = visibleJudgeReviews
      .filter((review) => review.judgeUser.role === UserRole.JUDGE)
      .slice(0, 2)
      .map<AdminRound2AssignedJudgeRecord>((review) => ({
        judgeUserId: review.judgeUser.id,
        judgeName: review.judgeUser.name,
        judgeLoginId: review.judgeUser.loginId,
        judgeProfileId: review.judgeUser.judgeProfileId ?? undefined,
        organization: availableJudgeByUserId.get(review.judgeUser.id)?.organization ?? review.judgeUser.university,
        score: review.score ?? undefined,
        scoredAt: review.scoredAt?.toISOString(),
      }));
    const assignmentLocked = assignedJudges.some((judge) => Boolean(judge.scoredAt));

    return {
      submissionId: submission.id,
      teamId: submission.team.id,
      teamName: submission.team.name,
      teamTag: submission.team.tag,
      title: submission.title,
      version: submission.version,
      isLatest: isLatest ? "valid latest" : "history only",
      resourceLabel: submission.resourceLabel,
      resourceUrl:
        submission.resourceSource === TeamSubmissionResourceSource.UPLOAD && submission.resourceStorageKey
          ? `/api/team-submissions/${submission.id}/file`
          : submission.resourceUrl ?? undefined,
      resourceSource: submission.resourceSource === TeamSubmissionResourceSource.UPLOAD ? "upload" : "external",
      submittedAt: submission.submittedAt.toISOString(),
      submittedByUserId: submission.submittedByUser.id,
      submittedByName: submission.submittedByUser.name,
      submittedByLoginId: submission.submittedByUser.loginId,
      assignmentStatus: createAssignmentStatus(assignedJudges.length),
      assignedJudges,
      canAssign: isLatest && round2Closed,
      assignmentLocked,
    };
  });

  return {
    rows,
    availableJudges,
    round2Closed,
  };
}

export async function assignJudgesToRound2Submission(
  submissionId: string,
  judgeUserIds: string[],
): Promise<ServiceResult<{ saved: true }>> {
  void submissionId;
  void judgeUserIds;

  return fail(403, "Round 2 judge assignment is automatic after the submission deadline.");
}

export async function deleteRound2SubmissionByAdmin(
  submissionId: string,
): Promise<ServiceResult<{ deleted: true }>> {
  const submission = await prisma.teamSubmission.findUnique({
    where: { id: submissionId },
    select: {
      id: true,
      round: true,
      resourceSource: true,
      resourceStorageKey: true,
    },
  });

  if (!submission || submission.round !== SubmissionRound.ROUND_2) {
    return fail(404, "Round 2 submission not found.");
  }

  await prisma.teamSubmission.delete({
    where: { id: submissionId },
  });

  if (
    submission.resourceSource === TeamSubmissionResourceSource.UPLOAD &&
    submission.resourceStorageKey
  ) {
    await deleteTeamSubmissionFile(submission.resourceStorageKey).catch(() => {});
  }

  return ok({ deleted: true });
}
