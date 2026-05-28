import type { LocalizedText } from "@/types/site";

export interface JudgeRubricCriterion {
  id: string;
  label: LocalizedText;
  description: LocalizedText;
  maxScore: number;
  levels: Array<{
    label: LocalizedText;
    range: string;
    guide: LocalizedText;
  }>;
}

export const ROUND2_REPORT_RUBRIC: JudgeRubricCriterion[] = [
  {
    id: "idea-description",
    label: {
      en: "Idea description",
      vi: "Mô tả ý tưởng",
    },
    description: {
      en: "Clarity, direction, problem value, and social or financial impact of the idea.",
      vi: "Độ rõ ràng, đúng hướng, giá trị vấn đề và tác động xã hội/tài chính của ý tưởng.",
    },
    maxScore: 15,
    levels: [
      {
        label: { en: "Weak", vi: "Yếu" },
        range: "0-3.75",
        guide: {
          en: "The idea is unclear, off-direction, or solves a problem that is not worth solving.",
          vi: "Ý tưởng không rõ, sai hướng, vấn đề không đáng giải quyết.",
        },
      },
      {
        label: { en: "Average", vi: "Trung bình" },
        range: "3.75-7.5",
        guide: {
          en: "The idea is generic and mentions a problem, but the problem is not prominent.",
          vi: "Ý tưởng chung chung, có đề cập vấn đề nhưng chưa nổi bật.",
        },
      },
      {
        label: { en: "Good", vi: "Khá" },
        range: "7.5-11.25",
        guide: {
          en: "The idea is reasonable and analyzes social or financial impact.",
          vi: "Ý tưởng hợp lý, có phân tích tác động xã hội/tài chính.",
        },
      },
      {
        label: { en: "Excellent", vi: "Giỏi" },
        range: "11.25-15",
        guide: {
          en: "The idea is clear and logical, with clear impact for the industry or users.",
          vi: "Ý tưởng rõ ràng, logic, tác động rõ ràng đối với ngành/người dùng.",
        },
      },
    ],
  },
  {
    id: "innovation-creativity",
    label: {
      en: "Innovation and creativity",
      vi: "Tính đổi mới & sáng tạo",
    },
    description: {
      en: "Novelty, differentiation, technology use, and trend-setting potential.",
      vi: "Mức độ mới, khác biệt, ứng dụng công nghệ và khả năng dẫn đầu xu hướng.",
    },
    maxScore: 15,
    levels: [
      {
        label: { en: "Weak", vi: "Yếu" },
        range: "0-3.75",
        guide: {
          en: "Similar to old solutions, with no clear difference.",
          vi: "Giống các giải pháp cũ, không có khác biệt.",
        },
      },
      {
        label: { en: "Average", vi: "Trung bình" },
        range: "3.75-7.5",
        guide: {
          en: "Has a new idea, but applicability is not clear.",
          vi: "Có ý tưởng mới nhưng chưa có tính áp dụng.",
        },
      },
      {
        label: { en: "Good", vi: "Khá" },
        range: "7.5-11.25",
        guide: {
          en: "Shows innovation and small differentiation, with technology application.",
          vi: "Có đổi mới và khác biệt nhỏ, có áp dụng công nghệ.",
        },
      },
      {
        label: { en: "Excellent", vi: "Giỏi" },
        range: "11.25-15",
        guide: {
          en: "Breakthrough solution using new technology and leading trends.",
          vi: "Giải pháp đột phá, áp dụng công nghệ mới, tiên phong xu hướng.",
        },
      },
    ],
  },
  {
    id: "feasibility",
    label: {
      en: "Feasibility",
      vi: "Tính khả thi",
    },
    description: {
      en: "Implementation plan, evidence, prototype or demo, and practical viability.",
      vi: "Phương án triển khai, minh chứng, nguyên mẫu/demo và khả năng hiện thực.",
    },
    maxScore: 15,
    levels: [
      {
        label: { en: "Weak", vi: "Yếu" },
        range: "0-3.75",
        guide: {
          en: "No implementation approach; cannot be realized.",
          vi: "Không có phương án triển khai, không thể hiện thực.",
        },
      },
      {
        label: { en: "Average", vi: "Trung bình" },
        range: "3.75-7.5",
        guide: {
          en: "Implementation approach is generic and lacks supporting data.",
          vi: "Phương án chung chung, chưa có dữ liệu minh chứng.",
        },
      },
      {
        label: { en: "Good", vi: "Khá" },
        range: "7.5-11.25",
        guide: {
          en: "Has initial evidence and a feasible approach.",
          vi: "Có minh chứng ban đầu, phương án khả thi.",
        },
      },
      {
        label: { en: "Excellent", vi: "Giỏi" },
        range: "11.25-15",
        guide: {
          en: "Has prototype/demo and highly feasible details.",
          vi: "Đã có nguyên mẫu/demo, chi tiết khả thi cao.",
        },
      },
    ],
  },
  {
    id: "scale-growth-plan",
    label: {
      en: "Scaling and growth plan",
      vi: "Kế hoạch mở rộng & tăng trưởng",
    },
    description: {
      en: "Specificity and market-segment fit of the expansion roadmap.",
      vi: "Độ cụ thể của lộ trình mở rộng và sự gắn kết với phân khúc thị trường.",
    },
    maxScore: 15,
    levels: [
      {
        label: { en: "Weak", vi: "Yếu" },
        range: "0-3.75",
        guide: {
          en: "Not mentioned or very vague.",
          vi: "Không đề cập, hoặc mơ hồ.",
        },
      },
      {
        label: { en: "Average", vi: "Trung bình" },
        range: "3.75-7.5",
        guide: {
          en: "Mentioned, but no specific roadmap.",
          vi: "Có đề cập, chưa có lộ trình cụ thể.",
        },
      },
      {
        label: { en: "Good", vi: "Khá" },
        range: "7.5-11.25",
        guide: {
          en: "Has a scaling framework, but details are missing.",
          vi: "Đã lên khung mở rộng, nhưng thiếu chi tiết.",
        },
      },
      {
        label: { en: "Excellent", vi: "Giỏi" },
        range: "11.25-15",
        guide: {
          en: "Detailed plan connected to market segments.",
          vi: "Kế hoạch chi tiết, gắn với phân khúc thị trường.",
        },
      },
    ],
  },
  {
    id: "technology-application",
    label: {
      en: "Technology application",
      vi: "Ứng dụng công nghệ",
    },
    description: {
      en: "Relevance and centrality of technology in the proposed solution.",
      vi: "Mức độ phù hợp và vai trò cốt lõi của công nghệ trong giải pháp.",
    },
    maxScore: 10,
    levels: [
      {
        label: { en: "Weak", vi: "Yếu" },
        range: "0-2.5",
        guide: {
          en: "No technology application, or the technology is not suitable.",
          vi: "Không áp dụng công nghệ hoặc không phù hợp.",
        },
      },
      {
        label: { en: "Average", vi: "Trung bình" },
        range: "2.5-5",
        guide: {
          en: "Has technology, but it is not a main factor.",
          vi: "Có công nghệ nhưng không phải yếu tố chính.",
        },
      },
      {
        label: { en: "Good", vi: "Khá" },
        range: "5-7.5",
        guide: {
          en: "Technology supports the idea and is connected to it.",
          vi: "Công nghệ hỗ trợ ý tưởng, có liên kết.",
        },
      },
      {
        label: { en: "Excellent", vi: "Giỏi" },
        range: "7.5-10",
        guide: {
          en: "Technology is core and clearly implemented.",
          vi: "Công nghệ là yếu tố cốt lõi, triển khai rõ ràng.",
        },
      },
    ],
  },
  {
    id: "social-financial-impact",
    label: {
      en: "Social or financial impact",
      vi: "Tác động xã hội / tài chính",
    },
    description: {
      en: "Clarity, evidence, and significance of social and economic benefits.",
      vi: "Độ rõ ràng, minh chứng và ý nghĩa của lợi ích xã hội và kinh tế.",
    },
    maxScore: 10,
    levels: [
      {
        label: { en: "Weak", vi: "Yếu" },
        range: "0-2.5",
        guide: {
          en: "Low impact and unclear target audience.",
          vi: "Tác động thấp, chưa rõ đối tượng.",
        },
      },
      {
        label: { en: "Average", vi: "Trung bình" },
        range: "2.5-5",
        guide: {
          en: "Has impact, but lacks concrete evidence.",
          vi: "Có tác động nhưng chưa có minh chứng cụ thể.",
        },
      },
      {
        label: { en: "Good", vi: "Khá" },
        range: "5-7.5",
        guide: {
          en: "Meaningful impact for a specific user group.",
          vi: "Tác động có ý nghĩa với nhóm người dùng nhất định.",
        },
      },
      {
        label: { en: "Excellent", vi: "Giỏi" },
        range: "7.5-10",
        guide: {
          en: "Clear impact with notable social and economic benefits.",
          vi: "Tác động rõ ràng, lợi ích xã hội và kinh tế đáng kể.",
        },
      },
    ],
  },
  {
    id: "report-presentation-structure",
    label: {
      en: "Report presentation and structure",
      vi: "Trình bày & cấu trúc báo cáo",
    },
    description: {
      en: "Structure, clarity, illustrations, citations, and readability.",
      vi: "Cấu trúc, độ rõ ràng, minh họa, trích dẫn và khả năng đọc.",
    },
    maxScore: 10,
    levels: [
      {
        label: { en: "Weak", vi: "Yếu" },
        range: "0-2.5",
        guide: {
          en: "Structural errors and disorganized presentation.",
          vi: "Lỗi cấu trúc, trình bày lộn xộn.",
        },
      },
      {
        label: { en: "Average", vi: "Trung bình" },
        range: "2.5-5",
        guide: {
          en: "Presentation is not clear enough and lacks illustrations.",
          vi: "Trình bày chưa đủ rõ ràng, thiếu minh họa.",
        },
      },
      {
        label: { en: "Good", vi: "Khá" },
        range: "5-7.5",
        guide: {
          en: "Reasonable presentation with illustrations and mostly correct citations.",
          vi: "Trình bày hợp lý, có minh họa, trích dẫn gần đúng.",
        },
      },
      {
        label: { en: "Excellent", vi: "Giỏi" },
        range: "7.5-10",
        guide: {
          en: "Professional, visually polished, APA-standard, and easy to read.",
          vi: "Chuyên nghiệp, đẹp mắt, APA chuẩn, dễ đọc.",
        },
      },
    ],
  },
  {
    id: "persuasiveness-professionalism",
    label: {
      en: "Persuasiveness and professionalism",
      vi: "Tính thuyết phục & chuyên nghiệp",
    },
    description: {
      en: "Strength of evidence, logic, supporting data, and overall impression.",
      vi: "Sức mạnh dẫn chứng, logic lập luận, dữ liệu hỗ trợ và ấn tượng tổng thể.",
    },
    maxScore: 10,
    levels: [
      {
        label: { en: "Weak", vi: "Yếu" },
        range: "0-2.5",
        guide: {
          en: "Lacks evidence and has weak logic.",
          vi: "Thiếu dẫn chứng, logic yếu.",
        },
      },
      {
        label: { en: "Average", vi: "Trung bình" },
        range: "2.5-5",
        guide: {
          en: "Argumentation shows effort but is not persuasive yet.",
          vi: "Lập luận có cố gắng nhưng chưa thuyết phục.",
        },
      },
      {
        label: { en: "Good", vi: "Khá" },
        range: "5-7.5",
        guide: {
          en: "Logical argumentation with supporting data.",
          vi: "Lập luận có logic, có dữ liệu phụ trợ.",
        },
      },
      {
        label: { en: "Excellent", vi: "Giỏi" },
        range: "7.5-10",
        guide: {
          en: "Persuasive argumentation that creates a strong impression.",
          vi: "Lập luận thuyết phục, gây ấn tượng tốt.",
        },
      },
    ],
  },
  {
    id: "bonus",
    label: {
      en: "Bonus points",
      vi: "Điểm thưởng",
    },
    description: {
      en: "Optional bonus. Judges should clearly state the reason for bonus points in the note.",
      vi: "Điểm thưởng tùy chọn. Giám khảo cần nêu rõ lý do điểm thưởng trong ghi chú.",
    },
    maxScore: 5,
    levels: [
      {
        label: { en: "Guide", vi: "Hướng dẫn" },
        range: "0-5",
        guide: {
          en: "Clearly state the reason for any bonus points.",
          vi: "Nêu rõ lý do điểm thưởng.",
        },
      },
    ],
  },
];

export function getRubricMaxScore(rubric: JudgeRubricCriterion[]) {
  return rubric.reduce((total, criterion) => total + criterion.maxScore, 0);
}
