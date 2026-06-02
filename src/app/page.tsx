import type { Metadata } from "next";

import { ConstructionPage } from "@/components/construction-page";
import { HomePage } from "@/components/home-page";
import { readConstructionGateState } from "@/server/construction-gate";

export const metadata: Metadata = {
  title: "Home",
};

export default async function Page() {
  const gate = await readConstructionGateState();

  if (gate.shouldGate) {
    return <ConstructionPage content={gate.constructionContent} targetAt={gate.targetAt} locale="vi" />;
  }

  return <HomePage />;
}
