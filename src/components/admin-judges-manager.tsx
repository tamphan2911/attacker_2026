"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowDown,
  ArrowUp,
  ImagePlus,
  KeyRound,
  PencilLine,
  Plus,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";

import { getNewsImageValidationError } from "@/lib/news-images";
import { normalizeLocalizedText, pickLocalizedText, pickText } from "@/lib/site";
import { ADMIN_TITLE_ID, useAdminTitleScroll } from "@/components/admin-title-scroll";
import {
  ADMIN_LIST_TABLE_PAGE_SIZE,
  AdminTablePagination,
  useAdminTablePagination,
} from "@/components/admin-table-pagination";
import { useSiteState } from "@/components/providers/site-state-provider";
import { SectionHeading, StatusPill, Surface } from "@/components/site-ui";
import type { CompetitionRoundKey, JudgeProfile, Locale, LocalizedText } from "@/types/site";

function cn(...values: Array<string | undefined | false>) {
  return values.filter(Boolean).join(" ");
}

const fieldClassName =
  "theme-placeholder w-full rounded-2xl border theme-border theme-panel px-4 py-3 text-sm theme-text-strong outline-none";

const tableFieldClassName =
  "w-full rounded-xl border theme-border theme-panel-subtle px-3 py-2 text-xs theme-text-body outline-none";

const roundLabels: Record<CompetitionRoundKey, LocalizedText> = {
  "round-1": { en: "Round 1", vi: "Vòng 1" },
  "round-2": { en: "Round 2", vi: "Vòng 2" },
  "round-3": { en: "Final round", vi: "Chung kết" },
};

type JudgeDraft = {
  id: string;
  name: string;
  imageSrc: string;
  organization: LocalizedText;
  role: LocalizedText;
  bio: LocalizedText;
  expertiseEnInput: string;
  expertiseViInput: string;
  avatarTone: string;
  rounds: CompetitionRoundKey[];
};

type JudgeTableFilters = {
  judge: string;
  organization: string;
  expertise: string;
};

type JudgePanelKey = "final" | "early";

function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function splitList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function matchesFilter(value: string, filterValue: string) {
  if (!filterValue) {
    return true;
  }

  return value.toLowerCase().includes(filterValue.trim().toLowerCase());
}

function getJudgeExpertiseText(locale: Locale, judge: JudgeProfile) {
  return judge.expertise.map((item) => pickText(locale, item)).filter(Boolean).join(" · ");
}

function judgeBelongsToPanel(judge: JudgeProfile, panel: JudgePanelKey) {
  return panel === "final"
    ? judge.rounds.includes("round-3")
    : judge.rounds.some((round) => round === "round-1" || round === "round-2");
}

function getJudgePanelLabel(locale: Locale, panel: JudgePanelKey) {
  if (panel === "final") {
    return locale === "en" ? "Final round judges" : "Giám khảo chung kết";
  }

  return locale === "en" ? "Round 1 & 2 judges" : "Giám khảo Vòng 1 & 2";
}

function buildJudgeOrderAfterMove(
  judges: JudgeProfile[],
  panel: JudgePanelKey,
  judgeId: string,
  direction: -1 | 1,
) {
  const panelIds = judges.filter((judge) => judgeBelongsToPanel(judge, panel)).map((judge) => judge.id);
  const currentIndex = panelIds.indexOf(judgeId);
  const nextIndex = currentIndex + direction;

  if (currentIndex < 0 || nextIndex < 0 || nextIndex >= panelIds.length) {
    return null;
  }

  const nextPanelIds = [...panelIds];
  const [movedId] = nextPanelIds.splice(currentIndex, 1);
  nextPanelIds.splice(nextIndex, 0, movedId);

  const panelIdSet = new Set(panelIds);
  let cursor = 0;

  return judges.map((judge) => (panelIdSet.has(judge.id) ? nextPanelIds[cursor++] : judge.id));
}

function draftFromJudge(judge: JudgeProfile): JudgeDraft {
  return {
    id: judge.id,
    name: judge.name,
    imageSrc: judge.imageSrc,
    organization: normalizeLocalizedText(judge.organization),
    role: { ...judge.role },
    bio: { ...judge.bio },
    expertiseEnInput: judge.expertise.map((item) => item.en).join(", "),
    expertiseViInput: judge.expertise.map((item) => item.vi).join(", "),
    avatarTone: judge.avatarTone,
    rounds: [...judge.rounds],
  };
}

function buildJudgeFromDraft(draft: JudgeDraft): JudgeProfile {
  const expertiseEn = splitList(draft.expertiseEnInput);
  const expertiseVi = splitList(draft.expertiseViInput);
  const maxLength = Math.max(expertiseEn.length, expertiseVi.length);

  return {
    id: draft.id.trim() || slugify(draft.name),
    name: draft.name.trim(),
    imageSrc: draft.imageSrc.trim(),
    organization: {
      en: draft.organization.en.trim(),
      vi: draft.organization.vi.trim(),
    },
    role: {
      en: draft.role.en.trim(),
      vi: draft.role.vi.trim(),
    },
    bio: {
      en: draft.bio.en.trim(),
      vi: draft.bio.vi.trim(),
    },
    expertise: Array.from({ length: maxLength }, (_, index) => ({
      en: expertiseEn[index] ?? "",
      vi: expertiseVi[index] ?? expertiseEn[index] ?? "",
    })).filter((item) => item.en || item.vi),
    avatarTone: draft.avatarTone.trim() || "from-sky-500 via-cyan-400 to-emerald-400",
    rounds: draft.rounds,
  };
}

