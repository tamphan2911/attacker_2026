import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { z } from "zod";

import { getAuthSession } from "@/lib/auth";
import { normalizeClassYearForRole } from "@/lib/class-year";
import { prisma } from "@/lib/db";
import { prepareAvatarImageReplacement } from "@/server/avatar-image-storage";
import { serializeUser } from "@/server/site-serializers";

const updateProfileSchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().trim().email(),
  studentId: z.string().trim().optional().default(""),
  phoneNumber: z.string().trim().max(20).optional().default(""),
  university: z.string().trim().min(1),
  major: z.string().trim().min(1),
  classYear: z.string().trim().min(1),
  bio: z.string().trim().min(1).max(600),
  avatarImageSrc: z.string().trim().nullable().optional(),
});

export async function GET() {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      accounts: {
        select: { provider: true },
      },
    },
  });

  return NextResponse.json({ user: user ? serializeUser(user) : null }, { status: 200 });
}

export async function PATCH(request: Request) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const existingUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      role: true,
      avatarImageSrc: true,
    },
  });

  if (!existingUser) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  const payload = updateProfileSchema.safeParse(await request.json().catch(() => null));
  if (!payload.success) {
    return NextResponse.json(
      { error: "Invalid profile payload.", issues: payload.error.flatten() },
      { status: 400 },
    );
  }

  const normalizedStudentId = payload.data.studentId.trim().toLowerCase();
  const normalizedEmail = payload.data.email.trim().toLowerCase();
  const normalizedPhoneNumber = payload.data.phoneNumber.trim();

  const duplicate = await prisma.user.findFirst({
    where: {
      id: { not: session.user.id },
      OR: [
        { email: normalizedEmail },
        ...(normalizedStudentId ? [{ studentId: normalizedStudentId }, { loginId: normalizedStudentId }] : []),
      ],
    },
    select: { id: true },
  });

  if (duplicate) {
    return NextResponse.json(
      { error: "Another account already uses that email or student ID." },
      { status: 409 },
    );
  }

  let avatarReplacement: Awaited<ReturnType<typeof prepareAvatarImageReplacement>>;
  try {
    avatarReplacement = await prepareAvatarImageReplacement({
      ownerKind: "user",
      ownerId: session.user.id,
      previousImageSrc: existingUser.avatarImageSrc,
      nextImageSrc: payload.data.avatarImageSrc,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid avatar image." },
      { status: 400 },
    );
  }

  let updated;
  try {
    updated = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: payload.data.name.trim(),
        email: normalizedEmail,
        studentId: existingUser.role === UserRole.STUDENT ? normalizedStudentId || null : undefined,
        loginId: existingUser.role === UserRole.STUDENT ? normalizedStudentId || undefined : undefined,
        phoneNumber: normalizedPhoneNumber || null,
        university: payload.data.university.trim(),
        major: payload.data.major.trim(),
        classYear: normalizeClassYearForRole(payload.data.classYear, existingUser.role),
        bio: payload.data.bio.trim(),
        avatarImageSrc: avatarReplacement.imageSrc,
      },
      include: {
        accounts: {
          select: { provider: true },
        },
      },
    });
  } catch (error) {
    await avatarReplacement.cleanupNew();
    throw error;
  }

  await avatarReplacement.deletePrevious();

  return NextResponse.json({ user: serializeUser(updated) }, { status: 200 });
}
