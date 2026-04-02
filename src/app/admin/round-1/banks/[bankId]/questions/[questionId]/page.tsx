import type { Metadata } from "next";

import { AdminRound1QuestionEditor } from "@/components/admin-round1-manager";
import { AdminShell } from "@/components/admin-page";
import { round1TestBanks } from "@/data/site-content";

export function generateStaticParams() {
  return round1TestBanks.flatMap((bank) =>
    bank.questions.map((question) => ({
      bankId: bank.id,
      questionId: question.id,
    })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ bankId: string; questionId: string }>;
}): Promise<Metadata> {
  const { bankId, questionId } = await params;
  const bank = round1TestBanks.find((item) => item.id === bankId);
  const questionIndex = bank?.questions.findIndex((item) => item.id === questionId) ?? -1;

  return {
    title:
      bank && questionIndex >= 0
        ? `Admin Round 1 - Question ${questionIndex + 1}`
        : "Admin Round 1 - Question editor",
  };
}

export default async function AdminRound1QuestionRoute({
  params,
}: {
  params: Promise<{ bankId: string; questionId: string }>;
}) {
  const { bankId, questionId } = await params;

  return (
    <AdminShell section="round1">
      <AdminRound1QuestionEditor bankId={bankId} questionId={questionId} />
    </AdminShell>
  );
}
