import type { Metadata } from "next";

import { CompetitionPage } from "@/components/competition-page";

export const metadata: Metadata = {
  title: "Competition",
  description: "Rounds, rewards, eligibility, and competition structure for Attacker 2026.",
};

export default function Page() {
  return <CompetitionPage />;
}
