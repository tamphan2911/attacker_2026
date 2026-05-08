import { randomUUID } from "node:crypto";

import {
  CompetitionStage,
  LeadershipTransferStatus,
  Round1BankStatus,
  Round1TestBankType,
  SubmissionRound,
  Round1TeamLockRequestStatus,
  TeamInvitationStatus,
  TeamRound1LockStatus,
  TeamSubmissionResourceSource,
  UserRole,
  type Prisma,
  type Round1ExamAttempt,
  type Round1Submission,
} from "@prisma/client";

import { TEAM_MAX_MEMBERS, TEAM_MIN_MEMBERS } from "@/data/site-content";
import { prisma } from "@/lib/db";
import { getCompetitionRoundWindow, getTimelineItemById } from "@/lib/competition";
import { readTimelineItems } from "@/server/timeline-items";
import {
  createRound1ExamPaper,
  getRound1ObjectiveScore,
  scoreRound1Question,
  type Round1PaperQuestion,
  type Round1QuestionResponse,
} from "@/lib/round1";
import type {
  Round1Question,
  Round1QuestionDifficulty,
  Round1QuestionType,
  Round1TestBank as AppRound1TestBank,
} from "@/types/site";

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

export type ServiceResult<T> = ServiceSuccess<T> | ServiceFailure;

function ok<T>(data: T, status = 200): ServiceSuccess<T> {
  return { ok: true, status, data };
}

function fail(status: number, error: string): ServiceFailure {
  return { ok: false, status, error };
}

function endOfVietnamDay(date: string) {
  return new Date(`${date}T23:59:59.999+07:00`);
}

async function isRound1Finished(now = new Date()) {
  const timelineItems = await readTimelineItems();
  const round1Qualifier = getTimelineItemById("round-1-individual-qualifier", timelineItems);
  if (round1Qualifier) {
    return now.getTime() > endOfVietnamDay(round1Qualifier.endDate).getTime();
  }

  const round1Window = getCompetitionRoundWindow("round-1");
  if (!round1Window) {
    return false;
  }

  return now.getTime() > endOfVietnamDay(round1Window.endDate).getTime();
}

async function isSubmissionRoundFinished(round: SubmissionRound, now = new Date()) {
  const deadlineItemId =
    round === SubmissionRound.ROUND_3 ? "round-3-final-report-submission" : "round-2-report-submission";
  const timelineItems = await readTimelineItems();
  const deadlineItem = timelineItems.find((item) => item.id === deadlineItemId);

  if (deadlineItem) {
    return now.getTime() > endOfVietnamDay(deadlineItem.endDate).getTime();
  }

  const roundKey = round === SubmissionRound.ROUND_3 ? "round-3" : "round-2";
  const roundWindow = getCompetitionRoundWindow(roundKey, timelineItems);
  if (!roundWindow) {
    return false;
  }

  return now.getTime() > endOfVietnamDay(roundWindow.endDate).getTime();
}

function isTeamRosterLocked(team: { stage: CompetitionStage; round1LockStatus: TeamRound1LockStatus }) {
  return (
    team.stage !== CompetitionStage.ROUND_1 ||
    team.round1LockStatus === TeamRound1LockStatus.PENDING ||
    team.round1LockStatus === TeamRound1LockStatus.LOCKED
  );
}

function trimInput(value: string) {
  return value.trim();
}

export interface PersistedRound1Attempt {
  id: string;
  bankId: string;
  teamId: string;
  userId: string;
  startedAt: string;
  deadlineAt: string;
  currentQuestionIndex: number;
  questions: Round1PaperQuestion[];
  answers: Record<string, Round1QuestionResponse>;
}

function parseRound1AttemptQuestions(rawQuestions: string) {
  try {
    const parsed = JSON.parse(rawQuestions) as Round1PaperQuestion[];
    return Array.isArray(parsed)
      ? parsed.map((question, index) => normalizePersistedRound1Question(question, index))
      : [];
  } catch {
    return [];
  }
}

function normalizePersistedDifficulty(
  difficulty: string | undefined,
): Round1QuestionDifficulty {
  switch ((difficulty ?? "").toLowerCase()) {
    case "easy":
      return "easy";
    case "medium":
      return "medium";
    case "hard":
      return "hard";
    default:
      return "medium";
  }
}

function normalizePersistedType(type: string | undefined): Round1QuestionType {
  switch ((type ?? "").toLowerCase()) {
    case "true_false":
    case "true-false":
      return "true-false";
    case "single_choice":
    case "single-choice":
      return "single-choice";
    case "multiple_choice":
    case "multiple-choice":
      return "multiple-choice";
    case "pairing":
      return "pairing";
    case "essay":
      return "essay";
    default:
      return "single-choice";
  }
}

function normalizePersistedRound1Question(
  question: Round1PaperQuestion,
  index: number,
): Round1PaperQuestion {
  return {
    ...question,
    difficulty: normalizePersistedDifficulty(String(question.difficulty)),
    type: normalizePersistedType(String(question.type)),
    paperOrder:
      typeof question.paperOrder === "number" && Number.isFinite(question.paperOrder)
        ? question.paperOrder
        : index + 1,
  };
}

