"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarClock, RotateCcw, Save } from "lucide-react";

import { ADMIN_TITLE_ID, useAdminTitleScroll } from "@/components/admin-title-scroll";
import { useSiteState } from "@/components/providers/site-state-provider";
import { SectionHeading, Surface, StatusPill } from "@/components/site-ui";
import { timelineItems as defaultTimelineItems } from "@/data/site-content";
import { pickText } from "@/lib/site";
import type { CompetitionRoundKey, TimelineItem } from "@/types/site";

const fieldClassName =
  "theme-placeholder h-12 w-full rounded-2xl border theme-border theme-panel px-4 text-sm theme-text-strong outline-none";

const phaseMeta: Record<"general" | CompetitionRoundKey, { en: string; vi: string; tone: "default" | "info" | "success" | "warning" }> = {
  general: { en: "Preparation", vi: "Chuẩn bị", tone: "default" },
  "round-1": { en: "Round 1", vi: "Vòng 1", tone: "info" },
  "round-2": { en: "Round 2", vi: "Vòng 2", tone: "success" },
  "round-3": { en: "Final round", vi: "Chung kết", tone: "warning" },
};

function cloneTimeline(value: TimelineItem[]) {
  return JSON.parse(JSON.stringify(value)) as TimelineItem[];
}

function sortTimelineItems(items: TimelineItem[]) {
  return [...items].sort((left, right) => {
    if (left.startDate !== right.startDate) {
      return left.startDate.localeCompare(right.startDate);
    }

    return left.endDate.localeCompare(right.endDate);
  });
}

