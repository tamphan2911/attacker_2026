"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useDeferredValue, useMemo, useState } from "react";

import { formatDateLabel, pickText } from "@/lib/site";
import { useSiteState } from "@/components/providers/site-state-provider";
import { SectionHeading, StatusPill, Surface } from "@/components/site-ui";

const NEWS_PAGE_SIZE = 5;

function cn(...values: Array<string | undefined | false>) {
  return values.filter(Boolean).join(" ");
}

function buildVisiblePages(page: number, pageCount: number) {
  if (pageCount <= 5) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }

  const start = Math.max(1, Math.min(page - 2, pageCount - 4));
  return Array.from({ length: 5 }, (_, index) => start + index);
}

export function NewsPage() {
  const { locale, newsPosts, pageContent } = useSiteState();
  const [query, setQuery] = useState("");
  const [pageState, setPageState] = useState(1);
  const deferredQuery = useDeferredValue(query);

  const filteredPosts = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLowerCase();

    return newsPosts.filter((post) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        [
          post.title.en,
          post.title.vi,
          post.excerpt.en,
          post.excerpt.vi,
          post.category.en,
          post.category.vi,
          ...post.tags,
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);

      return matchesQuery;
    });
  }, [deferredQuery, newsPosts]);

  const pageCount = Math.max(1, Math.ceil(filteredPosts.length / NEWS_PAGE_SIZE));
  const page = Math.min(pageState, pageCount);
  const visiblePages = buildVisiblePages(page, pageCount);

  const paginatedPosts = useMemo(() => {
    const startIndex = (page - 1) * NEWS_PAGE_SIZE;
    return filteredPosts.slice(startIndex, startIndex + NEWS_PAGE_SIZE);
  }, [filteredPosts, page]);

  if (newsPosts.length === 0) {
    return (
      <div className="space-y-8">
        <SectionHeading
          eyebrow={pickText(locale, pageContent.news.latest.eyebrow)}
          title={locale === "en" ? "No news articles yet." : "Chua co bai viet nao."}
          description={
            locale === "en"
              ? "Admin can add articles from admin mode."
              : "Admin co the them bai viet tu admin mode."
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <section className="space-y-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="space-y-1">
            <p className="theme-eyebrow text-xs font-semibold uppercase tracking-[0.34em]">
              {pickText(locale, pageContent.news.latest.eyebrow)}
            </p>
            <p className="text-sm theme-text-soft">
              {locale === "en"
                ? `${filteredPosts.length} editorial updates`
                : `${filteredPosts.length} cập nhật`}
            </p>
          </div>

          <label className="theme-news-search group flex w-full max-w-[500px] items-center gap-3 rounded-[1.6rem] border px-4 py-3 transition">
            <div className="theme-news-search-icon flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition">
              <Search className="h-4 w-4" />
            </div>
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPageState(1);
              }}
              placeholder={
                locale === "en"
                  ? "Search article title, summary, category, or tag"
                  : "Tìm theo tiêu đề, tóm tắt, chuyên mục hoặc thẻ"
              }
              className="theme-news-search-input theme-placeholder min-w-0 flex-1 bg-transparent text-sm outline-none md:text-[0.95rem]"
            />
            {query ? (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setPageState(1);
                }}
                className="theme-news-search-clear rounded-full border px-3 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.16em] transition"
              >
                {locale === "en" ? "Clear" : "Xóa"}
              </button>
            ) : null}
          </label>
        </div>
      </section>

      <section className="space-y-6">
        {filteredPosts.length === 0 ? (
          <Surface className="px-6 py-6 md:px-8 md:py-8">
            <p className="theme-heading text-2xl font-semibold theme-text-strong">
              {locale === "en" ? "No matching articles." : "Không có bài viết phù hợp."}
            </p>
            <p className="mt-3 text-sm leading-7 theme-text-muted">
              {locale === "en"
                ? "Try another keyword or clear the current search."
                : "Hãy thử từ khóa khác hoặc xóa cụm tìm kiếm hiện tại."}
            </p>
          </Surface>
        ) : (
          paginatedPosts.map((post) => (
            <Link key={post.slug} href={`/news/${post.slug}`}>
              <Surface className="group overflow-hidden px-0 py-0 transition hover:-translate-y-0.5 hover:border-sky-300/22 hover:bg-[var(--panel-strong)]">
                <div className="grid gap-0 lg:grid-cols-[360px_minmax(0,1fr)]">
                  <div className="relative min-h-[280px] overflow-hidden">
                    <Image
                      src={post.coverImageSrc}
                      alt={pickText(locale, post.coverImageAlt)}
                      fill
                      sizes="(min-width: 1024px) 360px, 100vw"
                      className="object-cover transition duration-700 group-hover:scale-[1.02]"
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,18,35,0.08),rgba(7,18,35,0.18),rgba(7,18,35,0.82))]" />
                    <div className="absolute left-6 top-6 z-10">
                      <StatusPill>{pickText(locale, post.category)}</StatusPill>
                    </div>
                    <div className="absolute inset-x-0 bottom-0 px-6 py-6 text-white">
                      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/66">
                        {pickText(locale, post.coverLabel)}
                      </p>
                      <p className="mt-3 text-sm text-white/78">
                        {formatDateLabel(locale, post.publishedAt)} · {post.readTime}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start justify-between gap-6 px-6 py-6 md:px-8 md:py-8">
                    <div className="min-w-0">
                      <p className="text-3xl font-semibold tracking-tight theme-text-strong">
                        {pickText(locale, post.title)}
                      </p>
                      <p className="mt-3 text-sm theme-text-soft">
                        {formatDateLabel(locale, post.publishedAt)} · {post.author}
                      </p>
                      <p className="mt-4 max-w-3xl text-base leading-8 theme-text-muted">
                        {pickText(locale, post.excerpt)}
                      </p>
                      <div className="mt-6 flex flex-wrap gap-2">
                        {post.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full border theme-border-strong theme-panel px-3 py-1 text-xs theme-text-muted"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                      <div className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-cyan-200">
                        {locale === "en" ? "Read article" : "Đọc bài viết"}
                        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                      </div>
                    </div>
                  </div>
                </div>
              </Surface>
            </Link>
          ))
        )}
      </section>

      {filteredPosts.length > NEWS_PAGE_SIZE ? (
        <section>
          <div className="flex flex-col gap-3 border-t theme-border pt-5 md:flex-row md:items-center md:justify-between">
            <p className="text-xs font-medium uppercase tracking-[0.18em] theme-text-soft">
              {locale === "en"
                ? `Showing ${(page - 1) * NEWS_PAGE_SIZE + 1}-${Math.min(page * NEWS_PAGE_SIZE, filteredPosts.length)} of ${filteredPosts.length}`
                : `Hiển thị ${(page - 1) * NEWS_PAGE_SIZE + 1}-${Math.min(page * NEWS_PAGE_SIZE, filteredPosts.length)} / ${filteredPosts.length}`}
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page === 1}
                onClick={() => setPageState((current) => Math.max(1, current - 1))}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border theme-border theme-panel text-sm font-semibold theme-text-strong transition disabled:cursor-not-allowed disabled:opacity-45"
                aria-label={locale === "en" ? "Previous page" : "Trang trước"}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              {visiblePages[0] > 1 ? (
                <>
                  <button
                    type="button"
                    onClick={() => setPageState(1)}
                    className="inline-flex h-10 min-w-10 items-center justify-center rounded-full border theme-border theme-panel px-3 text-sm font-semibold theme-text-strong transition hover:bg-[var(--panel-strong)]"
                  >
                    1
                  </button>
                  {visiblePages[0] > 2 ? <span className="px-1 text-sm theme-text-soft">…</span> : null}
                </>
              ) : null}

              {visiblePages.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setPageState(value)}
                  className={cn(
                    "inline-flex h-10 min-w-10 items-center justify-center rounded-full border px-3 text-sm font-semibold transition",
                    value === page
                      ? "border-sky-300/26 bg-[linear-gradient(135deg,#0a1d34,#1772d0)] text-white shadow-[0_16px_34px_rgba(23,114,208,0.18)]"
                      : "theme-border theme-panel theme-text-strong hover:bg-[var(--panel-strong)]",
                  )}
                >
                  {value}
                </button>
              ))}

              {visiblePages[visiblePages.length - 1] < pageCount ? (
                <>
                  {visiblePages[visiblePages.length - 1] < pageCount - 1 ? (
                    <span className="px-1 text-sm theme-text-soft">…</span>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setPageState(pageCount)}
                    className="inline-flex h-10 min-w-10 items-center justify-center rounded-full border theme-border theme-panel px-3 text-sm font-semibold theme-text-strong transition hover:bg-[var(--panel-strong)]"
                  >
                    {pageCount}
                  </button>
                </>
              ) : null}

              <button
                type="button"
                disabled={page === pageCount}
                onClick={() => setPageState((current) => Math.min(pageCount, current + 1))}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border theme-border theme-panel text-sm font-semibold theme-text-strong transition disabled:cursor-not-allowed disabled:opacity-45"
                aria-label={locale === "en" ? "Next page" : "Trang sau"}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
