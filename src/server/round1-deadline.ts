import {
  Round1BankStatus,
  Round1TestBankType,
  TeamRound1LockStatus,
  UserRole,
} from "@prisma/client";

import { TEAM_MIN_MEMBERS } from "@/data/site-content";
import { getCompetitionRoundWindow, getTimelineItemById } from "@/lib/competition";
import { prisma } from "@/lib/db";
import { ROUND1_OBJECTIVE_TOTAL } from "@/lib/round1";
import { getTimelineEndDateTime, getTimelineStartDateTime } from "@/lib/timeline-dates";
import { readTimelineItems } from "@/server/timeline-items";

export type Round1ExamWindowStatus = "not-started" | "open" | "closed";

function parseStoredJson<T>(value: string, fallback: T) {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export async function getRound1ExamWindowState(now = new Date()) {
  const timelineItems = await readTimelineItems();
  const round1Window =
    getTimelineItemById("round-1-individual-qualifier", timelineItems) ??
    getCompetitionRoundWindow("round-1", timelineItems) ??
    getCompetitionRoundWindow("round-1");

  if (!round1Window) {
    return {
      status: "open" as Round1ExamWindowStatus,
      startsAt: null,
      endsAt: null,
    };
  }

  const startsAt = getTimelineStartDateTime(round1Window);
  const endsAt = getTimelineEndDateTime(round1Window);
  const nowMs = now.getTime();

  return {
    status:
      nowMs < startsAt.getTime()
        ? ("not-started" as const)
        : nowMs > endsAt.getTime()
          ? ("closed" as const)
          : ("open" as const),
    startsAt,
    endsAt,
  };
}

export async function syncRound1DeadlineForfeitures(options?: {
  now?: Date;
  userId?: string;
}) {
  const now = options?.now ?? new Date();
  const windowState = await getRound1ExamWindowState(now);

  if (windowState.status !== "closed" || !windowState.endsAt) {
    return { applied: false, forfeitedCount: 0 };
  }

  return prisma.$transaction(async (tx) => {
    const teams = await tx.team.findMany({
      where: {
        round1LockStatus: TeamRound1LockStatus.LOCKED,
        ...(options?.userId
          ? {
              members: {
                some: { userId: options.userId },
              },
            }
          : {}),
      },
      select: {
        id: true,
        members: {
          where: {
            user: { role: UserRole.STUDENT },
          },
          select: { userId: true },
        },
      },
    });

    const eligibleMembers = teams
      .filter((team) => team.members.length >= TEAM_MIN_MEMBERS)
      .flatMap((team) => team.members.map((member) => ({ teamId: team.id, userId: member.userId })));

    if (eligibleMembers.length === 0) {
      return { applied: true, forfeitedCount: 0 };
    }

    const eligibleUserIds = eligibleMembers.map((member) => member.userId);
    const [existingSubmissions, attempts] = await Promise.all([
      tx.round1Submission.findMany({
        where: { userId: { in: eligibleUserIds } },
        select: { userId: true },
      }),
      tx.round1ExamAttempt.findMany({
        where: { userId: { in: eligibleUserIds } },
      }),
    ]);

    const submittedUserIds = new Set(existingSubmissions.map((submission) => submission.userId));
    const attemptsByUserId = new Map(attempts.map((attempt) => [attempt.userId, attempt]));
    const missingMembers = eligibleMembers.filter((member) => !submittedUserIds.has(member.userId));

    if (missingMembers.length === 0) {
      return { applied: true, forfeitedCount: 0 };
    }

    const needsFallbackBank = missingMembers.some((member) => !attemptsByUserId.has(member.userId));
    const fallbackBank = needsFallbackBank
      ? (await tx.round1TestBank.findFirst({
          where: {
            bankType: Round1TestBankType.OBJECTIVE,
            status: Round1BankStatus.ACTIVE,
          },
          select: { id: true },
          orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
        })) ??
        (await tx.round1TestBank.findFirst({
          where: { bankType: Round1TestBankType.OBJECTIVE },
          select: { id: true },
          orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
        }))
      : null;
    let forfeitedCount = 0;

    for (const member of missingMembers) {
      const attempt = attemptsByUserId.get(member.userId);
      const bankId = attempt?.bankId ?? fallbackBank?.id;
      if (!bankId) {
        continue;
      }

      const archive = attempt
        ? {
            questions: parseStoredJson(attempt.questions, []),
            answers: parseStoredJson(attempt.answers, {}),
            essayQuestionScores: {},
            forfeited: true,
          }
        : {
            questions: [],
            answers: {},
            essayQuestionScores: {},
            forfeited: true,
          };

      await tx.round1Submission.upsert({
        where: { userId: member.userId },
        update: {},
        create: {
          bankId,
          teamId: member.teamId,
          userId: member.userId,
          submittedAt: windowState.endsAt,
          isForfeited: true,
          rightCount: 0,
          wrongCount: ROUND1_OBJECTIVE_TOTAL,
          score: 0,
          objectiveScore: 0,
          essayScore: 0,
          totalScore: 0,
          durationMinutes: 0,
          answers: JSON.stringify(archive),
        },
      });

      await tx.round1ExamAttempt.deleteMany({
        where: { userId: member.userId },
      });
      forfeitedCount += 1;
    }

    return { applied: true, forfeitedCount };
  });
}
