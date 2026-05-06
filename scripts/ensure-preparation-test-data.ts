import {
  CompetitionStage,
  LeadershipTransferStatus,
  PrismaClient,
  Round1TeamLockRequestStatus,
  TeamInvitationStatus,
  TeamRound1LockStatus,
  UserRole,
} from "@prisma/client";
import { hash } from "bcryptjs";

import {
  preparationTestAccountSummaries,
  preparationTestInvitations,
  preparationTestLeadershipTransferRequests,
  preparationTestRound1TeamLockRequests,
  preparationTestTeams,
  preparationTestUsers,
} from "@/data/preparation-test-data";

const prisma = new PrismaClient();

const DEFAULT_TEST_PASSWORD = "Student@2026";

function parseDate(value?: string) {
  if (!value) {
    return null;
  }

  if (value.includes("T")) {
    return new Date(value);
  }

  return new Date(`${value}T00:00:00+07:00`);
}

function mapStage(stage: (typeof preparationTestTeams)[number]["stage"]) {
  switch (stage) {
    case "round-2":
      return CompetitionStage.ROUND_2;
    case "round-3":
      return CompetitionStage.ROUND_3;
    case "round-1":
    default:
      return CompetitionStage.ROUND_1;
  }
}

function mapLockStatus(status: (typeof preparationTestTeams)[number]["round1LockStatus"]) {
  switch (status) {
    case "pending":
      return TeamRound1LockStatus.PENDING;
    case "locked":
      return TeamRound1LockStatus.LOCKED;
    case "declined":
      return TeamRound1LockStatus.DECLINED;
    case "open":
    default:
      return TeamRound1LockStatus.OPEN;
  }
}

function mapInvitationStatus(status: (typeof preparationTestInvitations)[number]["status"]) {
  switch (status) {
    case "accepted":
      return TeamInvitationStatus.ACCEPTED;
    case "declined":
      return TeamInvitationStatus.DECLINED;
    case "expired":
      return TeamInvitationStatus.EXPIRED;
    case "pending":
    default:
      return TeamInvitationStatus.PENDING;
  }
}

function mapLeadershipStatus(status: (typeof preparationTestLeadershipTransferRequests)[number]["status"]) {
  switch (status) {
    case "accepted":
      return LeadershipTransferStatus.ACCEPTED;
    case "declined":
      return LeadershipTransferStatus.DECLINED;
    case "cancelled":
      return LeadershipTransferStatus.CANCELLED;
    case "pending":
    default:
      return LeadershipTransferStatus.PENDING;
  }
}

function mapRound1LockRequestStatus(status: (typeof preparationTestRound1TeamLockRequests)[number]["status"]) {
  switch (status) {
    case "accepted":
      return Round1TeamLockRequestStatus.ACCEPTED;
    case "declined":
      return Round1TeamLockRequestStatus.DECLINED;
    case "cancelled":
      return Round1TeamLockRequestStatus.CANCELLED;
    case "pending":
    default:
      return Round1TeamLockRequestStatus.PENDING;
  }
}

