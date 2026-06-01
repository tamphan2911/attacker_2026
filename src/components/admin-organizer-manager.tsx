"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import {
  Download,
  FilePenLine,
  LockKeyhole,
  Plus,
  Trash2,
  Upload,
  UserCog,
  X,
} from "lucide-react";
import * as XLSX from "xlsx";

import {
  ADMIN_TABLE_PAGE_SIZE,
  AdminTablePagination,
  useAdminTablePagination,
} from "@/components/admin-table-pagination";
import { ADMIN_TITLE_ID, useAdminTitleScroll } from "@/components/admin-title-scroll";
import { useSiteState } from "@/components/providers/site-state-provider";
import { GradientAvatar, SectionHeading, StatusPill, Surface } from "@/components/site-ui";
import { DEMO_ADMIN_LOGIN_ID } from "@/data/site-content";

const MAX_AVATAR_FILE_BYTES = 1024 * 1024;
const DEFAULT_AVATAR_TONE = "from-emerald-500 via-cyan-400 to-blue-400";
const fieldClassName =
  "theme-placeholder w-full rounded-2xl border theme-border theme-panel px-4 py-3 text-sm theme-text-strong outline-none";
const tableFieldClassName =
  "theme-placeholder w-full rounded-xl border theme-border theme-panel-subtle px-3 py-2 text-xs theme-text-body outline-none";

interface OrganizerAccountDraft {
  loginId: string;
  name: string;
  password: string;
  role: "admin" | "moderator";
  avatarImageSrc?: string;
}

function createEmptyDraft(): OrganizerAccountDraft {
  return {
    loginId: "",
    name: "",
    password: "",
    role: "moderator",
    avatarImageSrc: undefined,
  };
}

function readImageFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("Unable to read image file."));
    };
    reader.onerror = () => reject(reader.error ?? new Error("Unable to read image file."));
    reader.readAsDataURL(file);
  });
}

function isAllowedAvatarFile(file: File) {
  if (!file.type) {
    return false;
  }

  return file.type.startsWith("image/");
}

function exportRowsToWorkbook(
  fileName: string,
  sheetName: string,
  rows: Record<string, string | number>[],
) {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, fileName);
}

function TableFilterField({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (nextValue: string) => void;
  placeholder: string;
}) {
  return (
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className={tableFieldClassName}
    />
  );
}

