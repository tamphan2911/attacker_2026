"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import {
  ArrowLeft,
  ArrowDown,
  ArrowUp,
  Building2,
  Eye,
  EyeOff,
  Filter,
  Handshake,
  PencilLine,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Upload,
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
import { pickText } from "@/lib/site";
import type { Locale, LocalizedText, SponsorProfile } from "@/types/site";

const fieldClassName =
  "theme-placeholder w-full rounded-2xl border theme-border theme-panel px-4 py-3 text-sm theme-text-strong outline-none";
const tableFieldClassName =
  "theme-admin-select theme-field h-11 w-full rounded-[1rem] border px-3 text-sm font-semibold outline-none";

function cn(...values: Array<string | undefined | false>) {
  return values.filter(Boolean).join(" ");
}

function createBlankLocalizedText(): LocalizedText {
  return { en: "", vi: "" };
}

function cloneSponsors(sponsors: SponsorProfile[]): SponsorProfile[] {
  return JSON.parse(JSON.stringify(sponsors)) as SponsorProfile[];
}

function createSponsorDraft(index: number): SponsorProfile {
  return {
    name: `Sponsor ${index + 1}`,
    logoSrc: "",
    hidden: false,
    tier: createBlankLocalizedText(),
    category: createBlankLocalizedText(),
    description: createBlankLocalizedText(),
    contribution: createBlankLocalizedText(),
  };
}

function localizedSearchText(locale: Locale, value: LocalizedText) {
  return [value.en, value.vi, pickText(locale, value)].join(" ");
}

function matchesFilter(value: string, filterValue: string) {
  if (!filterValue.trim()) {
    return true;
  }

  return value.toLowerCase().includes(filterValue.trim().toLowerCase());
}

function sponsorMatchesSearch(locale: Locale, sponsor: SponsorProfile, query: string) {
  return matchesFilter(
    [
      sponsor.name,
      sponsor.logoSrc,
      localizedSearchText(locale, sponsor.tier),
      localizedSearchText(locale, sponsor.category),
      localizedSearchText(locale, sponsor.description),
      localizedSearchText(locale, sponsor.contribution),
    ].join(" "),
    query,
  );
}

function getLocalizedOptionKey(value: LocalizedText) {
  return `${value.en}|||${value.vi}`;
}

function parseLocalizedOptionKey(key: string): LocalizedText {
  const [en = "", vi = ""] = key.split("|||");
  return { en, vi };
}

function getSponsorOptionLabel(locale: Locale, key: string) {
  return pickText(locale, parseLocalizedOptionKey(key));
}

function getSponsorListHref(index: number) {
  return `/admin/content/sponsors/${index}`;
}

