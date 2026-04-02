import { NextResponse } from "next/server";
import { z } from "zod";

import { resendAccountActivationEmail } from "@/server/auth-email";

const resendSchema = z.object({
  email: z.string().trim().email(),
  locale: z.enum(["en", "vi"]).optional().default("vi"),
});

export async function POST(request: Request) {
  const payload = resendSchema.safeParse(await request.json().catch(() => null));
  if (!payload.success) {
    return NextResponse.json({ error: "Invalid resend payload." }, { status: 400 });
  }

  const result = await resendAccountActivationEmail(payload.data.email, payload.data.locale);
  return NextResponse.json(
    {
      success: true,
      emailDeliveryMode: result.mode,
    },
    { status: 200 },
  );
}
