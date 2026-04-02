import type { Metadata } from "next";

import { RulesPage } from "@/components/rules-page";

export const metadata: Metadata = {
  title: "Rules & Timeline",
  description: "Team policies, eligibility logic, FAQ, and the proposed timeline for Attacker 2026.",
};

export default function Page() {
  return <RulesPage />;
}
