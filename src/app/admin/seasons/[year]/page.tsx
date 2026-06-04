import type { Metadata } from "next";

import { AdminShell } from "@/components/admin-page";
import { AdminSeasonsManager } from "@/components/admin-seasons-manager";

export const dynamicParams = true;
const defaultSeasonContentYears = ["2023", "2024", "2025", "2026"] as const;

export function generateStaticParams() {
  return defaultSeasonContentYears.map((year) => ({ year }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ year: string }>;
}): Promise<Metadata> {
  const { year } = await params;
  return {
    title: `Admin Season ${year}`,
  };
}

export default async function AdminSeasonDetailRoute({
  params,
}: {
  params: Promise<{ year: string }>;
}) {
  const { year } = await params;

  return (
    <AdminShell section="content">
      <AdminSeasonsManager year={year} />
    </AdminShell>
  );
}
