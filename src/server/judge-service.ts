import { SubmissionRound, UserRole } from "@prisma/client";

import { ROUND1_ESSAY_MAX_SCORE, countWords } from "@/lib/round1";
import { prisma } from "@/lib/db";
import { readStoredJudges } from "@/server/admin-service";
import { ensureRound1JudgeAssignments } from "@/server/round1-judge-assignment";
import { ensureRound1SubmissionArchive } from "@/server/round1-submission-archive";
import type {
  CompetitionRoundKey,
  JudgeAssignmentSummary,
  JudgeDashboardData,
  JudgeDashboardRound1Task,
  JudgeDashboardRoundGroup,
  JudgeDashboardTeamTask,
  JudgeRound1Detail,
  JudgeTeamSubmissionDetail,
  LocalizedText,
} from "@/types/site";

import type { ServiceResult } from "@/server/team-service";

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

function ok<T>(data: T, status = 200): ServiceSuccess<T> {
  return { ok: true, status, data };
}

function fail(status: number, error: string): ServiceFailure {
  return { ok: false, status, error };
}

function normalizeRoundFromSubmission(round: SubmissionRound): CompetitionRoundKey {
  return round === SubmissionRound.ROUND_3 ? "round-3" : "round-2";
}

async function getJudgeAssignmentSummary(userId: string): Promise<ServiceResult<JudgeAssignmentSummary>> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      role: true,
      judgeProfileId: true,
    },
  });

  if (!user) {
    return fail(404, "User not found.");
  }

  if (user.role !== UserRole.JUDGE) {
    return fail(403, "Only judge accounts can access this dashboard.");
  }

  if (!user.judgeProfileId) {
    return fail(409, "This judge account is not linked to a judge profile yet.");
  }

  const judges = await readStoredJudges();
  const profile = judges.find((judge) => judge.id === user.judgeProfileId);

  if (!profile) {
    return fail(404, "Judge profile not found.");
  }

  return ok({
    userId: user.id,
    judgeProfileId: profile.id,
    name: user.name,
    position: profile.role.en || profile.role.vi,
    organization: profile.organization,
    rounds: profile.rounds,
  });
}

function isScored(review?: { score: number | null; scoredAt: Date | null } | null) {
  return Boolean(review && review.score != null && review.scoredAt);
}

export async function getJudgeDashboardData(userId: string): Promise<ServiceResult<JudgeDashboardData>> {
  const assignment = await getJudgeAssignmentSummary(userId);
  if (!assignment.ok) {
    return assignment;
  }

  const rounds = assignment.data.rounds;
  const groups: JudgeDashboardRoundGroup[] = [];

  if (rounds.includes("round-1")) {
    await ensureRound1JudgeAssignments(prisma);

    const round1Submissions = await prisma.round1Submission.findMany({
      where: {
        judgeReviews: {
          some: { judgeUserId: userId },
        },
      },
      orderBy: { submittedAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            university: true,
          },
        },
        team: {
          select: {
            id: true,
            name: true,
            tag: true,
          },
        },
        judgeReviews: {
          where: { judgeUserId: userId },
          select: {
            score: true,
            scoredAt: true,
          },
          take: 1,
        },
      },
    });

    const tasks: JudgeDashboardRound1Task[] = round1Submissions.map((submission) => {
      const review = submission.judgeReviews[0];

      return {
        kind: "round-1",
        submissionId: submission.id,
        participantId: submission.user.id,
        participantName: submission.user.name,
        participantUniversity: submission.user.university,
        teamId: submission.team.id,
        teamName: submission.team.name,
        teamTag: submission.team.tag,
        submittedAt: submission.submittedAt.toISOString(),
        status: isScored(review) ? "scored" : "pending",
        scoredAt: review?.scoredAt?.toISOString(),
      };
    });

    groups.push({
      round: "round-1",
      tasks,
    });
  }

  const requestedSubmissionRounds = rounds
    .filter((round): round is Exclude<CompetitionRoundKey, "round-1"> => round !== "round-1")
    .map((round) => (round === "round-3" ? SubmissionRound.ROUND_3 : SubmissionRound.ROUND_2));

  if (requestedSubmissionRounds.length > 0) {
    const submissions = await prisma.teamSubmission.findMany({
      where: {
        round: {
          in: requestedSubmissionRounds,
        },
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
            name: true,
          },
        },
        judgeReviews: {
          where: { judgeUserId: userId },
          select: {
            score: true,
            scoredAt: true,
          },
          take: 1,
        },
      },
    });

    const latestByRoundTeam = new Map<string, typeof submissions[number]>();
    for (const submission of submissions) {
      const key = `${submission.round}:${submission.teamId}`;
      if (!latestByRoundTeam.has(key)) {
        latestByRoundTeam.set(key, submission);
      }
    }

    for (const round of ["round-2", "round-3"] as const) {
      if (!rounds.includes(round)) {
        continue;
      }

      const tasks: JudgeDashboardTeamTask[] = Array.from(latestByRoundTeam.values())
        .filter((submission) => {
          if (normalizeRoundFromSubmission(submission.round) !== round) {
            return false;
          }

          if (round === "round-2") {
            return submission.judgeReviews.length > 0;
          }

          return true;
        })
        .sort((left, right) => right.submittedAt.getTime() - left.submittedAt.getTime())
        .map((submission) => {
          const review = submission.judgeReviews[0];

          return {
            kind: round,
            submissionId: submission.id,
            teamId: submission.team.id,
            teamName: submission.team.name,
            teamTag: submission.team.tag,
            title: submission.title,
            version: submission.version,
            submittedAt: submission.submittedAt.toISOString(),
            submittedByName: submission.submittedByUser.name,
            resourceLabel: submission.resourceLabel,
            resourceUrl:
              submission.resourceStorageKey || submission.resourceUrl
                ? `/api/team-submissions/${submission.id}/file`
                : undefined,
            status: isScored(review) ? "scored" : "pending",
            scoredAt: review?.scoredAt?.toISOString(),
          };
        });

      groups.push({
        round,
        tasks,
      });
    }
  }

  return ok({
    judge: assignment.data,
    rounds: groups,
  });
}

