import type { Metadata } from "next";

import { TimelinePage } from "@/components/timeline-page";

export const metadata: Metadata = {
  title: "Timeline",
  description: "Round-based schedule, place, and method overview for Attacker 2026.",
};

export default function Page() {
  return <TimelinePage />;
}
