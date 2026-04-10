import { redirect } from "next/navigation";

export default async function AdminRound1TeamResultRoute({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  redirect(`/admin/round-1/scores/${teamId}`);
}
