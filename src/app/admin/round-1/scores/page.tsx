import type { Metadata } from "next";

import { AdminShell } from "@/components/admin-page";
import { AdminRound1ScoresManager } from "@/components/admin-round1-manager";

export const metadata: Metadata = {
  title: "Admin Round 1 - Scores",
};

export default function AdminRound1ScoresRoute() {
  return (
    <AdminShell section="round1">
      <AdminRound1ScoresManager />
    </AdminShell>
  );
}
