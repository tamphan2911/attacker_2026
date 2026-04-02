"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  ImagePlus,
  Newspaper,
  Plus,
  Text,
  Trash2,
} from "lucide-react";

import { getNewsImageValidationError } from "@/lib/news-images";
import { pickText } from "@/lib/site";
import { ADMIN_TITLE_ID, useAdminTitleScroll } from "@/components/admin-title-scroll";
import { useSiteState } from "@/components/providers/site-state-provider";
import { SectionHeading, StatusPill, Surface } from "@/components/site-ui";
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
    src: "/theme-feature-1.jpg",
    alt: { en: "", vi: "" },
    caption: { en: "", vi: "" },
    emphasis: "standard",
    origin: "body",
  };
}

function createEmptyNewsPost(): NewsPost {
  return {
    slug: "",
    category: { en: "Updates", vi: "Cap nhat" },
    title: { en: "", vi: "" },
    excerpt: { en: "", vi: "" },
    author: "Organizer desk",
    publishedAt: new Date().toISOString().slice(0, 10),
    readTime: "3 min",
    coverLabel: { en: "Latest update", vi: "Cap nhat moi" },
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
      className={`group relative inline-flex h-10 w-10 items-center justify-center rounded-full border transition disabled:cursor-not-allowed disabled:opacity-45 ${
        tone === "danger"
          ? "border-rose-300/20 bg-rose-300/10 text-rose-600 hover:bg-rose-300/16 dark:text-rose-100"
          : "theme-border theme-panel theme-text-strong hover:bg-[var(--panel-strong)]"
      }`}
    >
      {children}
      <span className="pointer-events-none absolute -top-11 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-full border border-slate-900/8 bg-white px-3 py-1.5 text-[0.68rem] font-semibold tracking-[0.14em] text-slate-600 shadow-[0_12px_28px_rgba(15,23,42,0.12)] group-hover:flex dark:border-white/10 dark:bg-[rgba(7,18,35,0.96)] dark:text-white/80">
        {label}
      </span>
    </button>
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

export function AdminNewsList() {
  const { locale, newsPosts, deleteNewsPostByAdmin } = useSiteState();
  useAdminTitleScroll();

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <SectionHeading
          id={ADMIN_TITLE_ID}
          className="scroll-mt-32"
          eyebrow={locale === "en" ? "Admin / News" : "Admin / Tin tuc"}
          title={
            locale === "en"
              ? "Manage newsroom articles from one place."
              : "Quan ly bai viet newsroom tai mot noi duy nhat."
          }
          description={
            locale === "en"
              ? "Create new articles, open an existing article to edit it, or remove outdated posts from the live site dataset."
              : "Tạo bài viết mới, mở bài viết hiện có để chỉnh sửa, hoặc gỡ bài cũ khỏi dữ liệu đang dùng trên website."
          }
        />
        <Link
          href="/admin/news/new"
          className="theme-button-primary inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
        >
          <Plus className="h-4 w-4" />
          {locale === "en" ? "Add news article" : "Them bai viet"}
        </Link>
      </div>

      <div className="grid gap-4">
        {newsPosts.map((post) => (
          <Surface key={post.slug} className="px-5 py-5">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <StatusPill>{pickText(locale, post.category)}</StatusPill>
                  <p className="text-xs uppercase tracking-[0.22em] theme-text-soft">
                    {post.publishedAt} · {post.author}
                  </p>
                </div>
                <Link href={`/admin/news/${post.slug}`} className="mt-4 block text-2xl font-semibold theme-accent">
                  {pickText(locale, post.title)}
                </Link>
                <p className="mt-3 max-w-3xl text-sm leading-7 theme-text-muted">
                  {pickText(locale, post.excerpt)}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <span key={tag} className="rounded-full border theme-border px-3 py-1 text-xs theme-text-soft">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex gap-3">
                <Link
                  href={`/admin/news/${post.slug}`}
                  className="rounded-full border theme-border theme-panel px-4 py-2.5 text-sm font-semibold theme-text-strong"
                >
                  {locale === "en" ? "Edit" : "Sua"}
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    const confirmed = window.confirm(
                      locale === "en"
                        ? `Delete article "${pickText(locale, post.title)}"?`
                        : `Xoa bai viet "${pickText(locale, post.title)}"?`,
                    );

                    if (confirmed) {
                      deleteNewsPostByAdmin(post.slug);
                    }
                  }}
                  className="inline-flex items-center gap-2 rounded-full border border-rose-300/24 bg-rose-300/10 px-4 py-2.5 text-sm font-semibold text-rose-600 dark:text-rose-100"
                >
                  <Trash2 className="h-4 w-4" />
                  {locale === "en" ? "Delete" : "Xoa"}
                </button>
              </div>
            </div>
          </Surface>
        ))}
      </div>
    </div>
  );
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
  const [isUploadingCover, setIsUploadingCover] = useState(false);

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
    const validationError = getNewsImageValidationError(file);

    if (validationError === "type") {
      setCoverUploadMessage(
        locale === "en"
          ? "Only JPG, PNG, and WEBP images are allowed."
          : "Chỉ chấp nhận ảnh JPG, PNG và WEBP.",
      );
      return;
    }

    if (validationError === "size") {
      setCoverUploadMessage(
        locale === "en"
          ? "The uploaded image must be 2MB or smaller."
          : "Ảnh tải lên phải có dung lượng không quá 2MB.",
      );
      return;
    }

    setIsUploadingCover(true);
    setCoverUploadMessage("");

    const formData = new FormData();
    formData.set("imageFile", file);

    try {
      const response = await fetch("/api/admin/news/cover-image", {
        method: "POST",
        body: formData,
        credentials: "same-origin",
      });

      setIsUploadingCover(false);

      if (!response.ok) {
        const error = await response.json().catch(() => null);
        setCoverUploadMessage(
          error?.error ||
            (locale === "en"
              ? "Could not upload the cover image right now."
              : "Hiện không thể tải ảnh bìa lên."),
        );
        return;
      }

      const payload = (await response.json()) as { imageUrl: string };
      setDraft((current) =>
        current
          ? {
              ...current,
              coverImageSrc: payload.imageUrl,
            }
          : current,
      );
      setCoverUploadMessage(
        locale === "en"
          ? "Cover image uploaded successfully."
          : "Ảnh bìa đã được tải lên thành công.",
      );
    } catch {
      setIsUploadingCover(false);
      setCoverUploadMessage(
        locale === "en"
          ? "Could not upload the cover image right now."
          : "Hiện không thể tải ảnh bìa lên.",
      );
    }
  };

  const saveDraft = () => {
    setEditorMessage("");

    const nextSlug = slugify(draft.slug || draft.title.en || draft.title.vi || `news-${Date.now()}`);
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
          : block.src.trim() || block.alt.en.trim() || block.alt.vi.trim() || block.caption.en.trim() || block.caption.vi.trim(),
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

    const confirmed = window.confirm(
      locale === "en"
        ? `Delete article "${pickText(locale, draft.title)}"?`
        : `Xoa bai viet "${pickText(locale, draft.title)}"?`,
    );

    if (!confirmed) {
      return;
    }

    deleteNewsPostByAdmin(slug);
    router.push("/admin/news");
  };

  return (
    <div className="space-y-8">
      <Link href="/admin/news" className="inline-flex items-center gap-2 text-sm font-semibold theme-accent">
        <ArrowLeft className="h-4 w-4" />
        {locale === "en" ? "Back to news" : "Quay lại danh sách tin"}
      </Link>

      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <SectionHeading
          id={ADMIN_TITLE_ID}
          className="scroll-mt-32"
          eyebrow={locale === "en" ? "Admin / News / Editor" : "Admin / Tin tuc / Editor"}
          title={
            isCreateMode
              ? locale === "en"
                ? "Create a new news article"
                : "Tạo bài viết mới"
              : pickText(locale, draft.title) || (locale === "en" ? "Edit article" : "Chinh sua bai viet")
          }
          description={
            locale === "en"
              ? "This editor controls the public newsroom list and the article detail page."
              : "Editor nay dieu khien ca danh sach newsroom cong khai va trang chi tiet bai viet."
          }
        />
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => {
              setEditorMessage("");
              setCoverUploadMessage("");
              setDraft(cloneNewsPost(sourceDraftPost ?? createEmptyNewsPost()));
            }}
            className="rounded-full border theme-border theme-panel px-5 py-3 text-sm font-semibold theme-text-strong"
          >
            {locale === "en" ? "Reset draft" : "Dat lai ban nhap"}
          </button>
          <button
            type="button"
            disabled={!isDirty}
            onClick={saveDraft}
            className="theme-button-primary rounded-full px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
          >
            {locale === "en" ? "Save article" : "Lưu bài viết"}
          </button>
          <button
            type="button"
            onClick={deleteCurrentPost}
            className="inline-flex items-center gap-2 rounded-full border border-rose-300/24 bg-rose-300/10 px-5 py-3 text-sm font-semibold text-rose-600 dark:text-rose-100"
          >
            <Trash2 className="h-4 w-4" />
            {isCreateMode
              ? locale === "en"
                ? "Cancel"
                : "Huy"
              : locale === "en"
                ? "Delete"
                : "Xoa"}
          </button>
        </div>
      </div>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <Surface className="px-6 py-6 md:px-8 md:py-8">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm theme-text-muted">Slug</span>
                <input
                  value={draft.slug}
                  onChange={(event) => setDraft((current) => (current ? { ...current, slug: event.target.value } : current))}
                  className={fieldClassName}
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm theme-text-muted">
                  {locale === "en" ? "Author" : "Tac gia"}
                </span>
                <input
                  value={draft.author}
                  onChange={(event) => setDraft((current) => (current ? { ...current, author: event.target.value } : current))}
                  className={fieldClassName}
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm theme-text-muted">
                  {locale === "en" ? "Published date" : "Ngay dang"}
                </span>
                <input
                  type="date"
                  value={draft.publishedAt}
                  onChange={(event) => setDraft((current) => (current ? { ...current, publishedAt: event.target.value } : current))}
                  className={fieldClassName}
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm theme-text-muted">
                  {locale === "en" ? "Read time" : "Thoi gian doc"}
                </span>
                <input
                  value={draft.readTime}
                  onChange={(event) => setDraft((current) => (current ? { ...current, readTime: event.target.value } : current))}
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
                        {locale === "en"
                          ? "Upload the cover image"
                          : "Tải ảnh bìa lên"}
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
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border theme-border theme-panel px-4 py-2.5 text-sm font-semibold theme-text-strong hover:bg-[var(--panel-strong)]">
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

                  <div className="mt-4 overflow-hidden rounded-[1.4rem] border theme-border">
                    <img
                      src={draft.coverImageSrc}
                      alt={pickText(locale, draft.coverImageAlt) || "Cover preview"}
                      className="h-52 w-full object-cover"
                    />
                  </div>

                  {coverUploadMessage ? (
                    <div className="mt-4 rounded-[1.3rem] border border-sky-300/20 bg-sky-300/10 px-4 py-3 text-sm leading-7 text-sky-700 dark:text-sky-100">
                      {coverUploadMessage}
                    </div>
                  ) : null}
                </div>
              </label>
              <label className="space-y-2 md:col-span-2">
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
            </div>

            <div className="mt-6 space-y-5">
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
                label="Excerpt"
                rows={4}
                value={draft.excerpt}
                onChange={(language, value) =>
                  setDraft((current) =>
                    current ? { ...current, excerpt: { ...current.excerpt, [language]: value } } : current,
                  )
                }
              />
              <LocalizedFieldEditor
                label={locale === "en" ? "Cover caption (required)" : "Chú thích ảnh bìa (bắt buộc)"}
                rows={2}
                value={draft.coverLabel}
                onChange={(language, value) =>
                  setDraft((current) =>
                    current ? { ...current, coverLabel: { ...current.coverLabel, [language]: value } } : current,
                  )
                }
              />
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
            </div>
          </Surface>

          {editorMessage ? (
            <div className="rounded-[1.6rem] border border-amber-300/20 bg-amber-300/10 px-5 py-4 text-sm leading-7 text-amber-700 dark:text-amber-100">
              {editorMessage}
            </div>
          ) : null}

          <Surface className="space-y-5 px-6 py-6 md:px-8 md:py-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-lg font-semibold theme-text-strong">
                  {locale === "en" ? "Highlights" : "Diem nhan"}
                </p>
                <p className="mt-2 text-sm theme-text-soft">
                  {locale === "en"
                    ? "Short supporting points shown in the article sidebar."
                    : "Cac diem nhan ngan duoc hien o cot ben cua bai viet."}
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
                className="rounded-full border theme-border theme-panel px-4 py-2.5 text-sm font-semibold theme-text-strong"
              >
                {locale === "en" ? "Add highlight" : "Them diem nhan"}
              </button>
            </div>

            <div className="space-y-4">
              {draft.highlights.map((item, index) => (
                <Surface key={`highlight-${index}`} className="space-y-4 px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold theme-text-strong">
                      {locale === "en" ? `Highlight ${index + 1}` : `Diem nhan ${index + 1}`}
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
                      className="text-xs font-semibold text-rose-600 dark:text-rose-200"
                    >
                      {locale === "en" ? "Remove" : "Xoa"}
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
                  {locale === "en" ? "Article content" : "Noi dung bai viet"}
                </p>
                <p className="mt-2 text-sm theme-text-soft">
                  {locale === "en"
                    ? "Mix paragraph and image blocks to build the article body. The uploaded cover image is always inserted automatically after the first paragraph."
                    : "Kết hợp block đoạn văn và block hình để tạo thân bài viết. Ảnh bìa được chèn tự động sau đoạn văn đầu tiên."}
                </p>
              </div>
              <div className="flex gap-3">
                <IconToolButton
                  label={locale === "en" ? "Add paragraph block" : "Thêm block đoạn văn"}
                  onClick={() =>
                    setDraft((current) =>
                      current ? { ...current, content: [...current.content, createParagraphBlock()] } : current,
                    )
                  }
                >
                  <Text className="h-4 w-4" />
                </IconToolButton>
                <IconToolButton
                  label={locale === "en" ? "Add image block" : "Thêm block hình ảnh"}
                  onClick={() =>
                    setDraft((current) =>
                      current ? { ...current, content: [...current.content, createImageBlock()] } : current,
                    )
                  }
                >
                  <ImagePlus className="h-4 w-4" />
                </IconToolButton>
              </div>
            </div>

            <div className="space-y-4">
              {draft.content.map((block, index) => (
                <Surface key={`block-${index}`} className="space-y-4 px-4 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <StatusPill>
                        {locale === "en" ? `Block ${index + 1}` : `Khoi ${index + 1}`}
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
                        className="rounded-full border theme-border bg-white/70 px-3 py-2 text-sm theme-text-strong"
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
                            current
                              ? { ...current, content: moveItem(current.content, index, -1) }
                              : current,
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
                            current
                              ? { ...current, content: moveItem(current.content, index, 1) }
                              : current,
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
                          className={fieldClassName}
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
              ))}
            </div>
          </Surface>
        </div>

        <div className="space-y-4">
          <Surface className="px-6 py-6">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-700 dark:text-sky-200/80">
              {locale === "en" ? "Publish preview" : "Preview đăng bài"}
            </p>
            <p className="mt-4 text-sm leading-7 theme-text-muted">
              {locale === "en"
                ? "After saving, the article appears on the homepage news section, the newsroom list, the organizer page counters, and its public detail URL."
                : "Sau khi lưu, bài viết sẽ xuất hiện ở section tin tức trên trang chủ, danh sách newsroom, bộ đếm ở trang organizer và URL chi tiết công khai của bài."}
            </p>
            <div className="mt-5 rounded-[1.6rem] border theme-border theme-panel-subtle px-4 py-4">
              <p className="text-xs uppercase tracking-[0.22em] theme-text-soft">URL</p>
              <p className="mt-2 text-sm font-semibold theme-text-strong">
                /news/{slugify(draft.slug || draft.title.en || draft.title.vi || "news-article")}
              </p>
            </div>
          </Surface>

          <Surface className="px-6 py-6">
            <div className="flex items-center gap-3">
              <Newspaper className="h-5 w-5 text-cyan-300" />
              <p className="text-lg font-semibold theme-text-strong">
                {locale === "en" ? "Article status" : "Trang thai bai viet"}
              </p>
            </div>
            <div className="mt-5 space-y-3">
              <div className="rounded-[1.6rem] border theme-border theme-panel-subtle px-4 py-4">
                <p className="text-xs uppercase tracking-[0.22em] theme-text-soft">
                  {locale === "en" ? "Blocks" : "So khoi"}
                </p>
                <p className="mt-2 text-2xl font-semibold theme-text-strong">{draft.content.length}</p>
              </div>
              <div className="rounded-[1.6rem] border theme-border theme-panel-subtle px-4 py-4">
                <p className="text-xs uppercase tracking-[0.22em] theme-text-soft">
                  {locale === "en" ? "Highlights" : "So diem nhan"}
                </p>
                <p className="mt-2 text-2xl font-semibold theme-text-strong">{draft.highlights.length}</p>
              </div>
              <div className="rounded-[1.6rem] border theme-border theme-panel-subtle px-4 py-4">
                <p className="text-xs uppercase tracking-[0.22em] theme-text-soft">Tags</p>
                <p className="mt-2 text-sm theme-text-soft">
                  {draft.tags.length > 0 ? draft.tags.join(", ") : "-"}
                </p>
              </div>
            </div>
          </Surface>
        </div>
      </section>
    </div>
  );
}
