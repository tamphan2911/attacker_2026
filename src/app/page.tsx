import type { Metadata } from "next";

import { ConstructionPage } from "@/components/construction-page";
import { HomePage } from "@/components/home-page";
import { readConstructionGateState } from "@/server/construction-gate";
import { readCachedSiteData } from "@/server/site-data-service";

export const metadata: Metadata = {
  title: "Home",
};

export default async function Page() {
  const gate = await readConstructionGateState();

  if (gate.shouldGate) {
    return <ConstructionPage content={gate.constructionContent} targetAt={gate.targetAt} locale="vi" />;
  }

  const initialSiteData = process.env.DATABASE_URL ? await readCachedSiteData() : undefined;

  return <HomePage initialSiteData={initialSiteData} />;
}
