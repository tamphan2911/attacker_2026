import type { Metadata } from "next";

import { FinalistsPage } from "@/components/finalists-page";

export const metadata: Metadata = {
  title: "Finalists",
  description: "Top 5 finalist teams and 10 Emerging Teams for Attacker 2026.",
};

export default function Page() {
  return <FinalistsPage />;
}
