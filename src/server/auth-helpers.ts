import { UserRole } from "@prisma/client";

import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function getCurrentDbUser() {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return null;
  }

  return prisma.user.findUnique({
    where: { id: session.user.id },
  });
}

export function hasElevatedRole(role: UserRole) {
  return role === UserRole.ADMIN || role === UserRole.MODERATOR;
}

export function hasAdminRole(role: UserRole) {
  return role === UserRole.ADMIN;
}

export function hasJudgeRole(role: UserRole) {
  return role === UserRole.JUDGE;
}
