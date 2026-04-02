import { AdminShell } from "@/components/admin-page";
import { AdminUserProfileView } from "@/components/admin-user-profile-view";
import { mockUsers } from "@/data/site-content";

export function generateStaticParams() {
  return mockUsers.map((user) => ({ userId: user.id }));
}

export default async function AdminUserProfileRoute({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;

  return (
    <AdminShell section="users">
      <AdminUserProfileView userId={userId} />
    </AdminShell>
  );
}
