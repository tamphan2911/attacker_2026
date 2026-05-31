import type {
  CompetitionRoundWindow,
  EditableOrganizerSeasonArchive,
  FAQItem,
  JudgeProfile,
  LeadershipTransferRequest,
  LocalizedText,
  MetricItem,
  NavItem,
  NewsPost,
  Round1TeamLockRequest,
  RewardItem,
  Round1Question,
  Round1Submission,
  Round1TestBank,
  RoundItem,
  RuleItem,
  SponsorProfile,
  SpotlightItem,
  TeamInvitation,
  TeamProfile,
  TeamSubmission,
  TestimonialItem,
  TimelineItem,
  UserProfile,
  SitePageContent,
} from "@/types/site";
import {
  preparationTestInvitations,
  preparationTestLeadershipTransferRequests,
  preparationTestRound1TeamLockRequests,
  preparationTestTeams,
  preparationTestUsers,
} from "@/data/preparation-test-data";

export const TEAM_MIN_MEMBERS = 3;
export const TEAM_MAX_MEMBERS = 5;
export const DEMO_ADMIN_LOGIN_ID = "admin";
export const DEMO_ADMIN_PASSWORD = "Aa@291189";

const seasonArchiveImagePool = [
  "/theme-hero-1.jpg",
  "/theme-hero-2.jpg",
  "/theme-feature-1.jpg",
  "/theme-feature-2.jpg",
];

function createSeasonMembers(university: string, offset: number) {
  const names = [
    "Nguyen Minh An",
    "Tran Gia Bao",
    "Le Khanh Linh",
    "Pham Hoang Nam",
    "Dang Thu Ha",
    "Vo Minh Quan",
    "Bui Ngoc Anh",
    "Hoang Phuong Nhi",
    "Do Quang Huy",
    "Phan Thao Vy",
  ];
  const majors = [
    "Finance",
    "Data Analytics",
    "Software Engineering",
    "Business Administration",
    "Banking",
    "Marketing",
  ];

  return [0, 1, 2].map((item) => ({
    name: names[(offset + item) % names.length],
    university,
    major: majors[(offset + item) % majors.length],
  }));
}

function createSeasonArchiveTeam({
  rankEn,
  rankVi,
  name,
  projectNameEn,
  projectNameVi,
  projectDescriptionEn,
  projectDescriptionVi,
  university,
  memberOffset,
}: {
  rankEn: string;
  rankVi: string;
  name: string;
  projectNameEn: string;
  projectNameVi: string;
  projectDescriptionEn: string;
  projectDescriptionVi: string;
  university: string;
  memberOffset: number;
}) {
  return {
    rank: { en: rankEn, vi: rankVi },
    name: { en: name, vi: name },
    projectName: { en: projectNameEn, vi: projectNameVi },
    projectDescription: { en: projectDescriptionEn, vi: projectDescriptionVi },
    members: createSeasonMembers(university, memberOffset),
  };
}

function createSeasonArchiveSlides(year: string, heroImage: string) {
  return Array.from({ length: 10 }, (_, index) => ({
    image: index === 0 ? heroImage : seasonArchiveImagePool[(index + year.length) % seasonArchiveImagePool.length],
    alt: {
      en: `Attacker ${year} season photo ${index + 1}`,
      vi: `Ảnh mùa Attacker ${year} số ${index + 1}`,
    },
  }));
}

function createOrganizerSeasonArchives(): EditableOrganizerSeasonArchive[] {
  return [
    {
      year: "2023",
      overviewTitle: {
        en: "The foundation season built Attacker's first serious student fintech arena.",
        vi: "Mùa nền tảng xây dựng sân chơi fintech sinh viên nghiêm túc đầu tiên của Attacker.",
      },
      overview: [
        {
          en: "The season focused on turning finance ideas into working team projects, with students learning how to explain product logic, market need, and execution plans in one clear pitch.",
          vi: "Mùa thi tập trung biến ý tưởng tài chính thành dự án nhóm có thể trình bày rõ logic sản phẩm, nhu cầu thị trường và kế hoạch triển khai.",
        },
        {
          en: "The top teams created the first finalist archive for Attacker and gave later seasons a stronger model for team formation, mentoring, and final presentation.",
          vi: "Nhóm top đầu tạo nên lớp hồ sơ chung kết đầu tiên cho Attacker và giúp các mùa sau có mô hình tốt hơn về lập đội, cố vấn và trình bày chung kết.",
        },
      ],
      stats: [
        { value: "300+", label: { en: "participants", vi: "Thí sinh" } },
        { value: "20+", label: { en: "campuses", vi: "Trường/đơn vị" } },
        { value: "05", label: { en: "top teams", vi: "Đội top 5" } },
        { value: "50M", label: { en: "cash reward", vi: "Hiện kim" } },
      ],
      topTeams: [
        createSeasonArchiveTeam({
          rankEn: "1st place",
          rankVi: "Hạng 1",
          name: "MarketPulse",
          projectNameEn: "SME cashflow assistant",
          projectNameVi: "Trợ lý dòng tiền cho SME",
          projectDescriptionEn:
            "A lightweight cashflow planning tool that helps small businesses forecast short-term liquidity pressure.",
          projectDescriptionVi:
            "Công cụ lập kế hoạch dòng tiền giúp doanh nghiệp nhỏ dự báo áp lực thanh khoản ngắn hạn.",
          university: "University of Economics and Law, VNU-HCM",
          memberOffset: 0,
        }),
        createSeasonArchiveTeam({
          rankEn: "2nd place",
          rankVi: "Hạng 2",
          name: "PayWise",
          projectNameEn: "Student payment planning wallet",
          projectNameVi: "Ví lập kế hoạch chi tiêu sinh viên",
          projectDescriptionEn:
            "A wallet concept that categorizes student expenses and nudges safer budgeting behavior before deadlines.",
          projectDescriptionVi:
            "Ý tưởng ví phân loại chi tiêu sinh viên và nhắc hành vi ngân sách an toàn trước các mốc thanh toán.",
          university: "University of Economics Ho Chi Minh City",
          memberOffset: 2,
        }),
        createSeasonArchiveTeam({
          rankEn: "3rd place",
          rankVi: "Hạng 3",
          name: "CreditFlow",
          projectNameEn: "Micro-credit screening model",
          projectNameVi: "Mô hình sàng lọc tín dụng nhỏ",
          projectDescriptionEn:
            "A scoring approach for early borrower screening using behavior signals and simplified financial profiles.",
          projectDescriptionVi:
            "Cách tiếp cận chấm điểm để sàng lọc người vay sớm bằng tín hiệu hành vi và hồ sơ tài chính đơn giản.",
          university: "Banking University of Ho Chi Minh City",
          memberOffset: 4,
        }),
        createSeasonArchiveTeam({
          rankEn: "Finalist",
          rankVi: "Đồng hạng 4",
          name: "BudgetBee",
          projectNameEn: "Household saving habit tracker",
          projectNameVi: "Theo dõi thói quen tiết kiệm hộ gia đình",
          projectDescriptionEn:
            "A habit-based savings assistant that turns monthly financial goals into smaller daily actions.",
          projectDescriptionVi:
            "Trợ lý tiết kiệm theo thói quen, chia mục tiêu tài chính hằng tháng thành hành động nhỏ mỗi ngày.",
          university: "Foreign Trade University",
          memberOffset: 6,
        }),
        createSeasonArchiveTeam({
          rankEn: "Finalist",
          rankVi: "Đồng hạng 4",
          name: "FinLens",
          projectNameEn: "Personal finance insight dashboard",
          projectNameVi: "Bảng phân tích tài chính cá nhân",
          projectDescriptionEn:
            "A dashboard that helps young users read spending trends and identify avoidable financial leakage.",
          projectDescriptionVi:
            "Dashboard giúp người dùng trẻ đọc xu hướng chi tiêu và nhận diện các khoản thất thoát có thể tránh.",
          university: "RMIT Vietnam",
          memberOffset: 8,
        }),
      ],
      photoSlides: createSeasonArchiveSlides("2023", "/theme-feature-1.jpg"),
    },
    {
      year: "2024",
      overviewTitle: {
        en: "Algorithmic Trading made the season more concrete, measurable, and market-facing.",
        vi: "Algorithmic Trading giúp mùa thi cụ thể hơn, đo lường tốt hơn và gần thị trường hơn.",
      },
      overview: [
        {
          en: "Attacker 2024 moved students from online qualifiers into a practical trading journey, where each decision had to be linked to data, risk discipline, and market explanation.",
          vi: "Attacker 2024 đưa thí sinh từ vòng loại trực tuyến vào hành trình giao dịch thực chiến, nơi mỗi quyết định phải gắn với dữ liệu, kỷ luật rủi ro và diễn giải thị trường.",
        },
        {
          en: "The finalist teams were evaluated not only by trading output, but also by their ability to defend assumptions, explain signals, and communicate portfolio logic.",
          vi: "Các đội chung kết được đánh giá không chỉ bằng kết quả giao dịch mà còn bằng khả năng bảo vệ giả định, giải thích tín hiệu và truyền đạt logic danh mục.",
        },
      ],
      stats: [
        { value: "800+", label: { en: "participants", vi: "Thí sinh" } },
        { value: "50", label: { en: "universities", vi: "Trường đại học" } },
        { value: "05", label: { en: "top teams", vi: "Đội top 5" } },
        { value: "250M", label: { en: "cash reward", vi: "Hiện kim" } },
      ],
      topTeams: [
        createSeasonArchiveTeam({
          rankEn: "1st place",
          rankVi: "Hạng 1",
          name: "AlphaQuant",
          projectNameEn: "Momentum trading strategy",
          projectNameVi: "Chiến lược giao dịch theo động lượng",
          projectDescriptionEn:
            "A rule-based trading framework combining signal filters, position sizing, and final market defense.",
          projectDescriptionVi:
            "Khung giao dịch theo luật kết hợp bộ lọc tín hiệu, quản trị vị thế và phần bảo vệ thị trường chung kết.",
          university: "University of Economics and Law, VNU-HCM",
          memberOffset: 1,
        }),
        createSeasonArchiveTeam({
          rankEn: "2nd place",
          rankVi: "Hạng 2",
          name: "SignalCraft",
          projectNameEn: "Signal review and portfolio discipline",
          projectNameVi: "Rà soát tín hiệu và kỷ luật danh mục",
          projectDescriptionEn:
            "A trading analytics setup that explains entry logic, risk controls, and performance attribution.",
          projectDescriptionVi:
            "Bộ phân tích giao dịch giải thích logic vào lệnh, kiểm soát rủi ro và phân rã hiệu quả danh mục.",
          university: "University of Economics Ho Chi Minh City",
          memberOffset: 3,
        }),
        createSeasonArchiveTeam({
          rankEn: "3rd place",
          rankVi: "Hạng 3",
          name: "Delta Edge",
          projectNameEn: "Data-backed trading model",
          projectNameVi: "Mô hình giao dịch dựa trên dữ liệu",
          projectDescriptionEn:
            "A model-focused project that tested market indicators and translated findings into final-round decisions.",
          projectDescriptionVi:
            "Dự án tập trung vào mô hình, kiểm tra chỉ báo thị trường và chuyển kết quả thành quyết định ở vòng chung kết.",
          university: "Nha Trang University",
          memberOffset: 5,
        }),
        createSeasonArchiveTeam({
          rankEn: "Finalist",
          rankVi: "Đồng hạng 4",
          name: "MarketMakers",
          projectNameEn: "Market monitoring toolkit",
          projectNameVi: "Bộ công cụ theo dõi thị trường",
          projectDescriptionEn:
            "A monitoring toolkit for tracking volatility, portfolio exposure, and signal reliability during live trading.",
          projectDescriptionVi:
            "Bộ công cụ theo dõi biến động, mức độ phơi nhiễm danh mục và độ tin cậy tín hiệu trong giao dịch thực chiến.",
          university: "Banking University of Ho Chi Minh City",
          memberOffset: 7,
        }),
        createSeasonArchiveTeam({
          rankEn: "Finalist",
          rankVi: "Đồng hạng 4",
          name: "QuantVista",
          projectNameEn: "Trading decision dashboard",
          projectNameVi: "Dashboard hỗ trợ quyết định giao dịch",
          projectDescriptionEn:
            "A dashboard concept that helps teams compare strategy performance and explain market choices to judges.",
          projectDescriptionVi:
            "Ý tưởng dashboard giúp đội so sánh hiệu quả chiến lược và giải thích lựa chọn thị trường trước giám khảo.",
          university: "University of Information Technology, VNU-HCM",
          memberOffset: 9,
        }),
      ],
      photoSlides: createSeasonArchiveSlides("2024", "/theme-hero-2.jpg"),
    },
    {
      year: "2025",
      overviewTitle: {
        en: "The season expanded into stronger product, legal-tech, and user impact stories.",
        vi: "Mùa thi mở rộng sang các câu chuyện sản phẩm, legal-tech và tác động người dùng rõ hơn.",
      },
      overview: [
        {
          en: "Attacker 2025 put more weight on product maturity, market relevance, and the ability to connect fintech ideas with real users and institutional needs.",
          vi: "Attacker 2025 nhấn mạnh hơn vào độ chín sản phẩm, mức độ liên quan thị trường và khả năng nối ý tưởng fintech với người dùng thật và nhu cầu tổ chức.",
        },
        {
          en: "The top teams brought a broader range of solutions, from AI legal support for finance to risk, payment, and consumer finance workflows.",
          vi: "Các đội top đầu mang đến dải giải pháp rộng hơn, từ hỗ trợ pháp lý bằng AI cho tài chính đến rủi ro, thanh toán và luồng tài chính tiêu dùng.",
        },
      ],
      stats: [
        { value: "2,000+", label: { en: "candidates", vi: "Thí sinh" } },
        { value: "250", label: { en: "projects", vi: "Dự án" } },
        { value: "05", label: { en: "top teams", vi: "Đội top 5" } },
        { value: "65M", label: { en: "cash reward", vi: "Hiện kim" } },
      ],
      topTeams: [
        createSeasonArchiveTeam({
          rankEn: "1st place",
          rankVi: "Hạng 1",
          name: "URA-xLaw",
          projectNameEn: "AI legal Q&A for finance",
          projectNameVi: "Hỏi đáp pháp lý AI cho tài chính",
          projectDescriptionEn:
            "An AI-powered legal support platform for banking and financial institutions that need faster compliance guidance.",
          projectDescriptionVi:
            "Nền tảng hỗ trợ pháp lý bằng AI cho ngân hàng và tổ chức tài chính cần hướng dẫn tuân thủ nhanh hơn.",
          university: "Ho Chi Minh City University of Technology, VNU-HCM",
          memberOffset: 0,
        }),
        createSeasonArchiveTeam({
          rankEn: "2nd place",
          rankVi: "Hạng 2",
          name: "RiskLens",
          projectNameEn: "Retail risk early-warning system",
          projectNameVi: "Cảnh báo sớm rủi ro bán lẻ",
          projectDescriptionEn:
            "A risk monitoring concept that detects early stress signals from customer behavior and repayment patterns.",
          projectDescriptionVi:
            "Ý tưởng giám sát rủi ro phát hiện tín hiệu căng thẳng sớm từ hành vi khách hàng và mẫu trả nợ.",
          university: "Banking University of Ho Chi Minh City",
          memberOffset: 2,
        }),
        createSeasonArchiveTeam({
          rankEn: "3rd place",
          rankVi: "Hạng 3",
          name: "CashGuard",
          projectNameEn: "Fraud-aware payment flow",
          projectNameVi: "Luồng thanh toán nhận diện gian lận",
          projectDescriptionEn:
            "A payment workflow that flags suspicious behavior while keeping the user journey light and explainable.",
          projectDescriptionVi:
            "Luồng thanh toán gắn cờ hành vi đáng ngờ nhưng vẫn giữ trải nghiệm người dùng gọn và dễ giải thích.",
          university: "Foreign Trade University",
          memberOffset: 4,
        }),
        createSeasonArchiveTeam({
          rankEn: "Finalist",
          rankVi: "Đồng hạng 4",
          name: "FinBloom",
          projectNameEn: "Youth investment education app",
          projectNameVi: "Ứng dụng giáo dục đầu tư cho người trẻ",
          projectDescriptionEn:
            "A guided learning app that connects investment basics with simulated portfolio decisions for students.",
          projectDescriptionVi:
            "Ứng dụng học có hướng dẫn, nối kiến thức đầu tư cơ bản với quyết định danh mục mô phỏng cho sinh viên.",
          university: "National Economics University",
          memberOffset: 6,
        }),
        createSeasonArchiveTeam({
          rankEn: "Finalist",
          rankVi: "Đồng hạng 4",
          name: "CreditBridge",
          projectNameEn: "Alternative student credit profile",
          projectNameVi: "Hồ sơ tín dụng thay thế cho sinh viên",
          projectDescriptionEn:
            "A credit-profile concept that uses learning, work, and payment behavior to support responsible access to finance.",
          projectDescriptionVi:
            "Ý tưởng hồ sơ tín dụng dùng hành vi học tập, làm việc và thanh toán để hỗ trợ tiếp cận tài chính có trách nhiệm.",
          university: "RMIT Vietnam",
          memberOffset: 8,
        }),
      ],
      photoSlides: createSeasonArchiveSlides("2025", "/theme-hero-1.jpg"),
    },
    {
      year: "2026",
      overviewTitle: {
        en: "The new season page is ready to become the live archive once 2026 results are confirmed.",
        vi: "Trang mùa 2026 đã sẵn sàng trở thành hồ sơ lưu trữ khi kết quả chính thức được xác nhận.",
      },
      overview: [
        {
          en: "The 2026 season is structured around an individual qualifier, a team report round, and a final presentation stage designed for stronger judge feedback.",
          vi: "Mùa 2026 được cấu trúc quanh bài thi cá nhân, vòng báo cáo nhóm và phần trình bày chung kết nhằm tạo phản biện mạnh hơn từ giám khảo.",
        },
        {
          en: "The finalist records below can be updated from the admin season editor when official team names, universities, projects, and photos are confirmed.",
          vi: "Các hồ sơ chung kết bên dưới có thể được cập nhật trong trang quản trị mùa thi khi BTC xác nhận tên đội, trường, dự án và hình ảnh chính thức.",
        },
      ],
      stats: [
        { value: "03", label: { en: "rounds", vi: "Vòng thi" } },
        { value: "50", label: { en: "teams to Round 2", vi: "Đội vào Vòng 2" } },
        { value: "05", label: { en: "top teams", vi: "Đội top 5" } },
        { value: "65M", label: { en: "cash reward", vi: "Hiện kim" } },
      ],
      topTeams: [
        createSeasonArchiveTeam({
          rankEn: "1st place",
          rankVi: "Hạng 1",
          name: "Champion profile",
          projectNameEn: "Official champion project",
          projectNameVi: "Dự án quán quân chính thức",
          projectDescriptionEn:
            "This card is prepared for the winning team profile after the final presentation event.",
          projectDescriptionVi:
            "Thẻ này được chuẩn bị cho hồ sơ đội chiến thắng sau sự kiện trình bày chung kết.",
          university: "Organizer archive",
          memberOffset: 0,
        }),
        createSeasonArchiveTeam({
          rankEn: "2nd place",
          rankVi: "Hạng 2",
          name: "Runner-up profile",
          projectNameEn: "Official runner-up project",
          projectNameVi: "Dự án á quân chính thức",
          projectDescriptionEn:
            "This finalist profile can be replaced with the official second-place team data.",
          projectDescriptionVi:
            "Hồ sơ chung kết này có thể được thay bằng dữ liệu chính thức của đội hạng 2.",
          university: "Organizer archive",
          memberOffset: 2,
        }),
        createSeasonArchiveTeam({
          rankEn: "3rd place",
          rankVi: "Hạng 3",
          name: "Third-place profile",
          projectNameEn: "Official third-place project",
          projectNameVi: "Dự án quý quân chính thức",
          projectDescriptionEn:
            "This finalist profile can be updated after final scoring is confirmed.",
          projectDescriptionVi:
            "Hồ sơ chung kết này có thể được cập nhật sau khi điểm chung kết được xác nhận.",
          university: "Organizer archive",
          memberOffset: 4,
        }),
        createSeasonArchiveTeam({
          rankEn: "Finalist",
          rankVi: "Đồng hạng 4",
          name: "Finalist profile",
          projectNameEn: "Official finalist project",
          projectNameVi: "Dự án chung kết chính thức",
          projectDescriptionEn:
            "Prepared for one of the two remaining finalist teams in the top 5.",
          projectDescriptionVi:
            "Chuẩn bị cho một trong hai đội chung kết còn lại trong top 5.",
          university: "Organizer archive",
          memberOffset: 6,
        }),
        createSeasonArchiveTeam({
          rankEn: "Finalist",
          rankVi: "Đồng hạng 4",
          name: "Finalist profile",
          projectNameEn: "Official finalist project",
          projectNameVi: "Dự án chung kết chính thức",
          projectDescriptionEn:
            "Prepared for the other remaining finalist team in the top 5.",
          projectDescriptionVi:
            "Chuẩn bị cho đội chung kết còn lại trong top 5.",
          university: "Organizer archive",
          memberOffset: 8,
        }),
      ],
      photoSlides: createSeasonArchiveSlides("2026", "/theme-feature-2.jpg"),
    },
  ];
}

const homepageTestimonialsSeed: TestimonialItem[] = [
  {
    id: "voice-nguyen-duc-phu",
    name: "Nguyễn Đức Phú",
    competitionRole: {
      en: "Attacker 2025 finalist · Team lead",
      vi: "Chung kết Attacker 2025 · Đội trưởng",
    },
    university: "Trường Đại học Kinh tế - Luật",
    currentEmployment: {
      en: "Equity research intern · Mirae Asset Vietnam",
      vi: "Thực tập sinh phân tích cổ phiếu · Mirae Asset Việt Nam",
    },
    avatarImageSrc: "/testimonials/nguyen-duc-phu.svg",
    quote: {
      en: "The strongest value came from how close the challenge felt to real market decisions and investor feedback.",
      vi: "Giá trị lớn nhất là cảm giác đề bài rất gần với quyết định thị trường thực tế và cách nhà đầu tư phản biện.",
    },
  },
  {
    id: "voice-tran-thi-nhan",
    name: "Trần Thị Nhàn",
    competitionRole: {
      en: "Attacker 2025 champion · Strategy lead",
      vi: "Quán quân Attacker 2025 · Trưởng nhóm chiến lược",
    },
    university: "Trường Đại học Ngân hàng TP. Hồ Chí Minh",
    currentEmployment: {
      en: "Risk management analyst · Techcombank",
      vi: "Chuyên viên quản trị rủi ro · Techcombank",
    },
    avatarImageSrc: "/testimonials/tran-thi-nhan.svg",
    quote: {
      en: "Attacker created the right mix of academic depth, team execution, and business relevance for students who want to build in finance.",
      vi: "Attacker tạo ra sự cân bằng rất đúng giữa chiều sâu học thuật, năng lực triển khai đội nhóm và tính thực tiễn cho sinh viên muốn đi theo tài chính.",
    },
  },
  {
    id: "voice-pham-nguyen-khanh-huy",
    name: "Phạm Nguyễn Khánh Huy",
    competitionRole: {
      en: "Attacker 2025 Emerging Team · Product lead",
      vi: "Đội ươm mầm Attacker 2025 · Trưởng nhóm sản phẩm",
    },
    university: "Đại học Kinh tế TP. Hồ Chí Minh",
    avatarImageSrc: "/testimonials/pham-nguyen-khanh-huy.svg",
    quote: {
      en: "Even more than the ranking, the competition pushed us to think in product, data, and presentation terms at the same time.",
      vi: "Quan trọng hơn cả thứ hạng là cuộc thi buộc đội phải trưởng thành đồng thời về sản phẩm, dữ liệu và khả năng trình bày.",
    },
  },
];

export const contactInfo = {
  email: "attacker@uel.edu.vn",
  phone: "0378 398 638",
  attackerFacebook: "https://www.facebook.com/clbfintechuel",
  ftcFacebook: "https://www.facebook.com/clbfintechuel",
};

export const contactLocation = {
  campusName: {
    en: "Faculty of Finance and Banking, University of Economics and Law",
    vi: "Khoa Tài chính - Ngân hàng, Trường Đại học Kinh tế - Luật",
  },
  address: {
    en: "Số 669 Đỗ Mười, khu phố 13, phường Linh Xuân, TP.HCM",
    vi: "Số 669 Đỗ Mười, khu phố 13, phường Linh Xuân, TP.HCM",
  },
  note: {
    en: "",
    vi: "",
  },
  mapEmbedUrl:
    "https://www.google.com/maps?q=University%20of%20Economics%20and%20Law%2C%20Vietnam%20National%20University%20Ho%20Chi%20Minh%20City&output=embed",
};

export const contactDeskContacts = [
  {
    name: "Nguyễn Minh Châu",
    phone: "0901 238 468",
    tel: "0901238468",
    responsibility: {
      en: "Contestant support, registration questions, and account guidance",
      vi: "Hỗ trợ thí sinh, giải đáp đăng ký và hướng dẫn tài khoản",
    },
  },
  {
    name: "Trần Hoàng Long",
    phone: "0918 552 147",
    tel: "0918552147",
    responsibility: {
      en: "Team formation, eligibility rules, and Round 1 logistics",
      vi: "Tạo đội, điều kiện dự thi và hậu cần Vòng 1",
    },
  },
  {
    name: "Lê Quỳnh Như",
    phone: "0933 401 225",
    tel: "0933401225",
    responsibility: {
      en: "Media, communications, and sponsor visibility requests",
      vi: "Truyền thông, nội dung đối ngoại và nhu cầu hiển thị nhà tài trợ",
    },
  },
  {
    name: "Phạm Đức Long",
    phone: "0967 889 314",
    tel: "0967889314",
    responsibility: {
      en: "Technical issues on the platform, submissions, and file support",
      vi: "Sự cố kỹ thuật trên nền tảng, nộp bài và hỗ trợ tệp đính kèm",
    },
  },
  {
    name: "Võ Khánh Linh",
    phone: "0985 772 036",
    tel: "0985772036",
    responsibility: {
      en: "Judges, guests, partnership scheduling, and on-site coordination",
      vi: "Điều phối giám khảo, khách mời, đối tác và lịch trình hiện trường",
    },
  },
] as const;

const round1Window = {
  startDate: "2026-05-16",
  endDate: "2026-05-17",
};

const round2Window = {
  startDate: "2026-05-25",
  endDate: "2026-06-08",
};

const round3Window = {
  startDate: "2026-06-21",
  endDate: "2026-07-04",
};

const round3FinalReportWindow = {
  startDate: "2026-06-21",
  endDate: "2026-06-28",
};

const round3PresentationWindow = {
  startDate: "2026-07-04",
  endDate: "2026-07-04",
};

export const competitionRoundWindows: CompetitionRoundWindow[] = [
  {
    round: "round-1",
    title: { en: "Round 1 individual qualifier", vi: "Vòng 1 bài thi cá nhân" },
    ...round1Window,
  },
  {
    round: "round-2",
    title: { en: "Round 2 report submission", vi: "Vòng 2 nộp báo cáo" },
    ...round2Window,
  },
  {
    round: "round-3",
    title: { en: "Final round schedule", vi: "Lịch trình vòng chung kết" },
    ...round3Window,
  },
];

export const navItems: NavItem[] = [
  { href: "/", label: { en: "Home", vi: "Trang chủ" } },
  { href: "/competition", label: { en: "Competition", vi: "Cuộc thi" } },
  { href: "/rules", label: { en: "Rules", vi: "Thể lệ" } },
  { href: "/news", label: { en: "News", vi: "Tin tức" } },
  { href: "/dashboard", label: { en: "Team Workspace", vi: "Đội thi" } },
  { href: "/organizer", label: { en: "About", vi: "Giới thiệu" } },
  { href: "/contact", label: { en: "Contact", vi: "Liên hệ" } },
];

