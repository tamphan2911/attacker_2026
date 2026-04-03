import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AdminTimelineManager } from "@/components/admin-timeline-manager";
import { getCurrentDbUser, hasAdminRole } from "@/server/auth-helpers";

export const metadata: Metadata = {
  title: "Admin / Timeline",
};

export default async function AdminTimelinePage() {
  const user = await getCurrentDbUser();
  if (!user || !hasAdminRole(user.role)) {
    redirect("/admin");
  }

  return <AdminTimelineManager />;
}