function parseRound1AttemptAnswers(rawAnswers: string | null | undefined) {
  try {
    const parsed = rawAnswers ? (JSON.parse(rawAnswers) as Record<string, Round1QuestionResponse>) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function extractSubmittedRound1Answers(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return undefined;
  }

  const record = payload as Record<string, unknown>;
  const nestedAnswers = record.answers;
  if (nestedAnswers && typeof nestedAnswers === "object") {
    return nestedAnswers as Record<string, Round1QuestionResponse>;
  }

  return record as Record<string, Round1QuestionResponse>;
}

function serializeRound1AttemptRecord(attempt: Round1ExamAttempt): PersistedRound1Attempt {
  return {
    id: attempt.id,
    bankId: attempt.bankId,
    teamId: attempt.teamId,
    userId: attempt.userId,
    startedAt: attempt.startedAt.toISOString(),
    deadlineAt: attempt.deadlineAt.toISOString(),
    currentQuestionIndex: attempt.currentQuestionIndex,
    questions: parseRound1AttemptQuestions(attempt.questions),
    answers: parseRound1AttemptAnswers(attempt.answers),
  };
}

function isRound1AttemptExpired(attempt: Pick<Round1ExamAttempt, "deadlineAt">, now = new Date()) {
  return now.getTime() >= attempt.deadlineAt.getTime();
}

function parseStoredRound1Questions(rawQuestions: string) {
  try {
    return JSON.parse(rawQuestions) as Round1Question[];
  } catch {
    return [];
  }
}

function mapStoredBankToAppBank(
  bank: NonNullable<Awaited<ReturnType<typeof pickRound1Bank>>>,
  bankType: AppRound1TestBank["bankType"],
): AppRound1TestBank {
  return {
    id: bank.id,
    bankType,
    title: { en: bank.titleEn, vi: bank.titleVi },
    description: { en: bank.descriptionEn, vi: bank.descriptionVi },
    status: bank.status.toLowerCase() as AppRound1TestBank["status"],
    questionPoolSize: bank.questionPoolSize,
    questionsPerAttempt: bank.questionsPerAttempt,
    shuffleQuestions: bank.shuffleQuestions,
    shuffleOptions: bank.shuffleOptions,
    durationMinutes: bank.durationMinutes,
    wordLimit: bank.wordLimit ?? undefined,
    publishedAt: bank.publishedAt?.toISOString() ?? bank.createdAt.toISOString(),
    questions: parseStoredRound1Questions(bank.questions),
  };
}

async function pickRound1Bank(
  tx: Prisma.TransactionClient,
  bankType: Round1TestBankType,
) {
  const activeBank = await tx.round1TestBank.findFirst({
    where: {
      bankType,
      status: Round1BankStatus.ACTIVE,
    },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
  });

  if (activeBank) {
    return activeBank;
  }

  return tx.round1TestBank.findFirst({
    where: {
      bankType,
    },
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
  });
}

async function finalizeRound1AttemptRecord(
  tx: Prisma.TransactionClient,
  attempt: Round1ExamAttempt,
  override?: {
    currentQuestionIndex?: number;
    answers?: Record<string, Round1QuestionResponse>;
  },
) {
  const existingSubmission = await tx.round1Submission.findUnique({
    where: { userId: attempt.userId },
  });

  if (existingSubmission) {
    await tx.round1ExamAttempt.delete({ where: { id: attempt.id } });
    return existingSubmission;
  }

  const bank = await tx.round1TestBank.findUnique({
    where: { id: attempt.bankId },
  });

  if (!bank) {
    throw new Error("Round 1 test bank not found while finalizing the attempt.");
  }

  const questions = parseRound1AttemptQuestions(attempt.questions);
  const answers = override?.answers ?? parseRound1AttemptAnswers(attempt.answers);

  const scoreSummary = questions.reduce(
    (result, question) => {
      const questionScore = scoreRound1Question(question, answers[question.id]);

      if (!questionScore.autoScored) {
        return result;
      }

      return {
        autoScoredCount: result.autoScoredCount + 1,
        rightCount: result.rightCount + (questionScore.isCorrect ? 1 : 0),
      };
    },
    { autoScoredCount: 0, rightCount: 0 },
  );

  const rightCount = scoreSummary.rightCount;
  const wrongCount = scoreSummary.autoScoredCount - rightCount;
  const objectiveScore = getRound1ObjectiveScore(rightCount);
  const elapsedMinutes = Math.max(
    1,
    Math.ceil((Math.min(Date.now(), attempt.deadlineAt.getTime()) - attempt.startedAt.getTime()) / 60000),
  );

  const submission = await tx.round1Submission.create({
    data: {
      bankId: attempt.bankId,
      teamId: attempt.teamId,
      userId: attempt.userId,
      rightCount,
      wrongCount,
      score: objectiveScore,
      objectiveScore,
      durationMinutes: Math.min(bank.durationMinutes, elapsedMinutes),
      answers: JSON.stringify({
        questions,
        answers,
      }),
    },
  });

  await tx.round1ExamAttempt.delete({
    where: { id: attempt.id },
  });

  return submission;
}

export async function createTeamForUser(
  userId: string,
  payload: {
    name: string;
    tag: string;
    avatarTone: string;
    avatarImageSrc?: string;
    track: string;
    bio: string;
  },
): Promise<ServiceResult<{ teamId: string }>> {
  const name = trimInput(payload.name);
  const tag = trimInput(payload.tag).toUpperCase();
  const track = trimInput(payload.track);
  const bio = trimInput(payload.bio);

  if (!name || !tag || !track || !bio) {
    return fail(400, "Team name, tag, keyword, and bio are required.");
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return fail(404, "User not found.");
  }

  if (user.role !== UserRole.STUDENT) {
    return fail(403, "Only student accounts can create teams.");
  }

  if (!user.phoneNumber?.trim()) {
    return fail(409, "Add a phone number to the profile before creating a team.");
  }

  const existingMembership = await prisma.teamMember.findUnique({
    where: { userId },
  });
  if (existingMembership) {
    return fail(409, "This user already belongs to a team.");
  }

  const existingTag = await prisma.team.findUnique({ where: { tag } });
  if (existingTag) {
    return fail(409, "That team tag already exists.");
  }

  const team = await prisma.team.create({
    data: {
      name,
      tag,
      leaderId: userId,
      avatarTone: payload.avatarTone,
      avatarImageSrc: payload.avatarImageSrc,
      track,
      bio,
      members: {
        create: {
          userId,
        },
      },
    },
  });

  return ok({ teamId: team.id }, 201);
}

export async function updateCurrentTeamProfile(
  actorId: string,
  payload: {
    name: string;
    tag: string;
    avatarTone: string;
    avatarImageSrc?: string;
    track: string;
    bio: string;
  },
): Promise<ServiceResult<{ teamId: string }>> {
  return prisma.$transaction(async (tx) => {
    const membership = await tx.teamMember.findUnique({
      where: { userId: actorId },
      include: { team: true },
    });

    if (!membership) {
      return fail(404, "This user is not currently in a team.");
    }

    if (membership.team.leaderId !== actorId) {
      return fail(403, "Only the current team leader can edit team settings.");
    }

    const name = trimInput(payload.name);
    const tag = trimInput(payload.tag).toUpperCase();
    const track = trimInput(payload.track);
    const bio = trimInput(payload.bio);

    if (!name || !tag || !track || !bio) {
      return fail(400, "Team name, tag, keyword, and bio are required.");
    }

    const duplicateTag = await tx.team.findFirst({
      where: {
        tag,
        id: { not: membership.teamId },
      },
      select: { id: true },
    });

    if (duplicateTag) {
      return fail(409, "That team tag already exists.");
    }

    await tx.team.update({
      where: { id: membership.teamId },
      data: {
        name,
        tag,
        track,
        bio,
        avatarTone: payload.avatarTone,
        avatarImageSrc: payload.avatarImageSrc,
      },
    });

    return ok({ teamId: membership.teamId });
  });
}

export async function inviteUserToTeam(
  actorId: string,
  teamId: string,
  targetUserId: string,
): Promise<ServiceResult<{ invitationId: string }>> {
  return prisma.$transaction(async (tx) => {
    const team = await tx.team.findUnique({
      where: { id: teamId },
      include: {
        members: true,
        invitations: {
          where: { status: TeamInvitationStatus.PENDING },
        },
      },
    });

    if (!team) {
      return fail(404, "Team not found.");
    }

    if (team.leaderId !== actorId) {
      return fail(403, "Only the team leader can invite new members.");
    }

    if (isTeamRosterLocked(team)) {
      return fail(409, "This team roster is locked and cannot invite new members.");
    }

    const targetUser = await tx.user.findUnique({ where: { id: targetUserId } });
    if (!targetUser || targetUser.role !== UserRole.STUDENT) {
      return fail(400, "Only student accounts can receive team invitations.");
    }

    if (team.members.some((member) => member.userId === targetUserId)) {
      return fail(409, "That student is already in this team.");
    }

    const existingMembership = await tx.teamMember.findUnique({
      where: { userId: targetUserId },
    });
    if (existingMembership) {
      return fail(409, "That student is already in another team.");
    }

    if (team.members.length + team.invitations.length >= TEAM_MAX_MEMBERS) {
      return fail(409, "This team is already at max capacity.");
    }

    const existingInvite = await tx.teamInvitation.findFirst({
      where: {
        teamId,
        toUserId: targetUserId,
        status: TeamInvitationStatus.PENDING,
      },
    });
    if (existingInvite) {
      return fail(409, "There is already a pending invitation for this student.");
    }

    const invitation = await tx.teamInvitation.create({
      data: {
        teamId,
        fromUserId: actorId,
        toUserId: targetUserId,
      },
    });

    return ok({ invitationId: invitation.id }, 201);
  });
}

export async function respondToInvitation(
  actorId: string,
  invitationId: string,
  decision: "accept" | "decline",
): Promise<ServiceResult<{ invitationId: string; status: string; teamId?: string }>> {
  return prisma.$transaction(async (tx) => {
    const invitation = await tx.teamInvitation.findUnique({
      where: { id: invitationId },
      include: {
        team: {
          include: {
            members: true,
            invitations: {
              where: { status: TeamInvitationStatus.PENDING },
            },
          },
        },
      },
    });

    if (!invitation || invitation.toUserId !== actorId || invitation.status !== TeamInvitationStatus.PENDING) {
      return fail(404, "Pending invitation not found for this user.");
    }

    if (decision === "decline") {
      const declined = await tx.teamInvitation.update({
        where: { id: invitationId },
        data: {
          status: TeamInvitationStatus.DECLINED,
          respondedAt: new Date(),
        },
      });

      return ok({ invitationId: declined.id, status: declined.status });
    }

    const existingMembership = await tx.teamMember.findUnique({
      where: { userId: actorId },
    });
    if (existingMembership) {
      return fail(409, "Leave the current team before joining another one.");
    }

    const targetTeam = invitation.team;
    if (!targetTeam) {
      return fail(404, "That team is no longer available.");
    }

    if (targetTeam.members.length >= TEAM_MAX_MEMBERS) {
      await tx.teamInvitation.update({
        where: { id: invitationId },
        data: {
          status: TeamInvitationStatus.EXPIRED,
          respondedAt: new Date(),
        },
      });
      return fail(409, "That team is now full. You can no longer join through this invitation.");
    }

    if (isTeamRosterLocked(targetTeam)) {
      await tx.teamInvitation.update({
        where: { id: invitationId },
        data: {
          status: TeamInvitationStatus.EXPIRED,
          respondedAt: new Date(),
        },
      });
      return fail(409, "That team has already locked its roster, so this invitation is no longer valid.");
    }

    await tx.teamMember.create({
      data: {
        teamId: targetTeam.id,
        userId: actorId,
      },
    });

    await tx.teamInvitation.update({
      where: { id: invitationId },
      data: {
        status: TeamInvitationStatus.ACCEPTED,
        respondedAt: new Date(),
      },
    });

    await tx.teamInvitation.updateMany({
      where: {
        toUserId: actorId,
        status: TeamInvitationStatus.PENDING,
        id: { not: invitationId },
      },
      data: {
        status: TeamInvitationStatus.DECLINED,
        respondedAt: new Date(),
      },
    });

    return ok({
      invitationId,
      status: TeamInvitationStatus.ACCEPTED,
      teamId: targetTeam.id,
    });
  });
}

export async function leaveCurrentTeam(actorId: string): Promise<ServiceResult<{ teamId: string }>> {
  return prisma.$transaction(async (tx) => {
    const membership = await tx.teamMember.findUnique({
      where: { userId: actorId },
      include: {
        team: true,
      },
    });

    if (!membership) {
      return fail(404, "This user is not currently in a team.");
    }

    if (isTeamRosterLocked(membership.team)) {
      return fail(409, "This team roster is locked, so members can no longer leave.");
    }

    if (membership.team.leaderId === actorId) {
      return fail(409, "The leader cannot leave until leadership is transferred.");
    }

    await tx.teamMember.delete({
      where: { id: membership.id },
    });

    await tx.leadershipTransferRequest.updateMany({
      where: {
        teamId: membership.teamId,
        status: LeadershipTransferStatus.PENDING,
        OR: [{ fromUserId: actorId }, { toUserId: actorId }],
      },
      data: {
        status: LeadershipTransferStatus.CANCELLED,
        respondedAt: new Date(),
      },
    });

    return ok({ teamId: membership.teamId });
  });
}

export async function transferLeadership(
  actorId: string,
  teamId: string,
  nextLeaderId: string,
): Promise<ServiceResult<{ requestId: string }>> {
  return prisma.$transaction(async (tx) => {
    const team = await tx.team.findUnique({
      where: { id: teamId },
      include: {
        members: true,
        leadershipTransferRequests: {
          where: { status: LeadershipTransferStatus.PENDING },
        },
      },
    });

    if (!team) {
      return fail(404, "Team not found.");
    }

    if (team.leaderId !== actorId) {
      return fail(403, "Only the current leader can transfer leadership.");
    }

    if (isTeamRosterLocked(team)) {
      return fail(409, "Leadership can no longer change after the team roster is locked.");
    }

    if (nextLeaderId === actorId || !team.members.some((member) => member.userId === nextLeaderId)) {
      return fail(400, "Choose another existing team member as the next leader.");
    }

    if (team.leadershipTransferRequests.length > 0) {
      return fail(409, "There is already a pending leadership transfer request for this team.");
    }

    const request = await tx.leadershipTransferRequest.create({
      data: {
        teamId,
        fromUserId: actorId,
        toUserId: nextLeaderId,
      },
    });

    return ok({ requestId: request.id }, 201);
  });
}

export async function respondToLeadershipTransfer(
  actorId: string,
  requestId: string,
  decision: "accept" | "decline",
): Promise<ServiceResult<{ teamId: string; status: string }>> {
  return prisma.$transaction(async (tx) => {
    const actor = await tx.user.findUnique({
      where: { id: actorId },
      select: { id: true, phoneNumber: true },
    });

    if (!actor) {
      return fail(404, "User not found.");
    }

    const request = await tx.leadershipTransferRequest.findUnique({
      where: { id: requestId },
      include: {
        team: {
          include: {
            members: true,
          },
        },
      },
    });

    if (!request || request.toUserId !== actorId || request.status !== LeadershipTransferStatus.PENDING) {
      return fail(404, "Pending leadership transfer request not found.");
    }

    if (!request.team.members.some((member) => member.userId === actorId)) {
      return fail(409, "Only current team members can respond to a leadership transfer.");
    }

    if (isTeamRosterLocked(request.team)) {
      await tx.leadershipTransferRequest.update({
        where: { id: request.id },
        data: {
          status: LeadershipTransferStatus.CANCELLED,
          respondedAt: new Date(),
        },
      });
      return fail(409, "This team roster is already locked, so the leadership transfer request has been cancelled.");
    }

    if (decision === "decline") {
      const declined = await tx.leadershipTransferRequest.update({
        where: { id: request.id },
        data: {
          status: LeadershipTransferStatus.DECLINED,
          respondedAt: new Date(),
        },
      });

      return ok({ teamId: declined.teamId, status: declined.status });
    }

    if (!actor.phoneNumber?.trim()) {
      return fail(409, "Add a phone number to the profile before accepting leadership.");
    }

    await tx.team.update({
      where: { id: request.teamId },
      data: {
        leaderId: actorId,
      },
    });

    await tx.leadershipTransferRequest.update({
      where: { id: request.id },
      data: {
        status: LeadershipTransferStatus.ACCEPTED,
        respondedAt: new Date(),
      },
    });

    await tx.leadershipTransferRequest.updateMany({
      where: {
        teamId: request.teamId,
        status: LeadershipTransferStatus.PENDING,
        id: { not: request.id },
      },
      data: {
        status: LeadershipTransferStatus.CANCELLED,
        respondedAt: new Date(),
      },
    });

    return ok({ teamId: request.teamId, status: LeadershipTransferStatus.ACCEPTED });
  });
}

export async function initiateRound1TeamLock(
  actorId: string,
  teamId: string,
): Promise<ServiceResult<{ teamId: string; protocolId: string; autoLocked?: boolean }>> {
  return prisma.$transaction(async (tx) => {
    const team = await tx.team.findUnique({
      where: { id: teamId },
      include: {
        members: true,
        invitations: {
          where: { status: TeamInvitationStatus.PENDING },
        },
        leadershipTransferRequests: {
          where: { status: LeadershipTransferStatus.PENDING },
        },
        round1Submissions: true,
      },
    });

    if (!team) {
      return fail(404, "Team not found.");
    }

    if (team.leaderId !== actorId) {
      return fail(403, "Only the team leader can start the Round 1 lock protocol.");
    }

    if (team.stage !== CompetitionStage.ROUND_1) {
      return fail(409, "This team is no longer in Round 1 and its roster can no longer change.");
    }

    if (team.members.length < TEAM_MIN_MEMBERS) {
      return fail(409, `Reach at least ${TEAM_MIN_MEMBERS} members before starting the Round 1 lock protocol.`);
    }

    if (team.round1LockStatus === TeamRound1LockStatus.LOCKED) {
      return fail(409, "This team is already locked for Round 1.");
    }

    if (team.round1LockStatus === TeamRound1LockStatus.PENDING) {
      return fail(409, "A lock protocol is already waiting for member approvals.");
    }

    if (team.leadershipTransferRequests.length > 0) {
      return fail(409, "Resolve the pending leadership transfer before locking the team.");
    }

    if (team.round1Submissions.length > 0) {
      await tx.team.update({
        where: { id: team.id },
        data: {
          round1LockStatus: TeamRound1LockStatus.LOCKED,
          round1LockedAt: team.round1LockedAt ?? new Date(),
          round1LockDeclinedAt: null,
          round1LockDeclinedByUserId: null,
        },
      });

      return ok({ teamId: team.id, protocolId: team.round1LockProtocolId ?? "", autoLocked: true });
    }

    const protocolId = randomUUID();
    const now = new Date();

    await tx.team.update({
      where: { id: team.id },
      data: {
        round1LockStatus: TeamRound1LockStatus.PENDING,
        round1LockProtocolId: protocolId,
        round1LockRequestedAt: now,
        round1LockDeclinedAt: null,
        round1LockDeclinedByUserId: null,
      },
    });

    await tx.teamInvitation.updateMany({
      where: {
        teamId: team.id,
        status: TeamInvitationStatus.PENDING,
      },
      data: {
        status: TeamInvitationStatus.EXPIRED,
        respondedAt: now,
      },
    });

    await tx.round1TeamLockRequest.updateMany({
      where: {
        teamId: team.id,
        status: Round1TeamLockRequestStatus.PENDING,
      },
      data: {
        status: Round1TeamLockRequestStatus.CANCELLED,
        respondedAt: now,
      },
    });

    if (team.members.length > 1) {
      await tx.round1TeamLockRequest.createMany({
        data: team.members
          .filter((member) => member.userId !== actorId)
          .map((member) => ({
            protocolId,
            teamId: team.id,
            fromUserId: actorId,
            toUserId: member.userId,
            createdAt: now,
            status: Round1TeamLockRequestStatus.PENDING,
          })),
      });
    }

    return ok({ teamId: team.id, protocolId }, 201);
  });
}

export async function respondToRound1TeamLock(
  actorId: string,
  requestId: string,
  decision: "accept" | "decline",
): Promise<ServiceResult<{ teamId: string; status: string }>> {
  return prisma.$transaction(async (tx) => {
    const request = await tx.round1TeamLockRequest.findUnique({
      where: { id: requestId },
      include: {
        team: {
          include: {
            members: true,
          },
        },
      },
    });

    if (!request || request.toUserId !== actorId || request.status !== Round1TeamLockRequestStatus.PENDING) {
      return fail(404, "Pending team-lock request not found.");
    }

    const now = new Date();

    if (
      request.team.round1LockStatus !== TeamRound1LockStatus.PENDING ||
      request.team.round1LockProtocolId !== request.protocolId
    ) {
      await tx.round1TeamLockRequest.update({
        where: { id: request.id },
        data: {
          status: Round1TeamLockRequestStatus.CANCELLED,
          respondedAt: now,
        },
      });

      return fail(409, "This team-lock request is no longer active.");
    }

    if (!request.team.members.some((member) => member.userId === actorId)) {
      await tx.round1TeamLockRequest.update({
        where: { id: request.id },
        data: {
          status: Round1TeamLockRequestStatus.CANCELLED,
          respondedAt: now,
        },
      });

      return fail(409, "Only current team members can respond to this team-lock request.");
    }

    if (decision === "decline") {
      await tx.round1TeamLockRequest.update({
        where: { id: request.id },
        data: {
          status: Round1TeamLockRequestStatus.DECLINED,
          respondedAt: now,
        },
      });

      await tx.round1TeamLockRequest.updateMany({
        where: {
          protocolId: request.protocolId,
          status: Round1TeamLockRequestStatus.PENDING,
          id: { not: request.id },
        },
        data: {
          status: Round1TeamLockRequestStatus.CANCELLED,
          respondedAt: now,
        },
      });

      await tx.team.update({
        where: { id: request.teamId },
        data: {
          round1LockStatus: TeamRound1LockStatus.DECLINED,
          round1LockProtocolId: null,
          round1LockRequestedAt: null,
          round1LockDeclinedAt: now,
          round1LockDeclinedByUserId: actorId,
        },
      });

      return ok({ teamId: request.teamId, status: TeamRound1LockStatus.DECLINED });
    }

    await tx.round1TeamLockRequest.update({
      where: { id: request.id },
      data: {
        status: Round1TeamLockRequestStatus.ACCEPTED,
        respondedAt: now,
      },
    });

    const pendingCount = await tx.round1TeamLockRequest.count({
      where: {
        protocolId: request.protocolId,
        status: Round1TeamLockRequestStatus.PENDING,
      },
    });

    if (pendingCount === 0) {
      await tx.team.update({
        where: { id: request.teamId },
        data: {
          round1LockStatus: TeamRound1LockStatus.LOCKED,
          round1LockedAt: now,
          round1LockDeclinedAt: null,
          round1LockDeclinedByUserId: null,
        },
      });

      return ok({ teamId: request.teamId, status: TeamRound1LockStatus.LOCKED });
    }

    return ok({ teamId: request.teamId, status: TeamRound1LockStatus.PENDING });
  });
}

async function loadRound1ExamActorContext(tx: Prisma.TransactionClient, actorId: string) {
  const user = await tx.user.findUnique({ where: { id: actorId } });
  if (!user) {
    return fail(404, "User not found.");
  }

  if (user.role !== UserRole.STUDENT) {
    return fail(403, "Only student accounts can submit Round 1 attempts.");
  }

  const membership = await tx.teamMember.findUnique({
    where: { userId: actorId },
    include: {
      team: {
        include: {
          members: true,
        },
      },
    },
  });

  if (!membership) {
    return fail(409, "Join a team before taking the Round 1 test.");
  }

  if (membership.team.members.length < TEAM_MIN_MEMBERS) {
    return fail(409, `Round 1 only opens for teams with at least ${TEAM_MIN_MEMBERS} members.`);
  }

  if (membership.team.stage !== CompetitionStage.ROUND_1) {
    return fail(409, "This team is no longer competing in Round 1.");
  }

  if (membership.team.round1LockStatus !== TeamRound1LockStatus.LOCKED) {
    return fail(409, "The team must finish the Round 1 lock protocol before any member can start the exam.");
  }

  return ok({ user, membership });
}

export async function getRound1ExamState(
  actorId: string,
): Promise<ServiceResult<{ attempt: PersistedRound1Attempt | null; submission: Round1Submission | null; autoSubmitted?: boolean }>> {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: actorId } });
    if (!user) {
      return fail(404, "User not found.");
    }

    if (user.role !== UserRole.STUDENT) {
      return ok({ attempt: null, submission: null });
    }

    const existingSubmission = await tx.round1Submission.findUnique({
      where: { userId: actorId },
    });
    if (existingSubmission) {
      return ok({ attempt: null, submission: existingSubmission });
    }

    const attempt = await tx.round1ExamAttempt.findUnique({
      where: { userId: actorId },
    });
    if (!attempt) {
      return ok({ attempt: null, submission: null });
    }

    if (isRound1AttemptExpired(attempt)) {
      const submission = await finalizeRound1AttemptRecord(tx, attempt);
      return ok({ attempt: null, submission, autoSubmitted: true });
    }

    return ok({ attempt: serializeRound1AttemptRecord(attempt), submission: null });
  });
}