function createEmptyJudgeDraft(): JudgeDraft {
  return {
    id: "",
    name: "",
    imageSrc: "/judges/nguyen-bao-chau.svg",
    organization: { en: "", vi: "" },
    role: { en: "", vi: "" },
    bio: { en: "", vi: "" },
    expertiseEnInput: "",
    expertiseViInput: "",
    avatarTone: "from-sky-500 via-cyan-400 to-emerald-400",
    rounds: ["round-2"],
  };
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

function RoundSelection({
  locale,
  value,
  onToggle,
}: {
  locale: Locale;
  value: CompetitionRoundKey[];
  onToggle: (round: CompetitionRoundKey) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm theme-text-muted">
        {locale === "en" ? "Assigned rounds" : "Vòng phụ trách"}
      </p>
      <div className="flex flex-wrap gap-2">
        {(["round-1", "round-2", "round-3"] as CompetitionRoundKey[]).map((round) => {
          const selected = value.includes(round);

          return (
            <button
              key={round}
              type="button"
              onClick={() => onToggle(round)}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-semibold transition",
                selected
                  ? "border-sky-300/28 bg-[linear-gradient(135deg,#0a1d34,#1772d0)] text-white shadow-[0_14px_34px_rgba(23,114,208,0.16)]"
                  : "theme-border theme-panel theme-text-muted hover:text-[var(--text-strong)]",
              )}
            >
              {pickText(locale, roundLabels[round])}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function JudgeFormFields({
  locale,
  draft,
  onChange,
  compact = false,
  idEditable = true,
  showIdField = true,
  autoIdFromName = false,
  imageUploadMessage,
  imageUploadHelper,
  isUploadingImage = false,
  onUploadImage,
}: {
  locale: Locale;
  draft: JudgeDraft;
  onChange: (nextDraft: JudgeDraft) => void;
  compact?: boolean;
  idEditable?: boolean;
  showIdField?: boolean;
  autoIdFromName?: boolean;
  imageUploadMessage?: string;
  imageUploadHelper?: string;
  isUploadingImage?: boolean;
  onUploadImage?: (file: File) => void;
}) {
  return (
    <div className="space-y-5">
      <div className={cn("grid gap-4", compact ? "xl:grid-cols-2" : "xl:grid-cols-[minmax(0,1fr)_280px]")}>
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm theme-text-muted">
                {locale === "en" ? "Full name" : "Họ tên"}
              </span>
              <input
                value={draft.name}
                onChange={(event) =>
                  onChange({
                    ...draft,
                    name: event.target.value,
                    id: autoIdFromName
                      ? slugify(event.target.value)
                      : idEditable && !draft.id
                        ? slugify(event.target.value)
                        : draft.id,
                  })
                }
                className={cn(fieldClassName, showIdField ? "" : "md:col-span-2")}
              />
            </label>
            {showIdField ? (
              <label className="space-y-2">
                <span className="text-sm theme-text-muted">ID</span>
                <input
                  value={draft.id}
                  onChange={(event) => onChange({ ...draft, id: slugify(event.target.value) })}
                  placeholder={locale === "en" ? "judge-round2-example" : "judge-round2-vi-du"}
                  className={`${fieldClassName} disabled:cursor-not-allowed disabled:opacity-70`}
                  disabled={!idEditable}
                />
              </label>
            ) : null}
            <label className="space-y-2 md:col-span-2">
              <span className="text-sm theme-text-muted">
                {locale === "en" ? "Image source" : "Đường dẫn hình ảnh"}
              </span>
              <input
                value={draft.imageSrc}
                onChange={(event) => onChange({ ...draft, imageSrc: event.target.value })}
                placeholder="/judges/nguyen-bao-chau.svg"
                className={fieldClassName}
              />
            </label>
            {onUploadImage ? (
              <div className="space-y-2 md:col-span-2">
                <span className="text-sm theme-text-muted">
                  {locale === "en" ? "Avatar upload" : "Tải ảnh đại diện"}
                </span>
                <div className="flex flex-wrap items-center gap-3">
                  <label className="theme-button-secondary inline-flex cursor-pointer items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold">
                    <ImagePlus className="h-4 w-4" />
                    {isUploadingImage
                      ? locale === "en"
                        ? "Uploading..."
                        : "Đang tải..."
                      : locale === "en"
                        ? "Upload avatar"
                        : "Tải ảnh"}
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) {
                          onUploadImage(file);
                        }
                        event.currentTarget.value = "";
                      }}
                    />
                  </label>
                  <p className="text-xs leading-6 theme-text-soft">
                    {imageUploadHelper}
                  </p>
                </div>
                {imageUploadMessage ? (
                  <p className="text-xs font-medium theme-text-muted">{imageUploadMessage}</p>
                ) : null}
              </div>
            ) : null}
          </div>

          <LocalizedFieldEditor
            label={locale === "en" ? "Organization" : "Tổ chức"}
            rows={2}
            value={draft.organization}
            onChange={(language, nextValue) =>
              onChange({
                ...draft,
                organization: { ...draft.organization, [language]: nextValue },
              })
            }
          />

          <LocalizedFieldEditor
            label={locale === "en" ? "Position" : "Chức vụ"}
            rows={2}
            value={draft.role}
            onChange={(language, nextValue) =>
              onChange({
                ...draft,
                role: { ...draft.role, [language]: nextValue },
              })
            }
          />

          <LocalizedFieldEditor
            label={locale === "en" ? "Bio" : "Giới thiệu"}
            rows={5}
            value={draft.bio}
            onChange={(language, nextValue) =>
              onChange({
                ...draft,
                bio: { ...draft.bio, [language]: nextValue },
              })
            }
          />

          <div className="grid gap-4 lg:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm theme-text-muted">
                {locale === "en" ? "Expertise tags (EN)" : "Nhãn chuyên môn (EN)"}
              </span>
              <textarea
                rows={3}
                value={draft.expertiseEnInput}
                onChange={(event) => onChange({ ...draft, expertiseEnInput: event.target.value })}
                placeholder="Product strategy, Fintech growth, Compliance"
                className={fieldClassName}
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm theme-text-muted">
                {locale === "en" ? "Expertise tags (VI)" : "Nhãn chuyên môn (VI)"}
              </span>
              <textarea
                rows={3}
                value={draft.expertiseViInput}
                onChange={(event) => onChange({ ...draft, expertiseViInput: event.target.value })}
                placeholder="Chiến lược sản phẩm, Tăng trưởng fintech, Tuân thủ"
                className={fieldClassName}
              />
            </label>
          </div>

          <RoundSelection
            locale={locale}
            value={draft.rounds}
            onToggle={(round) =>
              onChange({
                ...draft,
                rounds: draft.rounds.includes(round)
                  ? draft.rounds.filter((item) => item !== round)
                  : [...draft.rounds, round].sort(),
              })
            }
          />
        </div>

        <Surface className="h-fit space-y-4 px-5 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-200/80">
            {locale === "en" ? "Preview" : "Xem trước"}
          </p>
          <div className="overflow-hidden rounded-[1.6rem] border theme-border">
            <div
              aria-hidden="true"
              className="h-48 bg-cover bg-center"
              style={{ backgroundImage: `url(${draft.imageSrc || "/judges/nguyen-bao-chau.svg"})` }}
            />
          </div>
          <div>
            <p className="theme-heading text-xl font-semibold theme-text-strong">
              {draft.name || (locale === "en" ? "Judge name" : "Tên giám khảo")}
            </p>
            <p className="mt-2 text-sm leading-7 theme-text-soft">
              {pickText(locale, draft.role) || (locale === "en" ? "Position" : "Chức vụ")} ·{" "}
              {pickText(locale, draft.organization) || (locale === "en" ? "Organization" : "Tổ chức")}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {draft.rounds.map((round) => (
              <StatusPill key={round}>{pickText(locale, roundLabels[round])}</StatusPill>
            ))}
          </div>
        </Surface>
      </div>
    </div>
  );
}

function JudgeDeleteDialog({
  locale,
  judge,
  onCancel,
  onConfirm,
}: {
  locale: Locale;
  judge: JudgeProfile;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[rgba(2,6,23,0.52)] px-4 backdrop-blur-sm">
      <Surface className="w-full max-w-lg px-6 py-6 md:px-7 md:py-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-rose-700 dark:text-rose-200/80">
              {locale === "en" ? "Delete judge" : "Xóa giám khảo"}
            </p>
            <p className="theme-heading mt-3 text-2xl font-semibold theme-text-strong">
              {judge.name}
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border theme-border theme-panel theme-text-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mt-5 text-sm leading-7 theme-text-muted">
          {locale === "en"
            ? "This removes the judge from the live public judges page and the admin dataset."
            : "Hành động này sẽ xóa giám khảo khỏi trang công khai và khỏi dữ liệu admin."}
        </p>

        <div className="mt-7 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="theme-button-secondary rounded-full px-5 py-3 text-sm font-semibold"
          >
            {locale === "en" ? "Cancel" : "Hủy"}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="theme-button-danger inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
          >
            <Trash2 className="h-4 w-4" />
            {locale === "en" ? "Delete judge" : "Xóa giám khảo"}
          </button>
        </div>
      </Surface>
    </div>
  );
}

function AddJudgeModal({
  locale,
  draft,
  onChange,
  onClose,
  validationMessage,
  onSave,
}: {
  locale: Locale;
  draft: JudgeDraft;
  onChange: (nextDraft: JudgeDraft) => void;
  onClose: () => void;
  validationMessage: string;
  onSave: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[80] overflow-y-auto bg-[rgba(2,6,23,0.5)] px-4 py-8 backdrop-blur-sm">
      <div className="mx-auto w-full max-w-6xl">
        <Surface className="px-6 py-6 md:px-7 md:py-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-200/80">
                {locale === "en" ? "New judge" : "Giám khảo mới"}
              </p>
              <p className="theme-heading mt-3 text-2xl font-semibold theme-text-strong">
                {locale === "en" ? "Add a judge profile" : "Thêm hồ sơ giám khảo"}
              </p>
              <p className="mt-3 text-sm leading-7 theme-text-muted">
                {locale === "en"
                  ? "Create the judge here, then continue refining the full record from the dedicated editor page."
                  : "Tạo giám khảo tại đây, sau đó có thể hoàn thiện hồ sơ chi tiết hơn ở trang chỉnh sửa riêng."}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border theme-border theme-panel theme-text-muted"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-7">
            <JudgeFormFields
              locale={locale}
              draft={draft}
              onChange={onChange}
              compact
              showIdField={false}
              autoIdFromName
            />
          </div>

          {validationMessage ? (
            <div className="mt-5 rounded-[1.35rem] border border-amber-400/24 bg-amber-400/12 px-4 py-3 text-sm leading-7 text-amber-800 dark:text-amber-100">
              {validationMessage}
            </div>
          ) : null}

          <div className="mt-7 flex justify-end gap-3">
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
              {locale === "en" ? "Add judge" : "Thêm giám khảo"}
            </button>
          </div>
        </Surface>
      </div>
    </div>
  );
}

function normalizeDraftForSave(draft: JudgeDraft) {
  const nextDraft = {
    ...draft,
    id: draft.id.trim() || slugify(draft.name),
    rounds: draft.rounds,
  };

  if (
    !nextDraft.name.trim() ||
    (!nextDraft.organization.en.trim() && !nextDraft.organization.vi.trim()) ||
    !nextDraft.imageSrc.trim()
  ) {
    return null;
  }

  if (!nextDraft.role.en.trim() && !nextDraft.role.vi.trim()) {
    return null;
  }

  if (!nextDraft.bio.en.trim() && !nextDraft.bio.vi.trim()) {
    return null;
  }

  if (nextDraft.rounds.length === 0) {
    return null;
  }

  return buildJudgeFromDraft(nextDraft);
}

export function AdminJudgesList() {
  const { locale, judges, createJudgeByAdmin, reorderJudgesByAdmin, deleteJudgeByAdmin } = useSiteState();
  const [activePanel, setActivePanel] = useState<JudgePanelKey>("final");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addDraft, setAddDraft] = useState<JudgeDraft>(() => createEmptyJudgeDraft());
  const [addValidationMessage, setAddValidationMessage] = useState("");
  const [judgePendingDelete, setJudgePendingDelete] = useState<JudgeProfile | null>(null);
  const [movingJudgeId, setMovingJudgeId] = useState("");
  const [filters, setFilters] = useState<JudgeTableFilters>({
    judge: "",
    organization: "",
    expertise: "",
  });
  useAdminTitleScroll();

  const roundStats = useMemo(
    () =>
      (["round-1", "round-2", "round-3"] as CompetitionRoundKey[]).map((round) => ({
        round,
        count: judges.filter((judge) => judge.rounds.includes(round)).length,
      })),
    [judges],
  );
  const panelJudges = useMemo(
    () => judges.filter((judge) => judgeBelongsToPanel(judge, activePanel)),
    [activePanel, judges],
  );
  const panelIndexByJudgeId = useMemo(
    () => new Map(panelJudges.map((judge, index) => [judge.id, index])),
    [panelJudges],
  );
  const filteredJudges = useMemo(
    () =>
      panelJudges.filter((judge) => {
        const judgeLabel = `${judge.name} ${pickText(locale, judge.role)}`;
        const organizationLabel = `${pickLocalizedText(locale, judge.organization)} ${pickLocalizedText(locale === "en" ? "vi" : "en", judge.organization)}`;
        const expertiseLabel = getJudgeExpertiseText(locale, judge);

        return (
          matchesFilter(judgeLabel, filters.judge) &&
          matchesFilter(organizationLabel, filters.organization) &&
          matchesFilter(expertiseLabel, filters.expertise)
        );
      }),
    [filters.expertise, filters.judge, filters.organization, locale, panelJudges],
  );
  const {
    page,
    setPage,
    pageCount,
    startIndex,
    paginatedRows,
  } = useAdminTablePagination(filteredJudges, ADMIN_LIST_TABLE_PAGE_SIZE);
  const firstStickyColumnClass = "theme-admin-sticky-cell-strong sticky left-0 z-30";
  const secondStickyColumnClass = "theme-admin-sticky-cell-strong sticky z-20";
  const firstStickyHeadClass = "theme-admin-sticky-head sticky left-0 z-40";
  const secondStickyHeadClass = "theme-admin-sticky-head sticky z-30";

  const handleMoveJudge = async (judgeId: string, direction: -1 | 1) => {
    const nextJudgeIds = buildJudgeOrderAfterMove(judges, activePanel, judgeId, direction);

    if (!nextJudgeIds) {
      return;
    }

    setMovingJudgeId(judgeId);
    try {
      await reorderJudgesByAdmin(nextJudgeIds);
    } finally {
      setMovingJudgeId("");
    }
  };

  const handleCreateJudge = async () => {
    const payload = normalizeDraftForSave(addDraft);

    if (!payload) {
      setAddValidationMessage(
        locale === "en"
          ? "Complete the main judge information before saving."
          : "Hãy điền đầy đủ các thông tin chính của giám khảo trước khi lưu.",
      );
      return;
    }

    const saved = await createJudgeByAdmin(payload);
    if (!saved) {
      return;
    }

    setIsAddOpen(false);
    setAddDraft(createEmptyJudgeDraft());
    setAddValidationMessage("");
  };

  return (
    <div className="space-y-8">
      <div id={ADMIN_TITLE_ID} className="scroll-mt-32 space-y-2">
        <p className="theme-eyebrow text-xs font-semibold uppercase tracking-[0.28em]">
          {locale === "en" ? "Admin / Judges" : "Admin / Giám khảo"}
        </p>
        <h1 className="theme-heading text-3xl font-semibold theme-text-strong md:text-[2.6rem]">
          {locale === "en" ? "Judges" : "Giám khảo"}
        </h1>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        {roundStats.map((item) => (
          <Surface key={item.round} className="px-5 py-5">
            <div className="flex items-center justify-between gap-4">
              <div className="theme-brand-gradient flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-[0_18px_40px_rgba(23,114,208,0.2)]">
                <Sparkles className="h-5 w-5" />
              </div>
              <StatusPill>{pickText(locale, roundLabels[item.round])}</StatusPill>
            </div>
            <p className="mt-5 text-4xl font-semibold theme-text-strong">{item.count}</p>
            <p className="mt-2 text-sm leading-7 theme-text-muted">
              {locale === "en" ? "visible judges in this round" : "giám khảo đang hiển thị ở vòng này"}
            </p>
          </Surface>
        ))}
      </section>

      <Surface className="px-5 py-5 md:px-6">
        <div className="flex flex-col gap-4 border-b theme-border pb-5 md:flex-row md:items-end md:justify-between">
          <div className="space-y-4">
            <p className="theme-heading text-2xl font-semibold theme-text-strong">
              {getJudgePanelLabel(locale, activePanel)}
            </p>
            <div className="inline-flex flex-wrap gap-2 rounded-full border theme-border bg-white/72 p-1 dark:bg-white/[0.04]">
              {(["final", "early"] as JudgePanelKey[]).map((panel) => (
                <button
                  key={panel}
                  type="button"
                  onClick={() => {
                    setActivePanel(panel);
                    setPage(1);
                  }}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition",
                    activePanel === panel
                      ? "bg-[linear-gradient(135deg,#0a1d34,#1772d0)] text-white shadow-[0_14px_30px_rgba(23,114,208,0.18)]"
                      : "theme-text-muted hover:bg-[var(--panel-strong)] hover:opacity-85",
                  )}
                >
                  {getJudgePanelLabel(locale, panel)}
                  <span className="rounded-full bg-white/18 px-2 py-0.5 text-[10px]">
                    {judges.filter((judge) => judgeBelongsToPanel(judge, panel)).length}
                  </span>
                </button>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setAddValidationMessage("");
              setIsAddOpen(true);
            }}
            className="theme-button-secondary inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold"
          >
            <Plus className="h-4 w-4" />
            {locale === "en" ? "New judge" : "Giám khảo mới"}
          </button>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="min-w-[1260px] border-separate border-spacing-y-3 text-sm">
            <thead>
              <tr className="text-left text-[0.72rem] font-semibold uppercase tracking-[0.22em] theme-text-soft">
	                <th style={{ left: 0, width: 72, minWidth: 72 }} className={cn("px-4 py-2", firstStickyHeadClass)}>#</th>
	                <th style={{ left: 72, minWidth: 368 }} className={cn("px-4 py-2", secondStickyHeadClass)}>{locale === "en" ? "Judge" : "Giám khảo"}</th>
                <th className="min-w-[16rem] px-4 py-2">{locale === "en" ? "Organization" : "Tổ chức"}</th>
                <th className="min-w-[15rem] px-4 py-2">{locale === "en" ? "Rounds" : "Vòng"}</th>
                <th className="min-w-[18rem] px-4 py-2">{locale === "en" ? "Expertise" : "Chuyên môn"}</th>
                <th className="min-w-[8rem] px-4 py-2 text-center">{locale === "en" ? "Order" : "Thứ tự"}</th>
                <th className="px-4 py-2 text-right">{locale === "en" ? "Actions" : "Tác vụ"}</th>
              </tr>
              <tr>
	                <th style={{ left: 0, width: 72, minWidth: 72 }} className={cn("px-4 py-2", firstStickyHeadClass)} />
	                <th style={{ left: 72, minWidth: 368 }} className={cn("px-4 py-2", secondStickyHeadClass)}>
                  <input
                    value={filters.judge}
                    onChange={(event) => setFilters((current) => ({ ...current, judge: event.target.value }))}
                    placeholder={locale === "en" ? "Filter judge" : "Lọc giám khảo"}
                    className={tableFieldClassName}
                  />
                </th>
                <th className="px-4 py-2">
                  <input
                    value={filters.organization}
                    onChange={(event) => setFilters((current) => ({ ...current, organization: event.target.value }))}
                    placeholder={locale === "en" ? "Filter organization" : "Lọc tổ chức"}
                    className={tableFieldClassName}
                  />
                </th>
                <th className="px-4 py-2" />
                <th className="px-4 py-2">
                  <input
                    value={filters.expertise}
                    onChange={(event) => setFilters((current) => ({ ...current, expertise: event.target.value }))}
                    placeholder={locale === "en" ? "Filter expertise" : "Lọc chuyên môn"}
                    className={tableFieldClassName}
                  />
                </th>
                <th className="px-4 py-2" />
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((judge, index) => {
                const panelIndex = panelIndexByJudgeId.get(judge.id) ?? 0;

                return (
                <tr key={judge.id} id={`judge-row-${judge.id}`} className="theme-panel-strong scroll-mt-32">
	                  <td
	                    style={{ left: 0, width: 72, minWidth: 72 }}
	                    className={cn(
	                      "rounded-l-[1.4rem] border-y border-l theme-border px-4 py-4 text-xs font-semibold theme-text-soft",
	                      firstStickyColumnClass,
	                    )}
	                  >
	                    {startIndex + index + 1}
	                  </td>
	                  <td
	                    style={{ left: 72, minWidth: 368 }}
	                    className={cn("border-y theme-border px-4 py-4", secondStickyColumnClass)}
	                  >
                    <div className="flex items-center gap-4">
                      <div
                        aria-hidden="true"
                        className="h-14 w-14 rounded-2xl border theme-border bg-cover bg-center"
                        style={{ backgroundImage: `url(${judge.imageSrc})` }}
                      />
                      <div className="min-w-0">
                        <Link
                          href={`/admin/judges/${judge.id}`}
                          className="theme-heading block text-lg font-semibold theme-accent"
                        >
                          {judge.name}
                        </Link>
                        <p className="mt-1 text-sm theme-text-soft">
                          {pickText(locale, judge.role)}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="border-y theme-border px-4 py-4 text-sm theme-text-body">
                    {pickLocalizedText(locale, judge.organization)}
                  </td>
                  <td className="border-y theme-border px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      {judge.rounds.map((round) => (
                        <span
                          key={`${judge.id}-${round}`}
                          className="inline-flex items-center gap-2 rounded-full border theme-border theme-panel px-3 py-1.5 text-xs font-semibold theme-text-strong"
                        >
                          <span className="h-2 w-2 rounded-full bg-[var(--brand)]" />
                          {pickText(locale, roundLabels[round])}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="border-y theme-border px-4 py-4 text-sm theme-text-body">
                    <p className="line-clamp-2">{getJudgeExpertiseText(locale, judge) || "--"}</p>
                  </td>
                  <td className="border-y theme-border px-4 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        disabled={panelIndex === 0 || movingJudgeId === judge.id}
                        onClick={() => {
                          void handleMoveJudge(judge.id, -1);
                        }}
                        title={locale === "en" ? "Move judge up" : "Đưa giám khảo lên"}
                        aria-label={locale === "en" ? "Move judge up" : "Đưa giám khảo lên"}
                        className="theme-button-secondary inline-flex h-9 w-9 items-center justify-center rounded-full disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        disabled={panelIndex >= panelJudges.length - 1 || movingJudgeId === judge.id}
                        onClick={() => {
                          void handleMoveJudge(judge.id, 1);
                        }}
                        title={locale === "en" ? "Move judge down" : "Đưa giám khảo xuống"}
                        aria-label={locale === "en" ? "Move judge down" : "Đưa giám khảo xuống"}
                        className="theme-button-secondary inline-flex h-9 w-9 items-center justify-center rounded-full disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                  <td className="rounded-r-[1.4rem] border-y border-r theme-border px-4 py-4">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/admin/judges/${judge.id}`}
                        title={locale === "en" ? "Edit judge" : "Sửa giám khảo"}
                        aria-label={locale === "en" ? "Edit judge" : "Sửa giám khảo"}
                        className="theme-button-secondary inline-flex h-10 w-10 items-center justify-center rounded-full"
                      >
                        <PencilLine className="h-4 w-4" />
                        <span className="sr-only">{locale === "en" ? "Edit judge" : "Sửa giám khảo"}</span>
                      </Link>
                      <button
                        type="button"
                        title={locale === "en" ? "Delete judge" : "Xóa giám khảo"}
                        aria-label={locale === "en" ? "Delete judge" : "Xóa giám khảo"}
                        onClick={() => setJudgePendingDelete(judge)}
                        className="theme-button-danger inline-flex h-10 w-10 items-center justify-center rounded-full"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">{locale === "en" ? "Delete judge" : "Xóa giám khảo"}</span>
                      </button>
                    </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <AdminTablePagination
          locale={locale}
          page={page}
          pageCount={pageCount}
          pageSize={ADMIN_LIST_TABLE_PAGE_SIZE}
          totalRows={filteredJudges.length}
          onPageChange={setPage}
        />
      </Surface>

      {isAddOpen ? (
        <AddJudgeModal
          locale={locale}
          draft={addDraft}
          onChange={(nextDraft) => {
            setAddValidationMessage("");
            setAddDraft(nextDraft);
          }}
          onClose={() => {
            setAddValidationMessage("");
            setIsAddOpen(false);
          }}
          validationMessage={addValidationMessage}
          onSave={() => {
            void handleCreateJudge();
          }}
        />
      ) : null}

      {judgePendingDelete ? (
        <JudgeDeleteDialog
          locale={locale}
          judge={judgePendingDelete}
          onCancel={() => setJudgePendingDelete(null)}
          onConfirm={() => {
            void (async () => {
              const deleted = await deleteJudgeByAdmin(judgePendingDelete.id);
              if (deleted) {
                setJudgePendingDelete(null);
              }
            })();
          }}
        />
      ) : null}
    </div>
  );
}

export function AdminJudgeEditor({ judgeId }: { judgeId: string }) {
  const router = useRouter();
  const { locale, hasHydrated, judges, currentUser, updateJudgeByAdmin, deleteJudgeByAdmin } = useSiteState();
  const judge = judges.find((item) => item.id === judgeId);
  const [draft, setDraft] = useState<JudgeDraft | null>(() => (judge ? draftFromJudge(judge) : null));
  const [judgeAccountPassword, setJudgeAccountPassword] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [validationMessage, setValidationMessage] = useState("");
  const [imageUploadMessage, setImageUploadMessage] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  useAdminTitleScroll();

  if (!hasHydrated && !judge) {
    return (
      <Surface className="px-6 py-6 md:px-8 md:py-8">
        <SectionHeading
          id={ADMIN_TITLE_ID}
          className="scroll-mt-32"
          eyebrow="Admin / Judges"
          title="Loading judge..."
          description="Waiting for the current admin dataset before opening the judge editor."
        />
      </Surface>
    );
  }

  if (!judge || !draft) {
    return (
      <Surface className="px-6 py-6 md:px-8 md:py-8">
        <SectionHeading
          id={ADMIN_TITLE_ID}
          className="scroll-mt-32"
          eyebrow="Admin / Judges"
          title={locale === "en" ? "Judge not found." : "Không tìm thấy giám khảo."}
          description={
            locale === "en"
              ? "This record may have been removed from the current admin dataset."
              : "Hồ sơ này có thể đã bị xóa khỏi dữ liệu admin hiện tại."
          }
        />
        <Link href="/admin/judges" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold theme-accent">
          <ArrowLeft className="h-4 w-4" />
          {locale === "en" ? "Back to judges" : "Quay lại danh sách giám khảo"}
        </Link>
      </Surface>
    );
  }

  const canManageJudgeAccount = currentUser.role === "admin";
  const isDirty = JSON.stringify(draft) !== JSON.stringify(draftFromJudge(judge)) || Boolean(judgeAccountPassword.trim());

  const uploadJudgeImage = async (file: File) => {
    const validationError = getNewsImageValidationError(file);
    if (validationError === "type") {
      setImageUploadMessage(
        locale === "en"
          ? "Only JPG, PNG, and WEBP files are allowed."
          : "Chỉ chấp nhận tệp JPG, PNG và WEBP.",
      );
      return;
    }

    if (validationError === "size") {
      setImageUploadMessage(
        locale === "en"
          ? "The uploaded image must be 2MB or smaller."
          : "Ảnh tải lên phải từ 2MB trở xuống.",
      );
      return;
    }

    setIsUploadingImage(true);
    setImageUploadMessage("");

    try {
      const formData = new FormData();
      formData.append("imageFile", file);

      const response = await fetch("/api/admin/judges/image", {
        method: "POST",
        body: formData,
        credentials: "same-origin",
      });

      const payload = (await response.json().catch(() => null)) as { imageUrl?: string; error?: string } | null;

      if (!response.ok || !payload?.imageUrl) {
        setImageUploadMessage(
          payload?.error ??
            (locale === "en"
              ? "The judge avatar could not be uploaded right now."
              : "Hiện chưa thể tải ảnh giám khảo."),
        );
        return;
      }

      setDraft((current) => (current ? { ...current, imageSrc: payload.imageUrl! } : current));
      setImageUploadMessage(
        locale === "en" ? "Avatar uploaded successfully." : "Đã tải ảnh đại diện thành công.",
      );
    } catch {
      setImageUploadMessage(
        locale === "en"
          ? "The judge avatar could not be uploaded right now."
          : "Hiện chưa thể tải ảnh giám khảo.",
      );
    } finally {
      setIsUploadingImage(false);
    }
  };

  const saveJudge = async () => {
    const payload = normalizeDraftForSave(draft);

    if (!payload) {
      setValidationMessage(
        locale === "en"
          ? "Complete the main judge information before saving."
          : "Hãy điền đầy đủ các thông tin chính của giám khảo trước khi lưu.",
      );
      return;
    }

    const nextPassword = judgeAccountPassword.trim();
    if (nextPassword && nextPassword.length < 8) {
      setValidationMessage(
        locale === "en"
          ? "Judge account password must be at least 8 characters."
          : "Mật khẩu tài khoản giám khảo phải có ít nhất 8 ký tự.",
      );
      return;
    }

    const saved = await updateJudgeByAdmin(
      judgeId,
      nextPassword ? { ...payload, accountPassword: nextPassword } : payload,
    );
    if (!saved) {
      return;
    }

    setValidationMessage("");
    setJudgeAccountPassword("");
    setDraft(draftFromJudge(payload));
    if (payload.id !== judgeId) {
      router.replace(`/admin/judges/${payload.id}`);
    }
  };

  return (
    <div className="space-y-8">
      <Link href="/admin/judges" className="inline-flex items-center gap-2 text-sm font-semibold theme-accent">
        <ArrowLeft className="h-4 w-4" />
        {locale === "en" ? "Back to judges" : "Quay lại giám khảo"}
      </Link>

      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <SectionHeading
          id={ADMIN_TITLE_ID}
          className="scroll-mt-32"
          eyebrow={locale === "en" ? "Admin / Judges / Editor" : "Admin / Giám khảo / Chỉnh sửa"}
          title={draft.name || (locale === "en" ? "Edit judge" : "Chỉnh sửa giám khảo")}
        />
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => {
              setValidationMessage("");
              setImageUploadMessage("");
              setJudgeAccountPassword("");
              setDraft(draftFromJudge(judge));
            }}
            className="theme-button-secondary rounded-full px-5 py-3 text-sm font-semibold"
          >
            {locale === "en" ? "Reset draft" : "Đặt lại bản nháp"}
          </button>
          <button
            type="button"
            disabled={!isDirty}
            onClick={() => {
              void saveJudge();
            }}
            className="theme-button-primary rounded-full px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
          >
            {locale === "en" ? "Save judge" : "Lưu giám khảo"}
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
        <div className="mb-6 rounded-[1.6rem] border theme-border theme-panel-subtle px-5 py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-sky-700/18 bg-sky-500/12 text-sky-700 dark:border-sky-300/18 dark:bg-sky-300/12 dark:text-sky-100">
                <KeyRound className="h-4.5 w-4.5" />
              </span>
              <div>
                <p className="text-sm font-semibold theme-text-strong">
                  {locale === "en" ? "Judge account access" : "Truy cập tài khoản giám khảo"}
                </p>
                <p className="mt-1 text-sm leading-7 theme-text-muted">
                  {canManageJudgeAccount
                    ? locale === "en"
                      ? "Admin can change the judge login ID and set a new password here."
                      : "Admin có thể đổi ID đăng nhập và đặt mật khẩu mới cho tài khoản giám khảo tại đây."
                    : locale === "en"
                      ? "Only admin can change the judge login ID or password."
                      : "Chỉ admin có thể đổi ID đăng nhập hoặc mật khẩu của tài khoản giám khảo."}
                </p>
              </div>
            </div>
            <StatusPill tone={canManageJudgeAccount ? "success" : "warning"}>
              {canManageJudgeAccount
                ? locale === "en"
                  ? "Admin control"
                  : "Quyền admin"
                : locale === "en"
                  ? "Profile only"
                  : "Chỉ sửa hồ sơ"}
            </StatusPill>
          </div>

          {canManageJudgeAccount ? (
            <label className="mt-5 block space-y-2">
              <span className="text-sm theme-text-muted">
                {locale === "en" ? "New judge account password" : "Mật khẩu mới cho tài khoản giám khảo"}
              </span>
              <input
                type="password"
                value={judgeAccountPassword}
                onChange={(event) => {
                  setValidationMessage("");
                  setJudgeAccountPassword(event.target.value);
                }}
                placeholder={locale === "en" ? "Leave blank to keep current password" : "Để trống nếu giữ mật khẩu hiện tại"}
                className={fieldClassName}
              />
              <p className="text-xs leading-6 theme-text-soft">
                {locale === "en"
                  ? "Minimum 8 characters. The password is saved only when you click Save judge."
                  : "Tối thiểu 8 ký tự. Mật khẩu chỉ được lưu khi bấm Lưu giám khảo."}
              </p>
            </label>
          ) : null}
        </div>

        <JudgeFormFields
          locale={locale}
          draft={draft}
          onChange={(nextDraft) => {
            setValidationMessage("");
            setDraft(nextDraft);
          }}
          idEditable={canManageJudgeAccount}
          imageUploadMessage={imageUploadMessage}
          imageUploadHelper={
            locale === "en"
              ? "JPG, PNG, or WEBP. Maximum 2MB."
              : "JPG, PNG hoặc WEBP. Tối đa 2MB."
          }
          isUploadingImage={isUploadingImage}
          onUploadImage={(file) => {
            void uploadJudgeImage(file);
          }}
        />
        {validationMessage ? (
          <div className="mt-5 rounded-[1.35rem] border border-amber-400/24 bg-amber-400/12 px-4 py-3 text-sm leading-7 text-amber-800 dark:text-amber-100">
            {validationMessage}
          </div>
        ) : null}
      </Surface>

      {showDeleteDialog ? (
        <JudgeDeleteDialog
          locale={locale}
          judge={judge}
          onCancel={() => setShowDeleteDialog(false)}
          onConfirm={() => {
            void (async () => {
              const deleted = await deleteJudgeByAdmin(judge.id);
              if (deleted) {
                router.push("/admin/judges");
              }
            })();
          }}
        />
      ) : null}
    </div>
  );
}
