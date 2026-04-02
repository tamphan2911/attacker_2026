import type { Metadata } from "next";

import { OrganizerPage } from "@/components/organizer-page";

export const metadata: Metadata = {
  title: "Organizer Dashboard",
  description: "Preview organizer views for content, team oversight, and operational readiness.",
};

export default function Page() {
  return <OrganizerPage />;
}