export async function getJudgeRound1Detail(
  userId: string,
  submissionId: string,
): Promise<ServiceResult<JudgeRound1Detail>> {
  const assignment = await getJudgeAssignmentSummary(userId);
  if (!assignment.ok) {
    return assignment;
  }

  if (!assignment.data.rounds.includes("round-1")) {
    return fail(403, "This judge is not assigned to Round 1.");
  }

  await ensureRound1JudgeAssignments(prisma);

  const submission = await prisma.round1Submission.findUnique({
    where: { id: submissionId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          university: true,
        },
      },
      team: {
        select: {
          id: true,
          name: true,
          tag: true,
        },
      },
      judgeReviews: {
        where: { judgeUserId: userId },
        select: {
          score: true,
          note: true,
          scoredAt: true,
        },
        take: 1,
      },
    },
  });

  if (!submission) {
    return fail(404, "Round 1 submission not found.");
  }

  if (submission.judgeReviews.length === 0) {
    return fail(403, "This judge is not assigned to this Round 1 submission.");
  }

  const archive = await ensureRound1SubmissionArchive({
    id: submission.id,
    bankId: submission.bankId,
    answers: submission.answers,
    rightCount: submission.rightCount,
    essayScore: submission.essayScore,
  });
  const payload = {
    questions: archive.questions,
    answers: archive.answers,
  };
  const essays = (payload.questions ?? [])
    .filter((question) => String(question.type).toLowerCase() === "essay")
    .map((question, index) => {
      const answerText = payload.answers?.[question.id]?.essayText?.trim() ?? "";

      return {
        questionId: question.id,
        order:
          typeof question.paperOrder === "number" && Number.isFinite(question.paperOrder)
            ? question.paperOrder
            : index + 1,
        prompt: question.prompt as LocalizedText,
        rubricNote: question.rubricNote,
        answerText,
        wordCount: countWords(answerText),
      };
    })
    .sort((left, right) => left.order - right.order);

  const review = submission.judgeReviews[0];

  return ok({
    round: "round-1",
    submissionId: submission.id,
    participantId: submission.user.id,
    participantName: submission.user.name,
    participantUniversity: submission.user.university,
    teamId: submission.team.id,
    teamName: submission.team.name,
    teamTag: submission.team.tag,
    submittedAt: submission.submittedAt.toISOString(),
    durationMinutes: submission.durationMinutes,
    rightCount: submission.rightCount,
    wrongCount: submission.wrongCount,
    objectiveScore: submission.objectiveScore,
    essays,
    review: {
      score: review?.score ?? null,
      note: review?.note ?? "",
      scoredAt: review?.scoredAt?.toISOString(),
    },
    maxScore: ROUND1_ESSAY_MAX_SCORE,
  });
}

