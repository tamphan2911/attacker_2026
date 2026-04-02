import type {
  CompetitionRoundWindow,
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

export const TEAM_MIN_MEMBERS = 3;
export const TEAM_MAX_MEMBERS = 5;
export const DEMO_ADMIN_LOGIN_ID = "admin";
export const DEMO_ADMIN_PASSWORD = "Aa@291189";

export const contactInfo = {
  email: "attacker@uel.edu.vn",
  phone: "0378 398 638",
  attackerFacebook: "https://www.facebook.com/clbfintechuel",
  ftcFacebook: "https://www.facebook.com/clbfintechuel",
};

export const contactLocation = {
  campusName: {
    en: "University of Economics and Law",
    vi: "Trường Đại học Kinh tế - Luật",
  },
  address: {
    en: "669 National Highway 1A, Quarter 3, Linh Xuan Ward, Thu Duc City, Ho Chi Minh City",
    vi: "669 Quốc lộ 1A, Khu phố 3, phường Linh Xuân, TP. Thủ Đức, TP. Hồ Chí Minh",
  },
  note: {
    en: "Competition support is available at the organizer desk on campus during the official timeline and event days.",
    vi: "Bàn hỗ trợ của ban tổ chức tiếp nhận thắc mắc tại trường trong các mốc lịch trình chính thức và vào ngày diễn ra sự kiện.",
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
    title: { en: "Final round presentation", vi: "Vòng chung kết thuyết trình" },
    ...round3Window,
  },
];

export const navItems: NavItem[] = [
  { href: "/", label: { en: "Home", vi: "Trang chủ" } },
  { href: "/competition", label: { en: "Competition", vi: "Cuộc thi" } },
  { href: "/rules", label: { en: "Rules", vi: "Thể lệ" } },
  { href: "/news", label: { en: "News", vi: "Tin tức" } },
  { href: "/dashboard", label: { en: "Team Workspace", vi: "Không gian đội" } },
  { href: "/organizer", label: { en: "About Attacker", vi: "Giới thiệu Attacker" } },
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
  primaryCta: { en: "Start team workspace", vi: "Mở không gian đội" },
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
  home: {
    heroSlides: [
      {
        id: "signal",
        image: "/theme-hero-1.jpg",
        eyebrow: {
          en: "Student fintech competition 2026",
          vi: "Cuộc thi fintech sinh viên 2026",
        },
        title: {
          en: "Sharper market thinking for the next generation of fintech builders.",
          vi: "Tư duy thị trường sắc nét hơn cho thế hệ builder fintech tiếp theo.",
        },
        description: {
          en: "Attacker 2026 combines competition storytelling, bilingual communication, and student team formation into one cleaner launch platform.",
          vi: "Attacker 2026 kết hợp truyền thông cuộc thi, giao tiếp song ngữ và tạo đội sinh viên thành một nền tảng ra mắt mạch lạc hơn.",
        },
      },
      {
        id: "teams",
        image: "/theme-hero-2.jpg",
        eyebrow: {
          en: "Teams can build before the backend arrives",
          vi: "Đội thi có thể vận hành trước khi có backend",
        },
        title: {
          en: "Create a team, invite members, and preview organizer-ready flows from day one.",
          vi: "Tạo đội, mời thành viên và preview các luồng sẵn sàng cho BTC ngay từ đầu.",
        },
        description: {
          en: "The frontend already reflects your core rules: one team at a time, transferable leadership, and clear progression from signup to eligibility.",
          vi: "Frontend đã phản ánh các quy tắc cốt lõi của bạn: mỗi người chỉ thuộc một đội, có thể chuyển đội trưởng và có lộ trình rõ từ đăng ký đến đủ điều kiện.",
        },
      },
      {
        id: "launch",
        image: "/theme-feature-1.jpg",
        eyebrow: {
          en: "A more international competition look",
          vi: "Diện mạo cuộc thi quốc tế hơn",
        },
        title: {
          en: "A lighter, more established visual rhythm without losing Attacker's blue identity.",
          vi: "Nhịp điệu thị giác sáng hơn, trưởng thành hơn nhưng vẫn giữ bản sắc xanh của Attacker.",
        },
        description: {
          en: "Large photography, utility sections, structured content bands, and simpler calls to action make the platform feel closer to a professional fintech event site.",
          vi: "Ảnh lớn, các band nội dung rõ ràng và CTA đơn giản hơn giúp nền tảng tiến gần một website sự kiện fintech chuyên nghiệp.",
        },
      },
    ],
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
        vi: "Trang công khai, newsroom và không gian đội đã chia sẻ cùng một cấu trúc nhất quán, để giai đoạn backend sau này có thể tập trung vào dữ liệu và phân quyền thay vì thiết kế lại.",
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
        en: "Attacker 2026 starts with an individual qualifier built from 36 objective questions across 6 topics plus 2 essay questions, then moves the best teams into judge-scored project evaluation and a live final defense. Progression is determined by team results, not solo participation alone.",
        vi: "Attacker 2026 bắt đầu bằng một bài vòng loại cá nhân gồm 36 câu hỏi khách quan trải đều trên 6 chủ đề và 2 câu tự luận, sau đó đưa các đội tốt nhất vào giai đoạn đánh giá dự án bởi giám khảo và vòng chung kết bảo vệ trực tiếp. Việc đi tiếp được quyết định bởi kết quả của đội, không chỉ bởi từng cá nhân riêng lẻ.",
      },
    },
    rounds: {
      eyebrow: { en: "Round architecture", vi: "Kiến trúc vòng thi" },
      title: {
        en: "From individual qualifier to judge-scored team execution.",
        vi: "Từ vòng loại cá nhân đến năng lực thực thi của đội được giám khảo chấm điểm.",
      },
      description: {
        en: "Members first complete an individual paper with 36 objective questions and 2 essays, then qualified teams submit reports, and finalists defend their project live in front of the judges.",
        vi: "Thí sinh trước tiên hoàn thành một bài thi cá nhân gồm 36 câu khách quan và 2 câu tự luận, sau đó các đội đủ điều kiện nộp báo cáo, và các đội vào sâu sẽ bảo vệ dự án trực tiếp trước hội đồng giám khảo.",
      },
    },
    rewards: {
      eyebrow: { en: "Rewards", vi: "Giải thưởng" },
      title: {
        en: "A clearer structure for finalists and Emerging Teams.",
        vi: "Cấu trúc rõ ràng hơn cho các đội chung kết và Đội tiềm năng.",
      },
      description: {
        en: "Round 2 selects the top 5 finalist teams, while the next 10 teams are recognized as Emerging Teams before the final round determines the podium.",
        vi: "Vòng 2 sẽ chọn ra 5 đội vào chung kết, trong khi 10 đội tiếp theo được ghi nhận là Đội tiềm năng trước khi vòng chung kết xác định thứ hạng cao nhất.",
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
        en: "This matters especially for Round 1 eligibility, team-average scoring, and the rules around team switching.",
        vi: "Điều này đặc biệt quan trọng với điều kiện vào Vòng 1, cơ chế điểm trung bình đội và các quy tắc chuyển đội.",
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
      title: {
        en: "Sponsors who strengthen the competition beyond branding.",
        vi: "Những nhà tài trợ giúp cuộc thi mạnh hơn không chỉ ở mặt hiện diện thương hiệu.",
      },
      description: {
        en: "This page gives sponsors a dedicated space with clearer role definition, category positioning, and contribution context for Attacker 2026.",
        vi: "Trang này tạo ra một không gian riêng cho nhà tài trợ, với vai trò, định vị và bối cảnh đồng hành rõ ràng hơn cho Attacker 2026.",
      },
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
        en: "Sign in or create a student account.",
        vi: "Đăng nhập hoặc tạo tài khoản sinh viên.",
      },
      description: {
        en: "Simple entry points for email/password and Google sign-in.",
        vi: "Điểm vào gọn gàng cho email/password và đăng nhập Google.",
      },
    },
    registerNote: {
      en: "Basic student fields only. Extra profile editing can happen after login.",
      vi: "Chỉ giữ các trường cơ bản cho sinh viên. Các thông tin mở rộng có thể sửa sau khi đăng nhập.",
    },
    signinNote: {
      en: "Use the same clean entry point for both email/password and Google.",
      vi: "Sử dụng cùng một điểm vào gọn gàng cho cả email/password và Google.",
    },
  },
  workspace: {
    header: {
      eyebrow: { en: "Team workspace", vi: "Không gian đội" },
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
    flags: {
      eyebrow: { en: "2026 momentum", vi: "Động lực 2026" },
      title: {
        en: "The current season already has visible signs of activity and momentum.",
        vi: "Mùa hiện tại đã có những dấu hiệu rõ ràng về mức độ hoạt động và đà tăng trưởng.",
      },
      description: {
        en: "Mixing live frontend indicators with the broader competition story helps the page feel current, not purely retrospective.",
        vi: "Kết hợp các chỉ số đang sống trên frontend với câu chuyện tổng thể của cuộc thi giúp trang này có cảm giác hiện tại, không chỉ nhìn lại quá khứ.",
      },
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
      en: "Round 2 also recognizes the next 10 teams as Emerging Teams",
      vi: "Vòng 2 đồng thời ghi nhận 10 đội tiếp theo là Đội tiềm năng",
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
    en: "Attacker 2026 starts with an individual qualifier built from 36 objective questions across 6 topics plus 2 essay questions, then moves the strongest teams into a judge-scored report round and a live final presentation. Advancement is calculated at the team level, even when the first test is taken individually.",
    vi: "Attacker 2026 bắt đầu bằng một bài vòng loại cá nhân gồm 36 câu hỏi khách quan trải đều trên 6 chủ đề và 2 câu tự luận, sau đó đưa các đội mạnh nhất vào vòng nộp báo cáo được giám khảo chấm điểm và một buổi thuyết trình chung kết trực tiếp. Việc đi tiếp được tính ở cấp độ đội, dù cho bài thi đầu tiên được làm theo từng cá nhân.",
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
      en: "36 objective questions + 2 essay questions online",
      vi: "36 câu khách quan + 2 câu tự luận trực tuyến",
    },
    description: {
      en: "Each eligible member receives a personalized paper with 36 objective questions drawn by topic and difficulty, followed by 2 essay questions. The average score of the team is used for ranking, and the top 50 teams proceed to Round 2.",
      vi: "Mỗi thành viên đủ điều kiện sẽ nhận một đề thi cá nhân gồm 36 câu hỏi khách quan được rút theo chủ đề và độ khó, sau đó là 2 câu tự luận. Điểm trung bình của đội được dùng để xếp hạng, và top 50 đội sẽ vào Vòng 2.",
    },
    deliverables: [
      {
        en: "36 objective questions across 6 topics",
        vi: "36 câu khách quan trên 6 chủ đề",
      },
      {
        en: "2 essay responses with 200-word limit each",
        vi: "2 bài tự luận, mỗi bài tối đa 200 từ",
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
      vi: "Chấm báo cáo dự án",
    },
    duration: {
      en: "judge-scored team report stage",
      vi: "giai đoạn nộp báo cáo đội được giám khảo chấm điểm",
    },
    description: {
      en: "Qualified teams submit a report for their project and receive judge scoring. The top 5 teams proceed to the final round, while the next 10 teams are recognized as Emerging Teams.",
      vi: "Các đội đủ điều kiện nộp báo cáo cho dự án của mình và nhận điểm từ giám khảo. Top 5 đội sẽ vào chung kết, trong khi 10 đội tiếp theo được ghi nhận là Đội tiềm năng.",
    },
    deliverables: [
      {
        en: "Project report submission",
        vi: "Báo cáo dự án",
      },
      {
        en: "Judge scoring and feedback",
        vi: "Điểm và nhận xét từ giám khảo",
      },
      {
        en: "Top 5 finalists + next 10 Emerging Teams",
        vi: "Top 5 chung kết + 10 Đội tiềm năng tiếp theo",
      },
    ],
  },
  {
    id: "03",
    label: { en: "Round 03", vi: "Vòng 03" },
    title: {
      en: "Final Presentation & Defense",
      vi: "Thuyết trình và bảo vệ chung kết",
    },
    duration: {
      en: "live final round with judges",
      vi: "vòng chung kết trực tiếp cùng giám khảo",
    },
    description: {
      en: "Finalist teams present the project, answer questions from the judges, and receive the final score that determines the champion, runner-up, and third place.",
      vi: "Các đội chung kết thuyết trình dự án, trả lời câu hỏi từ hội đồng giám khảo và nhận điểm cuối cùng để xác định quán quân, á quân và giải ba.",
    },
    deliverables: [
      {
        en: "Live team presentation",
        vi: "Phần thuyết trình trực tiếp của đội",
      },
      {
        en: "Judge Q&A defense",
        vi: "Bảo vệ hỏi đáp cùng giám khảo",
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
    title: { en: "Emerging teams", vi: "Đội tiềm năng" },
    amount: { en: "Top 10 teams", vi: "Top 10 đội" },
    note: {
      en: "Teams ranked immediately after the top 5 in Round 2 receive Emerging Team recognition.",
      vi: "Các đội xếp ngay sau top 5 của Vòng 2 sẽ nhận danh hiệu Đội tiềm năng.",
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
    organization: "NextBank Lab",
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
    organization: "Finverse",
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
    organization: "BlueFund Capital",
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
    organization: "NextBank Lab",
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
    organization: "BlueFund Capital",
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
    organization: "BlueFund Capital",
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
    organization: "NextBank Lab",
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
    organization: "Finverse",
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
    organization: "Quant Studio",
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
    organization: "Finverse",
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
    organization: "Quant Studio",
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
    organization: "UEL Academic Office",
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
    organization: "University of Economics and Law",
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
    organization: "Finverse Learning Hub",
    bio: {
      en: "Supports Round 1 by checking clarity of wording, fairness between topics, and the practical relevance of the objective paper.",
      vi: "Hỗ trợ Vòng 1 bằng việc kiểm tra độ rõ câu chữ, tính công bằng giữa các chủ đề và mức độ gắn với thực tiễn của phần khách quan.",
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
    organization: "Quant Studio",
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
      en: "Teams can be created by one student, but only teams with 3 to 5 members may enter Round 1. Every member, including the leader, takes an individual paper with 36 objective questions and 2 essay questions.",
      vi: "Đội có thể được tạo bởi một sinh viên, nhưng chỉ những đội có từ 3 đến 5 thành viên mới được vào Vòng 1. Mỗi thành viên, kể cả đội trưởng, đều làm một đề cá nhân gồm 36 câu khách quan và 2 câu tự luận.",
    },
  },
  {
    title: { en: "Stage progression", vi: "Cách đi tiếp qua từng vòng" },
    description: {
      en: "Round 1 ranks teams by the average score of their members and sends the top 50 teams to Round 2. Round 2 judge scoring sends the top 5 teams to the final and recognizes the next 10 teams as Emerging Teams.",
      vi: "Vòng 1 xếp hạng đội theo điểm trung bình của các thành viên và đưa top 50 đội vào Vòng 2. Điểm chấm của giám khảo ở Vòng 2 sẽ đưa top 5 đội vào chung kết và ghi nhận 10 đội tiếp theo là Đội tiềm năng.",
    },
  },
];

export const timelineItems: TimelineItem[] = [
  {
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
    phase: "general",
    startDate: "2026-05-10",
    endDate: "2026-05-10",
    title: { en: "Registration deadline and team lock", vi: "Đóng đăng ký và chốt đội" },
    description: {
      en: "Teams must complete the minimum 3-member requirement before this checkpoint to unlock Round 1 eligibility.",
      vi: "Các đội phải đạt mức tối thiểu 3 thành viên trước mốc này để mở điều kiện vào Vòng 1.",
    },
    location: {
      en: "Online team workspace",
      vi: "Không gian đội trực tuyến",
    },
    method: {
      en: "Roster freeze and team lock confirmation on platform",
      vi: "Khóa danh sách đội và xác nhận chốt đội trên nền tảng",
    },
    supportLinks: [
      { href: "/dashboard", label: { en: "Finalize team", vi: "Hoàn thiện đội" } },
      { href: "/rules#general-rules", label: { en: "Check eligibility", vi: "Kiểm tra điều kiện" } },
    ],
  },
  {
    phase: "round-1",
    startDate: round1Window.startDate,
    endDate: round1Window.endDate,
    title: { en: "Round 01 individual qualifier", vi: "Vòng 01 bài thi cá nhân" },
    description: {
      en: "Eligible members complete an online paper with 36 objective questions distributed across 6 topics and 2 essay questions at the end.",
      vi: "Các thành viên đủ điều kiện hoàn thành một bài thi trực tuyến gồm 36 câu khách quan trải trên 6 chủ đề và 2 câu tự luận ở cuối đề.",
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
      vi: "Công bố kết quả công khai kèm xếp hạng đội và thông báo đủ điều kiện",
    },
    supportLinks: [
      { href: "/news", label: { en: "Check announcements", vi: "Xem thông báo" } },
      { href: "/competition", label: { en: "Review Round 2", vi: "Xem Vòng 2" } },
    ],
  },
  {
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
      vi: "Trung tâm nộp bài trong không gian đội",
    },
    method: {
      en: "Team leader uploads versioned report files through the submission center",
      vi: "Đội trưởng nộp báo cáo theo phiên bản qua trung tâm nộp bài",
    },
    supportLinks: [
      { href: "/dashboard", label: { en: "Submit Round 2 file", vi: "Nộp file Vòng 2" } },
      { href: "/competition/judges", label: { en: "Meet the judges", vi: "Xem giám khảo" } },
    ],
  },
  {
    phase: "round-2",
    startDate: "2026-06-20",
    endDate: "2026-06-20",
    title: { en: "Round 02 results", vi: "Kết quả Vòng 02" },
    description: {
      en: "The top 5 teams advance to the final round and the next 10 teams receive Emerging Team recognition.",
      vi: "Top 5 đội vào chung kết và 10 đội tiếp theo nhận ghi nhận Đội tiềm năng.",
    },
    location: {
      en: "Newsroom, email, and official social channels",
      vi: "Newsroom, email và các kênh mạng xã hội chính thức",
    },
    method: {
      en: "Judge result release with finalist shortlist and Emerging Team recognition",
      vi: "Công bố kết quả giám khảo với danh sách chung kết và ghi nhận Đội tiềm năng",
    },
    supportLinks: [
      { href: "/news", label: { en: "Read result update", vi: "Đọc cập nhật kết quả" } },
      { href: "/competition", label: { en: "Review finals format", vi: "Xem thể thức chung kết" } },
    ],
  },
  {
    phase: "round-3",
    startDate: round3Window.startDate,
    endDate: round3Window.endDate,
    title: { en: "Final presentation and awards", vi: "Chung kết thuyết trình và trao giải" },
    description: {
      en: "Finalists present the project live, answer questions from the judges, and receive the final score and awards.",
      vi: "Các đội chung kết thuyết trình dự án trực tiếp, trả lời câu hỏi từ giám khảo và nhận điểm cuối cùng cùng giải thưởng.",
    },
    location: {
      en: "UEL main hall, Ho Chi Minh City",
      vi: "Hội trường chính UEL, TP.HCM",
    },
    method: {
      en: "On-site presentation, judge Q&A, and live final scoring",
      vi: "Thuyết trình trực tiếp, hỏi đáp cùng giám khảo và chấm điểm cuối tại sân khấu",
    },
    supportLinks: [
      { href: "/competition/judges", label: { en: "See judging panel", vi: "Xem hội đồng giám khảo" } },
      { href: "/competition", label: { en: "Review rewards", vi: "Xem giải thưởng" } },
    ],
  },
];

export const faqItems: FAQItem[] = [
  {
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
    question: {
      en: "What happens after Round 2 judge scoring?",
      vi: "Sau khi Vòng 2 được giám khảo chấm điểm thì sao?",
    },
    answer: {
      en: "The top 5 teams move to the final round. The next 10 teams are recognized as Emerging Teams.",
      vi: "Top 5 đội sẽ vào vòng chung kết. 10 đội tiếp theo được ghi nhận là Đội tiềm năng.",
    },
  },
  {
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

export const testimonialItems: TestimonialItem[] = [
  {
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
    name: "Phạm Nguyễn Khánh Huy",
    competitionRole: {
      en: "Attacker 2025 Emerging Team · Product lead",
      vi: "Đội tiềm năng Attacker 2025 · Trưởng nhóm sản phẩm",
    },
    university: "Đại học Kinh tế TP. Hồ Chí Minh",
    avatarImageSrc: "/testimonials/pham-nguyen-khanh-huy.svg",
    quote: {
      en: "Even more than the ranking, the competition pushed us to think in product, data, and presentation terms at the same time.",
      vi: "Quan trọng hơn cả thứ hạng là cuộc thi buộc đội phải trưởng thành đồng thời về sản phẩm, dữ liệu và khả năng trình bày.",
    },
  },
];

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
      vi: "Không gian đội",
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
    classYear: "Year 3",
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
    classYear: "Year 4",
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
    classYear: "Year 4",
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
    classYear: "Year 3",
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
    classYear: "Year 2",
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
    classYear: "Year 3",
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
    classYear: "Year 4",
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
    classYear: "Year 2",
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

const round1ObjectivePreviewQuestions: Round1Question[] = [
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

const round1EssayPreviewQuestions: Round1Question[] = [
  createEssayQuestion({
    id: "r1e-01",
    topic: "Fintech fundamentals",
    prompt: createText(
      "In no more than 200 words, explain how a student-focused fintech product could create trust from the first week of use.",
      "Trong tối đa 200 từ, hãy giải thích một sản phẩm fintech dành cho sinh viên có thể tạo niềm tin ngay từ tuần sử dụng đầu tiên như thế nào.",
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
      "In no more than 200 words, propose one product idea that reduces payment anxiety for students and explain why it matters.",
      "Trong tối đa 200 từ, hãy đề xuất một ý tưởng sản phẩm giúp giảm lo lắng khi thanh toán của sinh viên và giải thích vì sao nó quan trọng.",
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
      "In no more than 200 words, explain how you would verify that a finance pain point is strong enough to build for students.",
      "Trong tối đa 200 từ, hãy giải thích bạn sẽ kiểm chứng thế nào để biết một pain point tài chính đủ mạnh để xây cho sinh viên.",
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
      "In no more than 200 words, describe the minimum data you would collect to evaluate a new student budgeting feature responsibly.",
      "Trong tối đa 200 từ, hãy mô tả bộ dữ liệu tối thiểu bạn sẽ thu thập để đánh giá một tính năng quản lý chi tiêu mới cho sinh viên một cách có trách nhiệm.",
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
      "In no more than 200 words, explain how a student fintech team can balance friction and safety in an early product flow.",
      "Trong tối đa 200 từ, hãy giải thích một đội fintech sinh viên có thể cân bằng giữa ma sát và an toàn trong luồng sản phẩm ban đầu như thế nào.",
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
      "In no more than 200 words, explain how you would prioritize one student segment for the first growth cycle of a fintech product.",
      "Trong tối đa 200 từ, hãy giải thích bạn sẽ ưu tiên một phân khúc sinh viên như thế nào cho chu kỳ tăng trưởng đầu tiên của một sản phẩm fintech.",
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

export const round1TestBanks: Round1TestBank[] = [
  {
    id: "bank-2026-official-a",
    bankType: "objective",
    title: {
      en: "Round 1 objective bank A",
      vi: "Ngân hàng câu hỏi khách quan Vòng 1 A",
    },
    description: {
      en: "Primary official bank for the 36 objective questions in each paper. The system randomizes 6 questions per topic across 6 topics with a 2 easy / 2 medium / 2 hard mix.",
      vi: "Ngân hàng chính thức cho 36 câu hỏi khách quan trong mỗi đề. Hệ thống rút ngẫu nhiên 6 câu trên mỗi chủ đề trong 6 chủ đề, theo cơ cấu 2 dễ / 2 trung bình / 2 khó.",
    },
    status: "active",
    questionPoolSize: 100,
    questionsPerAttempt: 36,
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
      en: "Round 1 essay bank A",
      vi: "Ngân hàng câu hỏi tự luận Vòng 1 A",
    },
    description: {
      en: "Separate essay bank used for the last 2 questions in each paper. The system randomizes 2 essay prompts from a 30-question pool, with a 200-word limit for each response.",
      vi: "Ngân hàng tự luận tách riêng dùng cho 2 câu cuối của mỗi đề. Hệ thống rút ngẫu nhiên 2 câu tự luận từ một kho 30 câu, với giới hạn 200 từ cho mỗi câu trả lời.",
    },
    status: "active",
    questionPoolSize: 30,
    questionsPerAttempt: 2,
    shuffleQuestions: true,
    shuffleOptions: false,
    durationMinutes: 60,
    wordLimit: 200,
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
