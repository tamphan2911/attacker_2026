"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, FileText, ImageIcon, Search, Trash2, X } from "lucide-react";

import { ADMIN_TITLE_ID, useAdminTitleScroll } from "@/components/admin-title-scroll";
import {
  ADMIN_LIST_TABLE_PAGE_SIZE,
  AdminTablePagination,
  useAdminTablePagination,
} from "@/components/admin-table-pagination";
import { useSiteState } from "@/components/providers/site-state-provider";
import { StatusPill, Surface } from "@/components/site-ui";
import type {
  AdminStorageImageRow,
  AdminStorageReference,
  AdminStorageSubmissionFileRow,
} from "@/types/admin-storage";

type StorageMode = "images" | "submission-files";
type StorageRow = AdminStorageImageRow | AdminStorageSubmissionFileRow;
type DeleteDialogState =
  | { kind: "confirm"; row: StorageRow }
  | { kind: "blocked"; row: StorageRow; message: string; references: AdminStorageReference[] }
  | null;

function cn(...values: Array<string | undefined | false>) {
  return values.filter(Boolean).join(" ");
}

function formatFileSize(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 KB";
  }

  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value >= 10 || unitIndex === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[unitIndex]}`;
}

function formatDateTime(locale: "en" | "vi", value?: string) {
  if (!value) {
    return "--";
  }

  return new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function referenceText(reference: AdminStorageReference) {
  return [reference.label, reference.detail].filter(Boolean).join(": ");
}

function ReferenceList({ references }: { references: AdminStorageReference[] }) {
  if (!references.length) {
    return <span className="text-xs theme-text-soft">--</span>;
  }

  return (
    <div className="space-y-1.5">
      {references.slice(0, 3).map((reference, index) => (
        reference.href ? (
          <Link
            key={`${reference.label}-${reference.detail ?? ""}-${index}`}
            href={reference.href}
            className="block max-w-[320px] truncate text-xs font-semibold text-[var(--brand)] transition hover:opacity-75"
          >
            {referenceText(reference)}
          </Link>
        ) : (
          <p
            key={`${reference.label}-${reference.detail ?? ""}-${index}`}
            className="max-w-[320px] truncate text-xs font-semibold theme-text-strong"
          >
            {referenceText(reference)}
          </p>
        )
      ))}
      {references.length > 3 ? (
        <p className="text-xs theme-text-soft">{`+${references.length - 3} more`}</p>
      ) : null}
    </div>
  );
}

function buildBlockedMessage(
  locale: "en" | "vi",
  error: string,
  references: AdminStorageReference[],
) {
  const referenceLines = references.slice(0, 6).map((reference) => `- ${referenceText(reference)}`);
  if (!referenceLines.length) {
    return error;
  }

  return locale === "en"
    ? `${error}\n\nCurrently used by:\n${referenceLines.join("\n")}`
    : `${error}\n\nĐang được dùng bởi:\n${referenceLines.join("\n")}`;
}

function getRowIdentity(row: StorageRow) {
  return "category" in row
    ? `${row.category}/${row.storageKey}`
    : row.storageKey;
}

function buildStorageTotals(rows: StorageRow[]) {
  const totalBytes = rows.reduce((sum, row) => sum + row.sizeBytes, 0);
  const usedRows = rows.filter((row) => row.usedBy.length > 0);
  const deletableRows = rows.filter((row) => row.usedBy.length === 0);

  return {
    totalCount: rows.length,
    totalBytes,
    usedCount: usedRows.length,
    usedBytes: usedRows.reduce((sum, row) => sum + row.sizeBytes, 0),
    deletableCount: deletableRows.length,
    deletableBytes: deletableRows.reduce((sum, row) => sum + row.sizeBytes, 0),
  };
}

function StorageStatCard({
  label,
  value,
  detail,
  tone = "default",
}: {
  label: string;
  value: string;
  detail: string;
  tone?: "default" | "used" | "deletable";
}) {
  return (
    <div
      className={cn(
        "rounded-[1.25rem] border px-4 py-3",
        tone === "used"
          ? "border-amber-300/45 bg-amber-50/80 dark:border-amber-200/20 dark:bg-amber-300/10"
          : tone === "deletable"
            ? "border-emerald-300/45 bg-emerald-50/80 dark:border-emerald-200/20 dark:bg-emerald-300/10"
            : "theme-border theme-panel-strong",
      )}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.2em] theme-text-soft">{label}</p>
      <p className="mt-2 text-2xl font-semibold theme-text-strong">{value}</p>
      <p className="mt-1 text-xs font-medium theme-text-muted">{detail}</p>
    </div>
  );
}

function DeleteDialog({
  state,
  locale,
  mode,
  deleting,
  onClose,
  onConfirm,
}: {
  state: DeleteDialogState;
  locale: "en" | "vi";
  mode: StorageMode;
  deleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!state) {
    return null;
  }

  const isImage = mode === "images";
  const blocked = state.kind === "blocked";
  const references = state.kind === "blocked" ? state.references : state.row.usedBy;
  const rowIdentity = getRowIdentity(state.row);
  const title = blocked
    ? locale === "en"
      ? "This file cannot be deleted"
      : "Không thể xóa tệp này"
    : isImage
      ? locale === "en"
        ? "Delete uploaded image?"
        : "Xóa hình ảnh đã tải lên?"
      : locale === "en"
        ? "Delete uploaded PDF?"
        : "Xóa tệp PDF đã tải lên?";
  const description = blocked
    ? state.message
    : isImage
      ? locale === "en"
        ? "This image is not referenced by the site right now. Deleting it will permanently remove the file from service storage and it cannot be restored from this admin page."
        : "Hình ảnh này hiện không được website tham chiếu. Khi xóa, tệp sẽ bị gỡ vĩnh viễn khỏi storage của service và không thể khôi phục từ trang admin này."
      : locale === "en"
        ? "This PDF is not attached to any team submission right now. Deleting it will permanently remove the file from service storage and it cannot be restored from this admin page."
        : "Tệp PDF này hiện không gắn với bài nộp nào của đội. Khi xóa, tệp sẽ bị gỡ vĩnh viễn khỏi storage của service và không thể khôi phục từ trang admin này.";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
      <button
        type="button"
        aria-label={locale === "en" ? "Close dialog" : "Đóng hộp thoại"}
        className="absolute inset-0 bg-slate-950/48 backdrop-blur-sm"
        onClick={deleting ? undefined : onClose}
      />
      <div className="theme-panel theme-card-shadow relative w-full max-w-2xl overflow-hidden rounded-[1.75rem] border theme-border">
        <div className={cn(
          "border-b px-5 py-5 theme-border md:px-6",
          blocked
            ? "bg-amber-50/80 dark:bg-amber-300/10"
            : "bg-red-50/80 dark:bg-red-400/10",
        )}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex gap-3">
              <div className={cn(
                "mt-0.5 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border",
                blocked
                  ? "border-amber-300/50 bg-amber-100 text-amber-800 dark:border-amber-200/20 dark:bg-amber-300/15 dark:text-amber-100"
                  : "border-red-300/50 bg-red-100 text-red-800 dark:border-red-200/20 dark:bg-red-400/15 dark:text-red-100",
              )}>
                {blocked ? <AlertTriangle className="h-5 w-5" /> : <Trash2 className="h-5 w-5" />}
              </div>
              <div>
                <h2 className="theme-heading text-xl font-semibold theme-text-strong">{title}</h2>
                <p className="mt-2 text-sm leading-6 theme-text-muted">{description}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={deleting}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border theme-border theme-panel-strong disabled:opacity-50"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="space-y-4 px-5 py-5 md:px-6">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-[1.15rem] border theme-border theme-panel-strong px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] theme-text-soft">
                {isImage ? (locale === "en" ? "Image key" : "Mã hình ảnh") : (locale === "en" ? "PDF key" : "Mã PDF")}
              </p>
              <p className="mt-2 break-all font-mono text-xs theme-text-body">{rowIdentity}</p>
            </div>
            <div className="rounded-[1.15rem] border theme-border theme-panel-strong px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] theme-text-soft">
                {locale === "en" ? "Storage size" : "Dung lượng"}
              </p>
              <p className="mt-2 text-lg font-semibold theme-text-strong">{formatFileSize(state.row.sizeBytes)}</p>
              <p className="mt-1 text-xs theme-text-muted">
                {locale === "en" ? "Last updated " : "Cập nhật lần cuối "}
                {formatDateTime(locale, state.row.updatedAt)}
              </p>
            </div>
          </div>

          {references.length ? (
            <div className="rounded-[1.15rem] border border-amber-300/45 bg-amber-50/80 px-4 py-4 dark:border-amber-200/20 dark:bg-amber-300/10">
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                {locale === "en" ? "Current references" : "Nơi đang sử dụng"}
              </p>
              <div className="mt-3 space-y-2">
                {references.slice(0, 8).map((reference, index) => (
                  reference.href ? (
                    <Link
                      key={`${reference.label}-${reference.detail ?? ""}-${index}`}
                      href={reference.href}
                      className="block rounded-xl border border-amber-300/35 bg-white/65 px-3 py-2 text-sm font-semibold text-amber-900 transition hover:opacity-75 dark:border-amber-200/15 dark:bg-white/5 dark:text-amber-100"
                    >
                      {referenceText(reference)}
                    </Link>
                  ) : (
                    <p
                      key={`${reference.label}-${reference.detail ?? ""}-${index}`}
                      className="rounded-xl border border-amber-300/35 bg-white/65 px-3 py-2 text-sm font-semibold text-amber-900 dark:border-amber-200/15 dark:bg-white/5 dark:text-amber-100"
                    >
                      {referenceText(reference)}
                    </p>
                  )
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-[1.15rem] border border-emerald-300/45 bg-emerald-50/80 px-4 py-4 dark:border-emerald-200/20 dark:bg-emerald-300/10">
              <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
                {locale === "en"
                  ? "No active references were found for this file."
                  : "Không tìm thấy tham chiếu đang dùng cho tệp này."}
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col-reverse gap-3 border-t theme-border px-5 py-4 sm:flex-row sm:justify-end md:px-6">
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="theme-button-secondary inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold disabled:opacity-50"
          >
            {locale === "en" ? "Cancel" : "Hủy"}
          </button>
          {!blocked ? (
            <button
              type="button"
              onClick={onConfirm}
              disabled={deleting}
              className="theme-button-danger inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-55"
            >
              <Trash2 className={cn("h-4 w-4", deleting && "animate-pulse")} />
              {deleting
                ? locale === "en" ? "Deleting..." : "Đang xóa..."
                : locale === "en" ? "Delete permanently" : "Xóa vĩnh viễn"}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function AdminStorageManager({ mode }: { mode: StorageMode }) {
  const { locale, currentUser } = useSiteState();
  const [imageRows, setImageRows] = useState<AdminStorageImageRow[]>([]);
  const [fileRows, setFileRows] = useState<AdminStorageSubmissionFileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [deletingKey, setDeletingKey] = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<DeleteDialogState>(null);

  useAdminTitleScroll();

  const isImageMode = mode === "images";
  const canDelete = currentUser.role === "admin";

  async function loadRows() {
    try {
      setLoading(true);
      setError("");
      const endpoint = isImageMode
        ? "/api/admin/storage/images"
        : "/api/admin/storage/submission-files";
      const response = await fetch(endpoint, { credentials: "same-origin" });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !Array.isArray(payload)) {
        throw new Error(
          payload?.error ??
            (locale === "en" ? "Could not load uploaded files." : "Không thể tải danh sách tệp."),
        );
      }
      if (isImageMode) {
        setImageRows(payload as AdminStorageImageRow[]);
      } else {
        setFileRows(payload as AdminStorageSubmissionFileRow[]);
      }
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Could not load uploaded files.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const filteredImages = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return imageRows;
    }

    return imageRows.filter((row) =>
      [
        row.category,
        row.storageKey,
        row.url,
        ...row.usedBy.map(referenceText),
      ].join(" ").toLowerCase().includes(query),
    );
  }, [imageRows, search]);

  const filteredFiles = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return fileRows;
    }

    return fileRows.filter((row) =>
      [
        row.storageKey,
        ...row.usedBy.map(referenceText),
      ].join(" ").toLowerCase().includes(query),
    );
  }, [fileRows, search]);

  const activeRows = isImageMode ? filteredImages : filteredFiles;
  const allRows = isImageMode ? imageRows : fileRows;
  const storageTotals = useMemo(() => buildStorageTotals(allRows), [allRows]);
  const {
    page,
    setPage,
    pageCount,
    pageSize,
    startIndex,
    paginatedRows,
  } = useAdminTablePagination(activeRows, ADMIN_LIST_TABLE_PAGE_SIZE);

  function openDeleteDialog(row: StorageRow) {
    if (!canDelete) {
      return;
    }

    if (row.usedBy.length) {
      setDeleteDialog({
        kind: "blocked",
        row,
        message: isImageMode
          ? locale === "en"
            ? "This image is currently used by the website. Replace or remove the reference below before deleting this file from service storage."
            : "Hình ảnh này đang được website sử dụng. Hãy thay thế hoặc gỡ tham chiếu bên dưới trước khi xóa tệp khỏi storage của service."
          : locale === "en"
            ? "This PDF is currently attached to a team submission. Delete the submission record first so the site does not keep a broken download link."
            : "Tệp PDF này đang gắn với bài nộp của đội. Hãy xóa bài nộp trước để website không giữ đường dẫn tải xuống bị hỏng.",
        references: row.usedBy,
      });
      return;
    }

    setDeleteDialog({ kind: "confirm", row });
  }

  async function confirmDeleteFromDialog() {
    if (!deleteDialog || deleteDialog.kind !== "confirm") {
      return;
    }

    const row = deleteDialog.row;
    const endpoint = "category" in row
      ? `/api/admin/storage/images?category=${encodeURIComponent(row.category)}&key=${encodeURIComponent(row.storageKey)}`
      : `/api/admin/storage/submission-files?key=${encodeURIComponent(row.storageKey)}`;

    await deleteStoredFile(endpoint, row.storageKey);
  }

  async function deleteStoredFile(endpoint: string, storageKey: string) {
    try {
      setDeletingKey(storageKey);
      const response = await fetch(endpoint, {
        method: "DELETE",
        credentials: "same-origin",
      });
      const payload = (await response.json().catch(() => null)) as
        | { error?: string; references?: AdminStorageReference[] }
        | null;

      if (!response.ok) {
        setDeleteDialog({
          kind: "blocked",
          row: deleteDialog?.kind === "confirm" ? deleteDialog.row : { storageKey, sizeBytes: 0, updatedAt: "", usedBy: [] },
          message:
            payload?.error ??
            (locale === "en" ? "Could not delete this file." : "Không thể xóa tệp này."),
          references: payload?.references ?? [],
        });
        return;
      }

      await loadRows();
      setDeleteDialog(null);
    } catch (nextError) {
      setDeleteDialog({
        kind: "blocked",
        row: deleteDialog?.kind === "confirm" ? deleteDialog.row : { storageKey, sizeBytes: 0, updatedAt: "", usedBy: [] },
        message:
          nextError instanceof Error
            ? buildBlockedMessage(locale, nextError.message, [])
            : locale === "en"
              ? "Could not delete this file."
              : "Không thể xóa tệp này.",
        references: [],
      });
    } finally {
      setDeletingKey(null);
    }
  }

  const title = isImageMode
    ? locale === "en"
      ? "Uploaded image management"
      : "Quản lý hình ảnh đã tải lên"
    : locale === "en"
      ? "Submission PDF management"
      : "Quản lý PDF bài nộp";

  const description = isImageMode
    ? locale === "en"
      ? "Review images stored on the service. Admins can delete unused images; files currently referenced by the site are protected."
      : "Rà soát hình ảnh đang nằm trên storage của service. Admin có thể xóa ảnh không còn dùng; ảnh đang được website tham chiếu sẽ được bảo vệ."
    : locale === "en"
      ? "Review uploaded team submission PDFs from Round 2, Final round, and Emerging round. Attached files are protected from direct deletion."
      : "Rà soát PDF bài nộp của đội ở Vòng 2, chung kết và Vòng Đội Ươm mầm. Tệp còn gắn với bài nộp sẽ không thể xóa trực tiếp.";

  if (loading) {
    return (
      <Surface className="px-6 py-10 text-center text-sm theme-text-muted">
        {locale === "en" ? "Loading uploaded files..." : "Đang tải danh sách tệp..."}
      </Surface>
    );
  }

  return (
    <div className="space-y-6">
      <section id={ADMIN_TITLE_ID} className="theme-page-intro theme-card-shadow-soft rounded-[2rem] border px-5 py-7 md:px-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-4">
            <p className="theme-eyebrow text-xs font-semibold uppercase tracking-[0.34em]">
              {locale === "en" ? "Service storage" : "Storage của service"}
            </p>
            <h1 className="theme-heading theme-text-strong text-3xl font-semibold tracking-tight md:text-[2.8rem]">
              {title}
            </h1>
            <p className="theme-text-muted text-base leading-8">{description}</p>
          </div>
          <div className="grid gap-3 sm:min-w-[560px] sm:grid-cols-3">
            <StorageStatCard
              label={locale === "en" ? "Total storage" : "Tổng storage"}
              value={formatFileSize(storageTotals.totalBytes)}
              detail={
                locale === "en"
                  ? `${storageTotals.totalCount} file${storageTotals.totalCount === 1 ? "" : "s"}`
                  : `${storageTotals.totalCount} tệp`
              }
            />
            <StorageStatCard
              label={locale === "en" ? "In use" : "Đang dùng"}
              value={formatFileSize(storageTotals.usedBytes)}
              detail={
                locale === "en"
                  ? `${storageTotals.usedCount} protected file${storageTotals.usedCount === 1 ? "" : "s"}`
                  : `${storageTotals.usedCount} tệp được bảo vệ`
              }
              tone="used"
            />
            <StorageStatCard
              label={locale === "en" ? "Deletable" : "Có thể xóa"}
              value={formatFileSize(storageTotals.deletableBytes)}
              detail={
                locale === "en"
                  ? `${storageTotals.deletableCount} unused file${storageTotals.deletableCount === 1 ? "" : "s"}`
                  : `${storageTotals.deletableCount} tệp không còn dùng`
              }
              tone="deletable"
            />
          </div>
        </div>
      </section>

      {error ? (
        <Surface className="border-red-300/60 bg-red-50/80 px-5 py-4 text-sm font-semibold text-red-800 dark:border-red-300/30 dark:bg-red-400/10 dark:text-red-100">
          {error}
        </Surface>
      ) : null}

      <Surface className="overflow-hidden">
        <div className="flex flex-col gap-4 border-b theme-border px-4 py-4 md:flex-row md:items-center md:justify-between">
          <label className="relative block md:w-[360px]">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 theme-text-soft" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={locale === "en" ? "Search file, category, reference..." : "Tìm tệp, nhóm, nơi sử dụng..."}
              className="theme-input w-full rounded-full border py-3 pl-11 pr-4 text-sm"
            />
          </label>
          <p className="text-xs font-medium uppercase tracking-[0.18em] theme-text-soft">
            {canDelete
              ? locale === "en"
                ? "Delete is blocked for files still in use"
                : "Không thể xóa tệp đang được sử dụng"
              : locale === "en"
                ? "Only admin accounts can delete files"
                : "Chỉ tài khoản admin được xóa tệp"}
          </p>
        </div>

        <div className="overflow-x-auto">
          {isImageMode ? (
            <table className="min-w-[980px] divide-y theme-border text-left text-sm">
              <thead className="theme-panel-strong">
                <tr>
                  {["#", locale === "en" ? "Image" : "Hình ảnh", locale === "en" ? "Category" : "Nhóm", "Storage key", locale === "en" ? "Size" : "Dung lượng", locale === "en" ? "Updated" : "Cập nhật", locale === "en" ? "Status" : "Trạng thái", locale === "en" ? "Used by" : "Đang dùng bởi", locale === "en" ? "Delete" : "Xóa"].map((label) => (
                    <th key={label} className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] theme-text-soft">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(paginatedRows as AdminStorageImageRow[]).map((row, index) => (
                  <tr key={`${row.category}-${row.storageKey}`} className="border-b theme-border last:border-b-0">
                    <td className="px-4 py-4 text-xs font-semibold theme-text-soft">{startIndex + index + 1}</td>
                    <td className="px-4 py-4">
                      <a href={row.url} target="_blank" rel="noreferrer" className="block h-14 w-14 overflow-hidden rounded-xl border theme-border theme-panel-strong">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={row.url} alt="" className="h-full w-full object-cover" />
                      </a>
                    </td>
                    <td className="px-4 py-4">
                      <span className="rounded-full border theme-border theme-panel-strong px-3 py-1 text-xs font-semibold theme-text-strong">
                        {row.category}
                      </span>
                    </td>
                    <td className="max-w-[260px] px-4 py-4">
                      <p className="truncate font-mono text-xs theme-text-body" title={row.storageKey}>{row.storageKey}</p>
                    </td>
                    <td className="px-4 py-4 theme-text-body">{formatFileSize(row.sizeBytes)}</td>
                    <td className="px-4 py-4 theme-text-body">{formatDateTime(locale, row.updatedAt)}</td>
                    <td className="px-4 py-4">
                      <StatusPill tone={row.usedBy.length ? "warning" : "success"}>
                        {row.usedBy.length
                          ? locale === "en" ? "In use" : "Đang dùng"
                          : locale === "en" ? "Free" : "Có thể xóa"}
                      </StatusPill>
                    </td>
                    <td className="px-4 py-4"><ReferenceList references={row.usedBy} /></td>
                    <td className="px-4 py-4">
                      <button
                        type="button"
                        onClick={() => openDeleteDialog(row)}
                        disabled={!canDelete || deletingKey === row.storageKey}
                        title={locale === "en" ? "Delete image" : "Xóa hình ảnh"}
                        aria-label={locale === "en" ? "Delete image" : "Xóa hình ảnh"}
                        className={cn(
                          "theme-button-danger inline-flex h-10 w-10 items-center justify-center rounded-full disabled:cursor-not-allowed disabled:opacity-45",
                          deletingKey === row.storageKey && "animate-pulse",
                        )}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="min-w-[880px] divide-y theme-border text-left text-sm">
              <thead className="theme-panel-strong">
                <tr>
                  {["#", locale === "en" ? "PDF file" : "Tệp PDF", "Storage key", locale === "en" ? "Size" : "Dung lượng", locale === "en" ? "Updated" : "Cập nhật", locale === "en" ? "Status" : "Trạng thái", locale === "en" ? "Attached to" : "Gắn với", locale === "en" ? "Delete" : "Xóa"].map((label) => (
                    <th key={label} className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] theme-text-soft">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(paginatedRows as AdminStorageSubmissionFileRow[]).map((row, index) => (
                  <tr key={row.storageKey} className="border-b theme-border last:border-b-0">
                    <td className="px-4 py-4 text-xs font-semibold theme-text-soft">{startIndex + index + 1}</td>
                    <td className="px-4 py-4">
                      <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl border theme-border theme-panel-strong text-[var(--brand)]">
                        <FileText className="h-5 w-5" />
                      </div>
                    </td>
                    <td className="max-w-[360px] px-4 py-4">
                      <p className="truncate font-mono text-xs theme-text-body" title={row.storageKey}>{row.storageKey}</p>
                    </td>
                    <td className="px-4 py-4 theme-text-body">{formatFileSize(row.sizeBytes)}</td>
                    <td className="px-4 py-4 theme-text-body">{formatDateTime(locale, row.updatedAt)}</td>
                    <td className="px-4 py-4">
                      <StatusPill tone={row.usedBy.length ? "warning" : "success"}>
                        {row.usedBy.length
                          ? locale === "en" ? "Attached" : "Đang gắn"
                          : locale === "en" ? "Orphan file" : "Tệp rời"}
                      </StatusPill>
                    </td>
                    <td className="px-4 py-4"><ReferenceList references={row.usedBy} /></td>
                    <td className="px-4 py-4">
                      <button
                        type="button"
                        onClick={() => openDeleteDialog(row)}
                        disabled={!canDelete || deletingKey === row.storageKey}
                        title={locale === "en" ? "Delete PDF file" : "Xóa tệp PDF"}
                        aria-label={locale === "en" ? "Delete PDF file" : "Xóa tệp PDF"}
                        className={cn(
                          "theme-button-danger inline-flex h-10 w-10 items-center justify-center rounded-full disabled:cursor-not-allowed disabled:opacity-45",
                          deletingKey === row.storageKey && "animate-pulse",
                        )}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {activeRows.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl border theme-border theme-panel-strong text-[var(--brand)]">
              {isImageMode ? <ImageIcon className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
            </div>
            <p className="mt-4 text-sm font-semibold theme-text-strong">
              {locale === "en" ? "No uploaded files found" : "Chưa tìm thấy tệp đã tải lên"}
            </p>
          </div>
        ) : null}

        <AdminTablePagination
          locale={locale}
          page={page}
          pageCount={pageCount}
          pageSize={pageSize}
          totalRows={activeRows.length}
          onPageChange={setPage}
        />
      </Surface>
      <DeleteDialog
        state={deleteDialog}
        locale={locale}
        mode={mode}
        deleting={Boolean(deletingKey)}
        onClose={() => {
          if (!deletingKey) {
            setDeleteDialog(null);
          }
        }}
        onConfirm={() => {
          void confirmDeleteFromDialog();
        }}
      />
    </div>
  );
}
