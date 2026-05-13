import type { Metadata } from "next";

import { AdminShell } from "@/components/admin-page";
import { AdminSponsorsList } from "@/components/admin-sponsors-manager";

export const metadata: Metadata = {
  title: "Admin Content - Sponsors",
};

export default function AdminContentSponsorsRoute() {
  return (
    <AdminShell section="content">
      <AdminSponsorsList />
    </AdminShell>
  );
}