function OrganizerAccountModal({
  locale,
  mode,
  draft,
  onChange,
  onClose,
  onSave,
  avatarError,
  onAvatarUpload,
  onAvatarRemove,
}: {
  locale: "en" | "vi";
  mode: "create" | "edit";
  draft: OrganizerAccountDraft;
  onChange: (payload: Partial<OrganizerAccountDraft>) => void;
  onClose: () => void;
  onSave: () => void;
  avatarError: string;
  onAvatarUpload: (event: ChangeEvent<HTMLInputElement>) => Promise<void>;
  onAvatarRemove: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(7,18,35,0.48)] px-4 py-6 backdrop-blur-sm">
      <div className="theme-panel-strong theme-card-shadow relative w-full max-w-3xl rounded-[2rem] border px-6 py-6 md:px-8 md:py-8">
        <button
          type="button"
          onClick={onClose}
          className="theme-button-secondary absolute right-5 top-5 inline-flex h-10 w-10 items-center justify-center rounded-full"
          title={locale === "en" ? "Close" : "Đóng"}
          aria-label={locale === "en" ? "Close" : "Đóng"}
        >
          <X className="h-4 w-4" />
        </button>

        <SectionHeading
          eyebrow={locale === "en" ? "System / Organizer team" : "System / Ban tổ chức"}
          title={
            mode === "create"
              ? locale === "en"
                ? "Add organizer account"
                : "Tạo tài khoản ban tổ chức"
              : locale === "en"
                ? "Edit organizer account"
                : "Chỉnh sửa tài khoản ban tổ chức"
          }
          description={
            mode === "create"
              ? locale === "en"
                ? "Create an internal admin or moderator account with only the fields needed for operations."
                : "Tạo tài khoản admin hoặc moderator nội bộ chỉ với các trường cần cho công tác vận hành."
              : locale === "en"
                ? "Update the organizer identity, login ID, password, or avatar."
                : "Cập nhật thông tin ban tổ chức, mã đăng nhập, mật khẩu hoặc avatar."
          }
        />

        <div className="mt-8 grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <Surface className="px-5 py-5">
            <div className="flex flex-col items-center gap-4 text-center">
              <GradientAvatar
                label={draft.name || draft.loginId || "Organizer"}
                tone={DEFAULT_AVATAR_TONE}
                imageSrc={draft.avatarImageSrc}
                className="h-24 w-24 rounded-[2rem] text-2xl"
              />
              <div>
                <p className="text-base font-semibold theme-text-strong">
                  {draft.name || (locale === "en" ? "New organizer" : "Tài khoản mới")}
                </p>
                <p className="mt-1 text-sm theme-text-soft">
                  {draft.loginId || (locale === "en" ? "login-id" : "login-id")}
                </p>
                <p className="mt-2 text-xs font-semibold uppercase tracking-[0.24em] theme-eyebrow">
                  {draft.role === "admin"
                    ? locale === "en"
                      ? "Administrator"
                      : "Quản trị viên"
                    : locale === "en"
                      ? "Moderator"
                      : "Điều phối viên"}
                </p>
              </div>
              <label className="theme-button-secondary inline-flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold">
                <Upload className="h-4 w-4" />
                {locale === "en" ? "Upload avatar" : "Tải avatar"}
                <input type="file" accept="image/*" className="hidden" onChange={(event) => void onAvatarUpload(event)} />
              </label>
              {draft.avatarImageSrc ? (
                <button
                  type="button"
                  onClick={onAvatarRemove}
                  className="theme-button-danger inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold"
                >
                  <Trash2 className="h-4 w-4" />
                  {locale === "en" ? "Remove avatar" : "Gỡ avatar"}
                </button>
              ) : null}
              {avatarError ? <p className="text-xs leading-6 text-rose-500 dark:text-rose-200">{avatarError}</p> : null}
              <p className="text-xs leading-6 theme-text-soft">
                {locale === "en"
                  ? "Avatar must be an image file and 1MB or smaller."
                  : "Avatar phải là tệp hình ảnh và có dung lượng tối đa 1MB."}
              </p>
            </div>
          </Surface>

          <div className="space-y-4">
            <label className="space-y-2">
              <span className="text-sm theme-text-muted">
                {locale === "en" ? "Access role" : "Vai trò truy cập"}
              </span>
              <select
                value={draft.role}
                onChange={(event) =>
                  onChange({ role: event.target.value as OrganizerAccountDraft["role"] })
                }
                disabled={mode === "edit"}
                className={`${fieldClassName} theme-admin-select`}
              >
                <option value="admin">
                  {locale === "en" ? "Administrator" : "Quản trị viên"}
                </option>
                <option value="moderator">
                  {locale === "en" ? "Moderator" : "Điều phối viên"}
                </option>
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm theme-text-muted">
                {locale === "en" ? "Full name" : "Họ và tên"}
              </span>
              <input
                value={draft.name}
                onChange={(event) => onChange({ name: event.target.value })}
                className={fieldClassName}
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm theme-text-muted">
                {locale === "en" ? "Login ID" : "Mã đăng nhập"}
              </span>
              <input
                value={draft.loginId}
                onChange={(event) => onChange({ loginId: event.target.value.toLowerCase() })}
                className={fieldClassName}
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm theme-text-muted">
                {mode === "create"
                  ? locale === "en"
                    ? "Password"
                    : "Mật khẩu"
                  : locale === "en"
                    ? "New password (optional)"
                    : "Mật khẩu mới (không bắt buộc)"}
              </span>
              <input
                type="password"
                value={draft.password}
                onChange={(event) => onChange({ password: event.target.value })}
                className={fieldClassName}
              />
            </label>
            <div className="rounded-[1.5rem] border theme-border theme-panel px-4 py-4">
              <p className="text-sm leading-7 theme-text-muted">
                {locale === "en"
                  ? "Organizer accounts are internal-only. The system will generate a hidden internal email automatically, so this form only needs login ID, password, full name, avatar, and access role."
                  : "Tài khoản ban tổ chức chỉ dùng nội bộ. Hệ thống sẽ tự tạo email nội bộ ẩn, nên biểu mẫu này chỉ cần mã đăng nhập, mật khẩu, họ tên, avatar và vai trò truy cập."}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="theme-button-secondary rounded-full px-4 py-2.5 text-sm font-semibold"
          >
            {locale === "en" ? "Cancel" : "Hủy"}
          </button>
          <button
            type="button"
            onClick={onSave}
            className="theme-button-primary inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold"
          >
            <UserCog className="h-4 w-4" />
            {mode === "create"
              ? locale === "en"
                ? "Create organizer account"
                : "Tạo tài khoản ban tổ chức"
              : locale === "en"
                ? "Save changes"
                : "Lưu thay đổi"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function AdminOrganizerManager() {
  const {
    locale,
    currentUser,
    users,
    createOrganizerAccountByAdmin,
    updateOrganizerAccountByAdmin,
    deleteOrganizerAccountByAdmin,
  } = useSiteState();
  useAdminTitleScroll();

  const canManage = currentUser.role === "admin";
  const [activeTab, setActiveTab] = useState<"team" | "referees">("team");
  const [filters, setFilters] = useState({
    name: "",
    loginId: "",
    role: "all",
  });
  const [refereeFilters, setRefereeFilters] = useState({
    search: "",
    referralCode: "",
    activation: "all",
  });
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [draft, setDraft] = useState<OrganizerAccountDraft>(createEmptyDraft());
  const [avatarError, setAvatarError] = useState("");

  const organizerRows = useMemo(
    () => {
      const activatedReferralCountBySupporterId = new Map<string, number>();
      for (const user of users) {
        if (user.referredBySupporterId && user.emailVerified) {
          activatedReferralCountBySupporterId.set(
            user.referredBySupporterId,
            (activatedReferralCountBySupporterId.get(user.referredBySupporterId) ?? 0) + 1,
          );
        }
      }

      return users
        .filter((user) => user.role === "admin" || user.role === "moderator" || user.role === "supporter")
        .map((user) => ({
          id: user.id,
          loginId: user.loginId ?? user.studentId ?? user.email,
          name: user.name,
          role: user.role,
          roleLabel:
            user.role === "admin"
              ? locale === "en"
                ? "Administrator"
                : "Quản trị viên"
              : user.role === "moderator"
                ? locale === "en"
                  ? "Moderator"
                  : "Điều phối viên"
                : locale === "en"
                  ? "Supporter"
                  : "Supporter",
          accessLabel:
            user.role === "admin"
              ? locale === "en"
                ? "Full control"
                : "Toàn quyền"
              : user.role === "moderator"
                ? locale === "en"
                  ? "Admin mode access"
                  : "Truy cập admin mode"
                : locale === "en"
                  ? "Referral support"
                  : "Hỗ trợ đăng ký",
          supporterReferralCode: user.supporterReferralCode ?? "",
          activatedReferralCount: user.role === "supporter" ? activatedReferralCountBySupporterId.get(user.id) ?? 0 : 0,
          avatarImageSrc: user.avatarImageSrc,
          avatarTone: user.avatarTone,
        }));
    },
    [locale, users],
  );

  const filteredRows = useMemo(
    () =>
      organizerRows.filter((row) => {
        if (filters.role !== "all" && row.role !== filters.role) {
          return false;
        }

        if (
          filters.name &&
          !row.name.toLowerCase().includes(filters.name.trim().toLowerCase())
        ) {
          return false;
        }

        if (
          filters.loginId &&
          !row.loginId.toLowerCase().includes(filters.loginId.trim().toLowerCase())
        ) {
          return false;
        }

        return true;
      }),
    [filters, organizerRows],
  );

  const {
    page,
    setPage,
    pageCount,
    startIndex,
    paginatedRows,
  } = useAdminTablePagination(filteredRows, ADMIN_TABLE_PAGE_SIZE);
  const organizerExportRows = useMemo(
    () =>
      filteredRows.map((row, index) => ({
        "#": index + 1,
        [locale === "en" ? "Name" : "Họ tên"]: row.name,
        [locale === "en" ? "Login ID" : "Mã đăng nhập"]: row.loginId,
        [locale === "en" ? "Role" : "Vai trò"]: row.roleLabel,
        [locale === "en" ? "Access" : "Quyền truy cập"]: row.accessLabel,
        [locale === "en" ? "Referal code" : "Referal code"]: row.supporterReferralCode || "-",
        [locale === "en" ? "Activated referrals" : "Đã kích hoạt"]: row.activatedReferralCount,
      })),
    [filteredRows, locale],
  );
  const refereeRows = useMemo(
    () =>
      users
        .filter((user) => user.referredByCode || user.referredBySupporterId)
        .map((user) => {
          const supporter = users.find((item) => item.id === user.referredBySupporterId);

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            studentId: user.studentId,
            university: user.university,
            major: user.major,
            referralCode: user.referredByCode ?? supporter?.supporterReferralCode ?? "",
            supporterName: supporter?.name ?? "",
            supporterLoginId: supporter?.loginId ?? "",
            emailVerified: Boolean(user.emailVerified),
            activationKey: user.emailVerified ? "verified" : "unverified",
          };
        }),
    [users],
  );
  const filteredRefereeRows = useMemo(
    () =>
      refereeRows.filter((row) => {
        const searchSource = [
          row.name,
          row.email,
          row.studentId,
          row.university,
          row.major,
          row.supporterName,
          row.supporterLoginId,
        ].join(" ");

        if (refereeFilters.search && !searchSource.toLowerCase().includes(refereeFilters.search.trim().toLowerCase())) {
          return false;
        }

        if (
          refereeFilters.referralCode &&
          !row.referralCode.toLowerCase().includes(refereeFilters.referralCode.trim().toLowerCase())
        ) {
          return false;
        }

        if (refereeFilters.activation !== "all" && row.activationKey !== refereeFilters.activation) {
          return false;
        }

        return true;
      }),
    [refereeFilters, refereeRows],
  );
  const {
    page: refereePage,
    setPage: setRefereePage,
    pageCount: refereePageCount,
    startIndex: refereeStartIndex,
    paginatedRows: paginatedRefereeRows,
  } = useAdminTablePagination(filteredRefereeRows, ADMIN_TABLE_PAGE_SIZE);
  const refereeExportRows = useMemo(
    () =>
      filteredRefereeRows.map((row, index) => ({
        "#": index + 1,
        [locale === "en" ? "Name" : "Họ tên"]: row.name,
        Email: row.email,
        [locale === "en" ? "Student ID" : "MSSV"]: row.studentId || "-",
        [locale === "en" ? "Referal code" : "Referal code"]: row.referralCode || "-",
        Supporter: row.supporterName
          ? `${row.supporterName}${row.supporterLoginId ? ` (${row.supporterLoginId})` : ""}`
          : "-",
        [locale === "en" ? "Email activation" : "Kích hoạt email"]: row.emailVerified
          ? locale === "en"
            ? "Activated"
            : "Đã kích hoạt"
          : locale === "en"
            ? "Not activated"
            : "Chưa kích hoạt",
        [locale === "en" ? "University" : "Trường"]: row.university || "-",
        [locale === "en" ? "Major" : "Chuyên ngành"]: row.major || "-",
      })),
    [filteredRefereeRows, locale],
  );

  useEffect(() => {
    setPage(1);
  }, [filters, setPage]);

  useEffect(() => {
    setRefereePage(1);
  }, [refereeFilters, setRefereePage]);

  const openCreateModal = () => {
    setDraft(createEmptyDraft());
    setEditingUserId(null);
    setAvatarError("");
    setModalMode("create");
  };

  const openEditModal = (userId: string) => {
    const user = organizerRows.find((item) => item.id === userId);
    if (!user) {
      return;
    }

    setDraft({
      loginId: user.loginId,
      name: user.name,
      password: "",
      role: user.role === "admin" ? "admin" : "moderator",
      avatarImageSrc: user.avatarImageSrc,
    });
    setEditingUserId(userId);
    setAvatarError("");
    setModalMode("edit");
  };

  const closeModal = () => {
    setModalMode(null);
    setEditingUserId(null);
    setDraft(createEmptyDraft());
    setAvatarError("");
  };

  const handleAvatarUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    if (!isAllowedAvatarFile(file)) {
      setAvatarError(
        locale === "en"
          ? "Only image files are allowed for organizer avatars."
          : "Chỉ chấp nhận tệp hình ảnh cho avatar ban tổ chức.",
      );
      return;
    }

    if (file.size > MAX_AVATAR_FILE_BYTES) {
      setAvatarError(
        locale === "en"
          ? "Avatar image must be 1MB or smaller."
          : "Ảnh avatar phải có dung lượng không quá 1MB.",
      );
      return;
    }

    try {
      const imageSrc = await readImageFileAsDataUrl(file);
      setAvatarError("");
      setDraft((current) => ({ ...current, avatarImageSrc: imageSrc }));
    } catch {
      setAvatarError(
        locale === "en"
          ? "Could not load the avatar image."
          : "Không thể tải ảnh avatar.",
      );
    }
  };

  const handleSave = async () => {
    if (!draft.name.trim() || !draft.loginId.trim()) {
      setAvatarError(
        locale === "en"
          ? "Full name and login ID are required."
          : "Họ tên và mã đăng nhập là bắt buộc.",
      );
      return;
    }

    if (modalMode === "create") {
      if (!draft.password.trim()) {
        setAvatarError(
          locale === "en"
            ? "Password is required for a new organizer account."
            : "Mật khẩu là bắt buộc khi tạo tài khoản ban tổ chức mới.",
        );
        return;
      }

      const created = await createOrganizerAccountByAdmin({
        loginId: draft.loginId,
        name: draft.name,
        password: draft.password,
        role: draft.role,
        avatarImageSrc: draft.avatarImageSrc,
      });

      if (created) {
        closeModal();
      }
      return;
    }

    if (modalMode === "edit" && editingUserId) {
      const saved = await updateOrganizerAccountByAdmin(editingUserId, {
        loginId: draft.loginId,
        name: draft.name,
        password: draft.password.trim() || undefined,
        avatarImageSrc: draft.avatarImageSrc ?? null,
      });

      if (saved) {
        closeModal();
      }
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeading
        id={ADMIN_TITLE_ID}
        className="scroll-mt-32"
        eyebrow={locale === "en" ? "System / Organizer team" : "System / Ban tổ chức"}
        title={locale === "en" ? "Organizer team" : "Ban tổ chức"}
        description={
          locale === "en"
            ? "Internal admin and moderator accounts used to operate the platform. All organizer accounts are managed by admin only."
            : "Các tài khoản admin và moderator nội bộ dùng để vận hành hệ thống. Toàn bộ tài khoản ban tổ chức chỉ do admin quản lý."
        }
      />

      {!canManage ? (
        <Surface className="px-5 py-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-400/14 text-amber-700 dark:text-amber-100">
              <LockKeyhole className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold theme-text-strong">
                {locale === "en"
                  ? "Organizer accounts are admin-managed."
                  : "Tài khoản ban tổ chức do admin quản lý."}
              </p>
              <p className="mt-2 text-sm leading-7 theme-text-muted">
                {locale === "en"
                  ? "You can view the organizer roster here, but only admin can create, edit, or delete organizer accounts."
                  : "Bạn có thể xem danh sách ban tổ chức tại đây, nhưng chỉ admin mới có thể tạo, sửa hoặc xóa tài khoản ban tổ chức."}
              </p>
            </div>
          </div>
        </Surface>
      ) : null}

      <div className="flex flex-wrap gap-2 rounded-full border theme-border theme-panel-subtle p-1">
        {[
          { id: "team", label: locale === "en" ? "Organizer team" : "Ban tổ chức" },
          { id: "referees", label: locale === "en" ? "Referees" : "Người được giới thiệu" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              activeTab === tab.id
                ? "theme-button-primary"
                : "theme-text-soft hover:theme-text-strong"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "team" ? (
      <Surface className="overflow-hidden px-5 py-5 md:px-6">
        <div className="flex flex-col gap-4 border-b theme-border pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="theme-heading text-2xl font-semibold theme-text-strong">
              {locale === "en" ? "Organizer summary" : "Tổng hợp ban tổ chức"}
            </p>
            <p className="mt-2 text-sm leading-7 theme-text-muted">
              {locale === "en"
                ? "Separate internal organizer accounts from participant records."
                : "Tách riêng tài khoản vận hành nội bộ khỏi dữ liệu thí sinh."}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() =>
                exportRowsToWorkbook(
                  "attacker-2026-organizer-team.xlsx",
                  "OrganizerTeam",
                  organizerExportRows,
                )
              }
              disabled={organizerExportRows.length === 0}
              className="theme-button-primary inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              {locale === "en" ? "Export organizer-team.xlsx" : "Xuất organizer-team.xlsx"}
            </button>
            {canManage ? (
            <button
              type="button"
              onClick={openCreateModal}
              className="theme-button-secondary inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold"
            >
              <Plus className="h-4 w-4" />
              {locale === "en" ? "New organizer account" : "Tài khoản mới"}
            </button>
            ) : null}
          </div>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b theme-border bg-[var(--panel-strong)] theme-text-soft">
              <tr>
                <th className="px-4 py-3 font-medium">#</th>
                <th className="min-w-[20rem] px-4 py-3 font-medium">
                  {locale === "en" ? "Account" : "Tài khoản"}
                </th>
                <th className="min-w-[14rem] px-4 py-3 font-medium">
                  {locale === "en" ? "Login ID" : "Mã đăng nhập"}
                </th>
                <th className="min-w-[11rem] px-4 py-3 font-medium">
                  {locale === "en" ? "Role" : "Vai trò"}
                </th>
                <th className="min-w-[14rem] px-4 py-3 font-medium">
                  {locale === "en" ? "Access" : "Quyền truy cập"}
                </th>
                <th className="min-w-[10rem] px-4 py-3 font-medium">
                  {locale === "en" ? "Referal code" : "Referal code"}
                </th>
                <th className="min-w-[12rem] px-4 py-3 text-center font-medium">
                  {locale === "en" ? "Activated referrals" : "Đã kích hoạt"}
                </th>
                <th className="px-4 py-3 text-right font-medium">
                  {locale === "en" ? "Actions" : "Tác vụ"}
                </th>
              </tr>
              <tr className="border-t theme-border bg-[var(--panel)]">
                <th className="px-4 py-3" />
                <th className="px-4 py-3">
                  <TableFilterField
                    value={filters.name}
                    onChange={(value) => setFilters((current) => ({ ...current, name: value }))}
                    placeholder={locale === "en" ? "Filter name" : "Lọc họ tên"}
                  />
                </th>
                <th className="px-4 py-3">
                  <TableFilterField
                    value={filters.loginId}
                    onChange={(value) => setFilters((current) => ({ ...current, loginId: value }))}
                    placeholder={locale === "en" ? "Filter login ID" : "Lọc mã đăng nhập"}
                  />
                </th>
                <th className="px-4 py-3">
                  <select
                    value={filters.role}
                    onChange={(event) => setFilters((current) => ({ ...current, role: event.target.value }))}
                    className="theme-admin-select w-full rounded-xl border px-3 py-2 text-xs font-semibold outline-none"
                  >
                    <option value="all">{locale === "en" ? "All roles" : "Tất cả vai trò"}</option>
                    <option value="admin">{locale === "en" ? "Administrator" : "Quản trị viên"}</option>
                    <option value="moderator">{locale === "en" ? "Moderator" : "Điều phối viên"}</option>
                    <option value="supporter">{locale === "en" ? "Supporter" : "Supporter"}</option>
                  </select>
                </th>
                <th className="px-4 py-3" />
                <th className="px-4 py-3" />
                <th className="px-4 py-3" />
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((row, index) => (
                <tr key={row.id} className="border-b theme-border last:border-b-0">
                  <td className="px-4 py-4 text-xs font-semibold theme-text-soft">
                    {startIndex + index + 1}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <GradientAvatar
                        label={row.name}
                        tone={row.avatarTone}
                        imageSrc={row.avatarImageSrc}
                        className="h-11 w-11 rounded-2xl"
                      />
                      <div>
                        <p className="font-semibold theme-text-strong">{row.name}</p>
                        <p className="mt-1 text-xs theme-text-soft">{row.loginId}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 theme-text-body">{row.loginId}</td>
                  <td className="px-4 py-4 text-center">
                    <StatusPill tone={row.role === "admin" ? "warning" : row.role === "supporter" ? "info" : "success"}>
                      {row.roleLabel}
                    </StatusPill>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <StatusPill>{row.accessLabel}</StatusPill>
                  </td>
                  <td className="px-4 py-4 theme-text-body">{row.supporterReferralCode || "-"}</td>
                  <td className="px-4 py-4 text-center">
                    <StatusPill tone={row.activatedReferralCount > 0 ? "success" : "default"}>
                      {row.activatedReferralCount}
                    </StatusPill>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end gap-2">
                      {canManage && row.loginId !== DEMO_ADMIN_LOGIN_ID && row.role !== "supporter" ? (
                        <>
                          <button
                            type="button"
                            title={
                              locale === "en"
                                ? "Edit organizer account"
                                : "Chỉnh sửa tài khoản ban tổ chức"
                            }
                            aria-label={
                              locale === "en"
                                ? "Edit organizer account"
                                : "Chỉnh sửa tài khoản ban tổ chức"
                            }
                            onClick={() => openEditModal(row.id)}
                            className="theme-button-secondary inline-flex h-9 w-9 items-center justify-center rounded-full"
                          >
                            <FilePenLine className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            title={
                              locale === "en"
                                ? "Delete organizer account"
                                : "Xóa tài khoản ban tổ chức"
                            }
                            aria-label={
                              locale === "en"
                                ? "Delete organizer account"
                                : "Xóa tài khoản ban tổ chức"
                            }
                            onClick={() => {
                              const confirmed = window.confirm(
                                locale === "en"
                                  ? `Delete organizer account ${row.name}?`
                                  : `Xóa tài khoản ban tổ chức ${row.name}?`,
                              );

                              if (confirmed) {
                                void deleteOrganizerAccountByAdmin(row.id);
                              }
                            }}
                            className="theme-button-danger inline-flex h-9 w-9 items-center justify-center rounded-full"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </>
                      ) : (
                        <span className="inline-flex items-center gap-2 rounded-full border theme-border px-3 py-2 text-xs font-semibold theme-text-soft">
                          <LockKeyhole className="h-3.5 w-3.5" />
                          {locale === "en" ? "Locked" : "Khóa"}
                        </span>
                      )}
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
          totalRows={filteredRows.length}
          onPageChange={setPage}
        />
      </Surface>
      ) : (
        <Surface className="overflow-hidden px-5 py-5 md:px-6">
          <div className="flex flex-col gap-4 border-b theme-border pb-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="theme-heading text-2xl font-semibold theme-text-strong">
                {locale === "en" ? "Referees" : "Người được giới thiệu"}
              </p>
              <p className="mt-2 text-sm leading-7 theme-text-muted">
                {locale === "en"
                  ? "Users who entered a supporter referal code during registration."
                  : "Các người dùng đã nhập referal code của supporter khi đăng ký."}
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                exportRowsToWorkbook(
                  "attacker-2026-referees.xlsx",
                  "Referees",
                  refereeExportRows,
                )
              }
              disabled={refereeExportRows.length === 0}
              className="theme-button-primary inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              {locale === "en" ? "Export referees.xlsx" : "Xuất referees.xlsx"}
            </button>
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1.2fr)_220px_180px]">
            <TableFilterField
              value={refereeFilters.search}
              onChange={(value) => setRefereeFilters((current) => ({ ...current, search: value }))}
              placeholder={locale === "en" ? "Search name, email, supporter..." : "Tìm tên, email, supporter..."}
            />
            <TableFilterField
              value={refereeFilters.referralCode}
              onChange={(value) => setRefereeFilters((current) => ({ ...current, referralCode: value }))}
              placeholder={locale === "en" ? "Search referal code" : "Tìm referal code"}
            />
            <select
              value={refereeFilters.activation}
              onChange={(event) => setRefereeFilters((current) => ({ ...current, activation: event.target.value }))}
              className="theme-admin-select w-full rounded-xl border px-3 py-2 text-xs font-semibold outline-none"
            >
              <option value="all">{locale === "en" ? "All activation" : "Tất cả kích hoạt"}</option>
              <option value="verified">{locale === "en" ? "Email activated" : "Đã kích hoạt email"}</option>
              <option value="unverified">{locale === "en" ? "Not activated" : "Chưa kích hoạt"}</option>
            </select>
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b theme-border bg-[var(--panel-strong)] theme-text-soft">
                <tr>
                  <th className="px-4 py-3 font-medium">#</th>
                  <th className="min-w-[18rem] px-4 py-3 font-medium">{locale === "en" ? "User" : "Người dùng"}</th>
                  <th className="min-w-[16rem] px-4 py-3 font-medium">Email</th>
                  <th className="min-w-[11rem] px-4 py-3 font-medium">{locale === "en" ? "Student ID" : "MSSV"}</th>
                  <th className="min-w-[13rem] px-4 py-3 font-medium">{locale === "en" ? "Referal code" : "Referal code"}</th>
                  <th className="min-w-[16rem] px-4 py-3 font-medium">Supporter</th>
                  <th className="min-w-[12rem] px-4 py-3 text-center font-medium">{locale === "en" ? "Email activation" : "Kích hoạt email"}</th>
                  <th className="min-w-[16rem] px-4 py-3 font-medium">{locale === "en" ? "University" : "Trường"}</th>
                  <th className="min-w-[14rem] px-4 py-3 font-medium">{locale === "en" ? "Major" : "Chuyên ngành"}</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRefereeRows.map((row, index) => (
                  <tr key={row.id} className="border-b theme-border last:border-b-0">
                    <td className="px-4 py-4 text-xs font-semibold theme-text-soft">
                      {refereeStartIndex + index + 1}
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-semibold theme-text-strong">{row.name}</p>
                      <p className="mt-1 text-xs theme-text-soft">{row.id}</p>
                    </td>
                    <td className="px-4 py-4 theme-text-body">{row.email}</td>
                    <td className="px-4 py-4 theme-text-body">{row.studentId || "-"}</td>
                    <td className="px-4 py-4 theme-text-body">{row.referralCode || "-"}</td>
                    <td className="px-4 py-4 theme-text-body">
                      {row.supporterName ? `${row.supporterName} (${row.supporterLoginId})` : "-"}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <StatusPill tone={row.emailVerified ? "success" : "warning"}>
                        {row.emailVerified
                          ? locale === "en" ? "Activated" : "Đã kích hoạt"
                          : locale === "en" ? "Not activated" : "Chưa kích hoạt"}
                      </StatusPill>
                    </td>
                    <td className="px-4 py-4 theme-text-body">{row.university}</td>
                    <td className="px-4 py-4 theme-text-body">{row.major}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <AdminTablePagination
            locale={locale}
            page={refereePage}
            pageCount={refereePageCount}
            pageSize={ADMIN_TABLE_PAGE_SIZE}
            totalRows={filteredRefereeRows.length}
            onPageChange={setRefereePage}
          />
        </Surface>
      )}

      {modalMode ? (
        <OrganizerAccountModal
          locale={locale}
          mode={modalMode}
          draft={draft}
          onChange={(payload) => {
            setAvatarError("");
            setDraft((current) => ({ ...current, ...payload }));
          }}
          onClose={closeModal}
          onSave={() => void handleSave()}
          avatarError={avatarError}
          onAvatarUpload={handleAvatarUpload}
          onAvatarRemove={() => setDraft((current) => ({ ...current, avatarImageSrc: undefined }))}
        />
      ) : null}
    </div>
  );
}