export async function saveJudgeRound1Review(
  userId: string,
  submissionId: string,
  payload: {
    score: number;
    note?: string;
  },
): Promise<ServiceResult<{ reviewSaved: true }>> {
  const detail = await getJudgeRound1Detail(userId, submissionId);
  if (!detail.ok) {
    return detail;
  }

  if (!Number.isFinite(payload.score) || payload.score < 0 || payload.score > ROUND1_ESSAY_MAX_SCORE) {
    return fail(400, `Round 1 essay score must be between 0 and ${ROUND1_ESSAY_MAX_SCORE}.`);
  }

  const scoredAt = new Date();
  const essayScore = Math.round(payload.score);
  const totalScore = detail.data.objectiveScore + essayScore;

  await prisma.$transaction(async (tx) => {
    await tx.round1JudgeReview.update({
      where: {
        judgeUserId_submissionId: {
          judgeUserId: userId,
          submissionId,
        },
      },
      data: {
        score: essayScore,
        note: payload.note?.trim() ?? "",
        scoredAt,
      },
    });

    await tx.round1Submission.update({
      where: { id: submissionId },
      data: {
        essayScore,
        totalScore,
        score: totalScore,
      },
    });
  });

  return ok({ reviewSaved: true });
}

export async function getJudgeTeamSubmissionDetail(
  userId: string,
  submissionId: string,
): Promise<ServiceResult<JudgeTeamSubmissionDetail>> {
  const assignment = await getJudgeAssignmentSummary(userId);
  if (!assignment.ok) {
    return assignment;
  }

  const submission = await prisma.teamSubmission.findUnique({
    where: { id: submissionId },
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
          name: true,
        },
      },
      judgeReviews: {
        where: { judgeUserId: userId },
        select: {
          score: true,
          note: true,
          scoredAt: true,
        },
        take: 1,
      },
    },
  });

  if (!submission) {
    return fail(404, "Team submission not found.");
  }

  const round: JudgeTeamSubmissionDetail["round"] =
    submission.round === SubmissionRound.ROUND_3 ? "round-3" : "round-2";
  if (!assignment.data.rounds.includes(round)) {
    return fail(403, "This judge is not assigned to that round.");
  }

  if (round === "round-2" && submission.judgeReviews.length === 0) {
    return fail(403, "This judge is not assigned to this Round 2 submission.");
  }

  const review = submission.judgeReviews[0];

  return ok({
    round,
    submissionId: submission.id,
    teamId: submission.team.id,
    teamName: submission.team.name,
    teamTag: submission.team.tag,
    title: submission.title,
    summary: submission.summary,
    version: submission.version,
    submittedAt: submission.submittedAt.toISOString(),
    submittedByName: submission.submittedByUser.name,
    resourceLabel: submission.resourceLabel,
    resourceUrl:
      submission.resourceStorageKey || submission.resourceUrl
        ? `/api/team-submissions/${submission.id}/file`
        : undefined,
    resourceMimeType: submission.resourceMimeType ?? undefined,
    resourceSizeBytes: submission.resourceSizeBytes ?? undefined,
    review: {
      score: review?.score ?? null,
      note: review?.note ?? "",
      scoredAt: review?.scoredAt?.toISOString(),
    },
    maxScore: 100,
  });
}

export async function saveJudgeTeamSubmissionReview(
  userId: string,
  submissionId: string,
  payload: {
    score: number;
    note?: string;
  },
): Promise<ServiceResult<{ reviewSaved: true }>> {
  const detail = await getJudgeTeamSubmissionDetail(userId, submissionId);
  if (!detail.ok) {
    return detail;
  }

  if (!Number.isFinite(payload.score) || payload.score < 0 || payload.score > detail.data.maxScore) {
    return fail(400, `Submission score must be between 0 and ${detail.data.maxScore}.`);
  }

  await prisma.teamSubmissionJudgeReview.upsert({
    where: {
      judgeUserId_submissionId: {
        judgeUserId: userId,
        submissionId,
      },
    },
    update: {
      score: payload.score,
      note: payload.note?.trim() ?? "",
      scoredAt: new Date(),
    },
    create: {
      judgeUserId: userId,
      submissionId,
      score: payload.score,
      note: payload.note?.trim() ?? "",
      scoredAt: new Date(),
    },
  });

  return ok({ reviewSaved: true });
}

export async function canJudgeAccessTeamSubmissionFile(
  userId: string,
  submissionId: string,
): Promise<boolean> {
  const assignment = await getJudgeAssignmentSummary(userId);
  if (!assignment.ok) {
    return false;
  }

  const submission = await prisma.teamSubmission.findUnique({
    where: { id: submissionId },
    select: {
      round: true,
    },
  });

  if (!submission) {
    return false;
  }

  if (!assignment.data.rounds.includes(normalizeRoundFromSubmission(submission.round))) {
    return false;
  }

  if (normalizeRoundFromSubmission(submission.round) === "round-2") {
    const review = await prisma.teamSubmissionJudgeReview.findUnique({
      where: {
        judgeUserId_submissionId: {
          judgeUserId: userId,
          submissionId,
        },
      },
      select: {
        id: true,
      },
    });

    return Boolean(review);
  }

  return true;
}