export const heroCopy = {
  eyebrow: {
    en: "Student fintech competition 2026",
    vi: "Cuộc thi fintech sinh viên 2026",
  },
  title: {
    en: "Attacker 2026 is a sharper, faster stage for student builders in finance.",
    vi: "Attacker 2026 là một sân chơi sắc nét hơn, nhanh hơn dành cho sinh viên kiến tạo trong lĩnh vực tài chính.",
  },
  description: {
    en: "A bilingual competition platform for algorithmic thinking, product strategy, and venture-ready execution. Built for modern students, mentors, and organizers.",
    vi: "Một nền tảng song ngữ cho cuộc thi kết hợp tư duy giao dịch thuật toán, chiến lược sản phẩm và khả năng triển khai như một startup. Được thiết kế cho sinh viên, mentor và ban tổ chức hiện đại.",
  },
  primaryCta: { en: "Start team workspace", vi: "Mở Đội thi" },
  secondaryCta: { en: "Explore competition", vi: "Khám phá cuộc thi" },
  panelTitle: { en: "Why this concept works", vi: "Vì sao concept này phù hợp" },
  panelItems: [
    {
      en: "Responsive editorial layout for public information and news",
      vi: "Bố cục biên tập responsive cho thông tin và tin tức",
    },
    {
      en: "Interactive team rules prototype before backend build",
      vi: "Mô phỏng quy tắc đội thi tương tác trước khi làm backend",
    },
    {
      en: "Blue-led palette inherited from the old brand, but with a cleaner global look",
      vi: "Bảng màu xanh giữ tinh thần thương hiệu cũ nhưng được làm mới theo hướng quốc tế",
    },
  ] satisfies LocalizedText[],
};

