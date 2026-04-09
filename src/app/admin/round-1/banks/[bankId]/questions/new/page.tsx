import type { Metadata } from "next";

import { AdminRound1QuestionCreator } from "@/components/admin-round1-manager";
import { AdminShell } from "@/components/admin-page";
import { round1TestBanks } from "@/data/site-content";

export function generateStaticParams() {
  return round1TestBanks.map((bank) => ({ bankId: bank.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ bankId: string }>;
}): Promise<Metadata> {
  const { bankId } = await params;
  const bank = round1TestBanks.find((item) => item.id === bankId);

  return {
    title: bank ? `Admin Round 1 - New question - ${bank.title.en}` : "Admin Round 1 - New question",
  };
}

export default async function AdminRound1NewQuestionRoute({
  params,
}: {
  params: Promise<{ bankId: string }>;
}) {
  const { bankId } = await params;

  return (
    <AdminShell section="round1">
      <AdminRound1QuestionCreator bankId={bankId} />
    </AdminShell>
  );
}
