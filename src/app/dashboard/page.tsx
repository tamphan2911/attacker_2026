import type { Metadata } from "next";

import { DashboardPage } from "@/components/dashboard-page";

export const metadata: Metadata = {
  title: "Team Workspace",
  description: "Interactive frontend prototype for profiles, teams, invitations, and membership rules.",
};

export default function Page() {
  return <DashboardPage />;
}