export async function startRound1Attempt(
  actorId: string,
): Promise<ServiceResult<{ attempt: PersistedRound1Attempt | null; submission: Round1Submission | null; autoSubmitted?: boolean }>> {
  return prisma.$transaction(async (tx) => {
    const actorContext = await loadRound1ExamActorContext(tx, actorId);
    if (!actorContext.ok) {
      return fail(actorContext.status, actorContext.error);
    }

    if (await isRound1Finished()) {
      return fail(409, "Round 1 is finished. New Round 1 submissions are closed.");
    }

    const existingSubmission = await tx.round1Submission.findUnique({
      where: { userId: actorId },
    });
    if (existingSubmission) {
      return ok({ attempt: null, submission: existingSubmission });
    }

    const existingAttempt = await tx.round1ExamAttempt.findUnique({
      where: { userId: actorId },
    });

    if (existingAttempt) {
      if (isRound1AttemptExpired(existingAttempt)) {
        const submission = await finalizeRound1AttemptRecord(tx, existingAttempt);
        return ok({ attempt: null, submission, autoSubmitted: true });
      }

      return ok({ attempt: serializeRound1AttemptRecord(existingAttempt), submission: null });
    }

    const objectiveBank = await pickRound1Bank(tx, Round1TestBankType.OBJECTIVE);
    const essayBank = await pickRound1Bank(tx, Round1TestBankType.ESSAY);

    if (!objectiveBank || !essayBank) {
      return fail(404, "Round 1 bank configuration is incomplete.");
    }

    const startedAt = new Date();
    const deadlineAt = new Date(startedAt.getTime() + objectiveBank.durationMinutes * 60 * 1000);
    const questions = createRound1ExamPaper({
      objectiveBank: mapStoredBankToAppBank(objectiveBank, "objective"),
      essayBank: mapStoredBankToAppBank(essayBank, "essay"),
    });

    const attempt = await tx.round1ExamAttempt.create({
      data: {
        bankId: objectiveBank.id,
        teamId: actorContext.data.membership.teamId,
        userId: actorId,
        startedAt,
        deadlineAt,
        currentQuestionIndex: 0,
        questions: JSON.stringify(questions),
        answers: JSON.stringify({}),
      },
    });

    return ok({ attempt: serializeRound1AttemptRecord(attempt), submission: null }, 201);
  });
}