export const defaultPageContent: SitePageContent = {
  siteHeader: {
    slogan: {
      en: "ARE YOU INNOVATORS? WE'RE YOUR INVESTORS",
      vi: "ARE YOU INNOVATORS? WE'RE YOUR INVESTORS",
    },
    email: contactInfo.email,
    phone: contactInfo.phone,
    facebookLabel: { en: "Facebook", vi: "Facebook" },
    facebookUrl: contactInfo.attackerFacebook,
  },
  home: {
    heroSlides: [
      {
        id: "signal",
        image: "/theme-hero-1.jpg",
        eyebrow: {
          en: "General overview",
          vi: "Tổng quan cuộc thi",
        },
        title: {
          en: "National fintech challenge for student teams",
          vi: "Sân chơi fintech toàn quốc dành cho đội thi sinh viên",
        },
        description: {
          en: "Attacker 2026 brings students into a three-round journey where finance, strategy, product thinking, and presentation all matter.",
          vi: "Attacker 2026 đưa sinh viên vào hành trình ba vòng thi, nơi tư duy tài chính, chiến lược, sản phẩm và khả năng trình bày đều quan trọng.",
        },
        highlights: [
          { en: "Students nationwide", vi: "Sinh viên trên toàn quốc" },
          { en: "Teams of 3-5", vi: "Đội hình 3-5 người" },
          { en: "Finance + product + data", vi: "Tài chính + sản phẩm + dữ liệu" },
        ],
        primaryCta: {
          href: "/competition",
          label: { en: "Competition overview", vi: "Tổng quan cuộc thi" },
        },
        secondaryCta: {
          href: "/competition#competition-journey",
          label: { en: "About Attacker", vi: "Giới thiệu Attacker" },
        },
        cards: [
          {
            label: { en: "Participants", vi: "Đối tượng" },
            value: { en: "University students", vi: "Sinh viên đại học" },
            note: {
              en: "Built for teams who want to test ideas in fintech and innovation.",
              vi: "Dành cho các đội muốn thử sức với ý tưởng fintech và đổi mới.",
            },
          },
          {
            label: { en: "Format", vi: "Cấu trúc" },
            value: { en: "3 competition rounds", vi: "3 vòng thi" },
            note: {
              en: "Individual qualifier, project report, and live final defense.",
              vi: "Thi cá nhân, báo cáo dự án và thuyết trình bảo vệ ở chung kết.",
            },
          },
          {
            label: { en: "Focus", vi: "Trọng tâm" },
            value: { en: "Think, build, defend", vi: "Tư duy, triển khai, bảo vệ" },
            note: {
              en: "A serious challenge for students interested in finance, data, and products.",
              vi: "Một sân chơi nghiêm túc cho sinh viên quan tâm tài chính, dữ liệu và sản phẩm.",
            },
          },
        ],
      },
      {
        id: "teams",
        image: "/theme-hero-2.jpg",
        eyebrow: {
          en: "Rewards snapshot",
          vi: "Tóm tắt giải thưởng",
        },
        title: {
          en: "Top 5 finalist awards with sponsor-backed benefits",
          vi: "Giải thưởng cho top 5 cùng các quyền lợi đồng hành từ nhà tài trợ",
        },
        description: {
          en: "The prize structure rewards the final ranking clearly, while sponsor gifts, scholarships, and other non-cash benefits expand the value beyond cash awards.",
          vi: "Cấu trúc giải thưởng tách bạch theo thứ hạng chung kết, đồng thời quà tặng, học bổng và quyền lợi phi tiền mặt từ nhà tài trợ giúp giá trị cuộc thi vượt ra ngoài tiền thưởng.",
        },
        highlights: [
          { en: "30M champion prize", vi: "30 triệu cho quán quân" },
          { en: "Top 20 Emerging round qualifiers", vi: "Top 20 đội vào Vòng Đội ươm mầm" },
          { en: "Gifts and scholarships", vi: "Quà tặng và học bổng" },
        ],
        primaryCta: {
          href: "/competition",
          label: { en: "View reward structure", vi: "Xem cơ cấu giải thưởng" },
        },
        secondaryCta: {
          href: "/competition/sponsors",
          label: { en: "Sponsor partners", vi: "Đối tác tài trợ" },
        },
        cards: [
          {
            label: { en: "Champion", vi: "Quán quân" },
            value: { en: "30,000,000 VND", vi: "30.000.000 VND" },
            note: {
              en: "Followed by runner-up, third place, and two finalist teams sharing 4th place awards.",
              vi: "Tiếp theo là á quân, hạng 3 và hai đội đồng hạng 4 ở vòng chung kết.",
            },
          },
          {
            label: { en: "Emerging Teams", vi: "Đội ươm mầm" },
            value: { en: "Next 20 teams", vi: "20 đội tiếp theo" },
            note: {
              en: "Recognized after Round 2 with certificates and partner-side opportunities.",
              vi: "Được ghi nhận sau Vòng 2 cùng giấy chứng nhận và các cơ hội từ đối tác.",
            },
          },
          {
            label: { en: "Sponsor benefits", vi: "Quyền lợi tài trợ" },
            value: { en: "Scholarships, gifts, access", vi: "Học bổng, quà tặng, cơ hội" },
            note: {
              en: "The reward pool can include non-cash benefits in addition to prize money.",
              vi: "Quỹ giải thưởng có thể bao gồm quyền lợi phi tiền mặt bên cạnh tiền thưởng.",
            },
          },
        ],
      },
      {
        id: "launch",
        image: "/theme-feature-1.jpg",
        eyebrow: {
          en: "Timeline overview",
          vi: "Tổng quan lịch trình",
        },
        title: {
          en: "From May registration to a July final-round defense",
          vi: "Từ đăng ký trong tháng 5 đến bảo vệ chung kết vào tháng 7",
        },
        description: {
          en: "Attacker 2026 runs through a compact season with clear handoff points between team formation, the Round 1 test, Round 2 report submission, and the final presentation day.",
          vi: "Attacker 2026 diễn ra trong một mùa giải gọn gàng với các mốc chuyển tiếp rõ ràng giữa giai đoạn tạo đội, bài thi Vòng 1, nộp báo cáo Vòng 2 và ngày thuyết trình chung kết.",
        },
        highlights: [
          { en: "May registration", vi: "Đăng ký tháng 5" },
          { en: "Round 1 qualifier", vi: "Vòng loại cá nhân" },
          { en: "July final day", vi: "Chung kết tháng 7" },
        ],
        primaryCta: {
          href: "/competition/timeline",
          label: { en: "Full timeline", vi: "Xem lịch trình" },
        },
        secondaryCta: {
          href: "/rules#round-1-rules",
          label: { en: "Round rules", vi: "Luật theo vòng" },
        },
        cards: [
          {
            label: { en: "May 2026", vi: "Tháng 5/2026" },
            value: { en: "Registration and Round 1", vi: "Đăng ký và Vòng 1" },
            note: {
              en: "Teams finalize roster first, then members take the individual qualifier.",
              vi: "Đội thi chốt đội hình trước, sau đó từng thành viên làm bài thi cá nhân.",
            },
          },
          {
            label: { en: "June 2026", vi: "Tháng 6/2026" },
            value: { en: "Round 2 project reports", vi: "Báo cáo dự án Vòng 2" },
            note: {
              en: "Top 50 teams move forward to submit and defend their project direction on paper.",
              vi: "Top 50 đội bước tiếp để nộp và bảo vệ định hướng dự án qua báo cáo.",
            },
          },
          {
            label: { en: "July 2026", vi: "Tháng 7/2026" },
            value: { en: "Live final presentation", vi: "Chung kết thuyết trình" },
            note: {
              en: "Top 5 teams present live, answer judges, and compete for the final ranking.",
              vi: "Top 5 đội thuyết trình trực tiếp, trả lời giám khảo và tranh thứ hạng cuối cùng.",
            },
          },
        ],
      },
    ],
    testimonials: homepageTestimonialsSeed,
    metrics: [
      {
        value: "03",
        label: { en: "competition rounds", vi: "vòng thi" },
        note: {
          en: "Individual qualifier, report judging, and final defense",
          vi: "Vòng loại cá nhân, chấm báo cáo và bảo vệ chung kết",
        },
      },
      {
        value: "3-5",
        label: { en: "members per team", vi: "thành viên mỗi đội" },
        note: {
          en: "At least 3 members are required before Round 1 access",
          vi: "Cần ít nhất 3 thành viên trước khi vào Vòng 1",
        },
      },
      {
        value: "50",
        label: { en: "teams to Round 2", vi: "đội vào Vòng 2" },
        note: {
          en: "Advanced by the highest average score from Round 1",
          vi: "Đi tiếp theo điểm trung bình cao nhất của Vòng 1",
        },
      },
      {
        value: "05",
        label: { en: "finalist teams", vi: "đội chung kết" },
        note: {
          en: "Round 2 also qualifies the next 20 teams for the Emerging round",
          vi: "Vòng 2 đồng thời ghi nhận 20 đội tiếp theo là Đội ươm mầm",
        },
      },
    ],
    rewards: {
      eyebrow: { en: "Rewards", vi: "Giải thưởng" },
      title: {
        en: "Prize structure",
        vi: "Cơ cấu giải thưởng",
      },
      description: {
        en: "",
        vi: "",
      },
    },
    rewardCards: [
      {
        rank: { en: "1st place", vi: "Hạng 1" },
        title: { en: "Champion", vi: "Quán quân" },
        amount: { en: "30,000,000 VND", vi: "30.000.000 VND" },
        note: {
          en: "Awarded to the team with the highest final-round score.",
          vi: "Trao cho đội có điểm cao nhất ở vòng chung kết.",
        },
      },
      {
        rank: { en: "2nd place", vi: "Hạng 2" },
        title: { en: "Runner-up", vi: "Á quân" },
        amount: { en: "15,000,000 VND", vi: "15.000.000 VND" },
        note: {
          en: "Awarded to the team with the second-highest final-round score.",
          vi: "Trao cho đội có điểm cao thứ hai ở vòng chung kết.",
        },
      },
      {
        rank: { en: "3rd place", vi: "Hạng 3" },
        title: { en: "Third place", vi: "Quý quân" },
        amount: { en: "10,000,000 VND", vi: "10.000.000 VND" },
        note: {
          en: "Awarded to the team with the third-highest final-round score.",
          vi: "Trao cho đội có điểm cao thứ ba ở vòng chung kết.",
        },
      },
      {
        rank: { en: "4th place", vi: "Hạng 4" },
        title: { en: "Two finalist teams", vi: "Hai đội đồng hạng 4" },
        amount: { en: "5,000,000 VND each team", vi: "5.000.000 VND mỗi đội" },
        note: {
          en: "The remaining two finalists each receive the fourth-place award.",
          vi: "Hai đội còn lại trong top 5 chung kết, mỗi đội nhận giải hạng 4.",
        },
      },
    ],
    emergingReward: {
      eyebrow: { en: "Side recognition", vi: "Danh hiệu bổ sung" },
      title: { en: "Emerging Teams", vi: "Đội ươm mầm" },
      amount: { en: "Top 10 teams", vi: "Top 10 đội" },
      note: {
        en: "Teams ranked immediately after the top 5 in Round 2 receive recognition, certificates, and sponsor-side opportunities. Depending on partner availability at the final presentation event, standout teams may also receive gifts, scholarships, mentorship, recruitment, or investment opportunities from judges, sponsors, and invited guests.",
        vi: "Các đội xếp ngay sau top 5 ở Vòng 2 nhận danh hiệu, giấy chứng nhận và các cơ hội đồng hành từ đối tác. Tùy theo chương trình đồng hành tại ngày thuyết trình chung kết, các đội nổi bật có thể nhận thêm quà tặng, học bổng, mentoring, tuyển dụng hoặc cơ hội trao đổi đầu tư từ giám khảo, nhà tài trợ và khách mời.",
      },
    },
    competitionPath: {
      eyebrow: { en: "Additional opportunities", vi: "Quyền lợi mở rộng" },
      items: [
        {
          en: "Sponsor-backed gifts, scholarships, and other non-cash benefits may be added depending on the partner program in each season.",
          vi: "Quà tặng, học bổng và các quyền lợi phi tiền mặt từ nhà tài trợ có thể được bổ sung tùy theo chương trình đồng hành của từng mùa.",
        },
        {
          en: "Judges, firms, and invited guests at the final event may also open mentorship, recruitment, or investment conversations for standout teams.",
          vi: "Giám khảo, doanh nghiệp và khách mời tại chung kết cũng có thể mở ra cơ hội mentoring, tuyển dụng hoặc trao đổi đầu tư cho các đội nổi bật.",
        },
      ],
      note: {
        en: "These additional benefits depend on partner decisions and event context, so they are not guaranteed as fixed prize entitlements.",
        vi: "Các quyền lợi bổ sung này phụ thuộc vào quyết định của đối tác và bối cảnh sự kiện, nên không được xem là phần thưởng cố định được bảo đảm trước.",
      },
      ctaLabel: { en: "Open full competition page", vi: "Mở trang cuộc thi đầy đủ" },
      ctaHref: "/competition",
    },
    sponsorsStripLinkLabel: { en: "Open sponsors page", vi: "Mở trang nhà tài trợ" },
    testimonialsSection: {
      eyebrow: { en: "Testimonial", vi: "Cảm nhận" },
      title: {
        en: "Voices from earlier seasons",
        vi: "Cảm nhận từ các mùa trước",
      },
      description: {
        en: "",
        vi: "",
      },
    },
    testimonialsBadgeLabel: { en: "", vi: "" },
    testimonialsLinkLabel: { en: "About Attacker", vi: "Giới thiệu Attacker" },
    news: {
      eyebrow: { en: "Latest news & updates", vi: "Tin tức và cập nhật mới" },
      title: {
        en: "Keep the competition alive between deadlines.",
        vi: "Giữ nhịp sống động cho cuộc thi giữa các mốc thời gian.",
      },
      description: {
        en: "Instead of a long announcement page, the platform already supports a more editorial news rhythm.",
        vi: "Thay vì một trang thông báo dài, nền tảng đã hỗ trợ một nhịp newsroom mang tính biên tập hơn.",
      },
    },
    sponsors: {
      eyebrow: { en: "Sponsors", vi: "Nhà tài trợ" },
      title: {
        en: "Supporters and ecosystem partners behind Attacker 2026.",
        vi: "Những đơn vị đồng hành và đối tác hệ sinh thái phía sau Attacker 2026.",
      },
      description: {
        en: "The homepage now gives sponsors their own visible sector, while the full detail lives in a dedicated competition sub-page.",
        vi: "Trang chủ giờ đã có một sector riêng cho nhà tài trợ, trong khi thông tin đầy đủ nằm ở một sub-page riêng thuộc phần Cuộc thi.",
      },
    },
    destinations: {
      eyebrow: { en: "Platform destinations", vi: "Các điểm đến trong nền tảng" },
      title: {
        en: "The rest of the website already maps to the same structure.",
        vi: "Phần còn lại của website đã được map theo cùng một cấu trúc.",
      },
      description: {
        en: "Public information, rules, news, and team operations are already available as real routes in the prototype.",
        vi: "Thông tin công khai, thể lệ, tin tức, đối tác và vận hành đội thi đã có route thực tế trong prototype.",
      },
    },
    cta: {
      eyebrow: { en: "Stay informed", vi: "Nhận cập nhật" },
      title: {
        en: "Bring students, mentors, and organizers into one clearer information flow.",
        vi: "Đưa sinh viên, mentor và ban tổ chức vào cùng một dòng thông tin rõ ràng hơn.",
      },
      description: {
        en: "The public site, the newsroom, and the team workspace already share one consistent structure, so the backend phase can focus on data and permissions instead of redesign.",
        vi: "Trang công khai, newsroom và Đội thi đã chia sẻ cùng một cấu trúc nhất quán, để giai đoạn backend sau này có thể tập trung vào dữ liệu và phân quyền thay vì thiết kế lại.",
      },
    },
  },
  competition: {
    intro: {
      eyebrow: { en: "Competition", vi: "Cuộc thi" },
      title: {
        en: "A competition structure built around how fintech ideas actually mature.",
        vi: "Cấu trúc cuộc thi được xây dựng theo cách một ý tưởng fintech trưởng thành trong thực tế.",
      },
      description: {
        en: "Attacker 2026 starts with an individual qualifier built from 40 objective questions plus 2 essay questions, then moves the best teams into judge-scored project evaluation and a live final defense. Progression is determined by team results, not solo participation alone.",
        vi: "Attacker 2026 bắt đầu bằng một bài vòng loại cá nhân gồm 40 câu hỏi trắc nghiệm và 2 câu tự luận, sau đó đưa các đội tốt nhất vào giai đoạn đánh giá dự án bởi giám khảo và vòng chung kết bảo vệ trực tiếp. Việc đi tiếp được quyết định bởi kết quả của đội, không chỉ bởi từng cá nhân riêng lẻ.",
      },
    },
    pillarsTitle: { en: "Competition pillars", vi: "Trụ cột cuộc thi" },
    pillars: [
      { en: "40 objective + 2 essay questions", vi: "40 câu trắc nghiệm + 2 câu tự luận" },
      { en: "Team-average progression", vi: "Đi tiếp theo điểm trung bình đội" },
      { en: "Final report deadline + live final judging", vi: "Hạn nộp báo cáo chung kết + chấm trực tiếp" },
    ],
    highlights: [
      {
        title: { en: "Eligible participants", vi: "Đối tượng tham gia" },
        description: {
          en: "University and college students with interest in fintech, data, product, trading, or entrepreneurship.",
          vi: "Sinh viên đại học và cao đẳng quan tâm đến fintech, dữ liệu, sản phẩm, giao dịch hoặc khởi nghiệp.",
        },
      },
      {
        title: { en: "Registration format", vi: "Hình thức đăng ký" },
        description: {
          en: "Each user owns one profile, can belong to one team at a time, and joins a team through self-creation or invitation.",
          vi: "Mỗi người dùng có một hồ sơ, chỉ thuộc một đội tại một thời điểm và có thể vào đội bằng cách tự tạo hoặc nhận lời mời.",
        },
      },
      {
        title: { en: "Readiness checkpoint", vi: "Mốc sẵn sàng" },
        description: {
          en: "Teams may form with one leader first, but only teams with 3 to 5 members are eligible for the individual Round 1 qualifier and team-average ranking.",
          vi: "Đội có thể được tạo bởi một đội trưởng trước, nhưng chỉ những đội có từ 3 đến 5 thành viên mới đủ điều kiện vào bài thi cá nhân của Vòng 1 và được xếp hạng theo điểm trung bình đội.",
        },
      },
    ],
    rounds: {
      eyebrow: { en: "Round architecture", vi: "Kiến trúc vòng thi" },
      title: {
        en: "From individual qualifier to judge-scored team execution.",
        vi: "Từ vòng loại cá nhân đến năng lực thực thi của đội được giám khảo chấm điểm.",
      },
      description: {
        en: "Members first complete an individual paper with 40 objective questions and 2 essays, then qualified teams submit reports, and finalists defend their project live in front of the judges.",
        vi: "Thí sinh trước tiên hoàn thành một bài thi cá nhân gồm 40 câu trắc nghiệm và 2 câu tự luận, sau đó các đội đủ điều kiện nộp báo cáo, và các đội vào sâu sẽ bảo vệ dự án trực tiếp trước hội đồng giám khảo.",
      },
    },
    roundCards: [
      {
        id: "01",
        label: { en: "Round 01", vi: "Vòng 01" },
        title: { en: "Individual Qualifier", vi: "Vòng loại cá nhân" },
        duration: {
          en: "40 objective questions + 2 essay questions online",
          vi: "40 câu trắc nghiệm + 2 câu tự luận trực tuyến",
        },
        description: {
          en: "Each eligible member receives a personalized paper with 40 objective questions drawn by topic, difficulty, and extra random selection, followed by 2 essay questions. The average score of the team is used for ranking, and the top 50 teams proceed to Round 2.",
          vi: "Mỗi thành viên đủ điều kiện sẽ nhận một đề thi cá nhân gồm 40 câu hỏi trắc nghiệm được rút theo chủ đề, độ khó và phần ngẫu nhiên bổ sung, sau đó là 2 câu tự luận. Điểm trung bình của đội được dùng để xếp hạng, và top 50 đội sẽ vào Vòng 2.",
        },
        deliverables: [
          { en: "40 objective questions", vi: "40 câu trắc nghiệm trên 6 chủ đề" },
          { en: "2 essay responses with 500-word limit each", vi: "2 câu tự luận, mỗi câu trả lời 300-500 từ" },
          { en: "Team average score ranking for Top 50", vi: "Xếp hạng theo điểm trung bình đội để chọn Top 50" },
        ],
      },
      {
        id: "02",
        label: { en: "Round 02", vi: "Vòng 02" },
        title: { en: "Project Report Review", vi: "Đánh giá dự án" },
        duration: {
          en: "judge-scored team report stage",
          vi: "giai đoạn nộp báo cáo đội được giám khảo chấm điểm",
        },
        description: {
          en: "Qualified teams submit a report for their project and receive judge scoring. The top 5 teams proceed to the final round, while the next 20 teams qualify for the Emerging round.",
          vi: "5 đội điểm cao nhất vào chung kết, 20 đội tiếp theo vào bảng Ươm mầm.",
        },
        deliverables: [
          { en: "Project report submission", vi: "Nộp báo cáo dự án theo quy định" },
          { en: "Judge scoring and feedback", vi: "Ban giám khảo chấm điểm" },
          { en: "Top 5 finalists + next 20 Emerging round qualifiers", vi: "Top 5 chung kết + 20 tiếp theo vào bảng Ươm mầm" },
        ],
      },
      {
        id: "03",
        label: { en: "Round 03", vi: "Vòng 03" },
        title: { en: "Final Report & Live Presentation", vi: "Thuyết trình chung kết" },
        duration: {
          en: "final report deadline + live presentation day",
          vi: "hạn nộp báo cáo cuối + ngày thuyết trình trực tiếp",
        },
        description: {
          en: "The final stage starts with the deadline for the updated finalist report and deck, then ends with the live presentation, judge Q&A, and the final award decision.",
          vi: "Giai đoạn chung kết bắt đầu bằng hạn nộp báo cáo và bộ slide cập nhật của đội vào chung kết, sau đó khép lại bằng phần thuyết trình trực tiếp, hỏi đáp cùng giám khảo và quyết định giải thưởng cuối cùng.",
        },
        deliverables: [
          { en: "Final report and pitch deck submission", vi: "Nộp báo cáo cuối cùng và slide thuyết trình" },
          { en: "Live finalist presentation and judge Q&A", vi: "Thuyết trình trực tiếp và hỏi đáp cùng giám khảo" },
          { en: "Final scoring and podium ranking", vi: "Chấm điểm cuối cùng và xếp hạng giải thưởng" },
        ],
      },
    ],
    rewards: {
      eyebrow: { en: "Rewards", vi: "Giải thưởng" },
      title: {
        en: "Prize structure",
        vi: "Cơ cấu giải thưởng",
      },
      description: {
        en: "",
        vi: "",
      },
    },
    rewardCards: [
      {
        rank: { en: "1st place", vi: "Hạng 1" },
        title: { en: "Champion", vi: "Quán quân" },
        amount: { en: "30,000,000 VND", vi: "30.000.000 VND" },
        note: {
          en: "Awarded to the team with the highest final-round score.",
          vi: "Trao cho đội có điểm cao nhất ở vòng chung kết.",
        },
      },
      {
        rank: { en: "2nd place", vi: "Hạng 2" },
        title: { en: "Runner-up", vi: "Á quân" },
        amount: { en: "15,000,000 VND", vi: "15.000.000 VND" },
        note: {
          en: "Awarded to the team with the second-highest final-round score.",
          vi: "Trao cho đội có điểm cao thứ hai ở vòng chung kết.",
        },
      },
      {
        rank: { en: "3rd place", vi: "Hạng 3" },
        title: { en: "Third place", vi: "Quý quân" },
        amount: { en: "10,000,000 VND", vi: "10.000.000 VND" },
        note: {
          en: "Awarded to the team with the third-highest final-round score.",
          vi: "Trao cho đội có điểm cao thứ ba ở vòng chung kết.",
        },
      },
      {
        rank: { en: "4th place", vi: "Hạng 4" },
        title: { en: "Two finalist teams", vi: "Hai đội đồng hạng 4" },
        amount: { en: "5,000,000 VND each team", vi: "5.000.000 VND mỗi đội" },
        note: {
          en: "The remaining two finalists each receive the fourth-place award.",
          vi: "Hai đội còn lại trong top 5 chung kết, mỗi đội nhận giải hạng 4.",
        },
      },
    ],
    emergingReward: {
      eyebrow: { en: "Side recognition", vi: "Danh hiệu bổ sung" },
      title: { en: "Emerging Teams", vi: "Đội ươm mầm" },
      amount: { en: "Top 10 teams", vi: "Top 10 đội" },
      note: {
        en: "Teams ranked immediately after the top 5 in Round 2 receive recognition, certificates, and sponsor-side opportunities. Depending on partner availability at the final presentation event, standout teams may also receive gifts, scholarships, mentorship, recruitment, or investment opportunities from judges, sponsors, and invited guests.",
        vi: "Các đội xếp ngay sau top 5 ở Vòng 2 nhận danh hiệu, giấy chứng nhận và các cơ hội đồng hành từ đối tác. Tùy theo chương trình đồng hành tại ngày thuyết trình chung kết, các đội nổi bật có thể nhận thêm quà tặng, học bổng, mentoring, tuyển dụng hoặc cơ hội trao đổi đầu tư từ giám khảo, nhà tài trợ và khách mời.",
      },
    },
    competitionPath: {
      eyebrow: { en: "Additional opportunities", vi: "Quyền lợi mở rộng" },
      items: [
        {
          en: "Sponsor-backed gifts, scholarships, and other non-cash benefits may be added depending on the partner program in each season.",
          vi: "Quà tặng, học bổng và các quyền lợi phi tiền mặt từ nhà tài trợ có thể được bổ sung tùy theo chương trình đồng hành của từng mùa.",
        },
        {
          en: "Judges, firms, and invited guests at the final event may also open mentorship, recruitment, or investment conversations for standout teams.",
          vi: "Giám khảo, doanh nghiệp và khách mời tại chung kết cũng có thể mở ra cơ hội mentoring, tuyển dụng hoặc trao đổi đầu tư cho các đội nổi bật.",
        },
      ],
      note: {
        en: "These additional benefits depend on partner decisions and event context, so they are not guaranteed as fixed prize entitlements.",
        vi: "Các quyền lợi bổ sung này phụ thuộc vào quyết định của đối tác và bối cảnh sự kiện, nên không được xem là phần thưởng cố định được bảo đảm trước.",
      },
    },
    mentors: {
      eyebrow: { en: "Mentor lanes", vi: "Nhóm mentor" },
      title: {
        en: "A cleaner structure for judges, mentors, and partners.",
        vi: "Cấu trúc sạch hơn để giới thiệu giám khảo, mentor và đối tác.",
      },
      description: {
        en: "This frontend stage uses expertise groups instead of placeholder people cards, so the final names can be added later without redesigning the section.",
        vi: "Ở giai đoạn frontend này, phần này dùng các nhóm chuyên môn thay cho thẻ người giả lập, để danh sách thực tế có thể được thêm vào sau mà không cần đổi lại section.",
      },
    },
  },
  rules: {
    header: {
      eyebrow: { en: "Competition rules", vi: "Thể lệ cuộc thi" },
      title: {
        en: "The rulebook is now organized by general policy and by each competition round.",
        vi: "Bộ thể lệ nay được tổ chức theo phần quy định chung và theo từng vòng thi.",
      },
      description: {
        en: "Review the shared policies first, then open the round that matters to your team to understand format, qualification logic, submission expectations, and advancement rules.",
        vi: "Hãy xem trước các quy định chung, sau đó mở đúng vòng thi mà đội của bạn quan tâm để nắm định dạng, điều kiện, yêu cầu nộp bài và cơ chế đi tiếp.",
      },
    },
    coreRules: {
      eyebrow: { en: "General rules", vi: "Quy định chung" },
      title: {
        en: "The shared framework comes first before any team enters a round.",
        vi: "Khung quy định chung luôn được áp dụng trước khi bất kỳ đội nào bước vào một vòng thi.",
      },
      description: {
        en: "These policies govern account ownership, team formation, team lock, eligibility, and the progression logic used across the platform.",
        vi: "Các chính sách này chi phối việc sở hữu tài khoản, hình thành đội, khóa đội, điều kiện dự thi và cơ chế đi tiếp xuyên suốt trên nền tảng.",
      },
    },
    introJumpItems: [
      {
        shortLabel: { en: "General", vi: "Chung" },
        hoverLabel: { en: "Jump to general rules", vi: "Đi đến thể lệ chung" },
      },
      {
        shortLabel: { en: "R1", vi: "V1" },
        hoverLabel: { en: "Jump to Round 1 rules", vi: "Đi đến thể lệ Vòng 1" },
      },
      {
        shortLabel: { en: "R2", vi: "V2" },
        hoverLabel: { en: "Jump to Round 2 rules", vi: "Đi đến thể lệ Vòng 2" },
      },
      {
        shortLabel: { en: "R3", vi: "V3" },
        hoverLabel: { en: "Jump to Final round rules", vi: "Đi đến thể lệ Chung kết" },
      },
    ],
    quickReadLabel: { en: "Quick policy read", vi: "Đọc nhanh" },
    quickReadItems: [
      {
        en: `Round 1 requires a team of ${TEAM_MIN_MEMBERS}-${TEAM_MAX_MEMBERS} members`,
        vi: `Vòng 1 yêu cầu đội có ${TEAM_MIN_MEMBERS}-${TEAM_MAX_MEMBERS} thành viên`,
      },
      {
        en: "Team lock must be approved by all members before Round 1 starts",
        vi: "Khóa đội phải được toàn bộ thành viên đồng thuận trước khi bắt đầu Vòng 1",
      },
      {
        en: "Progression is determined by team ranking at every stage",
        vi: "Việc đi tiếp được quyết định theo xếp hạng đội ở từng giai đoạn",
      },
    ],
    generalHighlights: [
      {
        title: { en: "Eligible participants", vi: "Đối tượng tham gia" },
        description: {
          en: "University and college students with interest in fintech, data, product, trading, or entrepreneurship.",
          vi: "Sinh viên đại học và cao đẳng quan tâm đến fintech, dữ liệu, sản phẩm, giao dịch hoặc khởi nghiệp.",
        },
      },
      {
        title: { en: "Registration format", vi: "Hình thức đăng ký" },
        description: {
          en: "Each user owns one profile, can belong to one team at a time, and joins a team through self-creation or invitation.",
          vi: "Mỗi người dùng có một hồ sơ, chỉ thuộc một đội tại một thời điểm và có thể vào đội bằng cách tự tạo hoặc nhận lời mời.",
        },
      },
      {
        title: { en: "Readiness checkpoint", vi: "Mốc sẵn sàng" },
        description: {
          en: "Teams may form with one leader first, but only teams with 3 to 5 members are eligible for the individual Round 1 qualifier and team-average ranking.",
          vi: "Đội có thể được tạo bởi một đội trưởng trước, nhưng chỉ những đội có từ 3 đến 5 thành viên mới đủ điều kiện vào bài thi cá nhân của Vòng 1 và được xếp hạng theo điểm trung bình đội.",
        },
      },
    ],
    generalPolicyChecksLabel: { en: "General policy checks", vi: "Điểm kiểm soát chung" },
    generalPolicyChecks: [
      {
        title: { en: "One account per participant", vi: "Mỗi thí sinh một tài khoản" },
        description: {
          en: "Each participant must keep one verified account and may not sit in multiple teams at the same time.",
          vi: "Mỗi thí sinh phải duy trì một tài khoản đã xác thực và không được đồng thời đứng trong nhiều đội.",
        },
      },
      {
        title: { en: "Team lock before Round 1", vi: "Khóa đội trước Vòng 1" },
        description: {
          en: "The Round 1 roster becomes official only after the team lock request is approved by all current members.",
          vi: "Đội hình dùng cho Vòng 1 chỉ chính thức khi yêu cầu khóa đội được toàn bộ thành viên hiện tại chấp thuận.",
        },
      },
      {
        title: { en: "Leader responsibilities", vi: "Trách nhiệm đội trưởng" },
        description: {
          en: "The team leader manages invitations, confirms the final roster, and handles official submission actions for later rounds.",
          vi: "Đội trưởng quản lý lời mời, xác nhận đội hình cuối cùng và thực hiện các thao tác nộp bài chính thức ở các vòng sau.",
        },
      },
      {
        title: { en: "Team-based progression", vi: "Đi tiếp theo kết quả đội" },
        description: {
          en: "Although Round 1 is taken individually, qualification and advancement are calculated from team outcomes, not isolated personal results.",
          vi: "Dù Vòng 1 được làm theo cá nhân, việc đủ điều kiện và đi tiếp vẫn được tính theo kết quả đội chứ không chỉ theo từng cá nhân riêng lẻ.",
        },
      },
    ],
    openTimelineOverviewLabel: { en: "Open timeline overview", vi: "Mở lịch trình tổng quan" },
    rounds: [
      {
        id: "01",
        label: { en: "Round 01", vi: "Vòng 01" },
        title: { en: "Individual Qualifier", vi: "Vòng loại cá nhân" },
        duration: {
          en: "40 objective questions + 2 essay questions online",
          vi: "40 câu trắc nghiệm + 2 câu tự luận trực tuyến",
        },
        description: {
          en: "Each eligible member receives a personalized paper with 40 objective questions drawn by topic, difficulty, and extra random selection, followed by 2 essay questions. The average score of the team is used for ranking, and the top 50 teams proceed to Round 2.",
          vi: "Mỗi thành viên đủ điều kiện sẽ nhận một đề thi cá nhân gồm 40 câu hỏi trắc nghiệm được rút theo chủ đề, độ khó và phần ngẫu nhiên bổ sung, sau đó là 2 câu tự luận. Điểm trung bình của đội được dùng để xếp hạng, và top 50 đội sẽ vào Vòng 2.",
        },
        deliverables: [
          { en: "40 objective questions", vi: "40 câu trắc nghiệm trên 6 chủ đề" },
          { en: "2 essay responses with 500-word limit each", vi: "2 câu tự luận, mỗi câu trả lời 300-500 từ" },
          { en: "Team average score ranking for Top 50", vi: "Xếp hạng theo điểm trung bình đội để chọn Top 50" },
        ],
        focus: {
          en: "Round 1 is individual at paper level but ranked at team level.",
          vi: "Vòng 1 làm bài theo cá nhân nhưng xếp hạng ở cấp độ đội.",
        },
        specificRules: [
          {
            en: "Only locked teams with 3 to 5 members may enter the official exam.",
            vi: "Chỉ các đội đã khóa đội và có từ 3 đến 5 thành viên mới được vào bài thi chính thức.",
          },
          {
            en: "Every member takes one timed paper consisting of 40 objective questions and 2 essay questions.",
            vi: "Mỗi thành viên làm bài vòng 1 gồm 40 câu trắc nghiệm và 2 câu tự luận.",
          },
          {
            en: "Top 50 teams are selected by the average score of eligible team members.",
            vi: "Top 50 đội được chọn theo điểm trung bình của các thành viên đủ điều kiện trong đội.",
          },
        ],
        roundNotes: [
          {
            en: "Each student only has one official Round 1 attempt. Once the exam starts, it cannot be paused or restarted.",
            vi: "Mỗi sinh viên chỉ có một lượt thi Vòng 1 chính thức. Khi bài thi bắt đầu, không thể tạm dừng hoặc làm lại.",
          },
          {
            en: "Objective score is available first, while essay score stays pending until admin or moderator review is completed.",
            vi: "Điểm trắc nghiệm được chấm tự động, điểm tự luận sẽ được công bố sau khi có kết quả từ Ban giám khảo.",
          },
        ],
      },
      {
        id: "02",
        label: { en: "Round 02", vi: "Vòng 02" },
        title: { en: "Project Report Review", vi: "Đánh giá dự án" },
        duration: {
          en: "judge-scored team report stage",
          vi: "giai đoạn nộp báo cáo đội được giám khảo chấm điểm",
        },
        description: {
          en: "Qualified teams submit a report for their project and receive judge scoring. The top 5 teams proceed to the final round, while the next 20 teams qualify for the Emerging round.",
          vi: "5 đội điểm cao nhất vào chung kết, 20 đội tiếp theo vào bảng Ươm mầm.",
        },
        deliverables: [
          { en: "Project report submission", vi: "Nộp báo cáo dự án theo quy định" },
          { en: "Judge scoring and feedback", vi: "Ban giám khảo chấm điểm" },
          { en: "Top 5 finalists + next 20 Emerging round qualifiers", vi: "Top 5 chung kết + 20 tiếp theo vào bảng Ươm mầm" },
        ],
        focus: {
          en: "Round 2 is a judged report stage with versioned file submission.",
          vi: "Các đội thi nộp báo cáo mô tả dự án.",
        },
        specificRules: [
          {
            en: "Only teams qualified from Round 1 can access the Round 2 submission center.",
            vi: "Chỉ các đội vượt qua Vòng 1 mới được truy cập khu vực nộp bài Vòng 2.",
          },
          {
            en: "Team leaders submit the official report file, while all previous versions remain visible for tracking.",
            vi: "Báo cáo vòng 2 được nộp bởi đội trưởng.",
          },
          {
            en: "Judge scoring selects the top 5 teams for the final and qualifies the next 20 teams for the Emerging round.",
            vi: "Bài thi vòng 2 của mỗi đội được chấm bởi 02 giám khảo theo phân bổ của Ban tổ chức.",
          },
        ],
        roundNotes: [
          {
            en: "The team leader is responsible for the official upload, but all members should align on the final report version before submission.",
            vi: "Đội trưởng chịu trách nhiệm nộp bài chính thức, nhưng toàn bộ thành viên nên thống nhất phiên bản báo cáo cuối cùng trước khi nộp.",
          },
          {
            en: "Only the latest valid submission version is used for judging once the Round 2 deadline closes.",
            vi: "Khi hạn nộp Vòng 2 kết thúc, chỉ phiên bản hợp lệ mới nhất mới được dùng để chấm điểm.",
          },
        ],
      },
      {
        id: "03",
        label: { en: "Round 03", vi: "Vòng 03" },
        title: { en: "Final Report & Live Presentation", vi: "Chung kết" },
        duration: {
          en: "final report deadline + live presentation day",
          vi: "hạn nộp báo cáo cuối + ngày thuyết trình trực tiếp",
        },
        description: {
          en: "The final stage starts with the deadline for the updated finalist report and deck, then ends with the live presentation, judge Q&A, and the final award decision.",
          vi: "Giai đoạn chung kết bắt đầu bằng hạn nộp báo cáo và bộ slide cập nhật của đội vào chung kết, sau đó khép lại bằng phần thuyết trình trực tiếp, hỏi đáp cùng giám khảo và quyết định giải thưởng cuối cùng.",
        },
        deliverables: [
          { en: "Final report and pitch deck submission", vi: "Nộp báo cáo cuối cùng và slide thuyết trình" },
          { en: "Live finalist presentation and judge Q&A", vi: "Thuyết trình trực tiếp và hỏi đáp cùng giám khảo" },
          { en: "Final scoring and podium ranking", vi: "Chấm điểm cuối cùng và xếp hạng giải thưởng" },
        ],
        focus: {
          en: "The final has two connected steps: final report deadline, then live presentation and defense.",
          vi: "Vòng chung kết có hai bước liên tiếp: hạn nộp báo cáo cuối, sau đó là thuyết trình và bảo vệ trực tiếp.",
        },
        specificRules: [
          {
            en: "Finalist teams must submit the updated final report and pitch deck before the final-report deadline closes.",
            vi: "Các đội thi chung kết cần nộp lại báo cáo cuối cùng cho Ban tổ chức.",
          },
          {
            en: "After the report deadline, teams move into the live presentation and judge Q&A stage on final event day.",
            vi: "20 đội thi bảng Ươm mầm chỉnh sửa báo cáo và nộp lại cho Ban tổ chức. 10 đội đạt giải Ươm mầm được công bố theo lịch trình của Ban tổ chức.",
          },
          {
            en: "Final podium awards are determined only after the live final defense is completed.",
            vi: "Thứ hạng chung cuộc chỉ được xác định sau khi hoàn tất phần bảo vệ trực tiếp tại vòng chung kết.",
          },
        ],
        roundNotes: [
          {
            en: "The final report deadline closes before presentation day, so teams should freeze the submitted deck and report early enough for rehearsal.",
            vi: "5 đội thi chung kết cần nộp slide trình bày qua email cho Ban tổ chức, hoặc liên hệ Ban tổ chức để được hỗ trợ.",
          },
          {
            en: "Final-stage logistics, presentation order, and check-in instructions should be reviewed carefully after the report deadline and before defense day.",
            vi: "Thứ tự trình bày tại chung kết được bốc thăm bởi đại diện các đội thi chung kết.",
          },
        ],
      },
    ],
    openRoundOnTimelineLabel: { en: "Open this round on timeline page", vi: "Mở giai đoạn này trên trang lịch trình" },
    deliverablePrefix: { en: "Deliverable", vi: "Lưu ý" },
    specificRoundRulesLabel: { en: "Specific round rules", vi: "Quy định vòng thi" },
    roundNotesLabel: { en: "Round notes", vi: "Lưu ý của vòng" },
    faqQuickAnswersLabel: { en: "Quick answers", vi: "Trả lời nhanh" },
    faqQuickAnswers: [
      {
        en: `Round 1 requires a team of ${TEAM_MIN_MEMBERS}-${TEAM_MAX_MEMBERS} members`,
        vi: `Vòng 1 yêu cầu đội có ${TEAM_MIN_MEMBERS}-${TEAM_MAX_MEMBERS} thành viên`,
      },
      {
        en: "A leader must transfer leadership before leaving",
        vi: "Đội trưởng phải chuyển quyền trước khi rời đội",
      },
      {
        en: "Round 1 ranks teams by average member score",
        vi: "Vòng 1 xếp hạng đội theo điểm trung bình thành viên",
      },
    ],
    faqQuestionPrefix: { en: "Question", vi: "Câu hỏi" },
    faqTopics: [
      {
        id: "registration-team",
        title: { en: "Registration and team setup", vi: "Đăng ký và lập đội" },
        description: {
          en: "Account creation, teammate matching, invitations, and leadership rules.",
          vi: "Tạo tài khoản, tìm đồng đội, lời mời vào đội và quy định về đội trưởng.",
        },
      },
      {
        id: "round-1-scoring",
        title: { en: "Round 1 eligibility and scoring", vi: "Điều kiện và điểm Vòng 1" },
        description: {
          en: "Who can enter Round 1 and how individual papers become team results.",
          vi: "Ai được vào Vòng 1 và cách điểm cá nhân được tính thành kết quả đội.",
        },
      },
      {
        id: "progression-results",
        title: { en: "Submissions and progression", vi: "Bài nộp và đi tiếp" },
        description: {
          en: "Report versions, finalist announcement, and final ranking logic.",
          vi: "Phiên bản báo cáo, công bố finalist và nguyên tắc xếp hạng chung cuộc.",
        },
      },
    ],
    faqItems: [
      {
        topicId: "registration-team",
        question: {
          en: "Can I register first and decide on teammates later?",
          vi: "Tôi có thể đăng ký trước rồi tìm đồng đội sau không?",
        },
        answer: {
          en: "Yes. You can create a student account first, then either open your own team or accept an invitation later. However, only teams that complete team lock with 3 to 5 members can enter the official Round 1 paper.",
          vi: "Có. Bạn có thể tạo tài khoản trước, sau đó tự mở đội hoặc nhận lời mời vào đội sau. Tuy nhiên, chỉ các đội đã hoàn tất khóa đội với từ 3 đến 5 thành viên mới được vào bài thi Vòng 1 chính thức.",
        },
      },
      {
        topicId: "registration-team",
        question: {
          en: "If I am the team leader, can I leave the team directly?",
          vi: "Nếu tôi là đội trưởng thì có thể rời đội ngay không?",
        },
        answer: {
          en: "No. A leader must transfer leadership to another confirmed member before leaving. The platform protects team ownership so the team is never left without a leader.",
          vi: "Không. Đội trưởng phải chuyển quyền đội trưởng cho một thành viên đã xác nhận khác trước khi rời đội. Hệ thống bảo vệ quyền sở hữu đội để đội không bao giờ rơi vào trạng thái không có đội trưởng.",
        },
      },
      {
        topicId: "round-1-scoring",
        question: {
          en: "Does Round 1 select individuals or teams?",
          vi: "Vòng 1 chọn theo cá nhân hay theo đội?",
        },
        answer: {
          en: "Round 1 is taken individually, but selection is made at the team level. The average score of eligible members in each locked team is used to rank teams and determine the top 50.",
          vi: "Vòng 1 được làm theo từng cá nhân, nhưng việc chọn đi tiếp được tính ở cấp độ đội. Điểm trung bình của các thành viên đủ điều kiện trong mỗi đội đã khóa sẽ được dùng để xếp hạng và chọn top 50 đội.",
        },
      },
      {
        topicId: "progression-results",
        question: {
          en: "Can our team upload more than one Round 2 report version?",
          vi: "Đội tôi có thể nộp nhiều phiên bản báo cáo Vòng 2 không?",
        },
        answer: {
          en: "Yes. The platform keeps version history for Round 2 submissions, but only the latest valid version before the deadline is used for judging.",
          vi: "Có. Nền tảng lưu lịch sử các phiên bản nộp bài ở Vòng 2, nhưng chỉ phiên bản hợp lệ mới nhất trước hạn chót mới được dùng để chấm điểm.",
        },
      },
      {
        topicId: "progression-results",
        question: {
          en: "When do finalist teams know the final ranking?",
          vi: "Khi nào các đội vào chung kết biết thứ hạng cuối cùng?",
        },
        answer: {
          en: "Final ranking is determined only after the live final defense. Before that point, the finalist list simply shows the top 5 teams without any ranking order.",
          vi: "Thứ hạng chung cuộc chỉ được xác định sau phần bảo vệ trực tiếp ở chung kết. Trước thời điểm đó, danh sách finalist chỉ thể hiện 5 đội vào chung kết mà không mang ý nghĩa xếp hạng.",
        },
      },
    ],
    timeline: {
      eyebrow: { en: "Competition timeline", vi: "Lịch trình cuộc thi" },
      title: {
        en: "A round-based schedule for registration, qualifiers, report review, and the final stage.",
        vi: "Lịch trình theo từng giai đoạn từ đăng ký, vòng loại, chấm báo cáo đến vòng chung kết.",
      },
      description: {
        en: "Each phase highlights time, place, method, and a short operational note. Use the linked rule button to jump directly to the corresponding rule block.",
        vi: "Mỗi giai đoạn nêu rõ thời gian, địa điểm, hình thức và ghi chú vận hành ngắn. Dùng nút thể lệ để chuyển ngay đến đúng khối quy định tương ứng.",
      },
    },
    faq: {
      eyebrow: { en: "FAQ", vi: "Câu hỏi thường gặp" },
      title: {
        en: "Qualification, scoring, and progression are clarified upfront.",
        vi: "Điều kiện, cách chấm điểm và việc đi tiếp được làm rõ ngay từ đầu.",
      },
      description: {
        en: "If you have further questions, contact the organizer through the FTC Facebook page below or the official email listed here.",
        vi: "Nếu bạn có câu hỏi khác, hãy liên hệ ban tổ chức qua Fanpage FTC bên dưới hoặc email chính thức được nêu trong khung bên dưới.",
      },
    },
  },
  news: {
    header: {
      eyebrow: { en: "Newsroom", vi: "Newsroom" },
      title: {
        en: "A bilingual editorial feed instead of a simple announcement board.",
        vi: "Bảng tin biên tập song ngữ thay cho một khu vực thông báo đơn giản.",
      },
      description: {
        en: "This content model already supports filtering, article routes, and future admin publishing workflows.",
        vi: "Mô hình nội dung này đã hỗ trợ bộ lọc, route bài viết và các quy trình đăng bài cho admin trong tương lai.",
      },
    },
    featured: {
      eyebrow: { en: "Featured story", vi: "Bài viết nổi bật" },
      title: {
        en: "A featured route to anchor the newsroom.",
        vi: "Một bài nổi bật để định nhiều cho newsroom.",
      },
      description: {
        en: "Highlighting one key story gives the editorial layer more shape and priority.",
        vi: "Làm nổi bật một bài viết chính giúp lớp biên tập có hình thái và mức ưu tiên rõ hơn.",
      },
    },
    latest: {
      eyebrow: { en: "Latest updates", vi: "Cập nhật mới" },
      title: {
        en: "Searchable cards, ready for a future CMS.",
        vi: "Thẻ tin có thể tìm kiếm, sẵn sàng cho CMS trong tương lai.",
      },
      description: {
        en: "The filtered result set below updates from a deferred search value so the UI remains responsive.",
        vi: "Tập kết quả được lọc bên dưới cập nhật từ giá trị tìm kiếm deferred để giao diện vẫn mượt mà.",
      },
    },
    related: {
      eyebrow: { en: "Related posts", vi: "Bài viết liên quan" },
      title: {
        en: "The route structure is ready for editorial expansion.",
        vi: "Cấu trúc route đã sẵn sàng để mở rộng newsroom.",
      },
      description: {
        en: "Each article is already a dedicated page, which makes future sharing and SEO work straightforward.",
        vi: "Mỗi bài viết đã là một trang riêng, giúp việc chia sẻ và tối ưu SEO sau này trở nên dễ dàng.",
      },
    },
  },
  sponsors: {
    header: {
      eyebrow: { en: "Competition / Sponsors", vi: "Cuộc thi / Nhà tài trợ" },
      title: { en: "", vi: "" },
      description: { en: "", vi: "" },
    },
    partnership: {
      eyebrow: { en: "Partnership structure", vi: "Cấu trúc đồng hành" },
      title: {
        en: "A sponsorship page should explain contribution, not just display logos.",
        vi: "Trang nhà tài trợ nên giải thích sự đồng hành, không chỉ hiện logo.",
      },
      description: {
        en: "This layout gives you room later to add benefit packages, media assets, and sponsor-specific activations without redesigning the page.",
        vi: "Bố cục này giúp bạn có thêm không gian sau này để đưa các gói quyền lợi, tài sản media và hoạt động riêng của từng nhà tài trợ mà không cần thiết kế lại.",
      },
    },
  },
  judges: {
    header: {
      eyebrow: { en: "Competition / Judges", vi: "Cuộc thi / Giám khảo" },
      title: {
        en: "A judging panel framed by expertise, not just names.",
        vi: "Hội đồng giám khảo được trình bày bằng chuyên môn, không chỉ bằng danh xưng.",
      },
      description: {
        en: "This page gives Attacker 2026 a stronger evaluation story by showing why each judge matters to fintech product, market, and execution quality.",
        vi: "Trang này giúp Attacker 2026 có câu chuyện đánh giá rõ ràng hơn bằng cách cho thấy vì sao mỗi giám khảo quan trọng với sản phẩm fintech, thị trường và năng lực thực thi.",
      },
    },
    panelSizeLabel: { en: "Panel size", vi: "Quy mô hội đồng" },
    roundSections: [
      {
        round: "round-3",
        eyebrow: { en: "Final round judges", vi: "Giám khảo vòng chung kết" },
        title: {
          en: "The panel for live presentation, defense, and final ranking.",
          vi: "Hội đồng cho phần thuyết trình trực tiếp, hỏi đáp và xếp hạng cuối cùng.",
        },
        description: {
          en: "These judges focus on stage presence, strategic clarity, execution quality, and final competition performance.",
          vi: "Nhóm giám khảo này tập trung vào bản lĩnh trình bày, độ rõ chiến lược, chất lượng thực thi và hiệu suất thi đấu ở chặng cuối.",
        },
        panelNote: {
          en: "Final-round judges visible for the live pitch and Q&A stage.",
          vi: "Số giám khảo xuất hiện cho chặng pitch và hỏi đáp của vòng chung kết.",
        },
      },
      {
        round: "round-2",
        eyebrow: { en: "Round 2 judges", vi: "Giám khảo vòng 2" },
        title: {
          en: "The review panel for project reports and shortlist decisions.",
          vi: "Hội đồng chấm báo cáo dự án và quyết định danh sách vào chung kết.",
        },
        description: {
          en: "Round 2 judges concentrate on structure, feasibility, compliance, and the quality of project documentation.",
          vi: "Giám khảo vòng 2 tập trung vào cấu trúc, tính khả thi, tuân thủ và chất lượng hồ sơ dự án.",
        },
        panelNote: {
          en: "Report-evaluation judges focused on shortlist and depth.",
          vi: "Số giám khảo chấm báo cáo, tập trung vào shortlist và chiều sâu dự án.",
        },
      },
      {
        round: "round-1",
        eyebrow: { en: "Round 1 judges", vi: "Giám khảo vòng 1" },
        title: {
          en: "The specialist layer behind the individual qualifier and scoring logic.",
          vi: "Lớp chuyên môn phía sau vòng loại cá nhân và logic chấm điểm ban đầu.",
        },
        description: {
          en: "This group shapes question-bank quality, quantitative thinking, and the academic rigor of the first checkpoint.",
          vi: "Nhóm này định hình chất lượng ngân hàng câu hỏi, tư duy định lượng và độ chặt chẽ học thuật của chốt kiểm tra đầu tiên.",
        },
        panelNote: {
          en: "Question-bank and scoring specialists for the first round.",
          vi: "Số chuyên gia phụ trách ngân hàng câu hỏi và logic chấm điểm của vòng đầu.",
        },
      },
    ],
    clarity: {
      eyebrow: { en: "Judging clarity", vi: "Độ rõ của hội đồng" },
      title: {
        en: "This section helps the competition feel credible before finalists ever pitch.",
        vi: "Section này giúp cuộc thi có uy tín ngay cả trước khi các đội vào chung kết pitch.",
      },
      description: {
        en: "By separating product, market, quant, and compliance lenses, the page sets clearer expectations about how teams will be evaluated.",
        vi: "Bằng cách tách riêng các góc nhìn sản phẩm, thị trường, quant và tuân thủ, trang này đặt ra kỳ vọng rõ hơn về cách các đội sẽ được đánh giá.",
      },
    },
  },
  auth: {
    header: {
      eyebrow: { en: "Authentication", vi: "Xác thực" },
      title: {
        en: "Sign in or create a participant account.",
        vi: "Đăng nhập hoặc tạo tài khoản thí sinh.",
      },
      description: {
        en: "Simple entry points for email/password and Google sign-in.",
        vi: "Điểm vào gọn gàng cho email/password và đăng nhập Google.",
      },
    },
    registerNote: {
      en: "Basic participant fields only. Extra profile editing can happen after login.",
      vi: "Chỉ giữ các trường cơ bản cho thí sinh. Các thông tin mở rộng có thể sửa sau khi đăng nhập.",
    },
    signinNote: {
      en: "Use the same clean entry point for both email/password and Google.",
      vi: "Sử dụng cùng một điểm vào gọn gàng cho cả email/password và Google.",
    },
  },
  workspace: {
    header: {
      eyebrow: { en: "Team workspace", vi: "Đội thi" },
      title: {
        en: "Team identity, members, invitations, and submission flow in one place.",
        vi: "Nhận diện đội, thành viên, lời mời và luồng nộp bài trong cùng một nơi.",
      },
      description: {
        en: "This page is centered on the team itself and already reflects the eligibility and submission rules across all three rounds.",
        vi: "Trang này đặt trọng tâm vào chính đội thi và đã phản ánh các quy tắc điều kiện và nộp bài xuyên suốt cả ba vòng.",
      },
    },
    noTeamTitle: {
      en: "Create a team or respond to invitations.",
      vi: "Tạo đội hoặc phản hồi lời mời.",
    },
    noTeamDescription: {
      en: "A student can create a team first, then recruit members later. Team members only become eligible for the Round 1 individual qualifier after the team reaches at least three members.",
      vi: "Một sinh viên có thể tạo đội trước, sau đó mới tuyển thêm thành viên. Các thành viên chỉ đủ điều kiện vào bài thi cá nhân của Vòng 1 sau khi đội đạt tối thiểu ba người.",
    },
    teamDescription: {
      en: "This page is now centered on the team itself: Round 1 eligibility by member count, plus versioned team submissions for Round 2 and the final round.",
      vi: "Trang này được đặt trọng tâm vào chính đội thi: điều kiện vào Vòng 1 theo số lượng thành viên, cùng với việc nộp bài có quản lý phiên bản cho Vòng 2 và vòng chung kết.",
    },
  },
  organizer: {
    header: {
      eyebrow: { en: "Competition legacy", vi: "Hành trình cuộc thi" },
      title: {
        en: "Attacker is a student fintech competition that has already grown through multiple seasons.",
        vi: "Attacker là một cuộc thi fintech sinh viên đã đi qua nhiều mùa và tiếp tục lớn lên.",
      },
      description: {
        en: "This page now introduces the competition through its multi-season story, builder community, and stronger 2026 platform direction rather than internal admin tooling.",
        vi: "Trang này giới thiệu cuộc thi thông qua hành trình nhiều mùa, cộng đồng builder và định hướng nền tảng 2026 rõ ràng hơn thay vì các công cụ vận hành nội bộ.",
      },
    },
    heroBadges: [
      { en: "multi-season legacy", vi: "di sản nhiều mùa" },
      { en: "student fintech builders", vi: "builder fintech sinh viên" },
      { en: "industry-linked judging", vi: "hội đồng gắn với doanh nghiệp" },
    ],
    heroCard: {
      eyebrow: { en: "Attacker legacy", vi: "Di sản Attacker" },
      title: {
        en: "A competition that has grown from campus energy into a stronger fintech stage.",
        vi: "Một cuộc thi đã đi từ năng lượng học đường đến một sân chơi fintech vững vàng hơn.",
      },
      description: { en: "", vi: "" },
    },
    heroImage: "/theme-hero-1.jpg",
    metrics: [
      {
        label: { en: "seasons shaped", vi: "mùa thi đã đi qua" },
        value: "04",
        note: { en: "", vi: "" },
      },
      {
        label: { en: "student builders reached", vi: "lượt builder tiếp cận" },
        value: "1,200+",
        note: { en: "", vi: "" },
      },
      {
        label: { en: "universities & communities", vi: "trường và cộng đồng" },
        value: "35+",
        note: { en: "", vi: "" },
      },
      {
        label: { en: "partners & judges engaged", vi: "đối tác và giám khảo đồng hành" },
        value: "50+",
        note: { en: "", vi: "" },
      },
    ],
    contentModules: {
      eyebrow: { en: "Season highlights", vi: "Điểm nhấn qua từng mùa" },
      title: {
        en: "Each season helped Attacker become more visible, more structured, and more credible.",
        vi: "Mỗi mùa thi đều giúp Attacker rõ nét hơn, có cấu trúc hơn và đáng tin hơn.",
      },
      description: {
        en: "Use this area to show that the competition is not appearing from zero. It already has momentum, finalist stories, and a stronger public-facing identity.",
        vi: "Khu vực này được dùng để cho thấy cuộc thi không bắt đầu từ số 0. Nó đã có đà tăng trưởng, có câu chuyện chung kết và một bản sắc hướng công chúng rõ hơn.",
      },
    },
    competitionLinkLabel: { en: "Explore competition page", vi: "Mở trang cuộc thi" },
    seasonBadgeLabel: { en: "Season", vi: "Mùa" },
    seasonStories: [
      {
        year: "2023",
        image: "/theme-feature-1.jpg",
        label: {
          en: "Early market-building phase",
          vi: "Giai đoạn xây nền tảng ban đầu",
        },
        title: {
          en: "Attacker started as a student arena for sharper fintech thinking.",
          vi: "Attacker bắt đầu như một sân chơi sinh viên cho tư duy fintech sắc nét hơn.",
        },
        body: {
          en: "The first seasons proved there was demand for a competition that sits between finance, product reasoning, and practical execution.",
          vi: "Những mùa đầu cho thấy có nhu cầu rõ ràng cho một cuộc thi nằm giữa tài chính, tư duy sản phẩm và năng lực thực thi.",
        },
        stats: [
          { en: "300+ participants", vi: "300+ thí sinh" },
          { en: "multi-campus reach", vi: "phủ nhiều trường" },
        ],
      },
      {
        year: "2024",
        image: "/theme-hero-2.jpg",
        label: {
          en: "Cross-skill teams gained momentum",
          vi: "Đội đa kỹ năng bắt đầu bùng lên",
        },
        title: {
          en: "The team format matured with stronger product, data, and strategy roles.",
          vi: "Định dạng đội thi trưởng thành hơn với vai trò sản phẩm, dữ liệu và chiến lược rõ ràng hơn.",
        },
        body: {
          en: "Participants arrived with a more complete builder mindset, not only technical strength. That gave the competition better stories, better finals, and stronger peer learning.",
          vi: "Thí sinh đến với một tư duy builder đầy đủ hơn, không chỉ là sức mạnh kỹ thuật. Điều đó tạo nên những câu chuyện hay hơn, vòng chung kết tốt hơn và khả năng học hỏi lẫn nhau mạnh hơn.",
        },
        stats: [
          { en: "top finalist showcases", vi: "các showcase chung kết" },
          { en: "industry-facing judges", vi: "giám khảo gần doanh nghiệp" },
        ],
      },
      {
        year: "2025",
        image: "/theme-hero-1.jpg",
        label: {
          en: "The competition reached a broader ecosystem",
          vi: "Cuộc thi mở rộng ra hệ sinh thái lớn hơn",
        },
        title: {
          en: "Sponsors, judges, and student communities gave Attacker a stronger public presence.",
          vi: "Nhà tài trợ, giám khảo và cộng đồng sinh viên giúp Attacker có độ hiện diện công khai mạnh hơn.",
        },
        body: {
          en: "By this point the competition already felt bigger than a campus event. It started to behave like a real launch platform for student fintech talent.",
          vi: "Đến giai đoạn này, cuộc thi đã lớn hơn một sự kiện nội bộ trong trường. Nó bắt đầu vận hành như một launch platform thực sự cho tài năng fintech sinh viên.",
        },
        stats: [
          { en: "partner visibility", vi: "độ hiện diện đối tác" },
          { en: "clearer public narrative", vi: "câu chuyện công khai rõ hơn" },
        ],
      },
      {
        year: "2026",
        image: "/theme-feature-2.jpg",
        label: {
          en: "A cleaner international-facing stage",
          vi: "Một sân chơi sạch hơn, hướng ra bên ngoài hơn",
        },
        title: {
          en: "This season reframes Attacker as a more modern competition platform.",
          vi: "Mùa này tái định vị Attacker thành một nền tảng cuộc thi hiện đại hơn.",
        },
        body: {
          en: "The bilingual website, team workspace, newsroom, and admin mode together make the competition easier to trust, easier to navigate, and easier to scale.",
          vi: "Website song ngữ, team workspace, newsroom và admin mode kết hợp lại giúp cuộc thi dễ tạo niềm tin hơn, dễ điều hướng hơn và dễ mở rộng hơn.",
        },
        stats: [
          { en: "frontend team workflow", vi: "luồng đội frontend" },
          { en: "editorial newsroom system", vi: "hệ newsroom dạng biên tập" },
        ],
      },
    ],
    seasonArchives: createOrganizerSeasonArchives(),
    flags: {
      eyebrow: { en: "Photo slider", vi: "Photo slider" },
      title: {
        en: "A visual archive that keeps Attacker in motion.",
        vi: "Một kho hình ảnh giúp Attacker luôn chuyển động.",
      },
      description: {
        en: "Use this block to move between seasons, open a larger image, and connect each visual to the competition story.",
        vi: "Dùng block này để di chuyển giữa các mùa, mở ảnh lớn hơn và nối từng hình ảnh với câu chuyện của cuộc thi.",
      },
    },
    gallerySlides: [
      {
        image: "/theme-hero-2.jpg",
        year: "2023",
        label: {
          en: "Kickoff atmosphere",
          vi: "Không khí khởi động",
        },
        title: {
          en: "Students entered Attacker through an energetic campus launch format.",
          vi: "Sinh viên bước vào Attacker qua một format khởi động giàu năng lượng học đường.",
        },
        description: {
          en: "This opening moment should feel like a real competition brand reveal, not just an internal event photo.",
          vi: "Khoảnh khắc mở đầu này nên mang cảm giác ra mắt thương hiệu cuộc thi thật sự, không chỉ là một tấm hình sự kiện nội bộ.",
        },
      },
      {
        image: "/theme-hero-1.jpg",
        year: "2024",
        label: {
          en: "Final-round focus",
          vi: "Không khí vòng chung kết",
        },
        title: {
          en: "Each season pushed the event closer to a stronger, more public-facing stage.",
          vi: "Mỗi mùa thi đều đẩy sự kiện đến gần hơn với một sân khấu mạnh hơn và hướng công chúng hơn.",
        },
        description: {
          en: "Use this type of visual to show the pressure, polish, and seriousness of the finalist experience.",
          vi: "Dùng kiểu hình ảnh này để cho thấy áp lực, độ chỉn chu và sự nghiêm túc của trải nghiệm dành cho đội vào chung kết.",
        },
      },
      {
        image: "/theme-feature-1.jpg",
        year: "2025",
        label: {
          en: "Team and audience energy",
          vi: "Năng lượng đội thi và khán giả",
        },
        title: {
          en: "Attacker grew into a competition with stronger team identity and broader visibility.",
          vi: "Attacker phát triển thành một cuộc thi có bản sắc đội thi rõ hơn và độ hiện diện rộng hơn.",
        },
        description: {
          en: "This visual works well for showing community density, reactions, and the scale of participation around the event.",
          vi: "Hình ảnh này phù hợp để cho thấy mật độ cộng đồng, phản ứng tại sự kiện và quy mô tham gia xoay quanh cuộc thi.",
        },
      },
      {
        image: "/theme-feature-2.jpg",
        year: "2026",
        label: {
          en: "New-generation presentation",
          vi: "Ngôn ngữ trình bày thế hệ mới",
        },
        title: {
          en: "The 2026 direction should feel cleaner, more international, and more visual-first.",
          vi: "Định hướng 2026 nên mang cảm giác sạch hơn, quốc tế hơn và ưu tiên hình ảnh hơn.",
        },
        description: {
          en: "This is the kind of imagery that can connect the legacy of the competition with the new website direction.",
          vi: "Đây là kiểu hình ảnh có thể kết nối di sản của cuộc thi với hướng website mới.",
        },
      },
    ],
    galleryCurrentFrame: {
      eyebrow: { en: "Current frame", vi: "Khung hình hiện tại" },
      title: { en: "", vi: "" },
      description: { en: "", vi: "" },
    },
    galleryNotes: [
      {
        en: "Manual controls keep the gallery stable while still letting users move through season moments.",
        vi: "Điều khiển thủ công giúp thư viện ảnh ổn định hơn nhưng vẫn cho phép người xem chuyển qua các khoảnh khắc từng mùa.",
      },
      {
        en: "Thumbnail clicks let users jump directly to a specific season moment.",
        vi: "Bấm thumbnail cho phép người xem nhảy thẳng đến một khoảnh khắc cụ thể.",
      },
      {
        en: "Fullscreen mode gives each image more stage and more context.",
        vi: "Chế độ toàn màn hình giúp mỗi hình có nhiều sân khấu và nhiều ngữ cảnh hơn.",
      },
    ],
    openFullViewLabel: { en: "Open full view", vi: "Mở toàn màn hình" },
    previousPhotoLabel: { en: "Previous photo", vi: "Ảnh trước" },
    nextPhotoLabel: { en: "Next photo", vi: "Ảnh tiếp theo" },
    closeGalleryLabel: { en: "Close gallery", vi: "Đóng thư viện" },
  },
  contact: {
    mapEyebrow: { en: "Contact", vi: "Liên hệ" },
    campusName: contactLocation.campusName,
    phoneContactsEyebrow: { en: "Phone contacts", vi: "Đầu mối điện thoại" },
    phoneContacts: contactDeskContacts.map((item) => ({
      name: item.name,
      phone: item.phone,
      tel: item.tel,
      responsibility: item.responsibility,
    })),
    responseRhythmEyebrow: { en: "Response rhythm", vi: "Nhịp phản hồi" },
    responseRhythmDescription: {
      en: "Support channels stay open 24/7 for registration, team, and technical coordination.",
      vi: "Các kênh hỗ trợ luôn mở 24/7 cho nhu cầu đăng ký, đội thi và phối hợp kỹ thuật.",
    },
    officialEmailLabel: { en: "Official email", vi: "Email chính thức" },
    officialEmailValue: contactInfo.email,
    primaryHotlineLabel: { en: "Primary hotline", vi: "Hotline chính" },
    primaryHotlineValue: contactInfo.phone,
    supportWindowLabel: { en: "Support window", vi: "Khung giờ hỗ trợ" },
    supportWindowValue: "24/7",
    organizerAddressEyebrow: { en: "Organizer address", vi: "Địa chỉ ban tổ chức" },
    organizerAddress: contactLocation.address,
    organizerAddressNote: contactLocation.note,
    officialChannelsEyebrow: { en: "Official channels", vi: "Kênh chính thức" },
    attackerFacebookLabel: { en: "Attacker facebook page", vi: "Fanpage Attacker" },
    attackerFacebookUrl: contactInfo.attackerFacebook,
    ftcFacebookLabel: { en: "FTC facebook page", vi: "Fanpage FTC" },
    ftcFacebookUrl: contactInfo.ftcFacebook,
    openNewsroomLabel: { en: "Open newsroom", vi: "Mở trang tin tức" },
  },
  timelinePage: {
    diagramEyebrow: { en: "Timeline diagram", vi: "Sơ đồ lịch trình" },
    diagramHint: {
      en: "Click any stage to jump straight to the detailed block below.",
      vi: "Nhấn vào từng giai đoạn để chuyển nhanh đến khối thông tin chi tiết bên dưới.",
    },
    scheduleToBeUpdated: { en: "Schedule to be updated", vi: "Lịch sẽ được cập nhật" },
    openDetailLabel: { en: "Open detail", vi: "Mở chi tiết" },
    openRuleBlockLabel: { en: "View rules", vi: "Xem thể lệ" },
    readResultUpdateLabel: { en: "Read result update", vi: "Đọc cập nhật kết quả" },
    round2SubmissionClosedTitle: {
      en: "Round 2 submission window has closed.",
      vi: "Hạn nộp bài Vòng 2 đã kết thúc.",
    },
    finalReportClosedTitle: {
      en: "The final report deadline has passed.",
      vi: "Hạn nộp báo cáo chung kết đã kết thúc.",
    },
    stepsLabel: { en: "steps", vi: "bước" },
    timeLabel: { en: "Time", vi: "Thời gian" },
    placeLabel: { en: "Place", vi: "Địa điểm" },
    methodLabel: { en: "Method", vi: "Hình thức" },
    nowLabel: { en: "now", vi: "ngay bây giờ" },
    finishedLabel: { en: "Finished", vi: "Đã kết thúc" },
    ongoingLabel: { en: "Ongoing", vi: "Đang diễn ra" },
    startingSoonLabel: { en: "Starting soon", vi: "Sắp diễn ra" },
    notStartedLabel: { en: "Not started", vi: "Chưa diễn ra" },
    endsInPrefix: { en: "Ends in", vi: "Kết thúc trong" },
    startsInPrefix: { en: "Starts in", vi: "Bắt đầu trong" },
    countdownDayUnit: { en: "d", vi: "ngày" },
    createAccountActionLabel: { en: "Create account", vi: "Tạo tài khoản" },
    registrationTeamLockTitle: { en: "Registration and team lock", vi: "Đăng ký và chốt đội" },
    eligibilityCheckLabel: { en: "Eligibility check", vi: "Kiểm tra điều kiện" },
    closeEligibilityMessageLabel: { en: "Close eligibility message", vi: "Đóng thông báo điều kiện" },
    gotItLabel: { en: "Got it", vi: "Đã hiểu" },
    eligibilitySignInTitle: { en: "Sign in before checking eligibility", vi: "Cần đăng nhập để kiểm tra điều kiện" },
    eligibilitySignInDescription: {
      en: "The system needs your student account and team status before it can confirm Round 1 eligibility.",
      vi: "Hệ thống cần tài khoản sinh viên và trạng thái đội của bạn trước khi xác nhận điều kiện Vòng 1.",
    },
    eligibilitySignInReason: {
      en: "Create an account or sign in with your student account first.",
      vi: "Hãy tạo tài khoản hoặc đăng nhập bằng tài khoản sinh viên trước.",
    },
    eligibilityWrongRoleTitle: { en: "This account is not eligible for Round 1", vi: "Tài khoản này chưa đủ điều kiện Vòng 1" },
    eligibilityWrongRoleDescription: {
      en: "Round 1 is only available to student participant accounts.",
      vi: "Vòng 1 chỉ mở cho tài khoản sinh viên tham gia cuộc thi.",
    },
    eligibilityWrongRoleReason: {
      en: "Use a student participant account instead of an organizer, moderator, admin, or judge account.",
      vi: "Hãy dùng tài khoản sinh viên thay vì tài khoản ban tổ chức, moderator, admin hoặc giám khảo.",
    },
    eligibilityNoTeamTitle: { en: "Not eligible for Round 1 yet", vi: "Chưa đủ điều kiện Vòng 1" },
    eligibilityNoTeamDescription: {
      en: "You need to belong to an eligible team before Round 1 opens.",
      vi: "Bạn cần thuộc một đội đủ điều kiện trước khi Vòng 1 mở.",
    },
    eligibilityNoTeamReason: { en: "Create or join a team first.", vi: "Hãy tạo đội hoặc tham gia một đội trước." },
    eligibilityAdvancedTitle: { en: "Your team has already advanced beyond Round 1", vi: "Đội của bạn đã đi qua Vòng 1" },
    eligibilityAdvancedDescription: {
      en: "This team is no longer in the Round 1 eligibility checkpoint because it has progressed to a later stage.",
      vi: "Đội đã đủ điều kiện dự thi Vòng 1",
    },
    eligibilityEligibleTitle: { en: "Eligible for Round 1", vi: "Đủ điều kiện Vòng 1" },
    eligibilityEligibleDescription: {
      en: "Your team meets the current Round 1 entry conditions.",
      vi: "Đội của bạn đáp ứng điều kiện hiện tại để vào Vòng 1.",
    },
    eligibilityMinMembersMetReason: {
      en: "Team has {minMembers} or more members.",
      vi: "Đội có từ {minMembers} thành viên trở lên.",
    },
    eligibilityTeamLockCompletedReason: { en: "Team lock is completed.", vi: "Đội đã hoàn tất khóa đội." },
    eligibilityRound1AvailableReason: { en: "Round 1 is still available.", vi: "Vòng 1 vẫn còn khả dụng." },
    eligibilityMinMembersMissingReason: {
      en: "Team needs at least {minMembers} members; it currently has {currentMembers}.",
      vi: "Đội cần tối thiểu {minMembers} thành viên; hiện có {currentMembers}.",
    },
    eligibilityTeamLockMissingReason: {
      en: "Team lock has not been completed by all current members.",
      vi: "Đội chưa hoàn tất bước khóa đội với toàn bộ thành viên hiện tại.",
    },
    eligibilityRound1ClosedReason: { en: "The Round 1 exam window has closed.", vi: "Khung thi Vòng 1 đã kết thúc." },
    eligibilityNotReadyTitle: { en: "Not eligible for Round 1 yet", vi: "Chưa đủ điều kiện Vòng 1" },
    eligibilityNotReadyDescription: {
      en: "The team needs to resolve the items below before Round 1 can be opened.",
      vi: "Đội cần xử lý các mục bên dưới trước khi có thể mở Vòng 1.",
    },
    eligibilityRound1UnavailableReason: {
      en: "Round 1 is not currently available for this team.",
      vi: "Vòng 1 hiện chưa khả dụng với đội này.",
    },
    general: {
      eyebrow: { en: "Preparation", vi: "Chuẩn bị" },
      title: { en: "Registration and team lock", vi: "Đăng ký và chốt đội" },
      description: {
        en: "This phase covers account setup, team formation, and the final lock checkpoint required before Round 1.",
        vi: "Giai đoạn này bao gồm tạo tài khoản, hình thành đội và mốc chốt đội bắt buộc trước khi vào Vòng 1.",
      },
    },
    round1: {
      eyebrow: { en: "Round 1", vi: "Vòng 1" },
      title: { en: "Individual qualifier", vi: "Bài thi cá nhân" },
      description: {
        en: "The first competition stage is an online individual exam, but qualification is decided by team-average ranking.",
        vi: "Vòng 1 diễn ra dưới hình thức thi cá nhân, kết quả xét tuyển vào vòng trong được tính dựa trên điểm trung bình của tất cả các thành viên trong đội.",
      },
    },
    round2: {
      eyebrow: { en: "Round 2", vi: "Vòng 2" },
      title: { en: "Report submission and judge review", vi: "Nộp báo cáo và chấm bởi giám khảo" },
      description: {
        en: "Round 2 focuses on report submission, version tracking, and the judged shortlist for the final.",
        vi: "Đội thi nộp báo cáo mô tả dự án.",
      },
    },
    round3: {
      eyebrow: { en: "Final round", vi: "Chung kết" },
      title: { en: "Final report, presentation, and awards", vi: "Báo cáo cuối, thuyết trình và trao giải" },
      description: {
        en: "The final stage starts with the finalist report deadline, then moves into live presentation, judge Q&A, and the final award decision.",
        vi: "5 đội điểm cao nhất vòng 2 thi chung kết, 20 đội tiếp theo vào thi bảng Ươm mầm, chọn ra 10 đội trao giải Ươm mầm dựa theo điểm báo cáo đã chỉnh sửa hoàn thiện.",
      },
    },
  },
  finalists: {
    finalistsHeader: {
      eyebrow: { en: "Finalist teams", vi: "Đội vào chung kết" },
      title: { en: "5 finalist teams", vi: "5 đội vào chung kết" },
      description: {
        en: "The five teams below are the finalist list only. This section does not indicate ranking order.",
        vi: "Danh sách chỉ mang tính liệt kê, không mang ý nghĩa xếp hạng.",
      },
    },
    emergingHeader: {
      eyebrow: { en: "Emerging round", vi: "Vòng Đội ươm mầm" },
      title: { en: "20 Emerging round qualifiers", vi: "20 đội lọt vào bảng Tiềm năng" },
      description: {
        en: "The twenty teams below qualify for the Emerging round and must submit an updated report for rescoring. The best 10 teams after Emerging round scoring receive official Emerging Team recognition.",
        vi: "Danh sách chỉ mang tính liệt kê, không mang ý nghĩa xếp hạng.",
      },
    },
    finalistSlotLabel: { en: "Finalist slot", vi: "Vị trí chung kết" },
    awaitingUpdateLabel: { en: "Awaiting update", vi: "Chờ cập nhật" },
    finalistSlotDescription: {
      en: "This finalist slot is reserved and will be filled when the shortlist is finalized.",
      vi: "Vị trí chung kết này đang được giữ chỗ và sẽ được cập nhật khi danh sách chính thức hoàn tất.",
    },
    presentationDayLabel: { en: "Presentation day", vi: "Ngày thuyết trình" },
    toBeAnnouncedLabel: { en: "To be announced", vi: "Sẽ cập nhật" },
    yourTeamLabel: { en: "Your team", vi: "Đội của bạn" },
    keywordPrefix: { en: "Keyword", vi: "Từ khóa" },
    finalistTeamLabel: { en: "Finalist team", vi: "Đội vào chung kết" },
    membersSuffix: { en: "members", vi: "thành viên" },
    teamLeaderPrefix: { en: "Team leader", vi: "Đội trưởng" },
    leaderInfoUpdating: {
      en: "Leader info is being updated",
      vi: "Đang cập nhật thông tin đội trưởng",
    },
    teamColumnLabel: { en: "Team", vi: "Đội" },
    leaderColumnLabel: { en: "Leader", vi: "Đội trưởng" },
    keywordColumnLabel: { en: "Keyword", vi: "Từ khóa" },
    recognitionColumnLabel: { en: "Bracket", vi: "Bảng ươm mầm" },
    emergingTeamSlotLabel: { en: "Emerging round qualifier slot", vi: "Vị trí vào Vòng Đội ươm mầm" },
    awaitingOfficialUpdate: { en: "Awaiting official update", vi: "Chờ cập nhật chính thức" },
    reservedLabel: { en: "Reserved", vi: "Giữ chỗ" },
    emergingTeamLabel: { en: "Emerging round qualifier", vi: "Bảng ươm mầm" },
  },
  finalResults: {
    champion: {
      eyebrow: { en: "First place", vi: "Hạng nhất" },
      title: { en: "Champion", vi: "Quán quân" },
      description: {
        en: "Highest final-round score after the live defense.",
        vi: "Đội có tổng điểm cao nhất sau phần bảo vệ trực tiếp.",
      },
    },
    runnerUp: {
      eyebrow: { en: "Second place", vi: "Hạng nhì" },
      title: { en: "Runner-up", vi: "Á quân" },
      description: {
        en: "Second-highest team after the final presentation day.",
        vi: "Đội đứng thứ hai sau ngày thuyết trình chung kết.",
      },
    },
    thirdPlace: {
      eyebrow: { en: "Third place", vi: "Hạng ba" },
      title: { en: "Third place", vi: "Quý quân" },
      description: {
        en: "The final podium place after the last judge review.",
        vi: "Vị trí cuối cùng trên bục xếp hạng sau chấm điểm chung cuộc.",
      },
    },
    fourthPlace: {
      eyebrow: { en: "Shared fourth place", vi: "Đồng hạng tư" },
      title: { en: "4th place teams", vi: "Hai đội hạng 4" },
      description: {
        en: "Two finalist teams close the season in shared fourth place.",
        vi: "Hai đội chung kết khép lại mùa giải với vị trí đồng hạng 4.",
      },
    },
    memberSlotLabel: { en: "Member slot", vi: "Vị trí thành viên" },
    awaitingOfficialTeamLineup: {
      en: "Awaiting official team lineup",
      vi: "Chờ cập nhật đội hình chính thức",
    },
    resultPendingLabel: { en: "Result pending", vi: "Chờ công bố" },
    yourTeamLabel: { en: "Your team", vi: "Đội của bạn" },
    awaitingOfficialAnnouncement: {
      en: "Awaiting official announcement",
      vi: "Đang chờ công bố chính thức",
    },
    awaitingOfficialAnnouncementBody: {
      en: "This place will be replaced by the official team as soon as the final decision is published.",
      vi: "Vị trí này sẽ được thay bằng đội chính thức ngay khi kết quả cuối cùng được công bố.",
    },
    keywordPrefix: { en: "Keyword", vi: "Từ khóa" },
    leaderPrefix: { en: "Leader", vi: "Đội trưởng" },
    leaderInfoPending: { en: "Leader info pending", vi: "Chờ cập nhật đội trưởng" },
    teamMembersLabel: { en: "Team members", vi: "Thành viên đội" },
    finalStandingsEyebrow: { en: "Final standings", vi: "Xếp hạng chung cuộc" },
    presentationDayLabel: { en: "Presentation day", vi: "Ngày thuyết trình" },
    presentationPlaceLabel: { en: "Presentation place", vi: "Địa điểm thuyết trình" },
    toBeAnnouncedLabel: { en: "To be announced", vi: "Sẽ cập nhật" },
  },
  forum: {
    searchPlaceholder: {
      en: "Search by title, university, or role",
      vi: "Tìm theo tiêu đề, trường hoặc vai trò",
    },
    allThreadsLabel: { en: "All threads", vi: "Tất cả" },
    matchingThreadsSuffix: { en: "matching threads", vi: "chủ đề phù hợp" },
    allCategoriesDescription: {
      en: "Browse all open conversations from participants looking for teammates or building discussion.",
      vi: "Xem toàn bộ cuộc trò chuyện của thí sinh đang tìm đồng đội hoặc trao đổi chung.",
    },
    backToThreadListLabel: { en: "Back to thread list", vi: "Quay lại danh sách chủ đề" },
    lastActivityLabel: { en: "Last activity", vi: "Hoạt động gần nhất" },
    closedByOwnerLabel: { en: "Closed by owner", vi: "Chủ đề đã đóng" },
    repliesSuffix: { en: "replies", vi: "phản hồi" },
    loadingDiscussionLabel: { en: "Loading discussion...", vi: "Đang tải thảo luận..." },
    repliesSectionLabel: { en: "Replies", vi: "Phản hồi" },
    noReplyYetLabel: {
      en: "No reply yet. Start the conversation from the composer below.",
      vi: "Chưa có phản hồi nào. Hãy bắt đầu cuộc trao đổi bằng khung trả lời bên dưới.",
    },
    joinConversationLabel: { en: "Join the conversation", vi: "Tham gia trao đổi" },
    closedThreadNotice: {
      en: "This thread is closed. New replies are no longer accepted.",
      vi: "Chủ đề này đã đóng. Không thể gửi thêm phản hồi mới.",
    },
    signedInReplyNotice: {
      en: "Only signed-in participant, admin, or moderator accounts can reply. Browsing remains open to everyone.",
      vi: "Chỉ tài khoản thí sinh, admin hoặc moderator đã đăng nhập mới có thể phản hồi. Việc xem nội dung vẫn mở cho mọi người.",
    },
    signInNowLabel: { en: "Sign in now", vi: "Đăng nhập ngay" },
    replyPlaceholder: {
      en: "Write a useful reply about your background, what role you can take, and how people should contact you.",
      vi: "Viết một phản hồi hữu ích về nền tảng của bạn, vai trò bạn có thể đảm nhận và cách mọi người nên liên hệ với bạn.",
    },
    postReplyLabel: { en: "Post reply", vi: "Gửi phản hồi" },
    activeThreadsSuffix: { en: "active threads", vi: "chủ đề đang hoạt động" },
    sortedByRecentActivityLabel: { en: "Sorted by recent activity", vi: "Sắp theo hoạt động gần nhất" },
    openThreadLabel: { en: "Open a thread", vi: "Mở chủ đề" },
    signInToParticipateLabel: { en: "Sign in to participate", vi: "Đăng nhập để tham gia" },
    loadingThreadsLabel: { en: "Loading discussion threads...", vi: "Đang tải danh sách thảo luận..." },
    noMatchingThreadTitle: { en: "No matching thread yet.", vi: "Chưa có chủ đề phù hợp." },
    noMatchingThreadDescription: {
      en: "Try another keyword or open the first thread for your own team-search message.",
      vi: "Hãy đổi từ khóa khác hoặc mở một chủ đề mới cho nhu cầu tìm đội của bạn.",
    },
    newThreadEyebrow: { en: "New forum thread", vi: "Chủ đề forum mới" },
    newThreadTitle: {
      en: "Open a discussion for teammate matching",
      vi: "Mở một chủ đề để kết nối tìm đồng đội",
    },
    closeDialogLabel: { en: "Close dialog", vi: "Đóng cửa sổ" },
    threadTitleFieldLabel: { en: "Thread title", vi: "Tiêu đề" },
    categoryFieldLabel: { en: "Category", vi: "Phân loại" },
    rolesSkillsFieldLabel: {
      en: "Roles or skills you want to mention",
      vi: "Vai trò hoặc kỹ năng bạn muốn nhắc đến",
    },
    rolesSkillsPlaceholder: {
      en: "Example: Product, UI/UX, Data analysis, Frontend",
      vi: "Ví dụ: Product, UI/UX, Phân tích dữ liệu, Frontend",
    },
    shortSummaryFieldLabel: { en: "Short summary", vi: "Mô tả ngắn" },
    mainPostFieldLabel: { en: "Main post", vi: "Nội dung chính" },
    contactNoteFieldLabel: { en: "Contact note", vi: "Ghi chú liên hệ" },
    contactNotePlaceholder: {
      en: "Example: I usually check forum replies every evening.",
      vi: "Ví dụ: Tôi thường xem phản hồi trên forum vào mỗi buổi tối.",
    },
    publishThreadLabel: { en: "Publish thread", vi: "Đăng chủ đề" },
    clearFormLabel: { en: "Clear form", vi: "Xóa nội dung" },
    closeThreadConfirmTitle: { en: "Close this thread?", vi: "Đóng chủ đề này?" },
    closeThreadConfirmDescription: {
      en: "Closed threads cannot be re-opened. Participants will still see the thread in the list, but new replies will be blocked.",
      vi: "Chủ đề đã đóng sẽ không thể mở lại. Người dùng vẫn thấy chủ đề trong danh sách, nhưng không thể gửi thêm phản hồi.",
    },
    cancelLabel: { en: "Cancel", vi: "Hủy" },
    closeThreadLabel: { en: "Close thread", vi: "Đóng chủ đề" },
    categoryLookingForTeamLabel: { en: "Looking for team", vi: "Tìm đội" },
    categoryLookingForTeamDescription: {
      en: "For participants who want to join an existing team.",
      vi: "Dành cho thí sinh muốn tìm một đội đang tuyển thành viên.",
    },
    categoryTeamRecruitingLabel: { en: "Team recruiting", vi: "Đội đang tuyển" },
    categoryTeamRecruitingDescription: {
      en: "For teams that still need members before they lock their roster.",
      vi: "Dành cho các đội đang cần thêm người trước khi chốt đội hình.",
    },
    categoryGeneralDiscussionLabel: { en: "General discussion", vi: "Trao đổi chung" },
    categoryGeneralDiscussionDescription: {
      en: "For broader questions about skills, expectations, and collaboration.",
      vi: "Dành cho trao đổi chung về kỹ năng, kỳ vọng và cách phối hợp.",
    },
  },
};

