import { NextResponse } from "next/server";
import { z } from "zod";

import { resetPasswordFromToken } from "@/server/auth-email";

const resetPasswordSchema = z.object({
  token: z.string().trim().min(1),
  password: z.string().min(8),
});

export async function POST(request: Request) {
  const payload = resetPasswordSchema.safeParse(await request.json().catch(() => null));
  if (!payload.success) {
    return NextResponse.json({ error: "Invalid password-reset payload." }, { status: 400 });
  }

  const result = await resetPasswordFromToken(payload.data.token, payload.data.password);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
