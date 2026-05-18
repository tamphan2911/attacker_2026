"use client";

import { useCallback, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import type { Locale } from "@/types/site";

function cn(...values: Array<string | undefined | false>) {
  return values.filter(Boolean).join(" ");
}

export const ADMIN_TABLE_PAGE_SIZE = 20;
export const ADMIN_LIST_TABLE_PAGE_SIZE = 10;

export function useAdminTablePagination<T>(
  rows: T[],
  pageSize = ADMIN_TABLE_PAGE_SIZE,
  initialPage = 1,
) {
  const [pageState, setPageState] = useState(() => Math.max(1, initialPage));
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const page = Math.min(pageState, pageCount);
  const setPage = useCallback((nextPage: number) => {
    setPageState(Math.max(1, Math.min(nextPage, pageCount)));
  }, [pageCount]);

  const paginatedRows = useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    return rows.slice(startIndex, startIndex + pageSize);
  }, [page, pageSize, rows]);

  const startIndex = rows.length === 0 ? 0 : (page - 1) * pageSize;

  return {
    page,
    setPage,
    pageCount,
    pageSize,
    startIndex,
    paginatedRows,
  };
}

function buildVisiblePages(page: number, pageCount: number) {
  if (pageCount <= 5) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }

  const start = Math.max(1, Math.min(page - 2, pageCount - 4));
  return Array.from({ length: 5 }, (_, index) => start + index);
}

export function AdminTablePagination({
  locale,
  page,
  pageCount,
  pageSize,
  totalRows,
  onPageChange,
}: {
  locale: Locale;
  page: number;
  pageCount: number;
  pageSize: number;
  totalRows: number;
  onPageChange: (nextPage: number) => void;
}) {
  if (totalRows <= pageSize) {
    return null;
  }

  const visiblePages = buildVisiblePages(page, pageCount);
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalRows);

  return (
    <div className="flex flex-col gap-3 border-t theme-border px-4 py-4 md:flex-row md:items-center md:justify-between">
      <p className="text-xs font-medium uppercase tracking-[0.18em] theme-text-soft">
        {locale === "en"
          ? `Showing ${from}-${to} of ${totalRows}`
          : `Hiển thị ${from}-${to} / ${totalRows}`}
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border theme-border theme-panel text-sm font-semibold theme-text-strong disabled:cursor-not-allowed disabled:opacity-45"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {visiblePages[0] > 1 ? (
          <>
            <button
              type="button"
              onClick={() => onPageChange(1)}
              className="inline-flex h-10 min-w-10 items-center justify-center rounded-full border theme-border theme-panel px-3 text-sm font-semibold theme-text-strong"
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
            onClick={() => onPageChange(value)}
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
              onClick={() => onPageChange(pageCount)}
              className="inline-flex h-10 min-w-10 items-center justify-center rounded-full border theme-border theme-panel px-3 text-sm font-semibold theme-text-strong"
            >
              {pageCount}
            </button>
          </>
        ) : null}

        <button
          type="button"
          disabled={page === pageCount}
          onClick={() => onPageChange(page + 1)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border theme-border theme-panel text-sm font-semibold theme-text-strong disabled:cursor-not-allowed disabled:opacity-45"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