export const homeMetrics: MetricItem[] = [
  {
    value: "03",
    label: { en: "competition rounds", vi: "vòng thi" },
    note: {
      en: "Individual qualifier, report judging, and final defense",
      vi: "Vòng loại cá nhân, chấm báo cáo và bảo vệ chung kết",
    },
  },
  {
    value: "3-5",
    label: { en: "members per team", vi: "thành viên mỗi đội" },
    note: {
      en: "At least 3 members are required before Round 1 access",
      vi: "Cần ít nhất 3 thành viên trước khi vào Vòng 1",
    },
  },
  {
    value: "50",
    label: { en: "teams to Round 2", vi: "đội vào Vòng 2" },
    note: {
      en: "Advanced by the highest average score from Round 1",
      vi: "Đi tiếp theo điểm trung bình cao nhất của Vòng 1",
    },
  },
  {
    value: "05",
    label: { en: "finalist teams", vi: "đội chung kết" },
    note: {
      en: "Round 2 also qualifies the next 20 teams for the Emerging round",
      vi: "Vòng 2 đồng thời ghi nhận 20 đội tiếp theo là Đội ươm mầm",
    },
  },
];

export const spotlightItems: SpotlightItem[] = [
  {
    accent: "from-sky-500/25 via-cyan-400/10 to-transparent",
    title: {
      en: "Built for finance-native storytelling",
      vi: "Được thiết kế cho cách kể chuyện mang tính tài chính",
    },
    description: {
      en: "Structured around strategy, product, data, and execution instead of generic event sections.",
      vi: "Cấu trúc nội dung xoay quanh chiến lược, sản phẩm, dữ liệu và thực thi thay vì các section sự kiện chung chung.",
    },
  },
  {
    accent: "from-cyan-400/20 via-emerald-400/10 to-transparent",
    title: {
      en: "Youthful without looking casual",
      vi: "Trẻ trung nhưng không bị giống giải trí",
    },
    description: {
      en: "Fast gradients, strong card hierarchy, and editorial typography keep the site energetic and credible.",
      vi: "Gradient nhanh, cấp bậc thẻ rõ ràng và typography kiểu biên tập giúp giao diện năng động nhưng vẫn đáng tin.",
    },
  },
  {
    accent: "from-orange-400/20 via-rose-400/10 to-transparent",
    title: {
      en: "Frontend ready for backend integration",
      vi: "Frontend sẵn sàng để gắn backend",
    },
    description: {
      en: "User, invitation, team, and admin flows already follow the business rules you described.",
      vi: "Luồng người dùng, mời đội, đội thi và quản trị đã bám sát quy tắc bạn mô tả.",
    },
  },
];

