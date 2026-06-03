import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AdminShell } from "@/components/admin-page";
import { AdminSeasonsManager } from "@/components/admin-seasons-manager";

const seasonContentYears = ["2023", "2024", "2025", "2026"] as const;

export function generateStaticParams() {
  return seasonContentYears.map((year) => ({ year }));
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
  if (!seasonContentYears.includes(year as (typeof seasonContentYears)[number])) {
    notFound();
  }

  return (
    <AdminShell section="content">
      <AdminSeasonsManager year={year} />
    </AdminShell>
  );
}
