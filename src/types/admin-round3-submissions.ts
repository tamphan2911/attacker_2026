export interface AdminRound3SubmissionRow {
  submissionId: string;
  teamId: string;
  teamName: string;
  teamTag: string;
  finalScore?: number;
  finalScoreUpdatedAt?: string;
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