export const competitionOverview = {
  title: {
    en: "Competition architecture",
    vi: "Kiến trúc cuộc thi",
  },
  description: {
    en: "Attacker 2026 starts with an individual qualifier built from 40 objective questions plus 2 essay questions, then moves the strongest teams into a judge-scored report round and a live final presentation. Advancement is calculated at the team level, even when the first test is taken individually.",
    vi: "Attacker 2026 bắt đầu bằng một bài vòng loại cá nhân gồm 40 câu hỏi trắc nghiệm và 2 câu tự luận, sau đó đưa các đội mạnh nhất vào vòng nộp báo cáo được giám khảo chấm điểm và một buổi thuyết trình chung kết trực tiếp. Việc đi tiếp được tính ở cấp độ đội, dù cho bài thi đầu tiên được làm theo từng cá nhân.",
  },
};

export const audienceHighlights: RuleItem[] = [
  {
    title: {
      en: "Eligible participants",
      vi: "Đối tượng tham gia",
    },
    description: {
      en: "University and college students with interest in fintech, data, product, trading, or entrepreneurship.",
      vi: "Sinh viên đại học và cao đẳng quan tâm đến fintech, dữ liệu, sản phẩm, giao dịch hoặc khởi nghiệp.",
    },
  },
  {
    title: {
      en: "Registration format",
      vi: "Hình thức đăng ký",
    },
    description: {
      en: "Each user owns one profile, can belong to one team at a time, and joins a team through self-creation or invitation.",
      vi: "Mỗi người dùng có một hồ sơ, chỉ thuộc một đội tại một thời điểm và có thể vào đội bằng cách tự tạo hoặc nhận lời mời.",
    },
  },
  {
    title: {
      en: "Readiness checkpoint",
      vi: "Mốc sẵn sàng",
    },
    description: {
      en: "Teams may form with one leader first, but only teams with 3 to 5 members are eligible for the individual Round 1 qualifier and team-average ranking.",
      vi: "Đội có thể được tạo bởi một đội trưởng trước, nhưng chỉ những đội có từ 3 đến 5 thành viên mới đủ điều kiện vào bài thi cá nhân của Vòng 1 và được xếp hạng theo điểm trung bình đội.",
    },
  },
];

export const roundItems: RoundItem[] = [
  {
    id: "01",
    label: { en: "Round 01", vi: "Vòng 01" },
    title: {
      en: "Individual Qualifier",
      vi: "Vòng loại cá nhân",
    },
    duration: {
      en: "40 objective questions + 2 essay questions online",
      vi: "40 câu trắc nghiệm + 2 câu tự luận trực tuyến",
    },
    description: {
      en: "Each eligible member receives a personalized paper with 40 objective questions drawn by topic, difficulty, and extra random selection, followed by 2 essay questions. The average score of the team is used for ranking, and the top 50 teams proceed to Round 2.",
      vi: "Mỗi thành viên đủ điều kiện sẽ nhận một đề thi cá nhân gồm 40 câu hỏi trắc nghiệm được rút theo chủ đề, độ khó và phần ngẫu nhiên bổ sung, sau đó là 2 câu tự luận. Điểm trung bình của đội được dùng để xếp hạng, và top 50 đội sẽ vào Vòng 2.",
    },
    deliverables: [
      {
        en: "40 objective questions",
        vi: "40 câu trắc nghiệm trên 6 chủ đề",
      },
      {
        en: "2 essay responses with 500-word limit each",
        vi: "2 câu tự luận, mỗi câu trả lời 300-500 từ",
      },
      {
        en: "Team average score ranking for Top 50",
        vi: "Xếp hạng theo điểm trung bình đội để chọn Top 50",
      },
    ],
  },
  {
    id: "02",
    label: { en: "Round 02", vi: "Vòng 02" },
    title: {
      en: "Project Report Review",
      vi: "Đánh giá dự án",
    },
    duration: {
      en: "judge-scored team report stage",
      vi: "giai đoạn nộp báo cáo đội được giám khảo chấm điểm",
    },
    description: {
      en: "Qualified teams submit a report for their project and receive judge scoring. The top 5 teams proceed to the final round, while the next 20 teams qualify for the Emerging round.",
      vi: "5 đội điểm cao nhất vào chung kết, 20 đội tiếp theo vào bảng Ươm mầm.",
    },
    deliverables: [
      {
        en: "Project report submission",
        vi: "Nộp báo cáo dự án theo quy định",
      },
      {
        en: "Judge scoring and feedback",
        vi: "Ban giám khảo chấm điểm",
      },
      {
        en: "Top 5 finalists + next 20 Emerging round qualifiers",
        vi: "Top 5 chung kết + 20 tiếp theo vào bảng Ươm mầm",
      },
    ],
  },
  {
    id: "03",
    label: { en: "Round 03", vi: "Vòng 03" },
    title: {
      en: "Final Report & Live Presentation",
      vi: "Thuyết trình chung kết",
    },
    duration: {
      en: "final report deadline + live presentation day",
      vi: "hạn nộp báo cáo cuối + ngày thuyết trình trực tiếp",
    },
    description: {
      en: "The final stage starts with the deadline for the updated finalist report and deck, then ends with the live presentation, judge Q&A, and the final award decision.",
      vi: "Giai đoạn chung kết bắt đầu bằng hạn nộp báo cáo và bộ slide cập nhật của đội vào chung kết, sau đó khép lại bằng phần thuyết trình trực tiếp, hỏi đáp cùng giám khảo và quyết định giải thưởng cuối cùng.",
    },
    deliverables: [
      {
        en: "Final report and pitch deck submission",
        vi: "Nộp báo cáo cuối cùng và slide thuyết trình",
      },
      {
        en: "Live finalist presentation and judge Q&A",
        vi: "Thuyết trình trực tiếp và hỏi đáp cùng giám khảo",
      },
      {
        en: "Final scoring and podium ranking",
        vi: "Chấm điểm cuối cùng và xếp hạng giải thưởng",
      },
    ],
  },
];

export const rewardItems: RewardItem[] = [
  {
    title: { en: "Champion", vi: "Quán quân" },
    amount: { en: "30,000,000 VND", vi: "30.000.000 VND" },
    note: {
      en: "Awarded to the team with the highest final-round score after presentation and judge Q&A.",
      vi: "Trao cho đội có điểm cao nhất ở vòng chung kết sau phần thuyết trình và hỏi đáp cùng giám khảo.",
    },
  },
  {
    title: { en: "Runner-up", vi: "Á quân" },
    amount: { en: "15,000,000 VND", vi: "15.000.000 VND" },
    note: {
      en: "Awarded to the team with the second-highest final-round score.",
      vi: "Trao cho đội có điểm cao thứ hai trong vòng chung kết.",
    },
  },
  {
    title: { en: "Third place", vi: "Giải ba" },
    amount: { en: "10,000,000 VND", vi: "10.000.000 VND" },
    note: {
      en: "Awarded to the team with the third-highest final-round score.",
      vi: "Trao cho đội có điểm cao thứ ba trong vòng chung kết.",
    },
  },
  {
    title: { en: "Emerging teams", vi: "Đội ươm mầm" },
    amount: { en: "Top 10 teams", vi: "Top 10 đội" },
    note: {
      en: "Teams ranked immediately after the top 5 in Round 2 qualify for the Emerging round; the best 10 after Emerging round scoring receive Emerging Team recognition.",
      vi: "Các đội xếp ngay sau top 5 của Vòng 2 sẽ nhận danh hiệu Đội ươm mầm.",
    },
  },
];

export const sponsorProfiles: SponsorProfile[] = [
  {
    name: "BlueFund Capital",
    logoSrc: "/sponsors/bluefund-logo.svg",
    tier: { en: "Strategic sponsor", vi: "Nhà tài trợ chiến lược" },
    category: { en: "Investment partner", vi: "Đối tác đầu tư" },
    description: {
      en: "Supports the champion award, founder office hours, and investor-facing coaching for the final teams.",
      vi: "Đồng hành cùng giải thưởng quán quân, các buổi office hours và huấn luyện theo góc nhìn nhà đầu tư cho các đội vào sâu.",
    },
    contribution: {
      en: "Supports prize positioning, visibility, and credibility.",
      vi: "Đồng hành ở mức độ giải thưởng, hình ảnh và độ tin cậy.",
    },
  },
  {
    name: "NextBank Lab",
    logoSrc: "/sponsors/nextbank-logo.svg",
    tier: { en: "Diamond sponsor", vi: "Nhà tài trợ kim cương" },
    category: { en: "Digital banking innovation", vi: "Đổi mới ngân hàng số" },
    description: {
      en: "Contributes challenge framing around consumer finance, digital onboarding, and regulated fintech experiences.",
      vi: "Đóng góp các góc đề bài xoay quanh tài chính cá nhân, onboarding số và các trải nghiệm fintech trong môi trường tuân thủ.",
    },
    contribution: {
      en: "Shapes challenge framing and industry context.",
      vi: "Định hình đề bài và bối cảnh trong ngành.",
    },
  },
  {
    name: "Quant Studio",
    logoSrc: "/sponsors/quantstudio-logo.svg",
    tier: { en: "Gold sponsor", vi: "Nhà tài trợ vàng" },
    category: { en: "Trading and analytics", vi: "Giao dịch và phân tích" },
    description: {
      en: "Provides market-data perspectives, evaluation logic, and analyst mentors for Round 1 and Round 2.",
      vi: "Đóng góp góc nhìn về dữ liệu thị trường, logic chấm điểm và đội ngũ mentor phân tích cho Vòng 1 và Vòng 2.",
    },
    contribution: {
      en: "Adds specialist knowledge and evaluation depth.",
      vi: "Bổ sung chuyên môn và chiều sâu đánh giá.",
    },
  },
  {
    name: "Finverse",
    logoSrc: "/sponsors/finverse-logo.svg",
    tier: { en: "Community sponsor", vi: "Nhà tài trợ cộng đồng" },
    category: { en: "Youth fintech ecosystem", vi: "Hệ sinh thái fintech trẻ" },
    description: {
      en: "Helps extend the competition reach through community activations, student promotion, and workshop support.",
      vi: "Hỗ trợ mở rộng độ phủ của cuộc thi thông qua các hoạt động cộng đồng, quảng bá đến sinh viên và hỗ trợ workshop.",
    },
    contribution: {
      en: "Expands reach through community and student channels.",
      vi: "Mở rộng độ phủ thông qua cộng đồng và kênh sinh viên.",
    },
  },
];

export const judgeProfiles: JudgeProfile[] = [
  {
    id: "judge-round3-nguyen-bao-chau",
    name: "Nguyen Bao Chau",
    imageSrc: "/judges/nguyen-bao-chau.svg",
    role: {
      en: "Chief product officer",
      vi: "Giám đốc sản phẩm",
    },
    organization: { en: "NextBank Lab", vi: "NextBank Lab" },
    bio: {
      en: "Focuses on product discovery, digital banking journeys, and feasibility for consumer-scale fintech ideas.",
      vi: "Tập trung vào product discovery, hành trình ngân hàng số và tính khả thi đối với các ý tưởng fintech hướng đến quy mô người dùng lớn.",
    },
    expertise: [
      { en: "Product strategy", vi: "Chiến lược sản phẩm" },
      { en: "User journeys", vi: "Hành trình người dùng" },
      { en: "Consumer finance", vi: "Tài chính cá nhân" },
    ],
    avatarTone: "from-sky-500 via-cyan-400 to-emerald-400",
    rounds: ["round-3"],
  },
  {
    id: "judge-round3-vo-gia-han",
    name: "Vo Gia Han",
    imageSrc: "/judges/nguyen-bao-chau.svg",
    role: {
      en: "Director of innovation strategy",
      vi: "Giám đốc chiến lược đổi mới",
    },
    organization: { en: "Finverse", vi: "Finverse" },
    bio: {
      en: "Assesses whether finalist teams can connect market insight, product direction, and execution discipline in a way that feels investment-ready.",
      vi: "Đánh giá khả năng các đội chung kết kết nối góc nhìn thị trường, định hướng sản phẩm và kỷ luật thực thi theo cách đủ thuyết phục với nhà đầu tư.",
    },
    expertise: [
      { en: "Innovation strategy", vi: "Chiến lược đổi mới" },
      { en: "Growth narrative", vi: "Câu chuyện tăng trưởng" },
      { en: "Venture readiness", vi: "Sẵn sàng gọi vốn" },
    ],
    avatarTone: "from-violet-500 via-blue-400 to-cyan-300",
    rounds: ["round-3"],
  },
  {
    id: "judge-round3-bui-thanh-son",
    name: "Bui Thanh Son",
    imageSrc: "/judges/le-quynh-nhu.svg",
    role: {
      en: "Executive chairman",
      vi: "Chủ tịch điều hành",
    },
    organization: { en: "BlueFund Capital", vi: "BlueFund Capital" },
    bio: {
      en: "Reviews the final-stage business case, strategic coherence, and how confidently teams defend assumptions under judge questioning.",
      vi: "Xem xét luận điểm kinh doanh ở chặng cuối, độ gắn kết chiến lược và cách đội thi bảo vệ giả định trước phần chất vấn của hội đồng.",
    },
    expertise: [
      { en: "Business strategy", vi: "Chiến lược kinh doanh" },
      { en: "Executive communication", vi: "Truyền đạt ở cấp điều hành" },
      { en: "Boardroom defense", vi: "Bảo vệ trước hội đồng" },
    ],
    avatarTone: "from-orange-500 via-rose-400 to-fuchsia-400",
    rounds: ["round-3"],
  },
  {
    id: "judge-round3-dang-ngoc-anh",
    name: "Đặng Ngọc Anh",
    imageSrc: "/judges/tran-hoang-minh.svg",
    role: {
      en: "Chief transformation officer",
      vi: "Giám đốc chuyển đổi",
    },
    organization: { en: "NextBank Lab", vi: "NextBank Lab" },
    bio: {
      en: "Focuses on whether the live presentation shows a realistic implementation path, scalable operations, and clear value creation for users.",
      vi: "Tập trung vào việc phần thuyết trình trực tiếp có thể hiện được lộ trình triển khai thực tế, vận hành có thể mở rộng và giá trị rõ ràng cho người dùng hay không.",
    },
    expertise: [
      { en: "Digital transformation", vi: "Chuyển đổi số" },
      { en: "Scale operations", vi: "Vận hành mở rộng" },
      { en: "Execution roadmap", vi: "Lộ trình thực thi" },
    ],
    avatarTone: "from-indigo-500 via-blue-400 to-cyan-300",
    rounds: ["round-3"],
  },
  {
    id: "judge-round2-tran-hoang-minh",
    name: "Tran Hoang Minh",
    imageSrc: "/judges/tran-hoang-minh.svg",
    role: {
      en: "Head of risk and compliance",
      vi: "Trưởng bộ phận rủi ro và tuân thủ",
    },
    organization: { en: "BlueFund Capital", vi: "BlueFund Capital" },
    bio: {
      en: "Advises on risk framing, compliance readiness, and how student teams can make ambitious ideas more credible.",
      vi: "Đồng hành về khung rủi ro, sự sẵn sàng tuân thủ và cách giúp các đội sinh viên biến ý tưởng tham vọng thành đề xuất đáng tin hơn.",
    },
    expertise: [
      { en: "Compliance", vi: "Tuân thủ" },
      { en: "Risk intelligence", vi: "Trí tuệ rủi ro" },
      { en: "Investment readiness", vi: "Sẵn sàng đầu tư" },
    ],
    avatarTone: "from-indigo-500 via-blue-400 to-cyan-300",
    rounds: ["round-2"],
  },
  {
    id: "judge-round2-phan-thu-trang",
    name: "Phan Thu Trang",
    imageSrc: "/judges/pham-duc-long.svg",
    role: {
      en: "Senior investment manager",
      vi: "Quản lý đầu tư cấp cao",
    },
    organization: { en: "BlueFund Capital", vi: "BlueFund Capital" },
    bio: {
      en: "Examines how team reports frame market opportunity, financial logic, and the credibility of the proposed operating model.",
      vi: "Xem xét cách báo cáo của đội thi diễn giải cơ hội thị trường, logic tài chính và độ tin cậy của mô hình vận hành được đề xuất.",
    },
    expertise: [
      { en: "Investment screening", vi: "Sàng lọc đầu tư" },
      { en: "Financial logic", vi: "Logic tài chính" },
      { en: "Business models", vi: "Mô hình kinh doanh" },
    ],
    avatarTone: "from-emerald-500 via-teal-400 to-cyan-400",
    rounds: ["round-2"],
  },
  {
    id: "judge-round2-hoang-minh-quan",
    name: "Hoang Minh Quan",
    imageSrc: "/judges/nguyen-bao-chau.svg",
    role: {
      en: "Head of enterprise architecture",
      vi: "Trưởng bộ phận kiến trúc doanh nghiệp",
    },
    organization: { en: "NextBank Lab", vi: "NextBank Lab" },
    bio: {
      en: "Reviews system design clarity, product architecture choices, and whether the proposal can survive real-world institutional constraints.",
      vi: "Đánh giá độ rõ của thiết kế hệ thống, lựa chọn kiến trúc sản phẩm và khả năng đề xuất đứng vững trước các ràng buộc vận hành thực tế.",
    },
    expertise: [
      { en: "System architecture", vi: "Kiến trúc hệ thống" },
      { en: "Platform design", vi: "Thiết kế nền tảng" },
      { en: "Enterprise constraints", vi: "Ràng buộc doanh nghiệp" },
    ],
    avatarTone: "from-sky-500 via-cyan-400 to-emerald-400",
    rounds: ["round-2"],
  },
  {
    id: "judge-round2-le-thi-mai-anh",
    name: "Le Thi Mai Anh",
    imageSrc: "/judges/le-quynh-nhu.svg",
    role: {
      en: "Regulatory affairs advisor",
      vi: "Cố vấn pháp chế và quản trị",
    },
    organization: { en: "Finverse", vi: "Finverse" },
    bio: {
      en: "Looks closely at compliance assumptions, licensing logic, and the maturity of governance sections inside project reports.",
      vi: "Theo sát các giả định về tuân thủ, logic giấy phép và độ trưởng thành của phần quản trị trong hồ sơ dự án.",
    },
    expertise: [
      { en: "Regulatory framing", vi: "Khung pháp lý" },
      { en: "Governance", vi: "Quản trị" },
      { en: "Compliance review", vi: "Rà soát tuân thủ" },
    ],
    avatarTone: "from-orange-500 via-rose-400 to-fuchsia-400",
    rounds: ["round-2"],
  },
  {
    id: "judge-round2-truong-duc-huy",
    name: "Truong Duc Huy",
    imageSrc: "/judges/tran-hoang-minh.svg",
    role: {
      en: "Research and strategy lead",
      vi: "Trưởng nhóm nghiên cứu chiến lược",
    },
    organization: { en: "Quant Studio", vi: "Quant Studio" },
    bio: {
      en: "Evaluates the depth of analysis, report structure, and how convincingly teams translate evidence into a defendable project direction.",
      vi: "Đánh giá chiều sâu phân tích, cấu trúc báo cáo và mức độ thuyết phục khi đội thi chuyển hóa bằng chứng thành định hướng dự án có thể bảo vệ được.",
    },
    expertise: [
      { en: "Strategic analysis", vi: "Phân tích chiến lược" },
      { en: "Documentation quality", vi: "Chất lượng hồ sơ" },
      { en: "Evidence logic", vi: "Logic bằng chứng" },
    ],
    avatarTone: "from-indigo-500 via-blue-400 to-cyan-300",
    rounds: ["round-2"],
  },
  {
    id: "judge-round3-le-quynh-nhu",
    name: "Le Quynh Nhu",
    imageSrc: "/judges/le-quynh-nhu.svg",
    role: {
      en: "Managing partner",
      vi: "Đối tác điều hành",
    },
    organization: { en: "Finverse", vi: "Finverse" },
    bio: {
      en: "Works across startup ecosystems and judges teams on clarity of positioning, growth narrative, and founder-level execution.",
      vi: "Làm việc trong hệ sinh thái startup và đánh giá đội thi dựa trên độ rõ định vị, câu chuyện tăng trưởng và năng lực thực thi như một founder.",
    },
    expertise: [
      { en: "Go-to-market", vi: "Go-to-market" },
      { en: "Pitching", vi: "Pitching" },
      { en: "Growth logic", vi: "Logic tăng trưởng" },
    ],
    avatarTone: "from-orange-500 via-rose-400 to-fuchsia-400",
    rounds: ["round-3"],
  },
  {
    id: "judge-round1-pham-duc-long",
    name: "Pham Duc Long",
    imageSrc: "/judges/pham-duc-long.svg",
    role: {
      en: "Quant research lead",
      vi: "Trưởng nhóm nghiên cứu quant",
    },
    organization: { en: "Quant Studio", vi: "Quant Studio" },
    bio: {
      en: "Reviews market structure thinking, signal quality, and whether teams can turn analysis into disciplined decision-making.",
      vi: "Đánh giá tư duy cấu trúc thị trường, chất lượng tín hiệu và khả năng biến phân tích thành cách ra quyết định kỷ luật.",
    },
    expertise: [
      { en: "Quant systems", vi: "Hệ thống quant" },
      { en: "Analytics", vi: "Phân tích" },
      { en: "Signal design", vi: "Thiết kế tín hiệu" },
    ],
    avatarTone: "from-emerald-500 via-teal-400 to-cyan-400",
    rounds: ["round-1"],
  },
  {
    id: "judge-round1-nguyen-tuan-kiet",
    name: "Nguyen Tuan Kiet",
    imageSrc: "/judges/tran-hoang-minh.svg",
    role: {
      en: "Assessment design specialist",
      vi: "Chuyên gia thiết kế đánh giá",
    },
    organization: { en: "UEL Academic Office", vi: "Văn phòng học thuật UEL" },
    bio: {
      en: "Helps shape Round 1 rigor through question design, balance across topics, and consistency in how the first screen measures capability.",
      vi: "Góp phần tạo độ chặt chẽ cho Vòng 1 thông qua thiết kế câu hỏi, cân bằng chủ đề và sự nhất quán trong cách vòng đầu đo lường năng lực.",
    },
    expertise: [
      { en: "Question design", vi: "Thiết kế câu hỏi" },
      { en: "Assessment quality", vi: "Chất lượng đánh giá" },
      { en: "Academic rigor", vi: "Độ chặt chẽ học thuật" },
    ],
    avatarTone: "from-indigo-500 via-blue-400 to-cyan-300",
    rounds: ["round-1"],
  },
  {
    id: "judge-round1-tran-bao-ngan",
    name: "Tran Bao Ngan",
    imageSrc: "/judges/nguyen-bao-chau.svg",
    role: {
      en: "Data analytics lecturer",
      vi: "Giảng viên phân tích dữ liệu",
    },
    organization: { en: "University of Economics and Law", vi: "Trường Đại học Kinh tế - Luật" },
    bio: {
      en: "Reviews whether the early-round bank tests structured thinking, quantitative reading, and careful interpretation of financial information.",
      vi: "Đánh giá việc ngân hàng câu hỏi ở vòng đầu có kiểm tra được tư duy có cấu trúc, khả năng đọc định lượng và diễn giải cẩn trọng thông tin tài chính hay không.",
    },
    expertise: [
      { en: "Data reasoning", vi: "Lập luận dữ liệu" },
      { en: "Quantitative reading", vi: "Đọc hiểu định lượng" },
      { en: "Finance interpretation", vi: "Diễn giải tài chính" },
    ],
    avatarTone: "from-sky-500 via-cyan-400 to-emerald-400",
    rounds: ["round-1"],
  },
  {
    id: "judge-round1-pham-kha-vy",
    name: "Pham Kha Vy",
    imageSrc: "/judges/le-quynh-nhu.svg",
    role: {
      en: "Curriculum and testing advisor",
      vi: "Cố vấn chương trình và khảo thí",
    },
    organization: { en: "Finverse Learning Hub", vi: "Finverse Learning Hub" },
    bio: {
      en: "Supports Round 1 by checking clarity of wording, fairness between topics, and the practical relevance of the objective paper.",
      vi: "Hỗ trợ Vòng 1 bằng việc kiểm tra độ rõ câu chữ, tính công bằng giữa các chủ đề và mức độ gắn với thực tiễn của phần trắc nghiệm.",
    },
    expertise: [
      { en: "Testing fairness", vi: "Công bằng khảo thí" },
      { en: "Wording clarity", vi: "Độ rõ câu chữ" },
      { en: "Practical relevance", vi: "Tính thực tiễn" },
    ],
    avatarTone: "from-orange-500 via-rose-400 to-fuchsia-400",
    rounds: ["round-1"],
  },
  {
    id: "judge-round1-le-hoang-viet",
    name: "Le Hoang Viet",
    imageSrc: "/judges/pham-duc-long.svg",
    role: {
      en: "Financial modeling mentor",
      vi: "Cố vấn mô hình tài chính",
    },
    organization: { en: "Quant Studio", vi: "Quant Studio" },
    bio: {
      en: "Focuses on the analytical quality of the first-round question bank and whether it distinguishes disciplined thinking from guesswork.",
      vi: "Tập trung vào chất lượng phân tích của ngân hàng câu hỏi vòng đầu và việc đề thi có phân biệt được tư duy kỷ luật với trả lời cảm tính hay không.",
    },
    expertise: [
      { en: "Financial modeling", vi: "Mô hình tài chính" },
      { en: "Analytical rigor", vi: "Độ chặt chẽ phân tích" },
      { en: "Scoring calibration", vi: "Hiệu chỉnh chấm điểm" },
    ],
    avatarTone: "from-emerald-500 via-teal-400 to-cyan-400",
    rounds: ["round-1"],
  },
];