export async function saveRound1AttemptProgress(
  actorId: string,
  payload: {
    currentQuestionIndex: number;
    answers: Record<string, Round1QuestionResponse>;
  },
): Promise<ServiceResult<{ attempt: PersistedRound1Attempt | null; submission: Round1Submission | null; autoSubmitted?: boolean }>> {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: actorId } });
    if (!user) {
      return fail(404, "User not found.");
    }

    const existingSubmission = await tx.round1Submission.findUnique({
      where: { userId: actorId },
    });
    if (existingSubmission) {
      return ok({ attempt: null, submission: existingSubmission });
    }

    const attempt = await tx.round1ExamAttempt.findUnique({
      where: { userId: actorId },
    });
    if (!attempt) {
      return fail(404, "Round 1 attempt not found.");
    }

    if (isRound1AttemptExpired(attempt)) {
      const submission = await finalizeRound1AttemptRecord(tx, attempt, payload);
      return ok({ attempt: null, submission, autoSubmitted: true });
    }

    const questionCount = parseRound1AttemptQuestions(attempt.questions).length;
    const nextIndex =
      questionCount > 0
        ? Math.max(0, Math.min(questionCount - 1, Math.trunc(payload.currentQuestionIndex)))
        : 0;

    const updatedAttempt = await tx.round1ExamAttempt.update({
      where: { id: attempt.id },
      data: {
        currentQuestionIndex: nextIndex,
        answers: JSON.stringify(payload.answers),
      },
    });

    return ok({ attempt: serializeRound1AttemptRecord(updatedAttempt), submission: null });
  });
}

