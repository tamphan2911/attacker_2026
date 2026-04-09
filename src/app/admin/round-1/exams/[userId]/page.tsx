import type { Metadata } from "next";

import { AdminShell } from "@/components/admin-page";
import { AdminRound1ExamDetailView } from "@/components/admin-round1-exams-manager";

export const metadata: Metadata = {
  title: "Admin Round 1 - Exam detail",
};

export default async function AdminRound1ExamDetailRoute({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;

  return (
    <AdminShell section="round1">
      <AdminRound1ExamDetailView userId={userId} />
    </AdminShell>
  );
}
