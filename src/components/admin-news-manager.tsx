"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Filter,
  ImagePlus,
  Newspaper,
  Pencil,
  Plus,
  Search,
  Text,
  Trash2,
  X,
} from "lucide-react";

import {
  ADMIN_LIST_TABLE_PAGE_SIZE,
  AdminTablePagination,
  useAdminTablePagination,
} from "@/components/admin-table-pagination";
import { ADMIN_TITLE_ID, useAdminTitleScroll } from "@/components/admin-title-scroll";
import { useSiteState } from "@/components/providers/site-state-provider";
import { SectionHeading, StatusPill, Surface } from "@/components/site-ui";
import { getNewsImageValidationError } from "@/lib/news-images";
import { pickText } from "@/lib/site";
import type { Locale, LocalizedText, NewsContentBlock, NewsPost } from "@/types/site";

const fieldClassName =
  "theme-placeholder w-full rounded-2xl border theme-border theme-panel px-4 py-3 text-sm theme-text-strong outline-none";

function cloneNewsPost(post: NewsPost): NewsPost {
  return JSON.parse(JSON.stringify(post)) as NewsPost;
}

function createDraftNewsPost(post: NewsPost): NewsPost {
  const nextPost = cloneNewsPost(post);
  nextPost.content = nextPost.content.filter(
    (block) => !(block.type === "image" && block.origin === "cover"),
  );
  return nextPost;
}

function createParagraphBlock(): NewsContentBlock {
  return {
    type: "paragraph",
    body: { en: "", vi: "" },
  };
}

function createImageBlock(): NewsContentBlock {
  return {
    type: "image",
    src: "",
    alt: { en: "", vi: "" },
    caption: { en: "", vi: "" },
    emphasis: "standard",
    origin: "body",
  };
}

function createEmptyNewsPost(): NewsPost {
  return {
    slug: "",
    category: { en: "Updates", vi: "Cập nhật" },
    title: { en: "", vi: "" },
    excerpt: { en: "", vi: "" },
    author: "Organizer desk",
    publishedAt: new Date().toISOString().slice(0, 10),
    readTime: "3 min",
    coverLabel: { en: "Latest update", vi: "Cập nhật mới" },
    coverImageSrc: "/theme-feature-1.jpg",
    coverImageAlt: { en: "", vi: "" },
    highlights: [{ en: "", vi: "" }],
    content: [createParagraphBlock()],
    tags: [],
  };
}

function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function matchesFilter(value: string, filterValue: string) {
  if (!filterValue.trim()) {
    return true;
  }

  return value.toLowerCase().includes(filterValue.trim().toLowerCase());
}

function syncCoverImageBlock(post: NewsPost): NewsPost {
  const manualBlocks = post.content.filter(
    (block) => !(block.type === "image" && block.origin === "cover"),
  );

  const coverBlock: NewsContentBlock = {
    type: "image",
    src: post.coverImageSrc,
    alt: post.coverImageAlt,
    caption: post.coverLabel,
    emphasis: "feature",
    origin: "cover",
  };

  const firstParagraphIndex = manualBlocks.findIndex((block) => block.type === "paragraph");

  if (firstParagraphIndex === -1) {
    return {
      ...post,
      content: [coverBlock, ...manualBlocks],
    };
  }

  return {
    ...post,
    content: [
      ...manualBlocks.slice(0, firstParagraphIndex + 1),
      coverBlock,
      ...manualBlocks.slice(firstParagraphIndex + 1),
    ],
  };
}

function moveItem<T>(items: T[], index: number, direction: -1 | 1) {
  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= items.length) {
    return items;
  }

  const nextItems = [...items];
  const [current] = nextItems.splice(index, 1);
  nextItems.splice(targetIndex, 0, current);
  return nextItems;
}

function IconToolButton({
  label,
  onClick,
  children,
  disabled = false,
  tone = "default",
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
  disabled?: boolean;
  tone?: "default" | "danger";
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={`group relative inline-flex h-10 w-10 items-center justify-center rounded-full border ${
        tone === "danger" ? "theme-button-danger" : "theme-button-secondary"
      }`}
    >
      {children}
      <span className="pointer-events-none absolute -top-11 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-full border border-slate-900/8 bg-white px-3 py-1.5 text-[0.68rem] font-semibold tracking-[0.14em] text-slate-600 shadow-[0_12px_28px_rgba(15,23,42,0.12)] group-hover:flex dark:border-white/10 dark:bg-[rgba(7,18,35,0.96)] dark:text-white/80">
        {label}
      </span>
    </button>
  );
}

function IconToolLink({
  label,
  href,
  children,
  tone = "default",
}: {
  label: string;
  href: string;
  children: ReactNode;
  tone?: "default" | "danger";
}) {
  return (
    <Link
      href={href}
      title={label}
      aria-label={label}
      className={`group relative inline-flex h-10 w-10 items-center justify-center rounded-full border ${
        tone === "danger" ? "theme-button-danger" : "theme-button-secondary"
      }`}
    >
      {children}
      <span className="pointer-events-none absolute -top-11 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-full border border-slate-900/8 bg-white px-3 py-1.5 text-[0.68rem] font-semibold tracking-[0.14em] text-slate-600 shadow-[0_12px_28px_rgba(15,23,42,0.12)] group-hover:flex dark:border-white/10 dark:bg-[rgba(7,18,35,0.96)] dark:text-white/80">
        {label}
      </span>
    </Link>
  );
}

function LocalizedFieldEditor({
  label,
  value,
  rows = 3,
  onChange,
}: {
  label: string;
  value: LocalizedText;
  rows?: number;
  onChange: (locale: Locale, nextValue: string) => void;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {(["en", "vi"] as Locale[]).map((locale) => (
        <label key={locale} className="space-y-2">
          <span className="text-sm theme-text-muted">
            {`${label} (${locale.toUpperCase()})`}
          </span>
          <textarea
            rows={rows}
            value={value[locale]}
            onChange={(event) => onChange(locale, event.target.value)}
            className={fieldClassName}
          />
        </label>
      ))}
    </div>
  );
}

