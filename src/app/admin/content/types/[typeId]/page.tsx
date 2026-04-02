import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ContentTypeEditor } from "@/components/admin-content-editor";
import { AdminShell } from "@/components/admin-page";
import { contentTypeConfigs, isContentTypeId } from "@/data/admin-content";

export function generateStaticParams() {
  return contentTypeConfigs.map((item) => ({ typeId: item.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ typeId: string }>;
}): Promise<Metadata> {
  const { typeId } = await params;
  const config = contentTypeConfigs.find((item) => item.id === typeId);

  return {
    title: config ? `Admin Content - ${config.label.en}` : "Admin Content",
  };
}

export default async function AdminContentTypeRoute({
  params,
}: {
  params: Promise<{ typeId: string }>;
}) {
  const { typeId } = await params;

  if (!isContentTypeId(typeId)) {
    notFound();
  }

  return (
    <AdminShell section="content">
      <ContentTypeEditor typeId={typeId} />
    </AdminShell>
  );
}
