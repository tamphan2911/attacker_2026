"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import { useDeferredValue, useMemo, useState } from "react";

import { formatDateLabel, pickText } from "@/lib/site";
import { useSiteState } from "@/components/providers/site-state-provider";
import { SectionHeading, StatusPill, Surface } from "@/components/site-ui";

export function NewsPage() {
  const { locale, newsPosts, pageContent } = useSiteState();
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);

  const suggestedTerms = useMemo(() => {
    const terms: string[] = [];

    for (const post of newsPosts) {
      const term = pickText(locale, post.category);

      if (!terms.includes(term)) {
        terms.push(term);
      }

      if (terms.length === 4) {
        break;
      }
    }

    return terms;
  }, [locale, newsPosts]);

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
      <section className="space-y-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <p className="theme-eyebrow text-xs font-semibold uppercase tracking-[0.34em]">
            {pickText(locale, pageContent.news.latest.eyebrow)}
          </p>

          <label className="flex w-full max-w-[520px] items-center gap-3 rounded-full border theme-border bg-[rgba(255,255,255,0.78)] px-4 py-2.5 shadow-[0_14px_38px_rgba(15,23,42,0.06)] backdrop-blur-xl dark:bg-[rgba(10,15,26,0.52)]">
            <Search className="h-4 w-4 theme-accent" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={locale === "en" ? "Search title, excerpt, category, or tag" : "Tìm tiêu đề, mô tả, chuyên mục hoặc tag"}
              className="theme-placeholder w-full bg-transparent text-sm theme-text-strong outline-none"
            />
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] theme-text-soft">
            {locale === "en" ? "Suggested" : "Gợi ý"}
          </span>
          {suggestedTerms.map((term) => (
            <button
              key={term}
              type="button"
              onClick={() => setQuery(term)}
              className="rounded-full border theme-border bg-[rgba(255,255,255,0.72)] px-3 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.18em] theme-text-muted transition hover:border-sky-300/24 hover:text-[var(--text-strong)] dark:bg-[rgba(10,15,26,0.38)]"
            >
              {term}
            </button>
          ))}
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="rounded-full border theme-border bg-transparent px-3 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.18em] theme-text-faint transition hover:text-[var(--text-strong)]"
            >
              {locale === "en" ? "Clear" : "Xóa"}
            </button>
          ) : null}
        </div>
      </section>

      <section className="space-y-4">
        {filteredPosts.length === 0 ? (
          <Surface className="px-6 py-6 md:px-8 md:py-8">
            <p className="theme-heading text-2xl font-semibold theme-text-strong">
              {locale === "en" ? "No matching articles." : "Không có bài viết phù hợp."}
            </p>
            <p className="mt-3 text-sm leading-7 theme-text-muted">
              {locale === "en"
                ? "Try another keyword or clear the current suggestion."
                : "Hãy thử từ khóa khác hoặc xóa gợi ý hiện tại."}
            </p>
          </Surface>
        ) : (
          filteredPosts.map((post) => (
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
                    <div className="absolute inset-x-0 bottom-0 flex flex-col justify-between px-6 py-6 text-white">
                      <StatusPill>{pickText(locale, post.category)}</StatusPill>
                      <div className="mt-20">
                        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/66">
                          {pickText(locale, post.coverLabel)}
                        </p>
                        <p className="mt-3 text-sm text-white/78">
                          {formatDateLabel(locale, post.publishedAt)} · {post.readTime}
                        </p>
                      </div>
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
    </div>
  );
}
