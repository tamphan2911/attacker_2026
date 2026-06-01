import type { Metadata } from "next";

import { EmergingResultsPage } from "@/components/emerging-results-page";

export const metadata: Metadata = {
  title: "Emerging results",
  description: "The 10 Emerging award teams for Attacker 2026.",
};

export default function Page() {
  return <EmergingResultsPage />;
}
