import { z } from "zod";

import { getCurrentDbUser } from "@/server/auth-helpers";
import { unauthorizedResponse, serviceResultToResponse } from "@/server/route-utils";
import { submitRound1Attempt } from "@/server/team-service";

const round1SubmissionSchema = z.object({
  bankId: z.string().trim().min(1),
  rightCount: z.number().int().min(0),
  wrongCount: z.number().int().min(0),
  objectiveScore: z.number().int().min(0),
  durationMinutes: z.number().int().min(1),
  answers: z.unknown().optional(),
});

export async function POST(request: Request) {
  const user = await getCurrentDbUser();
  if (!user) {
    return unauthorizedResponse();
  }

  const payload = round1SubmissionSchema.safeParse(await request.json().catch(() => null));
  if (!payload.success) {
    return Response.json(
      { error: "Invalid Round 1 submission payload.", issues: payload.error.flatten() },
      { status: 400 },
    );
  }

  const result = await submitRound1Attempt(user.id, payload.data);
  return serviceResultToResponse(result);
}
