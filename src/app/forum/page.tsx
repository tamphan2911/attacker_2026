import type { Metadata } from "next";

import { ForumPage } from "@/components/forum-page";

export const metadata: Metadata = {
  title: "Forum",
  description: "Discussion space for Attacker 2026 participants to find teammates and continue conversation in one place.",
};

export default function Page() {
  return <ForumPage />;
}
