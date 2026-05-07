import type { Metadata } from "next";

import { ContentSponsorsEditor } from "@/components/admin-content-editor";
import { AdminShell } from "@/components/admin-page";

export const metadata: Metadata = {
  title: "Admin Content - Sponsors",
};

export default function AdminContentSponsorsRoute() {
  return (
    <AdminShell section="content">
      <ContentSponsorsEditor />
    </AdminShell>
  );
}
