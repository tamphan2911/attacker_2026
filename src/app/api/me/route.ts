import { NextResponse } from "next/server";
import { z } from "zod";

import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
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
  avatarImageSrc: z.string().trim().optional(),
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

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: payload.data.name.trim(),
      email: normalizedEmail,
      studentId: normalizedStudentId || null,
      loginId: normalizedStudentId || undefined,
      phoneNumber: normalizedPhoneNumber || null,
      university: payload.data.university.trim(),
      major: payload.data.major.trim(),
      classYear: payload.data.classYear.trim(),
      bio: payload.data.bio.trim(),
      avatarImageSrc: payload.data.avatarImageSrc || null,
    },
    include: {
      accounts: {
        select: { provider: true },
      },
    },
  });

  return NextResponse.json({ user: serializeUser(updated) }, { status: 200 });
}