function NewsNotFound({ title, description }: { title: string; description: string }) {
  return (
    <Surface className="px-6 py-6 md:px-8 md:py-8">
      <SectionHeading
        id={ADMIN_TITLE_ID}
        className="scroll-mt-32"
        eyebrow="Admin / News"
        title={title}
        description={description}
      />
      <Link href="/admin/news" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold theme-accent">
        <ArrowLeft className="h-4 w-4" />
        Back to news
      </Link>
    </Surface>
  );
}

function NewsDeleteConfirmDialog({
  locale,
  post,
  onCancel,
  onConfirm,
}: {
  locale: Locale;
  post: NewsPost;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const articleTitle = pickText(locale, post.title) || post.slug;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCancel();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center px-4 py-6">
      <button
        type="button"
        aria-label={locale === "en" ? "Close delete confirmation" : "Đóng xác nhận xóa"}
        className="absolute inset-0 cursor-default bg-slate-950/55 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="news-delete-confirm-title"
        className="relative w-full max-w-xl overflow-hidden rounded-[2rem] border border-white/20 bg-[var(--panel)] shadow-[0_32px_90px_rgba(15,23,42,0.34)]"
      >
        <div className="border-b theme-border bg-[linear-gradient(135deg,rgba(239,68,68,0.15),rgba(14,165,233,0.1))] px-6 py-5">
          <div className="flex items-start gap-4">
            <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-500/12 text-red-500 ring-1 ring-red-500/20">
              <AlertTriangle className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p
                id="news-delete-confirm-title"
                className="theme-heading text-xl font-semibold theme-text-strong"
              >
                {locale === "en" ? "Delete news article?" : "Xóa bài viết tin tức?"}
              </p>
              <p className="mt-2 text-sm leading-6 theme-text-muted">
                {locale === "en"
                  ? "This removes the article from the public newsroom. Review the article details before confirming."
                  : "Thao tác này sẽ xóa bài viết khỏi newsroom công khai. Hãy kiểm tra thông tin bài viết trước khi xác nhận."}
              </p>
            </div>
            <button
              type="button"
              aria-label={locale === "en" ? "Close" : "Đóng"}
              onClick={onCancel}
              className="ml-auto inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border theme-border bg-white/70 theme-text-soft transition hover:-translate-y-0.5 hover:bg-white dark:bg-white/10 dark:hover:bg-white/15"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div className="flex gap-4 rounded-[1.4rem] border theme-border theme-panel-subtle p-4">
            <div className="h-20 w-28 shrink-0 overflow-hidden rounded-[1rem] border theme-border bg-[var(--panel-strong)]">
              <img
                src={post.coverImageSrc}
                alt={pickText(locale, post.coverImageAlt) || articleTitle}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] theme-eyebrow">
                {locale === "en" ? "Article" : "Bài viết"}
              </p>
              <p className="mt-1 line-clamp-2 font-semibold theme-text-strong">{articleTitle}</p>
              <p className="mt-2 break-all text-xs theme-text-soft">{post.slug}</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-[1.2rem] border theme-border theme-panel-subtle p-4">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] theme-eyebrow">
                {locale === "en" ? "Published" : "Ngày đăng"}
              </p>
              <p className="mt-1 text-sm font-semibold theme-text-strong">{post.publishedAt}</p>
            </div>
            <div className="rounded-[1.2rem] border theme-border theme-panel-subtle p-4">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] theme-eyebrow">
                {locale === "en" ? "Author" : "Tác giả"}
              </p>
              <p className="mt-1 truncate text-sm font-semibold theme-text-strong">{post.author || "--"}</p>
            </div>
            <div className="rounded-[1.2rem] border theme-border theme-panel-subtle p-4">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] theme-eyebrow">
                {locale === "en" ? "Category" : "Danh mục"}
              </p>
              <p className="mt-1 truncate text-sm font-semibold theme-text-strong">
                {pickText(locale, post.category) || "--"}
              </p>
            </div>
          </div>

          <div className="rounded-[1.2rem] border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm leading-6 text-red-600 dark:text-red-100">
            {locale === "en"
              ? "Deleting this article cannot be undone from the admin interface."
              : "Sau khi xóa, bạn không thể khôi phục bài viết này từ giao diện admin."}
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t theme-border bg-[var(--panel-strong)] px-6 py-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="theme-button-secondary rounded-full border px-5 py-3 text-sm font-semibold"
          >
            {locale === "en" ? "Cancel" : "Hủy"}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="theme-button-danger inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
          >
            <Trash2 className="h-4 w-4" />
            {locale === "en" ? "Delete article" : "Xóa bài viết"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function AdminNewsList() {
  const { locale, newsPosts, deleteNewsPostByAdmin } = useSiteState();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [authorFilter, setAuthorFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("all");
  const [deleteCandidate, setDeleteCandidate] = useState<NewsPost | null>(null);
  useAdminTitleScroll();

  const sortedPosts = useMemo(
    () => [...newsPosts].sort((left, right) => right.publishedAt.localeCompare(left.publishedAt)),
    [newsPosts],
  );
  const categoryOptions = useMemo(
    () =>
      [...new Set(newsPosts.map((post) => pickText(locale, post.category)).filter(Boolean))]
        .sort((left, right) => left.localeCompare(right)),
    [locale, newsPosts],
  );
  const authorOptions = useMemo(
    () => [...new Set(newsPosts.map((post) => post.author).filter(Boolean))].sort((left, right) => left.localeCompare(right)),
    [newsPosts],
  );
  const tagOptions = useMemo(
    () => [...new Set(newsPosts.flatMap((post) => post.tags))].sort((left, right) => left.localeCompare(right)),
    [newsPosts],
  );
  const filteredPosts = useMemo(
    () =>
      sortedPosts.filter((post) => {
        const category = pickText(locale, post.category);
        const searchSource = [
          pickText(locale, post.title),
          pickText(locale, post.excerpt),
          post.slug,
          post.author,
          category,
          post.publishedAt,
          post.readTime,
          ...post.tags,
        ].join(" ");

        if (!matchesFilter(searchSource, search)) {
          return false;
        }

        if (categoryFilter !== "all" && category !== categoryFilter) {
          return false;
        }

        if (authorFilter !== "all" && post.author !== authorFilter) {
          return false;
        }

        if (tagFilter !== "all" && !post.tags.includes(tagFilter)) {
          return false;
        }

        return true;
      }),
    [authorFilter, categoryFilter, locale, search, sortedPosts, tagFilter],
  );
  const {
    page,
    setPage,
    pageCount,
    startIndex,
    paginatedRows,
  } = useAdminTablePagination(filteredPosts, ADMIN_LIST_TABLE_PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [authorFilter, categoryFilter, locale, search, setPage, tagFilter]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <SectionHeading
          id={ADMIN_TITLE_ID}
          className="scroll-mt-32"
          eyebrow={locale === "en" ? "Admin / News" : "Admin / Tin tức"}
          title={locale === "en" ? "Newsroom articles" : "Bài viết newsroom"}
        />
        <Link
          href="/admin/news/new"
          className="theme-button-primary inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
        >
          <Plus className="h-4 w-4" />
          {locale === "en" ? "Add news article" : "Thêm bài viết"}
        </Link>
      </div>

      <Surface className="px-5 py-5 md:px-6">
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1.4fr)_220px_220px_220px]">
          <label className="space-y-2">
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] theme-eyebrow">
              <Search className="h-3.5 w-3.5" />
              {locale === "en" ? "Search" : "Tìm kiếm"}
            </span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 theme-text-soft" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={locale === "en" ? "Search by title, slug, tag, author..." : "Tìm theo tiêu đề, slug, tag, tác giả..."}
                className="theme-field h-12 w-full rounded-[1rem] border pl-10 pr-4 text-sm outline-none"
              />
            </div>
          </label>

          <label className="space-y-2">
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] theme-eyebrow">
              <Filter className="h-3.5 w-3.5" />
              {locale === "en" ? "Category" : "Danh mục"}
            </span>
            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className="theme-admin-select theme-field h-12 w-full rounded-[1rem] border px-4 text-sm outline-none"
            >
              <option value="all">{locale === "en" ? "All categories" : "Tất cả danh mục"}</option>
              {categoryOptions.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] theme-eyebrow">
              <Filter className="h-3.5 w-3.5" />
              {locale === "en" ? "Author" : "Tác giả"}
            </span>
            <select
              value={authorFilter}
              onChange={(event) => setAuthorFilter(event.target.value)}
              className="theme-admin-select theme-field h-12 w-full rounded-[1rem] border px-4 text-sm outline-none"
            >
              <option value="all">{locale === "en" ? "All authors" : "Tất cả tác giả"}</option>
              {authorOptions.map((author) => (
                <option key={author} value={author}>
                  {author}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] theme-eyebrow">
              <Filter className="h-3.5 w-3.5" />
              Tag
            </span>
            <select
              value={tagFilter}
              onChange={(event) => setTagFilter(event.target.value)}
              className="theme-admin-select theme-field h-12 w-full rounded-[1rem] border px-4 text-sm outline-none"
            >
              <option value="all">{locale === "en" ? "All tags" : "Tất cả tag"}</option>
              {tagOptions.map((tag) => (
                <option key={tag} value={tag}>
                  #{tag}
                </option>
              ))}
            </select>
          </label>
        </div>
      </Surface>

      <Surface className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[1180px] text-left text-sm">
            <thead className="border-b theme-border bg-[var(--panel-strong)] theme-text-soft">
              <tr>
                {[
                  "#",
                  locale === "en" ? "Cover" : "Ảnh",
                  locale === "en" ? "Article" : "Bài viết",
                  locale === "en" ? "Category" : "Danh mục",
                  "Tags",
                  locale === "en" ? "Author" : "Tác giả",
                  locale === "en" ? "Published" : "Ngày đăng",
                  locale === "en" ? "Actions" : "Thao tác",
                ].map((label) => (
                  <th key={label} className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em]">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-sm theme-text-muted">
                    {locale === "en" ? "No matching news articles." : "Không có bài viết phù hợp."}
                  </td>
                </tr>
              ) : (
                paginatedRows.map((post, index) => (
                  <tr key={post.slug} className="border-b theme-border last:border-b-0">
                    <td className="px-4 py-4 text-xs font-semibold theme-text-soft">{startIndex + index + 1}</td>
                    <td className="px-4 py-4">
                      <div className="h-16 w-24 overflow-hidden rounded-[1rem] border theme-border bg-[var(--panel-strong)]">
                        <img
                          src={post.coverImageSrc}
                          alt={pickText(locale, post.coverImageAlt) || pickText(locale, post.title)}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="max-w-[26rem]">
                        <Link href={`/admin/news/${post.slug}`} className="font-semibold theme-accent">
                          {pickText(locale, post.title)}
                        </Link>
                        <p className="mt-1 text-xs theme-text-soft">{post.slug}</p>
                        <p className="mt-2 line-clamp-2 text-xs leading-5 theme-text-muted">
                          {pickText(locale, post.excerpt)}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <StatusPill>{pickText(locale, post.category)}</StatusPill>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex max-w-[15rem] flex-wrap gap-2">
                        {post.tags.length ? (
                          post.tags.map((tag) => (
                            <span key={tag} className="rounded-full border theme-border px-2.5 py-1 text-xs theme-text-soft">
                              #{tag}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs theme-text-soft">--</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 theme-text-body">{post.author}</td>
                    <td className="px-4 py-4">
                      <p className="theme-text-body">{post.publishedAt}</p>
                      <p className="mt-1 text-xs theme-text-soft">{post.readTime}</p>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <IconToolLink
                          href={`/admin/news/${post.slug}`}
                          label={locale === "en" ? "Edit article" : "Chỉnh sửa bài viết"}
                        >
                          <Pencil className="h-4 w-4" />
                        </IconToolLink>
                        <IconToolButton
                          label={locale === "en" ? "Delete article" : "Xóa bài viết"}
                          tone="danger"
                          onClick={() => setDeleteCandidate(post)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </IconToolButton>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <AdminTablePagination
          locale={locale}
          page={page}
          pageCount={pageCount}
          pageSize={ADMIN_LIST_TABLE_PAGE_SIZE}
          totalRows={filteredPosts.length}
          onPageChange={setPage}
        />
      </Surface>

      {deleteCandidate ? (
        <NewsDeleteConfirmDialog
          locale={locale}
          post={deleteCandidate}
          onCancel={() => setDeleteCandidate(null)}
          onConfirm={() => {
            deleteNewsPostByAdmin(deleteCandidate.slug);
            setDeleteCandidate(null);
          }}
        />
      ) : null}
    </div>
  );
}

type UploadResult =
  | { ok: true; imageUrl: string }
  | { ok: false; message: string };

async function uploadNewsImageFile(file: File, locale: Locale): Promise<UploadResult> {
  const validationError = getNewsImageValidationError(file);

  if (validationError === "type") {
    return {
      ok: false,
      message:
        locale === "en"
          ? "Only JPG, PNG, and WEBP images are allowed."
          : "Chỉ chấp nhận ảnh JPG, PNG và WEBP.",
    };
  }

  if (validationError === "size") {
    return {
      ok: false,
      message:
        locale === "en"
          ? "The uploaded image must be 2MB or smaller."
          : "Ảnh tải lên phải có dung lượng không quá 2MB.",
    };
  }

  if (validationError === "missing") {
    return {
      ok: false,
      message:
        locale === "en"
          ? "Choose an image file before uploading."
          : "Hãy chọn một tệp hình ảnh trước khi tải lên.",
    };
  }

  const formData = new FormData();
  formData.set("imageFile", file);

  try {
    const response = await fetch("/api/admin/news/cover-image", {
      method: "POST",
      body: formData,
      credentials: "same-origin",
    });

    if (!response.ok) {
      const error = await response.json().catch(() => null);
      return {
        ok: false,
        message:
          error?.error ||
          (locale === "en"
            ? "Could not upload the image right now."
            : "Hiện không thể tải hình ảnh lên."),
      };
    }

    const payload = (await response.json()) as { imageUrl: string };
    return { ok: true, imageUrl: payload.imageUrl };
  } catch {
    return {
      ok: false,
      message:
        locale === "en"
          ? "Could not upload the image right now."
          : "Hiện không thể tải hình ảnh lên.",
    };
  }
}

export function AdminNewsEditor({ slug }: { slug: string }) {
  const { hasHydrated } = useSiteState();
  useAdminTitleScroll();

  if (!hasHydrated && slug !== "new") {
    return (
      <Surface className="px-6 py-6 md:px-8 md:py-8">
        <SectionHeading
          id={ADMIN_TITLE_ID}
          className="scroll-mt-32"
          eyebrow="Admin / News"
          title="Loading article..."
          description="Waiting for the local admin dataset to hydrate before opening the editor."
        />
      </Surface>
    );
  }

  return <AdminNewsEditorInner slug={slug} />;
}

function AdminNewsEditorInner({ slug }: { slug: string }) {
  const router = useRouter();
  const {
    locale,
    newsPosts,
    createNewsPostByAdmin,
    updateNewsPostByAdmin,
    deleteNewsPostByAdmin,
  } = useSiteState();
  const isCreateMode = slug === "new";
  const sourcePost = isCreateMode ? createEmptyNewsPost() : newsPosts.find((post) => post.slug === slug);
  const sourceDraftPost = sourcePost ? createDraftNewsPost(sourcePost) : undefined;
  const [draft, setDraft] = useState<NewsPost | null>(() =>
    sourceDraftPost ? cloneNewsPost(sourceDraftPost) : null,
  );
  const [editorMessage, setEditorMessage] = useState("");
  const [coverUploadMessage, setCoverUploadMessage] = useState("");
  const [contentUploadFeedback, setContentUploadFeedback] = useState<{
    index: number;
    message: string;
    tone: "info" | "error";
  } | null>(null);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [uploadingContentIndex, setUploadingContentIndex] = useState<number | null>(null);
  const contentBlockRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const pendingContentScrollRef = useRef<number | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const generatedSlug = useMemo(() => {
    if (!draft) {
      return "";
    }

    const sourceLabel = draft.title.vi.trim() || draft.title.en.trim() || draft.slug.trim();
    return sourceLabel ? slugify(sourceLabel) : "";
  }, [draft]);

  useEffect(() => {
    const pendingIndex = pendingContentScrollRef.current;
    if (pendingIndex == null) {
      return;
    }

    const node = contentBlockRefs.current[pendingIndex];
    pendingContentScrollRef.current = null;

    if (!node) {
      return;
    }

    window.requestAnimationFrame(() => {
      node.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }, [draft?.content.length]);

  const isDirty = useMemo(() => {
    if (isCreateMode) {
      return JSON.stringify(draft) !== JSON.stringify(createEmptyNewsPost());
    }

    if (!sourceDraftPost || !draft) {
      return false;
    }

    return JSON.stringify(draft) !== JSON.stringify(sourceDraftPost);
  }, [draft, isCreateMode, sourceDraftPost]);

  if (!draft) {
    return (
      <NewsNotFound
        title={locale === "en" ? "Article not found." : "Không tìm thấy bài viết."}
        description={
          locale === "en"
            ? "This article may have been deleted from the current backend dataset."
            : "Bài viết này có thể đã bị xóa khỏi dữ liệu backend hiện tại."
        }
      />
    );
  }

  const uploadCoverImage = async (file: File) => {
    setIsUploadingCover(true);
    setCoverUploadMessage("");

    const result = await uploadNewsImageFile(file, locale);
    setIsUploadingCover(false);

    if (!result.ok) {
      setCoverUploadMessage(result.message);
      return;
    }

    setDraft((current) =>
      current
        ? {
            ...current,
            coverImageSrc: result.imageUrl,
          }
        : current,
    );
    setCoverUploadMessage(
      locale === "en"
        ? "Cover image uploaded successfully."
        : "Ảnh bìa đã được tải lên thành công.",
    );
  };

  const uploadContentImage = async (index: number, file: File) => {
    setUploadingContentIndex(index);
    setContentUploadFeedback(null);

    const result = await uploadNewsImageFile(file, locale);
    setUploadingContentIndex((current) => (current === index ? null : current));

    if (!result.ok) {
      setContentUploadFeedback({ index, message: result.message, tone: "error" });
      return;
    }

    setDraft((current) =>
      current
        ? {
            ...current,
            content: current.content.map((item, itemIndex) =>
              itemIndex === index && item.type === "image"
                ? { ...item, src: result.imageUrl }
                : item,
            ),
          }
        : current,
    );
    setContentUploadFeedback({
      index,
      message:
        locale === "en"
          ? "Image block uploaded successfully."
          : "Ảnh trong block đã được tải lên thành công.",
      tone: "info",
    });
  };

  const appendContentBlock = (type: "paragraph" | "image") => {
    setDraft((current) => {
      if (!current) {
        return current;
      }

      pendingContentScrollRef.current = current.content.length;
      return {
        ...current,
        content: [
          ...current.content,
          type === "paragraph" ? createParagraphBlock() : createImageBlock(),
        ],
      };
    });
  };

  const saveDraft = () => {
    setEditorMessage("");

    const nextSlug = generatedSlug || slugify(draft.slug || `news-${Date.now()}`);
    const nextPostBase: NewsPost = {
      ...draft,
      slug: nextSlug,
      publishedAt: draft.publishedAt || new Date().toISOString().slice(0, 10),
      readTime: draft.readTime || "3 min",
      tags: draft.tags.filter(Boolean),
      highlights: draft.highlights.filter((item) => item.en.trim() || item.vi.trim()),
      content: draft.content.filter((block) =>
        block.type === "paragraph"
          ? block.body.en.trim() || block.body.vi.trim()
          : block.src.trim() ||
              block.alt.en.trim() ||
              block.alt.vi.trim() ||
              block.caption.en.trim() ||
              block.caption.vi.trim(),
      ),
    };

    if (!nextPostBase.coverLabel.en.trim() && !nextPostBase.coverLabel.vi.trim()) {
      setEditorMessage(
        locale === "en"
          ? "Cover caption is required. It is also used as the caption for the cover image block inside the article."
          : "Cần nhập chú thích ảnh bìa. Nội dung này cũng được dùng làm chú thích cho ảnh bìa trong thân bài viết.",
      );
      return;
    }

    if (nextPostBase.highlights.length === 0) {
      nextPostBase.highlights = [{ en: "", vi: "" }];
    }

    if (nextPostBase.content.length === 0) {
      nextPostBase.content = [createParagraphBlock()];
    }

    const nextPost = syncCoverImageBlock(nextPostBase);

    const hasConflictingSlug = newsPosts.some((post) =>
      isCreateMode ? post.slug === nextSlug : post.slug === nextSlug && post.slug !== slug,
    );

    if (hasConflictingSlug) {
      setEditorMessage(
        locale === "en"
          ? "That article slug already exists. Use a different slug."
          : "Slug bài viết này đã tồn tại. Hãy dùng một slug khác.",
      );
      return;
    }

    if (isCreateMode) {
      createNewsPostByAdmin(nextPost);
      router.push(`/admin/news/${nextSlug}`);
      return;
    }

    updateNewsPostByAdmin(slug, nextPost);
    if (nextSlug !== slug) {
      router.replace(`/admin/news/${nextSlug}`);
    }
  };

  const deleteCurrentPost = () => {
    if (isCreateMode) {
      router.push("/admin/news");
      return;
    }

    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteCurrentPost = () => {
    deleteNewsPostByAdmin(slug);
    setIsDeleteDialogOpen(false);
    router.push("/admin/news");
  };

  return (
    <div className="space-y-8">
      <Link href="/admin/news" className="inline-flex items-center gap-2 text-sm font-semibold theme-accent">
        <ArrowLeft className="h-4 w-4" />
        {locale === "en" ? "Back to news" : "Quay lại danh sách tin"}
      </Link>

      <SectionHeading
        id={ADMIN_TITLE_ID}
        className="scroll-mt-32"
        eyebrow={locale === "en" ? "Admin / News / Editor" : "Admin / Tin tức / Trình sửa"}
        title={
          isCreateMode
            ? locale === "en"
              ? "Create a new news article"
              : "Tạo bài viết mới"
            : pickText(locale, draft.title) || (locale === "en" ? "Edit article" : "Chỉnh sửa bài viết")
        }
        description={
          locale === "en"
            ? "This editor controls the public newsroom list and the article detail page."
            : "Trình sửa này điều khiển danh sách newsroom công khai và trang chi tiết bài viết."
        }
      />

      <div className="sticky top-[5.75rem] z-50">
        <div className="rounded-[1.8rem] border theme-border-strong theme-panel-strong px-5 py-4 shadow-[0_18px_44px_rgba(15,23,42,0.1)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.26em] text-sky-700 dark:text-sky-200/80">
                {locale === "en" ? "Article actions" : "Tác vụ bài viết"}
              </p>
              <p className="mt-2 text-sm leading-7 theme-text-soft">
                {editorMessage
                  ? editorMessage
                  : isDirty
                    ? locale === "en"
                      ? "You have unsaved changes. Save before leaving this editor."
                      : "Bạn đang có thay đổi chưa lưu. Hãy lưu trước khi rời trình chỉnh sửa."
                    : locale === "en"
                      ? "The article is in sync with the current newsroom dataset."
                      : "Bài viết hiện đang đồng bộ với dữ liệu newsroom hiện tại."}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 lg:justify-end">
              <button
                type="button"
                disabled={!isDirty}
                onClick={saveDraft}
                className="theme-button-primary inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Newspaper className="h-4 w-4" />
                {locale === "en" ? "Save article" : "Lưu bài viết"}
              </button>
              <button
                type="button"
                onClick={deleteCurrentPost}
                className="theme-button-danger inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
              >
                <Trash2 className="h-4 w-4" />
                {isCreateMode
                  ? locale === "en"
                    ? "Cancel"
                    : "Hủy"
                  : locale === "en"
                    ? "Delete"
                    : "Xóa"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <section className="space-y-6">
          <Surface className="px-6 py-6 md:px-8 md:py-8">
            <div className="space-y-5">
              <LocalizedFieldEditor
                label="Title"
                rows={3}
                value={draft.title}
                onChange={(language, value) =>
                  setDraft((current) =>
                    current ? { ...current, title: { ...current.title, [language]: value } } : current,
                  )
                }
              />
              <LocalizedFieldEditor
                label="Category"
                rows={2}
                value={draft.category}
                onChange={(language, value) =>
                  setDraft((current) =>
                    current ? { ...current, category: { ...current.category, [language]: value } } : current,
                  )
                }
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm theme-text-muted">
                  {locale === "en" ? "Slug (auto generated)" : "Slug (tự tạo)"}
                </span>
                <input
                  value={
                    generatedSlug ||
                    (locale === "en" ? "Will be generated from the title" : "Sẽ được tạo từ tiêu đề")
                  }
                  readOnly
                  className={`${fieldClassName} cursor-not-allowed opacity-90`}
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm theme-text-muted">Tags</span>
                <input
                  value={draft.tags.join(", ")}
                  onChange={(event) =>
                    setDraft((current) =>
                      current
                        ? {
                            ...current,
                            tags: event.target.value
                              .split(",")
                              .map((item) => item.trim())
                              .filter(Boolean),
                          }
                        : current,
                    )
                  }
                  placeholder="launch, fintech, updates"
                  className={fieldClassName}
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm theme-text-muted">
                  {locale === "en" ? "Author" : "Tác giả"}
                </span>
                <input
                  value={draft.author}
                  onChange={(event) =>
                    setDraft((current) => (current ? { ...current, author: event.target.value } : current))
                  }
                  className={fieldClassName}
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm theme-text-muted">
                  {locale === "en" ? "Published date" : "Ngày đăng"}
                </span>
                <input
                  type="date"
                  value={draft.publishedAt}
                  onChange={(event) =>
                    setDraft((current) =>
                      current ? { ...current, publishedAt: event.target.value } : current,
                    )
                  }
                  className={fieldClassName}
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm theme-text-muted">
                  {locale === "en" ? "Read time" : "Thời gian đọc"}
                </span>
                <input
                  value={draft.readTime}
                  onChange={(event) =>
                    setDraft((current) =>
                      current ? { ...current, readTime: event.target.value } : current,
                    )
                  }
                  className={fieldClassName}
                />
              </label>
              <label className="space-y-2 md:col-span-2">
                <span className="text-sm theme-text-muted">
                  {locale === "en" ? "Cover image" : "Ảnh bìa"}
                </span>
                <div className="rounded-[1.8rem] border theme-border theme-panel px-4 py-4">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold theme-text-strong">
                        {locale === "en" ? "Upload the cover image" : "Tải ảnh bìa lên"}
                      </p>
                      <p className="mt-2 text-sm leading-7 theme-text-soft">
                        {locale === "en"
                          ? "JPG, PNG, or WEBP only. Maximum size: 2MB."
                          : "Chỉ chấp nhận JPG, PNG hoặc WEBP. Dung lượng tối đa: 2MB."}
                      </p>
                      <p className="mt-2 text-xs uppercase tracking-[0.18em] theme-text-faint">
                        {draft.coverImageSrc}
                      </p>
                    </div>
                    <label className="theme-button-secondary inline-flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold">
                      <ImagePlus className="h-4 w-4" />
                      {isUploadingCover
                        ? locale === "en"
                          ? "Uploading..."
                          : "Đang tải..."
                        : locale === "en"
                          ? "Upload image"
                          : "Tải ảnh"}
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                        className="hidden"
                        disabled={isUploadingCover}
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (!file) {
                            return;
                          }

                          void uploadCoverImage(file);
                          event.target.value = "";
                        }}
                      />
                    </label>
                  </div>

                  <div className="mt-5 space-y-5">
                    <LocalizedFieldEditor
                      label={
                        locale === "en"
                          ? "Cover caption (required)"
                          : "Chú thích ảnh bìa (bắt buộc)"
                      }
                      rows={2}
                      value={draft.coverLabel}
                      onChange={(language, value) =>
                        setDraft((current) =>
                          current ? { ...current, coverLabel: { ...current.coverLabel, [language]: value } } : current,
                        )
                      }
                    />

                    <div className="overflow-hidden rounded-[1.4rem] border theme-border">
                      <img
                        src={draft.coverImageSrc}
                        alt={pickText(locale, draft.coverImageAlt) || "Cover preview"}
                        className="h-52 w-full object-cover"
                      />
                    </div>

                    {coverUploadMessage ? (
                      <div className="rounded-[1.3rem] border border-sky-300/20 bg-sky-300/10 px-4 py-3 text-sm leading-7 text-sky-700 dark:text-sky-100">
                        {coverUploadMessage}
                      </div>
                    ) : null}
                  </div>
                </div>
              </label>
            </div>

            <div className="mt-6 space-y-5">
              <LocalizedFieldEditor
                label="Cover image alt"
                rows={2}
                value={draft.coverImageAlt}
                onChange={(language, value) =>
                  setDraft((current) =>
                    current ? { ...current, coverImageAlt: { ...current.coverImageAlt, [language]: value } } : current,
                  )
                }
              />
              <LocalizedFieldEditor
                label="Excerpt"
                rows={4}
                value={draft.excerpt}
                onChange={(language, value) =>
                  setDraft((current) =>
                    current ? { ...current, excerpt: { ...current.excerpt, [language]: value } } : current,
                  )
                }
              />
            </div>
          </Surface>

          <Surface className="space-y-5 px-6 py-6 md:px-8 md:py-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-lg font-semibold theme-text-strong">
                  {locale === "en" ? "Highlights" : "Điểm nhấn"}
                </p>
                <p className="mt-2 text-sm theme-text-soft">
                  {locale === "en"
                    ? "Short supporting points shown in the article sidebar."
                    : "Các điểm nhấn ngắn được hiển thị ở cột bên của bài viết."}
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setDraft((current) =>
                    current
                      ? { ...current, highlights: [...current.highlights, { en: "", vi: "" }] }
                      : current,
                  )
                }
                className="theme-button-secondary rounded-full px-4 py-2.5 text-sm font-semibold"
              >
                {locale === "en" ? "Add highlight" : "Thêm điểm nhấn"}
              </button>
            </div>

            <div className="space-y-4">
              {draft.highlights.map((item, index) => (
                <Surface key={`highlight-${index}`} className="space-y-4 px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold theme-text-strong">
                      {locale === "en" ? `Highlight ${index + 1}` : `Điểm nhấn ${index + 1}`}
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        setDraft((current) =>
                          current && current.highlights.length > 1
                            ? {
                                ...current,
                                highlights: current.highlights.filter((_, itemIndex) => itemIndex !== index),
                              }
                            : current,
                        )
                      }
                      className="theme-button-danger rounded-full px-3 py-2 text-xs font-semibold"
                    >
                      {locale === "en" ? "Remove" : "Xóa"}
                    </button>
                  </div>
                  <LocalizedFieldEditor
                    label="Highlight"
                    rows={3}
                    value={item}
                    onChange={(language, value) =>
                      setDraft((current) =>
                        current
                          ? {
                              ...current,
                              highlights: current.highlights.map((highlight, highlightIndex) =>
                                highlightIndex === index
                                  ? { ...highlight, [language]: value }
                                  : highlight,
                              ),
                            }
                          : current,
                      )
                    }
                  />
                </Surface>
              ))}
            </div>
          </Surface>

          <Surface className="space-y-5 px-6 py-6 md:px-8 md:py-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-lg font-semibold theme-text-strong">
                  {locale === "en" ? "Article content" : "Nội dung bài viết"}
                </p>
                <p className="mt-2 text-sm theme-text-soft">
                  {locale === "en"
                    ? "Mix paragraph and image blocks to build the article body. The uploaded cover image is always inserted automatically after the first paragraph."
                    : "Kết hợp block đoạn văn và block hình để tạo thân bài viết. Ảnh bìa được chèn tự động sau đoạn văn đầu tiên."}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => appendContentBlock("paragraph")}
                  className="theme-button-secondary inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold"
                >
                  <Text className="h-4 w-4" />
                  {locale === "en" ? "Add paragraph" : "Thêm đoạn văn"}
                </button>
                <button
                  type="button"
                  onClick={() => appendContentBlock("image")}
                  className="theme-button-secondary inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold"
                >
                  <ImagePlus className="h-4 w-4" />
                  {locale === "en" ? "Add image" : "Thêm hình ảnh"}
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {draft.content.map((block, index) => (
                <div
                  key={`block-wrap-${index}`}
                  ref={(node) => {
                    contentBlockRefs.current[index] = node;
                  }}
                >
                  <Surface className="space-y-4 px-4 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <StatusPill>
                          {locale === "en" ? `Block ${index + 1}` : `Khối ${index + 1}`}
                        </StatusPill>
                        <select
                          value={block.type}
                          onChange={(event) =>
                            setDraft((current) =>
                              current
                                ? {
                                    ...current,
                                    content: current.content.map((item, itemIndex) =>
                                      itemIndex === index
                                        ? event.target.value === "paragraph"
                                          ? createParagraphBlock()
                                          : createImageBlock()
                                        : item,
                                    ),
                                  }
                                : current,
                            )
                          }
                          className="theme-admin-select rounded-full border px-3 py-2 text-sm font-semibold outline-none"
                        >
                          <option value="paragraph">paragraph</option>
                          <option value="image">image</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-2">
                        <IconToolButton
                          label={locale === "en" ? "Move block up" : "Đưa block lên"}
                          disabled={index === 0}
                          onClick={() =>
                            setDraft((current) =>
                              current ? { ...current, content: moveItem(current.content, index, -1) } : current,
                            )
                          }
                        >
                          <ArrowUp className="h-4 w-4" />
                        </IconToolButton>
                        <IconToolButton
                          label={locale === "en" ? "Move block down" : "Đưa block xuống"}
                          disabled={index === draft.content.length - 1}
                          onClick={() =>
                            setDraft((current) =>
                              current ? { ...current, content: moveItem(current.content, index, 1) } : current,
                            )
                          }
                        >
                          <ArrowDown className="h-4 w-4" />
                        </IconToolButton>
                        <IconToolButton
                          label={locale === "en" ? "Delete block" : "Xóa block"}
                          tone="danger"
                          disabled={draft.content.length === 1}
                          onClick={() =>
                            setDraft((current) =>
                              current && current.content.length > 1
                                ? {
                                    ...current,
                                    content: current.content.filter((_, itemIndex) => itemIndex !== index),
                                  }
                                : current,
                            )
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </IconToolButton>
                      </div>
                    </div>

                    {block.type === "paragraph" ? (
                      <LocalizedFieldEditor
                        label="Paragraph"
                        rows={6}
                        value={block.body}
                        onChange={(language, value) =>
                          setDraft((current) =>
                            current
                              ? {
                                  ...current,
                                  content: current.content.map((item, itemIndex) =>
                                    itemIndex === index && item.type === "paragraph"
                                      ? { ...item, body: { ...item.body, [language]: value } }
                                      : item,
                                  ),
                                }
                              : current,
                          )
                        }
                      />
                    ) : (
                      <div className="space-y-4">
                        <label className="space-y-2">
                          <span className="text-sm theme-text-muted">
                            {locale === "en" ? "Image upload" : "Tải hình ảnh"}
                          </span>
                          <div className="rounded-[1.5rem] border theme-border theme-panel px-4 py-4">
                            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                              <div className="min-w-0">
                                <p className="text-sm font-semibold theme-text-strong">
                                  {locale === "en"
                                    ? "Upload an image for this block"
                                    : "Tải hình cho block này"}
                                </p>
                                <p className="mt-2 text-sm leading-7 theme-text-soft">
                                  {locale === "en"
                                    ? "JPG, PNG, or WEBP only. Maximum size: 2MB."
                                    : "Chỉ chấp nhận JPG, PNG hoặc WEBP. Dung lượng tối đa: 2MB."}
                                </p>
                                {block.src ? (
                                  <p className="mt-2 text-xs uppercase tracking-[0.18em] theme-text-faint">
                                    {block.src}
                                  </p>
                                ) : null}
                              </div>
                              <label className="theme-button-secondary inline-flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold">
                                <ImagePlus className="h-4 w-4" />
                                {uploadingContentIndex === index
                                  ? locale === "en"
                                    ? "Uploading..."
                                    : "Đang tải..."
                                  : locale === "en"
                                    ? "Upload image"
                                    : "Tải ảnh"}
                                <input
                                  type="file"
                                  accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                                  className="hidden"
                                  disabled={uploadingContentIndex === index}
                                  onChange={(event) => {
                                    const file = event.target.files?.[0];
                                    if (!file) {
                                      return;
                                    }

                                    void uploadContentImage(index, file);
                                    event.target.value = "";
                                  }}
                                />
                              </label>
                            </div>

                            {block.src ? (
                              <div className="mt-4 overflow-hidden rounded-[1.3rem] border theme-border">
                                <img
                                  src={block.src}
                                  alt={pickText(locale, block.alt) || "Body image preview"}
                                  className="h-48 w-full object-cover"
                                />
                              </div>
                            ) : null}

                            {contentUploadFeedback?.index === index ? (
                              <div
                                className={`mt-4 rounded-[1.3rem] border px-4 py-3 text-sm leading-7 ${
                                  contentUploadFeedback.tone === "error"
                                    ? "border-rose-300/20 bg-rose-300/10 text-rose-700 dark:text-rose-100"
                                    : "border-sky-300/20 bg-sky-300/10 text-sky-700 dark:text-sky-100"
                                }`}
                              >
                                {contentUploadFeedback.message}
                              </div>
                            ) : null}
                          </div>
                        </label>
                        <label className="space-y-2">
                          <span className="text-sm theme-text-muted">
                            {locale === "en" ? "Image path" : "Đường dẫn hình ảnh"}
                          </span>
                          <input
                            value={block.src}
                            onChange={(event) =>
                              setDraft((current) =>
                                current
                                  ? {
                                      ...current,
                                      content: current.content.map((item, itemIndex) =>
                                        itemIndex === index && item.type === "image"
                                          ? { ...item, src: event.target.value }
                                          : item,
                                      ),
                                    }
                                  : current,
                              )
                            }
                            className={fieldClassName}
                          />
                        </label>
                        <label className="space-y-2">
                          <span className="text-sm theme-text-muted">Emphasis</span>
                          <select
                            value={block.emphasis ?? "standard"}
                            onChange={(event) =>
                              setDraft((current) =>
                                current
                                  ? {
                                      ...current,
                                      content: current.content.map((item, itemIndex) =>
                                        itemIndex === index && item.type === "image"
                                          ? {
                                              ...item,
                                              emphasis: event.target.value as "standard" | "feature",
                                            }
                                          : item,
                                      ),
                                    }
                                  : current,
                              )
                            }
                            className={`${fieldClassName} theme-admin-select`}
                          >
                            <option value="standard">standard</option>
                            <option value="feature">feature</option>
                          </select>
                        </label>
                        <LocalizedFieldEditor
                          label="Image alt"
                          rows={2}
                          value={block.alt}
                          onChange={(language, value) =>
                            setDraft((current) =>
                              current
                                ? {
                                    ...current,
                                    content: current.content.map((item, itemIndex) =>
                                      itemIndex === index && item.type === "image"
                                        ? { ...item, alt: { ...item.alt, [language]: value } }
                                        : item,
                                    ),
                                  }
                                : current,
                            )
                          }
                        />
                        <LocalizedFieldEditor
                          label="Caption"
                          rows={3}
                          value={block.caption}
                          onChange={(language, value) =>
                            setDraft((current) =>
                              current
                                ? {
                                    ...current,
                                    content: current.content.map((item, itemIndex) =>
                                      itemIndex === index && item.type === "image"
                                        ? { ...item, caption: { ...item.caption, [language]: value } }
                                        : item,
                                    ),
                                  }
                                : current,
                            )
                          }
                        />
                      </div>
                    )}
                  </Surface>
                </div>
              ))}
            </div>
          </Surface>
      </section>

      {isDeleteDialogOpen ? (
        <NewsDeleteConfirmDialog
          locale={locale}
          post={draft}
          onCancel={() => setIsDeleteDialogOpen(false)}
          onConfirm={confirmDeleteCurrentPost}
        />
      ) : null}
    </div>
  );
}
