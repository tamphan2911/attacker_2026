import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";

import { JudgeDashboardPage } from "@/components/judge-dashboard-page";
import { getCurrentDbUser } from "@/server/auth-helpers";
import { getJudgeDashboardData } from "@/server/judge-service";

export const metadata: Metadata = {
  title: "Judge Dashboard",
  description: "Review and score the rounds assigned to the signed-in judge account.",
};

export default async function Page() {
  const user = await getCurrentDbUser();
  if (!user) {
    redirect("/auth");
  }

  if (user.role !== UserRole.JUDGE) {
    redirect("/profile");
  }

  const result = await getJudgeDashboardData(user.id);
  if (!result.ok) {
    redirect("/profile");
  }

  return <JudgeDashboardPage data={result.data} />;
}
