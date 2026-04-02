import type { Metadata } from "next";

import { FaqPage } from "@/components/faq-page";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Frequently asked questions about eligibility, teams, and round progression for Attacker 2026.",
};

export default function Page() {
  return <FaqPage />;
}
