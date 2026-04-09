import type { Metadata } from "next";

import { AdminShell } from "@/components/admin-page";
import { AdminRound1ExamList } from "@/components/admin-round1-exams-manager";

export const metadata: Metadata = {
  title: "Admin Round 1 - Exam list",
};

export default function AdminRound1ExamsRoute() {
  return (
    <AdminShell section="round1">
      <AdminRound1ExamList />
    </AdminShell>
  );
}
