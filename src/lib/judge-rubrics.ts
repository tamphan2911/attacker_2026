import type { LocalizedText } from "@/types/site";

export interface JudgeRubricCriterion {
  id: string;
  label: LocalizedText;
  description: LocalizedText;
  maxScore: number;
}

export const ROUND2_REPORT_RUBRIC: JudgeRubricCriterion[] = [
  {
    id: "problem-insight",
    label: {
      en: "Problem and customer insight",
      vi: "Vấn đề và insight khách hàng",
    },
    description: {
      en: "Clarity of the finance pain point, target users, and evidence behind the problem.",
      vi: "Mức độ rõ ràng của vấn đề tài chính, nhóm người dùng mục tiêu và bằng chứng hỗ trợ.",
    },
    maxScore: 20,
  },
  {
    id: "solution-fit",
    label: {
      en: "Solution and fintech fit",
      vi: "Giải pháp và độ phù hợp fintech",
    },
    description: {
      en: "How well the proposed product solves the pain point and fits the fintech context.",
      vi: "Mức độ giải pháp xử lý pain point và phù hợp với bối cảnh fintech.",
    },
    maxScore: 20,
  },
  {
    id: "market-model",
    label: {
      en: "Market and business model",
      vi: "Thị trường và mô hình kinh doanh",
    },
    description: {
      en: "Quality of market sizing, go-to-market logic, monetization, and competitive thinking.",
      vi: "Chất lượng phân tích thị trường, hướng tiếp cận, mô hình doanh thu và tư duy cạnh tranh.",
    },
    maxScore: 20,
  },
  {
    id: "execution-plan",
    label: {
      en: "Feasibility and execution plan",
      vi: "Tính khả thi và kế hoạch triển khai",
    },
    description: {
      en: "Practicality of the roadmap, resources, risks, and next validation steps.",
      vi: "Tính thực tế của lộ trình, nguồn lực, rủi ro và các bước kiểm chứng tiếp theo.",
    },
    maxScore: 20,
  },
  {
    id: "report-quality",
    label: {
      en: "Report clarity and evidence",
      vi: "Độ rõ ràng và bằng chứng trong báo cáo",
    },
    description: {
      en: "Structure, writing clarity, data use, visuals, and strength of supporting evidence.",
      vi: "Cấu trúc, cách trình bày, sử dụng dữ liệu, hình ảnh và độ thuyết phục của bằng chứng.",
    },
    maxScore: 20,
  },
];

export function getRubricMaxScore(rubric: JudgeRubricCriterion[]) {
  return rubric.reduce((total, criterion) => total + criterion.maxScore, 0);
}
