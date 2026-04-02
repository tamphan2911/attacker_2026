"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { formatDateLabel, pickText } from "@/lib/site";
import type { NewsPost } from "@/types/site";
import { useSiteState } from "@/components/providers/site-state-provider";
import { SectionHeading, StatusPill, Surface } from "@/components/site-ui";

export function NewsArticlePage({ post }: { post: NewsPost }) {
  const { locale, newsPosts, pageContent } = useSiteState();
  const relatedPosts = newsPosts.filter((item) => item.slug !== post.slug).slice(0, 3);

  return (
    <div className="space-y-14">
      <Link href="/news" className="inline-flex items-center gap-2 text-sm font-semibold text-sky-200">
        <ArrowLeft className="h-4 w-4" />
        {locale === "en" ? "Back to newsroom" : "Quay lại newsroom"}
      </Link>

      <section className="theme-card-shadow-soft relative overflow-hidden rounded-[2rem] border">
        <Image
          src={post.coverImageSrc}
          alt={pickText(locale, post.coverImageAlt)}
          fill
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-[linear-gradient(118deg,rgba(3,10,24,0.9)_0%,rgba(6,18,39,0.82)_38%,rgba(7,18,35,0.62)_68%,rgba(7,18,35,0.78)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.16),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(14,165,233,0.12),transparent_30%)]" />
        <div className="relative grid gap-6 px-5 py-7 md:px-8 md:py-8 lg:grid-cols-[minmax(0,1fr)_290px] lg:items-end lg:px-10 lg:py-10">
          <div className="max-w-3xl space-y-5 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.34em] text-white/70">
              {pickText(locale, post.category)}
            </p>
            <h1 className="theme-heading text-3xl font-semibold tracking-tight text-white md:text-[3.1rem] md:leading-[1.04]">
              {pickText(locale, post.title)}
            </h1>
            <p className="max-w-2xl text-base leading-8 text-white/78 md:text-[1.05rem]">
              {pickText(locale, post.excerpt)}
            </p>
            <div className="flex flex-wrap items-center gap-3 text-sm text-white/68">
              <span>{formatDateLabel(locale, post.publishedAt)}</span>
              <span className="h-1 w-1 rounded-full bg-white/42" />
              <span>{post.author}</span>
              <span className="h-1 w-1 rounded-full bg-white/42" />
              <span>{post.readTime}</span>
            </div>
          </div>

          <div className="rounded-[1.7rem] border border-white/12 bg-[rgba(7,18,35,0.44)] p-5 shadow-[0_28px_60px_rgba(2,6,23,0.26)] backdrop-blur-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/64">
              {locale === "en" ? "Article details" : "Chi tiết bài viết"}
            </p>
            <div className="mt-5 space-y-4">
              <div>
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-white/42">
                  {locale === "en" ? "Published" : "Ngày đăng"}
                </p>
                <p className="mt-2 text-sm text-white/82">{formatDateLabel(locale, post.publishedAt)}</p>
              </div>
              <div>
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-white/42">
                  {locale === "en" ? "Author" : "Tác giả"}
                </p>
                <p className="mt-2 text-sm text-white/82">{post.author}</p>
              </div>
              <div>
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-white/42">
                  {locale === "en" ? "Reading time" : "Thời lượng đọc"}
                </p>
                <p className="mt-2 text-sm text-white/82">{post.readTime}</p>
              </div>
              <div className="rounded-[1.35rem] border border-white/10 bg-white/6 px-4 py-4">
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-white/42">
                  {locale === "en" ? "Cover note" : "Ghi chú ảnh bìa"}
                </p>
                <p className="mt-2 text-sm leading-7 text-white/72">
                  {pickText(locale, post.coverLabel)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

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
          title={locale === "en" ? "Loading article..." : "Đang tải bài viết..."}
          description={
            locale === "en"
              ? "Waiting for the local site dataset to hydrate."
              : "Đang chờ bộ dữ liệu cục bộ của website được tải xong."
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
