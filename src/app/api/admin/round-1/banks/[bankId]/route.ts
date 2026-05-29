import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentDbUser, hasElevatedRole } from "@/server/auth-helpers";
import { updateRound1FixedEssayPromptByAdmin } from "@/server/admin-service";

const updateRound1BankSchema = z.object({
  fixedEssayPrompt: z.object({
    en: z.string().max(8000),
    vi: z.string().max(8000),
  }),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ bankId: string }> },
) {
  const user = await getCurrentDbUser();
  if (!user || !hasElevatedRole(user.role)) {
    return NextResponse.json({ error: "Admin or moderator access required." }, { status: 403 });
  }

  const payload = updateRound1BankSchema.safeParse(await request.json().catch(() => null));
  if (!payload.success) {
    return NextResponse.json({ error: "Invalid Round 1 bank payload." }, { status: 400 });
  }

  const { bankId } = await context.params;
  const result = await updateRound1FixedEssayPromptByAdmin(bankId, payload.data.fixedEssayPrompt);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json(result.data, { status: result.status });
}
