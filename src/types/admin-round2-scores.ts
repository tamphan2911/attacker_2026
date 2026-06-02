export type AdminRound2ScoreStatus = "not-scored" | "partially-scored" | "scored";
export type AdminRound2AiScoringStatus = "not-started" | "scoring" | "scored" | "failed" | "skipped-human";

export interface AdminRound2JudgeScoreRecord {
  judgeUserId: string;
  judgeName: string;
  judgeProfileId?: string;
  score?: number;
  scoredAt?: string;
}

export interface AdminRound2AiScoringRecord {
  status: AdminRound2AiScoringStatus;
  score?: number;
  model?: string;
  error?: string;
  scoredAt?: string;
}

export interface AdminRound2ScoreRow {
  submissionId: string;
  teamId: string;
  teamName: string;
  teamTag: string;
  title: string;
  version: number;
  resourceLabel: string;
  resourceUrl?: string;
  resourceSource: "external" | "upload";
  submittedAt: string;
  submittedByUserId: string;
  submittedByName: string;
  submittedByLoginId: string;
  status: AdminRound2ScoreStatus;
  averageScore?: number;
  judges: AdminRound2JudgeScoreRecord[];
  aiScoring: AdminRound2AiScoringRecord;
}
