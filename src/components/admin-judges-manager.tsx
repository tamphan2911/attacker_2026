"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  PencilLine,
  Plus,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";

import { pickText } from "@/lib/site";
import { ADMIN_TITLE_ID, useAdminTitleScroll } from "@/components/admin-title-scroll";
import {
  ADMIN_TABLE_PAGE_SIZE,
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

const roundLabels: Record<CompetitionRoundKey, LocalizedText> = {
  "round-1": { en: "Round 1", vi: "Vòng 1" },
  "round-2": { en: "Round 2", vi: "Vòng 2" },
  "round-3": { en: "Final round", vi: "Chung kết" },
};

type JudgeDraft = {
  id: string;
  name: string;
  imageSrc: string;
  organization: string;
  role: LocalizedText;
  bio: LocalizedText;
  expertiseEnInput: string;
  expertiseViInput: string;
  avatarTone: string;
  rounds: CompetitionRoundKey[];
};

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

function draftFromJudge(judge: JudgeProfile): JudgeDraft {
  return {
    id: judge.id,
    name: judge.name,
    imageSrc: judge.imageSrc,
    organization: judge.organization,
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
    organization: draft.organization.trim(),
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
    organization: "",
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
}: {
  locale: Locale;
  draft: JudgeDraft;
  onChange: (nextDraft: JudgeDraft) => void;
  compact?: boolean;
}) {
  return (
    <div className="space-y-5">
      <div className={cn("grid gap-4", compact ? "xl:grid-cols-2" : "xl:grid-cols-[minmax(0,1fr)_280px]")}>
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm theme-text-muted">ID</span>
              <input
                value={draft.id}
                onChange={(event) => onChange({ ...draft, id: slugify(event.target.value) })}
                placeholder={locale === "en" ? "judge-round2-example" : "judge-round2-vi-du"}
                className={fieldClassName}
              />
            </label>
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
                    id: draft.id || slugify(event.target.value),
                  })
                }
                className={fieldClassName}
              />
            </label>
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
            <label className="space-y-2 md:col-span-2">
              <span className="text-sm theme-text-muted">
                {locale === "en" ? "Organization" : "Tổ chức"}
              </span>
              <input
                value={draft.organization}
                onChange={(event) => onChange({ ...draft, organization: event.target.value })}
                className={fieldClassName}
              />
            </label>
          </div>

          <LocalizedFieldEditor
            label={locale === "en" ? "Role" : "Vai trò"}
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
              {pickText(locale, draft.role) || (locale === "en" ? "Role" : "Vai trò")} ·{" "}
              {draft.organization || (locale === "en" ? "Organization" : "Tổ chức")}
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
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-rose-300/78">
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
            className="rounded-full border theme-border theme-panel px-5 py-3 text-sm font-semibold theme-text-strong"
          >
            {locale === "en" ? "Cancel" : "Hủy"}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex items-center gap-2 rounded-full border border-rose-300/24 bg-rose-300/10 px-5 py-3 text-sm font-semibold text-rose-100"
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
            <JudgeFormFields locale={locale} draft={draft} onChange={onChange} compact />
          </div>

          {validationMessage ? (
            <div className="mt-5 rounded-[1.35rem] border border-amber-300/18 bg-amber-300/10 px-4 py-3 text-sm leading-7 text-amber-100">
              {validationMessage}
            </div>
          ) : null}

          <div className="mt-7 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border theme-border theme-panel px-5 py-3 text-sm font-semibold theme-text-strong"
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

  if (!nextDraft.name.trim() || !nextDraft.organization.trim() || !nextDraft.imageSrc.trim()) {
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
  const { locale, judges, createJudgeByAdmin, deleteJudgeByAdmin } = useSiteState();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addDraft, setAddDraft] = useState<JudgeDraft>(() => createEmptyJudgeDraft());
  const [addValidationMessage, setAddValidationMessage] = useState("");
  const [judgePendingDelete, setJudgePendingDelete] = useState<JudgeProfile | null>(null);
  useAdminTitleScroll();

  const roundStats = useMemo(
    () =>
      (["round-1", "round-2", "round-3"] as CompetitionRoundKey[]).map((round) => ({
        round,
        count: judges.filter((judge) => judge.rounds.includes(round)).length,
      })),
    [judges],
  );
  const {
    page,
    setPage,
    pageCount,
    startIndex,
    paginatedRows,
  } = useAdminTablePagination(judges, ADMIN_TABLE_PAGE_SIZE);

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
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <SectionHeading
          id={ADMIN_TITLE_ID}
          className="scroll-mt-32"
          eyebrow={locale === "en" ? "Admin / Judges" : "Admin / Giám khảo"}
          title={
            locale === "en"
              ? "Manage the judging panel in one place."
              : "Quản lý hội đồng giám khảo tại một nơi."
          }
          description={
            locale === "en"
              ? "Add judges, edit their public profiles, and remove outdated records from the live judges page."
              : "Thêm giám khảo, chỉnh sửa hồ sơ công khai và gỡ các hồ sơ không còn sử dụng khỏi trang giám khảo."
          }
        />

        <button
          type="button"
          onClick={() => {
            setAddValidationMessage("");
            setIsAddOpen(true);
          }}
          className="theme-button-primary inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
        >
          <Plus className="h-4 w-4" />
          {locale === "en" ? "Add judge" : "Thêm giám khảo"}
        </button>
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
          <div>
            <p className="theme-heading text-2xl font-semibold theme-text-strong">
              {locale === "en" ? "Judge summary" : "Tổng hợp giám khảo"}
            </p>
            <p className="mt-2 text-sm leading-7 theme-text-muted">
              {locale === "en"
                ? "Open a judge to edit the full profile, or remove it directly from the table."
                : "Mở từng giám khảo để chỉnh sửa hồ sơ đầy đủ, hoặc xóa trực tiếp ngay tại bảng."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setAddValidationMessage("");
              setIsAddOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-full border theme-border theme-panel px-4 py-2.5 text-sm font-semibold theme-text-strong"
          >
            <Plus className="h-4 w-4" />
            {locale === "en" ? "New judge" : "Giám khảo mới"}
          </button>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-3">
            <thead>
              <tr className="text-left text-[0.72rem] font-semibold uppercase tracking-[0.22em] theme-text-soft">
                <th className="px-4 py-2">#</th>
                <th className="px-4 py-2">{locale === "en" ? "Judge" : "Giám khảo"}</th>
                <th className="px-4 py-2">{locale === "en" ? "Organization" : "Tổ chức"}</th>
                <th className="px-4 py-2">{locale === "en" ? "Rounds" : "Vòng"}</th>
                <th className="px-4 py-2">{locale === "en" ? "Expertise" : "Chuyên môn"}</th>
                <th className="px-4 py-2 text-right">{locale === "en" ? "Actions" : "Tác vụ"}</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((judge, index) => (
                <tr key={judge.id} className="theme-panel-strong">
                  <td className="rounded-l-[1.4rem] border-y border-l theme-border px-4 py-4 text-xs font-semibold theme-text-soft">
                    {startIndex + index + 1}
                  </td>
                  <td className="border-y theme-border px-4 py-4">
                    <div className="flex items-center gap-4">
                      <div
                        aria-hidden="true"
                        className="h-14 w-14 rounded-2xl border theme-border bg-cover bg-center"
                        style={{ backgroundImage: `url(${judge.imageSrc})` }}
                      />
                      <div className="min-w-0">
                        <Link
                          href={`/admin/judges/${judge.id}`}
                          className="theme-heading text-lg font-semibold theme-accent"
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
                    {judge.organization}
                  </td>
                  <td className="border-y theme-border px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      {judge.rounds.map((round) => (
                        <StatusPill key={`${judge.id}-${round}`}>
                          {pickText(locale, roundLabels[round])}
                        </StatusPill>
                      ))}
                    </div>
                  </td>
                  <td className="border-y theme-border px-4 py-4 text-sm theme-text-muted">
                    {judge.expertise.length}
                  </td>
                  <td className="rounded-r-[1.4rem] border-y border-r theme-border px-4 py-4">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/admin/judges/${judge.id}`}
                        className="inline-flex items-center gap-2 rounded-full border theme-border theme-panel px-4 py-2.5 text-sm font-semibold theme-text-strong"
                      >
                        <PencilLine className="h-4 w-4" />
                        {locale === "en" ? "Edit" : "Sửa"}
                      </Link>
                      <button
                        type="button"
                        onClick={() => setJudgePendingDelete(judge)}
                        className="inline-flex items-center gap-2 rounded-full border border-rose-300/24 bg-rose-300/10 px-4 py-2.5 text-sm font-semibold text-rose-100"
                      >
                        <Trash2 className="h-4 w-4" />
                        {locale === "en" ? "Delete" : "Xóa"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <AdminTablePagination
          locale={locale}
          page={page}
          pageCount={pageCount}
          pageSize={ADMIN_TABLE_PAGE_SIZE}
          totalRows={judges.length}
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
  const { locale, hasHydrated, judges, updateJudgeByAdmin, deleteJudgeByAdmin } = useSiteState();
  const judge = judges.find((item) => item.id === judgeId);
  const [draft, setDraft] = useState<JudgeDraft | null>(() => (judge ? draftFromJudge(judge) : null));
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [validationMessage, setValidationMessage] = useState("");
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

  const isDirty = JSON.stringify(draft) !== JSON.stringify(draftFromJudge(judge));

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

    const saved = await updateJudgeByAdmin(judgeId, payload);
    if (!saved) {
      return;
    }

    setValidationMessage("");
    if (payload.id !== judgeId) {
      router.replace(`/admin/judges/${payload.id}`);
      return;
    }

    setDraft(draftFromJudge(payload));
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
          description={
            locale === "en"
              ? "Update the public-facing judge profile used on the live judges page."
              : "Cập nhật hồ sơ giám khảo công khai đang được dùng trên trang giám khảo."
          }
        />
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => {
              setValidationMessage("");
              setDraft(draftFromJudge(judge));
            }}
            className="rounded-full border theme-border theme-panel px-5 py-3 text-sm font-semibold theme-text-strong"
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
            className="inline-flex items-center gap-2 rounded-full border border-rose-300/24 bg-rose-300/10 px-5 py-3 text-sm font-semibold text-rose-100"
          >
            <Trash2 className="h-4 w-4" />
            {locale === "en" ? "Delete" : "Xóa"}
          </button>
        </div>
      </div>

      <Surface className="px-6 py-6 md:px-7 md:py-7">
        <JudgeFormFields
          locale={locale}
          draft={draft}
          onChange={(nextDraft) => {
            setValidationMessage("");
            setDraft(nextDraft);
          }}
        />
        {validationMessage ? (
          <div className="mt-5 rounded-[1.35rem] border border-amber-300/18 bg-amber-300/10 px-4 py-3 text-sm leading-7 text-amber-100">
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
