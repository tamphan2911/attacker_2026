import type { Metadata } from "next";

import { AdminRound1TeamResultDetail } from "@/components/admin-round1-manager";
import { AdminShell } from "@/components/admin-page";
import { mockTeams } from "@/data/site-content";

export function generateStaticParams() {
  return mockTeams.map((team) => ({ teamId: team.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ teamId: string }>;
}): Promise<Metadata> {
  const { teamId } = await params;
  const team = mockTeams.find((item) => item.id === teamId);

  return {
    title: team ? `Admin Round 1 - ${team.name}` : "Admin Round 1 - Team result",
  };
}

export default async function AdminRound1TeamResultRoute({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;

  return (
    <AdminShell section="round1">
      <AdminRound1TeamResultDetail teamId={teamId} />
    </AdminShell>
  );
}
