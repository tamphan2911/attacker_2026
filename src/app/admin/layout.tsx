import type { ReactNode } from "react";

import { AdminModeLayout } from "@/components/admin-mode-layout";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminModeLayout>{children}</AdminModeLayout>;
}