export const ruleItems: RuleItem[] = [
  {
    title: { en: "Single-team membership", vi: "Chỉ thuộc một đội" },
    description: {
      en: "A user can only be a member of one team at any moment. To join another team, they must leave the current one first.",
      vi: "Mỗi người dùng chỉ có thể là thành viên của một đội tại một thời điểm. Nếu muốn vào đội khác, họ phải rời đội hiện tại trước.",
    },
  },
  {
    title: { en: "Leader protection", vi: "Bảo toàn vai trò đội trưởng" },
    description: {
      en: "Each team must always have one leader. The leader cannot leave the team until leadership is transferred to another existing member.",
      vi: "Mỗi đội phải luôn có một đội trưởng. Đội trưởng không thể rời đội cho đến khi quyền lãnh đạo được chuyển cho một thành viên hiện hữu khác.",
    },
  },
  {
    title: { en: "Round 1 eligibility", vi: "Điều kiện vào Vòng 1" },
    description: {
      en: "Teams can be created by one student, but only teams with 3 to 5 members may enter Round 1. Every member, including the leader, takes an individual paper with 40 objective questions and 2 essay questions.",
      vi: "Đội có thể được tạo bởi một sinh viên, nhưng chỉ những đội có từ 3 đến 5 thành viên mới được vào Vòng 1. Mỗi thành viên, kể cả đội trưởng, đều làm một đề cá nhân gồm 40 câu trắc nghiệm và 2 câu tự luận.",
    },
  },
  {
    title: { en: "Stage progression", vi: "Cách đi tiếp qua từng vòng" },
    description: {
      en: "Round 1 ranks teams by the average score of their members and sends the top 50 teams to Round 2. Round 2 judge scoring sends the top 5 teams to the final and qualifies the next 20 teams for the Emerging round.",
      vi: "Vòng 1 xếp hạng đội theo điểm trung bình của các thành viên và đưa top 50 đội vào Vòng 2. Điểm chấm của giám khảo ở Vòng 2 sẽ đưa top 5 đội vào chung kết và ghi nhận 20 đội tiếp theo là Đội ươm mầm.",
    },
  },
];

export const timelineItems: TimelineItem[] = [
  {
    id: "registration-opens",
    phase: "general",
    startDate: "2026-04-06",
    endDate: "2026-05-10",
    title: { en: "Registration opens", vi: "Mở đăng ký" },
    description: {
      en: "Profiles go live, teams start forming, and the bilingual news feed launches.",
      vi: "Hồ sơ mở cửa, các đội bắt đầu hình thành và bảng tin song ngữ đi vào hoạt động.",
    },
    location: {
      en: "Online registration portal",
      vi: "Cổng đăng ký trực tuyến",
    },
    method: {
      en: "Open online registration and self-service onboarding",
      vi: "Mở cổng đăng ký trực tuyến và tự phục vụ",
    },
    supportLinks: [
      { href: "/auth", label: { en: "Create account", vi: "Tạo tài khoản" } },
      { href: "/dashboard", label: { en: "Open workspace", vi: "Mở workspace" } },
    ],
  },
  {
    id: "info-session-team-clinic",
    phase: "general",
    startDate: "2026-04-18",
    endDate: "2026-04-18",
    title: { en: "Info session and team clinic", vi: "Workshop thông tin và phòng khám đội thi" },
    description: {
      en: "Organizers present the challenge framework and review common team formation questions.",
      vi: "Ban tổ chức giới thiệu cấu trúc đề bài và giải đáp các câu hỏi phổ biến về tạo đội.",
    },
    location: {
      en: "UEL Auditorium A and livestream",
      vi: "Hội trường A UEL và livestream",
    },
    method: {
      en: "Hybrid briefing, Q&A, and team-building clinic",
      vi: "Buổi định hướng hybrid, hỏi đáp và clinic ghép đội",
    },
    supportLinks: [
      { href: "/competition/faq", label: { en: "View FAQ", vi: "Xem FAQ" } },
      { href: "/news", label: { en: "Read updates", vi: "Đọc cập nhật" } },
    ],
  },
  {
    id: "registration-deadline-team-lock",
    phase: "general",
    startDate: "2026-05-10",
    endDate: "2026-05-10",
    title: { en: "Registration and team lock", vi: "Đăng ký và chốt đội" },
    description: {
      en: "Teams must complete the minimum 3-member requirement before this checkpoint to unlock Round 1 eligibility.",
      vi: "Các đội phải đạt mức tối thiểu 3 thành viên trước mốc này để mở điều kiện vào Vòng 1.",
    },
    location: {
      en: "Online team workspace",
      vi: "Đội thi trực tuyến",
    },
    method: {
      en: "Roster freeze and team lock confirmation on platform",
      vi: "Khóa danh sách đội và xác nhận chốt đội trên nền tảng",
    },
    supportLinks: [
      { href: "/auth", label: { en: "Create account", vi: "Tạo tài khoản" } },
      { href: "/dashboard", label: { en: "Finalize team", vi: "Hoàn thiện đội" } },
      { href: "/rules#general-rules", label: { en: "Check eligibility", vi: "Kiểm tra điều kiện" } },
    ],
  },
  {
    id: "round-1-individual-qualifier",
    phase: "round-1",
    startDate: round1Window.startDate,
    endDate: round1Window.endDate,
    title: { en: "Round 01 individual qualifier", vi: "Vòng 01 bài thi cá nhân" },
    description: {
      en: "Eligible members complete an online paper with 40 objective questions and 2 essay questions at the end.",
      vi: "Các thành viên đủ điều kiện hoàn thành một bài thi trực tuyến gồm 40 câu trắc nghiệm và 2 câu tự luận ở cuối đề.",
    },
    location: {
      en: "Official Attacker Round 1 exam portal",
      vi: "Cổng thi chính thức Vòng 1 của Attacker",
    },
    method: {
      en: "Timed online exam with individual login and one official attempt",
      vi: "Bài thi trực tuyến có giới hạn thời gian, đăng nhập cá nhân và chỉ một lượt làm chính thức",
    },
    supportLinks: [
      { href: "/round-1", label: { en: "Open Round 1 exam", vi: "Mở bài thi Vòng 1" } },
      { href: "/dashboard", label: { en: "Review team status", vi: "Xem trạng thái đội" } },
    ],
  },
  {
    id: "round-1-top-50-announcement",
    phase: "round-1",
    startDate: "2026-05-24",
    endDate: "2026-05-24",
    title: { en: "Top 50 teams announced", vi: "Công bố top 50 đội" },
    description: {
      en: "Round 1 closes and the top 50 teams by average member score move to Round 2.",
      vi: "Vòng 1 kết thúc và top 50 đội theo điểm trung bình thành viên sẽ vào Vòng 2.",
    },
    location: {
      en: "Newsroom and official Facebook page",
      vi: "Newsroom và fanpage chính thức",
    },
    method: {
      en: "Public result release with team ranking and qualification notice",
      vi: "Công bố kết quả tại website cuộc thi.",
    },
    supportLinks: [
      { href: "/competition/round-1-results", label: { en: "Check announcements", vi: "Xem thông báo" } },
    ],
  },
  {
    id: "round-2-report-submission",
    phase: "round-2",
    startDate: round2Window.startDate,
    endDate: round2Window.endDate,
    title: { en: "Round 02 report submission", vi: "Vòng 02 nộp báo cáo" },
    description: {
      en: "Qualified teams submit the project report for judge scoring and evaluation.",
      vi: "Các đội đủ điều kiện nộp báo cáo dự án để được giám khảo chấm điểm và đánh giá.",
    },
    location: {
      en: "Team workspace submission center",
      vi: "Trung tâm nộp bài trong Đội thi",
    },
    method: {
      en: "Team leader uploads versioned report files through the submission center",
      vi: "Đội trưởng đại diện đội thi nộp bài.",
    },
    supportLinks: [
      { href: "/dashboard", label: { en: "Submit Round 2 file", vi: "Nộp file Vòng 2" } },
      { href: "/competition/judges", label: { en: "Meet the judges", vi: "Xem giám khảo" } },
    ],
  },
  {
    id: "round-2-top-5-announcement",
    phase: "round-2",
    startDate: "2026-06-20",
    endDate: "2026-06-20",
    title: { en: "Round 02 results", vi: "Kết quả Vòng 02" },
    description: {
      en: "The top 5 teams advance to the final round and the next 20 teams qualify for the Emerging round.",
      vi: "Top 5 đội vào chung kết và 20 đội tiếp theo vào Vòng Đội ươm mầm.",
    },
    location: {
      en: "Newsroom, email, and official social channels",
      vi: "Newsroom, email và các kênh mạng xã hội chính thức",
    },
    method: {
      en: "Judge result release with finalist shortlist and Emerging round qualifier list",
      vi: "Công bố kết quả giám khảo với danh sách chung kết và danh sách vào Vòng Đội ươm mầm",
    },
    supportLinks: [
      { href: "/news", label: { en: "Read result update", vi: "Đọc cập nhật kết quả" } },
      { href: "/competition", label: { en: "Review finals format", vi: "Xem thể thức chung kết" } },
    ],
  },
  {
    id: "round-3-final-report-submission",
    phase: "round-3",
    startDate: round3FinalReportWindow.startDate,
    endDate: round3FinalReportWindow.endDate,
    title: { en: "Final and Emerging round report deadline", vi: "Hạn nộp báo cáo chung kết và Vòng Đội ươm mầm" },
    description: {
      en: "The Top 5 finalist teams submit final reports, while the 20 Emerging round qualifiers submit their updated Emerging round reports for rescoring.",
      vi: "Top 5 đội chung kết nộp báo cáo chung kết, còn 20 đội vào Vòng Đội ươm mầm nộp báo cáo cập nhật để được chấm lại.",
    },
    location: {
      en: "Team workspace submission center",
      vi: "Trung tâm nộp bài trong Đội thi",
    },
    method: {
      en: "Team leader uploads the final or Emerging round report before the submission deadline",
      vi: "Đội trưởng đại diện đội thi nộp bài.",
    },
    supportLinks: [
      { href: "/dashboard", label: { en: "Submit final/Emerging report", vi: "Nộp báo cáo chung kết/Đội ươm mầm" } },
      { href: "/competition/judges", label: { en: "See judging panel", vi: "Xem hội đồng giám khảo" } },
    ],
  },
  {
    id: "round-3-final-presentation",
    phase: "round-3",
    startDate: round3PresentationWindow.startDate,
    endDate: round3PresentationWindow.endDate,
    title: { en: "Final presentation and awards", vi: "Thuyết trình chung kết và trao giải" },
    description: {
      en: "Finalists present live, answer judge questions, and receive the final ranking announcement on stage.",
      vi: "Các đội chung kết thuyết trình trực tiếp, trả lời câu hỏi của giám khảo và nhận công bố xếp hạng cuối cùng tại sân khấu.",
    },
    location: {
      en: "Rex Hotel Saigon, 141 Nguyen Hue, Sai Gon Ward, Ho Chi Minh City",
      vi: "Rex Hotel Saigon, 141 Nguyễn Huệ, Phường Sài Gòn, Tp. Hồ Chí Minh",
    },
    method: {
      en: "On-site presentation, judge Q&A, and final award announcement",
      vi: "Thuyết trình trực tiếp, hỏi đáp cùng giám khảo và công bố giải thưởng chung cuộc",
    },
    supportLinks: [
      { href: "/competition/judges", label: { en: "See judging panel", vi: "Xem hội đồng giám khảo" } },
    ],
  },
];

export const faqItems: FAQItem[] = [
  {
    topicId: "round-1-scoring",
    question: {
      en: "Who is allowed to take the Round 1 test?",
      vi: "Ai được phép vào bài thi Vòng 1?",
    },
    answer: {
      en: "Only users who are already a member or leader of a team with at least 3 members can take the Round 1 individual qualifier.",
      vi: "Chỉ những người đã là thành viên hoặc đội trưởng của một đội có ít nhất 3 thành viên mới được vào bài thi cá nhân của Vòng 1.",
    },
  },
  {
    topicId: "round-1-scoring",
    question: {
      en: "How is Round 1 scored if the test is individual?",
      vi: "Vòng 1 được chấm điểm thế nào nếu bài thi là cá nhân?",
    },
    answer: {
      en: "Each eligible member completes the paper individually, but the competition uses the average score of the team to rank and select the top 50 teams for Round 2.",
      vi: "Mỗi thành viên đủ điều kiện làm bài theo hình thức cá nhân, nhưng cuộc thi sử dụng điểm trung bình của đội để xếp hạng và chọn top 50 đội vào Vòng 2.",
    },
  },
  {
    topicId: "progression-results",
    question: {
      en: "What happens after Round 2 judge scoring?",
      vi: "Sau khi Vòng 2 được giám khảo chấm điểm thì sao?",
    },
    answer: {
      en: "The top 5 teams move to the final round. The next 20 teams qualify for the Emerging round.",
      vi: "Top 5 đội sẽ vào vòng chung kết. 20 đội tiếp theo được ghi nhận là Đội ươm mầm.",
    },
  },
  {
    topicId: "registration-team",
    question: {
      en: "Can a student accept an invitation while already in another team?",
      vi: "Sinh viên đang ở đội khác có thể chấp nhận lời mời hay không?",
    },
    answer: {
      en: "No. They must leave the current team first. The workspace surfaces this restriction before acceptance.",
      vi: "Không. Họ phải rời đội hiện tại trước. Khu vực quản lý đội sẽ hiện rõ ràng ràng buộc này trước khi chấp nhận.",
    },
  },
  {
    topicId: "registration-team",
    question: {
      en: "Can the leader leave the team?",
      vi: "Đội trưởng có thể rời đội không?",
    },
    answer: {
      en: "Only after transferring leadership to another current member. The prototype enforces this as a rule, not a note.",
      vi: "Chỉ sau khi chuyển quyền đội trưởng cho một thành viên hiện hữu khác. Bản mẫu này thực thi đây là quy tắc, không chỉ là ghi chú.",
    },
  },
];

export const testimonialItems: TestimonialItem[] = homepageTestimonialsSeed;

function cloneDefaultPageContent() {
  return JSON.parse(JSON.stringify(defaultPageContent)) as SitePageContent;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function mergeJsonShape<T>(defaults: T, input: unknown): T {
  if (Array.isArray(defaults)) {
    if (!Array.isArray(input)) {
      return defaults as T;
    }

    if (defaults.length === 0) {
      return input as T;
    }

    return input.map((item, index) => {
      const fallbackIndex = Math.min(index, defaults.length - 1);
      return mergeJsonShape(defaults[fallbackIndex], item);
    }) as T;
  }

  if (isPlainObject(defaults)) {
    const source = isPlainObject(input) ? input : {};
    const next: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(defaults)) {
      next[key] = mergeJsonShape(value, source[key]);
    }

    return next as T;
  }

  if (input === undefined || input === null) {
    return defaults;
  }

  return input as T;
}

function isLegacyOrganizerAddress(value: string) {
  const normalizedValue = value.trim().toLocaleLowerCase("vi-VN");
  return (
    normalizedValue.includes("quốc lộ 1a") ||
    normalizedValue.includes("quoc lo 1a") ||
    normalizedValue.includes("khu phố 3") ||
    normalizedValue.includes("khu pho 3") ||
    normalizedValue.includes("tp. thủ đức") ||
    normalizedValue.includes("tp. thu duc")
  );
}

const legacyVietnameseRulesCopyReplacements: Record<string, string> = {
  "10 Đội tiềm năng": "20 đội lọt vào bảng Tiềm năng",
  "10 đội tiềm năng": "20 đội lọt vào bảng Tiềm năng",
  "10 đội vào Vòng Đội ươm mầm": "20 đội lọt vào bảng Tiềm năng",
  "10 đội vào Vòng Đội Ươm mầm": "20 đội lọt vào bảng Tiềm năng",
  "20 đội vào Vòng Đội ươm mầm": "20 đội lọt vào bảng Tiềm năng",
  "20 đội vào Vòng Đội Ươm mầm": "20 đội lọt vào bảng Tiềm năng",
  "Mười đội dưới đây được ghi nhận là Đội tiềm năng. Phần này cũng chỉ là danh sách liệt kê, không mang ý nghĩa xếp hạng.":
    "Danh sách chỉ mang tính liệt kê, không mang ý nghĩa xếp hạng.",
  "Mười đội dưới đây được ghi nhận là Đội ươm mầm. Phần này cũng chỉ là danh sách liệt kê, không mang ý nghĩa xếp hạng.":
    "Danh sách chỉ mang tính liệt kê, không mang ý nghĩa xếp hạng.",
  "Hai mươi đội dưới đây vào Vòng Đội ươm mầm và cần nộp báo cáo cập nhật để được chấm lại. Danh hiệu Đội ươm mầm chính thức sẽ được trao cho 10 đội tốt nhất sau khi chấm Vòng Đội ươm mầm.":
    "Danh sách chỉ mang tính liệt kê, không mang ý nghĩa xếp hạng.",
  "Đội vào thuyết trình": "Đội vào chung kết",
  "Năm đội dưới đây là danh sách đội vào chung kết. Phần này chỉ mang tính liệt kê, không thể hiện thứ hạng.":
    "Danh sách chỉ mang tính liệt kê, không mang ý nghĩa xếp hạng.",
  "Top 5 đội vào chung kết": "5 đội vào chung kết",
  "Ghi nhận nổi bật": "Bảng ươm mầm",
  "Nhánh thi": "Bảng ươm mầm",
  "Vào Vòng Đội ươm mầm": "Bảng ươm mầm",
  "Đầu việc": "Lưu ý",
  "Quy định riêng của vòng": "Quy định vòng thi",
  "2 bài tự luận, mỗi bài tối đa 200 từ": "2 câu tự luận, mỗi câu trả lời 300-500 từ",
  "2 bài tự luận, mỗi bài tối đa 500 từ": "2 câu tự luận, mỗi câu trả lời 300-500 từ",
  "36 câu trắc nghiệm trên 6 chủ đề": "40 câu trắc nghiệm trên 6 chủ đề",
  "40 câu trắc nghiệm": "40 câu trắc nghiệm trên 6 chủ đề",
  "Điểm phần trắc nghiệm có trước, còn điểm tự luận vẫn ở trạng thái chờ cho đến khi admin hoặc moderator chấm xong.":
    "Điểm trắc nghiệm được chấm tự động, điểm tự luận sẽ được công bố sau khi có kết quả từ Ban giám khảo.",
  "Vòng 2 là giai đoạn chấm báo cáo với cơ chế nộp tệp theo phiên bản.": "Các đội thi nộp báo cáo mô tả dự án.",
  "Các đội đủ điều kiện nộp báo cáo cho dự án của mình và nhận điểm từ giám khảo. Top 5 đội sẽ vào chung kết, trong khi 10 đội tiếp theo được ghi nhận là Đội tiềm năng.":
    "5 đội điểm cao nhất vào chung kết, 20 đội tiếp theo vào bảng Ươm mầm.",
  "Các đội đủ điều kiện nộp báo cáo cho dự án của mình và nhận điểm từ giám khảo. Top 5 đội sẽ vào chung kết, trong khi 20 đội tiếp theo được ghi nhận là Đội ươm mầm.":
    "5 đội điểm cao nhất vào chung kết, 20 đội tiếp theo vào bảng Ươm mầm.",
  "Top 5 chung kết + 10 Đội tiềm năng tiếp theo": "Top 5 chung kết + 20 tiếp theo vào bảng Ươm mầm",
  "Top 5 chung kết + 20 đội vào Vòng Đội ươm mầm": "Top 5 chung kết + 20 tiếp theo vào bảng Ươm mầm",
  "Mỗi thành viên làm một đề có giới hạn thời gian gồm 36 câu trắc nghiệm và 2 câu tự luận.":
    "Mỗi thành viên làm bài vòng 1 gồm 40 câu trắc nghiệm và 2 câu tự luận.",
  "Mỗi thành viên làm một đề có giới hạn thời gian gồm 40 câu trắc nghiệm và 2 câu tự luận.":
    "Mỗi thành viên làm bài vòng 1 gồm 40 câu trắc nghiệm và 2 câu tự luận.",
  "Báo cáo dự án": "Nộp báo cáo dự án theo quy định",
  "Điểm và nhận xét từ giám khảo": "Ban giám khảo chấm điểm",
  "Đội trưởng nộp tệp báo cáo chính thức, còn các phiên bản trước vẫn được lưu để theo dõi.":
    "Báo cáo vòng 2 được nộp bởi đội trưởng.",
  "Điểm chấm của giám khảo chọn top 5 đội vào chung kết và ghi nhận 10 đội tiếp theo là Đội tiềm năng.":
    "Bài thi vòng 2 của mỗi đội được chấm bởi 02 giám khảo theo phân bổ của Ban tổ chức.",
  "Điểm chấm của giám khảo chọn top 5 đội vào chung kết và ghi nhận 20 đội tiếp theo là Đội ươm mầm.":
    "Bài thi vòng 2 của mỗi đội được chấm bởi 02 giám khảo theo phân bổ của Ban tổ chức.",
  "Điểm chấm của giám khảo chọn top 5 đội vào chung kết và đưa 20 đội tiếp theo vào Vòng Đội ươm mầm.":
    "Bài thi vòng 2 của mỗi đội được chấm bởi 02 giám khảo theo phân bổ của Ban tổ chức.",
  "Hạn nộp báo cáo chung kết kết thúc trước ngày trình bày, vì vậy đội nên chốt bộ tài liệu và slide đủ sớm để còn thời gian tập dượt.":
    "5 đội thi chung kết cần nộp slide trình bày qua email cho Ban tổ chức, hoặc liên hệ Ban tổ chức để được hỗ trợ.",
  "Thông tin hậu cần, thứ tự trình bày và hướng dẫn check-in của vòng chung kết cần được xem kỹ sau hạn nộp báo cáo và trước ngày bảo vệ.":
    "Thứ tự trình bày tại chung kết được bốc thăm bởi đại diện các đội thi chung kết.",
  "Các đội chung kết phải nộp báo cáo hoàn chỉnh và bộ slide thuyết trình trước khi hạn nộp báo cáo chung kết khép lại.":
    "Các đội thi chung kết cần nộp lại báo cáo cuối cùng cho Ban tổ chức.",
  "Sau hạn nộp báo cáo, các đội chuyển sang giai đoạn thuyết trình trực tiếp và hỏi đáp cùng giám khảo trong ngày chung kết.":
    "20 đội thi bảng Ươm mầm chỉnh sửa báo cáo và nộp lại cho Ban tổ chức. 10 đội đạt giải Ươm mầm được công bố theo lịch trình của Ban tổ chức.",
};