export function AdminTimelineManager() {
  const { locale, updateTimelineItemsByAdmin } = useSiteState();
  useAdminTitleScroll();

  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>(() => cloneTimeline(defaultTimelineItems));
  const [savedTimelineItems, setSavedTimelineItems] = useState<TimelineItem[]>(() => cloneTimeline(defaultTimelineItems));
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const response = await fetch("/api/admin/timeline", {
        cache: "no-store",
        credentials: "same-origin",
      });

      if (!response.ok) {
        if (!cancelled) {
          setMessage(
            locale === "en"
              ? "Could not load the current timeline schedule."
              : "Không thể tải lịch trình hiện tại.",
          );
          setIsLoading(false);
        }
        return;
      }

      const payload = (await response.json()) as { timelineItems: TimelineItem[] };
      if (!cancelled) {
        const nextItems = cloneTimeline(payload.timelineItems);
        setTimelineItems(nextItems);
        setSavedTimelineItems(cloneTimeline(payload.timelineItems));
        setIsLoading(false);
      }
    })().catch(() => {
      if (!cancelled) {
        setMessage(
          locale === "en"
            ? "Could not load the current timeline schedule."
            : "Không thể tải lịch trình hiện tại.",
        );
        setIsLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [locale]);

  const isDirty = useMemo(
    () => JSON.stringify(timelineItems) !== JSON.stringify(savedTimelineItems),
    [savedTimelineItems, timelineItems],
  );

  const groupedItems = useMemo(() => {
    return (["general", "round-1", "round-2", "round-3"] as const).map((phase) => ({
      phase,
      items: sortTimelineItems(timelineItems.filter((item) => item.phase === phase)),
    }));
  }, [timelineItems]);

  const handleDateChange = (itemId: string, field: "startDate" | "endDate", value: string) => {
    setTimelineItems((current) =>
      current.map((item) => (item.id === itemId ? { ...item, [field]: value } : item)),
    );
  };

  const handleReset = () => {
    setTimelineItems(cloneTimeline(savedTimelineItems));
    setMessage("");
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage("");

    const response = await fetch("/api/admin/timeline", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "same-origin",
      body: JSON.stringify({ timelineItems }),
    });

    if (!response.ok) {
      setMessage(
        locale === "en"
          ? "Could not save the timeline schedule right now."
          : "Hiện chưa thể lưu lịch trình.",
      );
      setIsSaving(false);
      return;
    }

    setSavedTimelineItems(cloneTimeline(timelineItems));
    updateTimelineItemsByAdmin(cloneTimeline(timelineItems));
    setMessage(locale === "en" ? "Timeline schedule updated." : "Đã cập nhật lịch trình.");
    setIsSaving(false);
  };

  return (
    <div className="space-y-8">
      <section className="space-y-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <SectionHeading
            id={ADMIN_TITLE_ID}
            className="scroll-mt-32"
            eyebrow={locale === "en" ? "System / Timeline" : "Hệ thống / Lịch trình"}
            title={
              locale === "en"
                ? "Edit the official dates for every timeline step."
                : "Chỉnh các mốc thời gian chính thức cho từng bước trong lịch trình."
            }
            description={
              locale === "en"
                ? "This screen is admin-only. Update the start and end dates here, then the public timeline page and live status badges will reflect the new schedule."
                : "Màn hình này chỉ dành cho admin. Hãy cập nhật ngày bắt đầu và kết thúc tại đây, sau đó trang lịch trình công khai và các nhãn trạng thái trực tiếp sẽ phản ánh lịch mới."
            }
          />

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleReset}
              className="theme-button-secondary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
            >
              <RotateCcw className="h-4 w-4" />
              {locale === "en" ? "Reset changes" : "Đặt lại thay đổi"}
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || !isDirty}
              className="theme-button-primary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {isSaving
                ? locale === "en"
                  ? "Saving..."
                  : "Đang lưu..."
                : locale === "en"
                  ? "Save timeline"
                  : "Lưu lịch trình"}
            </button>
          </div>
        </div>

        {message ? (
          <Surface className="px-5 py-4">
            <p className="text-sm theme-text-soft">{message}</p>
          </Surface>
        ) : null}

        {isLoading ? (
          <Surface className="px-5 py-5">
            <p className="text-sm theme-text-soft">
              {locale === "en" ? "Loading timeline schedule..." : "Đang tải lịch trình..."}
            </p>
          </Surface>
        ) : null}
      </section>

      {!isLoading ? (
        <div className="space-y-6">
          {groupedItems.map(({ phase, items }) => {
            const meta = phaseMeta[phase];

            return (
              <Surface key={phase} className="px-5 py-5 md:px-6 md:py-6">
                <div className="flex flex-col gap-3 border-b theme-border pb-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-lg font-semibold theme-text-strong">{pickText(locale, { en: meta.en, vi: meta.vi })}</p>
                    <p className="mt-2 text-sm leading-7 theme-text-soft">
                      {locale === "en"
                        ? "Edit only the dates here. Titles, places, methods, and links stay under the main content structure."
                        : "Tại đây chỉ chỉnh ngày tháng. Tiêu đề, địa điểm, hình thức và liên kết vẫn thuộc cấu trúc nội dung chính."}
                    </p>
                  </div>
                  <StatusPill tone={meta.tone}>{items.length} {locale === "en" ? "steps" : "bước"}</StatusPill>
                </div>

                <div className="mt-5 space-y-4">
                  {items.map((item) => (
                    <div key={item.id} className="rounded-[1.5rem] border theme-border theme-panel px-4 py-4">
                      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1.7fr)_180px_180px] lg:items-end">
                        <div className="min-w-0">
                          <div className="inline-flex items-center gap-2">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border theme-border theme-panel-subtle theme-text-strong">
                              <CalendarClock className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold theme-text-strong">{pickText(locale, item.title)}</p>
                              <p className="mt-1 text-xs leading-6 theme-text-faint">{pickText(locale, item.description)}</p>
                            </div>
                          </div>
                        </div>

                        <label className="space-y-2">
                          <span className="text-xs font-semibold uppercase tracking-[0.22em] theme-text-soft">
                            {locale === "en" ? "Start date" : "Ngày bắt đầu"}
                          </span>
                          <input
                            type="date"
                            value={item.startDate}
                            onChange={(event) => handleDateChange(item.id, "startDate", event.target.value)}
                            className={fieldClassName}
                          />
                        </label>

                        <label className="space-y-2">
                          <span className="text-xs font-semibold uppercase tracking-[0.22em] theme-text-soft">
                            {locale === "en" ? "End date" : "Ngày kết thúc"}
                          </span>
                          <input
                            type="date"
                            value={item.endDate}
                            onChange={(event) => handleDateChange(item.id, "endDate", event.target.value)}
                            className={fieldClassName}
                          />
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </Surface>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
