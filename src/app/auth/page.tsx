import type { Metadata } from "next";
import { connection } from "next/server";

import { AuthPage } from "@/components/auth-page";
import { ConstructionAuthGate } from "@/components/construction-page";
import { readConstructionGateState } from "@/server/construction-gate";

export const metadata: Metadata = {
  title: "Authentication",
  description: "Frontend-ready sign in and registration experience for Attacker 2026.",
};

export default async function Page() {
  await connection();

  const gate = await readConstructionGateState();

  if (gate.shouldGate) {
    return <ConstructionAuthGate content={gate.constructionContent} targetAt={gate.targetAt} locale="vi" />;
  }

  return <AuthPage />;
}