function LogoPreview({
  sponsor,
  locale,
  size = "md",
}: {
  sponsor: SponsorProfile;
  locale: Locale;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClass =
    size === "lg" ? "h-28 w-44 rounded-[1.5rem]" : size === "sm" ? "h-14 w-20 rounded-[1rem]" : "h-20 w-32 rounded-[1.25rem]";

  return (
    <div className={cn("relative flex shrink-0 items-center justify-center overflow-hidden border theme-border bg-white/86 p-3 dark:bg-white/[0.06]", sizeClass)}>
      {sponsor.logoSrc ? (
        <Image
          src={sponsor.logoSrc}
          alt={sponsor.name || "Sponsor logo"}
          fill
          sizes={size === "lg" ? "176px" : "128px"}
          unoptimized
          className="object-contain p-3"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-xs font-semibold theme-text-soft">
          {locale === "en" ? "No logo" : "Chưa có logo"}
        </div>
      )}
    </div>
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
      {(["en", "vi"] as Locale[]).map((language) => (
        <label key={language} className="space-y-2">
          <span className="text-sm theme-text-muted">
            {`${label} (${language.toUpperCase()})`}
          </span>
          <textarea
            rows={rows}
            value={value[language]}
            onChange={(event) => onChange(language, event.target.value)}
            className={fieldClassName}
          />
        </label>
      ))}
    </div>
  );
}

async function uploadSponsorLogo(file: File) {
  const formData = new FormData();
  formData.set("imageFile", file);

  const response = await fetch("/api/admin/content/sponsors/logo", {
    method: "POST",
    body: formData,
    credentials: "same-origin",
  });
  const payload = (await response.json().catch(() => null)) as { imageUrl?: string; error?: string } | null;

  if (!response.ok || !payload?.imageUrl) {
    return {
      ok: false as const,
      message: payload?.error ?? "Could not upload the sponsor logo.",
    };
  }

  return { ok: true as const, imageUrl: payload.imageUrl };
}

function SponsorFormFields({
  locale,
  draft,
  onChange,
  uploadMessage,
  isUploading,
  onUploadLogo,
}: {
  locale: Locale;
  draft: SponsorProfile;
  onChange: (nextDraft: SponsorProfile) => void;
  uploadMessage: string;
  isUploading: boolean;
  onUploadLogo: (file: File) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_220px]">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 md:col-span-2">
            <span className="text-sm theme-text-muted">
              {locale === "en" ? "Sponsor name" : "Tên nhà tài trợ"}
            </span>
            <input
              value={draft.name}
              onChange={(event) => onChange({ ...draft, name: event.target.value })}
              className={fieldClassName}
            />
          </label>
          <label className="space-y-2 md:col-span-2">
            <span className="text-sm theme-text-muted">
              {locale === "en" ? "Logo path" : "Đường dẫn logo"}
            </span>
            <input
              value={draft.logoSrc}
              onChange={(event) => onChange({ ...draft, logoSrc: event.target.value })}
              placeholder="/api/sponsor-images/..."
              className={fieldClassName}
            />
          </label>
        </div>

        <div className="rounded-[1.7rem] border theme-border theme-panel-subtle p-4">
          <LogoPreview sponsor={draft} locale={locale} size="lg" />
          <div className="mt-4 flex flex-wrap gap-2">
            <label className="theme-button-secondary inline-flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold">
              <Upload className="h-4 w-4" />
              {isUploading
                ? locale === "en"
                  ? "Uploading..."
                  : "Đang tải..."
                : locale === "en"
                  ? "Upload logo"
                  : "Tải logo"}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                disabled={isUploading}
                onChange={(event: ChangeEvent<HTMLInputElement>) => {
                  const file = event.target.files?.[0];
                  event.target.value = "";
                  if (file) {
                    onUploadLogo(file);
                  }
                }}
              />
            </label>
            {draft.logoSrc ? (
              <button
                type="button"
                onClick={() => onChange({ ...draft, logoSrc: "" })}
                className="theme-button-danger inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold"
              >
                <Trash2 className="h-4 w-4" />
                {locale === "en" ? "Remove" : "Gỡ"}
              </button>
            ) : null}
          </div>
          <p className="mt-3 text-xs leading-6 theme-text-soft">
            {locale === "en"
              ? "JPG, PNG, or WEBP. Maximum size: 2MB."
              : "JPG, PNG hoặc WEBP. Tối đa 2MB."}
          </p>
          {uploadMessage ? (
            <div className="mt-3 rounded-[1rem] border border-amber-400/24 bg-amber-400/12 px-3 py-2 text-xs leading-5 text-amber-800 dark:text-amber-100">
              {uploadMessage}
            </div>
          ) : null}
        </div>
      </div>

      <LocalizedFieldEditor
        label={locale === "en" ? "Tier" : "Hạng tài trợ"}
        rows={2}
        value={draft.tier}
        onChange={(language, value) => onChange({ ...draft, tier: { ...draft.tier, [language]: value } })}
      />
      <LocalizedFieldEditor
        label={locale === "en" ? "Category" : "Nhóm đồng hành"}
        rows={2}
        value={draft.category}
        onChange={(language, value) => onChange({ ...draft, category: { ...draft.category, [language]: value } })}
      />
      <LocalizedFieldEditor
        label={locale === "en" ? "Description" : "Mô tả"}
        rows={4}
        value={draft.description}
        onChange={(language, value) => onChange({ ...draft, description: { ...draft.description, [language]: value } })}
      />
      <LocalizedFieldEditor
        label={locale === "en" ? "Contribution" : "Nội dung đồng hành"}
        rows={4}
        value={draft.contribution}
        onChange={(language, value) => onChange({ ...draft, contribution: { ...draft.contribution, [language]: value } })}
      />
    </div>
  );
}