export async function completeRound1Attempt(
  actorId: string,
  payload?: {
    currentQuestionIndex?: number;
    answers?: Record<string, Round1QuestionResponse>;
  },
): Promise<ServiceResult<{ submission: Round1Submission }>> {
  return prisma.$transaction(async (tx) => {
    const existingSubmission = await tx.round1Submission.findUnique({
      where: { userId: actorId },
    });
    if (existingSubmission) {
      return ok({ submission: existingSubmission });
    }

    const attempt = await tx.round1ExamAttempt.findUnique({
      where: { userId: actorId },
    });
    if (!attempt) {
      return fail(404, "Round 1 attempt not found.");
    }

    const submission = await finalizeRound1AttemptRecord(tx, attempt, payload);
    return ok({ submission });
  });
}

export async function submitRound1Attempt(
  actorId: string,
  payload: {
    bankId: string;
    rightCount: number;
    wrongCount: number;
    objectiveScore: number;
    durationMinutes: number;
    answers?: unknown;
  },
): Promise<ServiceResult<{ submissionId: string }>> {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: actorId } });
    if (!user) {
      return fail(404, "User not found.");
    }

    if (user.role !== UserRole.STUDENT) {
      return fail(403, "Only student accounts can submit Round 1 attempts.");
    }

    const membership = await tx.teamMember.findUnique({
      where: { userId: actorId },
      include: {
        team: {
          include: {
            members: true,
          },
        },
      },
    });

    if (!membership) {
      return fail(409, "Join a team before taking the Round 1 test.");
    }

    if (membership.team.members.length < TEAM_MIN_MEMBERS) {
      return fail(409, `Round 1 only opens for teams with at least ${TEAM_MIN_MEMBERS} members.`);
    }

    if (membership.team.stage !== CompetitionStage.ROUND_1) {
      return fail(409, "This team is no longer competing in Round 1.");
    }

    if (membership.team.round1LockStatus !== TeamRound1LockStatus.LOCKED) {
      return fail(409, "The team must finish the Round 1 lock protocol before any member can start the exam.");
    }

    if (await isRound1Finished()) {
      return fail(409, "Round 1 is finished. New Round 1 submissions are closed.");
    }

    const existingSubmission = await tx.round1Submission.findUnique({
      where: { userId: actorId },
    });
    if (existingSubmission) {
      return fail(409, "This account has already submitted its Round 1 attempt.");
    }

    const existingAttempt = await tx.round1ExamAttempt.findUnique({
      where: { userId: actorId },
    });
    if (existingAttempt) {
      const submission = await finalizeRound1AttemptRecord(tx, existingAttempt, {
        answers: extractSubmittedRound1Answers(payload.answers),
      });
      return ok({ submissionId: submission.id }, 201);
    }

    const bank = await tx.round1TestBank.findUnique({
      where: { id: payload.bankId },
    });
    if (!bank) {
      return fail(404, "Round 1 test bank not found.");
    }

    const submission = await tx.round1Submission.create({
      data: {
        bankId: payload.bankId,
        teamId: membership.teamId,
        userId: actorId,
        rightCount: payload.rightCount,
        wrongCount: payload.wrongCount,
        score: payload.objectiveScore,
        objectiveScore: payload.objectiveScore,
        durationMinutes: payload.durationMinutes,
        answers: payload.answers == null ? undefined : JSON.stringify(payload.answers),
      },
    });

    await tx.round1ExamAttempt.deleteMany({
      where: { userId: actorId },
    });

    return ok({ submissionId: submission.id }, 201);
  });
}

