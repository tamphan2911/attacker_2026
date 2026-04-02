import type { LocalizedText } from "@/types/site";

export type ContentPageId =
  | "home"
  | "competition"
  | "faq"
  | "rules"
  | "news"
  | "sponsors"
  | "judges"
  | "auth"
  | "workspace"
  | "organizer";

export type ContentTypeId = "hero-slides" | "auth-notes" | "workspace-states";

interface EditorCardConfig<T extends string> {
  id: T;
  href: string;
  label: LocalizedText;
  description: LocalizedText;
}

type ContentPageConfig = EditorCardConfig<ContentPageId>;

interface ContentTypeConfig extends EditorCardConfig<ContentTypeId> {
  parentPageId: ContentPageId;
}

export const contentPageConfigs: ContentPageConfig[] = [
  {
    id: "home",
    href: "/admin/content/pages/home",
    label: { en: "Home", vi: "Trang chủ" },
    description: {
      en: "Homepage section copy and landing-page messaging.",
      vi: "Nội dung section và thông điệp landing page.",
    },
  },
  {
    id: "competition",
    href: "/admin/content/pages/competition",
    label: { en: "Competition", vi: "Cuộc thi" },
    description: {
      en: "Intro, rounds, rewards, and competition structure.",
      vi: "Giới thiệu, vòng thi, giải thưởng và cấu trúc cuộc thi.",
    },
  },
  {
    id: "faq",
    href: "/admin/content/pages/faq",
    label: { en: "FAQ", vi: "FAQ" },
    description: {
      en: "FAQ page heading and shared callout copy.",
      vi: "Heading của trang FAQ và nội dung callout được dùng chung.",
    },
  },
  {
    id: "rules",
    href: "/admin/content/pages/rules",
    label: { en: "Rules", vi: "Thể lệ" },
    description: {
      en: "Rules header, general rules, and round-specific rule copy.",
      vi: "Header, quy định chung và nội dung thể lệ theo từng vòng.",
    },
  },
  {
    id: "news",
    href: "/admin/content/pages/news",
    label: { en: "News", vi: "Tin tức" },
    description: {
      en: "Featured, latest updates, and related-news section copy.",
      vi: "Nội dung featured, latest updates và related news.",
    },
  },
  {
    id: "sponsors",
    href: "/admin/content/pages/sponsors",
    label: { en: "Sponsors", vi: "Nhà tài trợ" },
    description: {
      en: "Sponsor page header and partnership section copy.",
      vi: "Header của trang nhà tài trợ và section partnership.",
    },
  },
  {
    id: "judges",
    href: "/admin/content/pages/judges",
    label: { en: "Judges", vi: "Giám khảo" },
    description: {
      en: "Judge page header and clarity section copy.",
      vi: "Header trang giám khảo và nội dung section clarity.",
    },
  },
  {
    id: "auth",
    href: "/admin/content/pages/auth",
    label: { en: "Auth", vi: "Đăng nhập / Đăng ký" },
    description: {
      en: "Auth page heading copy only.",
      vi: "Chỉ sửa heading của trang đăng nhập / đăng ký.",
    },
  },
  {
    id: "workspace",
    href: "/admin/content/pages/workspace",
    label: { en: "Team Workspace", vi: "Không gian đội" },
    description: {
      en: "Workspace page header and main team-state entry copy.",
      vi: "Header của workspace và copy đầu vào cho trạng thái đội.",
    },
  },
  {
    id: "organizer",
    href: "/admin/content/pages/organizer",
    label: { en: "Organizer", vi: "Ban tổ chức" },
    description: {
      en: "Organizer header, content modules, and flags sections.",
      vi: "Header, content modules và flags của trang organizer.",
    },
  },
];

export const contentTypeConfigs: ContentTypeConfig[] = [
  {
    id: "hero-slides",
    href: "/admin/content/types/hero-slides",
    parentPageId: "home",
    label: { en: "Hero slides", vi: "Hero slides" },
    description: {
      en: "Manage homepage hero slide image paths and bilingual text.",
      vi: "Quản lý đường dẫn hình và nội dung song ngữ của hero slides.",
    },
  },
  {
    id: "auth-notes",
    href: "/admin/content/types/auth-notes",
    parentPageId: "auth",
    label: { en: "Auth notes", vi: "Ghi chú auth" },
    description: {
      en: "Register and sign-in support text shown below the auth form.",
      vi: "Nội dung hỗ trợ đăng ký và đăng nhập bên dưới form auth.",
    },
  },
  {
    id: "workspace-states",
    href: "/admin/content/types/workspace-states",
    parentPageId: "workspace",
    label: { en: "Workspace states", vi: "Trạng thái workspace" },
    description: {
      en: "No-team and existing-team state messages for the team workspace.",
      vi: "Thông điệp trạng thái chưa có đội và đã có đội trong workspace.",
    },
  },
];

export function isContentPageId(value: string): value is ContentPageId {
  return contentPageConfigs.some((item) => item.id === value);
}

export function isContentTypeId(value: string): value is ContentTypeId {
  return contentTypeConfigs.some((item) => item.id === value);
}
