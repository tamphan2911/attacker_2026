import { UserRole, type Prisma } from "@prisma/client";

import { judgeProfiles } from "@/data/site-content";
import { syncJudgeAccounts } from "@/server/judge-accounts";
import type { JudgeProfile } from "@/types/site";

type AssignmentDb = Pick<
  Prisma.TransactionClient,
  "cmsEntry" | "round1JudgeReview" | "round1Submission" | "user"
>;

const JUDGES_SCOPE = "site-judges";
let judgeAccountsSynced = false;

async function ensureJudgeAccountsSynced() {
  if (judgeAccountsSynced) {
    return;
  }

  await syncJudgeAccounts();
  judgeAccountsSynced = true;
}

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

async function readRound1JudgeProfileIds(db: AssignmentDb) {
  const cmsEntry = await db.cmsEntry.findUnique({
    where: { scope: JUDGES_SCOPE },
    select: { payload: true },
  });

  return parseStoredJudges(cmsEntry?.payload)
    .filter((judge) => judge.rounds.includes("round-1"))
    .map((judge) => judge.id);
}

async function readRound1JudgeUserIds(db: AssignmentDb) {
  const judgeProfileIds = await readRound1JudgeProfileIds(db);
  if (judgeProfileIds.length === 0) {
    return [];
  }

  const judgeUsers = await db.user.findMany({
    where: {
      role: UserRole.JUDGE,
      judgeProfileId: { in: judgeProfileIds },
    },
    select: { id: true },
    orderBy: { id: "asc" },
  });

  return judgeUsers.map((judge) => judge.id);
}

export async function assignRound1SubmissionToRandomJudge(
  db: AssignmentDb,
  submissionId: string,
) {
  const existingAssignment = await db.round1JudgeReview.findFirst({
    where: { submissionId },
    select: { id: true, judgeUserId: true },
  });

  if (existingAssignment) {
    return existingAssignment;
  }

  await ensureJudgeAccountsSynced();

  const judgeUserIds = await readRound1JudgeUserIds(db);
  if (judgeUserIds.length === 0) {
    return null;
  }

  const judgeUserId = judgeUserIds[Math.floor(Math.random() * judgeUserIds.length)];

  return db.round1JudgeReview.upsert({
    where: {
      judgeUserId_submissionId: {
        judgeUserId,
        submissionId,
      },
    },
    update: {},
    create: {
      judgeUserId,
      submissionId,
    },
    select: { id: true, judgeUserId: true },
  });
}

export async function ensureRound1JudgeAssignments(db: AssignmentDb) {
  const submissionsWithoutAssignment = await db.round1Submission.findMany({
    where: {
      judgeReviews: {
        none: {},
      },
    },
    select: { id: true },
    orderBy: { submittedAt: "asc" },
  });

  for (const submission of submissionsWithoutAssignment) {
    await assignRound1SubmissionToRandomJudge(db, submission.id);
  }

  return submissionsWithoutAssignment.length;
}
