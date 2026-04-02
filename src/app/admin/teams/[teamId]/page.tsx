import { AdminTeamEditor } from "@/components/admin-record-editor";
import { AdminShell } from "@/components/admin-page";
import { mockTeams } from "@/data/site-content";

export function generateStaticParams() {
  return mockTeams.map((team) => ({ teamId: team.id }));
}

export default async function AdminTeamRecordRoute({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;

  return (
    <AdminShell section="teams">
      <AdminTeamEditor teamId={teamId} />
    </AdminShell>
  );
}
