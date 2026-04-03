import { z } from "zod";

import { getCurrentDbUser } from "@/server/auth-helpers";
import { unauthorizedResponse } from "@/server/route-utils";
import { serializeRound1Submission } from "@/server/site-serializers";
import { completeRound1Attempt } from "@/server/team-service";

const round1AttemptSubmitSchema = z.object({
  currentQuestionIndex: z.number().int().min(0).optional(),
  answers: z
    .record(
      z.string(),
      z.object({
        selectedOptionIds: z.array(z.string()).optional(),
        pairingMatches: z.record(z.string(), z.string()).optional(),
        essayText: z.string().optional(),
      }),
    )
    .optional(),
});

export async function POST(request: Request) {
  const user = await getCurrentDbUser();
  if (!user) {
    return unauthorizedResponse();
  }

  const payload = round1AttemptSubmitSchema.safeParse(await request.json().catch(() => ({})));
  if (!payload.success) {
    return Response.json(
      { error: "Invalid Round 1 submission payload.", issues: payload.error.flatten() },
      { status: 400 },
    );
  }

  const result = await completeRound1Attempt(user.id, payload.data);
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status });
  }

  return Response.json(
    {
      submission: serializeRound1Submission(result.data.submission),
    },
    { status: result.status },
  );
}
