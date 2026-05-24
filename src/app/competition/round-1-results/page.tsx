import type { Metadata } from "next";

import { Round1QualifiedTeamsPage } from "@/components/round1-qualified-teams-page";

export const metadata: Metadata = {
  title: "Round 1 results",
  description: "Teams qualified for Round 2 of Attacker 2026.",
};

export default function Page() {
  return <Round1QualifiedTeamsPage />;
}
