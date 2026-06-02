import type { LocalizedText } from "@/types/site";

export type ContentPageId =
  | "home"
  | "construction"
  | "competition"
  | "faq"
  | "rules"
  | "timeline"
  | "round-1-results"
  | "finalists"
  | "emerging-results"
  | "final-results"
  | "news"
  | "forum"
  | "sponsors"
  | "judges"
  | "auth"
  | "workspace"
  | "organizer"
  | "seasons"
  | "season-2023"
  | "season-2024"
  | "season-2025"
  | "season-2026"
  | "contact"
  | "footer";

export type ContentTypeId = "hero-slides" | "home-testimonials" | "auth-notes" | "workspace-states";

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
    id: "construction",
    href: "/admin/content/pages/construction",
    label: { en: "Construction", vi: "Trang đang xây dựng" },
    description: {
      en: "Countdown page text and pre-launch auth gate copy.",
      vi: "Nội dung trang đếm ngược và cửa truy cập trước ngày công bố.",
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
    id: "timeline",
    href: "/admin/content/pages/timeline",
    label: { en: "Timeline", vi: "Lịch trình" },
    description: {
      en: "Timeline diagram, round summaries, and page labels around the stage list.",
      vi: "Sơ đồ lịch trình, phần tóm tắt theo vòng và các nhãn bao quanh danh sách giai đoạn.",
    },
  },
  {
    id: "round-1-results",
    href: "/admin/content/pages/round-1-results",
    label: { en: "Round 1 results", vi: "Kết quả Vòng 1" },
    description: {
      en: "Round 1 result announcement page text, waiting-state copy, table labels, and search messages.",
      vi: "Nội dung trang công bố kết quả Vòng 1, trạng thái chờ, nhãn bảng và thông báo tìm kiếm.",
    },
  },
  {
    id: "finalists",
    href: "/admin/content/pages/finalists",
    label: { en: "Finalists", vi: "Đội vào chung kết" },
    description: {
      en: "Finalist listing copy, recognition copy, and placeholder labels.",
      vi: "Nội dung danh sách chung kết, phần ghi nhận và các nhãn giữ chỗ.",
    },
  },
  {
    id: "emerging-results",
    href: "/admin/content/pages/emerging-results",
    label: { en: "Emerging results", vi: "Kết quả Đội ươm mầm" },
    description: {
      en: "Emerging result announcement page text, status labels, and team-card labels.",
      vi: "Nội dung trang công bố kết quả Đội ươm mầm, nhãn trạng thái và nhãn thẻ đội.",
    },
  },
  {
    id: "final-results",
    href: "/admin/content/pages/final-results",
    label: { en: "Final results", vi: "Kết quả chung cuộc" },
    description: {
      en: "Award-place copy, final result labels, and pending-state text.",
      vi: "Nội dung các hạng mục giải thưởng, nhãn kết quả cuối cùng và trạng thái chờ công bố.",
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
    id: "forum",
    href: "/admin/content/pages/forum",
    label: { en: "Forum", vi: "Forum" },
    description: {
      en: "Forum-page labels, list copy, reply composer copy, and new-thread modal text.",
      vi: "Các nhãn của trang forum, nội dung danh sách, khung phản hồi và văn bản của cửa sổ tạo chủ đề mới.",
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
    label: { en: "Team Workspace", vi: "Đội thi" },
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
  {
    id: "seasons",
    href: "/admin/content/pages/seasons",
    label: { en: "Seasons", vi: "Mùa thi" },
    description: {
      en: "Open a season editor to manage archive text, top teams, statistics, and slider images.",
      vi: "Mở từng trang mùa thi để chỉnh nội dung lưu trữ, top đội, thống kê và ảnh slider.",
    },
  },
  {
    id: "season-2023",
    href: "/admin/content/pages/season-2023",
    label: { en: "Season 2023", vi: "Mùa 2023" },
    description: {
      en: "Edit every public text block and slider image for the 2023 season detail page.",
      vi: "Chỉnh toàn bộ nội dung chữ và ảnh slider của trang chi tiết mùa 2023.",
    },
  },
  {
    id: "season-2024",
    href: "/admin/content/pages/season-2024",
    label: { en: "Season 2024", vi: "Mùa 2024" },
    description: {
      en: "Edit every public text block and slider image for the 2024 season detail page.",
      vi: "Chỉnh toàn bộ nội dung chữ và ảnh slider của trang chi tiết mùa 2024.",
    },
  },
  {
    id: "season-2025",
    href: "/admin/content/pages/season-2025",
    label: { en: "Season 2025", vi: "Mùa 2025" },
    description: {
      en: "Edit every public text block and slider image for the 2025 season detail page.",
      vi: "Chỉnh toàn bộ nội dung chữ và ảnh slider của trang chi tiết mùa 2025.",
    },
  },
  {
    id: "season-2026",
    href: "/admin/content/pages/season-2026",
    label: { en: "Season 2026", vi: "Mùa 2026" },
    description: {
      en: "Edit every public text block and slider image for the 2026 season detail page.",
      vi: "Chỉnh toàn bộ nội dung chữ và ảnh slider của trang chi tiết mùa 2026.",
    },
  },
  {
    id: "contact",
    href: "/admin/content/pages/contact",
    label: { en: "Contact", vi: "Liên hệ" },
    description: {
      en: "Contact-page labels, support copy, and official-channel headings.",
      vi: "Các nhãn của trang liên hệ, nội dung hỗ trợ và heading cho các kênh chính thức.",
    },
  },
  {
    id: "footer",
    href: "/admin/content/pages/footer",
    label: { en: "Footer", vi: "Footer" },
    description: {
      en: "Footer description, navigation/contact headings, snapshot cards, and copyright text.",
      vi: "Mô tả footer, heading điều hướng/liên hệ, thẻ tóm tắt và dòng bản quyền.",
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
    id: "home-testimonials",
    href: "/admin/content/types/home-testimonials",
    parentPageId: "home",
    label: { en: "Testimonials", vi: "Testimonial" },
    description: {
      en: "Manage homepage participant testimonials, avatars, and quotes.",
      vi: "Quản lý testimonial, ảnh đại diện và trích dẫn trên trang chủ.",
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
