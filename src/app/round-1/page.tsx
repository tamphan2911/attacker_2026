import type { Metadata } from "next";

import { Round1ExamPage } from "@/components/round1-exam-page";

export const metadata: Metadata = {
  title: "Round 1 Exam",
  description: "Student-facing Round 1 exam with randomized question delivery.",
};

export default function Round1PageRoute() {
  return <Round1ExamPage />;
}
