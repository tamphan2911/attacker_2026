import { AdminUserEditor } from "@/components/admin-record-editor";
import { AdminShell } from "@/components/admin-page";
import { mockUsers } from "@/data/site-content";

export function generateStaticParams() {
  return mockUsers.map((user) => ({ userId: user.id }));
}

export default async function AdminUserRecordRoute({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;

  return (
    <AdminShell section="users">
      <AdminUserEditor userId={userId} />
    </AdminShell>
  );
}
