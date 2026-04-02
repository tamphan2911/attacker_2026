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
  const [category, setCategory] = useState("all");
  const deferredQuery = useDeferredValue(query);

  const categories = useMemo(
    () => ["all", ...new Set(newsPosts.map((post) => post.category.en))],
    [newsPosts],
  );

  const filteredPosts = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLowerCase();

    return newsPosts.filter((post) => {
      const matchesCategory = category === "all" || post.category.en === category;
      const matchesQuery =
        normalizedQuery.length === 0 ||
        [post.title.en, post.title.vi, post.excerpt.en, post.excerpt.vi, ...post.tags]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);

      return matchesCategory && matchesQuery;
    });
  }, [category, deferredQuery, newsPosts]);

  const featuredPost = filteredPosts[0] ?? newsPosts[0];

  if (!featuredPost) {
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
    <div className="space-y-16">
      <section className="space-y-5">
        <p className="theme-eyebrow text-xs font-semibold uppercase tracking-[0.34em]">
          {pickText(locale, pageContent.news.featured.eyebrow)}
        </p>
        <Link href={`/news/${featuredPost.slug}`}>
          <Surface className="overflow-hidden">
            <div className="grid gap-0 lg:grid-cols-[360px_minmax(0,1fr)]">
              <div className="relative min-h-[300px] overflow-hidden">
                <Image
                  src={featuredPost.coverImageSrc}
                  alt={pickText(locale, featuredPost.coverImageAlt)}
                  fill
                  sizes="(min-width: 1024px) 360px, 100vw"
                  className="object-cover transition duration-700 hover:scale-[1.02]"
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,18,35,0.08),rgba(7,18,35,0.18),rgba(7,18,35,0.82))]" />
                <div className="absolute inset-x-0 bottom-0 flex flex-col justify-between px-6 py-6 text-white">
                  <StatusPill>{pickText(locale, featuredPost.category)}</StatusPill>
                  <div className="mt-20">
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/66">
                      {pickText(locale, featuredPost.coverLabel)}
                    </p>
                    <p className="mt-3 text-sm text-white/78">
                      {formatDateLabel(locale, featuredPost.publishedAt)} · {featuredPost.readTime}
                    </p>
                  </div>
                </div>
              </div>
              <div className="px-6 py-6 md:px-8 md:py-8">
                <p className="text-3xl font-semibold tracking-tight theme-text-strong">
                  {pickText(locale, featuredPost.title)}
                </p>
                <p className="mt-4 max-w-3xl text-base leading-8 theme-text-muted">
                  {pickText(locale, featuredPost.excerpt)}
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {featuredPost.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border theme-border-strong theme-panel px-3 py-1 text-xs theme-text-muted"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
                <div className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-cyan-200">
                  {locale === "en" ? "Read article" : "Doc bai viet"}
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            </div>
          </Surface>
        </Link>
      </section>

      <section className="space-y-8">
        <Surface className="theme-card-shadow-soft border-sky-300/16 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(244,249,255,0.96))] px-5 py-5 md:px-7 md:py-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-2xl">
              <p className="theme-eyebrow text-xs font-semibold uppercase tracking-[0.34em]">
                {pickText(locale, pageContent.news.latest.eyebrow)}
              </p>
              <p className="theme-heading mt-4 text-3xl font-semibold tracking-tight theme-text-strong md:text-[2.5rem]">
                {pickText(locale, pageContent.news.latest.title)}
              </p>
              <p className="mt-3 text-sm leading-7 theme-text-muted md:text-base">
                {pickText(locale, pageContent.news.latest.description)}
              </p>
            </div>

            <div className="theme-panel-strong w-full max-w-[560px] rounded-[1.75rem] border theme-border px-4 py-4 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl">
              <div className="flex flex-col gap-3">
                <label className="theme-panel flex items-center gap-3 rounded-full border theme-border px-3.5 py-2.5">
                  <Search className="h-4 w-4 theme-accent" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder={locale === "en" ? "Search title, excerpt, or tags" : "Tìm tiêu đề, mô tả hoặc tag"}
                    className="theme-placeholder w-full bg-transparent text-sm theme-text-strong outline-none"
                  />
                </label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((item) => {
                    const label =
                      item === "all"
                        ? locale === "en"
                          ? "All"
                          : "Tất cả"
                        : pickText(locale, newsPosts.find((post) => post.category.en === item)!.category);

                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setCategory(item)}
                        className={`rounded-full px-3 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.18em] transition ${
                          category === item
                            ? "bg-[linear-gradient(135deg,#0a1d34,#1772d0)] text-white shadow-[0_12px_24px_rgba(23,114,208,0.22)]"
                            : "theme-panel border theme-border theme-text-muted hover:border-sky-300/24 hover:text-[var(--text-strong)]"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </Surface>
        <div className="grid gap-4 xl:grid-cols-2">
          {filteredPosts.map((post) => (
            <Link key={post.slug} href={`/news/${post.slug}`}>
              <Surface className="group h-full overflow-hidden px-0 py-0 transition hover:-translate-y-0.5 hover:border-sky-300/22 hover:bg-[var(--panel-strong)]">
                <div className="grid gap-0 md:grid-cols-[220px_minmax(0,1fr)]">
                  <div className="relative min-h-[220px] overflow-hidden">
                    <Image
                      src={post.coverImageSrc}
                      alt={pickText(locale, post.coverImageAlt)}
                      fill
                      sizes="(min-width: 768px) 220px, 100vw"
                      className="object-cover transition duration-700 group-hover:scale-[1.04]"
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,18,35,0.04),rgba(7,18,35,0.18),rgba(7,18,35,0.42))]" />
                    <div className="absolute inset-x-0 bottom-0 px-4 py-4 text-white">
                      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-white/68">
                        {pickText(locale, post.coverLabel)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start justify-between gap-6 px-6 py-6">
                    <div>
                      <StatusPill>{pickText(locale, post.category)}</StatusPill>
                      <p className="mt-5 text-xl font-semibold theme-text-strong">{pickText(locale, post.title)}</p>
                      <p className="mt-3 text-sm theme-text-soft">
                        {formatDateLabel(locale, post.publishedAt)} · {post.author}
                      </p>
                      <p className="mt-4 text-sm leading-7 theme-text-muted">{pickText(locale, post.excerpt)}</p>
                    </div>
                    <ArrowRight className="mt-2 h-4 w-4 shrink-0 theme-text-faint transition group-hover:text-cyan-200" />
                  </div>
                </div>
              </Surface>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
