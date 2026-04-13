"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import {
  Download,
  FilePenLine,
  Filter,
  Search,
  Trash2,
} from "lucide-react";
import * as XLSX from "xlsx";

import {
  ADMIN_LIST_TABLE_PAGE_SIZE,
  AdminTablePagination,
  useAdminTablePagination,
} from "@/components/admin-table-pagination";
import { ContentIndexSection } from "@/components/admin-content-editor";
import { AdminJudgesList } from "@/components/admin-judges-manager";
import { AdminNewsList } from "@/components/admin-news-manager";
import { AdminOrganizerManager } from "@/components/admin-organizer-manager";
import { AdminRound1Manager } from "@/components/admin-round1-manager";
import { AdminRound2SubmissionsManager } from "@/components/admin-round2-submissions-manager";
import { ADMIN_TITLE_ID, useAdminTitleScroll } from "@/components/admin-title-scroll";
import { TEAM_MIN_MEMBERS } from "@/data/site-content";
import { getAdminUserCompetitionStatus, pickAdminUserRoleLabel } from "@/lib/admin-users";
import {
  pickCompetitionStateLabel,
  pickTeamDisplayStatusLabel,
  pickTeamDisplayStatusTone,
} from "@/lib/competition";
import { formatDateLabel, getTeamForUser } from "@/lib/site";
import { useSiteState } from "@/components/providers/site-state-provider";
import { SectionHeading, StatusPill, Surface } from "@/components/site-ui";
import type { UserProfile } from "@/types/site";

export type AdminSection =
  | "overview"
  | "content"
  | "news"
  | "judges"
  | "round1"
  | "users"
  | "organizerTeam"
  | "teams"
  | "submissions";

export function AdminShell({
  children,
}: {
  section?: AdminSection;
  children: ReactNode;
}) {
  return <>{children}</>;
}

function cn(...values: Array<string | undefined | false>) {
  return values.filter(Boolean).join(" ");
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

function OverviewSection() {
  const { locale, users, teams, submissions, currentUser } = useSiteState();
  const eligibleTeams = teams.filter((team) => team.memberIds.length >= TEAM_MIN_MEMBERS);
  const latestSubmissionCount = teams.filter((team) =>
    submissions.some((submission) => submission.teamId === team.id),
  ).length;

  return (
    <div className="space-y-8">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: locale === "en" ? "Signed-in role" : "Vai tro dang dung",
            value: currentUser.role,
          },
          {
            label: locale === "en" ? "Users" : "Nguoi dung",
            value: users.length.toString(),
          },
          {
            label: locale === "en" ? "Eligible teams" : "Đội đủ điều kiện",
            value: eligibleTeams.length.toString(),
          },
          {
            label: locale === "en" ? "Teams with submissions" : "Đội đã nộp bài",
            value: latestSubmissionCount.toString(),
          },
        ].map((item) => (
          <Surface key={item.label} className="px-5 py-5">
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-sky-200/80">
              {item.label}
            </p>
            <p className="mt-4 text-4xl font-semibold theme-text-strong">{item.value}</p>
          </Surface>
        ))}
      </section>

      <Surface className="px-6 py-6 md:px-8 md:py-8">
        <SectionHeading
          eyebrow={locale === "en" ? "Scope" : "Pham vi"}
          title={
            locale === "en"
              ? "What is already covered in this admin prototype."
              : "Nhung gi da duoc bao phu trong prototype admin nay."
          }
          description={
            locale === "en"
              ? "Content editing is wired into the public pages, and each operational table supports real `.xlsx` export from the browser."
              : "Phan sua noi dung da duoc noi vao cac trang cong khai, va moi bang van hanh deu ho tro xuat `.xlsx` truc tiep tu trinh duyet."
          }
        />
        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {[
            {
              title: locale === "en" ? "Page content" : "Noi dung trang",
              body:
                locale === "en"
                  ? "Update hero slides, page headings, and section copy across the main routes."
                  : "Cap nhat hero slides, heading trang va copy cua cac section tren cac route chinh.",
            },
            {
              title: locale === "en" ? "Participant data" : "Du lieu thi sinh",
              body:
                locale === "en"
                  ? "Inspect users, teams, and submissions in table form before the backend phase begins."
                  : "Kiem tra nguoi dung, doi thi va bai nop duoi dang bang truoc khi sang giai doan backend.",
            },
            {
              title: locale === "en" ? "Excel exports" : "Xuat Excel",
              body:
                locale === "en"
                  ? "Download `.xlsx` files for organizer review and offline reporting."
                  : "Tai tep `.xlsx` de ban to chuc review va lap bao cao offline.",
            },
          ].map((item) => (
            <div key={item.title} className="rounded-[1.75rem] border theme-border theme-panel px-4 py-4">
              <p className="text-lg font-semibold theme-text-strong">{item.title}</p>
              <p className="mt-3 text-sm leading-7 theme-text-muted">{item.body}</p>
            </div>
          ))}
        </div>
      </Surface>
    </div>
  );
}

