"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Images } from "lucide-react";

import { ADMIN_TITLE_ID, useAdminTitleScroll } from "@/components/admin-title-scroll";
import {
  getSeasonSlotDisplayYear,
  SeasonArchiveContentEditor,
  seasonContentYears,
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
  useAdminTitleScroll();
  const [draft, setDraft] = useState<SitePageContent>(() => clonePageContent(pageContent));

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
          title={locale === "en" ? `Season ${displayYear}` : `Mùa ${displayYear}`}
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

        <SeasonArchiveContentEditor locale={locale} draft={draft} setDraft={setDraft} year={year} />
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
        <div className="grid gap-3 md:grid-cols-2">
          {seasonContentYears.map((slotYear) => {
            const displayYear = getSeasonSlotDisplayYear(draft, slotYear);

            return (
              <Link key={slotYear} href={`/admin/seasons/${slotYear}`} className="block">
                <div className="group rounded-[1.35rem] border theme-border theme-panel-subtle px-4 py-4 transition hover:border-sky-300/40 hover:bg-[rgba(23,114,208,0.06)]">
                  <div className="flex items-center gap-3">
                    <span className="theme-brand-gradient flex h-11 w-11 items-center justify-center rounded-2xl text-white shadow-[0_16px_34px_rgba(23,114,208,0.18)]">
                      <Images className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold theme-text-strong">
                        {locale === "en" ? `Season ${displayYear}` : `Mùa ${displayYear}`}
                      </p>
                      <p className="mt-1 text-xs leading-5 theme-text-muted">
                        {locale === "en"
                          ? "Edit archive text, top team profiles, stats, and slider photos."
                          : "Chỉnh nội dung lưu trữ, top đội, thống kê và ảnh slider."}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </Surface>
    </div>
  );
}
