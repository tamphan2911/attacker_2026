import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { hash } from "bcryptjs";
import { z } from "zod";

import { prisma } from "@/lib/db";

const registerSchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  studentId: z.string().trim().min(1),
  university: z.string().trim().min(1),
  major: z.string().trim().min(1),
  classYear: z.string().trim().min(1),
  bio: z.string().trim().min(1).max(600),
  password: z.string().min(8),
});

export async function POST(request: Request) {
  const payload = registerSchema.safeParse(await request.json().catch(() => null));
  if (!payload.success) {
    return NextResponse.json(
      {
        error: "Invalid registration payload.",
        issues: payload.error.flatten(),
      },
      { status: 400 },
    );
  }

  const studentId = payload.data.studentId.trim().toLowerCase();
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { email: payload.data.email },
        { loginId: studentId },
        { studentId },
      ],
    },
  });

  if (existingUser) {
    return NextResponse.json(
      { error: "An account already exists with this email or student ID." },
      { status: 409 },
    );
  }

  const passwordHash = await hash(payload.data.password, 12);
  const user = await prisma.user.create({
    data: {
      loginId: studentId,
      email: payload.data.email,
      passwordHash,
      name: payload.data.name.trim(),
      role: UserRole.STUDENT,
      studentId,
      university: payload.data.university.trim(),
      major: payload.data.major.trim(),
      classYear: payload.data.classYear.trim(),
      bio: payload.data.bio.trim(),
      avatarTone: "from-sky-500 via-cyan-400 to-emerald-400",
    },
    select: {
      id: true,
      loginId: true,
      email: true,
      name: true,
      studentId: true,
    },
  });

  return NextResponse.json(user, { status: 201 });
}
