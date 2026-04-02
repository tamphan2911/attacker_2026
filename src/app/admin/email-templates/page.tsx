import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AdminEmailTemplatesManager } from "@/components/admin-email-templates-manager";
import { getCurrentDbUser, hasAdminRole } from "@/server/auth-helpers";

export const metadata: Metadata = {
  title: "Admin / Email templates",
};

export default async function AdminEmailTemplatesPage() {
  const user = await getCurrentDbUser();
  if (!user || !hasAdminRole(user.role)) {
    redirect("/admin");
  }

  return <AdminEmailTemplatesManager />;
}
