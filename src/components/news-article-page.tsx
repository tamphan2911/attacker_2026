"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { formatDateLabel, pickText } from "@/lib/site";
import type { NewsPost } from "@/types/site";
import { useSiteState } from "@/components/providers/site-state-provider";
import { PageIntro, SectionHeading, StatusPill, Surface } from "@/components/site-ui";

export function NewsArticlePage({ post }: { post: NewsPost }) {
  const { locale, newsPosts, pageContent } = useSiteState();
  const relatedPosts = newsPosts.filter((item) => item.slug !== post.slug).slice(0, 3);

  return (
    <div className="space-y-14">
      <Link href="/news" className="inline-flex items-center gap-2 text-sm font-semibold text-sky-200">
        <ArrowLeft className="h-4 w-4" />
        {locale === "en" ? "Back to newsroom" : "Quay lại newsroom"}
      </Link>

      <PageIntro
        eyebrow={pickText(locale, post.category)}
        title={pickText(locale, post.title)}
        description={pickText(locale, post.excerpt)}
        aside={
          <Surface className="px-5 py-5">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-200/80">
              {locale === "en" ? "Article details" : "Chi tiet bai viet"}
            </p>
            <div className="mt-5 space-y-3 text-sm theme-text-muted">
              <p>{formatDateLabel(locale, post.publishedAt)}</p>
              <p>{post.author}</p>
              <p>{post.readTime}</p>
            </div>
          </Surface>
        }
      />

      <Surface className="overflow-hidden px-0 py-0">
        <div className="relative min-h-[320px] md:min-h-[420px]">
          <Image
            src={post.coverImageSrc}
            alt={pickText(locale, post.coverImageAlt)}
            fill
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,18,35,0.06),rgba(7,18,35,0.14),rgba(7,18,35,0.58))]" />
          <div className="absolute inset-x-0 bottom-0 px-6 py-6 text-white md:px-8 md:py-8">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/68">
              {pickText(locale, post.coverLabel)}
            </p>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/76">
              {pickText(locale, post.excerpt)}
            </p>
          </div>
        </div>
      </Surface>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Surface className="px-6 py-6 md:px-8 md:py-8">
          <div className="space-y-8">
            {post.content.map((block, index) =>
              block.type === "paragraph" ? (
                <p key={index} className="text-base leading-8 theme-text-body">
                  {pickText(locale, block.body)}
                </p>
              ) : (
                <figure key={index} className="space-y-4">
                  <div
                    className={`overflow-hidden rounded-[1.9rem] border theme-border ${
                      block.emphasis === "feature"
                        ? "theme-card-shadow-soft"
                        : ""
                    }`}
                  >
                    <Image
                      src={block.src}
                      alt={pickText(locale, block.alt)}
                      width={1400}
                      height={860}
                      className="h-auto w-full object-cover"
                    />
                  </div>
                  <figcaption className="text-sm leading-7 theme-text-soft">
                    {pickText(locale, block.caption)}
                  </figcaption>
                </figure>
              ),
            )}
          </div>
        </Surface>

        <Surface className="h-fit px-6 py-6">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-200/80">
            {pickText(locale, pageContent.news.related.eyebrow)}
          </p>
          <div className="mt-5 space-y-4">
            {relatedPosts.map((item) => (
              <Link key={item.slug} href={`/news/${item.slug}`} className="block">
                <div className="rounded-[1.7rem] border theme-border theme-panel px-4 py-4 transition hover:border-sky-300/22 hover:bg-[var(--panel-strong)]">
                  <StatusPill>{pickText(locale, item.category)}</StatusPill>
                  <p className="mt-4 text-base font-semibold leading-7 theme-text-strong">
                    {pickText(locale, item.title)}
                  </p>
                  <p className="mt-3 text-sm leading-7 theme-text-muted">
                    {pickText(locale, item.excerpt)}
                  </p>
                  <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-cyan-200">
                    {locale === "en" ? "Open article" : "Mở bài viết"}
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </Surface>
      </section>
    </div>
  );
}

export function NewsArticleRoute({ slug }: { slug: string }) {
  const { hasHydrated, locale, newsPosts } = useSiteState();
  const post = newsPosts.find((item) => item.slug === slug);

  if (!hasHydrated && !post) {
    return (
      <Surface className="px-6 py-6 md:px-8 md:py-8">
        <SectionHeading
          eyebrow={locale === "en" ? "Newsroom" : "Newsroom"}
          title={locale === "en" ? "Loading article..." : "Dang tai bai viet..."}
          description={
            locale === "en"
              ? "Waiting for the local site dataset to hydrate."
              : "Dang cho bo du lieu cuc bo cua website duoc tai xong."
          }
        />
      </Surface>
    );
  }

  if (!post) {
    return (
      <div className="space-y-8">
        <Link href="/news" className="inline-flex items-center gap-2 text-sm font-semibold text-sky-200">
          <ArrowLeft className="h-4 w-4" />
          {locale === "en" ? "Back to newsroom" : "Quay lại newsroom"}
        </Link>
        <Surface className="px-6 py-6 md:px-8 md:py-8">
          <SectionHeading
            eyebrow={locale === "en" ? "Newsroom" : "Newsroom"}
            title={locale === "en" ? "Article not found." : "Không tìm thấy bài viết."}
            description={
              locale === "en"
                ? "The article may have been removed from the current frontend dataset."
                : "Bài viết có thể đã bị gỡ khỏi bộ dữ liệu frontend hiện tại."
            }
          />
        </Surface>
      </div>
    );
  }

  return <NewsArticlePage post={post} />;
}
