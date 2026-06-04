"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Images, Plus, Trash2 } from "lucide-react";

import {
  ADMIN_TITLE_ID,
  useAdminTitleScroll,
} from "@/components/admin-title-scroll";
import {
  ensureSeasonDraftRecords,
  getSeasonContentYears,
  getSeasonSlotDisplayYear,
  SeasonArchiveContentEditor,
} from "@/components/admin-season-content-editor";
import { useSiteState } from "@/components/providers/site-state-provider";
import { SectionHeading, Surface } from "@/components/site-ui";
import type { SitePageContent } from "@/types/site";

function clonePageContent(content: SitePageContent): SitePageContent {
  return JSON.parse(JSON.stringify(content)) as SitePageContent;
}

function pickSeasonContent(content: SitePageContent) {
  return {
    seasonBadgeLabel: content.organizer.seasonBadgeLabel,
    seasonStories: content.organizer.seasonStories,
    seasonArchives: content.organizer.seasonArchives ?? [],
  };
}

function seasonContentSignature(content: SitePageContent) {
  return JSON.stringify(pickSeasonContent(content));
}

function SeasonEditorTopBar({
  title,
  description,
  isDirty,
  onReset,
  onSave,
}: {
  title: string;
  description: string;
  isDirty: boolean;
  onReset: () => void;
  onSave: () => void;
}) {
  const { locale } = useSiteState();

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <SectionHeading
          id={ADMIN_TITLE_ID}
          className="scroll-mt-32"
          eyebrow={locale === "en" ? "Admin / Seasons" : "Admin / Mùa thi"}
          title={title}
          description={description}
        />
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onReset}
            className="rounded-full border theme-border theme-panel px-5 py-3 text-sm font-semibold theme-text-strong"
          >
            {locale === "en" ? "Reset draft" : "Đặt lại bản nháp"}
          </button>
          <button
            type="button"
            disabled={!isDirty}
            onClick={onSave}
            className="theme-button-primary rounded-full px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
          >
            {locale === "en" ? "Save season content" : "Lưu nội dung mùa thi"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function AdminSeasonsManager({ year }: { year?: string }) {
  const { locale, pageContent, saveSeasonContent } = useSiteState();
  const router = useRouter();
  useAdminTitleScroll();
  const [draft, setDraft] = useState<SitePageContent>(() =>
    clonePageContent(pageContent),
  );
  const [newSeasonYear, setNewSeasonYear] = useState("");
  const [newSeasonError, setNewSeasonError] = useState("");
  const [isAddingSeason, setIsAddingSeason] = useState(false);
  const [seasonActionError, setSeasonActionError] = useState("");
  const [deletingSeasonYear, setDeletingSeasonYear] = useState<string | null>(
    null,
  );

  useEffect(() => {
    setDraft(clonePageContent(pageContent));
  }, [pageContent]);

  const isDirty = useMemo(
    () => seasonContentSignature(draft) !== seasonContentSignature(pageContent),
    [draft, pageContent],
  );

  const saveDraft = async () => {
    await saveSeasonContent(pickSeasonContent(draft));
  };

  const seasonYears = useMemo(() => getSeasonContentYears(draft), [draft]);

  const addSeason = async () => {
    const normalizedYear = newSeasonYear.trim();
    setNewSeasonError("");

    if (!/^\d{4}$/.test(normalizedYear)) {
      setNewSeasonError(
        locale === "en"
          ? "Enter a 4-digit season year."
          : "Nhập năm mùa thi gồm 4 chữ số.",
      );
      return;
    }

    if (seasonYears.includes(normalizedYear)) {
      setNewSeasonError(
        locale === "en"
          ? "This season already exists."
          : "Mùa thi này đã tồn tại.",
      );
      return;
    }

    const nextDraft = clonePageContent(draft);
    ensureSeasonDraftRecords(nextDraft, normalizedYear);
    setIsAddingSeason(true);

    try {
      const saved = await saveSeasonContent(pickSeasonContent(nextDraft));
      if (!saved) {
        setNewSeasonError(
          locale === "en"
            ? "Could not save the new season."
            : "Không thể lưu mùa thi mới.",
        );
        return;
      }

      setDraft(nextDraft);
      setNewSeasonYear("");
      router.push(`/admin/seasons/${encodeURIComponent(normalizedYear)}`);
    } finally {
      setIsAddingSeason(false);
    }
  };

  const deleteSeason = async (slotYear: string) => {
    const displayYear = getSeasonSlotDisplayYear(draft, slotYear);
    setSeasonActionError("");

    const confirmed = window.confirm(
      locale === "en"
        ? `Delete Season ${displayYear}? This removes the season card and its detail-page archive content.`
        : `Xóa Mùa ${displayYear}? Thao tác này sẽ xóa thẻ mùa thi và nội dung lưu trữ của trang chi tiết.`,
    );

    if (!confirmed) {
      return;
    }

    const nextDraft = clonePageContent(draft);
    nextDraft.organizer.seasonStories =
      nextDraft.organizer.seasonStories.filter(
        (item) => item.year !== slotYear,
      );
    nextDraft.organizer.seasonArchives = (
      nextDraft.organizer.seasonArchives ?? []
    ).filter((item) => item.year !== slotYear);

    setDeletingSeasonYear(slotYear);

    try {
      const saved = await saveSeasonContent(pickSeasonContent(nextDraft));
      if (!saved) {
        setSeasonActionError(
          locale === "en"
            ? "Could not delete this season."
            : "Không thể xóa mùa thi này.",
        );
        return;
      }

      setDraft(nextDraft);
    } finally {
      setDeletingSeasonYear(null);
    }
  };

  if (year) {
    const displayYear = getSeasonSlotDisplayYear(draft, year);

    return (
      <div className="space-y-8">
        <Link
          href="/admin/seasons"
          className="inline-flex items-center gap-2 text-sm font-semibold theme-accent"
        >
          <ArrowLeft className="h-4 w-4" />
          {locale === "en" ? "Back to seasons" : "Quay lại mùa thi"}
        </Link>

        <SeasonEditorTopBar
          title={
            locale === "en" ? `Season ${displayYear}` : `Mùa ${displayYear}`
          }
          description={
            locale === "en"
              ? "Edit the public season detail page. This save action only updates season content and cannot overwrite other page copy."
              : "Chỉnh trang chi tiết mùa thi. Nút lưu này chỉ cập nhật nội dung mùa thi và không ghi đè copy của trang khác."
          }
          isDirty={isDirty}
          onReset={() => setDraft(clonePageContent(pageContent))}
          onSave={() => {
            void saveDraft();
          }}
        />

        <SeasonArchiveContentEditor
          locale={locale}
          draft={draft}
          setDraft={setDraft}
          year={year}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <SeasonEditorTopBar
        title={locale === "en" ? "Season content" : "Nội dung mùa thi"}
        description={
          locale === "en"
            ? "Open a season editor to manage archive text, top teams, statistics, and slider images. Season content is saved independently from Pages & types."
            : "Mở từng mùa để chỉnh nội dung lưu trữ, top đội, thống kê và ảnh slider. Nội dung mùa thi được lưu độc lập với Trang và nhóm nội dung."
        }
        isDirty={isDirty}
        onReset={() => setDraft(clonePageContent(pageContent))}
        onSave={() => {
          void saveDraft();
        }}
      />

      <Surface className="space-y-5 px-5 py-5 md:px-6 md:py-6">
        <div className="rounded-[1.35rem] border theme-border theme-panel-subtle px-4 py-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold theme-text-strong">
                {locale === "en" ? "Add a season" : "Thêm mùa thi"}
              </p>
              <p className="mt-2 text-sm leading-6 theme-text-muted">
                {locale === "en"
                  ? "Create a new season archive record, save it, then open its editor."
                  : "Tạo bản ghi mùa thi mới, lưu lại, rồi mở trình chỉnh sửa của mùa đó."}
              </p>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-[22rem]">
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={newSeasonYear}
                  onChange={(event) =>
                    setNewSeasonYear(
                      event.target.value.replace(/\D/g, "").slice(0, 4),
                    )
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      void addSeason();
                    }
                  }}
                  placeholder={locale === "en" ? "e.g. 2027" : "Ví dụ: 2027"}
                  className="theme-placeholder min-h-12 flex-1 rounded-2xl border theme-border theme-panel px-4 py-3 text-sm font-semibold theme-text-strong outline-none"
                />
                <button
                  type="button"
                  disabled={isAddingSeason}
                  onClick={() => {
                    void addSeason();
                  }}
                  className="theme-button-primary inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Plus className="h-4 w-4" />
                  {locale === "en" ? "Add season" : "Thêm mùa"}
                </button>
              </div>
              {newSeasonError ? (
                <p className="text-xs font-semibold text-rose-600 dark:text-rose-200">
                  {newSeasonError}
                </p>
              ) : null}
              {seasonActionError ? (
                <p className="text-xs font-semibold text-rose-600 dark:text-rose-200">
                  {seasonActionError}
                </p>
              ) : null}
            </div>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {seasonYears.map((slotYear) => {
            const displayYear = getSeasonSlotDisplayYear(draft, slotYear);

            return (
              <div
                key={slotYear}
                className="group rounded-[1.35rem] border theme-border theme-panel-subtle px-4 py-4 transition hover:border-sky-300/40 hover:bg-[rgba(23,114,208,0.06)]"
              >
                <div className="flex items-center gap-3">
                  <Link
                    href={`/admin/seasons/${slotYear}`}
                    className="flex min-w-0 flex-1 items-center gap-3"
                  >
                    <span className="theme-brand-gradient flex h-11 w-11 items-center justify-center rounded-2xl text-white shadow-[0_16px_34px_rgba(23,114,208,0.18)]">
                      <Images className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold theme-text-strong">
                        {locale === "en"
                          ? `Season ${displayYear}`
                          : `Mùa ${displayYear}`}
                      </p>
                      <p className="mt-1 text-xs leading-5 theme-text-muted">
                        {locale === "en"
                          ? "Edit archive text, top team profiles, stats, and slider photos."
                          : "Chỉnh nội dung lưu trữ, top đội, thống kê và ảnh slider."}
                      </p>
                    </div>
                  </Link>
                  <button
                    type="button"
                    disabled={deletingSeasonYear === slotYear}
                    onClick={() => {
                      void deleteSeason(slotYear);
                    }}
                    className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-rose-300/30 bg-rose-500/10 text-rose-600 transition hover:-translate-y-0.5 hover:border-rose-300/60 hover:bg-rose-500/15 disabled:cursor-not-allowed disabled:opacity-50 dark:text-rose-200"
                    aria-label={
                      locale === "en"
                        ? `Delete season ${displayYear}`
                        : `Xóa mùa ${displayYear}`
                    }
                    title={locale === "en" ? "Delete season" : "Xóa mùa thi"}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
          {seasonYears.length === 0 ? (
            <div className="rounded-[1.35rem] border theme-border theme-panel-subtle px-4 py-5 text-sm theme-text-muted md:col-span-2">
              {locale === "en"
                ? "No seasons yet. Add the first season above."
                : "Chưa có mùa thi. Hãy thêm mùa đầu tiên ở phía trên."}
            </div>
          ) : null}
        </div>
      </Surface>
    </div>
  );
}
