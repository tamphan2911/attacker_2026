import { NextResponse } from "next/server";
import { z } from "zod";

import { activateAccountFromToken } from "@/server/auth-email";

const activationSchema = z.object({
  token: z.string().trim().min(1),
});

export async function POST(request: Request) {
  const payload = activationSchema.safeParse(await request.json().catch(() => null));
  if (!payload.success) {
    return NextResponse.json({ error: "Invalid activation payload." }, { status: 400 });
  }

  const result = await activateAccountFromToken(payload.data.token);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
