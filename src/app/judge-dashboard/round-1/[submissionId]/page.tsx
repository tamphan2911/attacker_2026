import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";

import { JudgeRound1ScorePage } from "@/components/judge-score-page";
import { getCurrentDbUser } from "@/server/auth-helpers";
import { getJudgeRound1Detail } from "@/server/judge-service";

export const metadata: Metadata = {
  title: "Judge Dashboard / Round 1",
};

export default async function Page({
  params,
}: {
  params: Promise<{ submissionId: string }>;
}) {
  const user = await getCurrentDbUser();
  if (!user) {
    redirect("/auth");
  }

  if (user.role !== UserRole.JUDGE) {
    redirect("/profile");
  }

  const { submissionId } = await params;
  const result = await getJudgeRound1Detail(user.id, submissionId);
  if (!result.ok) {
    redirect("/judge-dashboard");
  }

  return <JudgeRound1ScorePage detail={result.data} />;
}
