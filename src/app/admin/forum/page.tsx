import type { Metadata } from "next";

import { AdminForumManager } from "@/components/admin-forum-manager";

export const metadata: Metadata = {
  title: "Admin Forum",
};

export default function AdminForumRoute() {
  return <AdminForumManager />;
}