async function main() {
  const studentPasswordHash = await hash(DEFAULT_TEST_PASSWORD, 12);

  for (const user of preparationTestUsers) {
    const loginId = (user.studentId || user.id).toLowerCase();

    await prisma.user.upsert({
      where: { id: user.id },
      create: {
        id: user.id,
        loginId,
        email: user.email.toLowerCase(),
        emailVerifiedAt: new Date(),
        passwordHash: studentPasswordHash,
        name: user.name,
        role: UserRole.STUDENT,
        studentId: user.studentId.toLowerCase(),
        phoneNumber: user.phoneNumber || null,
        university: user.university,
        major: user.major,
        classYear: user.classYear,
        bio: user.bio,
        avatarTone: user.avatarTone,
        avatarImageSrc: user.avatarImageSrc,
      },
      update: {
        loginId,
        email: user.email.toLowerCase(),
        emailVerifiedAt: new Date(),
        passwordHash: studentPasswordHash,
        name: user.name,
        role: UserRole.STUDENT,
        studentId: user.studentId.toLowerCase(),
        phoneNumber: user.phoneNumber || null,
        university: user.university,
        major: user.major,
        classYear: user.classYear,
        bio: user.bio,
        avatarTone: user.avatarTone,
        avatarImageSrc: user.avatarImageSrc,
      },
    });
  }

  for (const team of preparationTestTeams) {
    await prisma.team.upsert({
      where: { id: team.id },
      create: {
        id: team.id,
        name: team.name,
        tag: team.tag,
        leaderId: team.leaderId,
        stage: mapStage(team.stage),
        round1LockStatus: mapLockStatus(team.round1LockStatus),
        round1LockProtocolId: team.round1LockProtocolId,
        round1LockRequestedAt: parseDate(team.round1LockRequestedAt),
        round1LockedAt: parseDate(team.round1LockedAt),
        round1LockDeclinedAt: parseDate(team.round1LockDeclinedAt),
        round1LockDeclinedByUserId: team.round1LockDeclinedByUserId ?? null,
        avatarTone: team.avatarTone,
        avatarImageSrc: team.avatarImageSrc,
        track: team.track,
        bio: team.bio,
        createdAt: parseDate(team.createdAt) ?? new Date(),
      },
      update: {
        name: team.name,
        tag: team.tag,
        leaderId: team.leaderId,
        stage: mapStage(team.stage),
        round1LockStatus: mapLockStatus(team.round1LockStatus),
        round1LockProtocolId: team.round1LockProtocolId ?? null,
        round1LockRequestedAt: parseDate(team.round1LockRequestedAt),
        round1LockedAt: parseDate(team.round1LockedAt),
        round1LockDeclinedAt: parseDate(team.round1LockDeclinedAt),
        round1LockDeclinedByUserId: team.round1LockDeclinedByUserId ?? null,
        avatarTone: team.avatarTone,
        avatarImageSrc: team.avatarImageSrc,
        track: team.track,
        bio: team.bio,
      },
    });
  }

  const preparationUserIds = preparationTestUsers.map((user) => user.id);
  const preparationTeamIds = preparationTestTeams.map((team) => team.id);

  await prisma.teamMember.deleteMany({
    where: {
      OR: [
        { teamId: { in: preparationTeamIds } },
        { userId: { in: preparationUserIds } },
      ],
    },
  });

  await prisma.teamMember.createMany({
    data: preparationTestTeams.flatMap((team) =>
      team.memberIds.map((memberId) => ({
        teamId: team.id,
        userId: memberId,
        joinedAt: parseDate(team.createdAt) ?? new Date(),
      })),
    ),
  });

  await prisma.teamInvitation.deleteMany({
    where: {
      OR: [
        { teamId: { in: preparationTeamIds } },
        { fromUserId: { in: preparationUserIds } },
        { toUserId: { in: preparationUserIds } },
      ],
    },
  });

  if (preparationTestInvitations.length) {
    await prisma.teamInvitation.createMany({
      data: preparationTestInvitations.map((invitation) => ({
        id: invitation.id,
        teamId: invitation.teamId,
        fromUserId: invitation.fromUserId,
        toUserId: invitation.toUserId,
        status: mapInvitationStatus(invitation.status),
        createdAt: parseDate(invitation.createdAt) ?? new Date(),
      })),
    });
  }

  await prisma.leadershipTransferRequest.deleteMany({
    where: {
      OR: [
        { teamId: { in: preparationTeamIds } },
        { fromUserId: { in: preparationUserIds } },
        { toUserId: { in: preparationUserIds } },
      ],
    },
  });

  if (preparationTestLeadershipTransferRequests.length) {
    await prisma.leadershipTransferRequest.createMany({
      data: preparationTestLeadershipTransferRequests.map((request) => ({
        id: request.id,
        teamId: request.teamId,
        fromUserId: request.fromUserId,
        toUserId: request.toUserId,
        status: mapLeadershipStatus(request.status),
        createdAt: parseDate(request.createdAt) ?? new Date(),
      })),
    });
  }

  await prisma.round1TeamLockRequest.deleteMany({
    where: {
      OR: [
        { teamId: { in: preparationTeamIds } },
        { fromUserId: { in: preparationUserIds } },
        { toUserId: { in: preparationUserIds } },
      ],
    },
  });

  if (preparationTestRound1TeamLockRequests.length) {
    await prisma.round1TeamLockRequest.createMany({
      data: preparationTestRound1TeamLockRequests.map((request) => ({
        id: request.id,
        protocolId: request.protocolId,
        teamId: request.teamId,
        fromUserId: request.fromUserId,
        toUserId: request.toUserId,
        status: mapRound1LockRequestStatus(request.status),
        createdAt: parseDate(request.createdAt) ?? new Date(),
        respondedAt: parseDate(request.respondedAt),
      })),
    });
  }

  console.log(`Ensured ${preparationTestUsers.length} preparation test accounts.`);
  console.log(`Shared password: ${DEFAULT_TEST_PASSWORD}`);

  for (const account of preparationTestAccountSummaries) {
    console.log(`${account.loginId} | ${account.email} | ${account.status}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
