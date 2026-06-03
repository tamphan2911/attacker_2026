export interface AdminRound3SubmissionRow {
  submissionId: string;
  teamId: string;
  teamName: string;
  teamTag: string;
  round2Bracket?: "finalist" | "emerging";
  finalScore?: number;
  finalScoreUpdatedAt?: string;
  round2Score?: number;
  scoreDifference?: number;
  emergingScoreSource?: "human" | "gpt" | "none";
  emergingScoredAt?: string;
  finalRank?: number;
  title: string;
  version: number;
  isLatest: "valid latest" | "history only";
  resourceLabel: string;
  resourceUrl?: string;
  resourceSource: "upload" | "external";
  resourceSizeBytes?: number;
  submittedAt: string;
  submittedByUserId: string;
  submittedByName: string;
  submittedByLoginId: string;
}