function SponsorDeleteDialog({
  locale,
  sponsor,
  onCancel,
  onConfirm,
}: {
  locale: Locale;
  sponsor: SponsorProfile;
  onCancel: () => void;
  onConfirm: () => void;
}) {
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
        className="relative w-full max-w-xl overflow-hidden rounded-[2rem] border border-white/20 bg-[var(--panel)] shadow-[0_32px_90px_rgba(15,23,42,0.34)]"
      >
        <div className="border-b theme-border bg-[linear-gradient(135deg,rgba(239,68,68,0.15),rgba(14,165,233,0.1))] px-6 py-5">
          <div className="flex items-start gap-4">
            <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-500/12 text-red-500 ring-1 ring-red-500/20">
              <Trash2 className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="theme-heading text-xl font-semibold theme-text-strong">
                {locale === "en" ? "Delete sponsor?" : "Xóa nhà tài trợ?"}
              </p>
              <p className="mt-2 text-sm leading-6 theme-text-muted">
                {locale === "en"
                  ? "This removes the sponsor from the sponsor page and homepage sponsor strip."
                  : "Thao tác này sẽ xóa nhà tài trợ khỏi trang nhà tài trợ và dải logo ở trang chủ."}
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
          <div className="flex items-center gap-4 rounded-[1.4rem] border theme-border theme-panel-subtle p-4">
            <LogoPreview sponsor={sponsor} locale={locale} size="sm" />
            <div className="min-w-0">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] theme-eyebrow">
                {locale === "en" ? "Sponsor" : "Nhà tài trợ"}
              </p>
              <p className="mt-1 font-semibold theme-text-strong">{sponsor.name || "--"}</p>
              <p className="mt-1 text-sm theme-text-soft">{pickText(locale, sponsor.tier) || "--"}</p>
            </div>
          </div>
          <div className="rounded-[1.2rem] border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm leading-6 text-red-600 dark:text-red-100">
            {locale === "en"
              ? "Deleting this sponsor cannot be undone from this page."
              : "Sau khi xóa, bạn không thể khôi phục nhà tài trợ này từ trang này."}
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
            {locale === "en" ? "Delete sponsor" : "Xóa nhà tài trợ"}
          </button>
        </div>
      </div>
    </div>
  );
}

function AddSponsorModal({
  locale,
  draft,
  validationMessage,
  uploadMessage,
  isUploading,
  onChange,
  onClose,
  onSave,
  onUploadLogo,
}: {
  locale: Locale;
  draft: SponsorProfile;
  validationMessage: string;
  uploadMessage: string;
  isUploading: boolean;
  onChange: (nextDraft: SponsorProfile) => void;
  onClose: () => void;
  onSave: () => void;
  onUploadLogo: (file: File) => void;
}) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[120] overflow-y-auto px-4 py-6">
      <button
        type="button"
        aria-label={locale === "en" ? "Close add sponsor" : "Đóng thêm nhà tài trợ"}
        className="fixed inset-0 cursor-default bg-slate-950/55 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative mx-auto w-full max-w-5xl">
        <Surface className="overflow-hidden px-0 py-0 shadow-[0_32px_90px_rgba(15,23,42,0.34)]">
          <div className="border-b theme-border bg-[linear-gradient(135deg,rgba(23,114,208,0.15),rgba(34,211,238,0.08))] px-6 py-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="theme-eyebrow text-xs font-semibold uppercase tracking-[0.24em]">
                  {locale === "en" ? "New sponsor" : "Nhà tài trợ mới"}
                </p>
                <h2 className="mt-2 theme-heading text-2xl font-semibold theme-text-strong">
                  {locale === "en" ? "Add sponsor record" : "Thêm hồ sơ nhà tài trợ"}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border theme-border bg-white/70 theme-text-soft transition hover:-translate-y-0.5 hover:bg-white dark:bg-white/10 dark:hover:bg-white/15"
                aria-label={locale === "en" ? "Close" : "Đóng"}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="px-6 py-6">
            <SponsorFormFields
              locale={locale}
              draft={draft}
              onChange={onChange}
              uploadMessage={uploadMessage}
              isUploading={isUploading}
              onUploadLogo={onUploadLogo}
            />
            {validationMessage ? (
              <div className="mt-5 rounded-[1.35rem] border border-amber-400/24 bg-amber-400/12 px-4 py-3 text-sm leading-7 text-amber-800 dark:text-amber-100">
                {validationMessage}
              </div>
            ) : null}
          </div>

          <div className="flex flex-col-reverse gap-3 border-t theme-border bg-[var(--panel-strong)] px-6 py-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="theme-button-secondary rounded-full px-5 py-3 text-sm font-semibold"
            >
              {locale === "en" ? "Cancel" : "Hủy"}
            </button>
            <button
              type="button"
              onClick={onSave}
              className="theme-button-primary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
            >
              <Plus className="h-4 w-4" />
              {locale === "en" ? "Add sponsor" : "Thêm nhà tài trợ"}
            </button>
          </div>
        </Surface>
      </div>
    </div>
  );
}

