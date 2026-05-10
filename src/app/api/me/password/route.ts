import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { z } from "zod";

import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

const changePasswordSchema = z
  .object({
    password: z.string().min(8).max(128),
    confirmPassword: z.string().min(1),
  })
  .refine((payload) => payload.password === payload.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export async function PUT(request: Request) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const payload = changePasswordSchema.safeParse(await request.json().catch(() => null));
  if (!payload.success) {
    return NextResponse.json(
      { error: "Invalid password payload.", issues: payload.error.flatten() },
      { status: 400 },
    );
  }

  const existingUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true },
  });
  if (!existingUser) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  const passwordHash = await hash(payload.data.password, 12);
  await prisma.user.update({
    where: { id: session.user.id },
    data: { passwordHash },
  });

  return NextResponse.json({ passwordChanged: true }, { status: 200 });
}