function applyLegacyVietnameseRulesCopyReplacements<T>(value: T): T {
  if (typeof value === "string") {
    return (legacyVietnameseRulesCopyReplacements[value] ?? value) as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => applyLegacyVietnameseRulesCopyReplacements(item)) as T;
  }

  if (isPlainObject(value)) {
    const next: Record<string, unknown> = {};

    for (const [key, entry] of Object.entries(value)) {
      next[key] = applyLegacyVietnameseRulesCopyReplacements(entry);
    }

    return next as T;
  }

  return value;
}

export function mergePageContentWithDefaults(
  content?: Partial<SitePageContent> | null,
): SitePageContent {
  const nextContent = applyLegacyVietnameseRulesCopyReplacements(mergeJsonShape(cloneDefaultPageContent(), content));

  if (
    isLegacyOrganizerAddress(nextContent.contact.organizerAddress.en) ||
    isLegacyOrganizerAddress(nextContent.contact.organizerAddress.vi)
  ) {
    nextContent.contact.organizerAddress = contactLocation.address;
  }

  return nextContent;
}

export const featurePages = [
  {
    href: "/competition",
    title: {
      en: "Competition page",
      vi: "Trang cuộc thi",
    },
    description: {
      en: "Rounds, rewards, eligibility, judges, and strategic narrative.",
      vi: "Vòng thi, giải thưởng, điều kiện, hội đồng giám khảo và câu chuyện chiến lược.",
    },
  },
  {
    href: "/rules",
    title: {
      en: "Rules and timeline",
      vi: "Thể lệ và lịch trình",
    },
    description: {
      en: "Everything participants need before they register or switch teams.",
      vi: "Tất cả thông tin cần thiết trước khi đăng ký hoặc thay đổi đội thi.",
    },
  },
  {
    href: "/news",
    title: {
      en: "Newsroom",
      vi: "Newsroom",
    },
    description: {
      en: "Editorial feed with category filtering and article detail pages.",
      vi: "Bảng tin dạng biên tập có bộ lọc chủ đề và trang chi tiết bài viết.",
    },
  },
  {
    href: "/dashboard",
    title: {
      en: "Team workspace",
      vi: "Đội thi",
    },
    description: {
      en: "Mocked account and team logic enforcing one-team-at-a-time membership.",
      vi: "Mô phỏng tài khoản và đội thi có thực thi quy tắc mỗi người chỉ thuộc một đội tại một thời điểm.",
    },
  },
];

export const newsPosts: NewsPost[] = [
  {
    slug: "attacker-2026-launch",
    category: { en: "Launch", vi: "Khởi động" },
    title: {
      en: "Attacker 2026 launches with a sharper fintech product focus",
      vi: "Attacker 2026 khởi động với trọng tâm rõ hơn vào sản phẩm fintech",
    },
    excerpt: {
      en: "This season reframes the competition around product clarity, market reasoning, and execution quality instead of isolated technical tasks.",
      vi: "Mùa này định vị lại cuộc thi xoay quanh độ rõ của sản phẩm, lập luận theo thị trường và chất lượng thực thi thay vì các bài tập kỹ thuật riêng lẻ.",
    },
    author: "Organizer desk",
    publishedAt: "2026-03-25",
    readTime: "4 min",
    coverLabel: {
      en: "Launch story",
      vi: "Câu chuyện khởi động",
    },
    coverImageSrc: "/theme-hero-1.jpg",
    coverImageAlt: {
      en: "Attacker 2026 launch visual",
      vi: "Hình ảnh khởi động Attacker 2026",
    },
    highlights: [
      {
        en: "Bilingual platform from the first release",
        vi: "Nền tảng song ngữ ngay từ phiên bản đầu",
      },
      {
        en: "Team management rules now modeled in product UX",
        vi: "Quy tắc quản lý đội được mô hình hóa ngay trong UX",
      },
      {
        en: "Editorial news layout replaces announcement-only pages",
        vi: "Bố cục newsroom thay cho kiểu dạng thông báo đơn thuần",
      },
    ],
    content: [
      {
        type: "paragraph",
        body: {
          en: "Attacker 2026 is positioned as a fintech competition website that can stand beside international student challenge platforms. The visual system is cleaner, more editorial, and more strategic.",
          vi: "Attacker 2026 được định vị như một website cuộc thi fintech có thể đặt cạnh với các nền tảng thi đấu sinh viên quốc tế. Hệ thống hình ảnh sạch hơn, mang tính biên tập hơn và có chiều sâu chiến lược hơn.",
        },
      },
      {
        type: "image",
        src: "/theme-hero-1.jpg",
        alt: {
          en: "Attacker 2026 launch visual direction",
          vi: "Hình ảnh định hướng khởi động của Attacker 2026",
        },
        caption: {
          en: "Sample campaign visual for the launch-phase editorial story.",
          vi: "Hình ảnh mẫu cho câu chuyện biên tập ở giai đoạn khởi động.",
        },
        emphasis: "feature",
      },
      {
        type: "paragraph",
        body: {
          en: "The homepage now frames the competition through capabilities: market logic, innovation, venture execution, and bilingual accessibility. That makes the site useful for students, mentors, sponsors, and the organizing team at the same time.",
          vi: "Trang chủ mới trình bày cuộc thi thông qua các năng lực cốt lõi: lập luận thị trường, đổi mới, năng lực thực thi và khả năng tiếp cận song ngữ. Điều đó giúp website hữu ích đồng thời cho sinh viên, mentor, nhà tài trợ và ban tổ chức.",
        },
      },
      {
        type: "paragraph",
        body: {
          en: "Instead of treating team formation as an off-platform workaround, the frontend prototype already supports create-team, invite-member, transfer-leadership, and leave-team constraints.",
          vi: "Thay vì xem việc tạo đội là một bước xử lý bên ngoài nền tảng, bản frontend mẫu đã hỗ trợ tạo đội, mời thành viên, chuyển đội trưởng và các ràng buộc rời đội.",
        },
      },
    ],
    tags: ["launch", "platform", "design"],
  },
  {
    slug: "team-formation-clinic",
    category: { en: "Teams", vi: "Đội thi" },
    title: {
      en: "Team formation clinic will help students build stronger cross-skill squads",
      vi: "Chuỗi team formation clinic sẽ giúp sinh viên tạo đội đa kỹ năng hơn",
    },
    excerpt: {
      en: "The proposed workshop format guides students on how to combine coding, finance, product, and pitching talent into one competition-ready team.",
      vi: "Định dạng workshop được đề xuất sẽ giúp sinh viên kết hợp kỹ năng lập trình, tài chính, sản phẩm và thuyết trình thành một đội thi sẵn sàng.",
    },
    author: "Programs team",
    publishedAt: "2026-03-21",
    readTime: "3 min",
    coverLabel: {
      en: "Community build-up",
      vi: "Xây dựng cộng đồng",
    },
    coverImageSrc: "/theme-hero-2.jpg",
    coverImageAlt: {
      en: "Students building teams together",
      vi: "Sinh viên xây dựng đội thi cùng nhau",
    },
    highlights: [
      {
        en: "Students can create a team solo and recruit later",
        vi: "Sinh viên có thể tạo đội trước rồi tiếp tục tuyển thành viên",
      },
      {
        en: "Eligibility becomes active only from 3 members onward",
        vi: "Điều kiện dự thi chỉ có hiệu lực từ 3 thành viên trở lên",
      },
      {
        en: "Leadership transfer is supported to prevent dead-end teams",
        vi: "Hỗ trợ chuyển đội trưởng để tránh tình trạng đội bị tắc",
      },
    ],
    content: [
      {
        type: "paragraph",
        body: {
          en: "One of the clearest lessons from recent competition cycles is that strong teams rarely come from one discipline alone. The clinic concept encourages balanced squads with finance, data, product, and storytelling capability.",
          vi: "Một bài học rõ ràng từ các mùa thi gần đây là đội mạnh hiếm khi chỉ đến từ một chuyên môn. Mô hình clinic khuyến khích các đội cân bằng giữa tài chính, dữ liệu, sản phẩm và kể chuyện.",
        },
      },
      {
        type: "image",
        src: "/hero-collab.svg",
        alt: {
          en: "Students collaborating during team formation",
          vi: "Sinh viên hợp tác trong quá trình tạo đội",
        },
        caption: {
          en: "Sample illustration for workshops, team clinics, and cross-skill collaboration.",
          vi: "Minh họa mẫu cho workshop, clinic tạo đội và sự hợp tác đa kỹ năng.",
        },
      },
      {
        type: "paragraph",
        body: {
          en: "The frontend prototype reflects that logic by allowing invitations and visible role distribution before the backend exists.",
          vi: "Bản frontend mẫu đã phản ánh logic đó bằng cách cho phép mời thành viên và hiển thị phân bổ vai trò ngay cả khi chưa có backend.",
        },
      },
      {
        type: "paragraph",
        body: {
          en: "This creates a better review loop for your team before database and authentication work begin.",
          vi: "Điều này tạo ra một vòng review tốt hơn cho đội ngũ của bạn trước khi bắt đầu xây dựng cơ sở dữ liệu và hệ thống xác thực.",
        },
      },
    ],
    tags: ["teams", "workshop", "eligibility"],
  },
  {
    slug: "mentor-network-preview",
    category: { en: "Mentors", vi: "Mentor" },
    title: {
      en: "Mentor network preview focuses on quant, product, and venture readiness",
      vi: "Mạng lưới mentor dự kiến tập trung vào quant, sản phẩm và sự sẵn sàng cho đầu tư",
    },
    excerpt: {
      en: "The new organizer view is designed to highlight expertise lanes clearly, making it easier to introduce judges, mentors, and partner organizations later.",
      vi: "Góc nhìn mới cho ban tổ chức được thiết kế để làm rõ các nhóm chuyên môn, giúp giới thiệu giám khảo, mentor và đối tác dễ dàng hơn về sau.",
    },
    author: "Partnerships team",
    publishedAt: "2026-03-17",
    readTime: "5 min",
    coverLabel: {
      en: "Mentor lanes",
      vi: "Hướng mentor",
    },
    coverImageSrc: "/theme-feature-2.jpg",
    coverImageAlt: {
      en: "Mentor and judge ecosystem",
      vi: "Hệ sinh thái mentor và giám khảo",
    },
    highlights: [
      {
        en: "Quant and trading expertise",
        vi: "Chuyên môn quant và giao dịch",
      },
      {
        en: "Fintech product and regulation insight",
        vi: "Góc nhìn sản phẩm fintech và quy định",
      },
      {
        en: "Investor-style feedback for final round teams",
        vi: "Phản hồi theo góc nhìn nhà đầu tư cho đội vào chung kết",
      },
    ],
    content: [
      {
        type: "paragraph",
        body: {
          en: "Mentors should not appear as an afterthought. The site concept reserves space for expertise-led profiles, challenge themes, and availability windows.",
          vi: "Mentor không nên xuất hiện như một phần phụ. Concept website dành sẵn không gian cho hồ sơ chuyên môn, chủ đề hỗ trợ và khung thời gian đồng hành.",
        },
      },
      {
        type: "image",
        src: "/theme-feature-2.jpg",
        alt: {
          en: "Mentor and judge ecosystem visual",
          vi: "Hình ảnh hệ sinh thái mentor và giám khảo",
        },
        caption: {
          en: "Sample visual for expertise-led judging, mentorship, and evaluation credibility.",
          vi: "Hình mẫu cho cấu trúc giám khảo, mentor và độ tin cậy trong đánh giá.",
        },
      },
      {
        type: "paragraph",
        body: {
          en: "This is especially useful in fintech, where credibility depends on the range of market, product, and compliance perspectives present in the competition.",
          vi: "Điều này đặc biệt hữu ích trong fintech, nơi độ uy tín của cuộc thi phụ thuộc vào mức độ đa dạng về góc nhìn thị trường, sản phẩm và tuân thủ.",
        },
      },
      {
        type: "paragraph",
        body: {
          en: "The organizer dashboard included in this prototype is already shaped to present that information when real names are ready.",
          vi: "Bảng điều khiển cho ban tổ chức trong bản mẫu này đã được định hình để hiển thị thông tin đó khi danh sách thực tế sẵn sàng.",
        },
      },
    ],
    tags: ["mentors", "jury", "partners"],
  },
  {
    slug: "newsroom-system-preview",
    category: { en: "Platform", vi: "Nền tảng" },
    title: {
      en: "The new newsroom system is built to scale across bilingual updates",
      vi: "Hệ thống newsroom mới được xây để mở rộng cho các bản tin song ngữ",
    },
    excerpt: {
      en: "Instead of one long page of announcements, the content model now supports categories, article detail pages, and language switching with consistent layout.",
      vi: "Thay vì một trang dài chỉ gồm thông báo, mô hình nội dung mới hỗ trợ chuyên mục, trang chi tiết bài viết và chuyển ngôn ngữ với bố cục thống nhất.",
    },
    author: "Content team",
    publishedAt: "2026-03-13",
    readTime: "4 min",
    coverLabel: {
      en: "News architecture",
      vi: "Kiến trúc tin tức",
    },
    coverImageSrc: "/theme-feature-1.jpg",
    coverImageAlt: {
      en: "Newsroom content system visual",
      vi: "Hình ảnh hệ thống newsroom",
    },
    highlights: [
      {
        en: "Category filtering",
        vi: "Bộ lọc theo chuyên mục",
      },
      {
        en: "Searchable editorial cards",
        vi: "Thẻ tin có thể tìm kiếm",
      },
      {
        en: "Route-based article pages for sharing",
        vi: "Trang bài viết theo route để chia sẻ",
      },
    ],
    content: [
      {
        type: "paragraph",
        body: {
          en: "A competition site needs to handle launch messaging, deadline reminders, partner announcements, and round updates without feeling cluttered. That is why the newsroom is treated as a first-class page in this frontend.",
          vi: "Một website cuộc thi cần xử lý thông điệp khởi động, nhắc hạn, thông báo đối tác và cập nhật vòng thi mà không tạo cảm giác rối. Vì vậy newsroom được xem là một trang cốt lõi trong bản frontend này.",
        },
      },
      {
        type: "image",
        src: "/hero-dashboard.svg",
        alt: {
          en: "Newsroom and content system dashboard",
          vi: "Dashboard của hệ thống newsroom và nội dung",
        },
        caption: {
          en: "Sample interface visual showing how editorial content can scale into admin publishing later.",
          vi: "Hình mẫu thể hiện cách nội dung biên tập có thể mở rộng thành hệ thống đăng bài cho admin sau này.",
        },
      },
      {
        type: "paragraph",
        body: {
          en: "Each article can later be linked to admin publishing, image uploads, and SEO controls without changing the page structure again.",
          vi: "Mỗi bài viết sau này có thể kết nối với hệ thống đăng bài của admin, upload hình và điều khiển SEO mà không cần sửa lại cấu trúc trang.",
        },
      },
      {
        type: "paragraph",
        body: {
          en: "That keeps your next backend phase focused on data plumbing rather than redesign work.",
          vi: "Điều đó giúp giai đoạn backend tiếp theo tập trung vào dữ liệu và hệ thống thay vì phải thiết kế lại giao diện.",
        },
      },
    ],
    tags: ["news", "cms", "bilingual"],
  },
];

export const mockUsers: UserProfile[] = [
  {
    id: "u1",
    name: "Tam Phan Huy",
    email: "tam@example.com",
    role: "student",
    studentId: "K21407001",
    phoneNumber: "0909000001",
    university: "University of Economics and Law",
    major: "Fintech",
    classYear: "Năm 3",
    bio: "Sinh viên định hướng sản phẩm, quan tâm đến trí tuệ thị trường và các trải nghiệm tài chính số dễ tiếp cận.",
    avatarTone: "from-sky-500 via-cyan-400 to-emerald-400",
    providers: ["email", "google"],
  },
  {
    id: "u2",
    name: "Linh Nguyen",
    email: "linh@example.com",
    role: "student",
    studentId: "K20407012",
    phoneNumber: "0909000002",
    university: "Ho Chi Minh City University of Economics",
    major: "Business Analytics",
    classYear: "Năm 3",
    bio: "Sinh viên thiên về quant, đang xây các hệ thống hỗ trợ ra quyết định rõ ràng và có thể kiểm chứng.",
    avatarTone: "from-indigo-500 via-sky-400 to-cyan-300",
    providers: ["email", "google"],
  },
  {
    id: "u3",
    name: "Minh Tran",
    email: "minh@example.com",
    role: "student",
    studentId: "K20407021",
    phoneNumber: "0909000003",
    university: "Banking University of Ho Chi Minh City",
    major: "Data Science in Business",
    classYear: "Năm 3",
    bio: "Mạnh về dashboard, thử nghiệm dữ liệu và cách biến phân tích thành phần trình bày dễ hiểu.",
    avatarTone: "from-emerald-500 via-teal-400 to-cyan-400",
    providers: ["email"],
  },
  {
    id: "u4",
    name: "Huy Dang",
    email: "huy@example.com",
    role: "student",
    studentId: "K21408007",
    phoneNumber: "0909000004",
    university: "University of Information Technology",
    major: "Software Engineering",
    classYear: "Năm 3",
    bio: "Theo đuổi frontend và hạ tầng sản phẩm, quan tâm đến cách startup triển khai công nghệ một cách thực dụng.",
    avatarTone: "from-orange-500 via-rose-400 to-fuchsia-400",
    providers: ["email", "google"],
  },
  {
    id: "u5",
    name: "An Bui",
    email: "an@example.com",
    role: "student",
    studentId: "K22405015",
    phoneNumber: "0909000005",
    university: "RMIT Vietnam",
    major: "Finance",
    classYear: "Năm 3",
    bio: "Quan tâm đến thị trường vốn và các mô hình fintech lấy khách hàng làm trung tâm ngay từ trải nghiệm đầu tiên.",
    avatarTone: "from-violet-500 via-blue-400 to-cyan-300",
    providers: ["google"],
  },
  {
    id: "u6",
    name: "Chau Pham",
    email: "chau@example.com",
    role: "student",
    studentId: "K21406011",
    phoneNumber: "0909000006",
    university: "Foreign Trade University",
    major: "International Business",
    classYear: "Năm 3",
    bio: "Kết hợp khả năng kể chuyện kinh doanh với tư duy thương mại rõ ràng và khả năng nhìn ra điểm chạm tăng trưởng.",
    avatarTone: "from-amber-500 via-orange-400 to-rose-400",
    providers: ["email"],
  },
  {
    id: "u7",
    name: "Khang Le",
    email: "khang@example.com",
    role: "student",
    studentId: "K20409003",
    phoneNumber: "0909000007",
    university: "National Economics University",
    major: "Artificial Intelligence",
    classYear: "Năm 3",
    bio: "Quan tâm đến các ứng dụng AI cho vận hành fintech, đặc biệt là những bài toán dự báo và tự động hóa quy trình.",
    avatarTone: "from-cyan-500 via-blue-500 to-indigo-500",
    providers: ["email", "google"],
  },
  {
    id: "u8",
    name: "Nhi Ho",
    email: "nhi@example.com",
    role: "student",
    studentId: "K22403019",
    phoneNumber: "0909000008",
    university: "University of Economics Ho Chi Minh City",
    major: "Marketing",
    classYear: "Năm 3",
    bio: "Phụ trách thương hiệu, tăng trưởng và truyền thông trong các dự án sinh viên có định hướng sản phẩm rõ nét.",
    avatarTone: "from-rose-500 via-orange-400 to-amber-400",
    providers: ["google"],
  },
  {
    id: "admin",
    name: "Admin Account",
    email: "admin@attacker2026.local",
    role: "admin",
    studentId: "ADMIN-2026",
    phoneNumber: "0909000100",
    university: "Attacker Organizing Committee",
    major: "Competition Operations",
    classYear: "Admin",
    bio: "Tài khoản admin preview cố định cho việc quản lý nội dung, kiểm duyệt và xuất dữ liệu trong bản demo frontend.",
    avatarTone: "from-sky-500 via-blue-500 to-indigo-500",
    providers: ["email", "google"],
  },
  {
    id: "u10",
    name: "Bao Tran",
    email: "bao.moderator@example.com",
    role: "moderator",
    studentId: "MOD-2026-01",
    phoneNumber: "0909000101",
    university: "Attacker Organizing Committee",
    major: "Community Moderation",
    classYear: "Moderator",
    bio: "Tài khoản moderator preview để theo dõi người dùng, hỗ trợ duyệt dữ liệu và kiểm tra luồng vận hành của hệ thống.",
    avatarTone: "from-emerald-500 via-cyan-400 to-blue-400",
    providers: ["email"],
  },
];

for (const user of mockUsers) {
  user.emailVerified = user.emailVerified ?? true;
}

export const mockTeams: TeamProfile[] = [
  {
    id: "t1",
    name: "Neo Ledger",
    tag: "NLD",
    leaderId: "u2",
    memberIds: ["u2", "u3", "u4"],
    stage: "round-2",
    round1LockStatus: "locked",
    round1LockedAt: "2026-05-13T18:30:00.000Z",
    avatarTone: "from-sky-500 via-cyan-400 to-teal-400",
    track: "Quant + Product",
    bio: "Design a student-friendly investing intelligence layer with clear behavioral cues for first-time student investors.",
    createdAt: "2026-03-18",
  },
  {
    id: "t2",
    name: "Pulse Capital",
    tag: "PLC",
    leaderId: "u5",
    memberIds: ["u5", "u6", "u7"],
    stage: "round-2",
    round1LockStatus: "locked",
    round1LockedAt: "2026-05-13T19:10:00.000Z",
    avatarTone: "from-indigo-500 via-blue-500 to-cyan-400",
    track: "Consumer Fintech",
    bio: "Build a smarter cashflow and savings layer for young professionals entering their first working years.",
    createdAt: "2026-03-19",
  },
];

export const mockInvitations: TeamInvitation[] = [
  {
    id: "inv-1",
    teamId: "t1",
    fromUserId: "u2",
    toUserId: "u1",
    createdAt: "2026-03-26",
    status: "pending",
  },
  {
    id: "inv-2",
    teamId: "t2",
    fromUserId: "u5",
    toUserId: "u8",
    createdAt: "2026-03-26",
    status: "pending",
  },
];

export const mockLeadershipTransferRequests: LeadershipTransferRequest[] = [];

export const mockRound1TeamLockRequests: Round1TeamLockRequest[] = [];

mockUsers.push(...preparationTestUsers);
mockTeams.push(...preparationTestTeams);
mockInvitations.push(...preparationTestInvitations);
mockLeadershipTransferRequests.push(...preparationTestLeadershipTransferRequests);
mockRound1TeamLockRequests.push(...preparationTestRound1TeamLockRequests);

export const mockSubmissions: TeamSubmission[] = [
  {
    id: "sub-1",
    teamId: "t1",
    round: "round-2",
    version: 1,
    title: "Round 2 concept deck",
    summary: "Initial product framing, market sizing, and mentor feedback summary.",
    resourceSource: "external",
    resourceLabel: "neo-ledger-r2-v1.pdf",
    resourceUrl: "https://example.com/neo-ledger-r2-v1",
    submittedByUserId: "u2",
    submittedAt: "2026-06-10T09:30:00.000Z",
  },
  {
    id: "sub-2",
    teamId: "t1",
    round: "round-2",
    version: 2,
    title: "Round 2 revised deck",
    summary: "Updated user flow, competitive mapping, and clearer validation logic.",
    resourceSource: "external",
    resourceLabel: "neo-ledger-r2-v2.pdf",
    resourceUrl: "https://example.com/neo-ledger-r2-v2",
    submittedByUserId: "u2",
    submittedAt: "2026-06-15T14:45:00.000Z",
  },
  {
    id: "sub-3",
    teamId: "t2",
    round: "round-2",
    version: 1,
    title: "Round 2 strategy memo",
    summary: "Consumer cashflow thesis, growth assumptions, and prototype direction.",
    resourceSource: "external",
    resourceLabel: "pulse-capital-r2-v1.pdf",
    resourceUrl: "https://example.com/pulse-capital-r2-v1",
    submittedByUserId: "u5",
    submittedAt: "2026-06-12T07:20:00.000Z",
  },
];

function createText(en: string, vi: string): LocalizedText {
  return { en, vi };
}

function createSingleChoiceQuestion({
  id,
  topic,
  difficulty,
  prompt,
  correct,
  distractors,
}: {
  id: string;
  topic: string;
  difficulty: Round1Question["difficulty"];
  prompt: LocalizedText;
  correct: LocalizedText;
  distractors: [LocalizedText, LocalizedText, LocalizedText];
}): Round1Question {
  return {
    id,
    topic,
    difficulty,
    type: "single-choice",
    correctOptionIds: ["b"],
    prompt,
    options: [
      { id: "a", label: "A", text: distractors[0] },
      { id: "b", label: "B", text: correct },
      { id: "c", label: "C", text: distractors[1] },
      { id: "d", label: "D", text: distractors[2] },
    ],
  };
}

function createTrueFalseQuestion({
  id,
  topic,
  difficulty,
  prompt,
  isTrue,
}: {
  id: string;
  topic: string;
  difficulty: Round1Question["difficulty"];
  prompt: LocalizedText;
  isTrue: boolean;
}): Round1Question {
  return {
    id,
    topic,
    difficulty,
    type: "true-false",
    correctOptionIds: [isTrue ? "a" : "b"],
    prompt,
    options: [
      { id: "a", label: "A", text: createText("True", "Đúng") },
      { id: "b", label: "B", text: createText("False", "Sai") },
    ],
  };
}

function createMultipleChoiceQuestion({
  id,
  topic,
  difficulty,
  prompt,
  correctOptions,
  distractors,
}: {
  id: string;
  topic: string;
  difficulty: Round1Question["difficulty"];
  prompt: LocalizedText;
  correctOptions: [LocalizedText, LocalizedText];
  distractors: [LocalizedText, LocalizedText];
}): Round1Question {
  return {
    id,
    topic,
    difficulty,
    type: "multiple-choice",
    correctOptionIds: ["a", "d"],
    prompt,
    options: [
      { id: "a", label: "A", text: correctOptions[0] },
      { id: "b", label: "B", text: distractors[0] },
      { id: "c", label: "C", text: distractors[1] },
      { id: "d", label: "D", text: correctOptions[1] },
    ],
  };
}