function TableHeader({
  id,
  title,
  description,
  exportLabel,
  onExport,
}: {
  id?: string;
  title: string;
  description: string;
  exportLabel: string;
  onExport: () => void;
}) {
  return (
    <div
      id={id}
      className="scroll-mt-32 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"
    >
      <div className="max-w-3xl">
        <p className="theme-heading text-3xl font-semibold theme-text-strong">{title}</p>
        <p className="mt-3 text-sm leading-7 theme-text-muted">{description}</p>
      </div>
      <button
        type="button"
        onClick={onExport}
        className="theme-button-primary inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
      >
        <Download className="h-4 w-4" />
        {exportLabel}
      </button>
    </div>
  );
}

function tableFilterValueMatches(value: string, filterValue: string) {
  if (!filterValue) {
    return true;
  }

  return value.toLowerCase().includes(filterValue.trim().toLowerCase());
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
      className="theme-placeholder w-full rounded-xl border theme-border theme-panel-subtle px-3 py-2 text-xs theme-text-body outline-none"
    />
  );
}

function pickAdminRoleTone(role: UserProfile["role"]) {
  if (role === "student") {
    return "default" as const;
  }

  return "success" as const;
}

function UsersTableSection() {
  const { locale, users, teams, timelineItems, deleteUserByAdmin } = useSiteState();
  useAdminTitleScroll();
  const firstStickyColumnClass = "sticky left-0 z-20 bg-[var(--panel)]";
  const secondStickyColumnClass = "sticky z-10 bg-[var(--panel)]";
  const firstStickyHeadClass = "sticky left-0 z-30 bg-[var(--panel-strong)]";
  const secondStickyHeadClass = "sticky z-20 bg-[var(--panel-strong)]";
  const firstStickyFilterClass = "sticky left-0 z-30 bg-[var(--panel)]";
  const secondStickyFilterClass = "sticky z-20 bg-[var(--panel)]";
  const [filters, setFilters] = useState({
    name: "",
    studentId: "",
    role: "all",
    status: "all",
    email: "",
    university: "",
    major: "",
    classYear: "",
    team: "",
  });

  const userRows = useMemo(
    () =>
      users.filter((user) => user.role === "student").map((user) => {
        const team = getTeamForUser(user.id, teams);
        const status = getAdminUserCompetitionStatus(locale, user, team, timelineItems);

        return {
          id: user.id,
          name: user.name,
          studentId: user.studentId,
          role: user.role,
          roleLabel: pickAdminUserRoleLabel(locale, user.role),
          statusKey: status.key,
          statusLabel: status.label,
          statusTone: status.tone,
          email: user.email,
          university: user.university,
          major: user.major,
          classYear: user.classYear,
          teamName: team?.name ?? "",
          providers: user.providers.join(", "),
        };
      }),
    [locale, teams, timelineItems, users],
  );

  const filteredRows = useMemo(
    () =>
      userRows.filter((row) => {
        if (!tableFilterValueMatches(row.name, filters.name)) {
          return false;
        }

        if (!tableFilterValueMatches(row.studentId, filters.studentId)) {
          return false;
        }

        if (filters.role !== "all" && row.role !== filters.role) {
          return false;
        }

        if (filters.status !== "all" && row.statusKey !== filters.status) {
          return false;
        }

        if (!tableFilterValueMatches(row.email, filters.email)) {
          return false;
        }

        if (!tableFilterValueMatches(row.university, filters.university)) {
          return false;
        }

        if (!tableFilterValueMatches(row.major, filters.major)) {
          return false;
        }

        if (!tableFilterValueMatches(row.classYear, filters.classYear)) {
          return false;
        }

        if (!tableFilterValueMatches(row.teamName, filters.team)) {
          return false;
        }

        return true;
      }),
    [filters, userRows],
  );

  const rows = filteredRows.map((row) => ({
    id: row.id,
    name: row.name,
    studentId: row.studentId,
    role: row.roleLabel,
    status: row.statusLabel,
    email: row.email,
    university: row.university,
    major: row.major,
    classYear: row.classYear,
    team: row.teamName,
    providers: row.providers,
  }));
  const {
    page,
    setPage,
    pageCount,
    startIndex,
    paginatedRows,
  } = useAdminTablePagination(filteredRows, ADMIN_LIST_TABLE_PAGE_SIZE);

  return (
    <div className="space-y-6">
      <TableHeader
        id={ADMIN_TITLE_ID}
        title={locale === "en" ? "Participants" : "Thí sinh"}
        description={
          locale === "en"
            ? "Participant table with role, current competition status, academic info, and per-column filters."
            : "Bảng thí sinh gồm vai trò, trạng thái thi đấu, thông tin học tập và bộ lọc theo từng cột."
        }
        exportLabel={locale === "en" ? "Export participants.xlsx" : "Xuất participants.xlsx"}
        onExport={() => exportRowsToWorkbook("attacker-2026-participants.xlsx", "Participants", rows)}
      />

      <Surface className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b theme-border bg-[var(--panel-strong)] theme-text-soft">
              <tr>
                {[
                  "#",
                  locale === "en" ? "Name" : "Họ tên",
                  locale === "en" ? "Student ID" : "Mã sinh viên",
                  locale === "en" ? "Role" : "Vai trò",
                  locale === "en" ? "Status" : "Trạng thái",
                  "Email",
                  locale === "en" ? "University" : "Trường",
                  locale === "en" ? "Major" : "Chuyên ngành",
                  locale === "en" ? "Year" : "Năm học",
                  locale === "en" ? "Team" : "Đội thi",
                  locale === "en" ? "Edit" : "Chỉnh sửa",
                  locale === "en" ? "Delete" : "Xóa",
                ].map((label) => (
                  <th
                    key={label}
                    style={
                      label === "#"
                        ? { left: 0, width: 72, minWidth: 72 }
                        : label === (locale === "en" ? "Name" : "Họ tên")
                          ? { left: 72, minWidth: 260 }
                          : undefined
                    }
                    className={cn(
                      "px-4 py-3 font-medium",
                      label === "#" ? firstStickyHeadClass : "",
                      label === (locale === "en" ? "Name" : "Họ tên") ? secondStickyHeadClass : "",
                    )}
                  >
                    {label}
                  </th>
                ))}
              </tr>
              <tr className="border-t theme-border bg-[var(--panel)]">
                <th style={{ left: 0, width: 72, minWidth: 72 }} className={cn("px-4 py-3", firstStickyFilterClass)} />
                <th style={{ left: 72, minWidth: 260 }} className={cn("px-4 py-3", secondStickyFilterClass)}>
                  <TableFilterField
                    value={filters.name}
                    onChange={(value) => setFilters((current) => ({ ...current, name: value }))}
                    placeholder={locale === "en" ? "Filter name" : "Lọc họ tên"}
                  />
                </th>
                <th className="px-4 py-3">
                  <TableFilterField
                    value={filters.studentId}
                    onChange={(value) => setFilters((current) => ({ ...current, studentId: value }))}
                    placeholder={locale === "en" ? "Filter ID" : "Lọc MSSV"}
                  />
                </th>
                <th className="px-4 py-3">
                  <select
                    value={filters.role}
                    onChange={(event) => setFilters((current) => ({ ...current, role: event.target.value }))}
                    className="w-full rounded-xl border theme-border theme-panel-subtle px-3 py-2 text-xs theme-text-body outline-none"
                  >
                    <option value="all">{locale === "en" ? "All roles" : "Tất cả vai trò"}</option>
                    <option value="student">{locale === "en" ? "Participant" : "Thí sinh"}</option>
                  </select>
                </th>
                <th className="px-4 py-3">
                  <select
                    value={filters.status}
                    onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
                    className="w-full rounded-xl border theme-border theme-panel-subtle px-3 py-2 text-xs theme-text-body outline-none"
                  >
                    <option value="all">{locale === "en" ? "All statuses" : "Tất cả trạng thái"}</option>
                    <option value="round-1">{locale === "en" ? "Round 1" : "Vòng 1"}</option>
                    <option value="round-2">{locale === "en" ? "Round 2" : "Vòng 2"}</option>
                    <option value="round-3">{locale === "en" ? "Round 3" : "Vòng 3"}</option>
                    <option value="finished">{locale === "en" ? "Finished" : "Hoàn thành"}</option>
                    <option value="stopped">{locale === "en" ? "Stopped" : "Dừng"}</option>
                  </select>
                </th>
                <th className="px-4 py-3">
                  <TableFilterField
                    value={filters.email}
                    onChange={(value) => setFilters((current) => ({ ...current, email: value }))}
                    placeholder={locale === "en" ? "Filter email" : "Lọc email"}
                  />
                </th>
                <th className="px-4 py-3">
                  <TableFilterField
                    value={filters.university}
                    onChange={(value) => setFilters((current) => ({ ...current, university: value }))}
                    placeholder={locale === "en" ? "Filter university" : "Lọc trường"}
                  />
                </th>
                <th className="px-4 py-3">
                  <TableFilterField
                    value={filters.major}
                    onChange={(value) => setFilters((current) => ({ ...current, major: value }))}
                    placeholder={locale === "en" ? "Filter major" : "Lọc ngành"}
                  />
                </th>
                <th className="px-4 py-3">
                  <TableFilterField
                    value={filters.classYear}
                    onChange={(value) => setFilters((current) => ({ ...current, classYear: value }))}
                    placeholder={locale === "en" ? "Filter year" : "Lọc năm học"}
                  />
                </th>
                <th className="px-4 py-3">
                  <TableFilterField
                    value={filters.team}
                    onChange={(value) => setFilters((current) => ({ ...current, team: value }))}
                    placeholder={locale === "en" ? "Filter team" : "Lọc đội thi"}
                  />
                </th>
                <th className="px-4 py-3" />
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((row, index) => {
                return (
                  <tr key={row.id} className="border-b theme-border last:border-b-0">
                    <td
                      style={{ left: 0, width: 72, minWidth: 72 }}
                      className={cn("px-4 py-4 text-xs font-semibold theme-text-soft", firstStickyColumnClass)}
                    >
                      {startIndex + index + 1}
                    </td>
                    <td
                      style={{ left: 72, minWidth: 260 }}
                      className={cn("px-4 py-4", secondStickyColumnClass)}
                    >
                      <div>
                        <Link href={`/admin/users/${row.id}/profile`} className="font-semibold theme-accent">
                          {row.name}
                        </Link>
                        <p className="mt-1 text-xs theme-text-soft">{row.id}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <p className="theme-text-body">{row.studentId}</p>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <StatusPill tone={pickAdminRoleTone(row.role)}>
                        {row.roleLabel}
                      </StatusPill>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <StatusPill tone={row.statusTone}>{row.statusLabel}</StatusPill>
                    </td>
                    <td className="px-4 py-4 theme-text-body">{row.email}</td>
                    <td className="px-4 py-4 theme-text-body">{row.university}</td>
                    <td className="px-4 py-4 theme-text-body">{row.major}</td>
                    <td className="px-4 py-4 theme-text-body">{row.classYear}</td>
                    <td className="px-4 py-4 theme-text-body">{row.teamName || "-"}</td>
                    <td className="px-4 py-4">
                      <Link
                        href={`/admin/users/${row.id}`}
                        title={locale === "en" ? "Edit user" : "Sửa người dùng"}
                        aria-label={locale === "en" ? "Edit user" : "Sửa người dùng"}
                        className="theme-button-secondary inline-flex h-9 w-9 items-center justify-center rounded-full"
                      >
                        <FilePenLine className="h-3.5 w-3.5" />
                        <span className="sr-only">{locale === "en" ? "Edit user" : "Sửa người dùng"}</span>
                      </Link>
                    </td>
                    <td className="px-4 py-4">
                      <button
                        type="button"
                        disabled={row.id === "admin"}
                        onClick={() => {
                          const confirmed = window.confirm(
                            locale === "en"
                              ? `Delete ${row.name} from the admin dataset?`
                              : `Xoa ${row.name} khoi bo du lieu admin?`,
                          );

                          if (confirmed) {
                            deleteUserByAdmin(row.id);
                          }
                        }}
                        title={locale === "en" ? "Delete user" : "Xóa người dùng"}
                        aria-label={locale === "en" ? "Delete user" : "Xóa người dùng"}
                        className="theme-button-danger inline-flex h-9 w-9 items-center justify-center rounded-full disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span className="sr-only">{locale === "en" ? "Delete user" : "Xóa người dùng"}</span>
                      </button>
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
          totalRows={filteredRows.length}
          onPageChange={setPage}
        />
      </Surface>
    </div>
  );
}

function TeamsTableSection() {
  const { locale, teams, users, timelineItems, deleteTeamByAdmin } = useSiteState();
  useAdminTitleScroll();
  const firstStickyColumnClass = "sticky left-0 z-20 bg-[var(--panel)]";
  const secondStickyColumnClass = "sticky z-10 bg-[var(--panel)]";
  const firstStickyHeadClass = "sticky left-0 z-30 bg-[var(--panel-strong)]";
  const secondStickyHeadClass = "sticky z-20 bg-[var(--panel-strong)]";
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<"all" | "round-1" | "round-2" | "round-3">("all");

  const rows = useMemo(
    () =>
      teams.map((team) => {
        const leader = users.find((user) => user.id === team.leaderId);
        const members = team.memberIds
          .map((memberId) => users.find((user) => user.id === memberId)?.name ?? memberId)
          .join(", ");

        return {
          id: team.id,
          team: team.name,
          tag: team.tag,
          leaderId: leader?.id ?? "",
          leader: leader?.name ?? "",
          memberCount: team.memberIds.length,
          statusTone: pickTeamDisplayStatusTone(team, new Date(), timelineItems),
          status: pickTeamDisplayStatusLabel(locale, team, new Date(), timelineItems),
          stageKey: team.stage,
          stage: pickCompetitionStateLabel(locale, team.stage),
          keyword: team.track,
          createdAt: team.createdAt,
          members,
        };
      }),
    [locale, teams, timelineItems, users],
  );

  const filteredRows = useMemo(
    () =>
      rows.filter((row) => {
        const searchSource = [row.team, row.tag, row.leader, row.keyword, row.members, row.id].join(" ");

        if (!tableFilterValueMatches(searchSource, search)) {
          return false;
        }

        if (stageFilter !== "all" && row.stageKey !== stageFilter) {
          return false;
        }

        return true;
      }),
    [rows, search, stageFilter],
  );

  const exportRows = filteredRows.map((row) => ({
    id: row.id,
    team: row.team,
    tag: row.tag,
    leader: row.leader,
    members: row.memberCount,
    status: row.status,
    stage: row.stage,
    keyword: row.keyword,
    createdAt: row.createdAt,
  }));
  const {
    page,
    setPage,
    pageCount,
    startIndex,
    paginatedRows,
  } = useAdminTablePagination(filteredRows, ADMIN_LIST_TABLE_PAGE_SIZE);

  return (
    <div className="space-y-6">
      <TableHeader
        id={ADMIN_TITLE_ID}
        title={locale === "en" ? "Teams" : "Đội thi"}
        description={
          locale === "en"
            ? "Review team leadership, membership count, readiness, and creation date."
            : "Xem đội trưởng, số thành viên, mức độ sẵn sàng và ngày tạo đội."
        }
        exportLabel={locale === "en" ? "Export teams.xlsx" : "Xuat teams.xlsx"}
        onExport={() => exportRowsToWorkbook("attacker-2026-teams.xlsx", "Teams", exportRows)}
      />

      <Surface className="px-5 py-5 md:px-6">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1.45fr)_200px]">
          <label className="space-y-2">
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] theme-eyebrow">
              <Search className="h-3.5 w-3.5" />
              {locale === "en" ? "Search" : "Tìm kiếm"}
            </span>
            <TableFilterField
              value={search}
              onChange={setSearch}
              placeholder={
                locale === "en"
                  ? "Search by team, tag, leader, members..."
                  : "Tìm theo đội, tag, đội trưởng, thành viên..."
              }
            />
          </label>

          <label className="space-y-2">
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] theme-eyebrow">
              <Filter className="h-3.5 w-3.5" />
              {locale === "en" ? "Stage" : "Vòng"}
            </span>
            <select
              value={stageFilter}
              onChange={(event) => setStageFilter(event.target.value as typeof stageFilter)}
              className="theme-field h-11 w-full rounded-xl border px-3 text-sm outline-none"
            >
              <option value="all">{locale === "en" ? "All stages" : "Tất cả vòng"}</option>
              <option value="round-1">{locale === "en" ? "Round 1" : "Vòng 1"}</option>
              <option value="round-2">{locale === "en" ? "Round 2" : "Vòng 2"}</option>
              <option value="round-3">{locale === "en" ? "Round 3" : "Vòng 3"}</option>
            </select>
          </label>

        </div>
      </Surface>

      <Surface className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b theme-border bg-[var(--panel-strong)] theme-text-soft">
              <tr>
                {["#", "Team", "Tag", "Leader", "Members", "Status", "Stage", "Keyword", "Created", "Action"].map((label) => (
                  <th
                    key={label}
                    style={
                      label === "#"
                        ? { left: 0, width: 72, minWidth: 72 }
                        : label === "Team"
                          ? { left: 72, minWidth: 260 }
                          : undefined
                    }
                    className={cn(
                      "px-4 py-3 font-medium",
                      label === "#" ? firstStickyHeadClass : "",
                      label === "Team" ? secondStickyHeadClass : "",
                    )}
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((row, index) => {
                return (
                  <tr key={row.id} className="border-b theme-border last:border-b-0">
                    <td
                      style={{ left: 0, width: 72, minWidth: 72 }}
                      className={cn("px-4 py-4 text-xs font-semibold theme-text-soft", firstStickyColumnClass)}
                    >
                      {startIndex + index + 1}
                    </td>
                    <td
                      style={{ left: 72, minWidth: 260 }}
                      className={cn("px-4 py-4", secondStickyColumnClass)}
                    >
                      <div>
                        <Link href={`/admin/teams/${row.id}`} className="font-semibold theme-accent">
                          {row.team}
                        </Link>
                        <p className="mt-1 text-xs theme-text-soft">{row.id}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4 theme-text-body">{row.tag}</td>
                    <td className="px-4 py-4 theme-text-body">
                      {row.leaderId ? (
                        <Link
                          href={`/admin/users/${row.leaderId}/profile`}
                          className="font-medium theme-accent"
                        >
                          {row.leader}
                        </Link>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-4 py-4 theme-text-body">{row.memberCount}</td>
                    <td className="px-4 py-4 text-center">
                      <StatusPill tone={row.statusTone}>
                        {row.status}
                      </StatusPill>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <StatusPill>{row.stage}</StatusPill>
                    </td>
                    <td className="px-4 py-4 theme-text-body">{row.keyword}</td>
                    <td className="px-4 py-4 theme-text-body">
                      {formatDateLabel(locale, row.createdAt)}
                    </td>
                    <td className="px-4 py-4">
                      <button
                        type="button"
                        onClick={() => {
                          const confirmed = window.confirm(
                            locale === "en"
                              ? `Delete team ${row.team} from the admin dataset?`
                              : `Xoa doi ${row.team} khoi bo du lieu admin?`,
                          );

                          if (confirmed) {
                            deleteTeamByAdmin(row.id);
                          }
                        }}
                        title={locale === "en" ? "Delete team" : "Xóa đội"}
                        aria-label={locale === "en" ? "Delete team" : "Xóa đội"}
                        className="theme-button-danger inline-flex h-9 w-9 items-center justify-center rounded-full"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span className="sr-only">{locale === "en" ? "Delete team" : "Xóa đội"}</span>
                      </button>
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
          totalRows={filteredRows.length}
          onPageChange={setPage}
        />
      </Surface>
    </div>
  );
}

function SubmissionsTableSection() {
  return <AdminRound2SubmissionsManager />;
}

export function AdminPage({ section }: { section: AdminSection }) {
  return (
    <>
      {section === "overview" ? <OverviewSection /> : null}
      {section === "content" ? <ContentIndexSection /> : null}
      {section === "news" ? <AdminNewsList /> : null}
      {section === "judges" ? <AdminJudgesList /> : null}
      {section === "round1" ? <AdminRound1Manager /> : null}
      {section === "users" ? <UsersTableSection /> : null}
      {section === "organizerTeam" ? <AdminOrganizerManager /> : null}
      {section === "teams" ? <TeamsTableSection /> : null}
      {section === "submissions" ? <SubmissionsTableSection /> : null}
    </>
  );
}
