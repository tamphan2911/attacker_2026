import type { Metadata } from "next";

import { AdminEmailTemplatesManager } from "@/components/admin-email-templates-manager";

export const metadata: Metadata = {
  title: "Admin / Email templates",
};

export default function AdminEmailTemplatesPage() {
  return <AdminEmailTemplatesManager />;
}
