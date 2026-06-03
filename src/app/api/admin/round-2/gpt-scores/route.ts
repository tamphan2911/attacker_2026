import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentDbUser, hasAdminRole } from "@/server/auth-helpers";
import {
  deleteAdminRound2GptScores,
  readAdminRound2GptScoreRows,
} from "@/server/admin-round2-gpt-scores";

const DELETE_ALL_PASSWORD = "Aa@291189";

const deletePayloadSchema = z.object({
  reviewIds: z.array(z.string().trim().min(1)).optional(),
  deleteAll: z.boolean().optional(),
  password: z.string().optional(),
});

export async function GET() {
  const user = await getCurrentDbUser();
  if (!user || !hasAdminRole(user.role)) {
    return NextResponse.json({ error: "Only admin accounts can manage Round 2 GPT scores." }, { status: 403 });
  }

  return NextResponse.json({ rows: await readAdminRound2GptScoreRows() }, { status: 200 });
}

export async function DELETE(request: Request) {
  const user = await getCurrentDbUser();
  if (!user || !hasAdminRole(user.role)) {
    return NextResponse.json({ error: "Only admin accounts can delete Round 2 GPT scores." }, { status: 403 });
  }

  const payload = deletePayloadSchema.safeParse(await request.json().catch(() => null));
  if (!payload.success) {
    return NextResponse.json({ error: "Invalid Round 2 GPT score deletion request." }, { status: 400 });
  }

  const deleteAll = Boolean(payload.data.deleteAll);
  const reviewIds = payload.data.reviewIds ?? [];
  if (!deleteAll && reviewIds.length === 0) {
    return NextResponse.json({ error: "Choose at least one GPT score entry to delete." }, { status: 400 });
  }

  if (deleteAll && payload.data.password !== DELETE_ALL_PASSWORD) {
    return NextResponse.json({ error: "Delete-all password is incorrect." }, { status: 403 });
  }

  const result = await deleteAdminRound2GptScores({ deleteAll, reviewIds });
  return NextResponse.json(result.data, { status: result.status });
}
