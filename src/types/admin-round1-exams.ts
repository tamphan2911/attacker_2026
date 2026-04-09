import type { Round1PaperQuestion, Round1QuestionResponse } from "@/lib/round1";
import type { CompetitionStage } from "@/types/site";

export type AdminRound1ExamStatus = "not-initiated" | "in-progress" | "submitted";

export interface AdminRound1ExamListRow {
  userId: string;
  loginId: string;
  name: string;
  email: string;
  university: string;
  major: string;
  classYear: string;
  teamId: string;
  teamName: string;
  teamTag: string;
  teamStage: CompetitionStage;
  status: AdminRound1ExamStatus;
  answeredCount: number;
  totalQuestions: number;
  currentQuestionIndex?: number;
  startedAt?: string;
  deadlineAt?: string;
  submittedAt?: string;
  updatedAt?: string;
  objectiveScore?: number;
  essayScore?: number | null;
  totalScore?: number | null;
  detailAvailable: boolean;
}

export interface AdminRound1ExamQuestionRecord {
  id: string;
  paperOrder: number;
  prompt: Round1PaperQuestion["prompt"];
  topic: string;
  difficulty: Round1PaperQuestion["difficulty"];
  type: Round1PaperQuestion["type"];
  options?: Round1PaperQuestion["options"];
  pairingItems?: Round1PaperQuestion["pairingItems"];
  rubricNote?: Round1PaperQuestion["rubricNote"];
  placeholder?: Round1PaperQuestion["placeholder"];
  response?: Round1QuestionResponse;
  answered: boolean;
  autoScored?: boolean;
  isCorrect?: boolean;
  wordCount?: number;
  essayScore?: number | null;
}

export interface AdminRound1ExamDetail {
  submissionId?: string;
  userId: string;
  loginId: string;
  name: string;
  email: string;
  university: string;
  major: string;
  classYear: string;
  teamId: string;
  teamName: string;
  teamTag: string;
  teamStage: CompetitionStage;
  status: AdminRound1ExamStatus;
  bankTitle?: {
    en: string;
    vi: string;
  };
  startedAt?: string;
  deadlineAt?: string;
  submittedAt?: string;
  updatedAt?: string;
  currentQuestionIndex?: number;
  answeredCount: number;
  totalQuestions: number;
  objectiveScore?: number;
  essayScore?: number | null;
  totalScore?: number | null;
  rightCount?: number;
  wrongCount?: number;
  durationMinutes?: number;
  questions: AdminRound1ExamQuestionRecord[];
}
