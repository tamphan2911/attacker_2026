import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { hash } from "bcryptjs";
import { z } from "zod";

import { prisma } from "@/lib/db";
import { sendAccountActivationEmail } from "@/server/auth-email";
import { verifyTurnstileToken } from "@/server/turnstile";

const registerSchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  studentId: z.string().trim().min(1),
  university: z.string().trim().min(1),
  major: z.string().trim().min(1),
  classYear: z.string().trim().min(1),
  bio: z.string().trim().max(600).optional().default(""),
  password: z.string().min(8),
  turnstileToken: z.string().trim().min(1),
  locale: z.enum(["en", "vi"]).optional().default("vi"),
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

  const forwardedForHeader = request.headers.get("x-forwarded-for");
  const remoteIp = forwardedForHeader?.split(",")[0]?.trim();
  const turnstileVerification = await verifyTurnstileToken({
    token: payload.data.turnstileToken,
    action: "register",
    remoteIp,
  });

  if (!turnstileVerification.success) {
    const primaryError = turnstileVerification.errorCodes[0];
    return NextResponse.json(
      {
        error: primaryError === "turnstile-not-configured" ? "CAPTCHA_NOT_CONFIGURED" : "CAPTCHA_FAILED",
        errorCodes: turnstileVerification.errorCodes,
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
    select: {
      email: true,
      loginId: true,
      studentId: true,
    },
  });

  if (existingUser) {
    if (existingUser.email === payload.data.email) {
      return NextResponse.json(
        { error: "EMAIL_ALREADY_REGISTERED" },
        { status: 409 },
      );
    }

    if (existingUser.studentId === studentId || existingUser.loginId === studentId) {
      return NextResponse.json(
        { error: "STUDENT_ID_ALREADY_REGISTERED" },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: "ACCOUNT_ALREADY_EXISTS" },
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

  const mailResult = await sendAccountActivationEmail({
    userId: user.id,
    email: user.email,
    name: user.name,
    locale: payload.data.locale,
  });

  return NextResponse.json(
    {
      ...user,
      activationRequired: true,
      emailDeliveryMode: mailResult.mode,
    },
    { status: 201 },
  );
}
