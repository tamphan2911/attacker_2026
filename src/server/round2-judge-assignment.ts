import {
  CompetitionStage,
  SubmissionRound,
  UserRole,
  type Prisma,
} from "@prisma/client";

import { getTimelineItemById } from "@/lib/competition";
import { judgeProfiles } from "@/data/site-content";
import { syncJudgeAccounts } from "@/server/judge-accounts";
import { readTimelineItems } from "@/server/timeline-items";
import type { JudgeProfile } from "@/types/site";

type AssignmentDb = Pick<
  Prisma.TransactionClient,
  | "cmsEntry"
  | "round2TeamJudgeAssignment"
  | "team"
  | "teamSubmission"
  | "teamSubmissionJudgeReview"
  | "user"
>;

const JUDGES_SCOPE = "site-judges";

function endOfVietnamDay(date: string) {
  return new Date(`${date}T23:59:59.999+07:00`);
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

export async function isRound2SubmissionClosed(now = new Date()) {
  const timelineItems = await readTimelineItems();
  const submissionDeadline = getTimelineItemById("round-2-report-submission", timelineItems);

  if (!submissionDeadline) {
    return false;
  }

  return now.getTime() > endOfVietnamDay(submissionDeadline.endDate).getTime();
}

async function readRound2TeamIds(db: AssignmentDb, teamIds?: string[]) {
  if (teamIds) {
    return teamIds;
  }

  const teams = await db.team.findMany({
    where: { stage: CompetitionStage.ROUND_2 },
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });

  return teams.map((team) => team.id);
}

async function readRound2JudgeProfileIds(db: AssignmentDb) {
  const cmsEntry = await db.cmsEntry.findUnique({
    where: { scope: JUDGES_SCOPE },
    select: { payload: true },
  });

  return parseStoredJudges(cmsEntry?.payload)
    .filter((judge) => judge.rounds.includes("round-2"))
    .map((judge) => judge.id);
}

async function readRound2JudgeUserIds(db: AssignmentDb) {
  const judgeProfileIds = await readRound2JudgeProfileIds(db);
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

function pickRandomJudgeIds(judgeUserIds: string[], count: number) {
  const pool = [...judgeUserIds];
  const picked: string[] = [];

  while (pool.length > 0 && picked.length < count) {
    const index = Math.floor(Math.random() * pool.length);
    const [judgeUserId] = pool.splice(index, 1);
    if (judgeUserId) {
      picked.push(judgeUserId);
    }
  }

  return picked;
}

export async function ensureRound2TeamJudgeAssignments(
  db: AssignmentDb,
  options: { teamIds?: string[] } = {},
) {
  await syncJudgeAccounts();

  const [teamIds, judgeUserIds] = await Promise.all([
    readRound2TeamIds(db, options.teamIds),
    readRound2JudgeUserIds(db),
  ]);

  if (teamIds.length === 0 || judgeUserIds.length < 2) {
    return 0;
  }

  const existingAssignments = await db.round2TeamJudgeAssignment.findMany({
    where: { teamId: { in: teamIds } },
    select: { teamId: true, judgeUserId: true },
  });

  const assignedJudgeIdsByTeamId = new Map<string, string[]>();
  for (const assignment of existingAssignments) {
    const current = assignedJudgeIdsByTeamId.get(assignment.teamId) ?? [];
    current.push(assignment.judgeUserId);
    assignedJudgeIdsByTeamId.set(assignment.teamId, current);
  }

  let created = 0;

  for (const teamId of teamIds) {
    const existingJudgeIds = assignedJudgeIdsByTeamId.get(teamId) ?? [];
    if (existingJudgeIds.length >= 2) {
      continue;
    }

    const existingJudgeIdSet = new Set(existingJudgeIds);
    const candidates = judgeUserIds.filter(
      (judgeUserId) => !existingJudgeIdSet.has(judgeUserId),
    );
    const selectedJudgeIds = pickRandomJudgeIds(
      candidates,
      2 - existingJudgeIds.length,
    );

    for (const judgeUserId of selectedJudgeIds) {
      await db.round2TeamJudgeAssignment.upsert({
        where: {
          teamId_judgeUserId: {
            teamId,
            judgeUserId,
          },
        },
        update: {},
        create: {
          teamId,
          judgeUserId,
        },
      });
      created += 1;
    }
  }

  return created;
}

export async function attachRound2SubmissionJudgeAssignments(
  db: AssignmentDb,
  submissionId: string,
  teamId: string,
) {
  await ensureRound2TeamJudgeAssignments(db, { teamIds: [teamId] });

  const assignments = await db.round2TeamJudgeAssignment.findMany({
    where: { teamId },
    select: { judgeUserId: true },
    orderBy: { createdAt: "asc" },
    take: 2,
  });

  let created = 0;
  for (const assignment of assignments) {
    await db.teamSubmissionJudgeReview.upsert({
      where: {
        judgeUserId_submissionId: {
          judgeUserId: assignment.judgeUserId,
          submissionId,
        },
      },
      update: {},
      create: {
        judgeUserId: assignment.judgeUserId,
        submissionId,
      },
    });
    created += 1;
  }

  return created;
}

export async function ensureRound2JudgeAssignments(db: AssignmentDb) {
  const submissions = await db.teamSubmission.findMany({
    where: { round: SubmissionRound.ROUND_2 },
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
        orderBy: [{ createdAt: "asc" }],
      },
    },
  });

  const latestByTeam = new Map<string, (typeof submissions)[number]>();
  for (const submission of submissions) {
    if (!latestByTeam.has(submission.teamId)) {
      latestByTeam.set(submission.teamId, submission);
    }
  }

  let created = 0;

  for (const submission of latestByTeam.values()) {
    created += await ensureRound2TeamJudgeAssignments(db, {
      teamIds: [submission.teamId],
    });

    const existingJudgeIds = submission.judgeReviews
      .filter((review) => review.judgeUser.role === UserRole.JUDGE)
      .map((review) => review.judgeUserId);

    if (existingJudgeIds.length >= 2) {
      continue;
    }

    const teamAssignments = await db.round2TeamJudgeAssignment.findMany({
      where: { teamId: submission.teamId },
      select: { judgeUserId: true },
      orderBy: { createdAt: "asc" },
      take: 2,
    });
    const selectedJudgeIds = teamAssignments
      .map((assignment) => assignment.judgeUserId)
      .filter((judgeUserId) => !existingJudgeIds.includes(judgeUserId))
      .slice(0, 2 - existingJudgeIds.length);

    for (const judgeUserId of selectedJudgeIds) {
      await db.teamSubmissionJudgeReview.upsert({
        where: {
          judgeUserId_submissionId: {
            judgeUserId,
            submissionId: submission.id,
          },
        },
        update: {},
        create: {
          judgeUserId,
          submissionId: submission.id,
        },
      });
      created += 1;
    }
  }

  return created;
}
