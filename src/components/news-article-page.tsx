"use client";

/* eslint-disable @next/next/no-img-element */

import Image from "next/image";
import Link from "next/link";
import { Fragment } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { formatDateLabel, pickText } from "@/lib/site";
import type { NewsPost } from "@/types/site";
import { useSiteState } from "@/components/providers/site-state-provider";
import { SectionHeading, StatusPill, Surface } from "@/components/site-ui";

function renderInlineRichText(text: string) {
  const parts: React.ReactNode[] = [];
  const pattern = /(\*\*([^*]+)\*\*|\*([^*]+)\*|\[([^\]]+)\]\((https?:\/\/[^)\s]+)\))/gu;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    if (match[2]) {
      parts.push(<strong key={`strong-${match.index}`}>{match[2]}</strong>);
    } else if (match[3]) {
      parts.push(<em key={`em-${match.index}`}>{match[3]}</em>);
    } else if (match[4] && match[5]) {
      parts.push(
        <a
          key={`link-${match.index}`}
          href={match[5]}
          target="_blank"
          rel="noreferrer"
          className="font-semibold text-[var(--brand)] underline-offset-4 hover:underline"
        >
          {match[4]}
        </a>,
      );
    }

    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

function RichParagraphBlock({ body }: { body: string }) {
  const lines = body.split(/\n+/u).map((line) => line.trim()).filter(Boolean);
  const elements: React.ReactNode[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];

    if (line.startsWith("## ")) {
      elements.push(
        <h3 key={`heading-${index}`} className="theme-heading pt-2 text-2xl font-semibold theme-text-strong">
          {renderInlineRichText(line.slice(3).trim())}
        </h3>,
      );
      index += 1;
      continue;
    }

    if (line.startsWith("> ")) {
      const quoteLines: string[] = [];
      while (index < lines.length && lines[index].startsWith("> ")) {
        quoteLines.push(lines[index].slice(2).trim());
        index += 1;
      }
      elements.push(
        <blockquote key={`quote-${index}`} className="rounded-[1.5rem] border-l-4 border-sky-400/70 bg-sky-100/50 px-5 py-4 text-base leading-7 theme-text-body dark:bg-sky-300/10">
          {quoteLines.map((quoteLine, quoteIndex) => (
            <p key={`quote-line-${quoteIndex}`}>{renderInlineRichText(quoteLine)}</p>
          ))}
        </blockquote>,
      );
      continue;
    }

    if (line.startsWith("- ")) {
      const items: string[] = [];
      while (index < lines.length && lines[index].startsWith("- ")) {
        items.push(lines[index].slice(2).trim());
        index += 1;
      }
      elements.push(
        <ul key={`list-${index}`} className="ml-3 list-disc space-y-1.5 pl-7 text-base leading-7 theme-text-body marker:text-sky-500 dark:marker:text-sky-300">
          {items.map((item, itemIndex) => (
            <li key={`list-item-${itemIndex}`}>{renderInlineRichText(item)}</li>
          ))}
        </ul>,
      );
      continue;
    }

    if (/^\d+\.\s/u.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^\d+\.\s/u.test(lines[index])) {
        items.push(lines[index].replace(/^\d+\.\s/u, "").trim());
        index += 1;
      }
      elements.push(
        <ol key={`ordered-${index}`} className="ml-3 list-decimal space-y-1.5 pl-7 text-base leading-7 theme-text-body marker:text-sky-500 dark:marker:text-sky-300">
          {items.map((item, itemIndex) => (
            <li key={`ordered-item-${itemIndex}`}>{renderInlineRichText(item)}</li>
          ))}
        </ol>,
      );
      continue;
    }

    elements.push(
      <p key={`paragraph-${index}`} className="text-base leading-7 theme-text-body">
        {renderInlineRichText(line)}
      </p>,
    );
    index += 1;
  }

  return <div className="space-y-3">{elements}</div>;
}

export function NewsArticlePage({ post }: { post: NewsPost }) {
  const { locale, newsPosts, pageContent } = useSiteState();
  const articleLocale = "vi" as const;
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
          alt={pickText(articleLocale, post.coverImageAlt)}
          fill
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-[linear-gradient(118deg,rgba(3,10,24,0.9)_0%,rgba(6,18,39,0.82)_38%,rgba(7,18,35,0.62)_68%,rgba(7,18,35,0.78)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.16),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(14,165,233,0.12),transparent_30%)]" />
        <div className="relative grid gap-6 px-5 py-7 md:px-8 md:py-8 lg:grid-cols-[minmax(0,1fr)_290px] lg:items-end lg:px-10 lg:py-10">
          <div className="max-w-3xl space-y-5 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.34em] text-white/70">
              {pickText(articleLocale, post.category)}
            </p>
            <h1 className="theme-heading text-3xl font-semibold tracking-tight text-white md:text-[3.1rem] md:leading-[1.04]">
              {pickText(articleLocale, post.title)}
            </h1>
            <p className="max-w-2xl text-base leading-8 text-white/78 md:text-[1.05rem]">
              {pickText(articleLocale, post.excerpt)}
            </p>
            <div className="flex flex-wrap items-center gap-3 text-sm text-white/68">
              <span>{formatDateLabel(articleLocale, post.publishedAt)}</span>
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
                <p className="mt-2 text-sm text-white/82">{formatDateLabel(articleLocale, post.publishedAt)}</p>
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
                  {pickText(articleLocale, post.coverLabel)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Surface className="px-6 py-6 md:px-8 md:py-8">
          <div className="space-y-5">
            {post.content.map((block, index) => {
              const previousBlock = post.content[index - 1];
              const showParagraphDivider = block.type === "paragraph" && previousBlock?.type === "paragraph";

              return (
                <Fragment key={`${block.type}-${index}`}>
                  {showParagraphDivider ? (
                    <div
                      aria-hidden="true"
                      className="h-px w-full bg-[linear-gradient(90deg,transparent,rgba(37,99,235,0.2),transparent)] dark:bg-[linear-gradient(90deg,transparent,rgba(125,211,252,0.22),transparent)]"
                    />
                  ) : null}
                  {block.type === "paragraph" ? (
                    <RichParagraphBlock body={pickText(articleLocale, block.body)} />
                  ) : (
                    <figure
                      className={`mx-auto space-y-3 text-center ${
                        block.emphasis === "feature" ? "max-w-3xl" : "max-w-2xl"
                      }`}
                    >
                      <div
                        className={`inline-block max-w-full overflow-hidden rounded-[1.7rem] border theme-border ${
                          block.emphasis === "feature" ? "theme-card-shadow-soft" : ""
                        }`}
                      >
                        <img
                          src={block.src}
                          alt={pickText(articleLocale, block.alt)}
                          loading="lazy"
                          className="h-auto max-h-[72vh] max-w-full object-contain"
                        />
                      </div>
                      <figcaption className="mx-auto max-w-2xl text-left text-sm leading-6 theme-text-soft">
                        {pickText(articleLocale, block.caption)}
                      </figcaption>
                    </figure>
                  )}
                </Fragment>
              );
            })}
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
                  <StatusPill>{pickText(articleLocale, item.category)}</StatusPill>
                  <p className="mt-4 text-base font-semibold leading-7 theme-text-strong">
                    {pickText(articleLocale, item.title)}
                  </p>
                  <p className="mt-3 text-sm leading-7 theme-text-muted">
                    {pickText(articleLocale, item.excerpt)}
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
