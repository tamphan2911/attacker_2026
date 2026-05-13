import type { Metadata } from "next";

import { AdminPage } from "@/components/admin-page";

export const metadata: Metadata = {
  title: "Admin Messages",
};

export default function AdminMessagesRoute() {
  return <AdminPage section="messages" />;
}