export async function createTeamSubmission(
  actorId: string,
  payload: {
    round: SubmissionRound;
    title: string;
    summary: string;
    resourceLabel: string;
    resourceStorageKey: string;
    resourceMimeType?: string;
    resourceSizeBytes?: number;
  },
): Promise<ServiceResult<{ submissionId: string; teamId: string; version: number }>> {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: actorId } });
    if (!user) {
      return fail(404, "User not found.");
    }

    if (user.role !== UserRole.STUDENT) {
      return fail(403, "Only student team leaders can submit team files.");
    }

    const membership = await tx.teamMember.findUnique({
      where: { userId: actorId },
      include: {
        team: true,
      },
    });

    if (!membership) {
      return fail(409, "Join or create a team before submitting reports.");
    }

    if (membership.team.leaderId !== actorId) {
      return fail(403, "Only the team leader can submit a report for the team.");
    }

    const requiredStage =
      payload.round === SubmissionRound.ROUND_3
        ? CompetitionStage.ROUND_3
        : CompetitionStage.ROUND_2;

    if (membership.team.stage !== requiredStage) {
      if (membership.team.stage === CompetitionStage.ROUND_1) {
        return fail(
          409,
          `This team has not advanced to ${
            payload.round === SubmissionRound.ROUND_3 ? "Round 3" : "Round 2"
          } yet.`,
        );
      }

      return fail(
        409,
        `This team is currently in ${
          membership.team.stage === CompetitionStage.ROUND_3 ? "Round 3" : "Round 2"
        }. This submission round is no longer active.`,
      );
    }

    if (await isSubmissionRoundFinished(payload.round)) {
      return fail(409, "This round is finished. New submissions are closed.");
    }

    const title = trimInput(payload.title);
    if (!title) {
      return fail(400, "Add a submission title before uploading.");
    }

    const latestSubmission = await tx.teamSubmission.findFirst({
      where: {
        teamId: membership.teamId,
        round: payload.round,
      },
      orderBy: {
        version: "desc",
      },
      select: {
        version: true,
      },
    });

    const version = (latestSubmission?.version ?? 0) + 1;
    const submission = await tx.teamSubmission.create({
      data: {
        teamId: membership.teamId,
        round: payload.round,
        version,
        title,
        summary: trimInput(payload.summary),
        resourceSource: TeamSubmissionResourceSource.UPLOAD,
        resourceLabel: trimInput(payload.resourceLabel) || "submission",
        resourceStorageKey: payload.resourceStorageKey,
        resourceMimeType: payload.resourceMimeType,
        resourceSizeBytes: payload.resourceSizeBytes,
        submittedByUserId: actorId,
      },
    });

    return ok(
      {
        submissionId: submission.id,
        teamId: membership.teamId,
        version,
      },
      201,
    );
  });
}
