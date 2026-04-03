import { UserRole } from "@prisma/client";

import { prisma } from "@/lib/db";
import { serializePublicUserProfile } from "@/server/site-serializers";

export async function getPublicUserProfileById(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      role: true,
      university: true,
      major: true,
      classYear: true,
      bio: true,
      avatarTone: true,
      avatarImageSrc: true,
    },
  });

  if (!user || user.role !== UserRole.STUDENT) {
    return null;
  }

  return serializePublicUserProfile(user);
}
