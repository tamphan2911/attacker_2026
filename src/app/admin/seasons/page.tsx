import type { Metadata } from "next";

import { AdminShell } from "@/components/admin-page";
import { AdminSeasonsManager } from "@/components/admin-seasons-manager";

export const metadata: Metadata = {
  title: "Admin Seasons",
};

export default function AdminSeasonsRoute() {
  return (
    <AdminShell section="content">
      <AdminSeasonsManager />
    </AdminShell>
  );
}
