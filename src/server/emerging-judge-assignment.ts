import { SubmissionRound, UserRole, type Prisma } from "@prisma/client";

import { judgeProfiles } from "@/data/site-content";
import { getSubmissionDeadlineTimelineItem } from "@/lib/competition";
import { getTimelineEndDateTime } from "@/lib/timeline-dates";
import { readRound2FinalistResults } from "@/server/round2-finalists";
import { syncJudgeAccounts } from "@/server/judge-accounts";
import { readTimelineItems } from "@/server/timeline-items";
import type { JudgeProfile } from "@/types/site";

type AssignmentDb = Pick<
  Prisma.TransactionClient,
  "cmsEntry" | "teamSubmission" | "teamSubmissionJudgeReview" | "user"
>;

const JUDGES_SCOPE = "site-judges";

type LatestEmergingSubmission = Prisma.TeamSubmissionGetPayload<{
  include: {
    judgeReviews: {
      include: {
        judgeUser: {
          select: {
            id: true;
            role: true;
          };
        };
      };
    };
    aiReportReview: true;
  };
}>;

function parseStoredJudges(payload: string | null | undefined): JudgeProfile[] {
  if (!payload) {
    return judgeProfiles;
  }

  try {
    const parsed = JSON.parse(payload) as JudgeProfile[];
    return Array.isArray(parsed) ? parsed : judgeProfiles;
  } catch {
    return judgeProfiles;
  }
}

function pickRandomJudgeId(judgeUserIds: string[]) {
  if (judgeUserIds.length === 0) {
    return null;
  }

  return judgeUserIds[Math.floor(Math.random() * judgeUserIds.length)] ?? null;
}

export async function readEmergingSubmissionLockState(now = new Date()) {
  const timelineItems = await readTimelineItems();
  const submissionDeadline = getSubmissionDeadlineTimelineItem("round-3", timelineItems);

  if (!submissionDeadline) {
    return {
      closed: false,
      deadlineAt: undefined as Date | undefined,
    };
  }

  const deadlineAt = getTimelineEndDateTime(submissionDeadline);

  return {
    closed: now.getTime() > deadlineAt.getTime(),
    deadlineAt,
  };
}

async function readEmergingJudgeUserIds(db: AssignmentDb) {
  await syncJudgeAccounts();

  const cmsEntry = await db.cmsEntry.findUnique({
    where: { scope: JUDGES_SCOPE },
    select: { payload: true },
  });
  const judgeProfileIds = parseStoredJudges(cmsEntry?.payload)
    .filter((judge) => judge.rounds.includes("round-3"))
    .map((judge) => judge.id);

  if (judgeProfileIds.length === 0) {
    return [];
  }

  const users = await db.user.findMany({
    where: {
      role: UserRole.JUDGE,
      judgeProfileId: { in: judgeProfileIds },
    },
    select: { id: true },
    orderBy: { id: "asc" },
  });

  return users.map((user) => user.id);
}

export async function readLatestEmergingSubmissions(db: AssignmentDb) {
  const { closed, deadlineAt } = await readEmergingSubmissionLockState();
  if (!closed) {
    return {
      closed,
      deadlineAt,
      submissions: [] as Array<Awaited<ReturnType<typeof db.teamSubmission.findMany>>[number]>,
    };
  }

  const round2Results = await readRound2FinalistResults();
  const emergingTeamIds = new Set(round2Results.emergingTeams.map((team) => team.id));
  if (!round2Results.released || emergingTeamIds.size === 0) {
    return { closed, deadlineAt, submissions: [] as LatestEmergingSubmission[] };
  }

  const submissions = await db.teamSubmission.findMany({
    where: {
      round: SubmissionRound.ROUND_3,
      teamId: { in: Array.from(emergingTeamIds) },
      ...(deadlineAt ? { submittedAt: { lte: deadlineAt } } : {}),
    },
    orderBy: [{ submittedAt: "desc" }, { version: "desc" }],
    include: {
      judgeReviews: {
        include: {
          judgeUser: {
            select: {
              id: true,
              role: true,
            },
          },
        },
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      },
      aiReportReview: true,
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
    closed,
    deadlineAt,
    submissions: Array.from(latestByTeam.values()) as LatestEmergingSubmission[],
  };
}

export async function ensureEmergingJudgeAssignments(db: AssignmentDb) {
  const { closed, submissions } = await readLatestEmergingSubmissions(db);
  if (!closed || submissions.length === 0) {
    return 0;
  }

  const judgeUserIds = await readEmergingJudgeUserIds(db);
  if (judgeUserIds.length === 0) {
    return 0;
  }

  let created = 0;
  for (const submission of submissions) {
    const existingJudgeReview = submission.judgeReviews.find((review) => review.judgeUser.role === UserRole.JUDGE);
    if (existingJudgeReview) {
      continue;
    }

    const judgeUserId = pickRandomJudgeId(judgeUserIds);
    if (!judgeUserId) {
      continue;
    }

    await db.teamSubmissionJudgeReview.create({
      data: {
        submissionId: submission.id,
        judgeUserId,
      },
    });
    created += 1;
  }

  return created;
}
