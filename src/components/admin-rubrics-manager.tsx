"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileText,
  LoaderCircle,
  UploadCloud,
} from "lucide-react";

import { ADMIN_TITLE_ID, useAdminTitleScroll } from "@/components/admin-title-scroll";
import { useSiteState } from "@/components/providers/site-state-provider";
import { SectionHeading, StatusPill, Surface } from "@/components/site-ui";
import {
  getReportTemplateFileValidationError,
  MAX_REPORT_TEMPLATE_FILE_BYTES,
  reportTemplateFileDefinitions,
  type ReportTemplateFileId,
} from "@/lib/report-template-files";
import {
  getRubricFileValidationError,
  MAX_RUBRIC_FILE_BYTES,
  rubricFileDefinitions,
  type RubricFileId,
} from "@/lib/rubric-files";
import { pickText } from "@/lib/site";

type RubricRecord = {
  id: RubricFileId;
  fileName: string;
  sizeBytes: number;
  updatedAt: string;
  downloadUrl: string;
};

type ReportTemplateRecord = {
  id: ReportTemplateFileId;
  fileName: string;
  sizeBytes: number;
  updatedAt: string;
  downloadUrl: string;
};

function formatFileSize(bytes: number) {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function formatDateTime(locale: "en" | "vi", value: string) {
  return new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function AdminRubricsManager() {
  const { locale } = useSiteState();
  const [rubrics, setRubrics] = useState<RubricRecord[]>([]);
  const [templates, setTemplates] = useState<ReportTemplateRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState<RubricFileId | null>(null);
  const [uploadingTemplateId, setUploadingTemplateId] = useState<ReportTemplateFileId | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  useAdminTitleScroll();

  const rubricMap = useMemo(
    () => new Map<RubricFileId, RubricRecord>(rubrics.map((rubric) => [rubric.id, rubric])),
    [rubrics],
  );
  const templateMap = useMemo(
    () => new Map<ReportTemplateFileId, ReportTemplateRecord>(templates.map((template) => [template.id, template])),
    [templates],
  );

  useEffect(() => {
    let active = true;

    async function loadRubrics() {
      setLoading(true);
      setError("");

      try {
        const [rubricsResponse, templatesResponse] = await Promise.all([
          fetch("/api/admin/rubrics", { cache: "no-store" }),
          fetch("/api/admin/report-templates", { cache: "no-store" }),
        ]);
        const rubricsPayload = (await rubricsResponse.json().catch(() => null)) as { rubrics?: RubricRecord[]; error?: string } | null;
        const templatesPayload = (await templatesResponse.json().catch(() => null)) as { templates?: ReportTemplateRecord[]; error?: string } | null;

        if (!rubricsResponse.ok) {
          throw new Error(rubricsPayload?.error ?? "Could not load rubric files.");
        }

        if (!templatesResponse.ok) {
          throw new Error(templatesPayload?.error ?? "Could not load report template files.");
        }

        if (active) {
          setRubrics(rubricsPayload?.rubrics ?? []);
          setTemplates(templatesPayload?.templates ?? []);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Could not load rubric files.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadRubrics();

    return () => {
      active = false;
    };
  }, []);

  const uploadRubric = async (rubricId: RubricFileId, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    event.target.value = "";
    setMessage("");
    setError("");

    const validationError = getRubricFileValidationError(file);
    if (validationError === "missing") {
      return;
    }

    if (validationError === "type") {
      setError(locale === "en" ? "Only PDF files are allowed." : "Chỉ chấp nhận tệp PDF.");
      return;
    }

    if (validationError === "size") {
      setError(
        locale === "en"
          ? `The uploaded PDF must be ${Math.round(MAX_RUBRIC_FILE_BYTES / 1024 / 1024)}MB or smaller.`
          : `Tệp PDF tải lên phải có dung lượng tối đa ${Math.round(MAX_RUBRIC_FILE_BYTES / 1024 / 1024)}MB.`,
      );
      return;
    }

    if (!file) {
      return;
    }

    setUploadingId(rubricId);

    const formData = new FormData();
    formData.append("rubricId", rubricId);
    formData.append("rubricFile", file);

    try {
      const response = await fetch("/api/admin/rubrics", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json().catch(() => null)) as { rubric?: RubricRecord; error?: string } | null;

      if (!response.ok || !payload?.rubric) {
        throw new Error(payload?.error ?? "The rubric PDF could not be uploaded.");
      }

      setRubrics((current) => {
        const next = current.filter((rubric) => rubric.id !== payload.rubric!.id);
        return [...next, payload.rubric!];
      });
      setMessage(locale === "en" ? "Rubric PDF uploaded successfully." : "Đã tải rubric PDF thành công.");
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "The rubric PDF could not be uploaded.");
    } finally {
      setUploadingId(null);
    }
  };

  const uploadTemplate = async (templateId: ReportTemplateFileId, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    event.target.value = "";
    setMessage("");
    setError("");

    const validationError = getReportTemplateFileValidationError(file);
    if (validationError === "missing") {
      return;
    }

    if (validationError === "type") {
      setError(locale === "en" ? "Only Word files (.doc or .docx) are allowed." : "Chỉ chấp nhận tệp Word (.doc hoặc .docx).");
      return;
    }

    if (validationError === "size") {
      setError(
        locale === "en"
          ? `The uploaded Word file must be ${Math.round(MAX_REPORT_TEMPLATE_FILE_BYTES / 1024 / 1024)}MB or smaller.`
          : `Tệp Word tải lên phải có dung lượng tối đa ${Math.round(MAX_REPORT_TEMPLATE_FILE_BYTES / 1024 / 1024)}MB.`,
      );
      return;
    }

    if (!file) {
      return;
    }

    setUploadingTemplateId(templateId);

    const formData = new FormData();
    formData.append("templateId", templateId);
    formData.append("templateFile", file);

    try {
      const response = await fetch("/api/admin/report-templates", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json().catch(() => null)) as { template?: ReportTemplateRecord; error?: string } | null;

      if (!response.ok || !payload?.template) {
        throw new Error(payload?.error ?? "The report template could not be uploaded.");
      }

      setTemplates((current) => {
        const next = current.filter((template) => template.id !== payload.template!.id);
        return [...next, payload.template!];
      });
      setMessage(locale === "en" ? "Report template uploaded successfully." : "Đã tải mẫu báo cáo thành công.");
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "The report template could not be uploaded.");
    } finally {
      setUploadingTemplateId(null);
    }
  };

  return (
    <div className="space-y-8">
      <SectionHeading
        id={ADMIN_TITLE_ID}
        eyebrow={locale === "en" ? "Rules downloads" : "Tệp tải xuống trang thể lệ"}
        title={locale === "en" ? "Rubric and report template manager" : "Quản lý rubric và mẫu báo cáo"}
        description={
          locale === "en"
            ? "Upload the public rubric PDFs and the Round 2 report template used by the Rules page. Files must be 10MB or smaller."
            : "Tải lên các file rubric PDF và mẫu báo cáo Vòng 2 dùng trên trang Thể lệ. Mỗi file phải có dung lượng tối đa 10MB."
        }
      />

      {error ? (
        <div className="rounded-[1.35rem] border border-rose-500/24 bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-800 dark:text-rose-100">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-4.5 w-4.5 shrink-0" />
            <span>{error}</span>
          </div>
        </div>
      ) : null}

      {message ? (
        <div className="rounded-[1.35rem] border border-emerald-500/24 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-800 dark:text-emerald-100">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-4.5 w-4.5 shrink-0" />
            <span>{message}</span>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-3">
        {rubricFileDefinitions.map((definition) => {
          const record = rubricMap.get(definition.id);
          const uploading = uploadingId === definition.id;

          return (
            <Surface key={definition.id} className="px-5 py-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] theme-eyebrow">
                    {locale === "en" ? "Rubric slot" : "Vị trí rubric"}
                  </p>
                  <p className="mt-3 text-lg font-semibold theme-text-strong">
                    {pickText(locale, definition.label)}
                  </p>
                </div>
                <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[1.1rem] border theme-border theme-panel-strong text-[var(--brand)]">
                  <FileText className="h-5 w-5" />
                </span>
              </div>

              <div className="mt-5 rounded-[1.35rem] border theme-border theme-panel-subtle px-4 py-4">
                {loading ? (
                  <div className="flex items-center gap-2 text-sm theme-text-muted">
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    {locale === "en" ? "Checking file..." : "Đang kiểm tra file..."}
                  </div>
                ) : record ? (
                  <div className="space-y-3">
                    <StatusPill tone="success">{locale === "en" ? "Uploaded" : "Đã tải lên"}</StatusPill>
                    <div>
                      <p className="break-words text-sm font-semibold theme-text-strong">{record.fileName}</p>
                      <p className="mt-2 text-xs leading-6 theme-text-muted">
                        {formatFileSize(record.sizeBytes)} · {formatDateTime(locale, record.updatedAt)}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <StatusPill tone="warning">{locale === "en" ? "Not uploaded" : "Chưa tải lên"}</StatusPill>
                    <p className="text-sm leading-7 theme-text-muted">
                      {locale === "en"
                        ? "The public download button will stay inactive until this PDF is uploaded."
                        : "Nút tải công khai sẽ chưa hoạt động cho đến khi file PDF này được tải lên."}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <label className="theme-button-primary inline-flex cursor-pointer items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold">
                  {uploading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
                  {uploading
                    ? locale === "en"
                      ? "Uploading..."
                      : "Đang tải..."
                    : record
                      ? locale === "en"
                        ? "Replace PDF"
                        : "Thay PDF"
                      : locale === "en"
                        ? "Upload PDF"
                        : "Tải PDF"}
                  <input
                    type="file"
                    accept="application/pdf,.pdf"
                    disabled={Boolean(uploadingId)}
                    className="hidden"
                    onChange={(event) => void uploadRubric(definition.id, event)}
                  />
                </label>

                {record ? (
                  <a
                    href={record.downloadUrl}
                    className="theme-button-secondary inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold"
                  >
                    <Download className="h-4 w-4" />
                    {locale === "en" ? "Download" : "Tải xuống"}
                  </a>
                ) : null}
              </div>
            </Surface>
          );
        })}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {reportTemplateFileDefinitions.map((definition) => {
          const record = templateMap.get(definition.id);
          const uploading = uploadingTemplateId === definition.id;

          return (
            <Surface key={definition.id} className="px-5 py-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] theme-eyebrow">
                    {locale === "en" ? "Report template slot" : "Vị trí mẫu báo cáo"}
                  </p>
                  <p className="mt-3 text-lg font-semibold theme-text-strong">
                    {pickText(locale, definition.label)}
                  </p>
                </div>
                <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[1.1rem] border theme-border theme-panel-strong text-[var(--brand)]">
                  <FileText className="h-5 w-5" />
                </span>
              </div>

              <div className="mt-5 rounded-[1.35rem] border theme-border theme-panel-subtle px-4 py-4">
                {loading ? (
                  <div className="flex items-center gap-2 text-sm theme-text-muted">
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    {locale === "en" ? "Checking file..." : "Đang kiểm tra file..."}
                  </div>
                ) : record ? (
                  <div className="space-y-3">
                    <StatusPill tone="success">{locale === "en" ? "Uploaded" : "Đã tải lên"}</StatusPill>
                    <div>
                      <p className="break-words text-sm font-semibold theme-text-strong">{record.fileName}</p>
                      <p className="mt-2 text-xs leading-6 theme-text-muted">
                        {formatFileSize(record.sizeBytes)} · {formatDateTime(locale, record.updatedAt)}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <StatusPill tone="warning">{locale === "en" ? "Not uploaded" : "Chưa tải lên"}</StatusPill>
                    <p className="text-sm leading-7 theme-text-muted">
                      {locale === "en"
                        ? "The public template download button will stay inactive until this Word file is uploaded."
                        : "Nút tải mẫu công khai sẽ chưa hoạt động cho đến khi file Word này được tải lên."}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <label className="theme-button-primary inline-flex cursor-pointer items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold">
                  {uploading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
                  {uploading
                    ? locale === "en"
                      ? "Uploading..."
                      : "Đang tải..."
                    : record
                      ? locale === "en"
                        ? "Replace Word file"
                        : "Thay file Word"
                      : locale === "en"
                        ? "Upload Word file"
                        : "Tải file Word"}
                  <input
                    type="file"
                    accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    disabled={Boolean(uploadingTemplateId)}
                    className="hidden"
                    onChange={(event) => void uploadTemplate(definition.id, event)}
                  />
                </label>

                {record ? (
                  <a
                    href={record.downloadUrl}
                    className="theme-button-secondary inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold"
                  >
                    <Download className="h-4 w-4" />
                    {locale === "en" ? "Download" : "Tải xuống"}
                  </a>
                ) : null}
              </div>
            </Surface>
          );
        })}
      </div>
    </div>
  );
}
