import type { Metadata } from "next";

import { AdminNewsEditor } from "@/components/admin-news-manager";
import { AdminShell } from "@/components/admin-page";
import { newsPosts as seedNewsPosts } from "@/data/site-content";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return [...seedNewsPosts.map((post) => ({ slug: post.slug })), { slug: "new" }];
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const seedPost = seedNewsPosts.find((post) => post.slug === slug);

  return {
    title: slug === "new" ? "Admin News - New Article" : `Admin News - ${seedPost?.title.en ?? "Article"}`,
  };
}

export default async function AdminNewsEditorRoute({ params }: PageProps) {
  const { slug } = await params;

  return (
    <AdminShell section="news">
      <AdminNewsEditor slug={slug} />
    </AdminShell>
  );
}
