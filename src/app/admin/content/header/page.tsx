import type { Metadata } from "next";

import { ContentHeaderEditor } from "@/components/admin-content-editor";
import { AdminShell } from "@/components/admin-page";

export const metadata: Metadata = {
  title: "Admin Content - Header",
};

export default function AdminContentHeaderRoute() {
  return (
    <AdminShell section="content">
      <ContentHeaderEditor />
    </AdminShell>
  );
}
