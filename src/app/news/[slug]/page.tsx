import type { Metadata } from "next";

import { NewsArticleRoute } from "@/components/news-article-page";
import { newsPosts as seedNewsPosts } from "@/data/site-content";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return seedNewsPosts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = seedNewsPosts.find((item) => item.slug === slug);

  if (!post) {
    return {
      title: "News article",
    };
  }

  return {
    title: post.title.en,
    description: post.excerpt.en,
  };
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  return <NewsArticleRoute slug={slug} />;
}
