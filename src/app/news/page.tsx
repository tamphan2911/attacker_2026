import type { Metadata } from "next";

import { NewsPage } from "@/components/news-page";

export const metadata: Metadata = {
  title: "News",
  description: "Bilingual newsroom for Attacker 2026 updates, launches, and organizer announcements.",
};

export default function Page() {
  return <NewsPage />;
}
