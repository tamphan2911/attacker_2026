import { UserRole } from "@prisma/client";
import { hash } from "bcryptjs";

import { prisma } from "@/lib/db";
import { buildJudgeEmail, getJudgeAccountOrganization, readStoredJudges } from "@/server/admin-service";

const DEFAULT_JUDGE_PASSWORD = "Judge@2026";
let cachedJudgePasswordHash: string | null = null;

export function getDefaultJudgePassword() {
  return DEFAULT_JUDGE_PASSWORD;
}

export function getJudgeLoginIdFromProfileId(judgeProfileId: string) {
  return judgeProfileId.trim().toLowerCase();
}

export async function syncJudgeAccounts() {
  const judges = await readStoredJudges();
  if (!cachedJudgePasswordHash) {
    cachedJudgePasswordHash = await hash(DEFAULT_JUDGE_PASSWORD, 12);
  }
  const judgePasswordHash = cachedJudgePasswordHash;

  let createdCount = 0;
  let updatedCount = 0;

  for (const judge of judges) {
    const loginId = getJudgeLoginIdFromProfileId(judge.id);
    const email = buildJudgeEmail(loginId);

    const conflictingNonJudge = await prisma.user.findFirst({
      where: {
        OR: [{ loginId }, { email }],
        role: {
          not: UserRole.JUDGE,
        },
      },
      select: { id: true },
    });

    if (conflictingNonJudge) {
      continue;
    }

    const existingJudge = await prisma.user.findFirst({
      where: {
        OR: [{ judgeProfileId: judge.id }, { loginId, role: UserRole.JUDGE }, { email, role: UserRole.JUDGE }],
      },
      select: {
        id: true,
        passwordHash: true,
      },
    });

    const baseData = {
      loginId,
      email,
      emailVerifiedAt: new Date(),
      name: judge.name,
      role: UserRole.JUDGE,
      judgeProfileId: judge.id,
      phoneNumber: null,
      studentId: null,
      university: getJudgeAccountOrganization(judge),
      major: judge.role.en || judge.role.vi,
      classYear: "",
      bio: judge.bio.en || judge.bio.vi,
      avatarTone: judge.avatarTone,
      avatarImageSrc: judge.imageSrc || null,
    };

    if (existingJudge) {
      await prisma.user.update({
        where: { id: existingJudge.id },
        data: {
          ...baseData,
          passwordHash: existingJudge.passwordHash || judgePasswordHash,
        },
      });
      updatedCount += 1;
      continue;
    }

    await prisma.user.create({
      data: {
        ...baseData,
        passwordHash: judgePasswordHash,
      },
    });
    createdCount += 1;
  }

  return {
    createdCount,
    updatedCount,
  };
}
