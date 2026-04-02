import type { Metadata } from "next";

import { RulesPage } from "@/components/rules-page";

export const metadata: Metadata = {
  title: "Rules",
  description: "General policies and round-specific rules for Attacker 2026.",
};

export default function Page() {
  return <RulesPage />;
}
