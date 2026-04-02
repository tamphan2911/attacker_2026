import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ContentPageEditor } from "@/components/admin-content-editor";
import { AdminShell } from "@/components/admin-page";
import { contentPageConfigs, isContentPageId } from "@/data/admin-content";

export function generateStaticParams() {
  return contentPageConfigs.map((item) => ({ pageId: item.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ pageId: string }>;
}): Promise<Metadata> {
  const { pageId } = await params;
  const config = contentPageConfigs.find((item) => item.id === pageId);

  return {
    title: config ? `Admin Content - ${config.label.en}` : "Admin Content",
  };
}

export default async function AdminContentPageRoute({
  params,
}: {
  params: Promise<{ pageId: string }>;
}) {
  const { pageId } = await params;

  if (!isContentPageId(pageId)) {
    notFound();
  }

  return (
    <AdminShell section="content">
      <ContentPageEditor pageId={pageId} />
    </AdminShell>
  );
}
