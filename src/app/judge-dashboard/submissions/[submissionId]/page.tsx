import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";

import { JudgeTeamSubmissionScorePage } from "@/components/judge-score-page";
import { getCurrentDbUser } from "@/server/auth-helpers";
import { getJudgeTeamSubmissionDetail } from "@/server/judge-service";

export const metadata: Metadata = {
  title: "Judge Dashboard / Submission",
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
  const result = await getJudgeTeamSubmissionDetail(user.id, submissionId);
  if (!result.ok) {
    redirect("/judge-dashboard");
  }

  return <JudgeTeamSubmissionScorePage detail={result.data} />;
}
