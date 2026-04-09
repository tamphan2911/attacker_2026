import type { Metadata } from "next";

import { FinalResultsPage } from "@/components/final-results-page";

export const metadata: Metadata = {
  title: "Final results",
  description: "Champion, runner-up, third place, and the two 4th-place teams for Attacker 2026.",
};

export default function Page() {
  return <FinalResultsPage />;
}