function validateSponsorDraft(locale: Locale, draft: SponsorProfile) {
  if (!draft.name.trim()) {
    return locale === "en" ? "Sponsor name is required." : "Cần nhập tên nhà tài trợ.";
  }

  if (!draft.logoSrc.trim()) {
    return locale === "en" ? "Sponsor logo is required." : "Cần có logo nhà tài trợ.";
  }

  if (!draft.tier.en.trim() && !draft.tier.vi.trim()) {
    return locale === "en" ? "Sponsor tier is required." : "Cần nhập hạng tài trợ.";
  }

  if (!draft.category.en.trim() && !draft.category.vi.trim()) {
    return locale === "en" ? "Sponsor category is required." : "Cần nhập nhóm đồng hành.";
  }

  return "";
}

export function AdminSponsorsList() {
  const { locale, sponsors, saveSponsorsByAdmin } = useSiteState();
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addDraft, setAddDraft] = useState<SponsorProfile>(() => createSponsorDraft(0));
  const [addValidationMessage, setAddValidationMessage] = useState("");
  const [uploadMessage, setUploadMessage] = useState("");
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<{ sponsor: SponsorProfile; index: number } | null>(null);
  useAdminTitleScroll();

  const rows = useMemo(
    () => sponsors.map((sponsor, index) => ({ sponsor, index })),
    [sponsors],
  );
  const tierOptions = useMemo(
    () =>
      Array.from(new Set(sponsors.map((sponsor) => getLocalizedOptionKey(sponsor.tier))))
        .filter((key) => getSponsorOptionLabel(locale, key).trim())
        .sort((left, right) => getSponsorOptionLabel(locale, left).localeCompare(getSponsorOptionLabel(locale, right))),
    [locale, sponsors],
  );
  const categoryOptions = useMemo(
    () =>
      Array.from(new Set(sponsors.map((sponsor) => getLocalizedOptionKey(sponsor.category))))
        .filter((key) => getSponsorOptionLabel(locale, key).trim())
        .sort((left, right) => getSponsorOptionLabel(locale, left).localeCompare(getSponsorOptionLabel(locale, right))),
    [locale, sponsors],
  );
  const visibleSponsorCount = useMemo(
    () => sponsors.filter((sponsor) => !sponsor.hidden).length,
    [sponsors],
  );
  const filteredRows = useMemo(
    () =>
      rows.filter(({ sponsor }) => {
        const tierKey = getLocalizedOptionKey(sponsor.tier);
        const categoryKey = getLocalizedOptionKey(sponsor.category);

        return (
          sponsorMatchesSearch(locale, sponsor, search) &&
          (tierFilter === "all" || tierFilter === tierKey) &&
          (categoryFilter === "all" || categoryFilter === categoryKey)
        );
      }),
    [categoryFilter, locale, rows, search, tierFilter],
  );
  const {
    page,
    setPage,
    pageCount,
    paginatedRows,
  } = useAdminTablePagination(filteredRows, ADMIN_LIST_TABLE_PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [categoryFilter, search, setPage, tierFilter]);

  const saveNextSponsors = (nextSponsors: SponsorProfile[]) => {
    saveSponsorsByAdmin(nextSponsors);
  };

  const handleAddSponsor = () => {
    const validation = validateSponsorDraft(locale, addDraft);
    if (validation) {
      setAddValidationMessage(validation);
      return;
    }

    saveNextSponsors([...sponsors, addDraft]);
    setIsAddOpen(false);
    setAddDraft(createSponsorDraft(sponsors.length + 1));
    setAddValidationMessage("");
    setUploadMessage("");
  };

  const handleAddLogoUpload = async (file: File) => {
    setIsUploadingLogo(true);
    setUploadMessage("");

    const result = await uploadSponsorLogo(file);
    setIsUploadingLogo(false);

    if (!result.ok) {
      setUploadMessage(result.message);
      return;
    }

    setAddDraft((current) => ({ ...current, logoSrc: result.imageUrl }));
    setUploadMessage(locale === "en" ? "Logo uploaded successfully." : "Đã tải logo thành công.");
  };

  const deleteSponsor = (index: number) => {
    saveNextSponsors(sponsors.filter((_, currentIndex) => currentIndex !== index));
    setPendingDelete(null);
  };

  const moveSponsor = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= sponsors.length) {
      return;
    }

    const nextSponsors = cloneSponsors(sponsors);
    const currentSponsor = nextSponsors[index];
    nextSponsors[index] = nextSponsors[targetIndex];
    nextSponsors[targetIndex] = currentSponsor;
    saveNextSponsors(nextSponsors);
  };

  const toggleSponsorVisibility = (index: number) => {
    saveNextSponsors(
      sponsors.map((sponsor, currentIndex) =>
        currentIndex === index ? { ...sponsor, hidden: !sponsor.hidden } : sponsor,
      ),
    );
  };

  return (
    <div className="space-y-8">
      <div id={ADMIN_TITLE_ID} className="scroll-mt-32 space-y-2">
        <p className="theme-eyebrow text-xs font-semibold uppercase tracking-[0.28em]">
          {locale === "en" ? "Admin / Content / Sponsors" : "Admin / Nội dung / Nhà tài trợ"}
        </p>
        <h1 className="theme-heading text-3xl font-semibold theme-text-strong md:text-[2.6rem]">
          {locale === "en" ? "Sponsors" : "Nhà tài trợ"}
        </h1>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <Surface className="px-5 py-5">
          <div className="theme-brand-gradient flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-[0_18px_40px_rgba(23,114,208,0.2)]">
            <Handshake className="h-5 w-5" />
          </div>
          <p className="mt-5 text-4xl font-semibold theme-text-strong">{visibleSponsorCount}</p>
          <p className="mt-2 text-sm leading-7 theme-text-muted">
            {locale === "en" ? "visible sponsor records" : "hồ sơ nhà tài trợ đang hiển thị"}
          </p>
        </Surface>
        <Surface className="px-5 py-5">
          <div className="theme-brand-gradient flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-[0_18px_40px_rgba(23,114,208,0.2)]">
            <Sparkles className="h-5 w-5" />
          </div>
          <p className="mt-5 text-4xl font-semibold theme-text-strong">{tierOptions.length}</p>
          <p className="mt-2 text-sm leading-7 theme-text-muted">
            {locale === "en" ? "sponsor tiers" : "hạng tài trợ"}
          </p>
        </Surface>
        <Surface className="px-5 py-5">
          <div className="theme-brand-gradient flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-[0_18px_40px_rgba(23,114,208,0.2)]">
            <Building2 className="h-5 w-5" />
          </div>
          <p className="mt-5 text-4xl font-semibold theme-text-strong">{categoryOptions.length}</p>
          <p className="mt-2 text-sm leading-7 theme-text-muted">
            {locale === "en" ? "partner categories" : "nhóm đồng hành"}
          </p>
        </Surface>
      </section>

      <Surface className="px-5 py-5 md:px-6">
        <div className="flex flex-col gap-4 border-b theme-border pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="theme-heading text-2xl font-semibold theme-text-strong">
              {locale === "en" ? "Sponsor summary" : "Tổng hợp nhà tài trợ"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setAddDraft(createSponsorDraft(sponsors.length));
              setAddValidationMessage("");
              setUploadMessage("");
              setIsAddOpen(true);
            }}
            className="theme-button-secondary inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold"
          >
            <Plus className="h-4 w-4" />
            {locale === "en" ? "New sponsor" : "Nhà tài trợ mới"}
          </button>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="min-w-[1300px] border-separate border-spacing-y-3 text-sm">
            <thead>
              <tr className="text-left text-[0.72rem] font-semibold uppercase tracking-[0.22em] theme-text-soft">
                <th className="w-[72px] px-4 py-2">#</th>
                <th className="min-w-[280px] px-4 py-2">{locale === "en" ? "Sponsor" : "Nhà tài trợ"}</th>
                <th className="min-w-[130px] px-4 py-2">{locale === "en" ? "Status" : "Trạng thái"}</th>
                <th className="min-w-[180px] px-4 py-2">{locale === "en" ? "Tier" : "Hạng"}</th>
                <th className="min-w-[220px] px-4 py-2">{locale === "en" ? "Category" : "Nhóm"}</th>
                <th className="min-w-[280px] px-4 py-2">{locale === "en" ? "Contribution" : "Đồng hành"}</th>
                <th className="px-4 py-2 text-right">{locale === "en" ? "Actions" : "Tác vụ"}</th>
              </tr>
              <tr>
                <th className="px-4 py-2" />
                <th className="px-4 py-2">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 theme-text-soft" />
                    <input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder={locale === "en" ? "Search sponsor" : "Tìm nhà tài trợ"}
                      className="theme-field h-11 w-full rounded-[1rem] border pl-9 pr-3 text-sm outline-none"
                    />
                  </div>
                </th>
                <th className="px-4 py-2" />
                <th className="px-4 py-2">
                  <select
                    value={tierFilter}
                    onChange={(event) => setTierFilter(event.target.value)}
                    className={tableFieldClassName}
                  >
                    <option value="all">{locale === "en" ? "All tiers" : "Tất cả hạng"}</option>
                    {tierOptions.map((key) => (
                      <option key={key} value={key}>
                        {getSponsorOptionLabel(locale, key)}
                      </option>
                    ))}
                  </select>
                </th>
                <th className="px-4 py-2">
                  <select
                    value={categoryFilter}
                    onChange={(event) => setCategoryFilter(event.target.value)}
                    className={tableFieldClassName}
                  >
                    <option value="all">{locale === "en" ? "All categories" : "Tất cả nhóm"}</option>
                    {categoryOptions.map((key) => (
                      <option key={key} value={key}>
                        {getSponsorOptionLabel(locale, key)}
                      </option>
                    ))}
                  </select>
                </th>
                <th className="px-4 py-2">
                  <div className="inline-flex items-center gap-2 text-xs font-semibold theme-text-soft">
                    <Filter className="h-3.5 w-3.5" />
                    {filteredRows.length} {locale === "en" ? "records" : "hồ sơ"}
                  </div>
                </th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="rounded-[1.4rem] border theme-border theme-panel px-4 py-8 text-center text-sm theme-text-muted">
                    {locale === "en" ? "No sponsor matches the current filters." : "Không có nhà tài trợ nào khớp bộ lọc hiện tại."}
                  </td>
                </tr>
              ) : (
                paginatedRows.map(({ sponsor, index }) => (
                  <tr key={`${sponsor.name}-${index}`} className="theme-panel-strong">
                    <td className="rounded-l-[1.4rem] border-y border-l theme-border px-4 py-4 text-xs font-semibold theme-text-soft">
                      {index + 1}
                    </td>
                    <td className="border-y theme-border px-4 py-4">
                      <div className="flex items-center gap-4">
                        <LogoPreview sponsor={sponsor} locale={locale} size="sm" />
                        <div className="min-w-0">
                          <Link
                            href={getSponsorListHref(index)}
                            className="theme-heading block text-lg font-semibold theme-accent"
                          >
                            {sponsor.name || (locale === "en" ? "Untitled sponsor" : "Nhà tài trợ chưa đặt tên")}
                          </Link>
                          <p className="mt-1 break-all text-xs theme-text-soft">{sponsor.logoSrc || "--"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="border-y theme-border px-4 py-4">
                      <StatusPill tone={sponsor.hidden ? "warning" : "success"}>
                        {sponsor.hidden
                          ? locale === "en"
                            ? "Hidden"
                            : "Đang ẩn"
                          : locale === "en"
                            ? "Visible"
                            : "Hiển thị"}
                      </StatusPill>
                    </td>
                    <td className="border-y theme-border px-4 py-4">
                      <StatusPill>{pickText(locale, sponsor.tier) || "--"}</StatusPill>
                    </td>
                    <td className="border-y theme-border px-4 py-4 text-sm theme-text-body">
                      {pickText(locale, sponsor.category) || "--"}
                    </td>
                    <td className="border-y theme-border px-4 py-4 text-sm theme-text-body">
                      <p className="line-clamp-2">{pickText(locale, sponsor.contribution) || pickText(locale, sponsor.description) || "--"}</p>
                    </td>
                    <td className="rounded-r-[1.4rem] border-y border-r theme-border px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          disabled={index === 0}
                          title={locale === "en" ? "Move sponsor up" : "Đưa nhà tài trợ lên"}
                          aria-label={locale === "en" ? "Move sponsor up" : "Đưa nhà tài trợ lên"}
                          onClick={() => moveSponsor(index, -1)}
                          className="theme-button-secondary inline-flex h-10 w-10 items-center justify-center rounded-full disabled:cursor-not-allowed disabled:opacity-45"
                        >
                          <ArrowUp className="h-4 w-4" />
                          <span className="sr-only">{locale === "en" ? "Move sponsor up" : "Đưa nhà tài trợ lên"}</span>
                        </button>
                        <button
                          type="button"
                          disabled={index >= sponsors.length - 1}
                          title={locale === "en" ? "Move sponsor down" : "Đưa nhà tài trợ xuống"}
                          aria-label={locale === "en" ? "Move sponsor down" : "Đưa nhà tài trợ xuống"}
                          onClick={() => moveSponsor(index, 1)}
                          className="theme-button-secondary inline-flex h-10 w-10 items-center justify-center rounded-full disabled:cursor-not-allowed disabled:opacity-45"
                        >
                          <ArrowDown className="h-4 w-4" />
                          <span className="sr-only">{locale === "en" ? "Move sponsor down" : "Đưa nhà tài trợ xuống"}</span>
                        </button>
                        <button
                          type="button"
                          title={
                            sponsor.hidden
                              ? locale === "en"
                                ? "Show sponsor on public pages"
                                : "Hiển thị nhà tài trợ trên trang công khai"
                              : locale === "en"
                                ? "Hide sponsor from public pages"
                                : "Ẩn nhà tài trợ khỏi trang công khai"
                          }
                          aria-label={
                            sponsor.hidden
                              ? locale === "en"
                                ? "Show sponsor on public pages"
                                : "Hiển thị nhà tài trợ trên trang công khai"
                              : locale === "en"
                                ? "Hide sponsor from public pages"
                                : "Ẩn nhà tài trợ khỏi trang công khai"
                          }
                          onClick={() => toggleSponsorVisibility(index)}
                          className="theme-button-secondary inline-flex h-10 w-10 items-center justify-center rounded-full"
                        >
                          {sponsor.hidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                          <span className="sr-only">
                            {sponsor.hidden
                              ? locale === "en"
                                ? "Show sponsor"
                                : "Hiển thị nhà tài trợ"
                              : locale === "en"
                                ? "Hide sponsor"
                                : "Ẩn nhà tài trợ"}
                          </span>
                        </button>
                        <Link
                          href={getSponsorListHref(index)}
                          title={locale === "en" ? "Edit sponsor" : "Sửa nhà tài trợ"}
                          aria-label={locale === "en" ? "Edit sponsor" : "Sửa nhà tài trợ"}
                          className="theme-button-secondary inline-flex h-10 w-10 items-center justify-center rounded-full"
                        >
                          <PencilLine className="h-4 w-4" />
                          <span className="sr-only">{locale === "en" ? "Edit sponsor" : "Sửa nhà tài trợ"}</span>
                        </Link>
                        <button
                          type="button"
                          title={locale === "en" ? "Delete sponsor" : "Xóa nhà tài trợ"}
                          aria-label={locale === "en" ? "Delete sponsor" : "Xóa nhà tài trợ"}
                          onClick={() => setPendingDelete({ sponsor, index })}
                          className="theme-button-danger inline-flex h-10 w-10 items-center justify-center rounded-full"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">{locale === "en" ? "Delete sponsor" : "Xóa nhà tài trợ"}</span>
                        </button>
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
          totalRows={filteredRows.length}
          onPageChange={setPage}
        />
      </Surface>

      {isAddOpen ? (
        <AddSponsorModal
          locale={locale}
          draft={addDraft}
          validationMessage={addValidationMessage}
          uploadMessage={uploadMessage}
          isUploading={isUploadingLogo}
          onChange={(nextDraft) => {
            setAddValidationMessage("");
            setAddDraft(nextDraft);
          }}
          onClose={() => {
            setIsAddOpen(false);
            setAddValidationMessage("");
            setUploadMessage("");
          }}
          onSave={handleAddSponsor}
          onUploadLogo={(file) => {
            void handleAddLogoUpload(file);
          }}
        />
      ) : null}

      {pendingDelete ? (
        <SponsorDeleteDialog
          locale={locale}
          sponsor={pendingDelete.sponsor}
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => deleteSponsor(pendingDelete.index)}
        />
      ) : null}
    </div>
  );
}

export function AdminSponsorEditor({ sponsorIndex }: { sponsorIndex: number }) {
  const router = useRouter();
  const { locale, sponsors, saveSponsorsByAdmin } = useSiteState();
  const sponsor = sponsors[sponsorIndex];
  const [draft, setDraft] = useState<SponsorProfile | null>(() => (sponsor ? cloneSponsors([sponsor])[0] : null));
  const [validationMessage, setValidationMessage] = useState("");
  const [uploadMessage, setUploadMessage] = useState("");
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  useAdminTitleScroll();

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDraft(sponsor ? cloneSponsors([sponsor])[0] ?? null : null);
      setValidationMessage("");
      setUploadMessage("");
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [sponsor]);

  if (!sponsor || !draft) {
    return (
      <Surface className="px-6 py-6 md:px-8 md:py-8">
        <SectionHeading
          id={ADMIN_TITLE_ID}
          className="scroll-mt-32"
          eyebrow={locale === "en" ? "Admin / Content / Sponsors" : "Admin / Nội dung / Nhà tài trợ"}
          title={locale === "en" ? "Sponsor not found." : "Không tìm thấy nhà tài trợ."}
          description={
            locale === "en"
              ? "This sponsor record may have been removed from the current admin dataset."
              : "Hồ sơ nhà tài trợ này có thể đã bị xóa khỏi dữ liệu admin hiện tại."
          }
        />
        <Link href="/admin/content/sponsors" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold theme-accent">
          <ArrowLeft className="h-4 w-4" />
          {locale === "en" ? "Back to sponsors" : "Quay lại danh sách nhà tài trợ"}
        </Link>
      </Surface>
    );
  }

  const isDirty = JSON.stringify(draft) !== JSON.stringify(sponsor);

  const saveSponsor = () => {
    const validation = validateSponsorDraft(locale, draft);
    if (validation) {
      setValidationMessage(validation);
      return;
    }

    saveSponsorsByAdmin(sponsors.map((item, index) => (index === sponsorIndex ? draft : item)));
    setValidationMessage("");
  };

  const deleteSponsor = () => {
    saveSponsorsByAdmin(sponsors.filter((_, index) => index !== sponsorIndex));
    router.push("/admin/content/sponsors");
  };

  const uploadLogo = async (file: File) => {
    setIsUploadingLogo(true);
    setUploadMessage("");

    const result = await uploadSponsorLogo(file);
    setIsUploadingLogo(false);

    if (!result.ok) {
      setUploadMessage(result.message);
      return;
    }

    setDraft((current) => (current ? { ...current, logoSrc: result.imageUrl } : current));
    setUploadMessage(locale === "en" ? "Logo uploaded successfully." : "Đã tải logo thành công.");
  };

  return (
    <div className="space-y-8">
      <Link href="/admin/content/sponsors" className="inline-flex items-center gap-2 text-sm font-semibold theme-accent">
        <ArrowLeft className="h-4 w-4" />
        {locale === "en" ? "Back to sponsors" : "Quay lại nhà tài trợ"}
      </Link>

      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <SectionHeading
          id={ADMIN_TITLE_ID}
          className="scroll-mt-32"
          eyebrow={locale === "en" ? "Admin / Content / Sponsors / Editor" : "Admin / Nội dung / Nhà tài trợ / Chỉnh sửa"}
          title={draft.name || (locale === "en" ? "Edit sponsor" : "Chỉnh sửa nhà tài trợ")}
        />
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => {
              setDraft(cloneSponsors([sponsor])[0]);
              setValidationMessage("");
              setUploadMessage("");
            }}
            className="theme-button-secondary rounded-full px-5 py-3 text-sm font-semibold"
          >
            {locale === "en" ? "Reset draft" : "Đặt lại bản nháp"}
          </button>
          <button
            type="button"
            disabled={!isDirty}
            onClick={saveSponsor}
            className="theme-button-primary rounded-full px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
          >
            {locale === "en" ? "Save sponsor" : "Lưu nhà tài trợ"}
          </button>
          <button
            type="button"
            onClick={() => setShowDeleteDialog(true)}
            className="theme-button-danger inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
          >
            <Trash2 className="h-4 w-4" />
            {locale === "en" ? "Delete" : "Xóa"}
          </button>
        </div>
      </div>

      <Surface className="px-6 py-6 md:px-7 md:py-7">
        <SponsorFormFields
          locale={locale}
          draft={draft}
          onChange={(nextDraft) => {
            setValidationMessage("");
            setDraft(nextDraft);
          }}
          uploadMessage={uploadMessage}
          isUploading={isUploadingLogo}
          onUploadLogo={(file) => {
            void uploadLogo(file);
          }}
        />
        {validationMessage ? (
          <div className="mt-5 rounded-[1.35rem] border border-amber-400/24 bg-amber-400/12 px-4 py-3 text-sm leading-7 text-amber-800 dark:text-amber-100">
            {validationMessage}
          </div>
        ) : null}
      </Surface>

      {showDeleteDialog ? (
        <SponsorDeleteDialog
          locale={locale}
          sponsor={sponsor}
          onCancel={() => setShowDeleteDialog(false)}
          onConfirm={deleteSponsor}
        />
      ) : null}
    </div>
  );
}
