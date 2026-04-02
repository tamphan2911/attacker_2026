import { AdminJudgeEditor } from "@/components/admin-judges-manager";
import { AdminShell } from "@/components/admin-page";
import { judgeProfiles } from "@/data/site-content";

export function generateStaticParams() {
  return judgeProfiles.map((judge) => ({ judgeId: judge.id }));
}

export default async function AdminJudgeEditorRoute({
  params,
}: {
  params: Promise<{ judgeId: string }>;
}) {
  const { judgeId } = await params;

  return (
    <AdminShell section="judges">
      <AdminJudgeEditor key={judgeId} judgeId={judgeId} />
    </AdminShell>
  );
}