function createPairingQuestion({
  id,
  topic,
  prompt,
  options,
  pairingItems,
}: {
  id: string;
  topic: string;
  prompt: LocalizedText;
  options: [LocalizedText, LocalizedText, LocalizedText];
  pairingItems: [
    { label: string; prompt: LocalizedText; correctOptionId: string },
    { label: string; prompt: LocalizedText; correctOptionId: string },
    { label: string; prompt: LocalizedText; correctOptionId: string },
  ];
}): Round1Question {
  return {
    id,
    topic,
    difficulty: "hard",
    type: "pairing",
    prompt,
    options: [
      { id: "a", label: "A", text: options[0] },
      { id: "b", label: "B", text: options[1] },
      { id: "c", label: "C", text: options[2] },
    ],
    pairingItems: pairingItems.map((item, index) => ({
      id: `${id}-pair-${index + 1}`,
      label: item.label,
      prompt: item.prompt,
      correctOptionId: item.correctOptionId,
    })),
  };
}

function createEssayQuestion({
  id,
  topic,
  prompt,
  placeholder,
  rubricNote,
}: {
  id: string;
  topic: string;
  prompt: LocalizedText;
  placeholder: LocalizedText;
  rubricNote: LocalizedText;
}): Round1Question {
  return {
    id,
    topic,
    difficulty: "medium",
    type: "essay",
    prompt,
    placeholder,
    rubricNote,
  };
}

const round1ObjectiveQuestionTemplates: Round1Question[] = [
  createSingleChoiceQuestion({
    id: "r1q-01",
    topic: "Fintech fundamentals",
    difficulty: "easy",
    prompt: createText(
      "Which statement best describes the role of fintech in retail finance?",
      "Phát biểu nào mô tả đúng nhất vai trò của fintech trong tài chính bán lẻ?",
    ),
    correct: createText(
      "Using technology to improve access, speed, and experience",
      "Ứng dụng công nghệ để cải thiện khả năng tiếp cận, tốc độ và trải nghiệm",
    ),
    distractors: [
      createText("Replacing banks completely in every case", "Thay thế hoàn toàn ngân hàng trong mọi trường hợp"),
      createText("Serving only cryptocurrency traders", "Chỉ phục vụ nhà giao dịch tiền mã hóa"),
      createText("Focusing only on large institutional clients", "Chỉ tập trung vào khách hàng tổ chức lớn"),
    ],
  }),
  createTrueFalseQuestion({
    id: "r1q-02",
    topic: "Fintech fundamentals",
    difficulty: "medium",
    prompt: createText(
      "A well-designed eKYC flow can reduce onboarding friction while still supporting compliance checks.",
      "Một luồng eKYC được thiết kế tốt có thể giảm ma sát khi onboarding nhưng vẫn hỗ trợ kiểm tra tuân thủ.",
    ),
    isTrue: true,
  }),
  createMultipleChoiceQuestion({
    id: "r1q-03",
    topic: "Fintech fundamentals",
    difficulty: "hard",
    prompt: createText(
      "Which elements most strongly signal that a fintech value proposition is defensible?",
      "Những yếu tố nào cho thấy rõ nhất rằng một giá trị đề xuất fintech có khả năng bảo vệ lợi thế cạnh tranh?",
    ),
    correctOptions: [
      createText("It solves a specific, repeated pain point", "Nó giải quyết một pain point cụ thể và lặp lại"),
      createText("Its economics can improve as usage scales", "Hiệu quả kinh tế của nó có thể tốt lên khi quy mô sử dụng tăng"),
    ],
    distractors: [
      createText("The pitch deck uses more jargon", "Pitch deck dùng nhiều thuật ngữ hơn"),
      createText("The homepage copies a large competitor", "Trang chủ sao chép một đối thủ lớn"),
    ],
  }),
  createSingleChoiceQuestion({
    id: "r1q-04",
    topic: "Payments",
    difficulty: "easy",
    prompt: createText(
      "What is the strongest product benefit of real-time payments for consumers?",
      "Lợi ích sản phẩm nổi bật nhất của thanh toán thời gian thực đối với người dùng là gì?",
    ),
    correct: createText(
      "Faster cash availability and clearer transaction confidence",
      "Tiền về nhanh hơn và tăng mức độ yên tâm trong giao dịch",
    ),
    distractors: [
      createText("Longer settlement windows", "Thời gian đối soát dài hơn"),
      createText("Higher branch traffic", "Tăng lượng giao dịch tại chi nhánh"),
      createText("Removing all fraud risk", "Loại bỏ hoàn toàn rủi ro gian lận"),
    ],
  }),
  createMultipleChoiceQuestion({
    id: "r1q-05",
    topic: "Payments",
    difficulty: "medium",
    prompt: createText(
      "Which product choices can improve checkout conversion in a digital payment flow?",
      "Những lựa chọn sản phẩm nào có thể cải thiện tỷ lệ chuyển đổi ở luồng thanh toán số?",
    ),
    correctOptions: [
      createText("Remembering trusted payees and preferred methods", "Ghi nhớ người thụ hưởng tin cậy và phương thức ưu tiên"),
      createText("Showing clear transaction status and next-step feedback", "Hiển thị trạng thái giao dịch rõ ràng và phản hồi bước tiếp theo"),
    ],
    distractors: [
      createText("Adding more form fields before payment", "Thêm nhiều trường biểu mẫu trước khi thanh toán"),
      createText("Hiding fees until the last step", "Ẩn phí cho tới bước cuối cùng"),
    ],
  }),
  createSingleChoiceQuestion({
    id: "r1q-06",
    topic: "Payments",
    difficulty: "hard",
    prompt: createText(
      "Why does settlement design matter especially for small merchants?",
      "Vì sao thiết kế quy trình quyết toán đặc biệt quan trọng đối với các tiểu thương?",
    ),
    correct: createText(
      "Because settlement timing directly affects daily cashflow predictability",
      "Vì thời điểm quyết toán ảnh hưởng trực tiếp đến khả năng dự đoán dòng tiền hằng ngày",
    ),
    distractors: [
      createText("Because merchants only care about brand colors", "Vì tiểu thương chỉ quan tâm đến màu sắc thương hiệu"),
      createText("Because settlement removes the need for reconciliation", "Vì quyết toán giúp không còn cần đối soát"),
      createText("Because slower settlement always increases trust", "Vì quyết toán chậm hơn luôn làm tăng niềm tin"),
    ],
  }),
  createTrueFalseQuestion({
    id: "r1q-07",
    topic: "Customer problem framing",
    difficulty: "easy",
    prompt: createText(
      "A team should validate the user problem before building a full feature set.",
      "Một đội nên xác thực vấn đề người dùng trước khi xây dựng trọn bộ tính năng.",
    ),
    isTrue: true,
  }),
  createSingleChoiceQuestion({
    id: "r1q-08",
    topic: "Customer problem framing",
    difficulty: "medium",
    prompt: createText(
      "When researching student finance behavior, what should be validated first?",
      "Khi nghiên cứu hành vi tài chính của sinh viên, điều gì nên được xác thực trước tiên?",
    ),
    correct: createText(
      "Whether the pain point happens often enough and matters enough to users",
      "Liệu pain point đó có xảy ra đủ thường xuyên và đủ quan trọng với người dùng hay không",
    ),
    distractors: [
      createText("Whether the UI follows the newest animation trend", "Liệu giao diện có theo xu hướng animation mới nhất hay không"),
      createText("Whether sponsors will like the launch event", "Liệu nhà tài trợ có thích sự kiện ra mắt hay không"),
      createText("Whether all features can ship in week one", "Liệu toàn bộ tính năng có thể ra mắt ngay trong tuần đầu hay không"),
    ],
  }),
  createPairingQuestion({
    id: "r1q-09",
    topic: "Customer problem framing",
    prompt: createText(
      "Match each research goal with the most suitable validation method.",
      "Hãy nối từng mục tiêu nghiên cứu với phương pháp xác thực phù hợp nhất.",
    ),
    options: [
      createText("User interview on recurring pain", "Phỏng vấn người dùng về pain lặp lại"),
      createText("Landing page value-message test", "Thử nghiệm thông điệp giá trị trên landing page"),
      createText("Weekly spending diary study", "Nghiên cứu nhật ký chi tiêu hằng tuần"),
    ],
    pairingItems: [
      {
        label: "1",
        prompt: createText("Understand why students abandon budgeting tools", "Hiểu vì sao sinh viên bỏ công cụ quản lý chi tiêu"),
        correctOptionId: "a",
      },
      {
        label: "2",
        prompt: createText("Check whether the proposed message attracts signups", "Kiểm tra xem thông điệp đề xuất có thu hút đăng ký hay không"),
        correctOptionId: "b",
      },
      {
        label: "3",
        prompt: createText("Observe real patterns in day-to-day spending behavior", "Quan sát mô thức chi tiêu thực tế hằng ngày"),
        correctOptionId: "c",
      },
    ],
  }),
  createSingleChoiceQuestion({
    id: "r1q-10",
    topic: "Data thinking",
    difficulty: "easy",
    prompt: createText(
      "Which metric is most useful for evaluating onboarding quality in a fintech app?",
      "Chỉ số nào hữu ích nhất để đánh giá chất lượng onboarding trong một ứng dụng fintech?",
    ),
    correct: createText(
      "Completion rate from signup to successful activation",
      "Tỷ lệ hoàn tất từ đăng ký đến kích hoạt thành công",
    ),
    distractors: [
      createText("Number of internal meetings held by the team", "Số cuộc họp nội bộ của đội"),
      createText("How many colors appear in the interface", "Có bao nhiêu màu trong giao diện"),
      createText("Total office rent paid by the company", "Tổng tiền thuê văn phòng của công ty"),
    ],
  }),
  createMultipleChoiceQuestion({
    id: "r1q-11",
    topic: "Data thinking",
    difficulty: "medium",
    prompt: createText(
      "Which practices improve user trust in a student budgeting product?",
      "Những thực hành nào giúp tăng niềm tin của người dùng trong một sản phẩm quản lý chi tiêu cho sinh viên?",
    ),
    correctOptions: [
      createText("Explaining consent in plain language", "Giải thích việc đồng ý chia sẻ dữ liệu bằng ngôn ngữ dễ hiểu"),
      createText("Collecting only the fields needed for the feature", "Chỉ thu thập những trường dữ liệu cần thiết cho tính năng"),
    ],
    distractors: [
      createText("Requesting every permission on first open", "Yêu cầu mọi quyền truy cập ngay lần mở đầu tiên"),
      createText("Hiding how transaction data is used", "Che giấu cách dữ liệu giao dịch được sử dụng"),
    ],
  }),
  createSingleChoiceQuestion({
    id: "r1q-12",
    topic: "Data thinking",
    difficulty: "hard",
    prompt: createText(
      "Why should a product team define one primary KPI for each objective?",
      "Vì sao một đội sản phẩm nên xác định một KPI chính cho mỗi mục tiêu?",
    ),
    correct: createText(
      "To align decisions around the clearest signal of progress",
      "Để thống nhất việc ra quyết định quanh tín hiệu tiến bộ rõ ràng nhất",
    ),
    distractors: [
      createText("To guarantee the KPI always increases", "Để đảm bảo KPI lúc nào cũng tăng"),
      createText("To avoid ever speaking with users", "Để không cần nói chuyện với người dùng"),
      createText("To reduce all data collection permanently", "Để cắt giảm vĩnh viễn mọi hoạt động thu thập dữ liệu"),
    ],
  }),
  createSingleChoiceQuestion({
    id: "r1q-13",
    topic: "Risk and compliance",
    difficulty: "easy",
    prompt: createText(
      "Why do fintech teams need to think about compliance early?",
      "Vì sao đội fintech cần nghĩ về tuân thủ ngay từ sớm?",
    ),
    correct: createText(
      "Because regulatory fit affects product design and trust",
      "Vì sự phù hợp quy định ảnh hưởng trực tiếp đến thiết kế sản phẩm và niềm tin",
    ),
    distractors: [
      createText("Because compliance replaces customer research", "Vì tuân thủ có thể thay thế nghiên cứu người dùng"),
      createText("Because only lawyers should make product decisions", "Vì chỉ luật sư mới nên ra quyết định sản phẩm"),
      createText("Because it makes launch slower on purpose", "Vì nó giúp làm chậm ngày ra mắt một cách có chủ đích"),
    ],
  }),
  createTrueFalseQuestion({
    id: "r1q-14",
    topic: "Risk and compliance",
    difficulty: "medium",
    prompt: createText(
      "Fraud prevention can be ignored in early prototypes because the product is not public yet.",
      "Có thể bỏ qua chống gian lận ở giai đoạn prototype ban đầu vì sản phẩm chưa ra công chúng.",
    ),
    isTrue: false,
  }),
  createPairingQuestion({
    id: "r1q-15",
    topic: "Risk and compliance",
    prompt: createText(
      "Match each risk scenario with the most suitable control.",
      "Hãy nối từng tình huống rủi ro với biện pháp kiểm soát phù hợp nhất.",
    ),
    options: [
      createText("Step-up authentication", "Xác thực tăng cường"),
      createText("Behavior anomaly monitoring", "Theo dõi bất thường hành vi"),
      createText("Progressive KYC journey", "Luồng KYC theo từng bước"),
    ],
    pairingItems: [
      {
        label: "1",
        prompt: createText("A high-value transfer is triggered from a new device", "Một giao dịch giá trị cao được khởi tạo từ thiết bị mới"),
        correctOptionId: "a",
      },
      {
        label: "2",
        prompt: createText("Login patterns suddenly change compared with normal behavior", "Mô thức đăng nhập đột ngột khác với hành vi bình thường"),
        correctOptionId: "b",
      },
      {
        label: "3",
        prompt: createText("New users drop off when identity checks feel too heavy", "Người dùng mới rời bỏ khi bước xác minh danh tính quá nặng"),
        correctOptionId: "c",
      },
    ],
  }),
  createSingleChoiceQuestion({
    id: "r1q-16",
    topic: "Growth strategy",
    difficulty: "easy",
    prompt: createText(
      "Which scenario signals healthy early-stage product-market fit?",
      "Tình huống nào cho thấy dấu hiệu product-market fit lành mạnh ở giai đoạn đầu?",
    ),
    correct: createText(
      "A clear user segment repeatedly gets value and keeps using the product",
      "Một phân khúc người dùng rõ ràng liên tục nhận giá trị và tiếp tục sử dụng sản phẩm",
    ),
    distractors: [
      createText("Users sign up once and never return", "Người dùng đăng ký một lần rồi không quay lại"),
      createText("The team changes target users every week", "Đội thay đổi nhóm người dùng mục tiêu mỗi tuần"),
      createText("The app has many features but no retention data", "Ứng dụng có nhiều tính năng nhưng không có dữ liệu giữ chân"),
    ],
  }),
  createMultipleChoiceQuestion({
    id: "r1q-17",
    topic: "Growth strategy",
    difficulty: "medium",
    prompt: createText(
      "Which moves improve responsible growth for a student finance app?",
      "Những bước đi nào giúp tăng trưởng bền vững cho một ứng dụng tài chính sinh viên?",
    ),
    correctOptions: [
      createText("Targeting one clear student segment first", "Nhắm vào một phân khúc sinh viên rõ ràng trước"),
      createText("Tracking cohort retention alongside acquisition", "Theo dõi giữ chân theo cohort cùng với thu hút người dùng"),
    ],
    distractors: [
      createText("Chasing every possible use case at once", "Theo đuổi mọi use case cùng lúc"),
      createText("Optimizing only for app installs", "Chỉ tối ưu cho lượt cài đặt ứng dụng"),
    ],
  }),
  createSingleChoiceQuestion({
    id: "r1q-18",
    topic: "Growth strategy",
    difficulty: "hard",
    prompt: createText(
      "What is the strongest reason to segment users before building a fintech roadmap?",
      "Lý do mạnh nhất để phân khúc người dùng trước khi xây roadmap fintech là gì?",
    ),
    correct: createText(
      "Different user groups have different pain points, economics, and adoption patterns",
      "Các nhóm người dùng khác nhau có pain point, kinh tế đơn vị và mô thức chấp nhận khác nhau",
    ),
    distractors: [
      createText("It makes the strategy deck longer", "Nó giúp slide chiến lược dài hơn"),
      createText("It avoids choosing clear priorities", "Nó giúp tránh phải chọn ưu tiên rõ ràng"),
      createText("It impresses judges with extra jargon", "Nó giúp gây ấn tượng với giám khảo bằng nhiều thuật ngữ hơn"),
    ],
  }),
];

const round1EssayQuestionTemplates: Round1Question[] = [
  createEssayQuestion({
    id: "r1e-01",
    topic: "Fintech fundamentals",
    prompt: createText(
      "In no more than 500 words, explain how a student-focused fintech product could create trust from the first week of use.",
      "Trong tối đa 500 từ, hãy giải thích một sản phẩm fintech dành cho sinh viên có thể tạo niềm tin ngay từ tuần sử dụng đầu tiên như thế nào.",
    ),
    placeholder: createText(
      "Outline the trust problem, the product choice, and the user signal you would watch...",
      "Nêu vấn đề về niềm tin, lựa chọn sản phẩm và tín hiệu người dùng bạn sẽ theo dõi...",
    ),
    rubricNote: createText(
      "Manual review focuses on logic, relevance to student finance, and clarity of execution.",
      "Chấm thủ công tập trung vào logic, mức độ liên quan với tài chính sinh viên và độ rõ của cách triển khai.",
    ),
  }),
  createEssayQuestion({
    id: "r1e-02",
    topic: "Payments",
    prompt: createText(
      "In no more than 500 words, propose one product idea that reduces payment anxiety for students and explain why it matters.",
      "Trong tối đa 500 từ, hãy đề xuất một ý tưởng sản phẩm giúp giảm lo lắng khi thanh toán của sinh viên và giải thích vì sao nó quan trọng.",
    ),
    placeholder: createText(
      "Describe the user moment, the feature, and the expected impact...",
      "Mô tả bối cảnh người dùng, tính năng và tác động kỳ vọng...",
    ),
    rubricNote: createText(
      "Manual review focuses on problem framing, practicality, and evidence-minded thinking.",
      "Chấm thủ công tập trung vào cách đặt vấn đề, tính thực tế và tư duy dựa trên bằng chứng.",
    ),
  }),
  createEssayQuestion({
    id: "r1e-03",
    topic: "Customer problem framing",
    prompt: createText(
      "In no more than 500 words, explain how you would verify that a finance pain point is strong enough to build for students.",
      "Trong tối đa 500 từ, hãy giải thích bạn sẽ kiểm chứng thế nào để biết một pain point tài chính đủ mạnh để xây cho sinh viên.",
    ),
    placeholder: createText(
      "State the hypothesis, target student segment, and validation method...",
      "Nêu giả thuyết, phân khúc sinh viên mục tiêu và phương pháp xác thực...",
    ),
    rubricNote: createText(
      "Manual review focuses on hypothesis quality, realism, and measurable validation steps.",
      "Chấm thủ công tập trung vào chất lượng giả thuyết, tính thực tế và các bước xác thực có thể đo lường.",
    ),
  }),
  createEssayQuestion({
    id: "r1e-04",
    topic: "Data thinking",
    prompt: createText(
      "In no more than 500 words, describe the minimum data you would collect to evaluate a new student budgeting feature responsibly.",
      "Trong tối đa 500 từ, hãy mô tả bộ dữ liệu tối thiểu bạn sẽ thu thập để đánh giá một tính năng quản lý chi tiêu mới cho sinh viên một cách có trách nhiệm.",
    ),
    placeholder: createText(
      "List the core signals, why they matter, and how you would avoid over-collection...",
      "Liệt kê các tín hiệu cốt lõi, vì sao chúng quan trọng và cách bạn tránh thu thập quá mức...",
    ),
    rubricNote: createText(
      "Manual review focuses on product relevance, data minimization, and decision usefulness.",
      "Chấm thủ công tập trung vào mức độ liên quan với sản phẩm, nguyên tắc tối thiểu hóa dữ liệu và giá trị ra quyết định.",
    ),
  }),
  createEssayQuestion({
    id: "r1e-05",
    topic: "Risk and compliance",
    prompt: createText(
      "In no more than 500 words, explain how a student fintech team can balance friction and safety in an early product flow.",
      "Trong tối đa 500 từ, hãy giải thích một đội fintech sinh viên có thể cân bằng giữa ma sát và an toàn trong luồng sản phẩm ban đầu như thế nào.",
    ),
    placeholder: createText(
      "Describe the risk, the control, and why the tradeoff is acceptable...",
      "Mô tả rủi ro, biện pháp kiểm soát và vì sao sự đánh đổi đó là chấp nhận được...",
    ),
    rubricNote: createText(
      "Manual review focuses on tradeoff quality, risk awareness, and practical product reasoning.",
      "Chấm thủ công tập trung vào chất lượng đánh đổi, nhận thức về rủi ro và lập luận sản phẩm thực tế.",
    ),
  }),
  createEssayQuestion({
    id: "r1e-06",
    topic: "Growth strategy",
    prompt: createText(
      "In no more than 500 words, explain how you would prioritize one student segment for the first growth cycle of a fintech product.",
      "Trong tối đa 500 từ, hãy giải thích bạn sẽ ưu tiên một phân khúc sinh viên như thế nào cho chu kỳ tăng trưởng đầu tiên của một sản phẩm fintech.",
    ),
    placeholder: createText(
      "Mention the segment, the reason for choosing it, and the metric you would track...",
      "Hãy nêu phân khúc, lý do chọn và chỉ số bạn sẽ theo dõi...",
    ),
    rubricNote: createText(
      "Manual review focuses on segmentation logic, focus, and measurable growth thinking.",
      "Chấm thủ công tập trung vào logic phân khúc, độ tập trung và tư duy tăng trưởng có thể đo lường.",
    ),
  }),
];

const round1ObjectiveVariantLabels = Array.from({ length: 10 }, (_, index) =>
  createText(`Case set ${String(index + 1).padStart(2, "0")}`, `Bộ tình huống ${String(index + 1).padStart(2, "0")}`),
);

const round1EssayVariantLabels = Array.from({ length: 5 }, (_, index) =>
  createText(`Essay set ${String(index + 1).padStart(2, "0")}`, `Bộ tự luận ${String(index + 1).padStart(2, "0")}`),
);

function appendVariantLabel(value: LocalizedText | undefined, label: LocalizedText, index: number) {
  if (!value) {
    return value;
  }

  if (index === 0) {
    return value;
  }

  return {
    en: `${value.en} (${label.en})`,
    vi: `${value.vi} (${label.vi})`,
  };
}

function cloneQuestionVariant(question: Round1Question, index: number, label: LocalizedText) {
  const variantId = index === 0 ? question.id : `${question.id}-v${String(index + 1).padStart(2, "0")}`;

  return {
    ...question,
    id: variantId,
    prompt: appendVariantLabel(question.prompt, label, index) ?? question.prompt,
    placeholder: appendVariantLabel(question.placeholder, label, index),
    rubricNote: appendVariantLabel(question.rubricNote, label, index),
    options: question.options?.map((option) => ({
      ...option,
      text: appendVariantLabel(option.text, label, index) ?? option.text,
    })),
    pairingItems: question.pairingItems?.map((item, pairingIndex) => ({
      ...item,
      id: index === 0 ? item.id : `${variantId}-pair-${pairingIndex + 1}`,
      prompt: appendVariantLabel(item.prompt, label, index) ?? item.prompt,
    })),
  } satisfies Round1Question;
}

function expandQuestionTemplates(
  templates: Round1Question[],
  variantLabels: LocalizedText[],
) {
  return templates.flatMap((template) =>
    variantLabels.map((label, index) => cloneQuestionVariant(template, index, label)),
  );
}

const round1ObjectivePreviewQuestions: Round1Question[] = expandQuestionTemplates(
  round1ObjectiveQuestionTemplates,
  round1ObjectiveVariantLabels,
);

const round1EssayPreviewQuestions: Round1Question[] = expandQuestionTemplates(
  round1EssayQuestionTemplates,
  round1EssayVariantLabels,
);

export const round1TestBanks: Round1TestBank[] = [
  {
    id: "bank-2026-official-a",
    bankType: "objective",
    title: {
      en: "Multiple choice test bank",
      vi: "Ngân hàng đề trắc nghiệm",
    },
    description: {
      en: "Primary official bank for the 40 objective questions in each paper. The system randomizes 6 questions per topic across 6 topics with a 2 easy / 2 medium / 2 hard mix, then adds 4 more random objective questions from the full bank.",
      vi: "Ngân hàng chính thức cho 40 câu hỏi trắc nghiệm trong mỗi đề. Hệ thống rút ngẫu nhiên 6 câu trên mỗi chủ đề trong 6 chủ đề theo cơ cấu 2 dễ / 2 trung bình / 2 khó, rồi thêm 4 câu trắc nghiệm ngẫu nhiên từ toàn bộ ngân hàng.",
    },
    status: "active",
    questionPoolSize: round1ObjectivePreviewQuestions.length,
    questionsPerAttempt: 40,
    shuffleQuestions: true,
    shuffleOptions: true,
    durationMinutes: 60,
    publishedAt: "2026-05-02",
    questions: round1ObjectivePreviewQuestions,
  },
  {
    id: "bank-2026-essay-a",
    bankType: "essay",
    title: {
      en: "Essay test bank",
      vi: "Ngân hàng đề tự luận",
    },
    description: {
      en: "Separate essay bank used for the last 2 questions in each paper. The system randomizes the first essay prompt from this pool, then uses the configured fixed prompt for the second essay question.",
      vi: "Ngân hàng tự luận tách riêng dùng cho 2 câu cuối của mỗi đề. Hệ thống rút ngẫu nhiên câu tự luận đầu tiên từ ngân hàng này, sau đó dùng prompt cố định đã cấu hình cho câu tự luận thứ hai.",
    },
    status: "active",
    questionPoolSize: round1EssayPreviewQuestions.length,
    questionsPerAttempt: 2,
    shuffleQuestions: true,
    shuffleOptions: false,
    durationMinutes: 60,
    wordLimit: 500,
    fixedEssayPrompt: {
      en: "",
      vi: "",
    },
    publishedAt: "2026-05-02",
    questions: round1EssayPreviewQuestions,
  },
];

export const round1IndividualSubmissions: Round1Submission[] = [
  {
    id: "r1-sub-1",
    bankId: "bank-2026-official-a",
    teamId: "t1",
    userId: "u2",
    submittedAt: "2026-05-14T08:15:00.000Z",
    rightCount: 29,
    wrongCount: 7,
    score: 85,
    objectiveScore: 58,
    essayScore: 27,
    totalScore: 85,
    durationMinutes: 34,
  },
  {
    id: "r1-sub-2",
    bankId: "bank-2026-official-a",
    teamId: "t1",
    userId: "u3",
    submittedAt: "2026-05-14T08:24:00.000Z",
    rightCount: 28,
    wrongCount: 8,
    score: 82,
    objectiveScore: 56,
    essayScore: 26,
    totalScore: 82,
    durationMinutes: 37,
  },
  {
    id: "r1-sub-3",
    bankId: "bank-2026-official-a",
    teamId: "t1",
    userId: "u4",
    submittedAt: "2026-05-14T08:37:00.000Z",
    rightCount: 25,
    wrongCount: 11,
    score: 74,
    objectiveScore: 50,
    essayScore: 24,
    totalScore: 74,
    durationMinutes: 40,
  },
  {
    id: "r1-sub-4",
    bankId: "bank-2026-official-a",
    teamId: "t2",
    userId: "u5",
    submittedAt: "2026-05-14T09:02:00.000Z",
    rightCount: 27,
    wrongCount: 9,
    score: 77,
    objectiveScore: 54,
    essayScore: 23,
    totalScore: 77,
    durationMinutes: 35,
  },
  {
    id: "r1-sub-5",
    bankId: "bank-2026-official-a",
    teamId: "t2",
    userId: "u6",
    submittedAt: "2026-05-14T09:11:00.000Z",
    rightCount: 23,
    wrongCount: 13,
    score: 68,
    objectiveScore: 46,
    essayScore: 22,
    totalScore: 68,
    durationMinutes: 39,
  },
  {
    id: "r1-sub-6",
    bankId: "bank-2026-official-a",
    teamId: "t2",
    userId: "u7",
    submittedAt: "2026-05-14T09:22:00.000Z",
    rightCount: 26,
    wrongCount: 10,
    score: 75,
    objectiveScore: 52,
    essayScore: 23,
    totalScore: 75,
    durationMinutes: 36,
  },
];
