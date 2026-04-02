import { NextResponse } from "next/server";
import { z } from "zod";

import { requestPasswordReset } from "@/server/auth-email";

const requestPasswordResetSchema = z.object({
  email: z.string().trim().email(),
  locale: z.enum(["en", "vi"]).optional().default("vi"),
});

export async function POST(request: Request) {
  const payload = requestPasswordResetSchema.safeParse(await request.json().catch(() => null));
  if (!payload.success) {
    return NextResponse.json({ error: "Invalid password-reset request." }, { status: 400 });
  }

  const result = await requestPasswordReset(payload.data.email, payload.data.locale);

  return NextResponse.json(
    {
      success: true,
      emailDeliveryMode: result.mode,
    },
    { status: 200 },
  );
}
