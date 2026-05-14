import type { LocalizedText } from "@/types/site";

export type AdminRound2AssignmentStatus = "unassigned" | "partially-assigned" | "fully-assigned";

export interface AdminRound2AssignedJudgeRecord {
  judgeUserId: string;
  judgeName: string;
  judgeLoginId: string;
  judgeProfileId?: string;
  organization: LocalizedText | string;
  score?: number;
  scoredAt?: string;
}

export interface AdminRound2JudgeOption {
  judgeUserId: string;
  judgeName: string;
  judgeLoginId: string;
  judgeProfileId?: string;
  organization: LocalizedText | string;
}

export interface AdminRound2SubmissionRow {
  submissionId: string;
  teamId: string;
  teamName: string;
  teamTag: string;
  title: string;
  version: number;
  isLatest: "valid latest" | "history only";
  resourceLabel: string;
  resourceUrl?: string;
  resourceSource: "external" | "upload";
  submittedAt: string;
  submittedByUserId: string;
  submittedByName: string;
  submittedByLoginId: string;
  assignmentStatus: AdminRound2AssignmentStatus;
  assignedJudges: AdminRound2AssignedJudgeRecord[];
  canAssign: boolean;
  assignmentLocked: boolean;
}
