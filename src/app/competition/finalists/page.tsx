import type { Metadata } from "next";

import { FinalistsPage } from "@/components/finalists-page";

export const metadata: Metadata = {
  title: "Finalists",
  description: "Top 5 finalist teams and 20 Emerging round qualifiers for Attacker 2026.",
};

export default function Page() {
  return <FinalistsPage />;
}
